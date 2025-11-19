import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/patibot.db');

export const db = new Database(dbPath);

// Veritabanı tablolarını oluştur
export function initDatabase() {
  // Tweets tablosu - Twitter'dan toplanan tweetler
  db.exec(`
    CREATE TABLE IF NOT EXISTS tweets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id TEXT UNIQUE NOT NULL,
      author_username TEXT NOT NULL,
      author_name TEXT,
      text TEXT NOT NULL,
      created_at TEXT NOT NULL,
      retweet_count INTEGER DEFAULT 0,
      like_count INTEGER DEFAULT 0,
      collected_at TEXT DEFAULT CURRENT_TIMESTAMP,
      is_analyzed BOOLEAN DEFAULT 0,
      is_relevant BOOLEAN DEFAULT 0,
      analysis_result TEXT
    )
  `);

  // Incidents tablosu - Analiz edilen gerçek saldırı olayları
  db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id TEXT REFERENCES tweets(tweet_id),
      location TEXT,
      city TEXT,
      district TEXT,
      latitude REAL,
      longitude REAL,
      incident_date TEXT,
      description TEXT NOT NULL,
      severity TEXT, -- low, medium, high
      animal_type TEXT, -- köpek, kedi, vb.
      animal_count INTEGER,
      victim_info TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      cimer_status TEXT DEFAULT 'pending', -- pending, generated, posted
      twitter_posted BOOLEAN DEFAULT 0,
      patibot_tweet_id TEXT
    )
  `);

  // Analysis logs - AI analiz logları
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tweet_id TEXT REFERENCES tweets(tweet_id),
      analysis_type TEXT,
      ai_response TEXT,
      tokens_used INTEGER,
      duration_ms INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bot stats - Bot istatistikleri
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scan_date TEXT DEFAULT CURRENT_TIMESTAMP,
      tweets_collected INTEGER DEFAULT 0,
      tweets_analyzed INTEGER DEFAULT 0,
      incidents_found INTEGER DEFAULT 0,
      tweets_posted INTEGER DEFAULT 0,
      errors INTEGER DEFAULT 0
    )
  `);

  console.log('✅ Veritabanı tabloları oluşturuldu');
}

// Tweet kaydetme
export function saveTweet(tweetData) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO tweets 
    (tweet_id, author_username, author_name, text, created_at, retweet_count, like_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    tweetData.id,
    tweetData.author_username,
    tweetData.author_name,
    tweetData.text,
    tweetData.created_at,
    tweetData.retweet_count || 0,
    tweetData.like_count || 0
  );
}

// Tweet analiz sonucunu güncelle
export function updateTweetAnalysis(tweetId, isRelevant, analysisResult) {
  const stmt = db.prepare(`
    UPDATE tweets 
    SET is_analyzed = 1, is_relevant = ?, analysis_result = ?
    WHERE tweet_id = ?
  `);
  
  return stmt.run(isRelevant ? 1 : 0, JSON.stringify(analysisResult), tweetId);
}

// Incident kaydet
export function saveIncident(incidentData) {
  const stmt = db.prepare(`
    INSERT INTO incidents 
    (tweet_id, location, city, district, latitude, longitude, incident_date, 
     description, severity, animal_type, animal_count, victim_info)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    incidentData.tweet_id,
    incidentData.location,
    incidentData.city,
    incidentData.district,
    incidentData.latitude,
    incidentData.longitude,
    incidentData.incident_date,
    incidentData.description,
    incidentData.severity,
    incidentData.animal_type,
    incidentData.animal_count,
    incidentData.victim_info
  );
}

// Incident'ı güncelle
export function updateIncident(incidentId, updates) {
  const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
  const values = Object.values(updates);
  
  const stmt = db.prepare(`
    UPDATE incidents SET ${fields} WHERE id = ?
  `);
  
  return stmt.run(...values, incidentId);
}

// Analiz edilmemiş tweetleri getir
export function getUnanalyzedTweets(limit = 50) {
  const stmt = db.prepare(`
    SELECT * FROM tweets 
    WHERE is_analyzed = 0 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

// Son olayları getir
export function getRecentIncidents(limit = 20) {
  const stmt = db.prepare(`
    SELECT * FROM incidents 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  
  return stmt.all(limit);
}

// Paylaşılmamış olayları getir
export function getUnpostedIncidents() {
  const stmt = db.prepare(`
    SELECT i.*, t.author_username, t.tweet_id as source_tweet_id
    FROM incidents i
    LEFT JOIN tweets t ON i.tweet_id = t.tweet_id
    WHERE i.twitter_posted = 0 
    ORDER BY i.created_at DESC
  `);
  
  return stmt.all();
}

// İstatistik kaydet
export function saveBotStats(stats) {
  const stmt = db.prepare(`
    INSERT INTO bot_stats 
    (tweets_collected, tweets_analyzed, incidents_found, tweets_posted, errors)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  return stmt.run(
    stats.tweets_collected || 0,
    stats.tweets_analyzed || 0,
    stats.incidents_found || 0,
    stats.tweets_posted || 0,
    stats.errors || 0
  );
}

export default db;

