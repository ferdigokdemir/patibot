# 📊 Haftalık Rapor Sistemi

PatiBot, toplanan verileri analiz ederek haftalık özet raporlar oluşturur.

## 🎯 Amaç

- İl bazında saldırı istatistikleri
- Trend analizi
- Yetkililere özet bilgi
- Toplumsal farkındalık

## 📝 Rapor İçeriği

### 1. Genel İstatistikler
- Toplam olay sayısı
- Etkilenen il sayısı
- Etkilenen ilçe sayısı
- Tarih aralığı

### 2. İl Bazında Dağılım
- Her il için olay sayısı
- İlçe detayları
- Sıralama (en çoktan aza)

### 3. En Riskli İller
- İlk 5 il
- İlgili belediye etiketleri
- Trend bilgisi

## 🚀 Kullanım

### Manuel Rapor Oluşturma

\`\`\`bash
# Varsayılan (7 gün)
npm run report

# Özel gün sayısı
npm run report -- --days 30

# Thread formatı (çoklu tweet)
npm run report -- --thread

# CSV export
npm run report -- --csv

# Tüm seçenekler
npm run report -- --days 14 --thread --csv
\`\`\`

### Otomatik Rapor

Bot, \`ENABLE_WEEKLY_REPORT=true\` olduğunda otomatik rapor oluşturur.

**Varsayılan:** Her Pazartesi 09:00

**.env ayarı:**
\`\`\`env
ENABLE_WEEKLY_REPORT=true
WEEKLY_REPORT_SCHEDULE=0 9 * * 1  # Cron formatı
\`\`\`

### Cron Schedule Örnekleri

\`\`\`
0 9 * * 1    # Her Pazartesi 09:00
0 18 * * 5   # Her Cuma 18:00
0 12 * * 0   # Her Pazar 12:00
0 9 1 * *    # Her ayın 1'i, 09:00
\`\`\`

## 📱 Çıktı Formatları

### 1. Tek Tweet (280 karakter)

Kısa ve özet format. Doğrudan Twitter'da paylaşılabilir.

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

### 2. Thread (Çoklu Tweet)

Daha detaylı bilgi için thread formatı:

**Tweet 1:** Özet ve toplam istatistikler
**Tweet 2:** İl listesi (1-10)
**Tweet 3:** İl listesi (11-20) [varsa]
**Tweet 4:** En çok etkilenen iller + etiketler
**Tweet 5:** Çağrı ve aksiyon önerileri

### 3. Console Raporu

Detaylı metin format, log dosyalarına kaydedilir:

\`\`\`
═══════════════════════════════════════════════════════════════════
   SON 7 GÜN SOKAK HAYVANI SALDIRI RAPORU
═══════════════════════════════════════════════════════════════════

📊 GENEL İSTATİSTİKLER:
───────────────────────────────────────────────────────────────────
   Toplam Olay Sayısı: 15
   Etkilenen İl Sayısı: 7
   Etkilenen İlçe Sayısı: 12
   Tarih Aralığı: 18 Kas - 25 Kas 2025

📍 İL BAZINDA DAĞILIM:
───────────────────────────────────────────────────────────────────
    1. İstanbul              : 5 olay
       İlçeler: Kadıköy, Beşiktaş, Üsküdar
    2. Ankara                : 3 olay
       İlçeler: Çankaya, Keçiören
    ...

⚠️  EN RİSKLİ 5 İL:
───────────────────────────────────────────────────────────────────
   1. İstanbul - 5 olay
      Yetkili: @istanbulbld, @TC_Icisleri
   ...
\`\`\`

### 4. CSV Export

Excel'de analiz için:

\`\`\`csv
Sıra,İl,Olay Sayısı,İlçeler,İlk Olay,Son Olay
1,İstanbul,5,"Kadıköy;Beşiktaş;Üsküdar",2025-11-18,2025-11-25
2,Ankara,3,"Çankaya;Keçiören",2025-11-19,2025-11-24
...
\`\`\`

## 📈 Örnek Kullanım Senaryoları

### Senaryo 1: Haftalık Twitter Paylaşımı

\`\`\`bash
# Her hafta rapor oluştur
npm run report

# Tweet içeriğini kopyala ve Twitter'da paylaş
\`\`\`

### Senaryo 2: Aylık Detaylı Analiz

\`\`\`bash
# 30 günlük rapor, thread + CSV
npm run report -- --days 30 --thread --csv

# CSV'yi Excel'de aç, grafikler oluştur
# Thread'i Twitter'da paylaş
\`\`\`

### Senaryo 3: Otomatik Pazartesi Raporu

\`\`\`.env
ENABLE_WEEKLY_REPORT=true
WEEKLY_REPORT_SCHEDULE=0 9 * * 1
\`\`\`

Bot her Pazartesi otomatik rapor oluşturacak.

## 🎨 Özelleştirme

### Rapor Günü Değiştirme

\`\`\`env
# Cuma akşamları
WEEKLY_REPORT_SCHEDULE=0 18 * * 5

# Pazar öğlen
WEEKLY_REPORT_SCHEDULE=0 12 * * 0
\`\`\`

### Rapor Periyodu Değiştirme

\`src/utils/weeklyReportScheduler.js\` dosyasında \`days\` parametresini değiştirin.

### Tweet Formatını Değiştirme

\`src/services/reportService.js\` dosyasında \`generateWeeklyReportTweet()\` fonksiyonunu düzenleyin.

## 💡 İpuçları

1. **İlk Hafta**: Yeterli veri olmayabilir, 2-3 hafta bekleyin
2. **Karakter Limiti**: Tweet 280'i geçerse otomatik kısaltılır
3. **Thread Kullanımı**: Detaylı paylaşım için thread tercih edin
4. **CSV Analizi**: Trend analizi için Excel kullanın
5. **Zamanlama**: En çok engagement için Pazartesi sabahı seçin

## 🔧 Sorun Giderme

### Rapor Oluşturulmuyor

**Sebep:** Veritabanında veri yok

**Çözüm:**
\`\`\`bash
# Veritabanını kontrol et
sqlite3 data/patibot.db "SELECT COUNT(*) FROM incidents;"

# Bot'u çalıştır ve veri topla
npm start -- --once
\`\`\`

### Otomatik Rapor Çalışmıyor

**Sebep:** ENABLE_WEEKLY_REPORT=false

**Çözüm:**
\`\`\`.env
ENABLE_WEEKLY_REPORT=true
\`\`\`

### CSV Kaydetmiyor

**Sebep:** data/ klasörü yok

**Çözüm:**
\`\`\`bash
mkdir -p data
\`\`\`

## 📊 Gelecek Geliştirmeler

- [ ] Grafik görselleştirme
- [ ] Trend analizi (artış/azalış)
- [ ] Bölge bazında gruplandırma
- [ ] Önceki hafta karşılaştırması
- [ ] E-posta bildirimi
- [ ] Dashboard web arayüzü
- [ ] Otomatik Twitter thread paylaşımı

## 🤝 Katkıda Bulunma

Rapor formatına yeni özellikler eklemek için:

1. \`src/services/reportService.js\` düzenle
2. Test et: \`npm run report\`
3. PR gönder

---

**Sorular?** Issue açın veya PR gönderin! 📬

