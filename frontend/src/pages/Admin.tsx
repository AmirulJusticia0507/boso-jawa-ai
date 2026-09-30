import { useState } from "react";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import { adminRequest, ApiError } from "../services/api";

type Resource = "kawruh" | "paribasan";
type Action = "create" | "update" | "delete";

const EXAMPLES: Record<Resource, object> = {
  kawruh: {
    ngoko: "mangan",
    krama_lugu: "nedha",
    krama_inggil: "dhahar",
    bahasa_indonesia: "makan",
    kelas_kata: "Tembung Kriya",
    contoh_ukara: "Bapak dhahar sekul.",
  },
  paribasan: {
    teks: "Alon-alon waton kelakon",
    tegese: "Sabar lan tliti supaya tujuane kasil.",
    kategori: "paribasan",
    padanan_indonesia: "Pelan-pelan asalkan tercapai.",
  },
};

export default function Admin() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("boso-jawa-admin-key") ?? "");
  const [resource, setResource] = useState<Resource>("kawruh");
  const [action, setAction] = useState<Action>("create");
  const [itemId, setItemId] = useState("");
  const [json, setJson] = useState(() => JSON.stringify(EXAMPLES.kawruh, null, 2));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function selectResource(value: Resource) {
    setResource(value);
    setJson(JSON.stringify(EXAMPLES[value], null, 2));
    setResult("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      sessionStorage.setItem("boso-jawa-admin-key", apiKey);
      const needsId = action !== "create";
      if (needsId && !/^\d+$/.test(itemId)) throw new Error("ID wajib berupa angka.");
      const path = `/${resource}${needsId ? `/${itemId}` : ""}`;
      const payload = action === "delete" ? undefined : JSON.parse(json);
      const response = await adminRequest(path, apiKey, action === "create" ? "POST" : action === "update" ? "PUT" : "DELETE", payload);
      setResult(JSON.stringify(response, null, 2));
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Operasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader aksara="ꦥꦔꦼꦭꦺꦴꦭ" title="Admin Konten" desc="Kelola data Kawruh lan Paribasan nganggo API sing dilindhungi kunci admin." />
      <div className={cardCls}>
        <p className="text-sm">Kunci hanya disimpan selama tab browser ini terbuka. Atur <code>ADMIN_API_KEY</code> pada environment backend.</p>
      </div>
      <form onSubmit={submit} className={`${cardCls} grid gap-4`}>
        <label className={labelCls}>Admin key<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputCls} required /></label>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelCls}>Resource<select value={resource} onChange={(e) => selectResource(e.target.value as Resource)} className={inputCls}><option value="kawruh">Kawruh</option><option value="paribasan">Paribasan</option></select></label>
          <label className={labelCls}>Operasi<select value={action} onChange={(e) => setAction(e.target.value as Action)} className={inputCls}><option value="create">Create</option><option value="update">Update</option><option value="delete">Delete</option></select></label>
          <label className={labelCls}>ID {action === "create" ? "(tidak dipakai)" : ""}<input value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={action === "create"} className={inputCls} inputMode="numeric" /></label>
        </div>
        {action !== "delete" && <label className={labelCls}>Payload JSON<textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} className={`${inputCls} font-mono text-xs`} /></label>}
        <button type="submit" disabled={loading || apiKey === ""} className={`${buttonCls} w-fit`}>{loading ? "Ngolah…" : "Jalankan"}</button>
      </form>
      {error !== "" && <p className={errorCls}>{error}</p>}
      {result !== "" && <pre className={`${cardCls} overflow-auto text-xs`}>{result}</pre>}
    </section>
  );
}
