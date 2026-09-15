#!/usr/bin/env node
/**
 * fix-encoding.mjs — naprawa mojibake typu: UTF-8 odczytany jako Windows-1250 i zapisany jako UTF-8.
 *
 *   node fix-encoding.mjs           # PODGLĄD — nic nie zapisuje
 *   node fix-encoding.mjs --write   # zapis zmian
 *
 * Zasada bezpieczeństwa: tekst jest zamieniany z powrotem na bajty CP1250 i dekodowany
 * jako UTF-8 w trybie fatal. Plik zdrowy da przy odwróceniu bajty, które nie są poprawnym
 * UTF-8 — dekoder rzuci wyjątek i plik zostanie nietknięty.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');

const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'out', 'build', 'release']);
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.sql']);

// Pełna tablica CP1250 dla zakresu 0x80-0xFF. null = pozycja niezdefiniowana w tej stronie kodowej.
const CP1250 = [
  0x20AC, null,   0x201A, null,   0x201E, 0x2026, 0x2020, 0x2021, // 80-87
  null,   0x2030, 0x0160, 0x2039, 0x015A, 0x0164, 0x017D, 0x0179, // 88-8F
  null,   0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2013, 0x2014, // 90-97
  null,   0x2122, 0x0161, 0x203A, 0x015B, 0x0165, 0x017E, 0x017A, // 98-9F
  0x00A0, 0x02C7, 0x02D8, 0x0141, 0x00A4, 0x0104, 0x00A6, 0x00A7, // A0-A7
  0x00A8, 0x00A9, 0x015E, 0x00AB, 0x00AC, 0x00AD, 0x00AE, 0x017B, // A8-AF
  0x00B0, 0x00B1, 0x02DB, 0x0142, 0x00B4, 0x00B5, 0x00B6, 0x00B7, // B0-B7
  0x00B8, 0x0105, 0x015F, 0x00BB, 0x013D, 0x02DD, 0x013E, 0x017C, // B8-BF
  0x0154, 0x00C1, 0x00C2, 0x0102, 0x00C4, 0x0139, 0x0106, 0x00C7, // C0-C7
  0x010C, 0x00C9, 0x0118, 0x00CB, 0x011A, 0x00CD, 0x00CE, 0x010E, // C8-CF
  0x0110, 0x0143, 0x0147, 0x00D3, 0x00D4, 0x0150, 0x00D6, 0x00D7, // D0-D7
  0x0158, 0x016E, 0x00DA, 0x0170, 0x00DC, 0x00DD, 0x0162, 0x00DF, // D8-DF
  0x0155, 0x00E1, 0x00E2, 0x0103, 0x00E4, 0x013A, 0x0107, 0x00E7, // E0-E7
  0x010D, 0x00E9, 0x0119, 0x00EB, 0x011B, 0x00ED, 0x00EE, 0x010F, // E8-EF
  0x0111, 0x0144, 0x0148, 0x00F3, 0x00F4, 0x0151, 0x00F6, 0x00F7, // F0-F7
  0x0159, 0x016F, 0x00FA, 0x0171, 0x00FC, 0x00FD, 0x0163, 0x02D9, // F8-FF
];

const CHAR_TO_BYTE = new Map();
CP1250.forEach((cp, i) => { if (cp !== null) CHAR_TO_BYTE.set(String.fromCharCode(cp), 0x80 + i); });

const FFFD = '�';
const decoder = new TextDecoder('utf-8', { fatal: true });

/** Zamienia tekst na bajty CP1250. Zwraca null, gdy któryś znak nie ma odpowiednika. */
function toCp1250Bytes(text) {
  const out = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp < 0x80) { out.push(cp); continue; }
    // Pozycje niezdefiniowane w CP1250 (0x81/0x83/0x88/0x90/0x98) bywają przepuszczane
    // przez dekoder jako odpowiadające im znaki sterujące C1 — bajt NIE przepadł.
    if (cp >= 0x80 && cp <= 0x9F && CP1250[cp - 0x80] === null) { out.push(cp); continue; }
    if (ch === FFFD) {
      // Bajt przepadł na niezdefiniowanej pozycji CP1250 (0x81/0x83/0x88/0x90/0x98).
      // Zgadujemy po bajtach poprzedzających.
      const p1 = out[out.length - 1];
      const p2 = out[out.length - 2];
      if (p1 === 0xC5) { out.push(0x81); continue; }                 // Ł — UWAGA: Ń (0x83) nieodróżnialne
      if (p1 === 0xC4) { out.push(0x98); continue; }                 // Ę
      if (p2 === 0xE2 && p1 === 0xAD) { out.push(0x90); continue; }  // gwiazdka (E2 AD 90)
      return null;
    }
    const b = CHAR_TO_BYTE.get(ch);
    if (b === undefined) return null;
    out.push(b);
  }
  return Buffer.from(out);
}

