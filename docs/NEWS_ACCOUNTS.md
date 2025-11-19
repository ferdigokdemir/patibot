# 📰 Haber Hesapları Sistemi

PatiBot, rastgele tweet aramak yerine **güvenilir haber kanallarının** son tweet'lerini toplar.

## 🎯 Neden Haber Hesapları?

✅ **Güvenilir Kaynak**: Doğrulanmış haber kanalları
✅ **Filtrelenmiş İçerik**: Zaten editörlerden geçmiş
✅ **Yüksek Kalite**: Profesyonel habercilik
✅ **Zamanlı**: Gerçek zamanlı haberler
✅ **Az Gürültü**: Spam/troll yok

## 📋 Desteklenen Haber Kanalları

### Ulusal Haber Kanalları

| Kanal | Twitter | Açıklama |
|-------|---------|----------|
| TRT Haber | @trthaber | Devlet haber ajansı |
| CNN Türk | @cnnturk | Ulusal haber kanalı |
| NTV | @NTVhaber | Ulusal haber kanalı |
| Habertürk | @haberturk | Ulusal haber kanalı |
| Sözcü | @Sozcu | Günlük gazete |
| Cumhuriyet | @Cumhuriyet | Günlük gazete |
| Yeniçağ | @yenicaggazete | Günlük gazete |

### Yerel Haber Kanalları (İsteğe Bağlı)

| Bölge | Twitter | Açıklama |
|-------|---------|----------|
| İstanbul | @istanbulhaber34 | İstanbul haberleri |
| Ankara | @ankarahaber06 | Ankara haberleri |
| İzmir | @izmirhaber35 | İzmir haberleri |

## ⚙️ Konfigürasyon

\`.env\` dosyasında:

\`\`\`env
# Takip edilecek haber hesapları (@ olmadan)
NEWS_ACCOUNTS=trthaber,cnnturk,NTVhaber,haberturk,Sozcu,Cumhuriyet

# Her hesaptan kaç tweet
MAX_TWEETS_PER_ACCOUNT=20

# Toplam maksimum
TOTAL_MAX_TWEETS=100
\`\`\`

## 🔄 Nasıl Çalışır?

1. **Bot her hesabı sırayla ziyaret eder**
   ```
   @trthaber → Son 20 tweet
   @cnnturk → Son 20 tweet
   @NTVhaber → Son 20 tweet
   ...
   ```

2. **Retweet'leri atlar**
   - Sadece orijinal içerik
   - Habercilik standartları

3. **Duplicate kontrolü**
   - Aynı tweet birden fazla hesaptan gelirse tek kayıt

4. **AI filtresi**
   - Sadece sokak hayvanı saldırısı ile ilgili olanlar

## 📊 Örnek Çıktı

\`\`\`
🔍 1. ADIM: Tweet toplama başlıyor...
📰 7 haber hesabından tweet toplanıyor...
   Hesaplar: @trthaber, @cnnturk, @NTVhaber, @haberturk, @Sozcu, @Cumhuriyet, @yenicaggazete

📡 @trthaber hesabı taranıyor...
✅ @trthaber: 20 tweet toplandı

📡 @cnnturk hesabı taranıyor...
✅ @cnnturk: 18 tweet toplandı

...

📊 Toplam 125 benzersiz tweet toplandı
✅ 50 yeni tweet toplandı
\`\`\`

## 🎛️ Özelleştirme

### Yeni Hesap Eklemek

\`\`\`env
NEWS_ACCOUNTS=trthaber,cnnturk,yenihesap,digerhesap
\`\`\`

### Hesap Başına Tweet Sayısı

\`\`\`env
MAX_TWEETS_PER_ACCOUNT=30  # 30'a çıkar
\`\`\`

### Toplam Limit

\`\`\`env
TOTAL_MAX_TWEETS=200  # Daha fazla tweet
\`\`\`

## 💡 İpuçları

### 1. Doğru Hesapları Seçin
- Güvenilir kaynaklardan
- Aktif hesaplar
- Yerel haberlere odaklanmış

### 2. Makul Limitler
- Her hesap için 10-30 tweet yeterli
- Toplam 50-150 tweet optimal
- Rate limiting için 2 sn bekleyin

### 3. Düzenli Güncelleyin
- Hesaplar kapanabilir
- Yenilerini ekleyin
- Çalışmayan hesapları çıkarın

## 🔧 Sorun Giderme

### Hesap Bulunamıyor

**Sebep:** Hesap adı yanlış veya hesap kapanmış

**Çözüm:**
\`\`\`bash
# Nitter'da kontrol et
https://nitter.net/trthaber
\`\`\`

### Hiç Tweet Gelmiyor

**Sebep:** Hesap son zamanlarda tweet atmamış

**Çözüm:**
- Daha aktif hesaplar ekleyin
- MAX_TWEETS_PER_ACCOUNT artırın

### Çok Yavaş

**Sebep:** Çok fazla hesap var

**Çözüm:**
- Hesap sayısını azaltın (5-10 optimal)
- En önemli hesapları tutun

## 📈 Gelecek Geliştirmeler

- [ ] Hesap sağlık kontrolü (aktif mi?)
- [ ] Otomatik hesap keşfi
- [ ] Kategori bazlı hesap grupları
- [ ] Bölgesel haber filtreleme
- [ ] Hesap öncelik sıralaması
- [ ] Paralel hesap tarama

## 🤝 Öneriler

Başka hangi haber kanalları eklensin?

1. Issue açın
2. Hesap adını (@username) belirtin
3. Güvenilirliğini açıklayın
4. PR gönderin

---

**Not:** Haber hesaplarının güncel ve aktif olduğundan emin olun. İnaktif hesaplar otomatik atlanır.

