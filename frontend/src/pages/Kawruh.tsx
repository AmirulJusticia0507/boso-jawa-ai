import { useState } from "react";
import { ApiError, searchKawruh } from "../services/api";
import type { KawruhItem } from "../types/basa";

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
    <section>
      <h2>Kawruh Basa (Undha-Usuk)</h2>
      <form onSubmit={handleSubmit} className="form form-inline">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Goleki tembung…"
        />
        <button type="submit" disabled={loading || q.trim() === ""}>
          {loading ? "Ngoleki…" : "Golek"}
        </button>
      </form>
      {error !== "" && <p className="error">{error}</p>}
      {searched && error === "" && (
        <div className="result">
          <p>
            Ketemu <strong>{total}</strong> tembung.
          </p>
          {rows.map((r) => (
            <article key={r.id} className="entry">
              <h3>{r.ngoko}</h3>
              <dl>
                <dt>Krama Lugu</dt>
                <dd>{r.krama_lugu ?? "—"}</dd>
                <dt>Krama Inggil</dt>
                <dd>{r.krama_inggil ?? "—"}</dd>
                <dt>Indonesia</dt>
                <dd>{r.bahasa_indonesia}</dd>
                <dt>Kelas kata</dt>
                <dd>{r.kelas_kata ?? "—"}</dd>
              </dl>
              {r.contoh_ukara != null && (
                <p className="example">“{r.contoh_ukara}”</p>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
