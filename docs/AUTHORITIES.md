# 🏛️ Yetkili Etiketleme Sistemi

PatiBot, tespit edilen olayların şehir ve ilçesine göre otomatik olarak ilgili belediye ve devlet kurumlarını etiketler.

## 🎯 Nasıl Çalışır?

1. **Gemini AI** tweet'ten şehir ve ilçe bilgisini çıkarır
2. **Authorities Database** ilgili yetkilileri bulur
3. **Tweet Formatter** yetkilileri tweet'e ekler
4. **280 Karakter** limitine uygun şekilde formatlar

## 🗺️ Desteklenen Şehirler

### Büyükşehir Belediyeleri (16)

- **İstanbul** - @istanbulbld + 15 ilçe belediyesi
- **Ankara** - @Ankara_BB + 8 ilçe belediyesi
- **İzmir** - @izmirbld + 7 ilçe belediyesi
- **Bursa** - @bursabuyuksehir + 3 ilçe
- **Antalya** - @antalyabld + 3 ilçe
- **Adana** - @AdanaBB + 3 ilçe
- **Gaziantep** - @gaziantepbld + 2 ilçe
- **Konya** - @konyabuyuksehir + 3 ilçe
- **Mersin** - @MersinBB + 4 ilçe
- **Kayseri** - @kayseribld + 2 ilçe
- **Eskişehir** - @eskisehirbld + 2 ilçe
- **Diyarbakır** - @DiyarbakirBB
- **Samsun** - @SamsunBB + 2 ilçe
- **Denizli** - @DenizliBB
- **Şanlıurfa** - @SanliurfaBB
- **Trabzon** - @trabzonbld

### İl Belediyeleri (65+)

Büyükşehir olmayan tüm illerin belediye hesapları kayıtlı.

Örnekler:
- Balıkesir - @BalikesirBld
- Çanakkale - @canakkalebld
- Edirne - @EdirneBld
- Tekirdağ - @tekirdagbld
- Sakarya - @sakaryabld
- Kocaeli - @KocaeliBB
- Muğla - @MuglaBld
- Hatay - @HatayBB
- ... ve daha fazlası

### Devlet Kurumları (Her Zaman)

Her tweet'te otomatik olarak şu kurumlar etiketlenir:

- **İçişleri Bakanlığı** - @TC_Icisleri
- **CİMER** - @TC150Cimer

İsteğe bağlı:
- **Sağlık Bakanlığı** - @saglikbakanligi
- **Tarım ve Orman Bakanlığı** - @TCTarim

## 📊 Örnekler

### Örnek 1: İstanbul/Kadıköy

**Input:**
- Şehir: İstanbul
- İlçe: Kadıköy

**Output:**
```
@Kadikoy_Bld @istanbulbld @TC_Icisleri @TC150Cimer
```

**Açıklama:** Kadıköy Belediyesi, İstanbul Büyükşehir Belediyesi, İçişleri Bakanlığı, CİMER

---

### Örnek 2: Ankara/Çankaya

**Input:**
- Şehir: Ankara
- İlçe: Çankaya

**Output:**
```
@CankayaBel @Ankara_BB @TC_Icisleri @TC150Cimer
```

**Açıklama:** Çankaya Belediyesi, Ankara Büyükşehir Belediyesi, İçişleri Bakanlığı, CİMER

---

### Örnek 3: İzmir/Karşıyaka

**Input:**
- Şehir: İzmir
- İlçe: Karşıyaka

**Output:**
```
@karsiyakabld @izmirbld @TC_Icisleri @TC150Cimer
```

---

### Örnek 4: Balıkesir (İlçe bilinmiyor)

**Input:**
- Şehir: Balıkesir
- İlçe: -

**Output:**
```
@BalikesirBld @TC_Icisleri @TC150Cimer
```

**Açıklama:** Büyükşehir olmadığı için sadece il belediyesi

---

### Örnek 5: Şehir bilinmiyor

**Input:**
- Şehir: -
- İlçe: -

**Output:**
```
@TC_Icisleri @TC150Cimer
```

**Açıklama:** Sadece genel kurumlar

---

## 🧪 Test

Yetkili etiketleme sistemini test etmek için:

\`\`\`bash
npm run test-authorities
\`\`\`

Bu komut farklı şehir/ilçe kombinasyonlarını test eder ve hangi yetkililerin etiketleneceğini gösterir.

## 🔧 Yeni Belediye Ekleme

\`src/data/authorities.js\` dosyasını düzenleyin:

### Büyükşehir İlçesi Eklemek:

\`\`\`javascript
'istanbul': {
  name: 'İstanbul Büyükşehir Belediyesi',
  twitter: '@istanbulbld',
  districts: {
    'kadıköy': '@Kadikoy_Bld',
    'yeniilce': '@YeniIlceBld',  // ← Buraya ekle
    // ...
  }
}
\`\`\`

### İl Belediyesi Eklemek:

\`\`\`javascript
export const provincialMunicipalities = {
  'balıkesir': '@BalikesirBld',
  'yenisehir': '@YeniSehirBld',  // ← Buraya ekle
  // ...
};
\`\`\`

## 💡 Özellikler

### Türkçe Karakter Normalizasyonu

Sistem, Türkçe karakterleri otomatik normalize eder:

- İstanbul → istanbul
- Çankaya → cankaya
- Şişli → sisli
- İğdır → igdir

### 280 Karakter Limiti

Tweet 280 karakteri geçerse:
1. İlk 2 yetkili tutulur
2. Açıklama kısaltılır
3. Diğer elementler optimize edilir

### Hata Toleransı

- Şehir bulunamazsa → Genel kurumlar
- İlçe bulunamazsa → Sadece büyükşehir
- Belediye hesabı yoksa → Atlanır

## 📈 İstatistikler

Sistemde kayıtlı:
- ✅ 16 Büyükşehir Belediyesi
- ✅ 65+ İl Belediyesi
- ✅ 60+ İlçe Belediyesi
- ✅ 4 Devlet Kurumu
- **Toplam: 145+ Yetkili Hesap**

## 🔄 Güncelleme

Belediye Twitter hesapları değişebilir. Düzenli olarak kontrol edin:

1. Belediye resmi web sitesi
2. Twitter'da doğrulanmış hesap
3. Aktif kullanım kontrolü

## 🚀 Gelecek Geliştirmeler

- [ ] Muhtarlık hesapları
- [ ] Emniyet müdürlükleri
- [ ] Veteriner klinikleri
- [ ] Hayvan hakları dernekleri
- [ ] Bölgesel koordinasyon merkezleri

---

**Not:** Yetkili hesaplar düzenli güncellenir. PR'larınızı bekliyoruz! 🙏

