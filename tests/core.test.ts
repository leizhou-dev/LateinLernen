import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import type { VocabData, Word } from '../src/lib/types';
import { declineNoun, conjugate, identifyNoun, identifyVerb, canDecline, canConjugate } from '../src/lib/forms';
import { stressRange, stressSegments } from '../src/lib/stress';
import { checkLatin, checkGerman, germanVariants, macronVariant } from '../src/lib/check';
import { review, nextDue, startOfDay } from '../src/lib/srs';
import { buildSession, choicesFor } from '../src/lib/session';
import { stripMacrons } from '../src/lib/text';

// Der Klartext-Wortschatz liegt außerhalb des Repositorys (../Resources). Fehlt er, werden diese Tests übersprungen.
const SRC = process.env.VOCAB_JSON ?? '../Resources/latein_lektionen_1-11.json';
const HAVE = existsSync(SRC);
const data: VocabData = HAVE ? JSON.parse(readFileSync(SRC, 'utf8')) : { meta: { title: '', version: 0 }, lessons: [] };
const words: Word[] = data.lessons.flatMap((l) => l.words);
const W = (lat: string) => words.find((w) => w.latin === lat)!;

describe.skipIf(!HAVE)('Deklination (Tabellen im Buch)', () => {
  it('a-Deklination serva', () => {
    const t = declineNoun(W('serva'))!;
    expect(t.Sg).toMatchObject({ Nom: 'serva', Gen: 'servae', Dat: 'servae', Akk: 'servam', Abl: 'servā' });
    expect(t.Pl).toMatchObject({ Nom: 'servae', Gen: 'servārum', Dat: 'servīs', Akk: 'servās', Abl: 'servīs' });
  });
  it('o-Deklination servus/ventus', () => {
    const t = declineNoun(W('servus'))!;
    expect(t.Sg).toMatchObject({ Nom: 'servus', Gen: 'servī', Dat: 'servō', Akk: 'servum', Vok: 'serve' });
    expect(t.Pl).toMatchObject({ Nom: 'servī', Gen: 'servōrum', Dat: 'servīs', Akk: 'servōs' });
    expect(declineNoun(W('ventus'))!.Sg.Abl).toBe('ventō');
    expect(declineNoun(W('cēna'))!.Sg.Abl).toBe('cēnā');
  });
  it('Neutra dōnum', () => {
    const t = declineNoun(W('dōnum'))!;
    expect(t.Sg).toMatchObject({ Nom: 'dōnum', Gen: 'dōnī', Dat: 'dōnō', Akk: 'dōnum', Abl: 'dōnō' });
    expect(t.Pl).toMatchObject({ Nom: 'dōna', Gen: 'dōnōrum', Dat: 'dōnīs', Akk: 'dōna', Abl: 'dōnīs' });
  });
  it('Vokativ auf -ius', () => {
    expect(declineNoun(W('fīlius'))!.Sg.Vok).toBe('fīlī');
    expect(declineNoun(W('gladius'))!.Sg.Vok).toBe('gladī');
  });
  it('Neutra erst ab Lektion 11, deus ausgeschlossen', () => {
    expect(canDecline(W('dōnum'), 10)).toBe(false);
    expect(canDecline(W('dōnum'), 11)).toBe(true);
    expect(canDecline(W('deus'), 11)).toBe(false);
    expect(canDecline(W('Rōma'), 11)).toBe(false);
  });
  it('Form bestimmen: mehrdeutige Formen', () => {
    const r = identifyNoun(W('serva'), 'servae', 11).map((x) => x.cas + x.num).sort();
    expect(r).toEqual(['DatSg', 'GenSg', 'NomPl']);
    expect(identifyNoun(W('serva'), 'servae', 3).map((x) => x.cas + x.num)).toEqual(['NomPl']);
    expect(identifyNoun(W('servus'), 'servīs', 11).map((x) => x.cas).sort()).toEqual(['Abl', 'Dat']);
  });
  it('alle deklinierbaren Substantive liefern eine Tabelle', () => {
    for (const w of words.filter((w) => canDecline(w, 11))) expect(declineNoun(w), w.latin).not.toBeNull();
  });
});

