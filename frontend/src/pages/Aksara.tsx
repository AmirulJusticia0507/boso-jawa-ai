import { useState } from "react";
import { ApiError, transliterate } from "../services/api";
import type { Direction, TransliterateData } from "../types/basa";

export default function Aksara() {
  const [text, setText] = useState("mangan soto ing jogja");
  const [direction, setDirection] = useState<Direction>("latin_to_aksara");
  const [result, setResult] = useState<TransliterateData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <section>
      <h2>Transliterasi Aksara Jawa</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Teks
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
          />
        </label>
        <label>
          Arah
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
          >
            <option value="latin_to_aksara">Latin → Aksara</option>
            <option value="aksara_to_latin">Aksara → Latin</option>
          </select>
        </label>
        <button type="submit" disabled={loading || text.trim() === ""}>
          {loading ? "Ngolah…" : "Transliterasi"}
        </button>
      </form>
      {error !== "" && <p className="error">{error}</p>}
      {output != null && (
        <div className="result">
          <h3>Hasil</h3>
          <p className="aksara">{output}</p>
          {rules.length > 0 && (
            <>
              <h4>Aturan yang diterapkan</h4>
              <ul>
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
