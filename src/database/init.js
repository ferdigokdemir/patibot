import { initDatabase } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('🔧 Veritabanı başlatılıyor...');
initDatabase();
console.log('✅ Veritabanı hazır!');

