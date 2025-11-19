import { chromium } from 'playwright';
import dotenv from 'dotenv';

dotenv.config();

class TwitterScraper {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.nitterInstance = 'https://nitter.net'; // Nitter instance
  }

  /**
   * Browser'ı başlat
   */
  async initialize() {
    if (this.browser) return;

    console.log('🎭 Playwright browser başlatılıyor...');
    
    // Headless modu .env'den kontrol et
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
    
    console.log('✅ Browser hazır (Nitter kullanılıyor - giriş gerektirmiyor)');
  }

  /**
   * Kullanıcının son tweet'lerini topla (Nitter kullanarak)
   */
  async getUserTweets(username, maxResults = 20) {
    try {
      await this.initialize();

      const cleanUsername = username.replace('@', '');
      const profileUrl = `${this.nitterInstance}/${cleanUsername}`;

      console.log(`📡 @${cleanUsername} hesabının tweet'leri toplanıyor (Nitter)...`);

      await this.page.goto(profileUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      await this.page.waitForTimeout(3000);

      const tweets = [];
      let scrollAttempts = 0;
      const maxScrolls = Math.ceil(maxResults / 10);

      while (tweets.length < maxResults && scrollAttempts < maxScrolls) {
        const newTweets = await this.page.evaluate(() => {
          const tweetElements = document.querySelectorAll('.timeline-item');
          const results = [];

          tweetElements.forEach((tweet) => {
            try {
              // Retweet kontrolü - skip retweets
              const retweetIcon = tweet.querySelector('.retweet-header');
              if (retweetIcon) {
                return;
              }

              // Tweet link ve ID
              const tweetLink = tweet.querySelector('.tweet-link');
              const tweetUrl = tweetLink ? tweetLink.href : '';
              const tweetId = tweetUrl.split('#m')[0].split('/').pop() || '';

              // Kullanıcı bilgileri
              const usernameEl = tweet.querySelector('.username');
              const username = usernameEl ? usernameEl.textContent.replace('@', '') : 'unknown';

              const fullnameEl = tweet.querySelector('.fullname');
              const displayName = fullnameEl ? fullnameEl.textContent : 'Unknown';

              // Tweet metni
              const textEl = tweet.querySelector('.tweet-content');
              const text = textEl ? textEl.textContent.trim() : '';

              // Tarih
              const timeEl = tweet.querySelector('.tweet-date a');
              const datetime = timeEl ? timeEl.title : new Date().toISOString();

              // Metrikler
              const stats = tweet.querySelector('.tweet-stats');
              let replyCount = 0, retweetCount = 0, likeCount = 0;
              
              if (stats) {
                const comments = stats.querySelector('.icon-comment')?.parentElement?.textContent?.trim() || '0';
                const retweets = stats.querySelector('.icon-retweet')?.parentElement?.textContent?.trim() || '0';
                const likes = stats.querySelector('.icon-heart')?.parentElement?.textContent?.trim() || '0';
                
                replyCount = parseInt(comments.replace(/[^0-9]/g, '')) || 0;
                retweetCount = parseInt(retweets.replace(/[^0-9]/g, '')) || 0;
                likeCount = parseInt(likes.replace(/[^0-9]/g, '')) || 0;
              }

              if (tweetId && text && text.length > 10) {
                results.push({
                  id: tweetId,
                  text: text,
                  created_at: datetime,
                  author_id: username,
                  author_username: username,
                  author_name: displayName,
                  retweet_count: retweetCount,
                  like_count: likeCount,
                  reply_count: replyCount,
                  url: `https://twitter.com/${username}/status/${tweetId}`
                });
              }
            } catch (err) {
              // Skip
            }
          });

          return results;
        });

        newTweets.forEach(tweet => {
          if (!tweets.find(t => t.id === tweet.id)) {
            tweets.push(tweet);
          }
        });

        console.log(`  📊 Toplanan: ${tweets.length}/${maxResults}`);

        if (tweets.length < maxResults && scrollAttempts < maxScrolls - 1) {
          await this.page.evaluate(() => window.scrollBy(0, 1000));
          await this.page.waitForTimeout(2000);
          scrollAttempts++;
        } else {
          break;
        }
      }

      const finalTweets = tweets.slice(0, maxResults);
      console.log(`✅ ${finalTweets.length} tweet toplandı (@${cleanUsername})`);

      // Debug önizleme
      if (process.env.DEBUG === 'true' && finalTweets.length > 0) {
        console.log(`\n   📝 İlk 3 tweet önizlemesi:`);
        finalTweets.slice(0, 3).forEach((tweet, i) => {
          const preview = tweet.text.substring(0, 80).replace(/\n/g, ' ');
          console.log(`   ${i + 1}. ${preview}...`);
        });
      }

      return finalTweets;

    } catch (error) {
      console.error(`❌ @${username} tweet toplama hatası:`, error.message);
      throw error;
    }
  }

  /**
   * Twitter'da arama yap ve tweet'leri topla (Nitter kullanarak)
   */
  async searchTweets(keywords, maxResults = 50) {
    try {
      await this.initialize();

      const searchQuery = keywords.join(' OR ');
      const encodedQuery = encodeURIComponent(searchQuery);
      const searchUrl = `${this.nitterInstance}/search?f=tweets&q=${encodedQuery}`;

      console.log(`🔍 Nitter'da aranıyor: "${searchQuery}"`);
      console.log(`🌐 URL: ${searchUrl}`);

      try {
        await this.page.goto(searchUrl, { 
          waitUntil: 'domcontentloaded',
          timeout: 90000
        });
      } catch (error) {
        console.log('⚠️  Sayfa tam yüklenmedi ama devam ediliyor...');
      }

      await this.page.waitForTimeout(5000);

      const tweets = [];
      let scrollAttempts = 0;
      const maxScrolls = Math.ceil(maxResults / 10);

      console.log(`📜 Tweet'ler toplanıyor...`);

      while (tweets.length < maxResults && scrollAttempts < maxScrolls) {
        const newTweets = await this.page.evaluate(() => {
          const tweetElements = document.querySelectorAll('.timeline-item');
          const results = [];

          tweetElements.forEach((tweet) => {
            try {
              // Retweet kontrolü - skip retweets
              const retweetIcon = tweet.querySelector('.retweet-header');
              if (retweetIcon) {
                return;
              }

              // Tweet link ve ID
              const tweetLink = tweet.querySelector('.tweet-link');
              const tweetUrl = tweetLink ? tweetLink.href : '';
              const tweetId = tweetUrl.split('#m')[0].split('/').pop() || '';

              // Kullanıcı bilgileri
              const usernameEl = tweet.querySelector('.username');
              const username = usernameEl ? usernameEl.textContent.replace('@', '') : 'unknown';

              const fullnameEl = tweet.querySelector('.fullname');
              const displayName = fullnameEl ? fullnameEl.textContent : 'Unknown';

              // Tweet metni
              const textEl = tweet.querySelector('.tweet-content');
              const text = textEl ? textEl.textContent.trim() : '';

              // Tarih
              const timeEl = tweet.querySelector('.tweet-date a');
              const datetime = timeEl ? timeEl.title : new Date().toISOString();

              // Metrikler
              const stats = tweet.querySelector('.tweet-stats');
              let replyCount = 0, retweetCount = 0, likeCount = 0;
              
              if (stats) {
                const comments = stats.querySelector('.icon-comment')?.parentElement?.textContent?.trim() || '0';
                const retweets = stats.querySelector('.icon-retweet')?.parentElement?.textContent?.trim() || '0';
                const likes = stats.querySelector('.icon-heart')?.parentElement?.textContent?.trim() || '0';
                
                replyCount = parseInt(comments.replace(/[^0-9]/g, '')) || 0;
                retweetCount = parseInt(retweets.replace(/[^0-9]/g, '')) || 0;
                likeCount = parseInt(likes.replace(/[^0-9]/g, '')) || 0;
              }

              if (tweetId && text) {
                results.push({
                  id: tweetId,
                  text: text,
                  created_at: datetime,
                  author_id: username,
                  author_username: username,
                  author_name: displayName,
                  retweet_count: retweetCount,
                  like_count: likeCount,
                  reply_count: replyCount,
                  url: `https://twitter.com/${username}/status/${tweetId}`
                });
              }
            } catch (err) {
              // Tweet parse hatası - atla
            }
          });

          return results;
        });

        // Yeni tweet'leri ekle (duplicate kontrolü)
        newTweets.forEach(tweet => {
          if (!tweets.find(t => t.id === tweet.id)) {
            tweets.push(tweet);
          }
        });

        console.log(`  📊 Toplanan: ${tweets.length}/${maxResults}`);

        // Daha fazla tweet gerekiyorsa scroll yap
        if (tweets.length < maxResults) {
          await this.page.evaluate(() => {
            window.scrollBy(0, 1000);
          });
          await this.page.waitForTimeout(2000);
          scrollAttempts++;
        } else {
          break;
        }
      }

      const finalTweets = tweets.slice(0, maxResults);
      console.log(`✅ ${finalTweets.length} tweet toplandı`);
      
      return finalTweets;

    } catch (error) {
      console.error('❌ Nitter scraping hatası:', error);
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
    }
  }

  /**
   * Browser'ı yeniden başlat (memory leak önleme)
   */
  async restart() {
    await this.close();
    await this.initialize();
  }
}

export default new TwitterScraper();

