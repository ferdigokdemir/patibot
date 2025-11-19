# 🚀 PatiBot Kurulum Rehberi

## Hızlı Başlangıç (5 Dakika)

### 1. Bağımlılıkları Yükle

\`\`\`bash
cd /Users/ferdigokdemir/Desktop/patibot
npm install
\`\`\`

Bu komut yaklaşık 200MB indirme yapacak (Playwright browser'ları).

### 2. Gemini API Key Al (ÜCRETSİZ)

1. Şu adrese git: https://makersuite.google.com/app/apikey
2. "Create API Key" butonuna tıkla
3. API key'i kopyala

> **Not:** Artık Twitter login bilgilerine ihtiyaç yok! Bot, Nitter kullanarak tweet topluyor.

### 3. .env Dosyası Oluştur

\`\`\`bash
cp env.example .env
nano .env  # veya herhangi bir editör
\`\`\`

Sadece şu satırı değiştir:

\`\`\`env
GEMINI_API_KEY=buraya_api_keyini_yapistir
\`\`\`

Diğer ayarlar varsayılan olarak çalışır.

### 4. Veritabanını Başlat

\`\`\`bash
npm run init-db
\`\`\`

### 5. Test Çalıştırması

\`\`\`bash
npm start -- --once
\`\`\`

İlk çalıştırma biraz uzun sürebilir (Playwright browser başlatma).

## Beklenen Çıktı

\`\`\`
🎭 Playwright browser başlatılıyor...
✅ Browser hazır (Nitter kullanılıyor - giriş gerektirmiyor)
🔍 Nitter'da aranıyor...
📊 Toplanan: 50/50
✅ 23 tweet toplandı
🤖 Analiz ediliyor...
✅ 3 gerçek olay bulundu
📤 Rapor oluşturuluyor...
✅ Döngü tamamlandı
\`\`\`

## Sorun mu Yaşıyorsun?

### Chromium İndirilemedi

\`\`\`bash
npx playwright install chromium
\`\`\`

### Gemini API Hatası

- API key'i doğru mu?
- https://makersuite.google.com/ adresinden API key aktif mi kontrol et

### Twitter Açılmıyor

> **Not:** Bot artık Nitter kullanıyor, bu yüzden Twitter login sorunları yaşanmaz.

\`\`\`javascript
// src/services/twitterScraper.js dosyasında
headless: false  // Browser'ı görünür yap
\`\`\`

### Port Zaten Kullanımda

Bu bot port kullanmıyor, bu hata almanız normal değil.

## İleri Seviye Ayarlar

### Tarama Sıklığını Ayarla

\`\`\`.env
SCAN_INTERVAL_MINUTES=60  # 60 dakikada bir (önerilir)
\`\`\`

### Tweet Sayısını Azalt

\`\`\`.env
MAX_TWEETS_PER_SCAN=20  # Daha hızlı test
\`\`\`

### Debug Modu

\`\`\`.env
DEBUG=true
\`\`\`

## Sürekli Çalıştırma

### Arka Planda (PM2 ile)

\`\`\`bash
npm install -g pm2
pm2 start src/index.js --name patibot
pm2 logs patibot
pm2 stop patibot
\`\`\`

### Sistem Başlangıcında Otomatik

\`\`\`bash
pm2 startup
pm2 save
\`\`\`

## Güvenlik Kontrolleri

✅ .env dosyası .gitignore'da mı?
✅ API key'ler güvende mi?
✅ Rate limiting ayarlandı mı?

## Bakım

### Logları Temizle

\`\`\`bash
rm logs/*.log
\`\`\`

### Veritabanını Sıfırla

\`\`\`bash
rm data/patibot.db
npm run init-db
\`\`\`

### Güncellemeleri Çek

\`\`\`bash
git pull
npm install
\`\`\`

## Kullanıma Hazır! 🎉

Bot çalışıyor ve Twitter'dan otomatik olarak olay topluyor. Tespit edilen olaylar konsola yazdırılacak - manuel olarak paylaşabilirsin!

