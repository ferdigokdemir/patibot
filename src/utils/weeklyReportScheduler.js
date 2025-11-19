/**
 * Haftalık rapor otomasyonu
 * Her Pazartesi sabah 09:00'da otomatik rapor oluştur
 */

import cron from 'node-cron';
import reportService from '../services/reportService.js';
import logger from './logger.js';

class WeeklyReportScheduler {
  constructor() {
    this.isEnabled = process.env.ENABLE_WEEKLY_REPORT === 'true';
    this.schedule = process.env.WEEKLY_REPORT_SCHEDULE || '0 9 * * 1'; // Her Pazartesi 09:00
  }

  /**
   * Haftalık rapor scheduler'ı başlat
   */
  start() {
    if (!this.isEnabled) {
      console.log('ℹ️  Haftalık rapor otomasyonu kapalı (ENABLE_WEEKLY_REPORT=false)');
      return;
    }

    console.log(`📅 Haftalık rapor scheduler başlatıldı: ${this.schedule}`);
    console.log('   (Her Pazartesi sabah 09:00\'da çalışacak)\n');

    cron.schedule(this.schedule, async () => {
      console.log('\n📊 Haftalık rapor oluşturuluyor...');
      
      try {
        await this.generateAndLogReport();
      } catch (error) {
        console.error('❌ Haftalık rapor hatası:', error);
        logger.error('Haftalık rapor hatası', { error });
      }
    });
  }

  /**
   * Raporu oluştur ve logla
   */
  async generateAndLogReport() {
    const days = 7;
    
    // Detaylı rapor
    const detailedReport = reportService.generateDetailedReport(days);
    console.log(detailedReport);

    // Tweet formatı
    const tweet = reportService.generateWeeklyReportTweet(days);
    
    if (tweet) {
      console.log('\n═'.repeat(70));
      console.log('📱 HAFTALIK RAPOR TWEET\'İ:');
      console.log('═'.repeat(70));
      console.log(tweet);
      console.log('═'.repeat(70));
      
      // Log'a kaydet
      logger.info('Haftalık rapor oluşturuldu', {
        days,
        tweet_length: tweet.length,
        tweet_content: tweet
      });

      console.log('\n✅ Haftalık rapor hazır!');
      console.log('💡 Bu içeriği kopyalayarak Twitter\'da paylaşabilirsiniz.\n');
    } else {
      console.log('⚠️  Bu hafta rapor edilecek olay yok.\n');
      logger.info('Haftalık rapor - veri yok', { days });
    }

    // Thread de oluştur
    const thread = reportService.generateWeeklyReportThread(days);
    if (thread) {
      console.log('\n🧵 THREAD FORMATINDA PAYLAŞIM:');
      console.log('═'.repeat(70));
      thread.forEach((t, index) => {
        console.log(`\n[${index + 1}/${thread.length}]`);
        console.log(t);
      });
      console.log('═'.repeat(70) + '\n');
    }
  }

  /**
   * Manual olarak rapor oluştur (test için)
   */
  async generateNow() {
    console.log('🔧 Manuel haftalık rapor oluşturuluyor...\n');
    await this.generateAndLogReport();
  }
}

export default new WeeklyReportScheduler();

