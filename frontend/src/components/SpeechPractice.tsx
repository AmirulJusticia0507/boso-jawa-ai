import { useRef, useState } from "react";
import { createSpeechRecognition, detectSpeechCapabilities, pronunciationScore, speak, type SpeechRecognitionLike } from "../services/speech";
import { buttonCls, cardCls, inputCls } from "./ui";

export function SpeakButton({ text, label = "Rungokake" }: { text: string; label?: string }) {
  const [notice, setNotice] = useState("");

  function play() {
    const result = speak(text);
    if (!result.ok) {
      setNotice(result.reason === "no-voice"
        ? "Browser iki durung nyedhiyakake voice. Coba muat ulang kaca utawa gunakake Chrome/Edge."
        : "Audio ora didhukung browser iki.");
      return;
    }
    setNotice(result.isJavanese
      ? ""
      : `Ora ana voice Jawa; nganggo voice ${result.voiceLanguage ?? "liyane"} (pelafalan bisa beda).`);
  }

  return (
    <span>
      <button type="button" className="rounded-lg border border-cream-200 px-2 py-1 text-xs font-semibold hover:bg-cream-100 dark:border-sogan-600 dark:hover:bg-sogan-700" onClick={play}>🔊 {label}</button>
      {notice && <span className="ml-2 text-xs text-amber-700 dark:text-amber-400">{notice}</span>}
    </span>
  );
}

export default function SpeechPractice() {
  const [target, setTarget] = useState("Aku arep mangan banjur lunga.");
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  function listen() {
    const capabilities = detectSpeechCapabilities();
    if (!capabilities.sttSupported) {
      setMessage("Speech-to-text ora didhukung browser iki. Coba Chrome utawa Edge.");
      return;
    }
    const warning = capabilities.javaneseTts
      ? ""
      : "Cathetan: voice Jawa ora kasedhiya, dadi tuladha audio bisa nganggo voice liya. ";
    const instance = createSpeechRecognition();
    if (!instance) { setMessage("Speech-to-text ora didhukung browser iki. Coba Chrome utawa Edge."); return; }
    recognition.current = instance;
    instance.onresult = (event) => {
      const heard = event.results[0]?.[0]?.transcript ?? "";
      setTranscript(heard);
      setMessage(`${warning}Kemiripan pelafalan: ${pronunciationScore(target, heard)}%`);
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
