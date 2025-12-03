import { chromium } from 'playwright';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * Twitter'daki tüm yanıtları (replies) siler
 * Kullanım: node tools/deleteReplies.js
 */
class TwitterReplyDeleter {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.deletedCount = 0;
  }

  async initialize() {
    console.log('🎭 Browser başlatılıyor...');
    
    this.browser = await chromium.launch({
      headless: false, // Görünür modda çalışsın
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

  async goToReplies() {
    console.log('👤 Profil yanıtlar sayfasına gidiliyor...');
    const username = process.env.TWITTER_USERNAME;
    const cleanUsername = username.replace('@', '');
    
    await this.page.goto(`https://twitter.com/${cleanUsername}/with_replies`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await this.page.waitForTimeout(3000);
    console.log('✅ Yanıtlar sayfasında');
  }

  async deleteReplies(maxReplies = 1000) {
    console.log(`\n🗑️  Yanıt silme işlemi başlıyor (maksimum ${maxReplies} yanıt)...\n`);
    
    let attemptCount = 0;
    const maxAttempts = maxReplies;
    let consecutiveNotFound = 0;

    while (attemptCount < maxAttempts) {
      try {
        // Sayfanın en üstüne scroll - yeni silinen tweet yerine bir sonraki tweet görünsün
        await this.page.evaluate(() => window.scrollTo(0, 0));
        await this.page.waitForTimeout(1500);

        // İlk tweet'i bul - sadece kendi tweet'lerimizi hedefle
        const tweetFound = await this.page.evaluate((username) => {
          const articles = document.querySelectorAll('article[data-testid="tweet"]');
          if (articles.length === 0) return false;
          
          // Kendi tweet'imizi bul (kullanıcı adı kontrolü ile)
          for (const article of articles) {
            // Tweet içindeki kullanıcı adını kontrol et
            const userLinks = article.querySelectorAll('a[href*="/' + username + '"]');
            if (userLinks.length === 0) continue;
            
            // Bu bizim tweet'imiz, more butonunu bul
            const moreButton = article.querySelector('button[data-testid="caret"]');
            if (moreButton) {
              moreButton.click();
              return true;
            }
          }
          return false;
        }, process.env.TWITTER_USERNAME.replace('@', ''));

        if (!tweetFound) {
          consecutiveNotFound++;
          console.log(`⚠️  Tweet bulunamadı (${consecutiveNotFound}/5).`);
          
          if (consecutiveNotFound >= 3) {
            console.log('   🔄 3 kez bulunamadı, sayfa yenileniyor...');
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            await this.page.waitForTimeout(3000);
            consecutiveNotFound = 0;
            continue;
          }
          
          if (consecutiveNotFound >= 5) {
            console.log('\n✅ Daha fazla yanıt bulunamadı!');
            break;
          }
          
          // Daha fazla tweet yüklemek için scroll yap
          console.log('   📜 Scroll yapılıyor...');
          await this.page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await this.page.waitForTimeout(2000);
          attemptCount++;
          continue;
        }
        
        consecutiveNotFound = 0;

        await this.page.waitForTimeout(1000);

        // "Sil" menü öğesine tıkla
        const deleteClicked = await this.page.evaluate(() => {
          // Tüm menü itemlerini kontrol et
          const menuItems = document.querySelectorAll('[role="menuitem"]');
          for (const item of menuItems) {
            const text = item.textContent || '';
            // Sil, Delete veya silmeyle ilgili metinleri ara
            if (text.includes('Sil') || 
                text.includes('Delete') || 
                text.toLowerCase().includes('delete') ||
                text.includes('Gönderiyi sil') ||
                text.includes('Delete post')) {
              console.log('Sil butonu bulundu:', text);
              item.click();
              return true;
            }
          }
          
          // Alternatif: data-testid ile ara
          const deleteBtn = document.querySelector('[data-testid*="delete"]');
          if (deleteBtn) {
            console.log('Delete testid bulundu');
            deleteBtn.click();
            return true;
          }
          
          console.log('Toplam menuitem sayısı:', menuItems.length);
          menuItems.forEach((item, i) => {
            console.log(`Item ${i}:`, item.textContent?.substring(0, 50));
          });
          
          return false;
        });

        if (!deleteClicked) {
          console.log('⚠️  Sil butonu bulunamadı, atlıyor...');
          // Menüyü kapatmak için boşluğa tıkla veya escape bas
          await this.page.keyboard.press('Escape');
          attemptCount++;
          continue;
        }

        await this.page.waitForTimeout(1000);

        // Onay butonuna tıkla
        const confirmClicked = await this.page.evaluate(() => {
          const buttons = document.querySelectorAll('button[data-testid="confirmationSheetConfirm"]');
          if (buttons.length > 0) {
            buttons[0].click();
            return true;
          }
          return false;
        });

        if (confirmClicked) {
          this.deletedCount++;
          console.log(`   ✅ Yanıt silindi (${this.deletedCount}/${maxReplies})`);
          
          // Tweet silindikten sonra yeni tweet'lerin yüklenmesi için bekle
          await this.page.waitForTimeout(1000);
        } else {
          console.log('⚠️  Onay butonu bulunamadı, atlıyor...');
        }

        attemptCount++;

        // Her 10 yanıtta bir sayfayı yenile (rate limit önleme)
        if (this.deletedCount % 10 === 0 && this.deletedCount > 0) {
          console.log('\n   🔄 Sayfa yenileniyor...\n');
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForTimeout(3000);
        }

      } catch (error) {
        console.error('❌ Yanıt silme hatası:', error.message);
        attemptCount++;
        
        // Hata durumunda sayfayı yenile
        if (attemptCount % 5 === 0) {
          console.log('   🔄 Hata sonrası sayfa yenileniyor...');
          await this.page.reload({ waitUntil: 'domcontentloaded' });
          await this.page.waitForTimeout(3000);
        }
      }
    }

    console.log(`\n✅ İşlem tamamlandı! Toplam ${this.deletedCount} yanıt silindi.`);
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
  const deleter = new TwitterReplyDeleter();
  
  try {
    await deleter.initialize();
    await deleter.login();
    await deleter.goToReplies();
    
    // Maksimum silinecek yanıt sayısı (argümandan veya default 1000)
    const maxReplies = parseInt(process.argv[2]) || 1000;
    
    console.log(`\n⚠️  ${maxReplies} yanıt silinecek. Devam etmek için 5 saniye bekleniyor...\n`);
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await deleter.deleteReplies(maxReplies);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  } finally {
    await deleter.close();
  }
}

main();
