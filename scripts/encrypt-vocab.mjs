#!/usr/bin/env node
/**
 * Verschlüsselt den Wortschatz für die Veröffentlichung.
 *
 *   npm run encrypt                         # liest ../Resources/latein_lektionen_1-11.json
 *   npm run encrypt -- pfad/zur/datei.json  # andere Quelldatei
 *
 * Das Passwort wird abgefragt (oder per Umgebungsvariable LATEIN_PASSWORD übergeben).
 * Ergebnis: public/vocab.enc.json – nur diese Datei kommt ins Repository.
 *
 * Wird eine vorhandene vocab.enc.json gefunden, wird deren Salt wiederverwendet.
 * So bleibt der Schlüssel bei gleichem Passwort gleich, und auf dem iPad muss das
 * Passwort nach einem Update NICHT erneut eingegeben werden.
 * Mit --new-salt (z. B. bei Passwortwechsel) wird ein neuer Salt erzeugt.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash, webcrypto as wc } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const newSalt = args.includes('--new-salt');
const src = resolve(args.find((a) => !a.startsWith('--')) ?? resolve(root, '../Resources/latein_lektionen_1-11.json'));
const out = resolve(root, 'public/vocab.enc.json');
const ITER = 310000;

function ask(q, hidden) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(s); else rl.output.write('*'); };
    }
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write('\n'); res(a); });
  });
}

const plainText = readFileSync(src, 'utf8');
JSON.parse(plainText); // Validierung
let password = process.env.LATEIN_PASSWORD;
if (!password) {
  password = await ask('Familien-Passwort: ', true);
  const again = await ask('Passwort wiederholen: ', true);
  if (password !== again) { console.error('Die Passwörter stimmen nicht überein.'); process.exit(1); }
}
if (!password || password.length < 6) { console.error('Bitte mindestens 6 Zeichen verwenden.'); process.exit(1); }

let salt;
if (!newSalt && existsSync(out)) {
  try { salt = Buffer.from(JSON.parse(readFileSync(out, 'utf8')).salt, 'base64'); } catch { /* neu */ }
}
salt ??= Buffer.from(wc.getRandomValues(new Uint8Array(16)));

const base = await wc.subtle.importKey('raw', new TextEncoder().encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
const bits = await wc.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITER }, base, 256);
const key = await wc.subtle.importKey('raw', bits, 'AES-GCM', false, ['encrypt']);
const iv = wc.getRandomValues(new Uint8Array(12));
const ct = await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plainText));

const enc = {
  format: 'latein-enc-1',
  kdf: 'PBKDF2-SHA256',
  iter: ITER,
  salt: Buffer.from(salt).toString('base64'),
  iv: Buffer.from(iv).toString('base64'),
  ct: Buffer.from(ct).toString('base64'),
  contentId: createHash('sha256').update(plainText).digest('hex').slice(0, 16),
};
writeFileSync(out, JSON.stringify(enc));
console.log(`✓ ${out} geschrieben (Quelle: ${src})`);
