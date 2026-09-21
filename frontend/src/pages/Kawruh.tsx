import { useState } from "react";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls } from "../components/ui";
import { ApiError, searchKawruh } from "../services/api";
import type { KawruhItem } from "../types/basa";

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
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await searchKawruh(q);
      setRows(res.data);
      setTotal(res.total);
      setSearched(true);
    } catch (err) {
      setRows([]);
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦏꦮꦿꦸꦃ"
        title="Kawruh Basa (Undha-Usuk)"
        desc="Goleki padanan tembung ngoko, krama lugu, krama inggil, lan Indonesia."
      />
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
              <h3 className="font-display text-2xl font-bold text-sogan-900 dark:text-cream-50">
                {r.ngoko}
              </h3>
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
        </div>
      )}
    </section>
  );
}
