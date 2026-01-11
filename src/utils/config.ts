/**
 * Configuration de l'application
 * Centralise toutes les variables d'environnement et configurations
 */

export const appConfig = {
  // Nom de l'application depuis les variables d'environnement
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Cineo',

  // URL de l'API Backend
  apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || '',

  // Autres configurations peuvent être ajoutées ici
  version: '1.0.0',
  description: `Découvrez ${process.env.NEXT_PUBLIC_APP_NAME || 'Cineo'}, la plateforme de streaming définitive. Accédez à une vaste bibliothèque de films, séries exclusives et chaînes TV en direct. Profitez d un divertissement illimité en ultra haute définition, sans publicité et multi-écrans. Rejoignez la révolution du streaming dès aujourd hui.`,
  // Liens des réseaux sociaux
  socials: {
    whatsapp: process.env.NEXT_PUBLIC_SOCIAL_WHATSAPP || '',
    telegram: process.env.NEXT_PUBLIC_SOCIAL_TELEGRAM || '',
    discord: process.env.NEXT_PUBLIC_SOCIAL_DISCORD || '',
    reddit: process.env.NEXT_PUBLIC_SOCIAL_REDDIT || ''
  }
};

// Export direct des configurations pour faciliter l'utilisation
export const APP_NAME = appConfig.appName;
export const API_BASE_URL = appConfig.apiBaseUrl;
export const SOCIAL_LINKS = appConfig.socials;
export const APP_DESCRIPTION = appConfig.description;

/**
 * Construit une URL API complète avec des paramètres de requête
 * @param path Chemin de l'endpoint (ex: '/api/proxy/stream')
 * @param params Objet contenant les paramètres de requête (ex: { url: '...' })
 * @returns URL complète
 */
export const buildApiUrlWithParams = (path: string, params: Record<string, string | number | boolean | undefined | null>) => {
  const url = new URL(path, API_BASE_URL);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
};