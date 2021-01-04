'use strict';
const ENT = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '/': '&#x2F;' };
function escapeHtml(s) { return String(s).replace(/[&<>"'/]/g, c => ENT[c]); }
function stripTags(s, a = []) { if (!a.length) return String(s).replace(/<[^>]*>/g, ''); const t = a.map(x => x.toLowerCase()); return String(s).replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (m, x) => t.includes(x.toLowerCase()) ? m : ''); }
function slugify(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function normalizeEmail(e) { const [l, d] = String(e).trim().toLowerCase().split('@'); if (!l || !d) return e; let n = l.replace(/\+.*$/, ''); if (['gmail.com','googlemail.com'].includes(d)) n = n.replace(/\./g, ''); return n + '@' + d; }
function trim(s) { return String(s).trim(); }
function toLowerCase(s) { return String(s).toLowerCase(); }
function toNumber(s) { const n = Number(s); return isNaN(n) ? 0 : n; }
function toBoolean(s) { return ['true','1','yes','on'].includes(String(s).toLowerCase()); }
function truncate(s, l = 100) { s = String(s); return s.length > l ? s.slice(0, l) + '...' : s; }
const SANITIZERS = { escapeHtml, stripTags, slugify, normalizeEmail, trim, toLowerCase, toNumber, toBoolean, truncate };
function sanitize(data, rules) { const r = { ...data }; for (const [f, fns] of Object.entries(rules)) { if (r[f] === undefined) continue; const list = typeof fns === 'string' ? fns.split('|') : fns; for (const fn of list) { const s = typeof fn === 'function' ? fn : SANITIZERS[typeof fn === 'string' ? fn.trim() : fn]; if (s) r[f] = s(r[f]); } } return r; }
module.exports = { sanitize, escapeHtml, stripTags, slugify, normalizeEmail, trim, toLowerCase, toNumber, toBoolean, truncate, SANITIZERS };