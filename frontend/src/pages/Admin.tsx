import { useState, useEffect } from "react";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import {
  adminRequest,
  getAdminSession,
  importAdminDataset,
  listAdminQuizQuestions,
  ApiError,
  QuizQuestion,
  QuestionCategory,
  QuestionDifficulty,
} from "../services/api";

/** Jumlah baris per halaman pada daftar admin. */
const LIST_PAGE_SIZE = 20;

type Resource = "kawruh" | "paribasan" | "quiz";
type Action = "create" | "update" | "delete" | "import" | "export";

const EXAMPLES: Record<Exclude<Resource, "quiz">, object> = {
  kawruh: {
    ngoko: "mangan",
    krama_lugu: "nedha",
    krama_inggil: "dhahar",
    bahasa_indonesia: "makan",
    kelas_kata: "Tembung Kriya",
    contoh_ukara: "Bapak dhahar sekul.",
    status: "draft",
  },
  paribasan: {
    teks: "Alon-alon waton kelakon",
    tegese: "Sabar lan tliti supaya tujuane kasil.",
    kategori: "paribasan",
    padanan_indonesia: "Pelan-pelan asalkan tercapai.",
    status: "draft",
  },
};

const QUIZ_EXAMPLE = {
  category: "aksara" as QuestionCategory,
  difficulty: "sedang" as QuestionDifficulty,
  prompt: "Apa wacan aksara ꦲ?",
  options: ["ha", "na", "ca", "ra"],
  correct_answer: "ha",
  explanation: "ꦲ yaiku aksara carakan ha.",
  is_active: true,
};

interface KawruhItem {
  id: number;
  ngoko: string;
  krama_lugu: string | null;
  krama_inggil: string | null;
  bahasa_indonesia: string;
  kelas_kata: string | null;
  contoh_ukara: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string | null;
}

interface ParibasanItem {
  id: number;
  teks: string;
  tegese: string;
  kategori: string;
  padanan_indonesia: string | null;
  status: string;
  deleted_at: string | null;
  created_at: string | null;
}

type AdminRow = KawruhItem | ParibasanItem | QuizQuestion;

interface AdminListResponse<T> {
  status: string;
  total: number;
  page: number;
  limit: number;
  has_next: boolean;
  data: T[];
}

