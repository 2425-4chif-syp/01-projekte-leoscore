import { appRoutes } from './app.routes'; // Importiere die Routen

export const AppConfig = {
  // API-Konfiguration
  apiBaseUrl: 'https://sportapi7.p.rapidapi.com/api', // Basis-URL für die API
  apiKey: 'e76819293dmsh626ac597282e32fp1e0d70jsn625395f58aea', // API-Key

  // Routen (optional, falls global benötigt)
  routes: appRoutes, // Zugriff auf die Routen
};
