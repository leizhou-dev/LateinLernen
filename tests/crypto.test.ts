import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, cpSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decryptVocab, deriveRawKey, WrongPasswordError, type EncryptedVocab } from '../src/lib/crypto';

// Verschlüsselt eine kleine Testdatei mit dem echten Skript (in einem Temp-Ordner)
function encryptSample(): EncryptedVocab {
  const dir = mkdtempSync(join(tmpdir(), 'latein-'));
  mkdirSync(join(dir, 'scripts')); mkdirSync(join(dir, 'public'));
  cpSync('scripts/encrypt-vocab.mjs', join(dir, 'scripts/encrypt-vocab.mjs'));
  const src = join(dir, 'sample.json');
  writeFileSync(src, JSON.stringify({ meta: { title: 't', version: 1 }, lessons: [{ number: 1, words: [{ latin: 'puella', german: ['das Mädchen'] }] }] }));
  execFileSync('node', [join(dir, 'scripts/encrypt-vocab.mjs'), src], { env: { ...process.env, LATEIN_PASSWORD: 'testpasswort' } });
  return JSON.parse(readFileSync(join(dir, 'public/vocab.enc.json'), 'utf8'));
}

describe('Verschlüsselung', () => {
  const enc = encryptSample();
  it('richtiges Passwort entschlüsselt', async () => {
    const v = await decryptVocab(enc, await deriveRawKey('testpasswort', enc.salt, enc.iter));
    expect(v.lessons[0].words[0].latin).toBe('puella');
  });
  it('falsches Passwort wird erkannt', async () => {
    await expect(decryptVocab(enc, await deriveRawKey('falsch', enc.salt, enc.iter))).rejects.toBeInstanceOf(WrongPasswordError);
  });
  it('kein Klartext in der Datei', () => {
    expect(JSON.stringify(enc)).not.toMatch(/puella|Mädchen/);
  });
});
