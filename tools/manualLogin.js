import { chromium } from 'playwright';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const USER_DATA_DIR = path.join(process.cwd(), 'data', 'browser-data');

async function manualLogin() {
  console.log('🔐 Manuel Twitter Girişi');
  console.log('========================\n');
  console.log('Bu script browser\'ı açacak ve sen manuel olarak giriş yapacaksın.');
  console.log('Giriş yaptıktan sonra browser\'ı kapat, oturum kaydedilecek.\n');
  
  const browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul',
    args: [
      '--disable-blink-features=AutomationControlled',
    ]
  });
  
  const page = browser.pages()[0] || await browser.newPage();
  
  // Twitter'a git
  console.log('📱 Twitter açılıyor...');
  await page.goto('https://twitter.com/login');
  
  console.log('\n⚠️  MANUEL GİRİŞ YAP!');
  console.log('   1. Kullanıcı adı ve şifre ile giriş yap');
  console.log('   2. Captcha varsa çöz');
  console.log('   3. Giriş başarılı olunca bu terminale dön');
  console.log('   4. Enter\'a bas veya browser\'ı kapat\n');
  
  // Kullanıcının giriş yapmasını bekle
  await page.waitForURL('**/home', { timeout: 300000 }).catch(() => {});
  
  const currentUrl = page.url();
  if (currentUrl.includes('/home')) {
    console.log('✅ Giriş başarılı! Oturum kaydediliyor...');
  } else {
    console.log('⏳ Giriş yapmak için bekleniyor... (5 dakika timeout)');
    
    // Manuel bekleme - readline kullan
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    await new Promise(resolve => {
      rl.question('\nGiriş yaptıktan sonra Enter\'a bas: ', () => {
        rl.close();
        resolve();
      });
    });
  }
  
  // Oturum kontrolü
  const finalUrl = page.url();
  if (finalUrl.includes('/home') || finalUrl.includes('twitter.com')) {
    console.log('\n✅ Oturum başarıyla kaydedildi!');
    console.log(`📁 Konum: ${USER_DATA_DIR}`);
    console.log('\n🚀 Artık bot otomatik giriş yapabilir.');
  } else {
    console.log('\n❌ Giriş yapılamadı. Tekrar dene.');
  }
  
  await browser.close();
}

manualLogin().catch(console.error);