describe.skipIf(!HAVE)('Konjugation (Tabellen im Buch)', () => {
  it('e-Konjugation rīdēre', () => {
    expect(conjugate(W('rīdēre'))).toEqual({
      inf: 'rīdēre', '1sg': 'rīdeō', '2sg': 'rīdēs', '3sg': 'rīdet', '1pl': 'rīdēmus', '2pl': 'rīdētis', '3pl': 'rīdent',
      impSg: 'rīdē', impPl: 'rīdēte',
    });
  });
  it('a-Konjugation rogāre', () => {
    expect(conjugate(W('rogāre'))).toEqual({
      inf: 'rogāre', '1sg': 'rogō', '2sg': 'rogās', '3sg': 'rogat', '1pl': 'rogāmus', '2pl': 'rogātis', '3pl': 'rogant',
      impSg: 'rogā', impPl: 'rogāte',
    });
  });
  it('i-Konjugation venīre', () => {
    expect(conjugate(W('venīre'))).toEqual({
      inf: 'venīre', '1sg': 'veniō', '2sg': 'venīs', '3sg': 'venit', '1pl': 'venīmus', '2pl': 'venītis', '3pl': 'veniunt',
      impSg: 'venī', impPl: 'venīte',
    });
  });
  it('esse', () => {
    expect(conjugate(W('esse'))!['2pl']).toBe('estis');
    expect(conjugate(W('esse'))!.impPl).toBe('este');
  });
  it('1. Pers. Sg. stimmt mit dem Wortschatz überein', () => {
    for (const w of words.filter((w) => w.type === 'verb' && w.conjugation !== 'esse')) {
      expect(conjugate(w)!['1sg'], w.latin).toBe(w.firstPerson);
    }
  });
  it('Freischaltung nach Lektionen', () => {
    expect(canConjugate(W('rogāre'), 7)).toBe(false);
    expect(canConjugate(W('rogāre'), 8)).toBe(true);
    expect(identifyVerb(W('rīdēre'), 'rīdēs', 3)).toEqual([]);
    expect(identifyVerb(W('rīdēre'), 'rīdēs', 4)).toEqual(['2sg']);
    expect(identifyVerb(W('esse'), 'es', 11).sort()).toEqual(['2sg', 'impSg']);
  });
});

describe.skipIf(!HAVE)('Betonung (S. 146)', () => {
  const stressed = (w: string) => { const r = stressRange(w); return r ? [...w].slice(r[0], r[1]).join('') + '@' + r[0] : null; };
  it('Beispiele aus dem Buch', () => {
    expect(stressed('campus')).toBe('a@1');
    expect(stressed('servus')).toBe('e@1');
    expect(stressed('Rōma')).toBe('ō@1');
    expect(stressed('Rōmānus')).toBe('ā@3');
    expect(stressed('dominus')).toBe('o@1');
  });
  it('weitere Fälle', () => {
    expect(stressed('rīdēre')).toBe('ē@3');
    expect(stressed('itaque')).toBe('i@0');
    expect(stressed('etiam')).toBe('e@0');
    expect(stressed('prōvincia')).toBe('i@4');
    expect(stressed('profectō')).toBe('e@4');
    expect(stressed('Capitōlium')).toBe('ō@5');
    expect(stressed('lingua')).toBe('i@1');
    expect(stressed('iam')).toBeNull();
    expect(stressed('et')).toBeNull();
    expect(stressed('aedificium')).toBe('i@5');
  });
  it('mehrere Wörter', () => {
    const s = stressSegments('grātiam habēre').filter((x) => x.stressed).map((x) => x.text);
    expect(s).toEqual(['ā', 'ē']);
  });
});

