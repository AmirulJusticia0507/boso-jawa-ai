import { useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, CopyButton, ShareButton, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import { useHistory } from "../contexts/HistoryContext";
import { ApiError, transliterate } from "../services/api";
import type { Direction, TransliterateData } from "../types/basa";

export default function Aksara() {
  const [text, setText] = useState("mangan soto ing jogja");
  const [direction, setDirection] = useState<Direction>("latin_to_aksara");
  const [result, setResult] = useState<TransliterateData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { add: addHistory } = useHistory();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await transliterate({
        text,
        direction,
        include_sandhangan: true,
      });
      setResult(res.data);
      const output = direction === "latin_to_aksara" ? res.data.aksara : res.data.latin;
      if (output) {
        addHistory({ type: "transliterasi", input: text, output });
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const output = result
    ? direction === "latin_to_aksara"
      ? result.aksara
      : result.latin
    : null;
  const rules = result?.rules_applied ?? [];

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦲꦏ꧀ꦱꦫ"
        title="Transliterasi Aksara Jawa"
        desc="Nulis latin dadi aksara Jawa — pasangan, taling-tarung, lan panyigeg diolah otomatis."
      />
      <Link
        to="/aksara-table"
        className="inline-block text-sm font-semibold text-prada-600 hover:underline dark:text-prada-400"
      >
        Lihat Daftar Aksara →
      </Link>
      <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
        <label className={labelCls}>
          Teks
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          Arah
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className={inputCls}
          >
            <option value="latin_to_aksara">Latin → Aksara</option>
            <option value="aksara_to_latin">Aksara → Latin</option>
          </select>
        </label>
        <div>
          <button
            type="submit"
            disabled={loading || text.trim() === ""}
            className={buttonCls}
          >
            {loading ? "Ngolah…" : "Transliterasi"}
          </button>
        </div>
      </form>
      {error !== "" && <p className={errorCls}>{error}</p>}
      {output != null && (
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
              Hasil
            </h3>
            <div className="flex gap-2">
              <CopyButton text={output} />
              <ShareButton text={output} title="Hasil Transliterasi Aksara Jawa" />
            </div>
          </div>
          <p className="mt-2 overflow-x-auto rounded-xl bg-cream-100 p-4 font-jawa text-3xl leading-loose text-sogan-900 dark:bg-sogan-800 dark:text-cream-100">
            {output}
          </p>
          {rules.length > 0 && (
            <>
              <h4 className="mt-4 text-sm font-semibold text-sogan-900">
                Aturan yang diterapkan
              </h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-900/80">
                {rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
