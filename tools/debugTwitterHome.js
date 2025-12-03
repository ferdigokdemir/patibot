import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function debugTwitterHome() {
  console.log('🔍 Twitter ana sayfa debug başlıyor...\n');
  
  const browser = await chromium.launch({
    headless: false, // Görünür mod
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox'
    ]
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'tr-TR',
    timezoneId: 'Europe/Istanbul'
  });
  
  const page = await context.newPage();
  
  try {
    // 1. Twitter login sayfasına git
    console.log('📱 Twitter login sayfasına gidiliyor...');
    await page.goto('https://twitter.com/i/flow/login', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(3000);
    
    // Kullanıcı adı gir
    const username = process.env.PATIBOT_TWITTER_USERNAME;
    const password = process.env.PATIBOT_TWITTER_PASSWORD;
    const email = process.env.PATIBOT_TWITTER_EMAIL;
    
    console.log(`👤 Kullanıcı adı giriliyor: ${username}`);
    const usernameInput = await page.waitForSelector('input[autocomplete="username"]', { timeout: 10000 });
    await usernameInput.fill(username);
    await page.waitForTimeout(1000);
    
    // İleri butonu
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="button"]'));
      const nextBtn = buttons.find(btn => {
        const style = window.getComputedStyle(btn);
        return style.backgroundColor === 'rgb(15, 20, 25)';
      });
      if (nextBtn) nextBtn.click();
    });
    
    await page.waitForTimeout(3000);
    
    // Email kontrolü
    const emailCheck = await page.$('input[data-testid="ocfEnterTextTextInput"]');
    if (emailCheck && email) {
      console.log('📧 Email doğrulaması isteniyor...');
      await emailCheck.fill(email);
      await page.waitForTimeout(1000);
      
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button[role="button"]'));
        const nextBtn = buttons.find(btn => {
          const text = btn.textContent;
          return text.includes('İleri') || text.includes('Next');
        });
        if (nextBtn) nextBtn.click();
      });
      
      await page.waitForTimeout(3000);
    }
    
    // Şifre gir
    console.log('🔑 Şifre giriliyor...');
    const passwordInput = await page.waitForSelector('input[autocomplete="current-password"]', { timeout: 10000 });
    await passwordInput.fill(password);
    await page.waitForTimeout(1000);
    
    // Login butonuna tıkla
    await page.click('button[data-testid="LoginForm_Login_Button"]');
    
    console.log('⏳ Giriş bekleniyor...');
    await page.waitForTimeout(5000);
    
    // 2. Home sayfasına git
    console.log('\n🏠 Home sayfasına gidiliyor...');
    await page.goto('https://twitter.com/home', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    await page.waitForTimeout(5000);
    
    // 3. HTML'i kaydet
    const html = await page.content();
    const htmlPath = path.join(process.cwd(), 'temp', 'twitter-home.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`\n💾 HTML kaydedildi: ${htmlPath}`);
    
    // 4. Screenshot al
    const screenshotPath = path.join(process.cwd(), 'temp', 'twitter-home.png');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Screenshot kaydedildi: ${screenshotPath}`);
    
    // 5. Tweet input ve buton elementlerini tespit et
    console.log('\n🔍 Tweet elementleri aranıyor...\n');
    
    const elements = await page.evaluate(() => {
      const results = {
        inputs: [],
        buttons: [],
        textareas: []
      };
      
      // Tüm data-testid'leri bul
      const allTestIds = document.querySelectorAll('[data-testid]');
      const testIdSet = new Set();
      allTestIds.forEach(el => {
        testIdSet.add(el.getAttribute('data-testid'));
      });
      
      // Tweet ile ilgili olanları filtrele
      const tweetRelated = Array.from(testIdSet).filter(id => 
        id.toLowerCase().includes('tweet') || 
        id.toLowerCase().includes('post') ||
        id.toLowerCase().includes('compose') ||
        id.toLowerCase().includes('text')
      );
      
      results.tweetTestIds = tweetRelated;
      
      // Input alanlarını bul
      const inputs = document.querySelectorAll('div[contenteditable="true"], div[role="textbox"], textarea');
      inputs.forEach((input, i) => {
        results.inputs.push({
          index: i,
          tagName: input.tagName,
          testId: input.getAttribute('data-testid'),
          role: input.getAttribute('role'),
          contentEditable: input.getAttribute('contenteditable'),
          placeholder: input.getAttribute('placeholder') || input.getAttribute('aria-label'),
          className: input.className?.substring(0, 100)
        });
      });
      
      // Butonları bul
      const buttons = document.querySelectorAll('button[data-testid]');
      buttons.forEach((btn, i) => {
        const testId = btn.getAttribute('data-testid');
        if (testId && (testId.includes('tweet') || testId.includes('post') || testId.includes('Tweet') || testId.includes('Post'))) {
          results.buttons.push({
            index: i,
            testId: testId,
            text: btn.textContent?.substring(0, 50),
            ariaLabel: btn.getAttribute('aria-label'),
            disabled: btn.disabled
          });
        }
      });
      
      return results;
    });
    
    console.log('📝 Tweet ile ilgili data-testid\'ler:');
    elements.tweetTestIds.forEach(id => console.log(`   - ${id}`));
    
    console.log('\n📝 Input alanları:');
    elements.inputs.forEach(input => {
      console.log(`   ${input.index}. ${input.tagName} | testId: ${input.testId} | role: ${input.role} | placeholder: ${input.placeholder}`);
    });
    
    console.log('\n🔘 Tweet butonları:');
    elements.buttons.forEach(btn => {
      console.log(`   ${btn.index}. testId: ${btn.testId} | text: ${btn.text} | disabled: ${btn.disabled}`);
    });
    
    // 6. Sonuçları JSON olarak kaydet
    const jsonPath = path.join(process.cwd(), 'temp', 'twitter-elements.json');
    fs.writeFileSync(jsonPath, JSON.stringify(elements, null, 2));
    console.log(`\n💾 Element bilgileri kaydedildi: ${jsonPath}`);
    
    console.log('\n✅ Debug tamamlandı! Tarayıcı 30 saniye açık kalacak...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    
    // Hata durumunda da HTML kaydet
    try {
      const html = await page.content();
      const htmlPath = path.join(process.cwd(), 'temp', 'twitter-error.html');
      fs.writeFileSync(htmlPath, html);
      console.log(`💾 Hata HTML kaydedildi: ${htmlPath}`);
    } catch (e) {}
    
  } finally {
    await browser.close();
  }
}

debugTwitterHome();
