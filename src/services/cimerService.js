import geminiService from './geminiService.js';

class CimerService {
  /**
   * Olay için CİMER şikayet formatı oluştur
   */
  async createCimerReport(incident) {
    try {
      const cimerData = await geminiService.generateCimerReport({
        location: incident.location,
        city: incident.city,
        district: incident.district,
        incident_date: incident.incident_date,
        animal_type: incident.animal_type,
        description: incident.description
      });

      return cimerData;
    } catch (error) {
      console.error('❌ CİMER rapor oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * CİMER raporunu metin formatında döndür
   */
  formatCimerText(cimerReport, incident, sourceTweetUrl = null) {
    let text = `
═══════════════════════════════════════════════════════════════
                    CİMER ŞİKAYET FORMU
═══════════════════════════════════════════════════════════════

BAŞLIK:
${cimerReport.baslik}

KATEGORİ:
${cimerReport.kategori}

KONUM BİLGİSİ:
`;

    if (incident.city) {
      text += `Şehir: ${incident.city}\n`;
    }
    if (incident.district) {
      text += `İlçe: ${incident.district}\n`;
    }
    if (incident.location) {
      text += `Detaylı Konum: ${incident.location}\n`;
    }
    if (incident.latitude && incident.longitude) {
      text += `Koordinatlar: ${incident.latitude}, ${incident.longitude}\n`;
      text += `Google Maps: https://maps.google.com/?q=${incident.latitude},${incident.longitude}\n`;
    }

    text += `
AÇIKLAMA:
${cimerReport.aciklama}
`;

    // Kaynak tweet linki varsa ekle
    if (sourceTweetUrl) {
      text += `
KAYNAK TWEET:
${sourceTweetUrl}
`;
    }

    text += `
═══════════════════════════════════════════════════════════════

CİMER'E BAŞVURU İÇİN:
Web: https://www.cimer.gov.tr/
Telefon: 150

Bu formu kopyalayarak CİMER sistemine manuel olarak girebilirsiniz.

═══════════════════════════════════════════════════════════════
`;

    return text;
  }

  /**
   * Tüm olay için tam CİMER paketi oluştur
   */
  async generateFullCimerPackage(incident, sourceTweetUrl = null) {
    try {
      const cimerReport = await this.createCimerReport(incident);
      const cimerText = this.formatCimerText(cimerReport, incident, sourceTweetUrl);
      
      return {
        report: cimerReport,
        formatted_text: cimerText,
        cimer_url: 'https://www.cimer.gov.tr/',
        incident_id: incident.id
      };
    } catch (error) {
      console.error('❌ CİMER paketi oluşturma hatası:', error);
      throw error;
    }
  }

  /**
   * Kısa özet (Twitter için)
   */
  generateShortSummary(cimerReport) {
    return `📋 CİMER Şikayet Hazır\n\n${cimerReport.baslik}\n\nDetaylar için CİMER: https://www.cimer.gov.tr/`;
  }
}

export default new CimerService();

