// Polyfill Node with `Intl` that has data for all locales.
// See: https://formatjs.io/guides/runtime-environments/#server
const IntlPolyfill = require('intl');
Intl.NumberFormat = IntlPolyfill.NumberFormat;
Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;

const fs = require('fs');
const path = require('path');

const glob = require('glob');
const accepts = require('accepts');

const logger = require('./logger');

// Get the supported languages by looking for translations in the `lang/` dir.
const languages = [
  'en', // Ensure English is always first in the list
  ...glob
    .sync(path.join(__dirname, '../lang/*.json'))
    .map(f => path.basename(f, '.json'))
    .filter(locale => locale !== 'en'),
];

// We need to expose React Intl's locale data on the request for the user's
// locale. This function will also cache the scripts by lang in memory.
const localeDataCache = new Map();

function getLocaleDataScript(locale = 'en') {
  const lang = locale.split('-')[0];
  if (!localeDataCache.has(lang)) {
    const localeDataFile = require.resolve(`@formatjs/intl-relativetimeformat/dist/locale-data/${lang}`);
    const localeDataScript = fs.readFileSync(localeDataFile, 'utf8');
    localeDataCache.set(lang, localeDataScript);
  }
  return localeDataCache.get(lang);
}

// We need to load and expose the translations on the request for the user's
// locale. These will only be used in production, in dev the `defaultMessage` in
// each message description in the source code will be used.
function getMessages(locale) {
  const localeFile = path.join(__dirname, `../lang/${locale}.json`);
  return require(localeFile);
}

function middleware() {
  return (req, res, next) => {
    // console.log(`Language Parser in: ${req.originalUrl}`);
    if (req.query.language && languages.includes(req.query.language)) {
      // Detect language as query string in the URL
      req.language = req.query.language;
    } else if (req.cookies.language && languages.includes(req.cookies.language)) {
      // Detect language in Cookie
      req.language = req.cookies.language;
    }

    req.locale = req.language || accepts(req).language(languages) || 'en';
    logger.debug('url %s locale %s', req.url, req.locale);
    req.localeDataScript = getLocaleDataScript(req.locale);
    req.messages = getMessages(req.locale);
    next();
  };
}

module.exports = { middleware, getMessages, languages };
