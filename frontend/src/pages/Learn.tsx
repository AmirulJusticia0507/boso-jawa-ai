import { useState } from "react";
import { PageHeader, buttonCls, cardCls } from "../components/ui";

interface Question {
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  category: "Aksara" | "Unggah-Ungguh";
}

interface Progress {
  sessions: number;
  bestScore: number;
  streak: number;
  lastStudyDate: string;
}

const QUESTIONS: Question[] = [
  { prompt: "Apa wacan aksara ꦲ?", options: ["ha", "na", "ca", "ra"], answer: "ha", explanation: "ꦲ yaiku aksara carakan ha.", category: "Aksara" },
  { prompt: "Apa wacan aksara ꦗ?", options: ["pa", "ja", "ya", "nya"], answer: "ja", explanation: "ꦗ yaiku aksara carakan ja.", category: "Aksara" },
  { prompt: "Sandhangan ꦶ menehi swara apa?", options: ["a", "i", "u", "o"], answer: "i", explanation: "Wulu (ꦶ) ngowahi vokal dadi i.", category: "Aksara" },
  { prompt: "Tembung krama inggil saka ‘mangan’ yaiku…", options: ["nedha", "dhahar", "kesah", "sare"], answer: "dhahar", explanation: "Mangan → nedha (krama lugu) → dhahar (krama inggil).", category: "Unggah-Ungguh" },
  { prompt: "Tembung krama inggil saka ‘turu’ yaiku…", options: ["tilem", "sare", "tindak", "dalem"], answer: "sare", explanation: "Turu → tilem (krama lugu) → sare (krama inggil).", category: "Unggah-Ungguh" },
  { prompt: "Ukara kanggo ngajeni wong sing luwih sepuh yaiku…", options: ["Kowe arep lunga?", "Panjenengan badhe tindak?", "Aku arep lunga", "Dheweke lunga"], answer: "Panjenengan badhe tindak?", explanation: "Panjenengan lan tindak minangka pilihan ngajeni lawan bicara.", category: "Unggah-Ungguh" },
];

const STORAGE_KEY = "boso-jawa-learning-progress";

function loadProgress(): Progress {
  try {
    return { sessions: 0, bestScore: 0, streak: 0, lastStudyDate: "", ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return { sessions: 0, bestScore: 0, streak: 0, lastStudyDate: "" };
  }
}

export default function Learn() {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const question = QUESTIONS[index];

  function choose(option: string) {
    if (selected != null) return;
    setSelected(option);
    if (option === question.answer) setScore((value) => value + 1);
  }

  function next() {
    if (index < QUESTIONS.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    const finalScore = score;
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const nextProgress: Progress = {
      sessions: progress.sessions + 1,
      bestScore: Math.max(progress.bestScore, finalScore),
      streak: progress.lastStudyDate === today ? progress.streak : progress.lastStudyDate === yesterday ? progress.streak + 1 : 1,
      lastStudyDate: today,
    };
    setProgress(nextProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProgress));
    setFinished(true);
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setFinished(false);
  }

  return (
    <section className="space-y-5">
      <PageHeader aksara="ꦱꦶꦤꦲꦸ" title="Sinau Basa Jawa" desc="Latihan aksara lan unggah-ungguh kanthi skor lan progres sing disimpen ing piranti iki." />
      <div className="grid grid-cols-3 gap-3">
        <div className={cardCls}><p className="text-sm">Sesi</p><strong className="text-2xl">{progress.sessions}</strong></div>
        <div className={cardCls}><p className="text-sm">Skor paling apik</p><strong className="text-2xl">{progress.bestScore}/{QUESTIONS.length}</strong></div>
        <div className={cardCls}><p className="text-sm">Streak</p><strong className="text-2xl">{progress.streak} dina</strong></div>
      </div>
      {finished ? (
        <div className={`${cardCls} text-center`}>
          <h2 className="font-display text-3xl font-bold">Rampung!</h2>
          <p className="mt-2 text-lg">Skormu {score}/{QUESTIONS.length}</p>
          <button type="button" className={`${buttonCls} mt-4`} onClick={restart}>Baleni latihan</button>
        </div>
      ) : (
        <div className={cardCls}>
          <div className="flex items-center justify-between text-sm"><span>{question.category}</span><span>{index + 1}/{QUESTIONS.length}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-sogan-700"><div className="h-full bg-prada-500 transition-all" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} /></div>
          <h2 className="mt-5 font-display text-2xl font-bold">{question.prompt}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const correct = selected != null && option === question.answer;
              const wrong = selected === option && option !== question.answer;
              return <button key={option} type="button" onClick={() => choose(option)} className={`rounded-xl border px-4 py-3 text-left transition ${correct ? "border-green-600 bg-green-50 dark:bg-green-950" : wrong ? "border-red-600 bg-red-50 dark:bg-red-950" : "border-cream-200 hover:border-prada-500 dark:border-sogan-700"}`}>{option}</button>;
            })}
          </div>
          {selected != null && <div className="mt-4"><p className="text-sm">{selected === question.answer ? "Bener!" : `Durung bener. Jawabane: ${question.answer}`}</p><p className="mt-1 text-sm text-ink-900/70 dark:text-cream-200/70">{question.explanation}</p><button type="button" className={`${buttonCls} mt-3`} onClick={next}>{index === QUESTIONS.length - 1 ? "Deleng asil" : "Sabanjure"}</button></div>}
        </div>
      )}
    </section>
  );
}
