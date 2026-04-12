import * as en from './languages/en.json';
import * as uk from './languages/uk.json';
import * as ro from './languages/ro.json';
import * as de from './languages/de.json';
import * as ru from './languages/ru.json';
import * as zh from './languages/zh.json';
import * as pl from './languages/pl.json';
import * as es from './languages/es.json';
import * as fr from './languages/fr.json';
import { globalData } from '../helpers/globals';

const languages: any = {
  en: en,
  uk: uk,
  ro: ro,
  de: de,
  ru: ru,
  zh: zh,
  pl: pl,
  es: es,
  fr: fr,
};

export function localize(string: string, search = '', replace = '') {
  try {    
    let forcedLang = (globalData as { cardConfig?: { language?: string } }).cardConfig?.language;

    let langFromLocalStorage = localStorage.getItem('selectedLanguage');
    if (langFromLocalStorage === null)
      langFromLocalStorage = localStorage.getItem('assist_debug_language');
    if (langFromLocalStorage === null)
      langFromLocalStorage = localStorage.getItem('editor-language');
    if (langFromLocalStorage === null)
      langFromLocalStorage = 'en';
    langFromLocalStorage = langFromLocalStorage
      .replace(/['"]+/g, '')
      .replace('-', '_');

    const hassLang =
      globalData.hass?.selectedLanguage ||
      globalData.hass?.locale?.language ||
      globalData.hass?.language;

    const lang =
      forcedLang && forcedLang !== 'auto'
        ? forcedLang
        : hassLang || langFromLocalStorage;

    let translated: string;

    try {
      translated = string?.split('.').reduce((o, i) => o[i], languages[lang]);
    } catch (e) {
      translated = string?.split('.')?.reduce((o, i) => o[i], languages['en']);
    }

    if (translated === undefined) {
      translated = string?.split('.')?.reduce((o, i) => o[i], languages['en']);
    }

    if (search !== '' && replace !== '') {
      translated = translated.replace(search, replace);
    }
    return translated;
  } catch (e) {
    return string
  }
}
