'use strict';
let locale = 'en';
const locales = {
  en: { required: '{field} is required', email: '{field} must be a valid email', minLength: '{field} must be at least {0} characters', maxLength: '{field} must be at most {0} characters', min: '{field} must be at least {0}', max: '{field} must be at most {0}', integer: '{field} must be an integer', strongPassword: '{field} must have 8+ chars with upper, lower, number, special', default: '{field} is invalid' },
  fr: { required: '{field} est requis', email: '{field} doit etre un email valide', minLength: '{field} doit contenir au moins {0} caracteres', integer: '{field} doit etre un entier', strongPassword: '{field}: 8+ car. maj, min, chiffre, special', default: '{field} est invalide' }
};
function getMessage(rule, field, params = []) { const msgs = locales[locale] || locales.en; let tpl = msgs[rule] || msgs.default; tpl = tpl.replace('{field}', field || 'Field'); params.forEach((p, i) => { tpl = tpl.replace('{' + i + '}', String(p)); }); return tpl; }
function setLocale(l) { locale = l; }
function registerLocale(n, m) { locales[n] = { ...locales.en, ...m }; }
module.exports = { getMessage, setLocale, registerLocale };