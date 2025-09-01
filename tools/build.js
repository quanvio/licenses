const fs = require('fs');
const path = require('path');

const SRC = path.join('data', 'licenses.json');
const OUT_LICENSES = path.join('data', 'licenses');   // per-id
const OUT_COMPANY  = path.join('data', 'company');    // per-company
const OUT_EXPORT   = path.join('export');             // csv

if (!fs.existsSync(SRC)) throw new Error('data/licenses.json missing');

const db = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const items = Array.isArray(db.items) ? db.items : [];

fs.mkdirSync(OUT_LICENSES, { recursive: true });
fs.mkdirSync(OUT_COMPANY, {  recursive: true });
fs.mkdirSync(OUT_EXPORT,   {  recursive: true });

// Per-ID JSON
for (const it of items) {
  if (!it.LicenseId) continue;
  const p = path.join(OUT_LICENSES, `${it.LicenseId}.json`);
  fs.writeFileSync(p, JSON.stringify(it, null, 2) + '\n', 'utf8');
}

// Per-company JSON
/** @type {Record<string, any[]>} */
const byCo = {};
for (const it of items) {
  const co = (it.Company || 'Unknown').trim();
  byCo[co] ||= [];
  byCo[co].push(it);
}
for (const [co, arr] of Object.entries(byCo)) {
  const safe = co.replace(/[^A-Za-z0-9_-]/g, '_');
  const p = path.join(OUT_COMPANY, `${safe}.json`);
  fs.writeFileSync(p, JSON.stringify({ company: co, count: arr.length, items: arr }, null, 2) + '\n');
}

// CSV export
function csvEscape(s) {
  if (s == null) return '';
  s = String(s);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const headers = ['LicenseId','Company','Active','Link'];
let csv = headers.join(',') + '\n';
for (const it of items) {
  csv += [it.LicenseId, it.Company, it.Active, it.Link].map(csvEscape).join(',') + '\n';
}
fs.writeFileSync(path.join(OUT_EXPORT, 'licenses.csv'), csv, 'utf8');

console.log(`Built ${items.length} licenses, ${Object.keys(byCo).length} companies.`);
