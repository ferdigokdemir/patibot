/**
 * Tweet formatlamak için utility fonksiyon
 * Twitter Premium: 4000 karakter limiti
 */
export function formatIncidentTweet(incident, authorities = [], sourceTweetUrl = null, cimerReport = null) {
  // Twitter Premium - 4000 karakter limiti
  const MAX_TWEET_LENGTH = 4000;
  
  let tweet = `🚨 Sokak Hayvanı Saldırı Bildirimi\n\n`;
  
  // Konum bilgisi
  if (incident.city && incident.district) {
    tweet += `📍 ${incident.city} / ${incident.district}\n`;
  } else if (incident.city) {
    tweet += `📍 ${incident.city}\n`;
  } else if (incident.location) {
    tweet += `📍 ${incident.location}\n`;
  }
  
  // Tarih
  if (incident.incident_date) {
    const date = new Date(incident.incident_date);
    tweet += `📅 ${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\n`;
  }
  
  tweet += `\n`;
  
  // Açıklama (tam)
  let description = incident.description || '';
  tweet += `${description}\n\n`;
  
  // Konum linki
  if (incident.latitude && incident.longitude) {
    tweet += `🗺️ https://maps.google.com/?q=${incident.latitude},${incident.longitude}\n\n`;
  }
  
  // Kaynak tweet linki
  if (sourceTweetUrl) {
    tweet += `🔗 Kaynak: ${sourceTweetUrl}\n\n`;
  }
  
  // Yetkilileri etiketle
  if (authorities && authorities.length > 0) {
    tweet += authorities.join(' ') + '\n\n';
  }
  
  // Hashtag'ler
  tweet += `#SokakHayvanları #CİMER #PatiBot`;
  
  // CİMER raporu ekle (Premium ile 4000 karakter)
  if (cimerReport) {
    tweet += `\n\n${'─'.repeat(30)}\n\n`;
    tweet += `📋 CİMER ŞİKAYET METNİ:\n\n`;
    tweet += cimerReport;
  }
  
  // 4000 karakter kontrolü
  if (tweet.length > MAX_TWEET_LENGTH) {
    // CİMER raporunu kısalt
    const availableForCimer = MAX_TWEET_LENGTH - (tweet.length - (cimerReport?.length || 0)) - 50;
    if (cimerReport && availableForCimer > 200) {
      const truncatedCimer = cimerReport.substring(0, availableForCimer) + '...';
      tweet = tweet.replace(cimerReport, truncatedCimer);
    }
  }
  
  return tweet;
}

