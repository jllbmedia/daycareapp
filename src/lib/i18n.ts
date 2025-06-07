import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      dashboard: 'Dashboard',
      logout: 'Logout',
      children: 'Children',
      attendance: 'Attendance',
      settings: 'Settings',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      copyright: '© {{year}} Daycare App. All rights reserved.'
    }
  },
  es: {
    translation: {
      dashboard: 'Panel',
      logout: 'Cerrar sesión',
      children: 'Niños',
      attendance: 'Asistencia',
      settings: 'Configuración',
      language: 'Idioma',
      theme: 'Tema',
      light: 'Claro',
      dark: 'Oscuro',
      copyright: '© {{year}} Daycare App. Todos los derechos reservados.'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n; 