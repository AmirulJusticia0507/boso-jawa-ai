import { useState, useEffect } from "react";
import { PageHeader, buttonCls, cardCls } from "../components/ui";
import {
  startQuiz,
  submitQuiz,
  getLearningStats,
  getDueFlashcards,
  reviewFlashcard,
  Flashcard,
  QuizQuestionForQuiz,
  QuizAnswer,
  QuestionCategory,
  QuestionDifficulty,
  ApiError,
} from "../services/api";

interface Progress {
  sessions: number;
  bestScore: number;
  streak: number;
  lastStudyDate: string;
}

const STORAGE_KEY = "boso-jawa-learning-progress";

function loadLocalProgress(): Progress {
  try {
    return { sessions: 0, bestScore: 0, streak: 0, lastStudyDate: "", ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") };
  } catch {
    return { sessions: 0, bestScore: 0, streak: 0, lastStudyDate: "" };
  }
}

export default function Learn() {
  const [questions, setQuestions] = useState<QuizQuestionForQuiz[]>([]);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<Progress>(loadLocalProgress);
  const [stats, setStats] = useState<{ total_answered: number; total_correct: number; overall_accuracy: number; study_days: number; by_category: Record<string, { total: number; correct: number; accuracy: number; best_streak: number; current_streak: number }>; daily_activity: Array<{ date: string; attempted: number; correct: number }>; weakest_questions: Array<{ id: number; prompt: string; attempted: number; accuracy: number }>; flashcards: { due: number; reviewed: number; scheduled: number } } | null>(null);
  const [mastery, setMastery] = useState<Array<{ category: QuestionCategory; difficulty: QuestionDifficulty; attempted: number; correct: number; accuracy: number; level: string }>>([]);
  const [adaptive, setAdaptive] = useState(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [flashIndex, setFlashIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => localStorage.getItem("boso-jawa-reminder") ?? "19:00");

  // Filter state
  const [filterCategory, setFilterCategory] = useState<QuestionCategory | "all">("all");
  const [filterDifficulty, setFilterDifficulty] = useState<QuestionDifficulty | "all">("all");

  const question = questions[index];

  // Load server progress and stats on mount
  useEffect(() => {
    loadServerData();
  }, []);

  async function loadServerData() {
    try {
      const statsRes = await getLearningStats();
      setStats(statsRes.data);
      setMastery(statsRes.data.mastery ?? []);
    } catch (err) {
      console.warn("Failed to load server progress:", err);
    }
  }

  async function startNewQuiz() {
    setLoading(true);
    setError("");
    try {
      const category = filterCategory === "all" ? undefined : filterCategory;
      const difficulty = filterDifficulty === "all" ? undefined : filterDifficulty;
      const res = await startQuiz({ category, difficulty, limit: 10, adaptive });
      if (res.questions.length === 0) {
        setError("Tidak ada soal tersedia untuk filter ini.");
        setQuestions([]);
        return;
      }
      setQuestions(res.questions);
      setIndex(0);
      setScore(0);
      setSelected(null);
      setAnswers({});
      setFinished(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memulai kuis.");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }

  async function startFlashcards() {
    setLoading(true);
    setError("");
    try {
      const response = await getDueFlashcards(10);
      setFlashcards(response.data);
      setFlashIndex(0);
      setRevealed(false);
      if (!response.data.length) setError("Ora ana flashcard sing kudu dibaleni saiki.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal memuat flashcard.");
    } finally {
      setLoading(false);
    }
  }

  async function gradeFlashcard(quality: "again" | "hard" | "good" | "easy") {
    const card = flashcards[flashIndex];
    if (!card) return;
    await reviewFlashcard(card.id, quality);
    if (flashIndex < flashcards.length - 1) {
      setFlashIndex((value) => value + 1);
      setRevealed(false);
    } else {
      setFlashcards([]);
      setFlashIndex(0);
      setResultMessage("Sesi flashcard rampung.");
    }
  }

  const [resultMessage, setResultMessage] = useState("");

  async function saveReminder() {
    if (!("Notification" in window)) {
      setError("Browser iki ora ndhukung notifikasi.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setError("Izin notifikasi durung diwenehake.");
      return;
    }
    localStorage.setItem("boso-jawa-reminder", reminderTime);
    localStorage.removeItem("boso-jawa-reminder-sent");
    setResultMessage(`Pengingat sinau disetel saben jam ${reminderTime}.`);
  }

  useEffect(() => {
    const checkReminder = () => {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const configured = localStorage.getItem("boso-jawa-reminder");
      if (!configured) return;
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` === configured && localStorage.getItem("boso-jawa-reminder-sent") !== today) {
        const options = { body: "Ayo latihan adaptif utawa baleni flashcard dina iki." };
        if ("serviceWorker" in navigator) {
          void navigator.serviceWorker.ready.then((registration) => registration.showNotification("Wektune Sinau Basa Jawa", options));
        } else {
          new Notification("Wektune Sinau Basa Jawa", options);
        }
        localStorage.setItem("boso-jawa-reminder-sent", today);
      }
    };
    checkReminder();
    const timer = window.setInterval(checkReminder, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  function choose(option: string) {
    if (selected != null) return;
    setSelected(option);
    if (question && option === question.correct_answer) setScore((value) => value + 1);
    if (question) setAnswers((prev) => ({ ...prev, [question.id]: option }));
  }

  async function next() {
    if (!question) return;
    if (index < questions.length - 1) {
      setIndex((value) => value + 1);
      setSelected(null);
      return;
    }
    // Last question - submit all answers
    await submitAnswers();
  }

  async function submitAnswers() {
    setLoading(true);
    try {
      const answersToSubmit: QuizAnswer[] = questions.map((q) => ({
        question_id: q.id,
        selected_answer: answers[q.id] ?? "",
      }));

      await submitQuiz(answersToSubmit);

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

      await loadServerData();
      setFinished(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menyimpan hasil.");
    } finally {
      setLoading(false);
    }
  }

  function restart() {
    setIndex(0);
    setScore(0);
    setSelected(null);
    setAnswers({});
    setFinished(false);
  }

  function getCategoryLabel(cat: QuestionCategory) {
    return cat === "aksara" ? "Aksara" : "Unggah-Ungguh";
  }

  function getDifficultyLabel(diff: QuestionDifficulty) {
    const labels: Record<QuestionDifficulty, string> = { mudah: "Mudah", sedang: "Sedang", sulit: "Sulit" };
    return labels[diff];
  }

  return (
    <section className="space-y-5">
      <PageHeader aksara="ꦱꦶꦤꦲꦸ" title="Sinau Basa Jawa" desc="Latihan aksara lan unggah-ungguh kanthi skor lan progres sing disimpen." />

      {/* Progress Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={cardCls}><p className="text-sm">Sesi</p><strong className="text-2xl">{progress.sessions}</strong></div>
        <div className={cardCls}><p className="text-sm">Skor paling apik</p><strong className="text-2xl">{progress.bestScore}</strong></div>
        <div className={cardCls}><p className="text-sm">Streak</p><strong className="text-2xl">{progress.streak} dina</strong></div>
      </div>

      {/* Server Stats */}
      {stats && (
        <div className={cardCls}>
          <h3 className="font-semibold text-sogan-800 dark:text-cream-200">Progres Server</h3>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div><p className="text-abu-500">Total dijawab</p><strong>{stats.total_answered}</strong></div>
            <div><p className="text-abu-500">Benar</p><strong className="text-godong-600">{stats.total_correct}</strong></div>
            <div><p className="text-abu-500">Akurasi</p><strong>{stats.overall_accuracy}%</strong></div>
            <div><p className="text-abu-500">Hari belajar</p><strong>{stats.study_days}</strong></div>
          </div>
          <div className="mt-3 pt-3 border-t border-cream-200 dark:border-sogan-700">
            <p className="text-sm font-medium text-sogan-800 dark:text-cream-200">Per Kategori:</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {Object.entries(stats.by_category).map(([cat, data]) => (
                <div key={cat} className="bg-cream-50 dark:bg-sogan-800 rounded p-2">
                  <p className="font-medium">{getCategoryLabel(cat as QuestionCategory)}</p>
                  <p>{data.correct}/{data.total} ({data.accuracy}%)</p>
                  <p>Streak: {data.current_streak} / best: {data.best_streak}</p>
                </div>
              ))}
            </div>
          </div>
          {mastery.length > 0 && <div className="mt-3 border-t border-cream-200 pt-3 dark:border-sogan-700">
            <p className="text-sm font-medium">Penguasaan per materi</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {mastery.map((item) => <div key={`${item.category}-${item.difficulty}`} className="rounded bg-cream-50 p-2 text-xs dark:bg-sogan-800">
                <strong>{getCategoryLabel(item.category)} · {getDifficultyLabel(item.difficulty)}</strong>
                <p>{item.correct}/{item.attempted} benar · {item.accuracy}% · {item.level.replace("_", " ")}</p>
              </div>)}
            </div>
          </div>}
          <div className="mt-3 grid gap-3 border-t border-cream-200 pt-3 md:grid-cols-2 dark:border-sogan-700">
            <div>
              <p className="text-sm font-medium">Aktivitas 7 dina</p>
              <div className="mt-2 flex h-24 items-end gap-2">{stats.daily_activity.map((day) => <div key={day.date} className="flex flex-1 flex-col items-center gap-1" title={`${day.correct}/${day.attempted} benar`}><div className="w-full rounded-t bg-prada-500" style={{ height: `${Math.max(8, day.attempted * 12)}px` }} /><span className="text-[10px]">{day.date.slice(5)}</span></div>)}</div>
              {stats.daily_activity.length === 0 && <p className="mt-2 text-xs text-ink-900/60 dark:text-cream-200/60">Durung ana aktivitas minggu iki.</p>}
            </div>
            <div>
              <p className="text-sm font-medium">Materi prioritas</p>
              <ul className="mt-2 space-y-1 text-xs">{stats.weakest_questions.map((item) => <li key={item.id} className="rounded bg-cream-50 p-2 dark:bg-sogan-800"><strong>{item.prompt}</strong><br />{item.accuracy}% saka {item.attempted} percobaan</li>)}</ul>
              {stats.weakest_questions.length === 0 && <p className="mt-2 text-xs">Rampungna kuis kanggo ndeleng rekomendasi.</p>}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-cream-200 pt-3 text-center text-xs dark:border-sogan-700">
            <div><strong className="block text-lg">{stats.flashcards.due}</strong>Kudu dibaleni</div>
            <div><strong className="block text-lg">{stats.flashcards.reviewed}</strong>Wis tau ditinjau</div>
            <div><strong className="block text-lg">{stats.flashcards.scheduled}</strong>Terjadwal</div>
          </div>
        </div>
      )}

      <div className={`${cardCls} grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end`}>
        <label className="grid gap-1 text-sm font-semibold">Pengingat belajar harian<input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="rounded-xl border border-cream-200 bg-white px-3 py-2 dark:border-sogan-700 dark:bg-sogan-800" /></label>
        <button type="button" className={buttonCls} onClick={saveReminder}>Aktifkan pengingat browser</button>
      </div>
      {resultMessage && <p className="text-sm text-godong-700">{resultMessage}</p>}

      {/* Filter & Start */}
      {!finished && questions.length === 0 && (
        <div className={cardCls}>
          <h3 className="font-semibold text-sogan-800 dark:text-cream-200">Mulai Kuis Baru</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm font-semibold text-sogan-900 dark:text-cream-200">
              Kategori
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as QuestionCategory | "all")} className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2 outline-none transition focus:border-prada-500 focus:ring-2 focus:ring-prada-500/30 dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-100 dark:focus:border-prada-400">
                <option value="all">Semua</option>
                <option value="aksara">Aksara</option>
                <option value="unggah_ungguh">Unggah-Ungguh</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-semibold text-sogan-900 dark:text-cream-200">
              Tingkat
              <select value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value as QuestionDifficulty | "all")} className="w-full rounded-xl border border-cream-200 bg-white px-3 py-2 outline-none transition focus:border-prada-500 focus:ring-2 focus:ring-prada-500/30 dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-100 dark:focus:border-prada-400">
                <option value="all">Semua</option>
                <option value="mudah">Mudah</option>
                <option value="sedang">Sedang</option>
                <option value="sulit">Sulit</option>
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} /> Prioritaskan materi sing kerep salah</label>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={startNewQuiz} disabled={loading} className={buttonCls}>
            {loading ? "Nyiapake…" : "Mulai Kuis"}
          </button><button type="button" onClick={startFlashcards} disabled={loading} className={buttonCls}>Flashcard ({"spaced repetition"})</button></div>
          {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      )}

      {flashcards.length > 0 && flashcards[flashIndex] && (
        <div className={`${cardCls} text-center`}>
          <p className="text-xs text-abu-500">Flashcard {flashIndex + 1}/{flashcards.length}</p>
          <h2 className="mt-4 font-display text-2xl font-bold">{flashcards[flashIndex].front}</h2>
          {!revealed ? <button type="button" className={`${buttonCls} mt-5`} onClick={() => setRevealed(true)}>Tampilake jawaban</button> : <>
            <p className="mt-5 text-xl font-semibold text-godong-700">{flashcards[flashIndex].back}</p>
            {flashcards[flashIndex].explanation && <p className="mt-2 text-sm">{flashcards[flashIndex].explanation}</p>}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" className={buttonCls} onClick={() => gradeFlashcard("again")}>Baleni</button>
              <button type="button" className={buttonCls} onClick={() => gradeFlashcard("hard")}>Angel</button>
              <button type="button" className={buttonCls} onClick={() => gradeFlashcard("good")}>Apik</button>
              <button type="button" className={buttonCls} onClick={() => gradeFlashcard("easy")}>Gampang</button>
            </div>
          </>}
        </div>
      )}

      {/* Quiz in progress */}
      {questions.length > 0 && !finished && question && (
        <div className={cardCls}>
          <div className="flex items-center justify-between text-sm">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-prada-100 text-prada-800 dark:bg-prada-900 dark:text-prada-200">
              {getCategoryLabel(question.category)}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-kuning-100 text-kuning-800 dark:bg-kuning-900 dark:text-kuning-200">
              {getDifficultyLabel(question.difficulty)}
            </span>
            <span>{index + 1}/{questions.length}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cream-200 dark:bg-sogan-700">
            <div className="h-full bg-prada-500 transition-all" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
          </div>
          <h2 className="mt-5 font-display text-2xl font-bold">{question.prompt}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {question.options.map((option) => {
              const correct = selected != null && option === question.correct_answer;
              const wrong = selected === option && option !== question.correct_answer;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => choose(option)}
                  className={`rounded-xl border px-4 py-3 text-left transition ${
                    correct
                      ? "border-green-600 bg-green-50 dark:bg-green-950"
                      : wrong
                      ? "border-red-600 bg-red-50 dark:bg-red-950"
                      : "border-cream-200 hover:border-prada-500 dark:border-sogan-700"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {selected != null && (
            <div className="mt-4">
              <p className="text-sm">
                {selected === question.correct_answer ? "Bener!" : `Durung bener. Jawabane: ${question.correct_answer}`}
              </p>
              <p className="mt-1 text-sm text-ink-900/70 dark:text-cream-200/70">{question.explanation}</p>
              <button type="button" className={`${buttonCls} mt-3`} onClick={next}>
                {index === questions.length - 1 ? "Deleng asil" : "Sabanjure"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {finished && (
        <div className={`${cardCls} text-center`}>
          <h2 className="font-display text-3xl font-bold">Rampung!</h2>
          <p className="mt-2 text-lg">Skormu {score}/{questions.length}</p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className={cardCls}><p className="text-abu-500">Sesi</p><strong>{progress.sessions}</strong></div>
            <div className={cardCls}><p className="text-abu-500">Skor paling apik</p><strong>{progress.bestScore}</strong></div>
          </div>
          <button type="button" className={`${buttonCls} mt-4`} onClick={restart}>Baleni latihan</button>
        </div>
      )}
    </section>
  );
}