export default function Admin() {
  const [apiKey, setApiKey] = useState(() => sessionStorage.getItem("boso-jawa-admin-key") ?? "");
  const [resource, setResource] = useState<Resource>("kawruh");
  const [action, setAction] = useState<Action>("create");
  const [itemId, setItemId] = useState("");
  const [json, setJson] = useState(() => JSON.stringify(EXAMPLES.kawruh, null, 2));
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  // List view state
  const [showList, setShowList] = useState(false);
  const [listPage, setListPage] = useState(1);
  const [listLimit] = useState(LIST_PAGE_SIZE);
  const [listStatus, setListStatus] = useState("");
  const [listKategori, setListKategori] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [listIncludeDeleted, setListIncludeDeleted] = useState(false);
  const [listData, setListData] = useState<AdminRow[]>([]);
  const [listTotal, setListTotal] = useState(0);
  const [listHasNext, setListHasNext] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number; title: string } | null>(null);

  function selectResource(value: Resource) {
    setResource(value);
    if (value === "quiz") {
      setJson(JSON.stringify(QUIZ_EXAMPLE, null, 2));
    } else {
      setJson(JSON.stringify(EXAMPLES[value], null, 2));
    }
    setResult("");
    setListData([]);
    setListPage(1);
    setListStatus("");
    setListKategori("");
    setListSearch("");
    setListIncludeDeleted(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult("");
    try {
      sessionStorage.setItem("boso-jawa-admin-key", apiKey);
      const needsId = action === "update" || action === "delete";
      if (needsId && !/^\d+$/.test(itemId)) throw new Error("ID wajib berupa angka.");

      let path = "";
      let method = "";
      let payload: unknown = undefined;

      if (resource === "quiz") {
        // Quiz CRUD via /admin/learning/questions
        const basePath = "/learning/questions";
        if (action === "create") {
          path = basePath;
          method = "POST";
          payload = JSON.parse(json);
        } else if (action === "update") {
          path = `${basePath}/${itemId}`;
          method = "PUT";
          payload = JSON.parse(json);
        } else if (action === "delete") {
          path = `${basePath}/${itemId}`;
          method = "DELETE";
        } else if (action === "export") {
          path = basePath;
          method = "GET";
        } else if (action === "import") {
          path = basePath;
          method = "POST";
          const rawPayload = JSON.parse(json);
          payload = { items: Array.isArray(rawPayload) ? rawPayload : [rawPayload] };
        }
      } else {
        // Kawruh/Paribasan CRUD
        path = `/${resource}${needsId ? `/${itemId}` : action === "import" || action === "export" ? `/${action}` : ""}`;
        const rawPayload = action === "delete" || action === "export" ? undefined : JSON.parse(json);
        payload = action === "import" ? { items: Array.isArray(rawPayload) ? rawPayload : [rawPayload] } : rawPayload;
        method = action === "export" ? "GET" : action === "update" ? "PUT" : action === "delete" ? "DELETE" : "POST";
      }

      const response = await adminRequest(path, apiKey, method, payload);
      setResult(JSON.stringify(response, null, 2));
      if (showList) fetchList();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Operasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function checkSession() {
    if (!apiKey) {
      setRole("");
      setPermissions([]);
      return;
    }
    try {
      const response = await getAdminSession(apiKey);
      sessionStorage.setItem("boso-jawa-admin-key", apiKey);
      setRole(response.data.role);
      setPermissions(response.data.permissions);
      setError("");
    } catch (err) {
      setRole("");
      setPermissions([]);
      setError(err instanceof Error ? err.message : "Kunci tidak valid.");
    }
  }

  async function uploadDataset(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !apiKey) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const extension = uploadFile.name.toLowerCase().split(".").pop();
      if (extension !== "json" && extension !== "csv") throw new Error("File harus berformat JSON atau CSV.");
      const response = await importAdminDataset(
        apiKey,
        await uploadFile.text(),
        extension === "csv" ? "text/csv" : "application/json",
      );
      setResult(JSON.stringify(response, null, 2));
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchList() {
    if (!apiKey) return;
    setListLoading(true);
    setError("");
    try {
      let response: AdminListResponse<AdminRow>;

      if (resource === "quiz") {
        response = await listAdminQuizQuestions(apiKey, { page: listPage, limit: listLimit, status: listStatus, q: listSearch, include_deleted: listIncludeDeleted }) as AdminListResponse<AdminRow>;
      } else {
        const params = new URLSearchParams({
          page: String(listPage),
          limit: String(listLimit),
          ...(listStatus && { status: listStatus }),
          ...(listSearch && { q: listSearch }),
          ...(listIncludeDeleted && { include_deleted: "true" }),
          ...(resource === "paribasan" && listKategori && { kategori: listKategori }),
        });
        const path = `/${resource}?${params.toString()}`;
        response = await adminRequest(path, apiKey, "GET") as AdminListResponse<AdminRow>;
      }

      setListData(response.data);
      setListTotal(response.total);
      setListHasNext(response.has_next);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal memuat daftar.");
    } finally {
      setListLoading(false);
    }
  }

  async function handleDelete(id: number, title: string) {
    setDeleteConfirm({ open: true, id, title });
  }

  async function confirmDelete() {
    if (!deleteConfirm || !apiKey) return;
    setLoading(true);
    setError("");
    try {
      let path = "";
      if (resource === "quiz") {
        path = `/learning/questions/${deleteConfirm.id}`;
      } else {
        path = `/${resource}/${deleteConfirm.id}`;
      }
      await adminRequest(path, apiKey, "DELETE");
      setResult(`Berhasil menghapus ${resource === "quiz" ? "Quiz" : resource} ID ${deleteConfirm.id} (soft delete)`);
      fetchList();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal menghapus.");
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  }

  async function handleRestore(id: number) {
    if (!apiKey) return;
    setLoading(true);
    setError("");
    try {
      if (resource === "quiz") {
        // Quiz doesn't have restore yet, treat as update is_active=true
        const path = `/learning/questions/${id}`;
        await adminRequest(path, apiKey, "PUT", { is_active: true });
        setResult(`Berhasil mengaktifkan Quiz ID ${id}`);
      } else {
        const path = `/${resource}/${id}/restore`;
        await adminRequest(path, apiKey, "POST");
        setResult(`Berhasil memulihkan ${resource} ID ${id}`);
      }
      fetchList();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal memulihkan.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (showList && apiKey) {
      fetchList();
    }
  }, [showList, listPage, listStatus, listSearch, listIncludeDeleted, listKategori, apiKey, resource]);

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      published: "bg-godong-100 text-godong-800 dark:bg-godong-900 dark:text-godong-200",
      draft: "bg-kuning-100 text-kuning-800 dark:bg-kuning-900 dark:text-kuning-200",
      review: "bg-biru-100 text-biru-800 dark:bg-biru-900 dark:text-biru-200",
      true: "bg-godong-100 text-godong-800 dark:bg-godong-900 dark:text-godong-200",
      false: "bg-merah-100 text-merah-800 dark:bg-merah-900 dark:text-merah-200",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || "bg-abu-100 text-abu-800"}`}>
        {status === "true" ? "Aktif" : status === "false" ? "Tidak Aktif" : status}
      </span>
    );
  }

  function getCategoryLabel(cat: QuestionCategory) {
    return cat === "aksara" ? "Aksara" : "Unggah-Ungguh";
  }

  function getDifficultyLabel(diff: QuestionDifficulty) {
    const labels: Record<QuestionDifficulty, string> = { mudah: "Mudah", sedang: "Sedang", sulit: "Sulit" };
    return labels[diff];
  }

  return (
    <section className="space-y-5">
      <PageHeader aksara="ꦥꦔꦼꦭꦺꦴꦭ" title="Admin Konten" desc="Kelola data Kawruh, Paribasan, lan Kuis nganggo API sing dilindhungi kunci admin." />
      <div className={cardCls}>
        <p className="text-sm">Kunci hanya disimpan selama tab browser iki terbuka. Atur <code>ADMIN_API_KEY</code>, <code>EDITOR_API_KEY</code>, utawa <code>REVIEWER_API_KEY</code> ing environment backend.</p>
        <div className="mt-3 flex items-end gap-3">
          <label className={`${labelCls} grow`}>Kunci akses<input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className={inputCls} /></label>
          <button type="button" onClick={checkSession} disabled={!apiKey || loading} className={buttonCls}>Cek akses</button>
          {role && <span className="rounded-full bg-godong-100 px-3 py-2 text-sm font-semibold text-godong-800">{role}</span>}
        </div>
        {role && <p className="mt-2 text-xs text-abu-600 dark:text-abu-400">Permission: {permissions.join(", ")}</p>}
      </div>

      <form onSubmit={uploadDataset} className={`${cardCls} grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end`}>
        <label className={labelCls}>Upload dataset AI JSON/CSV
          <input type="file" accept=".json,.csv,application/json,text/csv" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} className={inputCls} />
        </label>
        <button type="submit" disabled={!uploadFile || !apiKey || loading || (role !== "" && !permissions.includes("dataset.write"))} className={buttonCls}>
          {loading ? "Ngunggah…" : "Upload dataset"}
        </button>
      </form>

      <div className={`${cardCls} grid gap-4`}>
        <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showList}
              onChange={(e) => setShowList(e.target.checked)}
              className="w-4 h-4 rounded border-cream-300 text-prada-600 focus:ring-prada-500"
            />
            <span className="font-medium text-sogan-800 dark:text-cream-200">Tampilkan daftar konten</span>
          </label>
          {showList && (
            <select
              value={resource}
              onChange={(e) => selectResource(e.target.value as Resource)}
              className={inputCls}
              style={{ width: "auto" }}
            >
              <option value="kawruh">Kawruh Basa</option>
              <option value="paribasan">Paribasan</option>
              <option value="quiz">Soal Kuis</option>
            </select>
          )}
        </div>

        {showList ? (
          <>
            {/* Filter & Search */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {resource === "quiz" ? (
                <>
                  <label className={labelCls}>
                    Kategori
                    <select value={listStatus} onChange={(e) => setListStatus(e.target.value)} className={inputCls}>
                      <option value="">Semua</option>
                      <option value="aksara">Aksara</option>
                      <option value="unggah_ungguh">Unggah-Ungguh</option>
                    </select>
                  </label>
                  <label className={labelCls}>
                    Tingkat
                    <select value={listSearch} onChange={(e) => { setListSearch(e.target.value); setListPage(1); }} className={inputCls}>
                      <option value="">Semua</option>
                      <option value="mudah">Mudah</option>
                      <option value="sedang">Sedang</option>
                      <option value="sulit">Sulit</option>
                    </select>
                  </label>
                  <label className="flex items-end gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={listIncludeDeleted}
                      onChange={(e) => { setListIncludeDeleted(e.target.checked); setListPage(1); }}
                      className="w-4 h-4 rounded border-cream-300 text-prada-600 focus:ring-prada-500"
                    />
                    <span className="font-medium text-sogan-800 dark:text-cream-200">Sertakan non-aktif</span>
                  </label>
                </>
              ) : (
                <>
                  <label className={labelCls}>
                    Status
                    <select value={listStatus} onChange={(e) => setListStatus(e.target.value)} className={inputCls}>
                      <option value="">Semua</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                      <option value="review">Review</option>
                    </select>
                  </label>
                  {resource === "paribasan" && (
                    <label className={labelCls}>
                      Kategori
                      <select value={listKategori} onChange={(e) => setListKategori(e.target.value)} className={inputCls}>
                        <option value="">Semua</option>
                        <option value="paribasan">Paribasan</option>
                        <option value="bebasan">Bebasan</option>
                        <option value="saloka">Saloka</option>
                      </select>
                    </label>
                  )}
                  <label className={labelCls}>
                    Cari
                    <input
                      type="text"
                      value={listSearch}
                      onChange={(e) => { setListSearch(e.target.value); setListPage(1); }}
                      placeholder={resource === "kawruh" ? "ngoko, krama, indonesia..." : "teks, tegese, indonesia..."}
                      className={inputCls}
                    />
                  </label>
                  <label className="flex items-end gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={listIncludeDeleted}
                      onChange={(e) => { setListIncludeDeleted(e.target.checked); setListPage(1); }}
                      className="w-4 h-4 rounded border-cream-300 text-prada-600 focus:ring-prada-500"
                    />
                    <span className="font-medium text-sogan-800 dark:text-cream-200">Sertakan terhapus</span>
                  </label>
                </>
              )}
            </div>

            {/* Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-cream-200 dark:border-sogan-700">
                    {resource === "kawruh" ? (
                      <>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">ID</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Ngoko</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Krama Lugu</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Krama Inggil</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Indonesia</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Kelas</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Status</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Dihapus</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Aksi</th>
                      </>
                    ) : resource === "paribasan" ? (
                      <>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">ID</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Teks</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Tegese</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Kategori</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Indonesia</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Status</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Dihapus</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Aksi</th>
                      </>
                    ) : (
                      <>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">ID</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Kategori</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Tingkat</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Prompt</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Jawaban Bener</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Aktif</th>
                        <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Aksi</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {listData.map((row) => {
                    if (resource === "kawruh") {
                      const k = row as KawruhItem;
                      return (
                        <tr key={k.id} className="border-b border-cream-100 dark:border-sogan-800 hover:bg-cream-50 dark:hover:bg-sogan-800/50">
                          <td className="py-2 font-mono text-ink-600 dark:text-cream-400">{k.id}</td>
                          <td className="py-2 font-medium text-sogan-900 dark:text-cream-100">{k.ngoko}</td>
                          <td className="py-2 text-ink-700 dark:text-cream-300">{k.krama_lugu || "-"}</td>
                          <td className="py-2 text-ink-700 dark:text-cream-300">{k.krama_inggil || "-"}</td>
                          <td className="py-2 text-ink-700 dark:text-cream-300">{k.bahasa_indonesia}</td>
                          <td className="py-2 text-ink-600 dark:text-cream-400">{k.kelas_kata || "-"}</td>
                          <td className="py-2">{getStatusBadge(k.status)}</td>
                          <td className="py-2 text-ink-600 dark:text-cream-400">
                            {k.deleted_at ? (
                              <span className="text-merah-600 dark:text-red-400">Ya ({formatDate(k.deleted_at)})</span>
                            ) : (
                              <span className="text-abu-500">-</span>
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              {k.deleted_at ? (
                                <button
                                  onClick={() => handleRestore(k.id)}
                                  disabled={loading}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-godong-600 hover:bg-godong-700`}
                                >
                                  Pulihkan
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(k.id, k.ngoko)}
                                  disabled={loading}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-merah-600 hover:bg-merah-700`}
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    } else if (resource === "paribasan") {
                      const p = row as ParibasanItem;
                      return (
                        <tr key={p.id} className="border-b border-cream-100 dark:border-sogan-800 hover:bg-cream-50 dark:hover:bg-sogan-800/50">
                          <td className="py-2 font-mono text-ink-600 dark:text-cream-400">{p.id}</td>
                          <td className="py-2 max-w-xs truncate font-medium text-sogan-900 dark:text-cream-100" title={p.teks}>{p.teks}</td>
                          <td className="py-2 max-w-xs truncate text-ink-700 dark:text-cream-300" title={p.tegese}>{p.tegese}</td>
                          <td className="py-2">{getStatusBadge(p.kategori)}</td>
                          <td className="py-2 text-ink-700 dark:text-cream-300">{p.padanan_indonesia || "-"}</td>
                          <td className="py-2">{getStatusBadge(p.status)}</td>
                          <td className="py-2 text-ink-600 dark:text-cream-400">
                            {p.deleted_at ? (
                              <span className="text-merah-600 dark:text-red-400">Ya ({formatDate(p.deleted_at)})</span>
                            ) : (
                              <span className="text-abu-500">-</span>
                            )}
                          </td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              {p.deleted_at ? (
                                <button
                                  onClick={() => handleRestore(p.id)}
                                  disabled={loading}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-godong-600 hover:bg-godong-700`}
                                >
                                  Pulihkan
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(p.id, p.teks)}
                                  disabled={loading}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-merah-600 hover:bg-merah-700`}
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    } else {
                      const q = row as QuizQuestion;
                      return (
                        <tr key={q.id} className="border-b border-cream-100 dark:border-sogan-800 hover:bg-cream-50 dark:hover:bg-sogan-800/50">
                          <td className="py-2 font-mono text-ink-600 dark:text-cream-400">{q.id}</td>
                          <td className="py-2">{getCategoryLabel(q.category)}</td>
                          <td className="py-2">{getDifficultyLabel(q.difficulty)}</td>
                          <td className="py-2 max-w-xs truncate" title={q.prompt}>{q.prompt}</td>
                          <td className="py-2 font-mono text-godong-600 dark:text-green-400">{q.correct_answer}</td>
                          <td className="py-2">{getStatusBadge(String(q.is_active))}</td>
                          <td className="py-2">
                            <div className="flex gap-1">
                              {!q.is_active ? (
                                <button
                                  onClick={() => handleRestore(q.id)}
                                  disabled={loading}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-godong-600 hover:bg-godong-700`}
                                >
                                  Aktifkan
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleDelete(q.id, q.prompt.slice(0, 30) + "...")}
                                  disabled={loading}
                                  className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-merah-600 hover:bg-merah-700`}
                                >
                                  Nonaktifkan
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  })}
                  {listData.length === 0 && (
                    <tr>
                      <td colSpan={resource === "quiz" ? 7 : 9} className="py-8 text-center text-abu-500">
                        {listLoading ? "Memuat..." : "Tidak ada data"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {listTotal > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-600 dark:text-cream-400">
                  Menampilkan {(listPage - 1) * listLimit + 1} - {Math.min(listPage * listLimit, listTotal)} dari {listTotal}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setListPage((p) => Math.max(1, p - 1))}
                    disabled={listPage === 1 || listLoading}
                    className={buttonCls}
                  >
                    Sebelumnya
                  </button>
                  <button
                    onClick={() => setListPage((p) => p + 1)}
                    disabled={!listHasNext || listLoading}
                    className={buttonCls}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={submit} className={cardCls + " grid gap-4"}>
            {/* Form CRUD manual */}
            <div className="grid gap-3 sm:grid-cols-3">
              <label className={labelCls}>Resource<select value={resource} onChange={(e) => selectResource(e.target.value as Resource)} className={inputCls}><option value="kawruh">Kawruh</option><option value="paribasan">Paribasan</option><option value="quiz">Soal Kuis</option></select></label>
              <label className={labelCls}>Operasi<select value={action} onChange={(e) => setAction(e.target.value as Action)} className={inputCls}><option value="create">Create</option><option value="update">Update</option><option value="delete">Delete</option><option value="import">Bulk import</option><option value="export">Export JSON</option></select></label>
              <label className={labelCls}>ID {action !== "update" && action !== "delete" ? "(tidak dipakai)" : ""}<input value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={action !== "update" && action !== "delete"} className={inputCls} inputMode="numeric" /></label>
            </div>
            {action !== "delete" && action !== "export" && <label className={labelCls}>Payload JSON {action === "import" ? "(objek tunggal utawa array)" : ""}<textarea value={json} onChange={(e) => setJson(e.target.value)} rows={12} className={`${inputCls} font-mono text-xs`} /></label>}
            <button type="submit" disabled={loading || apiKey === ""} className={`${buttonCls} w-fit`}>{loading ? "Ngolah…" : "Jalankan"}</button>
          </form>
        )}
      </div>

      {error !== "" && <p className={errorCls}>{error}</p>}
      {result !== "" && <pre className={`${cardCls} overflow-auto text-xs`}>{result}</pre>}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`${cardCls} w-full max-w-md`}>
            <h3 className="text-lg font-semibold text-sogan-900 dark:text-cream-50">Konfirmasi Hapus</h3>
            <p className="mt-2 text-sm text-ink-700 dark:text-cream-300">
              Yakin ingin menghapus <strong>{resource === "kawruh" ? "Kawruh" : resource === "paribasan" ? "Paribasan" : "Soal Kuis"}</strong>: <span className="font-mono">{deleteConfirm.title}</span>?
            </p>
            <p className="mt-2 text-xs text-abu-600 dark:text-abu-400">
              Ini adalah <strong>soft delete</strong> — data dipindahkan ke sampah dan bisa dipulihkan nanti.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                disabled={loading}
                className={`${buttonCls} bg-abu-200 text-abu-800 hover:bg-abu-300 dark:bg-sogan-700 dark:text-cream-300`}
              >
                Batal
              </button>
              <button
                onClick={confirmDelete}
                disabled={loading}
                className={`${buttonCls} bg-merah-600 hover:bg-merah-700`}
              >
                {loading ? "Menghapus…" : "Ya, Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
