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

// Frontend'in adresini .env'den oku
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || '*';

// Socket.io Ayarları
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGIN,
    methods: ['GET', 'POST']
  }
});

// Redis Bağlantısı
const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 })
  : new Redis({ host: '127.0.0.1', port: 6379, maxRetriesPerRequest: 3 });

redis.on('connect', () => console.log('🔴 Redis Bağlantısı Başarılı!'));
redis.on('error', (err) => console.error('❌ Redis Hatası:', err.message));

// BZZOIRO SPORTS DATA AYARLARI
const API_KEY = process.env.BZZOIRO_API_KEY;
const BZZOIRO_BASE_URL = 'https://sports.bzzoiro.com/api/v2/events';

if (!API_KEY) {
  console.error('❌ BZZOIRO_API_KEY tanımlı değil. .env dosyana ekle: BZZOIRO_API_KEY=xxxxx');
}

// YYYY-MM-DD formatında bugünün tarihi
function getTodayParam() {
  return new Date().toISOString().split('T')[0];
}

// Bzzoiro status değerlerini bizim frontend formatımıza çevirir
function mapStatus(status) {
  if (status === 'inprogress' || status === 'penalties') return 'LIVE';
  if (status === 'finished') return 'FINISHED';
  return 'UPCOMING'; // notstarted
}

// Dakika/durum metnini oluşturur (bitmiş maçlarda "current_minute" yanıltıcı olabileceği için ayrı ele alınıyor)
function formatMinute(mappedStatus, event) {
  if (mappedStatus === 'LIVE') {
    if (event.period === 'halftime') return 'İY';
    return event.current_minute ? `${event.current_minute}'` : 'CANLI';
  }
  if (mappedStatus === 'FINISHED') return 'MS';
  return 'Başlamadı';
}

// Gerçek Maç Verilerini Çeken Fonksiyon (Bzzoiro Sports Data)
async function fetchRealMatches() {
  if (!API_KEY) {
    console.error('❌ BZZOIRO_API_KEY eksik olduğu için maç verisi çekilemiyor.');
    return;
  }

  try {
    // Bugünün tüm maçları (canlı + planlanan + bitmiş)
    const response = await axios.get(BZZOIRO_BASE_URL + '/', {
      headers: { Authorization: `Token ${API_KEY}` },
      params: { date: getTodayParam(), limit: 100 },
      timeout: 10000
    });

    const rawMatches = response.data.results || response.data.events || [];

    const formattedMatches = rawMatches.slice(0, 50).map((event) => {
      const mappedStatus = mapStatus(event.status);

      return {
        id: `match-${event.id}`,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        homeCrest: event.home_team_id ? `https://sports.bzzoiro.com/img/football-team/${event.home_team_id}/` : null,
        awayCrest: event.away_team_id ? `https://sports.bzzoiro.com/img/football-team/${event.away_team_id}/` : null,
        homeScore: event.home_score ?? 0,
        awayScore: event.away_score ?? 0,
        minute: formatMinute(mappedStatus, event),
        status: mappedStatus,
        competition: event.league_name,
      };
    });

    if (formattedMatches.length > 0) {
      // 1. Veriyi Redis'e Önbellekle
      await redis.set('matches:live', JSON.stringify(formattedMatches));

      // 2. Canlı Olarak WebSocket İle Frontend'e Fırlat
      io.emit('matchUpdate', formattedMatches);
      console.log(`⚽ ${formattedMatches.length} adet Bzzoiro maç verisi güncellendi! [${new Date().toLocaleTimeString()}]`);
    } else {
      console.log('⚠️ Bugün için aktif oynanan veya planlanan maç bulunamadı.');
    }

  } catch (error) {
    console.error('❌ Dış API Veri Çekme Hatası:', error.response?.data || error.message);
  }
}

// Bzzoiro "rate limit yok" diyor ama yine de nazik davranıp 30 saniyede bir çekiyoruz
// (canlı skorlar için makul bir aralık, sunucuyu boğmuyoruz)
setInterval(fetchRealMatches, 30000);

// Sunucu ilk açıldığında hemen bir kere çalıştır
fetchRealMatches();

// Basit sağlık kontrolü (Render/Railway gibi servisler için faydalı)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Socket.io İstemci Bağlantıları
io.on('connection', async (socket) => {
  console.log(`⚡ Yeni İstemci Bağlandı: ${socket.id}`);

  try {
    const cachedMatches = await redis.get('matches:live');
    if (cachedMatches) {
      socket.emit('initialMatches', JSON.parse(cachedMatches));
    }
  } catch (err) {
    console.error('❌ Redis\'ten önbellek okunamadı:', err.message);
  }

  socket.on('disconnect', () => {
    console.log(`❌ İstemci Ayrıldı: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 HTTP & WebSocket Sunucusu ${PORT} portunda çalışıyor.`);
});