/** Utilitas TTS/STT. Browser jarang punya voice Jawa, jadi kita laporkan
 *  secara jujur, bukan diam-diam memakai voice Indonesia yang salah pelafalannya. */

export interface SpeakResult {
  ok: boolean;
  /** Bahasa voice yang benar-benar dipakai browser, kalau ada. */
  voiceLanguage: string | null;
  isJavanese: boolean;
  reason?: "unsupported" | "no-voice";
}

export interface SpeechCapabilities {
  ttsSupported: boolean;
  javaneseTts: boolean;
  sttSupported: boolean;
}

function availableVoices(): SpeechSynthesisVoice[] {
  if (!("speechSynthesis" in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function detectSpeechCapabilities(): SpeechCapabilities {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
  };
  const voices = availableVoices();
  return {
    ttsSupported: "speechSynthesis" in window && typeof SpeechSynthesisUtterance !== "undefined",
    javaneseTts: voices.some((voice) => voice.lang.toLowerCase().startsWith("jv")),
    sttSupported: Boolean(browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition),
  };
}

export function speak(text: string, rate = 0.85): SpeakResult {
  if (!("speechSynthesis" in window)) {
    return { ok: false, voiceLanguage: null, isJavanese: false, reason: "unsupported" };
  }
  const voices = availableVoices();
  if (voices.length === 0) {
    return { ok: false, voiceLanguage: null, isJavanese: false, reason: "no-voice" };
  }

  const javanese = voices.find((voice) => voice.lang.toLowerCase().startsWith("jv"));
  const fallback = voices.find((voice) => voice.lang.toLowerCase().startsWith("id"));
  const voice = javanese ?? fallback ?? voices[0];

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voice?.lang ?? "jv-ID";
  utterance.rate = rate;
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);

  return {
    ok: true,
    voiceLanguage: voice?.lang ?? null,
    isJavanese: Boolean(javanese),
  };
}

/** Tokenisasi Unicode: huruf, tanda diakritik, dan angka dari skrip apa pun
 *  (termasuk aksara Jawa). Regex lama membuang semua karakter non-Latin-1. */
function tokens(value: string): string[] {
  const normalized = value.normalize("NFKC").toLocaleLowerCase();
  const result: string[] = [];
  let current = "";
  for (const character of normalized) {
    if (/[\p{L}\p{M}\p{N}]/u.test(character)) {
      current += character;
    } else if (current) {
      result.push(current);
      current = "";
    }
  }
  if (current) result.push(current);
  return result;
}

function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row[j] = Math.min(
        previous[j] + 1,
        row[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = row;
  }
  return previous[b.length];
}

function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  return longest === 0 ? 1 : 1 - editDistance(a, b) / longest;
}

/** Skor kemiripan 0-100. Kata yang hampir benar dapat kredit sebagian,
 *  bukan langsung nol seperti perbandingan eksak sebelumnya. */
export function pronunciationScore(expected: string, actual: string, threshold = 0.75): number {
  const target = tokens(expected);
  const heard = tokens(actual);
  if (target.length === 0) return 0;

  const used = new Set<number>();
  let total = 0;
  for (const word of target) {
    let best = 0;
    let bestIndex = -1;
    heard.forEach((candidate, index) => {
      if (used.has(index)) return;
      const score = word === candidate ? 1 : similarity(word, candidate);
      if (score > best) {
        best = score;
        bestIndex = index;
      }
    });
    if (best >= threshold && bestIndex >= 0) {
      total += best;
      used.add(bestIndex);
    }
  }
  return Math.round((total / target.length) * 100);
}

export interface SpeechRecognitionEventLike {
  results: ArrayLike<{ 0: { transcript: string } }>;
}

export interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function createSpeechRecognition(): SpeechRecognitionLike | null {
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  const Recognition = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
  if (!Recognition) return null;
  const recognition = new Recognition();
  // Chrome jarang mendukung jv-ID untuk STT; id-ID lebih sering tersedia.
  recognition.lang = "id-ID";
  recognition.interimResults = false;
  recognition.continuous = false;
  return recognition;
}
