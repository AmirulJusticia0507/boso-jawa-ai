import { useEffect, useState } from "react";
import { PageHeader, CopyButton, cardCls, errorCls, inputCls } from "../components/ui";
import { ApiError, listParibasan } from "../services/api";
import type { ParibasanKategori, ParibasanItem } from "../types/basa";

const KATEGORI: Array<{ key: ParibasanKategori | "all"; label: string; aksara: string }> = [
  { key: "all", label: "Kabeh", aksara: "ꦏ" },
  { key: "paribasan", label: "Paribasan", aksara: "ꦥ" },
  { key: "bebasan", label: "Bebasan", aksara: "ꦧ" },
  { key: "saloka", label: "Saloka", aksara: "ꦱ" },
];

export default function Paribasan() {
  const [rows, setRows] = useState<ParibasanItem[]>([]);
  const [total, setTotal] = useState(0);
  const [kategori, setKategori] = useState<ParibasanKategori | "all">("all");
  const [q, setQ] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await listParibasan({
          kategori: kategori === "all" ? undefined : kategori,
          q: q.trim() === "" ? undefined : q.trim(),
          limit: 100,
        });
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.total);
      } catch (err) {
        if (cancelled) return;
        setRows([]);
        setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timer = setTimeout(load, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [kategori, q]);

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦥꦫꦶꦧꦱꦤ꧀"
        title="Paribasan, Bebasan, lan Saloka"
        desc="Kumpulan unèn-unèn / peribahasa Jawa bebarengan karo tegese."
      />

      <div className="flex flex-wrap items-center gap-2">
        {KATEGORI.map((k) => (
          <button
            key={k.key}
            type="button"
            onClick={() => setKategori(k.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              kategori === k.key
                ? "bg-sogan-800 text-cream-50 dark:bg-prada-500 dark:text-sogan-950"
                : "border border-cream-200 bg-white text-sogan-800 hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-200 dark:hover:bg-sogan-700"
            }`}
          >
            <span className="font-jawa mr-1.5">{k.aksara}</span>
            {k.label}
          </button>
        ))}
      </div>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Goleki unèn-unèn…"
        className={`${inputCls} max-w-sm`}
      />

      {error !== "" && <p className={errorCls}>{error}</p>}

      {loading && (
        <p className="text-sm text-ink-900/60 dark:text-cream-200/60">
          Ngoleki…
        </p>
      )}

      {!loading && rows.length === 0 && error === "" && (
        <p className="text-sm text-ink-900/60 dark:text-cream-200/60">
          Data ora ketemu. Jaluk seed dhisik: <code>python seed_paribasan.py</code>
        </p>
      )}

      {total > 0 && (
        <p className="text-sm text-ink-900/70 dark:text-cream-200/70">
          Ketemu <strong className="text-sogan-900 dark:text-cream-50">{total}</strong> unèn-unèn.
        </p>
      )}

      <div className="space-y-4">
        {rows.map((r) => (
          <article key={r.id} className={cardCls}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
                    “{r.teks}”
                  </h3>
                  <span className="rounded-full bg-cream-100 px-2.5 py-0.5 text-xs font-medium capitalize text-sogan-700 dark:bg-sogan-800 dark:text-prada-300">
                    {r.kategori}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
                  <span className="font-semibold text-prada-600 dark:text-prada-400">
                    Tegese:
                  </span>{" "}
                  {r.tegese}
                </p>
                {r.padanan_indonesia != null && (
                  <p className="mt-1 border-l-2 border-prada-500 pl-3 text-sm italic text-ink-900/70 dark:text-cream-200/70">
                    {r.padanan_indonesia}
                  </p>
                )}
              </div>
              <CopyButton text={r.teks} className="shrink-0" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}