/** Próba naprawy fragmentu. Zwraca naprawiony tekst albo null, gdy się nie da. */
function repair(text) {
  const bytes = toCp1250Bytes(text);
  if (!bytes) return null;
  let decoded;
  try { decoded = decoder.decode(bytes); } catch { return null; }
  if (decoded === text) return null;        // nic się nie zmieniło
  if (decoded.includes(FFFD)) return null;  // nie wprowadzamy nowych uszkodzeń
  return decoded;
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, acc);
    else if (st.isFile() && EXTS.has(extname(entry))) acc.push(full);
  }
  return acc;
}

const GUESS_RE = /Ĺ�|Ä�|â­�/g; // 'Ĺ'+U+FFFD  albo  'Ä'+U+FFFD

const results = [];
for (const file of walk(ROOT)) {
  let raw;
  try { raw = readFileSync(file, 'utf8'); } catch { continue; }

  let text = raw;
  const hadBom = text.charCodeAt(0) === 0xFEFF;
  if (hadBom) text = text.slice(1);

  // 1) próba na całym pliku
  let fixed = repair(text);
  let mode = 'cały plik';

  // 2) fallback: linia po linii (pliki mieszane)
  if (fixed === null) {
    const lines = text.split('\n');
    let touched = 0;
    const out = lines.map((line) => {
      const r = repair(line);
      if (r === null) return line;
      touched++;
      return r;
    });
    if (touched > 0) { fixed = out.join('\n'); mode = `linia po linii (${touched})`; }
  }

  if (fixed === null && !hadBom) continue;
  if (fixed === null) fixed = text; // tylko usunięcie BOM

  // linie, w których zgadywaliśmy
  const guessLines = [];
  text.split('\n').forEach((line, i) => {
    GUESS_RE.lastIndex = 0;
    for (const m of line.matchAll(GUESS_RE)) {
      const c0 = m[0][0];
      guessLines.push({ line: i + 1, kind: c0 === 'Ĺ' ? 'Ł/Ń' : c0 === 'Ä' ? 'Ę' : 'gwiazdka' });
    }
  });

  // przykładowe zmienione linie
  const before = text.split('\n');
  const after = fixed.split('\n');
  const samples = [];
  for (let i = 0; i < before.length && samples.length < 2; i++) {
    if (before[i] !== after[i]) samples.push({ n: i + 1, b: before[i].trim(), a: after[i].trim() });
  }
  const changedLines = before.filter((l, i) => l !== after[i]).length;

  results.push({ file: relative(ROOT, file), mode, hadBom, changedLines, samples, guessLines });
  if (WRITE) writeFileSync(file, fixed, 'utf8');
}

// ---------- raport ----------
console.log(WRITE ? '\n=== ZAPIS ZMIAN ===\n' : '\n=== PODGLĄD (bez zapisu) ===\n');
if (results.length === 0) {
  console.log('Brak plików do naprawy — zero zmian.\n');
} else {
  for (const r of results) {
    console.log(`\x1b[1m${r.file}\x1b[0m`);
    console.log(`   tryb: ${r.mode}${r.hadBom ? '  |  usunięto BOM' : ''}  |  zmienionych linii: ${r.changedLines}`);
    for (const s of r.samples) {
      console.log(`   \x1b[31m- ${s.n}:\x1b[0m ${s.b.slice(0, 96)}`);
      console.log(`   \x1b[32m+ ${s.n}:\x1b[0m ${s.a.slice(0, 96)}`);
    }
    if (r.guessLines.length) {
      const desc = r.guessLines.map((g) => `${g.line}(${g.kind})`).join(', ');
      console.log(`   \x1b[33m! zgadywane linie: ${desc}\x1b[0m`);
    }
    console.log('');
  }
  const totalGuess = results.reduce((s, r) => s + r.guessLines.length, 0);
  console.log(`Plików: ${results.length}  |  zgadywanych znaków: ${totalGuess}`);
  if (totalGuess) console.log('\x1b[33mUWAGA: Ł i Ń są po tym uszkodzeniu nieodróżnialne — sprawdź linie oznaczone Ł/Ń.\x1b[0m');
  if (!WRITE) console.log('\nNic nie zapisano. Aby zapisać: node fix-encoding.mjs --write');
}
console.log('');
