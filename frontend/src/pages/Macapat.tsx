import { useState } from "react";
import tembang from "../data/macapat.json";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import { useHistory } from "../contexts/HistoryContext";
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
  const { add: addHistory } = useHistory();

  const pilihan = tembang.find((item) => item.nama === nama)!;

  function pilihTembang(value: string) {
    setNama(value);
    setResult(null);
    setError("");
  }

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
      addHistory({
        type: "macapat",
        input: `${nama}: ${lines.join(", ")}`,
        output: res.is_valid ? "Valid" : res.errors.join("; "),
      });
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
        title="Tembang Macapat"
        desc="Kenali 11 jenis tembang macapat, watak, dan paugerannya, lalu periksa lirikmu."
      />
      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold">Mengenal paugeran macapat</h3>
        <p className="mt-2 text-sm leading-relaxed">
          Macapat terikat guru gatra (jumlah baris per bait), guru wilangan
          (jumlah suku kata per baris), dan guru lagu (bunyi vokal terakhir setiap baris).
          Pola 12i berarti 12 suku kata dengan vokal akhir i.
          Berikut pola dasar yang digunakan checker; beberapa tradisi mengenal variasi paugeran.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tembang.map((item) => (
          <article key={item.nama} className={`${cardCls} !mt-0`}>
            <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
              {item.nama}{item.alias && <span className="text-sm font-normal"> / {item.alias}</span>}
            </h3>
            <p className="mt-2 text-sm">{item.watak}</p>
            <p className="mt-3 text-sm font-semibold">Guru gatra: {item.paugeran.length} baris</p>
            <p className="mt-1 text-sm">Wilangan &amp; lagu: {item.paugeran.join(" / ")}</p>
            <button type="button" disabled={loading} onClick={() => {
              pilihTembang(item.nama);
              document.getElementById("macapat-checker")?.scrollIntoView({ behavior: "smooth" });
              document.getElementById("nama-tembang")?.focus({ preventScroll: true });
            }} className={`${buttonCls} mt-4 text-sm`}>
              Priksa {item.nama}
            </button>
          </article>
        ))}
      </div>
      <aside className={cardCls}>
        <h3 className="font-display text-xl font-bold">Apakah Cublak-Cublak Suweng termasuk macapat?</h3>
        <p className="mt-2 text-sm leading-relaxed">
          Cublak-Cublak Suweng termasuk tembang dolanan, yaitu lagu yang biasa
          dinyanyikan anak-anak sambil bermain bersama. Tembang dolanan tidak
          mengikuti paugeran 11 jenis macapat di atas, sehingga tidak diperiksa
          dengan checker macapat.
        </p>
        <p className="mt-3 text-sm">
          Rujukan: <a className="underline" href="https://javanologi.uns.ac.id/jv/2023/08/09/cublak-cublak-suweng-2-copy/">Javanologi UNS - Cublak-Cublak Suweng</a>
          {" | "}<a className="underline" href="https://javanologi.uns.ac.id/2020/01/">Javanologi UNS - 11 jenis macapat</a>
        </p>
      </aside>
      <h3 id="macapat-checker" className="scroll-mt-6 font-display text-2xl font-bold">Checker Tembang Macapat</h3>
      <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
        <label className={labelCls}>
          Nama tembang
          <select
            id="nama-tembang"
            value={nama}
            disabled={loading}
            onChange={(e) => pilihTembang(e.target.value)}
            className={inputCls}
          >
            {tembang.map((item) => (
              <option key={item.nama} value={item.nama}>
                {item.nama}{item.alias ? ` / ${item.alias}` : ""}
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm">
          {pilihan.paugeran.length} gatra: {pilihan.paugeran.join(" / ")}
        </p>
        <label className={labelCls}>
          Lirik (satu gatra per baris)
          <textarea
            value={lirik}
            disabled={loading}
            onChange={(e) => { setLirik(e.target.value); setResult(null); setError(""); }}
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
