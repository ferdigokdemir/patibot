/**
 * Tweet formatlamak için utility fonksiyon
 */
export function formatIncidentTweet(incident, authorities = [], sourceTweetUrl = null) {
  let tweet = `🚨 Sokak Hayvanı Saldırı Bildirimi\n\n`;
  
  // Konum bilgisi
  if (incident.city && incident.district) {
    tweet += `📍 ${incident.city} / ${incident.district}\n`;
  } else if (incident.location) {
    tweet += `📍 ${incident.location}\n`;
  }
  
  // Tarih
  if (incident.incident_date) {
    const date = new Date(incident.incident_date);
    tweet += `📅 ${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}\n`;
  }
  
  tweet += `\n`;
  
  // Açıklama (kısaltılmış)
  let description = incident.description;
  const maxDescLength = authorities.length > 0 ? 80 : 120;
  if (description.length > maxDescLength) {
    description = description.substring(0, maxDescLength) + '...';
  }
  tweet += `${description}\n\n`;
  
  // Konum linki
  if (incident.latitude && incident.longitude) {
    tweet += `🗺️ https://maps.google.com/?q=${incident.latitude},${incident.longitude}\n\n`;
  }
  
  // Kaynak tweet linki
  if (sourceTweetUrl) {
    tweet += `🔗 ${sourceTweetUrl}\n\n`;
  }
  
  // Yetkilileri etiketle
  if (authorities && authorities.length > 0) {
    tweet += authorities.join(' ') + '\n\n';
  }
  
  // Hashtag'ler
  tweet += `#SokakHayvanları #CİMER #PatiBot`;
  
  // 280 karakter kontrolü
  if (tweet.length > 280) {
    // Daha da kısalt
    description = incident.description.substring(0, 50) + '...';
    tweet = `🚨 Sokak Hayvanı Saldırısı\n\n`;
    if (incident.city) {
      tweet += `📍 ${incident.city}`;
      if (incident.district) tweet += ` / ${incident.district}`;
      tweet += `\n\n`;
    }
    tweet += `${description}\n\n`;
    
    // Yetkililer (kısaltılmış)
    if (authorities && authorities.length > 0) {
      tweet += authorities.slice(0, 2).join(' ') + '\n\n';
    }
    
    tweet += `#PatiBot #SokakHayvanları`;
  }
  
  return tweet;
}

