// tools/new-license.js
// Usage (run by GitHub Actions):
//   node tools/new-license.js "<Company>" "<Link>" "<Active:true|false>" [OptionalExistingId]
//
// - Generates a 24-char ID if not provided.
// - Ensures unique ID across data/licenses.json.
// - Adds/updates entry and commits via the workflow.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const COMPANY = process.argv[2];
const LINK = process.argv[3];
const ACTIVE_STR = (process.argv[4] || 'true').toLowerCase();
const PROVIDED_ID = process.argv[5] ? String(process.argv[5]).trim() : '';

if (!COMPANY) { console.error('Missing Company'); process.exit(1); }
if (!LINK && ACTIVE_STR === 'true') { console.error('Active licenses need a Link'); process.exit(1); }
const ACTIVE = ACTIVE_STR === 'true';

const DATA_FILE = path.join('data', 'licenses.json');

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    return { updated: new Date().toISOString(), items: [] };
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try { return JSON.parse(raw); }
  catch (e) { console.error('licenses.json is invalid JSON'); process.exit(1); }
}

function saveDb(db) {
  db.updated = new Date().toISOString();
  // sort by Company then LicenseId for readability
  db.items.sort((a, b) => (a.Company||'').localeCompare(b.Company||'') || a.LicenseId.localeCompare(b.LicenseId));
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2) + '\n', 'utf8');
}

function genId24() {
  // 18 bytes -> base32 (Crockford-like) to ~29 chars; we’ll map to a safe alphabet and trim to 24.
  const alphabet = 'ABCDEFGHJKMNPQRSTUWXYZ23456789'; // no 0/O/I/L/V to avoid confusion
  const buf = crypto.randomBytes(32);
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out.slice(0, 24);
}

function uniqueId(existing) {
  let id;
  let tries = 0;
  do {
    id = PROVIDED_ID || genId24();
    tries++;
    if (tries > 50) { console.error('Could not generate unique ID'); process.exit(1); }
  } while (existing.has(id));
  return id;
}

(function main() {
  const db = loadDb();
  const existingIds = new Set((db.items || []).map(x => x.LicenseId));

  const id = uniqueId(existingIds);

  // If the ID already exists and was provided, we’ll update that row; else add a new row.
  const idx = db.items.findIndex(x => x.LicenseId === id);
  const row = {
    LicenseId: id,
    Company: COMPANY,
    Active: ACTIVE,
    Link: ACTIVE ? LINK : ''
  };

  if (idx >= 0) {
    db.items[idx] = row;
    console.log(`Updated existing license: ${id}`);
  } else {
    db.items.push(row);
    console.log(`Created new license: ${id}`);
  }

  saveDb(db);

  // Output the ID so the workflow can print it
  console.log(`::set-output name=license_id::${id}`);
  // Also echo in GitHub Actions new syntax
  console.log(`license_id=${id}`);
})();
