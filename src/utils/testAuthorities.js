#!/usr/bin/env node

/**
 * Yetkili etiketleme sistemini test et
 */

import { getRelevantAuthorities, getAuthoritiesText } from '../data/authorities.js';

console.log('🧪 Yetkili Etiketleme Sistemi Test\n');
console.log('═'.repeat(60));

// Test senaryoları
const testCases = [
  {
    city: 'İstanbul',
    district: 'Kadıköy',
    description: 'Büyükşehir + ilçe belediyesi'
  },
  {
    city: 'İstanbul',
    district: null,
    description: 'Sadece büyükşehir'
  },
  {
    city: 'Ankara',
    district: 'Çankaya',
    description: 'Başkent + ilçe'
  },
  {
    city: 'İzmir',
    district: 'Karşıyaka',
    description: 'Büyükşehir + ilçe'
  },
  {
    city: 'Balıkesir',
    district: null,
    description: 'İl belediyesi (büyükşehir değil)'
  },
  {
    city: 'Çanakkale',
    district: null,
    description: 'İl belediyesi'
  },
  {
    city: null,
    district: null,
    description: 'Şehir bilinmiyor'
  },
  {
    city: 'Antalya',
    district: 'Muratpaşa',
    description: 'Turizm şehri + ilçe'
  },
  {
    city: 'Bursa',
    district: 'Nilüfer',
    description: 'Sanayi şehri'
  }
];

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. TEST: ${testCase.description}`);
  console.log(`   Şehir: ${testCase.city || 'Bilinmiyor'}`);
  console.log(`   İlçe: ${testCase.district || 'Bilinmiyor'}`);
  
  const authorities = getRelevantAuthorities(testCase.city, testCase.district);
  const text = getAuthoritiesText(testCase.city, testCase.district);
  
  console.log(`\n   📱 Twitter Etiketleri:`);
  console.log(`   ${authorities.join(' ')}`);
  
  console.log(`\n   📝 Açıklama:`);
  console.log(`   ${text}`);
  
  console.log('\n' + '─'.repeat(60));
});

console.log('\n✅ Test tamamlandı!\n');
console.log('💡 Bu sistem otomatik olarak:');
console.log('   • İlgili belediye(ler)i etiketler');
console.log('   • Devlet kurumlarını etiketler');
console.log('   • CİMER\'i etiketler');
console.log('   • Tweet 280 karakter limitine uyar\n');

