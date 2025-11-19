import { db } from '../database/schema.js';
import { getRelevantAuthorities } from '../data/authorities.js';

class ReportService {
  /**
   * Son N günün istatistiklerini al
   */
  getStatsByDays(days = 7) {
    const stmt = db.prepare(`
      SELECT 
        city,
        COUNT(*) as incident_count,
        GROUP_CONCAT(DISTINCT district) as districts,
        MIN(incident_date) as first_incident,
        MAX(incident_date) as last_incident
      FROM incidents
      WHERE 
        created_at >= datetime('now', '-${days} days')
        AND city IS NOT NULL
      GROUP BY city
      ORDER BY incident_count DESC, city ASC
    `);
    
    return stmt.all();
  }

  /**
   * Toplam istatistikleri al
   */
  getTotalStats(days = 7) {
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_incidents,
        COUNT(DISTINCT city) as total_cities,
        COUNT(DISTINCT district) as total_districts,
        MIN(incident_date) as first_date,
        MAX(incident_date) as last_date
      FROM incidents
      WHERE created_at >= datetime('now', '-${days} days')
    `);
    
    return stmt.get();
  }

  /**
   * Haftalık rapor tweet'i oluştur
   */
  generateWeeklyReportTweet(days = 7) {
    const stats = this.getStatsByDays(days);
    const totals = this.getTotalStats(days);

    if (!stats || stats.length === 0) {
      return null;
    }

    let tweet = `📊 Son ${days} Günlük Sokak Hayvanı Saldırı Raporu\n\n`;
    tweet += `📍 Toplam ${totals.total_incidents} olay tespit edildi:\n\n`;

    // İlleri ve olay sayılarını ekle
    stats.forEach((stat, index) => {
      if (index < 10) { // İlk 10 ili göster (karakter limiti için)
        const cityName = stat.city;
        const count = stat.incident_count;
        tweet += `${cityName}: ${count} olay\n`;
      }
    });

    // Eğer 10'dan fazla il varsa
    if (stats.length > 10) {
      const remaining = stats.slice(10);
      const remainingCount = remaining.reduce((sum, s) => sum + s.incident_count, 0);
      tweet += `\n+${stats.length - 10} il daha: ${remainingCount} olay\n`;
    }

    tweet += `\n📅 ${this.formatDateRange(days)}`;
    tweet += `\n\n@TC_Icisleri @TC150Cimer`;
    tweet += `\n\n#SokakHayvanları #PatiBot #HaftalıkRapor`;

    // 280 karakter kontrolü
    if (tweet.length > 280) {
      // Daha kısa versiyon
      tweet = `📊 ${days} Günlük Rapor\n\n`;
      tweet += `📍 ${totals.total_incidents} olay, ${totals.total_cities} il\n\n`;
      
      // İlk 5 ili göster
      stats.slice(0, 5).forEach(stat => {
        tweet += `${stat.city}: ${stat.incident_count}\n`;
      });

      if (stats.length > 5) {
        tweet += `\n+${stats.length - 5} il daha\n`;
      }

      tweet += `\n@TC_Icisleri @TC150Cimer\n#PatiBot`;
    }

    return tweet;
  }

