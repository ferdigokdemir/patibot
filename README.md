# 🐾 PatiBot

Sokak hayvanı saldırılarını Twitter'dan **otomatik ve ücretsiz** olarak toplayan, yapay zeka ile analiz eden ve CİMER şikayeti formatına dönüştüren akıllı bot.

## 🎯 Özellikler

- ✅ **Twitter Login + Scraping**: Playwright ile otomatik login ve tweet toplama
- 🤖 **Yapay Zeka Analizi**: Google Gemini AI ile tweet'leri analiz eder ve gerçek olayları tespit eder
- 📍 **Konum Tespiti**: Tweet'lerden şehir, ilçe ve konum bilgisi çıkarır
- 🏛️ **Otomatik Etiketleme**: İlgili belediye ve devlet kurumlarını otomatik etiketler
- 📊 **Haftalık Rapor**: İl bazında saldırı istatistikleri ve özet raporlar
- 📋 **CİMER Format**: Olaylar için otomatik CİMER şikayet metni oluşturur
- 📱 **Tweet Formatı**: Paylaşıma hazır tweet içeriği üretir
- 💾 **Veritabanı**: Tüm olayları ve analizleri SQLite'da saklar
- ⏰ **Zamanlayıcı**: Belirlenen aralıklarla otomatik çalışır
- 💰 **Tamamen Ücretsiz**: Twitter API yerine web scraping kullanır

## 💰 Maliyet

**Toplam: 0 TL/ay** 🎉

- ✅ Tweet Toplama: Ücretsiz (Twitter hesabı + Playwright)
- ✅ AI Analizi: Ücretsiz (Gemini free tier)
- ✅ Veritabanı: Ücretsiz (SQLite)
- ✅ Hosting: Ücretsiz (kendi bilgisayarınızda)

## 📋 Gereksinimler

- Node.js 18+ 
- Google Gemini API Key (ÜCRETSİZ)
- Twitter Hesabı (tweet toplamak için)

## 🚀 Kurulum

### 1. Projeyi İndirin

