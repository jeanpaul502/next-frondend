
export const cleanChannelName = (name: string): string => { 
    if (!name) return '';
    return name 
      // Supprime tous les crochets vides avec ou sans espaces 
      .replace(/\s*\[\s*\]\s*/g, '') 
      // Supprime tous les types de qualité entre crochets 
      .replace(/\s*\[(?:720p|1080p|4K|HD|SD|FHD|UHD|2K|480p|576p|360p)\s*\]/gi, '') 
      // Supprime tous les types de qualité entre parenthèses 
      .replace(/\s*\((?:720p|1080p|4K|HD|SD|FHD|UHD|2K|480p|576p|360p)\s*\)/gi, '') 
      // Supprime tous les types de qualité entre accolades 
      .replace(/\s*\{(?:720p|1080p|4K|HD|SD|FHD|UHD|2K|480p|576p|360p)\s*\}/gi, '') 
      // Supprime Geo-blocked entre crochets 
      .replace(/\s*\[\s*Geo-blocked\s*\]\s*/gi, '') 
      // Supprime tout texte entre crochets 
      .replace(/\s*\[([^\]]*)\]\s*/g, '') 
      // Nettoie les espaces multiples 
      .replace(/\s+/g, ' ') 
      .trim(); 
  };