describe.skipIf(!HAVE)('Antworten prüfen', () => {
  it('Latein: Längenzeichen sind Pflicht', () => {
    expect(checkLatin('rīdēre', 'rīdēre').verdict).toBe('correct');
    expect(checkLatin('rīdēre', 'Rīdēre ').verdict).toBe('correct');
    const r = checkLatin('rīdēre', 'ridēre');
    expect(r.verdict).toBe('macron');
    expect(r.badMacrons).toEqual([1]);
    expect(checkLatin('rīdēre', 'rīdāre').verdict).toBe('wrong');
    expect(checkLatin('cūr?', 'cūr').verdict).toBe('correct');
    expect(checkLatin('neque … neque', 'neque ... neque').verdict).toBe('correct');
    expect(checkLatin('neque … neque', 'neque neque').verdict).toBe('correct');
  });
  it('Deutsch: eine Bedeutung genügt, Artikel/Klammern optional', () => {
    expect(checkGerman(W('serva'), 'Dienerin').verdict).toBe('correct');
    expect(checkGerman(W('serva'), 'die Sklavin').verdict).toBe('correct');
    expect(checkGerman(W('tabula'), 'Tafel').verdict).toBe('correct');
    expect(checkGerman(W('tabula'), 'Schreibtafel').verdict).toBe('correct');
    expect(checkGerman(W('parāre'), 'vorbereiten').verdict).toBe('correct');
    expect(checkGerman(W('gaudēre'), 'freuen').verdict).toBe('correct');
    expect(checkGerman(W('mēnsa'), 'Esstisch').verdict).toBe('correct');
    expect(checkGerman(W('exspectāre'), 'warten').verdict).toBe('correct');
    expect(checkGerman(W('superāre'), 'besiegen').verdict).toBe('correct');
    expect(checkGerman(W('superāre'), 'besigen').verdict).toBe('typo');
    expect(checkGerman(W('superāre'), 'lieben').verdict).toBe('wrong');
    expect(checkGerman(W('valē! valēte!'), 'leb wohl').verdict).toBe('correct');
    expect(checkGerman(W('mūrus'), 'Mauer, Wand').verdict).toBe('correct');
    expect(germanVariants('die (Menschen-)Menge')).toContain('menschenmenge');
  });
  it('Längenzeichen-Falle', () => {
    let seed = 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 20; i++) {
      const v = macronVariant('rogāre, rogō', rnd)!;
      expect(v).not.toBe('rogāre, rogō');
      expect(stripMacrons(v)).toBe('rogare, rogo');
    }
  });
});

describe.skipIf(!HAVE)('Wiederholung (5 Stufen)', () => {
  const now = new Date('2026-11-23T15:00:00').getTime();
  it('Stufen und Abstände', () => {
    let p = review(undefined, true, now);
    expect(p.level).toBe(1); expect(p.due).toBe(now + 3 * 3600_000);
    p = review(p, true, now);
    expect(p.level).toBe(2); expect(p.due).toBe(startOfDay(now) + 86400_000);
    p = review(review(review(p, true, now), true, now), true, now);
    expect(p.level).toBe(5);
    p = review(p, false, now);
    expect(p.level).toBe(0); expect(p.wrong).toBe(1);
    expect(nextDue(3, now)).toBe(startOfDay(now) + 2 * 86400_000);
  });
  it('Sitzungen und Auswahl', () => {
    const s = buildSession(words, {}, { kind: 'new', lessons: [1], direction: 'mixed', size: 10, now });
    expect(s.length).toBe(10);
    expect(s.slice(0, 5).every((c) => c.dir === 'ld')).toBe(true);
    for (const c of s) {
      const ch = choicesFor(c, words);
      expect(ch.length).toBe(4);
      expect(new Set(ch).size).toBe(4);
    }
  });
});
