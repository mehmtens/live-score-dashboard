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

// API-FOOTBALL (api-football.com / API-Sports) AYARLARI
const API_KEY = process.env.FOOTBALL_API_KEY;
const FOOTBALL_API_URL = 'https://v3.football.api-sports.io/fixtures';

if (!API_KEY) {
  console.error('❌ FOOTBALL_API_KEY tanımlı değil. .env dosyana ekle: FOOTBALL_API_KEY=xxxxx');
}

// API-Football tarih formatı için YYYY-MM-DD
function toDateParam(date) {
  return date.toISOString().split('T')[0];
}

// Bugünün maçlarını veya canlı maçları çekmek için tarih parametresi
function getTodayParam() {
  return toDateParam(new Date());
}

// Gerçek Maç Verilerini Çeken Fonksiyon (API-Football / Fixtures)
async function fetchRealMatches() {
  if (!API_KEY) {
    console.error('❌ FOOTBALL_API_KEY eksik olduğu için maç verisi çekilemiyor.');
    return;
  }

  try {
    const response = await axios.get(FOOTBALL_API_URL, {
      headers: { 'x-apisports-key': API_KEY },
      params: { date: getTodayParam() }, // O günün maçları
      timeout: 10000
    });

    // API-Football hata döndürürse (örn. limit aşımı, geçersiz key) burada yakalanır
    const apiErrors = response.data.errors;
    if (apiErrors && Object.keys(apiErrors).length > 0) {
      console.error('❌ API-Football Hatası:', apiErrors);
      return;
    }

    const rawMatches = response.data.response || [];

    // API-Football'dan gelen karmaşık veriyi frontend'in anlayacağı sade formata dönüştürüyoruz
    const formattedMatches = rawMatches.slice(0, 30).map((item) => {
      const m = item.fixture;
      const teams = item.teams;
      const goals = item.goals;
      const statusShort = m.status.short; // LIVE, FT, NS vb.

      let mappedStatus = 'UPCOMING';
      if (['1H', 'HT', '2H', 'ET', 'P', 'LIVE'].includes(statusShort)) {
        mappedStatus = 'LIVE';
      } else if (['FT', 'AET', 'PEN'].includes(statusShort)) {
        mappedStatus = 'FINISHED';
      }

      return {
        id: `match-${m.id}`,
        homeTeam: teams.home.name,
        awayTeam: teams.away.name,
        homeCrest: teams.home.logo,
        awayCrest: teams.away.logo,
        homeScore: goals.home ?? 0,
        awayScore: goals.away ?? 0,
        minute: m.status.elapsed ? `${m.status.elapsed}'` : statusShort,
        status: mappedStatus,
        competition: item.league.name,
      };
    });

    if (formattedMatches.length > 0) {
      // 1. Veriyi Redis'e Önbellekle
      await redis.set('matches:live', JSON.stringify(formattedMatches));

      // 2. Canlı Olarak WebSocket İle Frontend'e Fırlat
      io.emit('matchUpdate', formattedMatches);
      console.log(`⚽ ${formattedMatches.length} adet API-Football maç verisi güncellendi! [${new Date().toLocaleTimeString()}]`);
    } else {
      console.log('⚠️ Bugün için aktif oynanan veya planlanan maç bulunamadı.');
    }

  } catch (error) {
    console.error('❌ Dış API Veri Çekme Hatası:', error.response?.data || error.message);
  }
}

// Dış API limitlerini (Ücretsiz planda günlük 100 istek) aşmamak için
// süreyi örneğin 60 saniyeye çıkarmak mantıklı olabilir.
setInterval(fetchRealMatches, 60000);

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
