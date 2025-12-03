import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Persistent browser data için klasör
const USER_DATA_DIR = path.join(process.cwd(), 'data', 'browser-data');

class TwitterPoster {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  /**
   * Browser'ı başlat (Persistent Context ile)
   */
  async initialize() {
    if (this.browser) return;

    console.log('🎭 Playwright browser başlatılıyor (Twitter poster)...');
    
    const headlessMode = process.env.HEADLESS !== 'false';
    
    // Browser data klasörünü oluştur
    if (!fs.existsSync(USER_DATA_DIR)) {
      fs.mkdirSync(USER_DATA_DIR, { recursive: true });
    }
    
    // Persistent context kullan - oturum kaydedilir
    this.browser = await chromium.launchPersistentContext(USER_DATA_DIR, {
      headless: headlessMode,
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      extraHTTPHeaders: {
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    
    if (!headlessMode) {
      console.log('👁️  Browser görünür modda açılıyor...');
    }

    // Persistent context'te context = browser
    this.context = this.browser;
    this.page = this.browser.pages()[0] || await this.browser.newPage();
    
    console.log('✅ Browser hazır (Persistent Context)');
  }

  /**
   * Twitter'a giriş yap
   */
  async login() {
    if (this.isLoggedIn) {
      console.log('✅ Zaten giriş yapılmış');
      return true;
    }

    try {
      // Önce kayıtlı oturum var mı kontrol et
      console.log('🔍 Kayıtlı oturum kontrol ediliyor...');
      
      await this.page.goto('https://twitter.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      await this.page.waitForTimeout(3000);
      
      const currentUrl = this.page.url();
      
      // Eğer home sayfasındaysak, zaten giriş yapılmış
      if (currentUrl.includes('/home') && !currentUrl.includes('/login')) {
        console.log('✅ Kayıtlı oturum bulundu! Otomatik giriş yapıldı.');
        this.isLoggedIn = true;
        return true;
      }
      
      // Kayıtlı oturum yok - manuel giriş gerekli
      console.log('❌ Kayıtlı oturum bulunamadı.');
      console.log('');
      console.log('📌 MANUEL GİRİŞ GEREKLİ:');
      console.log('   Terminalde şu komutu çalıştır:');
      console.log('   node tools/manualLogin.js');
      console.log('');
      console.log('   Manuel giriş yaptıktan sonra botu tekrar başlat.');
      
      throw new Error('Manuel giriş gerekli. "node tools/manualLogin.js" komutunu çalıştır.');
      
    } catch (error) {
      if (error.message.includes('Manuel giriş gerekli')) {
        throw error;
      }
      
      console.error('❌ Oturum kontrolü hatası:', error.message);
      console.log('');
      console.log('📌 MANUEL GİRİŞ GEREKLİ:');
      console.log('   Terminalde şu komutu çalıştır:');
      console.log('   node tools/manualLogin.js');
      
      throw new Error('Manuel giriş gerekli. "node tools/manualLogin.js" komutunu çalıştır.');
    }
  }

  /**
   * Tweet gönder
   */
  async postTweet(tweetText) {
    try {
      await this.initialize();
      await this.login();

      console.log('📝 Tweet gönderiliyor...');
      
      // Home sayfasına git
      await this.page.goto('https://twitter.com/home', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await this.page.waitForTimeout(3000);

      // Tweet input alanını bul
      console.log('   🔍 Tweet input alanı aranıyor...');
      const tweetInput = await this.page.waitForSelector('div[data-testid="tweetTextarea_0"]', { timeout: 10000 });
      
      // Tweet metnini gir
      console.log('   ⌨️ Tweet metni giriliyor...');
      await tweetInput.click();
      await this.page.waitForTimeout(1000);
      
      // Metni parça parça gir (uzun tweetler için)
      const lines = tweetText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        await this.page.keyboard.type(lines[i]);
        if (i < lines.length - 1) {
          await this.page.keyboard.press('Enter');
        }
        await this.page.waitForTimeout(100);
      }
      
      await this.page.waitForTimeout(2000);

      // Tweet butonunu bul ve tıkla
      console.log('   📤 Tweet gönderiliyor...');
      const tweetButton = await this.page.waitForSelector('button[data-testid="tweetButtonInline"]', { timeout: 10000 });
      await tweetButton.click();
      
      // Tweet'in gönderilmesini bekle
      await this.page.waitForTimeout(5000);
      
      console.log('✅ Tweet başarıyla gönderildi!');
      
      return {
        success: true,
        posted_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ Tweet gönderme hatası:', error.message);
      
      try {
        await this.page.screenshot({ path: 'twitter-post-error.png' });
        console.log('📸 Hata ekran görüntüsü: twitter-post-error.png');
      } catch (e) {
        // ignore
      }
      
      throw error;
    }
  }

  /**
   * Browser'ı kapat
   */
  async close() {
    if (this.browser) {
      console.log('🔒 Browser kapatılıyor...');
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }
}

export default new TwitterPoster();
