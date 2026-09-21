import { useState } from "react";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import { ApiError, checkMacapat } from "../services/api";
import type { MacapatCheckResponse } from "../types/basa";

const CONTOH = [
  "Bapak Pocung dudu watu dudu gunung",
  "Sangkane ing sabrang",
  "Elinga pepeling iki",
  "Mrih rahayu donya tumekan akhirat",
].join("\n");

export default function Macapat() {
  const [nama, setNama] = useState("Pocung");
  const [lirik, setLirik] = useState(CONTOH);
  const [result, setResult] = useState<MacapatCheckResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const lines = lirik
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s !== "");
      const res = await checkMacapat({ nama_tembang: nama, lirik: lines });
      setResult(res);
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦩꦕꦥꦠ꧀"
        title="Checker Tembang Macapat"
        desc="Priksa lirik gatra per gatra tumrap paugeran: guru gatra, wilangan, lan lagu."
      />
      <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
        <label className={labelCls}>
          Nama tembang
          <input
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className={inputCls}
          />
        </label>
        <label className={labelCls}>
          Lirik (satu gatra per baris)
          <textarea
            value={lirik}
            onChange={(e) => setLirik(e.target.value)}
            rows={6}
            className={inputCls}
          />
        </label>
        <div>
          <button type="submit" disabled={loading} className={buttonCls}>
            {loading ? "Mriksa…" : "Priksa Paugeran"}
          </button>
        </div>
      </form>
      {error !== "" && <p className={errorCls}>{error}</p>}
      {result != null && (
        <div className={cardCls}>
          <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
            {result.nama_tembang}:{" "}
            <span
              className={
                result.is_valid ? "text-godong-700 dark:text-green-400" : "text-red-700 dark:text-red-400"
              }
            >
              {result.is_valid ? "Valid ✓" : "Tidak valid ✗"}
            </span>
          </h3>
          {result.errors.map((msg) => (
            <p key={msg} className="mt-2 text-sm text-red-700 dark:text-red-400">
              {msg}
            </p>
          ))}
          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-cream-100 text-left text-sogan-900 dark:bg-sogan-800 dark:text-cream-100">
                  <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">Gatra</th>
                  <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                    Wilangan
                  </th>
                  <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">Lagu</th>
                  <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {result.analysis.map((a) => (
                  <tr
                    key={a.gatra}
                    className={a.valid ? "" : "bg-red-50 dark:bg-red-950"}
                  >
                    <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                      {a.gatra}. {a.text}
                    </td>
                    <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                      {a.actual_wilangan} / {a.target_wilangan ?? "?"}
                    </td>
                    <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                      {a.actual_lagu} / {a.target_lagu ?? "?"}
                    </td>
                    <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                      {a.valid ? "✓" : "✗"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
