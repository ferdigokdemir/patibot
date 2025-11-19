import twitterScraper from './services/twitterScraper.js';
import geminiService from './services/geminiService.js';
import cimerService from './services/cimerService.js';
import { getRelevantAuthorities, getAuthoritiesText } from './data/authorities.js';
import { formatIncidentTweet } from './utils/formatTweet.js';
import {
  saveTweet,
  updateTweetAnalysis,
  saveIncident,
  updateIncident,
  getUnanalyzedTweets,
  getUnpostedIncidents,
  saveBotStats
} from './database/schema.js';
import logger from './utils/logger.js';

class PatiBotCore {
  constructor() {
    this.stats = {
      tweets_collected: 0,
      tweets_analyzed: 0,
      incidents_found: 0,
      tweets_posted: 0,
      errors: 0
    };
  }

  /**
   * 1. ADIM: Haber hesaplarından tweet toplama
   */
  async collectTweets() {
    try {
      console.log('\n🔍 1. ADIM: Tweet toplama başlıyor...');
      
      const newsAccounts = process.env.NEWS_ACCOUNTS 
        ? process.env.NEWS_ACCOUNTS.split(',').map(a => a.trim())
        : [];
      
      const maxTweetsPerAccount = parseInt(process.env.MAX_TWEETS_PER_ACCOUNT) || 20;
      const totalMaxTweets = parseInt(process.env.TOTAL_MAX_TWEETS) || 100;
      
      let allTweets = [];
      
      if (newsAccounts.length > 0) {
        console.log(`📰 ${newsAccounts.length} haber hesabından tweet toplanıyor (Nitter)...`);
        console.log(`   Hesaplar: ${newsAccounts.map(a => '@' + a).join(', ')}\n`);
        
        // Her haber hesabından tweet topla
        for (const account of newsAccounts) {
          try {
            console.log(`\n📡 @${account} hesabı taranıyor...`);
            const accountTweets = await twitterScraper.getUserTweets(account, maxTweetsPerAccount);
            allTweets = allTweets.concat(accountTweets);
            console.log(`✅ @${account}: ${accountTweets.length} tweet toplandı`);
            
            // Rate limiting - hesaplar arası bekleme
            await new Promise(resolve => setTimeout(resolve, 10000));
            
          } catch (error) {
            console.error(`❌ @${account} hatası: ${error.message}`);
            this.stats.errors++;
          }
        }
        
        // Duplicate'leri temizle
        const uniqueTweets = [];
        const seenIds = new Set();
        allTweets.forEach(tweet => {
          if (!seenIds.has(tweet.id)) {
            seenIds.add(tweet.id);
            uniqueTweets.push(tweet);
          }
        });
        
        allTweets = uniqueTweets.slice(0, totalMaxTweets);
        console.log(`\n📊 Toplam ${allTweets.length} benzersiz tweet toplandı`);
        
      } else {
        // Fallback: Anahtar kelime araması
        console.log('⚠️  NEWS_ACCOUNTS tanımlı değil.');
        console.log('💡 Lütfen .env dosyasına NEWS_ACCOUNTS ekleyin.');
        throw new Error('NEWS_ACCOUNTS tanımlanmamış');
      }
      
      const tweets = allTweets;
      
      // Debug modu - tweetleri göster
      if (process.env.DEBUG === 'true' && tweets.length > 0) {
        console.log('\n' + '═'.repeat(70));
        console.log('🐛 DEBUG: Toplanan Tweet\'ler');
        console.log('═'.repeat(70));
        tweets.forEach((tweet, index) => {
          console.log(`\n${index + 1}. Tweet (ID: ${tweet.id})`);
          console.log(`   👤 @${tweet.author_username} (${tweet.author_name})`);
          console.log(`   📅 ${tweet.created_at}`);
          console.log(`   📝 ${tweet.text.substring(0, 150)}${tweet.text.length > 150 ? '...' : ''}`);
          console.log(`   📊 ❤️ ${tweet.like_count} | 🔁 ${tweet.retweet_count} | 💬 ${tweet.reply_count}`);
          if (index < tweets.length - 1) {
            console.log('   ' + '─'.repeat(66));
          }
        });
        console.log('═'.repeat(70) + '\n');
      }
      
      // Veritabanına kaydet
      for (const tweet of tweets) {
        try {
          saveTweet(tweet);
          this.stats.tweets_collected++;
        } catch (error) {
          if (!error.message.includes('UNIQUE constraint')) {
            console.error('Tweet kaydetme hatası:', error);
            this.stats.errors++;
          }
        }
      }
      
      console.log(`✅ ${this.stats.tweets_collected} yeni tweet toplandı`);
      return tweets;
      
    } catch (error) {
      console.error('❌ Tweet toplama hatası:', error);
      logger.error('Tweet toplama hatası', { error });
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * 2. ADIM: Tweet'leri AI ile analiz etme
   */
  async analyzeTweets() {
    try {
      console.log('\n🤖 2. ADIM: Tweet analizi başlıyor...');
      
      const unanalyzedTweets = getUnanalyzedTweets(50);
      
      if (unanalyzedTweets.length === 0) {
        console.log('ℹ️  Analiz edilecek yeni tweet yok');
        return [];
      }
      
      console.log(`📊 ${unanalyzedTweets.length} yeni tweet analiz edilecek...`);
      
      const incidents = [];
      
      for (const tweet of unanalyzedTweets) {
        try {
          console.log(`\n🔎 Analiz: "${tweet.text.substring(0, 60)}..."`);
          
          const analysis = await geminiService.analyzeTweet(tweet.text);
          
          // Analiz sonucunu kaydet
          updateTweetAnalysis(
            tweet.tweet_id,
            analysis.is_relevant && analysis.is_real_incident,
            analysis
          );
          
          this.stats.tweets_analyzed++;
          
          // Debug modu - analiz sonucu
          if (process.env.DEBUG === 'true') {
            console.log(`   🤖 Analiz Sonucu:`);
            console.log(`      İlgili: ${analysis.is_relevant ? '✅' : '❌'}`);
            console.log(`      Gerçek Olay: ${analysis.is_real_incident ? '✅' : '❌'}`);
            console.log(`      Güven: %${analysis.confidence}`);
            console.log(`      Sebep: ${analysis.reason}`);
            if (analysis.incident_details) {
              console.log(`      Konum: ${analysis.incident_details.city || 'Bilinmiyor'} / ${analysis.incident_details.district || 'Bilinmiyor'}`);
            }
          }
          
          // Eğer gerçek bir olay ise, incident olarak kaydet
          if (analysis.is_relevant && analysis.is_real_incident && analysis.confidence >= 60) {
            console.log(`✅ Gerçek olay tespit edildi! (Güven: %${analysis.confidence})`);
            
            const incidentData = {
              tweet_id: tweet.tweet_id,
              location: analysis.incident_details?.location || tweet.text.substring(0, 200),
              city: analysis.incident_details?.city,
              district: analysis.incident_details?.district,
              latitude: null,
              longitude: null,
              incident_date: analysis.incident_details?.incident_date || tweet.created_at,
              description: analysis.incident_details?.description || tweet.text,
              severity: analysis.incident_details?.severity,
              animal_type: analysis.incident_details?.animal_type,
              animal_count: analysis.incident_details?.animal_count,
              victim_info: analysis.incident_details?.victim_info
            };
            
            const result = saveIncident(incidentData);
            incidentData.id = result.lastInsertRowid;
            
            incidents.push(incidentData);
            this.stats.incidents_found++;
            
            console.log(`💾 Olay #${incidentData.id} veritabanına kaydedildi`);
          } else {
            console.log(`⏭️  İlgisiz veya düşük güven: ${analysis.reason}`);
          }
          
          // Rate limiting - Gemini için daha uzun bekleme
          await new Promise(resolve => setTimeout(resolve, 7000));
          
        } catch (error) {
          console.error(`❌ Tweet analiz hatası (${tweet.tweet_id}):`, error);
          logger.error('Tweet analiz hatası', { tweet_id: tweet.tweet_id, error });
          this.stats.errors++;
        }
      }
      
      console.log(`\n✅ Analiz tamamlandı. ${incidents.length} gerçek olay bulundu.`);
      return incidents;
      
    } catch (error) {
      console.error('❌ Analiz süreci hatası:', error);
      logger.error('Analiz süreci hatası', { error });
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * 3. ADIM: Olayları formatla ve CİMER raporu oluştur
   */
  async postIncidents() {
    try {
      console.log('\n📤 3. ADIM: Olay raporları oluşturuluyor...');
      
      const unpostedIncidents = getUnpostedIncidents();
      
      if (unpostedIncidents.length === 0) {
        console.log('ℹ️  Raporlanacak olay yok');
        return;
      }
      
      console.log(`📋 ${unpostedIncidents.length} olay için rapor oluşturulacak...`);
      
      for (const incident of unpostedIncidents) {
        try {
          console.log(`\n📢 Olay #${incident.id} raporlanıyor...`);
          
          // Kaynak tweet URL'sini hazırla
          const sourceTweetUrl = incident.source_tweet_id && incident.author_username 
            ? `https://twitter.com/${incident.author_username}/status/${incident.source_tweet_id}`
            : null;
          
          // 1. CİMER raporu oluştur
          console.log('📋 CİMER raporu oluşturuluyor...');
          const cimerPackage = await cimerService.generateFullCimerPackage(incident, sourceTweetUrl);
          
          // 2. İlgili yetkilileri bul
          const authorities = getRelevantAuthorities(incident.city, incident.district);
          const authoritiesText = getAuthoritiesText(incident.city, incident.district);
          
          console.log(`\n🏛️  İlgili Yetkililer: ${authorities.join(', ')}`);
          
          // 3. Twitter tweet formatı oluştur
          const tweetContent = formatIncidentTweet(incident, authorities, sourceTweetUrl);
          
          // Raporları göster
          console.log('\n' + '═'.repeat(60));
          console.log('📱 TWITTER PAYLAŞIM İÇERİĞİ:');
          console.log('═'.repeat(60));
          console.log(tweetContent);
          console.log('═'.repeat(60));
          console.log(`\n👥 Etiketlenen Yetkililer: ${authoritiesText}`);
          console.log('\n' + cimerPackage.formatted_text);
          
          // Log'a kaydet
          logger.info('Olay raporu oluşturuldu', { 
            incident_id: incident.id, 
            tweet_content: tweetContent,
            cimer_report: cimerPackage.report 
          });
          
          // Incident'ı güncelle
          updateIncident(incident.id, {
            twitter_posted: 1, // Manuel paylaşım için hazır
            cimer_status: 'generated'
          });
          
          this.stats.tweets_posted++;
          console.log(`\n✅ Olay #${incident.id} raporu hazır - Manuel olarak paylaşabilirsiniz!`);
          console.log(`💡 Tweet içeriği yukarıda gösterildi.\n`);
          
          // Rate limiting - AI için
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Rapor oluşturma hatası (${incident.id}):`, error);
          logger.error('Rapor oluşturma hatası', { incident_id: incident.id, error });
          this.stats.errors++;
        }
      }
      
      console.log(`\n✅ Raporlama tamamlandı. ${this.stats.tweets_posted} olay raporu hazırlandı.`);
      console.log('💡 Tweet içeriklerini yukarıda bulabilir ve manuel olarak paylaşabilirsiniz.\n');
      
    } catch (error) {
      console.error('❌ Raporlama süreci hatası:', error);
      logger.error('Raporlama süreci hatası', { error });
      this.stats.errors++;
      throw error;
    }
  }

  /**
   * Tam döngü - tüm adımları çalıştır
   */
  async runFullCycle() {
    console.log('\n🤖 ════════════════════════════════════════════════════');
    console.log('   PatiBot Çalışma Döngüsü Başlıyor');
    console.log('════════════════════════════════════════════════════\n');
    console.log(`⏰ Başlangıç: ${new Date().toLocaleString('tr-TR')}\n`);
    
    this.stats = {
      tweets_collected: 0,
      tweets_analyzed: 0,
      incidents_found: 0,
      tweets_posted: 0,
      errors: 0
    };
    
    try {
      // 1. Tweet toplama
      await this.collectTweets();
      
      // 2. Analiz
      await this.analyzeTweets();
      
      // 3. Paylaşım
      await this.postIncidents();
      
      // İstatistikleri kaydet
      saveBotStats(this.stats);
      
      console.log('\n📊 ════════════════════════════════════════════════════');
      console.log('   Döngü İstatistikleri');
      console.log('════════════════════════════════════════════════════');
      console.log(`🔍 Toplanan Tweet: ${this.stats.tweets_collected}`);
      console.log(`🤖 Analiz Edilen: ${this.stats.tweets_analyzed}`);
      console.log(`🚨 Bulunan Olay: ${this.stats.incidents_found}`);
      console.log(`📤 Hazırlanan Rapor: ${this.stats.tweets_posted}`);
      console.log(`❌ Hata: ${this.stats.errors}`);
      console.log(`⏰ Bitiş: ${new Date().toLocaleString('tr-TR')}`);
      console.log('════════════════════════════════════════════════════\n');
      
      logger.info('Bot döngüsü tamamlandı', { stats: this.stats });
      
      // Browser'ı kapat
      await twitterScraper.close();
      
    } catch (error) {
      console.error('\n❌ Döngü hatası:', error);
      logger.error('Bot döngüsü hatası', { error, stats: this.stats });
      saveBotStats(this.stats);
    }
  }
}

export default PatiBotCore;

