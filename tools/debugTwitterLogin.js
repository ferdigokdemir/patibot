import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function debugTwitterLogin() {
  console.log('🔍 Twitter giriş debug başlıyor...\n');
  
  const browser = await chromium.launch({
    headless: false,
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
  
  const username = process.env.PATIBOT_TWITTER_USERNAME;
  const password = process.env.PATIBOT_TWITTER_PASSWORD;
  const email = process.env.PATIBOT_TWITTER_EMAIL;
  
  console.log(`👤 Kullanıcı: ${username}`);
  console.log(`📧 Email: ${email}\n`);
  
  try {
    // 1. Login sayfasına git
    console.log('📱 ADIM 1: Login sayfasına gidiliyor...');
    await page.goto('https://twitter.com/i/flow/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    
    await page.waitForTimeout(3000);
    
    // Login sayfası HTML kaydet
    let html = await page.content();
    fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-step1.html'), html);
    await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-step1.png') });
    console.log('💾 Step 1 kaydedildi\n');
    
    // Butonları listele
    const step1Buttons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      return Array.from(buttons).map((btn, i) => ({
        index: i,
        text: btn.textContent?.trim().substring(0, 50),
        testId: btn.getAttribute('data-testid'),
        type: btn.type,
        disabled: btn.disabled
      }));
    });
    console.log('🔘 Step 1 Butonlar:', JSON.stringify(step1Buttons, null, 2));
    
    // 2. Kullanıcı adı inputunu bekle ve bul
    console.log('\n📱 ADIM 2: Kullanıcı adı giriliyor...');
    
    // Input'u bekle
    await page.waitForSelector('input[autocomplete="username"]', { timeout: 15000 });
    await page.waitForTimeout(1000);
    
    // Focus ver ve yaz
    const usernameInput = await page.$('input[autocomplete="username"]');
    await usernameInput.click();
    await page.waitForTimeout(500);
    
    // Önce temizle
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    
    // Yavaşça yaz
    await page.keyboard.type(username, { delay: 100 });
    await page.waitForTimeout(1000);
    
    // Kullanıcı adı sonrası HTML kaydet
    html = await page.content();
    fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-step2-before-next.html'), html);
    await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-step2-before-next.png') });
    console.log('💾 Step 2 (before next) kaydedildi');
    
    // 3. İleri butonunu bul ve tıkla
    console.log('\n📱 ADIM 3: İleri butonuna tıklanıyor...');
    
    // Tüm butonları analiz et
    const allButtons = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button[role="button"]');
      return Array.from(buttons).map((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const style = window.getComputedStyle(btn);
        return {
          index: i,
          text: btn.textContent?.trim(),
          testId: btn.getAttribute('data-testid'),
          bgColor: style.backgroundColor,
          visible: rect.width > 0 && rect.height > 0,
          disabled: btn.disabled,
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
        };
      });
    });
    
    console.log('🔘 Tüm butonlar:');
    allButtons.forEach(btn => {
      if (btn.visible) {
        console.log(`   ${btn.index}. "${btn.text}" | testId: ${btn.testId} | bg: ${btn.bgColor} | disabled: ${btn.disabled}`);
      }
    });
    
    // Next/İleri butonunu bul - farklı yöntemler dene
    let nextClicked = false;
    
    // Yöntem 1: data-testid ile
    const loginNextButton = await page.$('button[data-testid="LoginForm_Login_Button"]');
    if (loginNextButton) {
      console.log('   ✅ LoginForm_Login_Button bulundu');
    }
    
    // Yöntem 2: Text içeriğine göre
    const nextButtonByText = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button[role="button"]'));
      for (const btn of buttons) {
        const text = btn.textContent?.trim().toLowerCase();
        if (text === 'next' || text === 'ileri' || text === 'sonraki') {
          const rect = btn.getBoundingClientRect();
          return { found: true, x: rect.x + rect.width/2, y: rect.y + rect.height/2 };
        }
      }
      // Siyah arka planlı buton
      for (const btn of buttons) {
        const style = window.getComputedStyle(btn);
        if (style.backgroundColor === 'rgb(15, 20, 25)' || style.backgroundColor === 'rgb(239, 243, 244)') {
          const rect = btn.getBoundingClientRect();
          if (rect.width > 50 && rect.height > 30) {
            return { found: true, x: rect.x + rect.width/2, y: rect.y + rect.height/2, bg: style.backgroundColor };
          }
        }
      }
      return { found: false };
    });
    
    console.log('   Next buton arama sonucu:', nextButtonByText);
    
    // Tıklama dene
    if (nextButtonByText.found) {
      console.log(`   🖱️ Koordinatlara tıklanıyor: (${nextButtonByText.x}, ${nextButtonByText.y})`);
      await page.mouse.click(nextButtonByText.x, nextButtonByText.y);
      nextClicked = true;
    } else {
      // Alternatif: Enter tuşu
      console.log('   ⌨️ Enter tuşuna basılıyor...');
      await page.keyboard.press('Enter');
      nextClicked = true;
    }
    
    await page.waitForTimeout(3000);
    
    // Tıklama sonrası HTML kaydet
    html = await page.content();
    fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-step3-after-next.html'), html);
    await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-step3-after-next.png') });
    console.log('💾 Step 3 (after next) kaydedildi\n');
    
    // URL kontrolü
    const currentUrl = page.url();
    console.log(`   📍 Mevcut URL: ${currentUrl}`);
    
    // 4. Email veya şifre adımını kontrol et
    console.log('\n📱 ADIM 4: Sonraki adım kontrol ediliyor...');
    
    // Email input var mı?
    const emailInput = await page.$('input[data-testid="ocfEnterTextTextInput"]');
    if (emailInput) {
      console.log('   📧 Email doğrulaması isteniyor!');
      await emailInput.click();
      await page.waitForTimeout(500);
      await page.keyboard.type(email, { delay: 50 });
      await page.waitForTimeout(1000);
      
      // Email sonrası HTML kaydet
      html = await page.content();
      fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-step4-email.html'), html);
      await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-step4-email.png') });
      
      // İleri butonuna tıkla
      await page.keyboard.press('Enter');
      await page.waitForTimeout(3000);
    }
    
    // Şifre input var mı?
    const passwordInput = await page.$('input[autocomplete="current-password"], input[name="password"], input[type="password"]');
    if (passwordInput) {
      console.log('   🔑 Şifre adımına geçildi!');
      
      html = await page.content();
      fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-step5-password.html'), html);
      await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-step5-password.png') });
      
      await passwordInput.click();
      await page.waitForTimeout(500);
      await page.keyboard.type(password, { delay: 50 });
      await page.waitForTimeout(1000);
      
      // Login butonuna tıkla
      const loginBtn = await page.$('button[data-testid="LoginForm_Login_Button"]');
      if (loginBtn) {
        await loginBtn.click();
      } else {
        await page.keyboard.press('Enter');
      }
      
      await page.waitForTimeout(5000);
    } else {
      console.log('   ❌ Şifre inputu bulunamadı!');
      
      // Mevcut sayfadaki tüm inputları listele
      const allInputs = await page.evaluate(() => {
        const inputs = document.querySelectorAll('input');
        return Array.from(inputs).map((inp, i) => ({
          index: i,
          type: inp.type,
          name: inp.name,
          autocomplete: inp.autocomplete,
          testId: inp.getAttribute('data-testid'),
          placeholder: inp.placeholder
        }));
      });
      console.log('   📝 Sayfadaki inputlar:', JSON.stringify(allInputs, null, 2));
    }
    
    // Final HTML kaydet
    html = await page.content();
    fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-final.html'), html);
    await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-final.png') });
    console.log('\n💾 Final durum kaydedildi');
    
    const finalUrl = page.url();
    console.log(`📍 Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('/home')) {
      console.log('\n✅ GİRİŞ BAŞARILI!');
    } else {
      console.log('\n❌ Giriş tamamlanamadı. Manuel kontrol gerekiyor.');
    }
    
    console.log('\n⏳ Tarayıcı 60 saniye açık kalacak...');
    await page.waitForTimeout(60000);
    
  } catch (error) {
    console.error('\n❌ Hata:', error.message);
    
    const html = await page.content();
    fs.writeFileSync(path.join(process.cwd(), 'temp', 'twitter-login-error.html'), html);
    await page.screenshot({ path: path.join(process.cwd(), 'temp', 'twitter-login-error.png') });
    console.log('💾 Hata durumu kaydedildi');
    
  } finally {
    await browser.close();
  }
}

debugTwitterLogin();
