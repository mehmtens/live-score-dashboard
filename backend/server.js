require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const Redis = require('ioredis');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Frontend'in adresini .env'den oku (Vercel/Netlify'a deploy ettiğinde
// buraya gerçek domain'i yazacaksın). Ayarlanmazsa geliştirme için '*' kalır.
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

// Socket.io Ayarları
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Redis Bağlantısı
// Yerelde çalışırken REDIS_URL tanımlı değilse localhost'a bağlanır.
// Deploy ederken Upstash/Redis Cloud gibi bir servisin verdiği
// "rediss://..." bağlantı adresini REDIS_URL olarak ayarlaman yeterli.
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL)
  : new Redis({ host: '127.0.0.1', port: 6379 });

redis.on('connect', () => console.log('🔴 Redis Bağlantısı Başarılı!'));
redis.on('error', (err) => console.error('❌ Redis Hatası:', err));

// FOOTBALL-DATA.ORG API AYARLARI
// Key'i .env dosyasından okuyoruz — kodun içine yazılmamalı, özellikle
// bu repo'yu GitHub'a public olarak koyacaksan.
const API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_URL = 'https://api.football-data.org/v4/matches';

if (!API_KEY) {
  console.error('❌ FOOTBALL_API_KEY tanımlı değil. .env dosyana ekle: FOOTBALL_API_KEY=xxxxx');
}

// Bugünü değil, geçmiş birkaç günü ve önümüzdeki birkaç günü kapsayan bir
// aralık istiyoruz — API tarih parametresi verilmezse sadece "bugün"ü
// döndürüyor, bu yüzden geçmiş/bitmiş maçlar hiç görünmüyordu.
function toDateParam(date) {
  return date.toISOString().split('T')[0];
}

function getDateRange() {
  const today = new Date();

  const dateFrom = new Date(today);
  dateFrom.setDate(today.getDate() - 3);

  const dateTo = new Date(today);
  dateTo.setDate(today.getDate() + 2);

  return { dateFrom: toDateParam(dateFrom), dateTo: toDateParam(dateTo) };
}

// Gerçek Maç Verilerini Çeken Fonksiyon
async function fetchRealMatches() {
  try {
    const response = await axios.get(FOOTBALL_API_URL, {
      headers: { 'X-Auth-Token': API_KEY },
      params: getDateRange()
    });

    const rawMatches = response.data.matches || [];

    // API'den gelen karmaşık veriyi bizim frontend'in anlayacağı sade formata dönüştürüyoruz (Data Mapping)
    const formattedMatches = rawMatches.slice(0, 30).map((m) => ({
      id: `match-${m.id}`,
      homeTeam: m.homeTeam.shortName || m.homeTeam.name,
      awayTeam: m.awayTeam.shortName || m.awayTeam.name,
      homeCrest: m.homeTeam.crest || null,
      awayCrest: m.awayTeam.crest || null,
      homeScore: m.score.fullTime.home ?? 0,
      awayScore: m.score.fullTime.away ?? 0,
      minute: m.status === 'IN_PLAY' ? 'CANLI' : m.status,
      status: m.status === 'IN_PLAY' ? 'LIVE' : (m.status === 'FINISHED' ? 'FINISHED' : 'UPCOMING'),
      competition: m.competition.name,
    }));

    if (formattedMatches.length > 0) {
      // 1. Veriyi Redis'e Önbellekle
      await redis.set('matches:live', JSON.stringify(formattedMatches));
      
      // 2. Canlı Olarak WebSocket İle Frontend'e Fırlat
      io.emit('matchUpdate', formattedMatches);
      console.log(`⚽ ${formattedMatches.length} adet gerçek maç verisi güncellendi! [${new Date().toLocaleTimeString()}]`);
    } else {
      console.log('⚠️ Şu an aktif oynanan veya yakın zamanda maç bulunamadı.');
    }

  } catch (error) {
    console.error('❌ Dış API Veri Çekme Hatası:', error.message);
  }
}

// Dış API'yi yormamak ve limiti aşmamak için HER 20 SANİYEDE BİR gerçek veriyi çek
setInterval(fetchRealMatches, 20000);

// Sunucu ilk açıldığında hemen bir kere çalıştır
fetchRealMatches();

// Socket.io İstemci Bağlantıları
io.on('connection', async (socket) => {
  console.log(`⚡ Yeni İstemci Bağlandı: ${socket.id}`);

  // Yeni bağlanan kullanıcıya direkt Redis'teki hazır veriyi sun (API'ye istek atmadan!)
  const cachedMatches = await redis.get('matches:live');
  if (cachedMatches) {
    socket.emit('initialMatches', JSON.parse(cachedMatches));
  }

  socket.on('disconnect', () => {
    console.log(`❌ İstemci Ayrıldı: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP & WebSocket Sunucusu ${PORT} portunda çalışıyor.`);
});