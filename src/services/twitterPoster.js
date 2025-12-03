import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

class TwitterPoster {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.isLoggedIn = false;
  }

  /**
   * Browser'ı başlat
   */
  async initialize() {
    if (this.browser) return;

    console.log('🎭 Playwright browser başlatılıyor (Twitter poster)...');
    
    const headlessMode = process.env.HEADLESS !== 'false';
    
    this.browser = await chromium.launch({
      headless: headlessMode,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    if (!headlessMode) {
      console.log('👁️  Browser görünür modda açılıyor...');
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul',
      permissions: [],
      extraHTTPHeaders: {
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });

    this.page = await this.context.newPage();
    
    console.log('✅ Browser hazır');
  }

  /**
   * Twitter'a giriş yap
   */
  async login() {
    if (this.isLoggedIn) {
      console.log('✅ Zaten giriş yapılmış');
      return true;
    }

    const username = process.env.PATIBOT_TWITTER_USERNAME;
    const password = process.env.PATIBOT_TWITTER_PASSWORD;
    const email = process.env.PATIBOT_TWITTER_EMAIL;

    if (!username || !password) {
      throw new Error('PATIBOT_TWITTER_USERNAME ve PATIBOT_TWITTER_PASSWORD .env dosyasında tanımlanmalı!');
    }

    try {
      console.log('🔐 Twitter\'a giriş yapılıyor...');
      
      await this.page.goto('https://twitter.com/i/flow/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await this.page.waitForTimeout(3000);

      // Kullanıcı adı gir
      console.log('   📝 Kullanıcı adı giriliyor...');
      const usernameInput = await this.page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
      await usernameInput.click();
      await usernameInput.fill(username);
      
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(2000);
      
      // İleri butonuna tıkla
      console.log('   ➡️ İleri butonuna tıklanıyor...');
      
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[role="button"]'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent;
          if (!text.includes('İleri') && !text.includes('Next')) return false;
          const style = window.getComputedStyle(btn);
          return style.backgroundColor === 'rgb(15, 20, 25)';
        });
        if (nextBtn) {
          nextBtn.click();
          return true;
        }
        return false;
      });
      
      await this.page.waitForTimeout(3000);
      
      // Email kontrolü
      const emailCheck = await this.page.$('input[data-testid="ocfEnterTextTextInput"]');
      if (emailCheck && email) {
        console.log('   📧 Email doğrulaması isteniyor...');
        await emailCheck.fill(email);
        await this.page.waitForTimeout(1000);
        
        await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button[role="button"]'));
          const nextBtn = buttons.find(btn => {
            const text = btn.textContent;
            return text.includes('İleri') || text.includes('Next');
          });
          if (nextBtn) nextBtn.click();
        });
        
        await this.page.waitForTimeout(3000);
      }

      // Şifre gir
      console.log('   🔑 Şifre giriliyor...');
      const passwordInput = await this.page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
      await passwordInput.fill(password);
      await this.page.waitForTimeout(1000);

      // Login butonuna tıkla
      await this.page.click('button[data-testid="LoginForm_Login_Button"]');
      
      console.log('   ⏳ Giriş bekleniyor...');
      await this.page.waitForTimeout(5000);

      // Giriş kontrolü
      const currentUrl = this.page.url();
      if (currentUrl.includes('/home') || currentUrl.includes('/compose')) {
        console.log('✅ Twitter girişi başarılı!');
        this.isLoggedIn = true;
        return true;
      } else {
        await this.page.waitForTimeout(5000);
        const newUrl = this.page.url();
        if (newUrl.includes('/home') || newUrl.includes('/compose')) {
          console.log('✅ Twitter girişi başarılı!');
          this.isLoggedIn = true;
          return true;
        } else {
          throw new Error('Twitter girişi yapılamadı. URL: ' + newUrl);
        }
      }
    } catch (error) {
      console.error('❌ Twitter giriş hatası:', error.message);
      
      try {
        await this.page.screenshot({ path: 'twitter-poster-login-error.png' });
        console.log('📸 Hata ekran görüntüsü: twitter-poster-login-error.png');
      } catch (e) {
        // ignore
      }
      
      throw error;
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
