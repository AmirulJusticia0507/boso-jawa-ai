import { useState } from "react";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls } from "../components/ui";
import BookmarkButton from "../components/BookmarkButton";
import { ApiError, correctUndhaUsuk, searchKawruh } from "../services/api";
import type { BasaLevel, CorrectionResponse, KawruhItem } from "../types/basa";

const FIELDS: Array<[string, (r: KawruhItem) => string | null]> = [
  ["Krama Lugu", (r) => r.krama_lugu],
  ["Krama Inggil", (r) => r.krama_inggil],
  ["Indonesia", (r) => r.bahasa_indonesia],
  ["Kelas kata", (r) => r.kelas_kata],
];

export default function Kawruh() {
  const [q, setQ] = useState("mangan");
  const [rows, setRows] = useState<KawruhItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sentence, setSentence] = useState("Aku arep mangan banjur lunga.");
  const [targetLevel, setTargetLevel] = useState<BasaLevel>("krama_inggil");
  const [correction, setCorrection] = useState<CorrectionResponse | null>(null);
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState("");

  async function load(targetPage: number) {
    setLoading(true);
    setError("");
    try {
      const res = await searchKawruh(q, 10, targetPage);
      setRows(res.data);
      setTotal(res.total);
      setPage(res.page);
      setHasNext(res.has_next);
      setSearched(true);
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await load(1);
  }

  async function handleCorrection(e: React.FormEvent) {
    e.preventDefault();
    setCorrecting(true);
    setCorrectionError("");
    try {
      setCorrection(await correctUndhaUsuk(sentence, targetLevel));
    } catch (err) {
      setCorrection(null);
      setCorrectionError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setCorrecting(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦏꦮꦿꦸꦃ"
        title="Kawruh Basa (Undha-Usuk)"
        desc="Goleki padanan tembung ngoko, krama lugu, krama inggil, lan Indonesia."
      />
      <div className={cardCls}>
        <h2 className="font-display text-xl font-bold">Korektor Unggah-Ungguh</h2>
        <p className="mt-1 text-sm text-ink-900/70 dark:text-cream-200/70">
          Owahi padanan tembung menyang tingkat basa sing dikarepake lan delengen katrangan saben owahan.
        </p>
        <form onSubmit={handleCorrection} className="mt-4 grid gap-3">
          <textarea value={sentence} onChange={(e) => setSentence(e.target.value)} rows={3} maxLength={2000} className={inputCls} placeholder="Tulis ukara Jawa…" />
          <div className="flex flex-wrap gap-2">
            <select value={targetLevel} onChange={(e) => setTargetLevel(e.target.value as BasaLevel)} className={`${inputCls} max-w-xs`}>
              <option value="ngoko">Ngoko</option>
              <option value="krama_lugu">Krama Lugu</option>
              <option value="krama_inggil">Krama Inggil</option>
            </select>
            <button type="submit" disabled={correcting || sentence.trim() === ""} className={buttonCls}>{correcting ? "Mbenerake…" : "Benerake Ukara"}</button>
          </div>
        </form>
        {correctionError !== "" && <p className={`${errorCls} mt-3`}>{correctionError}</p>}
        {correction != null && (
          <div className="mt-4 rounded-xl bg-cream-100 p-4 dark:bg-sogan-800">
            <p className="font-display text-lg font-bold">{correction.corrected}</p>
            {correction.changes.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">
                {correction.changes.map((change, index) => (
                  <li key={`${change.original}-${index}`}><strong>{change.original}</strong> → <strong>{change.replacement}</strong> ({change.meaning})</li>
                ))}
              </ul>
            ) : <p className="mt-2 text-sm">Ora ana padanan kamus sing perlu diowahi.</p>}
            <p className="mt-3 text-xs text-ink-900/60 dark:text-cream-200/60">{correction.note}</p>
          </div>
        )}
      </div>

      <h2 className="font-display text-xl font-bold">Kamus Undha-Usuk</h2>
      <form onSubmit={handleSubmit} className="flex max-w-2xl gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Goleki tembung…"
          className={inputCls}
        />
        <button
          type="submit"
          disabled={loading || q.trim() === ""}
          className={`${buttonCls} shrink-0`}
        >
          {loading ? "Ngoleki…" : "Golek"}
        </button>
      </form>
      {error !== "" && <p className={errorCls}>{error}</p>}
      {searched && error === "" && (
        <div className="space-y-3">
          <p className="text-sm text-ink-900/70 dark:text-cream-200/70">
            Ketemu <strong className="text-sogan-900 dark:text-cream-50">{total}</strong> tembung.
          </p>
          {rows.map((r) => (
            <article key={r.id} className={`${cardCls} mt-0`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display text-2xl font-bold text-sogan-900 dark:text-cream-50">
                  {r.ngoko}
                </h3>
                <BookmarkButton resourceType="kawruh" resourceId={r.id} title={r.ngoko} />
              </div>
              <dl className="mt-2 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1 text-sm">
                {FIELDS.map(([label, get]) => (
                  <div key={label} className="contents">
                    <dt className="font-semibold text-sogan-700 dark:text-prada-300">{label}</dt>
                    <dd className="dark:text-cream-200">{get(r) ?? "—"}</dd>
                  </div>
                ))}
              </dl>
              {r.contoh_ukara != null && (
                <p className="mt-2 border-l-2 border-prada-500 pl-3 text-sm italic text-ink-900/80 dark:text-cream-200/80">
                  “{r.contoh_ukara}”
                </p>
              )}
            </article>
          ))}
          {total > 10 && (
            <div className="flex items-center gap-3">
              <button type="button" className={buttonCls} disabled={loading || page === 1} onClick={() => void load(page - 1)}>Sadurunge</button>
              <span className="text-sm">Kaca {page}</span>
              <button type="button" className={buttonCls} disabled={loading || !hasNext} onClick={() => void load(page + 1)}>Sabanjure</button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
