import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Twitter'daki tüm like'ları geri alır
 * Kullanım: node tools/unlikeAll.js
 */
class TwitterUnliker {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.unlikedCount = 0;
  }

  async initialize() {
    console.log('🎭 Browser başlatılıyor...');
    
    this.browser = await chromium.launch({
      headless: false,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--no-sandbox',
        '--disable-setuid-sandbox'
      ]
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'tr-TR',
      timezoneId: 'Europe/Istanbul'
    });

    this.page = await this.context.newPage();
    console.log('✅ Browser hazır');
  }

  async login() {
    const username = process.env.TWITTER_USERNAME;
    const password = process.env.TWITTER_PASSWORD;
    const email = process.env.TWITTER_EMAIL;

    if (!username || !password) {
      throw new Error('TWITTER_USERNAME ve TWITTER_PASSWORD .env dosyasında tanımlanmalı!');
    }

    try {
      console.log('🔐 Twitter\'a giriş yapılıyor...');
      
      await this.page.goto('https://twitter.com/i/flow/login', {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await this.page.waitForTimeout(3000);

      // Kullanıcı adı
      console.log('   📝 Kullanıcı adı giriliyor...');
      const usernameInput = await this.page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
      await usernameInput.click();
      await usernameInput.fill(username);
      await this.page.keyboard.press('Tab');
      await this.page.waitForTimeout(2000);
      
      // İleri butonu
      console.log('   ➡️ İleri butonuna tıklanıyor...');
      await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[role="button"]'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent;
          if (!text.includes('İleri') && !text.includes('Next')) return false;
          const style = window.getComputedStyle(btn);
          return style.backgroundColor === 'rgb(15, 20, 25)';
        });
        if (nextBtn) nextBtn.click();
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

      // Şifre
      console.log('   🔑 Şifre giriliyor...');
      const passwordInput = await this.page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
      await passwordInput.fill(password);
      await this.page.waitForTimeout(1000);

      // Login
      await this.page.click('button[data-testid="LoginForm_Login_Button"], button:has-text("Log in"), button:has-text("Giriş yap")');
      
      console.log('   ⏳ Giriş bekleniyor...');
      await this.page.waitForTimeout(5000);

      const currentUrl = this.page.url();
      if (currentUrl.includes('/home') || currentUrl.includes('/compose')) {
        console.log('✅ Twitter girişi başarılı!');
        return true;
      } else {
        throw new Error('Twitter girişi yapılamadı');
      }
    } catch (error) {
      console.error('❌ Twitter giriş hatası:', error.message);
      throw error;
    }
  }

  async goToLikes() {
    console.log('❤️  Beğeniler sayfasına gidiliyor...');
    const username = process.env.TWITTER_USERNAME;
    const cleanUsername = username.replace('@', '');
    
    await this.page.goto(`https://twitter.com/${cleanUsername}/likes`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await this.page.waitForTimeout(3000);
    console.log('✅ Beğeniler sayfasında');
  }

  async unlikeAll(maxUnlikes = 1000) {
    console.log(`\n💔 Like geri alma işlemi başlıyor (maksimum ${maxUnlikes} tweet)...\n`);
    
    let attemptCount = 0;
    const maxAttempts = maxUnlikes;
    let consecutiveFailures = 0;

    while (attemptCount < maxAttempts && consecutiveFailures < 10) {
      try {
        // Sayfayı biraz scroll et
        await this.page.evaluate(() => window.scrollBy(0, 300));
        await this.page.waitForTimeout(1000);

        // Like butonunu bul - önce like yap sonra unlike (bug fix)
        const unlikeSuccess = await this.page.evaluate(() => {
          // Tüm like butonlarını bul (liked olan = kırmızı/pembe)
          const likeButtons = document.querySelectorAll('button[data-testid="unlike"]');
          
          if (likeButtons.length === 0) return false;
          
          // İlk liked butonu bul ve tıkla
          const firstLikeBtn = likeButtons[0];
          if (firstLikeBtn) {
            // Önce like yap (bug fix için)
            firstLikeBtn.click();
            return true;
          }
          
          return false;
        });

        if (unlikeSuccess) {
          // Like yapıldı, şimdi unlike yap
          await this.page.waitForTimeout(500);
          
          await this.page.evaluate(() => {
            const likeButtons = document.querySelectorAll('button[data-testid="like"]');
            if (likeButtons.length > 0) {
              likeButtons[0].click();
            }
          });
        }

        if (!unlikeSuccess) {
          console.log('⚠️  Daha fazla beğenilmiş tweet bulunamadı');
          consecutiveFailures++;
          
          // Sayfayı biraz daha scroll et, belki daha fazla var
          await this.page.evaluate(() => window.scrollBy(0, 1000));
          await this.page.waitForTimeout(2000);
          
          attemptCount++;
          continue;
        }

        if (unlikeSuccess) {
          this.unlikedCount++;
          consecutiveFailures = 0; // Başarılı olunca sıfırla
          console.log(`   💔 Like geri alındı (${this.unlikedCount}/${maxUnlikes})`);
          
          // Rate limit'e yakalanmamak için bekleme
          await this.page.waitForTimeout(1000);
        }

        attemptCount++;

        // Her 20 unlike'ta bir sayfayı yenile (rate limit önleme)
        if (this.unlikedCount % 20 === 0 && this.unlikedCount > 0) {
          console.log('\n   🔄 Sayfa yenileniyor...\n');
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForTimeout(3000);
        }

        // Her 50 unlike'ta biraz daha uzun bekle
        if (this.unlikedCount % 50 === 0 && this.unlikedCount > 0) {
          console.log('   ⏸️  Rate limit önleme - 10 saniye bekleniyor...');
          await this.page.waitForTimeout(10000);
        }

      } catch (error) {
        console.error('❌ Unlike hatası:', error.message);
        consecutiveFailures++;
        attemptCount++;
        
        // Hata durumunda sayfayı yenile
        if (attemptCount % 5 === 0) {
          console.log('   🔄 Hata sonrası sayfa yenileniyor...');
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForTimeout(3000);
        }
      }
    }

    if (consecutiveFailures >= 10) {
      console.log('\n✅ Tüm beğeniler geri alındı!');
    } else {
      console.log('\n✅ Maksimum unlike sayısına ulaşıldı!');
    }
    
    console.log(`\n✅ İşlem tamamlandı! Toplam ${this.unlikedCount} like geri alındı.`);
  }

  async close() {
    if (this.browser) {
      console.log('🔒 Browser kapatılıyor...');
      await this.browser.close();
    }
  }
}

// Ana fonksiyon
async function main() {
  const unliker = new TwitterUnliker();
  
  try {
    await unliker.initialize();
    await unliker.login();
    await unliker.goToLikes();
    
    // Maksimum unlike sayısı (argümandan veya default 1000)
    const maxUnlikes = parseInt(process.argv[2]) || 1000;
    
    console.log(`\n⚠️  ${maxUnlikes} like geri alınacak. Devam etmek için 5 saniye bekleniyor...\n`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await unliker.unlikeAll(maxUnlikes);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await unliker.close();
  }
}

main();
