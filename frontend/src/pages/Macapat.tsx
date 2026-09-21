import { useState } from "react";
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
    <section>
      <h2>Checker Tembang Macapat</h2>
      <form onSubmit={handleSubmit} className="form">
        <label>
          Nama tembang
          <input value={nama} onChange={(e) => setNama(e.target.value)} />
        </label>
        <label>
          Lirik (satu gatra per baris)
          <textarea
            value={lirik}
            onChange={(e) => setLirik(e.target.value)}
            rows={6}
          />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Mriksa…" : "Priksa Paugeran"}
        </button>
      </form>
      {error !== "" && <p className="error">{error}</p>}
      {result != null && (
        <div className="result">
          <h3>
            {result.nama_tembang}:{" "}
            <span className={result.is_valid ? "ok" : "bad"}>
              {result.is_valid ? "Valid ✓" : "Tidak valid ✗"}
            </span>
          </h3>
          {result.errors.map((msg) => (
            <p key={msg} className="error">
              {msg}
            </p>
          ))}
          <table className="table">
            <thead>
              <tr>
                <th>Gatra</th>
                <th>Wilangan</th>
                <th>Lagu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {result.analysis.map((a) => (
                <tr key={a.gatra} className={a.valid ? "" : "row-bad"}>
                  <td>
                    {a.gatra}. {a.text}
                  </td>
                  <td>
                    {a.actual_wilangan} / {a.target_wilangan ?? "?"}
                  </td>
                  <td>
                    {a.actual_lagu} / {a.target_lagu ?? "?"}
                  </td>
                  <td>{a.valid ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
