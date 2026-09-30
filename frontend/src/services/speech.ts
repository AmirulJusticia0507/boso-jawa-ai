export function speak(text: string, rate = 0.85): boolean {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "jv-ID";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith("jv"))
    ?? voices.find((voice) => voice.lang.toLowerCase().startsWith("id"))
    ?? null;
  window.speechSynthesis.speak(utterance);
  return true;
}

function words(value: string): string[] {
  return value.toLocaleLowerCase("jv").replace(/[^a-zà-ž\s]/g, " ").split(/\s+/).filter(Boolean);
}

export function pronunciationScore(expected: string, actual: string): number {
  const target = words(expected);
  const heard = new Set(words(actual));
  if (target.length === 0) return 0;
  return Math.round(target.filter((word) => heard.has(word)).length / target.length * 100);
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
  recognition.lang = "jv-ID";
  recognition.interimResults = false;
  recognition.continuous = false;
  return recognition;
}
