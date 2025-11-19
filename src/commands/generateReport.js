#!/usr/bin/env node

/**
 * Haftalık rapor oluştur ve göster
 */

import dotenv from 'dotenv';
import reportService from '../services/reportService.js';
import { initDatabase } from '../database/schema.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n📊 Haftalık Rapor Oluşturuluyor...\n');

// Veritabanını başlat
initDatabase();

// Komut satırı argümanları
const args = process.argv.slice(2);
const days = args.includes('--days') 
  ? parseInt(args[args.indexOf('--days') + 1]) || 7 
  : 7;

const exportCSV = args.includes('--csv');
const showThread = args.includes('--thread');

console.log(`📅 Son ${days} gün için rapor hazırlanıyor...\n`);

try {
  // 1. Detaylı konsol raporu
  const detailedReport = reportService.generateDetailedReport(days);
  console.log(detailedReport);

  // 2. Tweet formatı
  console.log('\n📱 TWITTER PAYLAŞIM İÇERİĞİ (Tek Tweet):');
  console.log('═'.repeat(70));
  const tweet = reportService.generateWeeklyReportTweet(days);
  if (tweet) {
    console.log(tweet);
    console.log(`\n📏 Karakter sayısı: ${tweet.length}/280`);
  } else {
    console.log('⚠️  Rapor oluşturulamadı - veri yok.');
  }
  console.log('═'.repeat(70));

  // 3. Thread formatı (opsiyonel)
  if (showThread) {
    console.log('\n\n🧵 TWITTER THREAD (Çoklu Tweet):');
    console.log('═'.repeat(70));
    const thread = reportService.generateWeeklyReportThread(days);
    if (thread) {
      thread.forEach((t, index) => {
        console.log(`\n--- Tweet ${index + 1}/${thread.length} ---`);
        console.log(t);
        console.log(`📏 ${t.length}/280 karakter`);
      });
    }
    console.log('═'.repeat(70));
  }

  // 4. CSV export (opsiyonel)
  if (exportCSV) {
    const csv = reportService.generateCSVReport(days);
    const filename = `haftalik_rapor_${new Date().toISOString().split('T')[0]}.csv`;
    const filepath = path.join(__dirname, '../../data', filename);
    
    fs.writeFileSync(filepath, csv, 'utf8');
    console.log(`\n💾 CSV raporu kaydedildi: ${filepath}`);
  }

  console.log('\n✅ Rapor oluşturuldu!\n');
  console.log('💡 Kullanım örnekleri:');
  console.log('   npm run report                    # 7 günlük rapor');
  console.log('   npm run report -- --days 30       # 30 günlük rapor');
  console.log('   npm run report -- --thread        # Thread formatı');
  console.log('   npm run report -- --csv           # CSV export');
  console.log('   npm run report -- --days 14 --csv --thread # Hepsi\n');

} catch (error) {
  console.error('❌ Rapor oluşturma hatası:', error);
  process.exit(1);
}

