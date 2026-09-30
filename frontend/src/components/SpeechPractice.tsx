import { useRef, useState } from "react";
import { createSpeechRecognition, pronunciationScore, speak, type SpeechRecognitionLike } from "../services/speech";
import { buttonCls, cardCls, inputCls } from "./ui";

export function SpeakButton({ text, label = "Rungokake" }: { text: string; label?: string }) {
  const [error, setError] = useState("");
  return <span><button type="button" className="rounded-lg border border-cream-200 px-2 py-1 text-xs font-semibold hover:bg-cream-100 dark:border-sogan-600 dark:hover:bg-sogan-700" onClick={() => setError(speak(text) ? "" : "Audio ora didhukung browser iki.")}>🔊 {label}</button>{error && <span className="ml-2 text-xs text-red-600 dark:text-red-400">{error}</span>}</span>;
}

export default function SpeechPractice() {
  const [target, setTarget] = useState("Aku arep mangan banjur lunga.");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  function listen() {
    const instance = createSpeechRecognition();
    if (!instance) { setMessage("Speech-to-text ora didhukung browser iki. Coba Chrome utawa Edge."); return; }
    recognition.current = instance;
    instance.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(heard);
      setMessage(`Kemiripan pelafalan: ${pronunciationScore(target, heard)}%`);
    };
    instance.onerror = () => setMessage("Swara ora kasil diwaca. Priksa izin mikrofon banjur coba maneh.");
    instance.onend = () => setListening(false);
    setListening(true);
    setMessage("");
    instance.start();
  }

  return <section className={cardCls}>
    <h2 className="font-display text-xl font-bold">Latihan Pelafalan</h2>
    <p className="mt-1 text-sm text-ink-900/70 dark:text-cream-200/70">Rungokna tuladha, banjur ucapna ukara. Penilaian adhedhasar tembung sing kasil dikenali piranti.</p>
    <textarea className={`${inputCls} mt-3`} rows={2} value={target} onChange={(event) => { setTarget(event.target.value); setTranscript(""); setMessage(""); }} />
    <div className="mt-3 flex flex-wrap gap-2">
      <SpeakButton text={target} label="Tuladha" />
      <button type="button" className={buttonCls} disabled={listening || target.trim() === ""} onClick={listen}>{listening ? "Ngrungokake…" : "🎙 Ucapna"}</button>
      {listening && <button type="button" className={buttonCls} onClick={() => recognition.current?.stop()}>Mandheg</button>}
    </div>
    {transcript && <p className="mt-3 text-sm">Kewaca: <strong>{transcript}</strong></p>}
    {message && <p className="mt-2 text-sm" role="status">{message}</p>}
  </section>;
}
