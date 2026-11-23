import type { VocabData } from './types';

/** Format von public/vocab.enc.json (erzeugt mit `npm run encrypt`) */
export interface EncryptedVocab {
  format: 'latein-enc-1';
  kdf: 'PBKDF2-SHA256';
  iter: number;
  salt: string; // base64
  iv: string; // base64
  ct: string; // base64 (AES-256-GCM, inkl. Tag)
  /** Kurzer Hash des Klartexts – zeigt an, ob sich der Wortschatz geändert hat */
  contentId: string;
}

export function b64decode(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function b64encode(b: Uint8Array): string {
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

/** Leitet aus Passwort + Salt den AES-Schlüssel ab und gibt ihn roh zurück (zum lokalen Speichern). */
export async function deriveRawKey(password: string, saltB64: string, iter: number): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey('raw', enc.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: b64decode(saltB64), iterations: iter },
    base,
    256,
  );
  return new Uint8Array(bits);
}

export class WrongPasswordError extends Error {}

export async function decryptVocab(enc: EncryptedVocab, rawKey: Uint8Array): Promise<VocabData> {
  const key = await crypto.subtle.importKey('raw', new Uint8Array(rawKey), 'AES-GCM', false, ['decrypt']);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64decode(enc.iv) }, key, b64decode(enc.ct));
  } catch {
    throw new WrongPasswordError('Falsches Passwort');
  }
  return JSON.parse(new TextDecoder().decode(plain)) as VocabData;
}
