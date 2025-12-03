#!/usr/bin/env node

import dotenv from 'dotenv';
import cron from 'node-cron';
import { initDatabase } from './database/schema.js';
import PatiBotCore from './bot.js';
import logger from './utils/logger.js';
import weeklyReportScheduler from './utils/weeklyReportScheduler.js';

// Environment variables yükle
dotenv.config();

// ASCII Art Banner
console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██████╗  █████╗ ████████╗██╗██████╗  ██████╗ ████████╗    ║
║   ██╔══██╗██╔══██╗╚══██╔══╝██║██╔══██╗██╔═══██╗╚══██╔══╝    ║
║   ██████╔╝███████║   ██║   ██║██████╔╝██║   ██║   ██║       ║
║   ██╔═══╝ ██╔══██║   ██║   ██║██╔══██╗██║   ██║   ██║       ║
║   ██║     ██║  ██║   ██║   ██║██████╔╝╚██████╔╝   ██║       ║
║   ╚═╝     ╚═╝  ╚═╝   ╚═╝   ╚═╝╚═════╝  ╚═════╝    ╚═╝       ║
║                                                               ║
║   Sokak Hayvanı Saldırı Takip ve Raporlama Botu              ║
║   v1.0.0 - Node.js + Playwright + Google Gemini AI           ║
║   💰 Tamamen ÜCRETSİZ - Twitter API Gerekmez!                ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
`);

// Konfigürasyon kontrolü
function checkConfiguration() {
  const required = [
    'GEMINI_API_KEY',
    'NEWS_ACCOUNTS'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('❌ Eksik environment variable\'lar:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\n💡 Lütfen .env dosyasını env.example\'dan oluşturun ve doldurun.\n');
    process.exit(1);
  }

  console.log('✅ Konfigürasyon kontrolü başarılı');
  console.log('ℹ️  Nitter kullanılıyor - Twitter login gerekmez');
  
  // Tweet paylaşım kontrolü
  const autoPost = process.env.AUTO_POST_TWEETS !== 'false';
  if (autoPost) {
    const posterRequired = ['PATIBOT_TWITTER_USERNAME', 'PATIBOT_TWITTER_PASSWORD'];
    const posterMissing = posterRequired.filter(key => !process.env[key]);
    
    if (posterMissing.length > 0) {
      console.warn('\n⚠️  Otomatik tweet paylaşımı için eksik bilgiler:');
      posterMissing.forEach(key => console.warn(`   - ${key}`));
      console.warn('   AUTO_POST_TWEETS=false yapılarak sadece rapor oluşturulacak.\n');
      process.env.AUTO_POST_TWEETS = 'false';
    } else {
      console.log('📤 Otomatik tweet paylaşımı: AÇIK\n');
    }
  } else {
    console.log('📝 Otomatik tweet paylaşımı: KAPALI (sadece rapor hazırlanacak)\n');
  }
}

// Ana fonksiyon
async function main() {
  try {
    // 1. Konfigürasyon kontrolü
    checkConfiguration();

    // 2. Veritabanını başlat
    console.log('🔧 Veritabanı başlatılıyor...');
    initDatabase();
    console.log('✅ Veritabanı hazır\n');

    // 3. Bot instance oluştur
    const bot = new PatiBotCore();

    // 4. Command line argümanlarını kontrol et
    const args = process.argv.slice(2);

    if (args.includes('--once') || args.includes('-o')) {
      // Tek seferlik çalıştır
      console.log('🔄 Tek seferlik çalıştırma modu\n');
      await bot.runFullCycle();
      console.log('\n✅ İşlem tamamlandı. Çıkılıyor...\n');
      process.exit(0);
    } else {
      // Zamanlayıcı ile çalıştır
      const intervalMinutes = parseInt(process.env.SCAN_INTERVAL_MINUTES) || 30;
      
      console.log('⏰ Zamanlayıcı modu aktif');
      console.log(`📅 Tarama aralığı: Her ${intervalMinutes} dakikada bir\n`);
      console.log('💡 Tek seferlik çalıştırmak için: npm start -- --once\n');
      console.log('════════════════════════════════════════════════════════════════\n');

      // İlk çalıştırmayı hemen yap
      console.log('🚀 İlk tarama başlatılıyor...\n');
      await bot.runFullCycle();

      // Cron schedule oluştur
      const cronExpression = `*/${intervalMinutes} * * * *`;
      
      cron.schedule(cronExpression, async () => {
        console.log('\n⏰ Zamanlı tarama tetiklendi...\n');
        await bot.runFullCycle();
      });

      console.log(`\n⏰ Zamanlayıcı kuruldu. Bir sonraki tarama ${intervalMinutes} dakika sonra.`);
      
      // Haftalık rapor scheduler'ı başlat
      weeklyReportScheduler.start();
      
      console.log('🔄 Bot çalışıyor... (Durdurmak için Ctrl+C)\n');
    }

  } catch (error) {
    console.error('\n❌ Kritik hata:', error);
    logger.error('Ana süreç hatası', { error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Bot durduruluyor...');
  logger.info('Bot manuel olarak durduruldu');
  console.log('👋 Güle güle!\n');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n⚠️  Bot durduruluyor...');
  logger.info('Bot SIGTERM sinyali ile durduruldu');
  process.exit(0);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('\n❌ Yakalanmamış hata:', error);
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Yakalanmamış promise rejection:', reason);
  logger.error('Unhandled rejection', { reason, promise });
});

// Başlat
main();