  /**
   * Detaylı haftalık rapor (Thread için)
   */
  generateWeeklyReportThread(days = 7) {
    const stats = this.getStatsByDays(days);
    const totals = this.getTotalStats(days);

    if (!stats || stats.length === 0) {
      return null;
    }

    const tweets = [];

    // İlk tweet - Özet
    let tweet1 = `📊 Son ${days} Günlük Sokak Hayvanı Saldırı Raporu\n\n`;
    tweet1 += `📍 Toplam: ${totals.total_incidents} olay\n`;
    tweet1 += `🏙️ ${totals.total_cities} farklı il\n`;
    tweet1 += `📅 ${this.formatDateRange(days)}\n\n`;
    tweet1 += `@TC_Icisleri @TC150Cimer\n\n`;
    tweet1 += `#SokakHayvanları #PatiBot #HaftalıkRapor\n\n`;
    tweet1 += `🧵 Detaylar aşağıda 👇`;
    tweets.push(tweet1);

    // İkinci tweet - İl listesi (1-10)
    if (stats.length > 0) {
      let tweet2 = `📍 İl Bazında Olay Sayıları:\n\n`;
      stats.slice(0, 10).forEach((stat, index) => {
        tweet2 += `${index + 1}. ${stat.city}: ${stat.incident_count} olay\n`;
      });
      tweets.push(tweet2);
    }

    // Üçüncü tweet - İl listesi (11-20) varsa
    if (stats.length > 10) {
      let tweet3 = `📍 İl Bazında Olay Sayıları (devam):\n\n`;
      stats.slice(10, 20).forEach((stat, index) => {
        tweet3 += `${index + 11}. ${stat.city}: ${stat.incident_count} olay\n`;
      });
      tweets.push(tweet3);
    }

    // Dördüncü tweet - En çok etkilenen 3 il için detay
    if (stats.length > 0) {
      let tweet4 = `⚠️ En Çok Etkilenen İller:\n\n`;
      stats.slice(0, 3).forEach((stat, index) => {
        const authorities = getRelevantAuthorities(stat.city, null);
        tweet4 += `${index + 1}. ${stat.city}: ${stat.incident_count} olay\n`;
        if (authorities.length > 0) {
          tweet4 += `   ${authorities[0]}\n`;
        }
        tweet4 += `\n`;
      });
      tweets.push(tweet4);
    }

    // Son tweet - Çağrı
    let tweetLast = `💬 Yetkili kurumlardan acil aksiyonlar bekliyoruz:\n\n`;
    tweetLast += `✅ Sahipsiz hayvanların kontrolü\n`;
    tweetLast += `✅ Veteriner denetimleri\n`;
    tweetLast += `✅ Vatandaş güvenliğinin sağlanması\n\n`;
    tweetLast += `📞 CİMER: https://www.cimer.gov.tr/\n\n`;
    tweetLast += `#SokakHayvanları #PatiBot`;
    tweets.push(tweetLast);

    return tweets;
  }

  /**
   * Tarih aralığını formatla
   */
  formatDateRange(days) {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return `${startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  /**
   * Detaylı metin rapor (Console/Log için)
   */
  generateDetailedReport(days = 7) {
    const stats = this.getStatsByDays(days);
    const totals = this.getTotalStats(days);

    if (!stats || stats.length === 0) {
      return 'Son ' + days + ' günde kayıtlı olay bulunamadı.';
    }

    let report = '\n';
    report += '═'.repeat(70) + '\n';
    report += `   SON ${days} GÜN SOKAK HAYVANI SALDIRI RAPORU\n`;
    report += '═'.repeat(70) + '\n\n';

    report += `📊 GENEL İSTATİSTİKLER:\n`;
    report += `─`.repeat(70) + '\n';
    report += `   Toplam Olay Sayısı: ${totals.total_incidents}\n`;
    report += `   Etkilenen İl Sayısı: ${totals.total_cities}\n`;
    report += `   Etkilenen İlçe Sayısı: ${totals.total_districts}\n`;
    report += `   Tarih Aralığı: ${this.formatDateRange(days)}\n`;
    report += '\n';

    report += `📍 İL BAZINDA DAĞILIM:\n`;
    report += `─`.repeat(70) + '\n';
    stats.forEach((stat, index) => {
      const padding = ' '.repeat(Math.max(0, 25 - stat.city.length));
      report += `   ${(index + 1).toString().padStart(2)}. ${stat.city}${padding}: ${stat.incident_count} olay\n`;
      
      if (stat.districts) {
        const districts = stat.districts.split(',').filter(d => d && d !== 'null');
        if (districts.length > 0) {
          report += `       İlçeler: ${districts.join(', ')}\n`;
        }
      }
    });

    report += '\n';
    report += `⚠️  EN RİSKLİ 5 İL:\n`;
    report += `─`.repeat(70) + '\n';
    stats.slice(0, 5).forEach((stat, index) => {
      const authorities = getRelevantAuthorities(stat.city, null);
      report += `   ${index + 1}. ${stat.city} - ${stat.incident_count} olay\n`;
      if (authorities.length > 0) {
        report += `      Yetkili: ${authorities.slice(0, 2).join(', ')}\n`;
      }
    });

    report += '\n';
    report += '═'.repeat(70) + '\n';
    report += `   Rapor Tarihi: ${new Date().toLocaleString('tr-TR')}\n`;
    report += '═'.repeat(70) + '\n\n';

    return report;
  }

  /**
   * CSV export
   */
  generateCSVReport(days = 7) {
    const stats = this.getStatsByDays(days);
    
    let csv = 'Sıra,İl,Olay Sayısı,İlçeler,İlk Olay,Son Olay\n';
    
    stats.forEach((stat, index) => {
      const districts = stat.districts ? stat.districts.replace(/,/g, ';') : '';
      csv += `${index + 1},${stat.city},${stat.incident_count},"${districts}",${stat.first_incident},${stat.last_incident}\n`;
    });

    return csv;
  }
}

export default new ReportService();