\`\`\`bash
git clone <repo-url>
cd patibot
\`\`\`

### 2. Bağımlılıkları Yükleyin

\`\`\`bash
npm install
\`\`\`

Bu komut Playwright'i ve browser'ları otomatik olarak yükleyecektir (~200MB).

### 3. Environment Variables Ayarlayın

\`env.example\` dosyasını \`.env\` olarak kopyalayın:

\`\`\`bash
cp env.example .env
\`\`\`

\`.env\` dosyasını düzenleyin ve aşağıdaki bilgileri doldurun:

#### Twitter Login Bilgileri

Normal Twitter hesabınızın bilgileri:

\`\`\`env
TWITTER_USERNAME=kullanici_adiniz
TWITTER_PASSWORD=sifreniz
TWITTER_EMAIL=emailiniz@example.com  # 2FA varsa gerekli
\`\`\`

**Not:** Bot sadece tweet okuyacak, hiçbir şey paylaşmayacak.

#### Google Gemini API Key (ZORUNLU - ÜCRETSİZ)

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. API Key oluşturun (ücretsiz)

\`\`\`env
GEMINI_API_KEY=your_gemini_api_key
\`\`\`

#### Bot Ayarları

\`\`\`env
# Takip edilecek haber hesapları (@ olmadan)
NEWS_ACCOUNTS=trthaber,cnnturk,NTVhaber,haberturk,Sozcu,Cumhuriyet

# Her hesaptan kaç tweet toplanacak
MAX_TWEETS_PER_ACCOUNT=20

# Toplam maksimum tweet sayısı
TOTAL_MAX_TWEETS=100

# Bot çalışma aralığı (dakika)
SCAN_INTERVAL_MINUTES=30

# Debug modu (tweet detaylarını gösterir)
DEBUG=true

# Browser görünür modda çalışsın mı? (debug için)
HEADLESS=false
\`\`\`

### 4. Veritabanını Başlatın

\`\`\`bash
npm run init-db
\`\`\`

## 💻 Kullanım

### Tek Seferlik Çalıştırma (Test için önerilir)

\`\`\`bash
npm start -- --once
\`\`\`

İlk çalıştırmada Playwright browser'ı açacak ve Twitter'dan tweet toplayacaktır.

### Sürekli Çalıştırma (Zamanlayıcı Modu)

Bot, belirlenen aralıklarla otomatik olarak çalışır:

\`\`\`bash
npm start
\`\`\`

### Development Modu (Auto-reload)

\`\`\`bash
npm run dev
\`\`\`

### Yetkili Etiketleme Testini Çalıştır

\`\`\`bash
npm run test-authorities
\`\`\`

Bu test, farklı şehir/ilçe kombinasyonları için hangi belediyelerin etiketleneceğini gösterir.

### Haftalık Rapor Oluştur

\`\`\`bash
# 7 günlük rapor
npm run report

# 30 günlük rapor
npm run report -- --days 30

# Thread formatında (çoklu tweet)
npm run report -- --thread

# CSV olarak export et
npm run report -- --csv

# Hepsini birden
npm run report -- --days 14 --thread --csv
\`\`\`

## 📊 Bot Çalışma Akışı

\`\`\`
1. 🎭 Nitter ile Bağlan
   └─> Çalışan Nitter instance bul
   └─> Headless browser başlat

2. 🔍 Haber Kanallarından Tweet Toplama
   └─> Her haber hesabını ziyaret et (TRT Haber, CNN Türk, vb.)
   └─> Son 20 tweet'i topla
   └─> Retweet'leri atla
   └─> Duplicate kontrolü yap
   └─> Veritabanına kaydet

3. 🤖 AI Analizi
   └─> Gemini AI ile tweet'leri analiz et
   └─> Gerçek olay mı kontrol et
   └─> Konum, tarih, detay bilgilerini çıkar
   └─> Güven skoru hesapla (%60+ olanları kaydet)

4. 📋 Rapor Oluştur
   └─> CİMER şikayet metni hazırla
   └─> Tweet formatında içerik oluştur
   └─> Konsola ve log'a yazdır

5. 📱 Manuel Paylaşım
   └─> Hazırlanan içeriği kopyala
   └─> Twitter'da manuel olarak paylaş
   └─> (veya otomatik paylaşım için Twitter API ekleyin)
\`\`\`

## 🗂️ Proje Yapısı

\`\`\`
patibot/
├── src/
│   ├── database/
│   │   ├── schema.js          # Veritabanı şeması
│   │   └── init.js            # DB başlatma
│   ├── services/
│   │   ├── twitterScraper.js  # Playwright scraping
│   │   ├── geminiService.js   # AI analizi
│   │   └── cimerService.js    # CİMER format
│   ├── utils/
│   │   └── logger.js          # Winston logger
│   ├── bot.js                 # Ana bot logic
│   └── index.js               # Entry point
├── data/
│   └── patibot.db            # SQLite veritabanı
├── logs/
│   ├── error.log             # Hata logları
│   └── combined.log          # Tüm loglar
├── .env                      # Environment variables
├── env.example               # Env şablonu
├── package.json
└── README.md
\`\`\`

## 📝 Örnek Çıktı

\`\`\`
🎭 Playwright browser başlatılıyor...
✅ Browser hazır

🔍 1. ADIM: Twitter'dan tweet toplama başlıyor...
🔍 Twitter'da aranıyor: "köpek saldırısı OR sokak hayvanı saldırısı"
📜 Tweet'ler toplanıyor...
  📊 Toplanan: 50/50
✅ 23 yeni tweet toplandı

🤖 2. ADIM: Tweet analizi başlıyor...
📊 23 tweet analiz edilecek...

🔎 Analiz: "Kadıköy'de köpek sürüsü saldırdı..."
✅ Gerçek olay tespit edildi! (Güven: %85)
💾 Olay #1 veritabanına kaydedildi

✅ Analiz tamamlandı. 3 gerçek olay bulundu.

📤 3. ADIM: Olay raporları oluşturuluyor...

📢 Olay #1 raporlanıyor...
📋 CİMER raporu oluşturuluyor...

🏛️  İlgili Yetkililer: @Kadikoy_Bld, @istanbulbld, @TC_Icisleri, @TC150Cimer

════════════════════════════════════════════════════════════
📱 TWITTER PAYLAŞIM İÇERİĞİ:
════════════════════════════════════════════════════════════
🚨 Sokak Hayvanı Saldırı Bildirimi

📍 İstanbul / Kadıköy
📅 19.11.2025 14:30

Fenerbahçe Parkı yakınında 5-6 köpek sürü halinde geziniyor...

🗺️ https://maps.google.com/?q=40.9833,29.0333

@Kadikoy_Bld @istanbulbld @TC_Icisleri @TC150Cimer

#SokakHayvanları #CİMER #PatiBot
════════════════════════════════════════════════════════════

👥 Etiketlenen Yetkililer: Kadıköy Belediyesi, İstanbul Büyükşehir 
   Belediyesi, İçişleri Bakanlığı, CİMER

═══════════════════════════════════════════════════════════════
                    CİMER ŞİKAYET FORMU
═══════════════════════════════════════════════════════════════
...
✅ Olay #1 raporu hazır - Manuel olarak paylaşabilirsiniz!

📊 İstatistikler:
🔍 Toplanan: 23
🤖 Analiz: 23  
🚨 Olay: 3
📤 Hazırlanan Rapor: 3

🔒 Browser kapatılıyor...
\`\`\`

## 🏛️ Yetkili Etiketleme Sistemi

Bot, tespit edilen olayların konumuna göre **otomatik olarak** ilgili belediye ve devlet kurumlarını etiketler!

### Desteklenen Yetkililer:

- ✅ **16 Büyükşehir Belediyesi** (İstanbul, Ankara, İzmir, vb.)
- ✅ **65+ İl Belediyesi** (Balıkesir, Çanakkale, Edirne, vb.)
- ✅ **60+ İlçe Belediyesi** (Kadıköy, Çankaya, Karşıyaka, vb.)
- ✅ **Devlet Kurumları** (İçişleri, CİMER, vb.)

### Nasıl Çalışır?

1. 🤖 **Gemini AI** tweet'ten şehir/ilçe çıkarır
2. 🗺️ **Authorities DB** ilgili yetkilileri bulur
3. 📱 **Tweet Formatter** yetkilileri ekler
4. ✅ **280 karakter** limitine uygun şekilde optimize eder

### Örnekler:

| Konum | Etiketlenenler |
|-------|----------------|
| İstanbul/Kadıköy | @Kadikoy_Bld @istanbulbld @TC_Icisleri @TC150Cimer |
| Ankara/Çankaya | @CankayaBel @Ankara_BB @TC_Icisleri @TC150Cimer |
| İzmir/Karşıyaka | @karsiyakabld @izmirbld @TC_Icisleri @TC150Cimer |
| Balıkesir | @BalikesirBld @TC_Icisleri @TC150Cimer |
| Bilinmiyor | @TC_Icisleri @TC150Cimer |

**Detaylı bilgi için:** [docs/AUTHORITIES.md](docs/AUTHORITIES.md)

**Test için:**
\`\`\`bash
npm run test-authorities
\`\`\`

## 📊 Haftalık Rapor Sistemi

Bot, veritabanındaki olayları analiz ederek haftalık özet raporlar oluşturur.

### Rapor İçeriği:

- ✅ İl bazında olay sayıları
- ✅ Toplam istatistikler
- ✅ En çok etkilenen iller
- ✅ Tarih aralığı
- ✅ İlgili yetkili etiketleri

### Örnek Rapor Tweet:

\`\`\`
📊 Son 7 Günlük Sokak Hayvanı Saldırı Raporu

📍 Toplam 15 olay tespit edildi:

İstanbul: 5 olay
Ankara: 3 olay
İzmir: 2 olay
Bursa: 2 olay
Antalya: 1 olay
Adana: 1 olay
Gaziantep: 1 olay

📅 18 Kas - 25 Kas 2025

@TC_Icisleri @TC150Cimer

#SokakHayvanları #PatiBot #HaftalıkRapor
\`\`\`

### Manuel Rapor Oluşturma:

\`\`\`bash
npm run report                    # 7 günlük
npm run report -- --days 30       # 30 günlük
npm run report -- --thread        # Thread formatı
npm run report -- --csv           # CSV export
\`\`\`

### Otomatik Haftalık Rapor:

Bot her **Pazartesi sabah 09:00**'da otomatik olarak haftalık rapor oluşturur.

Ayarlamak için \`.env\` dosyasında:

\`\`\`env
ENABLE_WEEKLY_REPORT=true
WEEKLY_REPORT_SCHEDULE=0 9 * * 1  # Pazartesi 09:00
\`\`\`

### Rapor Formatları:

1. **Tek Tweet** - Kısa özet (280 karakter)
2. **Thread** - Detaylı çoklu tweet
3. **Console** - Detaylı metin rapor
4. **CSV** - Excel için export

## ⚙️ Konfigürasyon

### Haber Hesapları (Önerilen)

Bot, belirli haber kanallarından tweet toplar. Bu daha güvenilir ve kaliteli sonuç verir.

\`.env\` dosyasında:

\`\`\`env
NEWS_ACCOUNTS=trthaber,cnnturk,NTVhaber,haberturk,Sozcu,Cumhuriyet
MAX_TWEETS_PER_ACCOUNT=20
TOTAL_MAX_TWEETS=100
\`\`\`

**Desteklenen Haber Kanalları:**
- TRT Haber (@trthaber)
- CNN Türk (@cnnturk)
- NTV (@NTVhaber)
- Habertürk (@haberturk)
- Sözcü (@Sozcu)
- Cumhuriyet (@Cumhuriyet)

**Detaylı bilgi:** [docs/NEWS_ACCOUNTS.md](docs/NEWS_ACCOUNTS.md)

### Tarama Aralığı

\`\`\`env
SCAN_INTERVAL_MINUTES=30  # 30 dakikada bir tara
\`\`\`

### Tweet Limiti

\`\`\`env
MAX_TWEETS_PER_SCAN=50  # Her taramada max 50 tweet
\`\`\`

## 🔒 Güvenlik ve Yasal Uyarılar

- ⚠️ **Web Scraping**: Twitter'ın Terms of Service'ine aykırı olabilir
- 🤖 **Bot Kullanımı**: Sorumlu ve etik kullanın
- 📊 **Rate Limiting**: Aşırı sık tarama yapmayın
- 🔑 **API Keys**: .env dosyasını paylaşmayın
- 💾 **Veri Saklama**: Kişisel verilere dikkat edin

**Öneriler:**
- İlk başta düşük frekansta test edin (örn: 60 dakika)
- MAX_TWEETS_PER_SCAN değerini düşük tutun (10-20)
- Headless: false yaparak browser'ı görüp test edin

## 🤔 Playwright vs Twitter API

| Özellik | Playwright | Twitter API |
|---------|-----------|-------------|
| **Maliyet** | ÜCRETSİZ | $100-5000/ay |
| **Kurulum** | Kolay | API key gerekli |
| **Limit** | Yok (rate limiting önerilen) | Sıkı limitler |
| **Yasal** | ToS riski var | Resmi |
| **Güvenilirlik** | Twitter güncellemelerinden etkilenebilir | Kararlı API |

## 🛠️ Sorun Giderme

### Twitter Sayfası Yüklenmiyor

\`\`\`env
# Browser'ı görünür modda çalıştırın (twitterScraper.js'de)
headless: false
\`\`\`

### Tweet Bulunamıyor

- Twitter arama sayfası değişmiş olabilir
- Selector'ları kontrol edin
- DEBUG=true yapıp logları inceleyin

### Gemini API Hatası

- API key'i kontrol edin
- [Google AI Studio](https://makersuite.google.com/) üzerinde quota kontrolü yapın
- Free tier günlük 60 request/dakika limitli

### Memory Leak

Uzun süre çalıştırmada memory leak olursa:

\`\`\`javascript
// bot.js'de her döngü sonunda browser'ı yeniden başlat
await twitterScraper.restart();
\`\`\`

## 🚀 İleriye Dönük Geliştirmeler

- [ ] Telegram bot entegrasyonu (kullanıcı bildirimleri)
- [ ] Otomatik tweet atma (Playwright ile login)
- [ ] Dashboard/Web arayüzü
- [ ] Email bildirimleri
- [ ] Görsel/medya analizi
- [ ] Konum doğrulama (reverse geocoding)
- [ ] Multi-language support

## 📞 Destek

Sorularınız için:
- Issue açın
- Pull request gönderin

---

**Not**: Bu bot, sokak hayvanı saldırılarının takibi ve yetkili kurumlara bildirilmesi amacıyla geliştirilmiştir. Lütfen sorumlu ve etik kullanın. Web scraping yaparken Twitter'ın kullanım şartlarına dikkat edin.

## 🎭 Playwright Detayları

Bot, Chromium browser kullanarak Twitter'ı otomatik olarak ziyaret eder ve tweet'leri toplar. Bu işlem:

1. **Headless mode**: Arka planda çalışır (görseli kapatılmış)
2. **User-Agent**: Normal kullanıcı gibi görünür
3. **Scroll**: Sayfayı scroll yaparak daha fazla tweet yükler
4. **Parse**: DOM'dan tweet içeriğini çıkarır

**Avantajlar:**
- Hiç API key gerekmez
- Limit yok (makul kullanımda)
- Ücretsiz

**Dezavantajlar:**
- Twitter değişikliklerinden etkilenebilir
- API'den biraz daha yavaş
- ToS riski var
