import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Rate limiting - dakikada max 10 request
   */
  async waitForRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Dakikada 10 request = her request arası min 6 saniye
    const minDelay = 6000;
    
    if (timeSinceLastRequest < minDelay) {
      const waitTime = minDelay - timeSinceLastRequest;
      console.log(`   ⏳ Rate limit için ${Math.ceil(waitTime / 1000)} saniye bekleniyor...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Retry mekanizması ile API çağrısı
   */
  async callWithRetry(apiCall, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.waitForRateLimit();
        return await apiCall();
      } catch (error) {
        if (error.message?.includes('429') || error.message?.includes('quota')) {
          // Rate limit hatası
          const waitMatch = error.message.match(/(\d+\.?\d*)s/);
          const waitTime = waitMatch ? parseFloat(waitMatch[1]) * 1000 + 2000 : 15000;
          
          if (attempt < maxRetries) {
            console.log(`   ⚠️  Rate limit (deneme ${attempt}/${maxRetries}). ${Math.ceil(waitTime / 1000)} saniye bekleniyor...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Tweet'in sokak hayvanı saldırısı ile ilgili olup olmadığını analiz et
   */
  async analyzeTweet(tweetText) {
    const prompt = `
Sen bir metin analiz asistanısın. Sana verilen tweet'in gerçek bir sokak hayvanı saldırısı olayı olup olmadığını analiz etmelisin.

ÖNEMLİ: SADECE TÜRKİYE'DEKİ OLAYLARI KABUL ET. Eğer tweet Türkiye dışında bir olaydan bahsediyorsa, is_relevant: false döndür.

Tweet:
"${tweetText}"

Lütfen aşağıdaki kriterlere göre analiz yap:

1. Bu tweet TÜRKİYE'deki gerçek bir sokak hayvanı saldırısı/tehlikesi hakkında mı?
2. Eğer başka bir ülkeden bahsediyorsa REDDET (is_relevant: false)
3. Sadece haber, yorum veya genel konuşma mı?
4. Şikayet/mizah/ironi içeriyor mu?
5. Eğer Türkiye'de gerçek bir olay ise, aşağıdaki bilgileri çıkar:
   - Konum (şehir, ilçe, mahalle, sokak)
   - Olay tarihi ve saati (varsa)
   - Hayvan türü ve sayısı
   - Olay açıklaması
   - Yaralı/mağdur bilgisi (varsa)
   - Olayın ciddiyeti (düşük/orta/yüksek)

Cevabını SADECE aşağıdaki JSON formatında ver, başka açıklama ekleme:

{
  "is_relevant": true/false,
  "is_real_incident": true/false,
  "confidence": 0-100 arası sayı,
  "reason": "kısa açıklama",
  "incident_details": {
    "location": "konum bilgisi veya null",
    "city": "şehir veya null",
    "district": "ilçe veya null",
    "incident_date": "tarih veya null",
    "animal_type": "köpek/kedi/diğer veya null",
    "animal_count": sayı veya null,
    "description": "olay açıklaması veya null",
    "victim_info": "yaralı bilgisi veya null",
    "severity": "low/medium/high veya null"
  }
}
`;

    try {
      const result = await this.callWithRetry(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();
      
      // JSON'ı parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
      }
      
      throw new Error('JSON formatında cevap alınamadı');
      
    } catch (error) {
      console.error('❌ Gemini analiz hatası:', error);
      // Fallback - analiz edilemedi
      return {
        is_relevant: false,
        is_real_incident: false,
        confidence: 0,
        reason: 'Analiz hatası: ' + error.message,
        incident_details: null
      };
    }
  }

  /**
   * Olay için CİMER şikayet metni oluştur
   */
  async generateCimerReport(incidentData) {
    const prompt = `
Sen bir CİMER şikayet metni oluşturan asistanısın. Aşağıdaki olay bilgisine göre profesyonel bir CİMER şikayeti hazırla.

Olay Bilgileri:
- Konum: ${incidentData.location || 'Belirtilmemiş'}
- Şehir/İlçe: ${incidentData.city || 'Belirtilmemiş'} / ${incidentData.district || 'Belirtilmemiş'}
- Tarih: ${incidentData.incident_date || 'Belirtilmemiş'}
- Hayvan Türü: ${incidentData.animal_type || 'Belirtilmemiş'}
- Açıklama: ${incidentData.description}

Lütfen aşağıdaki formatta bir CİMER şikayeti hazırla:

{
  "baslik": "Kısa ve öz başlık (max 100 karakter)",
  "kategori": "İlgili bakanlık/kurum",
  "aciklama": "Detaylı şikayet metni (profesyonel, resmi dil, talep içeren)"
}

NOT: Açıklama kısmı şunları içermeli:
1. Saygılı giriş
2. Olay detayı
3. Konum ve tarih bilgisi
4. Talep edilen aksiyonlar (veteriner kontrolü, koruma altına alma, vb.)
5. İyi dileklerle kapanış
`;

    try {
      const result = await this.callWithRetry(() => this.model.generateContent(prompt));
      const response = await result.response;
      const text = response.text();
      
      // JSON'ı parse et
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cimerReport = JSON.parse(jsonMatch[0]);
        return cimerReport;
      }
      
      throw new Error('JSON formatında cevap alınamadı');
      
    } catch (error) {
      console.error('❌ CİMER rapor oluşturma hatası:', error);
      // Fallback - basit format
      return {
        baslik: `Sokak Hayvanı Saldırı Tehlikesi - ${incidentData.city || 'Belirtilmemiş'}`,
        kategori: 'İçişleri Bakanlığı / Belediye',
        aciklama: `Sayın Yetkili,

${incidentData.location || 'Belirtilen konumda'} sokak hayvanları nedeniyle güvenlik sorunu yaşanmaktadır.

Olay Detayı: ${incidentData.description}

${incidentData.incident_date ? 'Tarih: ' + incidentData.incident_date : ''}

Gerekli tedbirlerin alınmasını talep ediyorum.

Saygılarımla.`
      };
    }
  }

  /**
   * Toplu tweet'leri analiz et ve önemlileri filtrele
   */
  async batchAnalyzeTweets(tweets) {
    const results = [];
    
    for (const tweet of tweets) {
      console.log(`🤖 Analiz ediliyor: ${tweet.text.substring(0, 50)}...`);
      
      try {
        const analysis = await this.analyzeTweet(tweet.text);
        
        results.push({
          tweet,
          analysis
        });
        
        // Rate limiting için kısa bekleme
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Tweet analiz hatası (${tweet.id}):`, error);
        results.push({
          tweet,
          analysis: {
            is_relevant: false,
            is_real_incident: false,
            confidence: 0,
            reason: 'Analiz hatası'
          }
        });
      }
    }
    
    return results;
  }
}

export default new GeminiService();

