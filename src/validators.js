'use strict';
const { getMessage } = require('./messages');
const RULES = {
  required: (v) => v !== undefined && v !== null && v !== '',
  email: (v) => /^[^@s]+@[^@s]+.[^@s]+$/.test(v),
  url: (v) => { try { new URL(v); return true; } catch { return false; } },
  minLength: (v, n) => typeof v === 'string' && v.length >= n,
  maxLength: (v, n) => typeof v === 'string' && v.length <= n,
  min: (v, n) => Number(v) >= n,
  max: (v, n) => Number(v) <= n,
  integer: (v) => Number.isInteger(Number(v)) && !isNaN(v),
  numeric: (v) => !isNaN(v) && !isNaN(parseFloat(v)),
  alpha: (v) => /^[a-zA-Z]+$/.test(v),
  alphanumeric: (v) => /^[a-zA-Z0-9]+$/.test(v),
  phone: (v) => /^\+?[0-9\s\-().]{7,20}$/.test(v),
  creditCard: (v) => {
    const d = String(v).replace(/\D/g, '');
    if (d.length < 13 || d.length > 19) return false;
    let sum = 0, alt = false;
    for (let i = d.length - 1; i >= 0; i--) {
      let n = parseInt(d[i], 10);
      if (alt) { n *= 2; if (n > 9) n -= 9; }
      sum += n; alt = !alt;
    }
    return sum % 10 === 0;
  },
  uuid: (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v),
  ip: (v) => /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(v),
  date: (v) => !isNaN(Date.parse(v)),
  slug: (v) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v),
  hex: (v) => /^[0-9a-fA-F]+$/.test(v),
  json: (v) => { try { JSON.parse(v); return true; } catch { return false; } },
  equals: (v, expected) => v === expected,
  oneOf: (v, list) => (Array.isArray(list) ? list : list.split(',')).includes(v),
  matches: (v, pattern) => new RegExp(pattern).test(v),
  strongPassword: (v) => typeof v === 'string' && v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^a-zA-Z0-9]/.test(v),
};
function validate(data, rules, opts = {}) {
  const errors = {};
  for (const [field, fr] of Object.entries(rules)) {
    const value = field.split('.').reduce((o, k) => o && o[k], data);
    const rl = typeof fr === 'string' ? fr.split('|').map(parseRule) : fr;
    const fe = validateField(value, rl, { ...opts, field });
    if (fe.length > 0) { errors[field] = fe; if (opts.abortEarly) break; }
  }
  return { valid: Object.keys(errors).length === 0, errors };
}
function validateField(value, rules, opts = {}) {
  const errors = [];
  const rl = typeof rules === 'string' ? rules.split('|').map(parseRule) : rules;
  for (const rule of rl) {
    const { name, params } = typeof rule === 'string' ? parseRule(rule) : rule;
    if (name === 'required') { if (!RULES.required(value)) errors.push(getMessage(name, opts.field, params)); continue; }
    if (value === undefined || value === null || value === '') continue;
    const v = RULES[name];
    if (v && !v(value, ...params)) errors.push(getMessage(name, opts.field, params));
  }
  return errors;
}
function parseRule(s) { const [n, p] = s.split(':'); return { name: n.trim(), params: p ? p.split(',').map(x => isNaN(x) ? x.trim() : Number(x.trim())) : [] }; }
module.exports = { validate, validateField, RULES };