import { useState, useEffect } from "react";
import { PageHeader, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import {
  adminRequest,
  importAdminDataset,
  listAdminQuizQuestions,
  ApiError,
  QuizQuestion,
  QuestionCategory,
  QuestionDifficulty,
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  UserItem,
} from "../services/api";

/** Jumlah baris per halaman pada daftar admin. */
const LIST_PAGE_SIZE = 20;

type Resource = "kawruh" | "paribasan" | "quiz";
type Action = "create" | "update" | "delete" | "import" | "export";
type Tab = "content" | "users" | "audit";

interface AuditItem {
  id: number;
  admin_key_fingerprint: string;
  action: string;
  target_table: string;
  target_id: number | null;
  changes: string | null;
  ip_address: string | null;
  request_id: string | null;
  created_at: string;
}

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
  const { isAuthenticated, user: currentUser, login: authLogin, logout: authLogout } = useAuth();
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("content");
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

  // User management state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "editor" | "reviewer">("editor");
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editRole, setEditRole] = useState<"admin" | "editor" | "reviewer">("editor");
  const [editIsActive, setEditIsActive] = useState(true);

  // Audit trail state
  const [auditItems, setAuditItems] = useState<AuditItem[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditOffset, setAuditOffset] = useState(0);
  const [auditAction, setAuditAction] = useState("");
  const [auditTable, setAuditTable] = useState("");
  const [auditLoading, setAuditLoading] = useState(false);

  // Load session info when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setRole(currentUser.role);
      setPermissions(getPermissionsForRole(currentUser.role));
      setError("");
    }
  }, [isAuthenticated, currentUser]);

  function getPermissionsForRole(role: string): string[] {
    const perms: Record<string, string[]> = {
      admin: ["content.read", "content.write", "content.review", "content.delete", "dataset.read", "dataset.write", "dataset.verify", "audit.read"],
      editor: ["content.read", "content.write", "dataset.read", "dataset.write"],
      reviewer: ["content.read", "content.review", "dataset.read", "dataset.verify"],
    };
    return perms[role] || [];
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authLogin(loginUsername, loginPassword);
      setLoginUsername("");
      setLoginPassword("");
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await authLogout();
    } catch {
      // ignore logout errors
    }
    setRole("");
    setPermissions([]);
    setResult("");
    setError("");
  }

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
      const needsId = action === "update" || action === "delete";
      if (needsId && !/^\d+$/.test(itemId)) throw new Error("ID wajib berupa angka.");

      let path = "";
      let method = "";
      let payload: unknown = undefined;

      if (resource === "quiz") {
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
        path = `/${resource}${needsId ? `/${itemId}` : action === "import" || action === "export" ? `/${action}` : ""}`;
        const rawPayload = action === "delete" || action === "export" ? undefined : JSON.parse(json);
        payload = action === "import" ? { items: Array.isArray(rawPayload) ? rawPayload : [rawPayload] } : rawPayload;
        method = action === "export" ? "GET" : action === "update" ? "PUT" : action === "delete" ? "DELETE" : "POST";
      }

      const response = await adminRequest(path, method, payload);
      setResult(JSON.stringify(response, null, 2));
      if (showList) fetchList();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Operasi gagal.");
    } finally {
      setLoading(false);
    }
  }

  async function uploadDataset(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const extension = uploadFile.name.toLowerCase().split(".").pop();
      if (extension !== "json" && extension !== "csv") throw new Error("File harus berformat JSON atau CSV.");
      const response = await importAdminDataset(
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
    if (!isAuthenticated) return;
    setListLoading(true);
    setError("");
    try {
      let response: AdminListResponse<AdminRow>;

      if (resource === "quiz") {
        response = await listAdminQuizQuestions({ page: listPage, limit: listLimit, status: listStatus, q: listSearch, include_deleted: listIncludeDeleted }) as AdminListResponse<AdminRow>;
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
        response = await adminRequest(path, "GET") as AdminListResponse<AdminRow>;
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
    if (!deleteConfirm) return;
    setLoading(true);
    setError("");
    try {
      let path = "";
      if (resource === "quiz") {
        path = `/learning/questions/${deleteConfirm.id}`;
      } else {
        path = `/${resource}/${deleteConfirm.id}`;
      }
      await adminRequest(path, "DELETE");
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
    setLoading(true);
    setError("");
    try {
      if (resource === "quiz") {
        const path = `/learning/questions/${id}`;
        await adminRequest(path, "PUT", { is_active: true });
        setResult(`Berhasil mengaktifkan Quiz ID ${id}`);
      } else {
        const path = `/${resource}/${id}/restore`;
        await adminRequest(path, "POST");
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
    if (showList && isAuthenticated) {
      fetchList();
    }
  }, [showList, listPage, listStatus, listSearch, listIncludeDeleted, listKategori, isAuthenticated, resource]);

  // User management functions
  async function fetchUsers() {
    setUsersLoading(true);
    setError("");
    try {
      const response = await listAdminUsers();
      setUsers(response.data);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal memuat daftar user.");
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "users" && isAuthenticated) {
      fetchUsers();
    }
  }, [activeTab, isAuthenticated]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await createAdminUser({ username: newUsername, password: newPassword, role: newRole });
      setResult(`Berhasil membuat user: ${newUsername}`);
      setNewUsername("");
      setNewPassword("");
      setNewRole("editor");
      setShowCreateUser(false);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal membuat user.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    setError("");
    try {
      await updateAdminUser(editingUser.id, { role: editRole, is_active: editIsActive });
      setResult(`Berhasil update user: ${editingUser.username}`);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal update user.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: number, username: string) {
    if (!confirm(`Yakin ingin menghapus user "${username}"?`)) return;
    setLoading(true);
    setError("");
    try {
      await deleteAdminUser(userId);
      setResult(`Berhasil menghapus user: ${username}`);
      fetchUsers();
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Gagal menghapus user.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuditLogs(offset = auditOffset) {
    setAuditLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ limit: "25", offset: String(offset) });
      if (auditAction.trim()) params.set("action", auditAction.trim());
      if (auditTable.trim()) params.set("target_table", auditTable.trim());
      const response = await adminRequest(`/audit-logs?${params}`, "GET") as { data: { total: number; items: AuditItem[] } };
      setAuditItems(response.data.items);
      setAuditTotal(response.data.total);
      setAuditOffset(offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat audit trail.");
    } finally {
      setAuditLoading(false);
    }
  }

  useEffect(() => {
    if (activeTab === "audit" && permissions.includes("audit.read")) void fetchAuditLogs(0);
  }, [activeTab, permissions]);

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

  // Login screen
  if (!isAuthenticated) {
    return (
      <section className="space-y-5">
        <PageHeader aksara="ꦥꦔꦼꦭꦺꦴꦭ" title="Admin Login" desc="Masuk dengan akun admin untuk mengelola konten." />
        <div className={`${cardCls} max-w-md mx-auto`}>
          <form onSubmit={handleLogin} className="grid gap-4">
            <label className={labelCls}>
              Username
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={inputCls}
                required
                minLength={3}
              />
            </label>
            <label className={labelCls}>
              Password
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className={inputCls}
                required
                minLength={8}
              />
            </label>
            <button type="submit" disabled={loading} className={buttonCls}>
              {loading ? "Masuk…" : "Masuk"}
            </button>
          </form>
          {error !== "" && <p className={errorCls}>{error}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader aksara="ꦥꦔꦼꦭꦺꦴꦭ" title="Admin Konten" desc={`Masuk sebagai ${currentUser?.username ?? "…"} (role: ${role})`} />
        <button type="button" onClick={handleLogout} className={`${buttonCls} bg-merah-600 hover:bg-merah-700`}>
          Keluar
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("content")}
          className={`${buttonCls} ${activeTab === "content" ? "bg-sogan-800 text-cream-50" : "bg-cream-200 text-sogan-800 hover:bg-cream-300 dark:bg-sogan-700 dark:text-cream-300"}`}
        >
          Konten
        </button>
        {role === "admin" && (
          <button
            type="button"
            onClick={() => setActiveTab("users")}
            className={`${buttonCls} ${activeTab === "users" ? "bg-sogan-800 text-cream-50" : "bg-cream-200 text-sogan-800 hover:bg-cream-300 dark:bg-sogan-700 dark:text-cream-300"}`}
          >
            User Admin
          </button>
        )}
        {permissions.includes("audit.read") && (
          <button type="button" onClick={() => setActiveTab("audit")} className={`${buttonCls} ${activeTab === "audit" ? "bg-sogan-800 text-cream-50" : "bg-cream-200 text-sogan-800 hover:bg-cream-300 dark:bg-sogan-700 dark:text-cream-300"}`}>
            Audit Trail
          </button>
        )}
      </div>

      {activeTab === "users" && role === "admin" ? (
        <>
          {/* User Management */}
          <div className={cardCls}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sogan-800 dark:text-cream-200">Daftar User Admin</h3>
              <button
                type="button"
                onClick={() => setShowCreateUser(true)}
                className={buttonCls}
              >
                + Tambah User
              </button>
            </div>

            {showCreateUser && (
              <form onSubmit={handleCreateUser} className="mt-4 grid gap-3 sm:grid-cols-3 p-4 bg-cream-50 dark:bg-sogan-800 rounded-xl">
                <label className={labelCls}>
                  Username
                  <input type="text" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className={inputCls} required minLength={3} />
                </label>
                <label className={labelCls}>
                  Password
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} required minLength={8} />
                </label>
                <label className={labelCls}>
                  Role
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "editor" | "reviewer")} className={inputCls}>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="reviewer">Reviewer</option>
                  </select>
                </label>
                <div className="sm:col-span-3 flex gap-2">
                  <button type="submit" disabled={loading} className={buttonCls}>{loading ? "Menyimpan…" : "Simpan"}</button>
                  <button type="button" onClick={() => setShowCreateUser(false)} className={`${buttonCls} bg-abu-200 text-abu-800 hover:bg-abu-300 dark:bg-sogan-700 dark:text-cream-300`}>Batal</button>
                </div>
              </form>
            )}

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-cream-200 dark:border-sogan-700">
                    <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">ID</th>
                    <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Username</th>
                    <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Role</th>
                    <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Status</th>
                    <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Login Terakhir</th>
                    <th className="pb-2 font-semibold text-sogan-700 dark:text-cream-300">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-cream-100 dark:border-sogan-800 hover:bg-cream-50 dark:hover:bg-sogan-800/50">
                      <td className="py-2 font-mono text-ink-600 dark:text-cream-400">{user.id}</td>
                      <td className="py-2 font-medium text-sogan-900 dark:text-cream-100">{user.username}</td>
                      <td className="py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === "admin" ? "bg-prada-100 text-prada-800 dark:bg-prada-900 dark:text-prada-200" :
                          user.role === "editor" ? "bg-biru-100 text-biru-800 dark:bg-biru-900 dark:text-biru-200" :
                          "bg-kuning-100 text-kuning-800 dark:bg-kuning-900 dark:text-kuning-200"
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2">{getStatusBadge(String(user.is_active))}</td>
                      <td className="py-2 text-ink-600 dark:text-cream-400">{formatDate(user.last_login_at)}</td>
                      <td className="py-2">
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setEditRole(user.role);
                              setEditIsActive(user.is_active);
                            }}
                            className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-biru-600 hover:bg-biru-700`}
                          >
                            Edit
                          </button>
                          {user.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className={`px-2 py-1 rounded text-xs font-medium transition ${buttonCls} bg-merah-600 hover:bg-merah-700`}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && !usersLoading && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-abu-500">Tidak ada user</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {usersLoading && <p className="mt-2 text-sm text-abu-500">Memuat…</p>}
          </div>

          {/* Edit User Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className={`${cardCls} w-full max-w-md`}>
                <h3 className="text-lg font-semibold text-sogan-900 dark:text-cream-50">Edit User: {editingUser.username}</h3>
                <form onSubmit={handleUpdateUser} className="mt-4 grid gap-4">
                  <label className={labelCls}>
                    Role
                    <select value={editRole} onChange={(e) => setEditRole(e.target.value as "admin" | "editor" | "reviewer")} className={inputCls}>
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="reviewer">Reviewer</option>
                    </select>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-cream-300 text-prada-600 focus:ring-prada-500"
                    />
                    <span className="font-medium text-sogan-800 dark:text-cream-200">Aktif</span>
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className={`${buttonCls} bg-abu-200 text-abu-800 hover:bg-abu-300 dark:bg-sogan-700 dark:text-cream-300`}
                    >
                      Batal
                    </button>
                    <button type="submit" disabled={loading} className={buttonCls}>
                      {loading ? "Menyimpan…" : "Simpan"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : activeTab === "audit" && permissions.includes("audit.read") ? (
        <div className={cardCls}>
          <div className="flex flex-wrap items-end gap-3">
            <label className={labelCls}>Aksi<input className={inputCls} value={auditAction} onChange={(e) => setAuditAction(e.target.value)} placeholder="contoh: kawruh.update" /></label>
            <label className={labelCls}>Tabel target<input className={inputCls} value={auditTable} onChange={(e) => setAuditTable(e.target.value)} placeholder="contoh: kawruh_basa" /></label>
            <button type="button" className={buttonCls} disabled={auditLoading} onClick={() => void fetchAuditLogs(0)}>Filter</button>
          </div>
          <p className="mt-3 text-sm text-ink-900/60 dark:text-cream-200/60">Total {auditTotal} aktivitas</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead><tr className="border-b border-cream-200 dark:border-sogan-700"><th className="p-2">Waktu</th><th className="p-2">Admin</th><th className="p-2">Aksi</th><th className="p-2">Target</th><th className="p-2">Perubahan</th><th className="p-2">Request ID</th></tr></thead>
              <tbody>{auditItems.map((item) => <tr key={item.id} className="border-b border-cream-100 align-top dark:border-sogan-800"><td className="p-2 whitespace-nowrap">{formatDate(item.created_at)}</td><td className="p-2 font-mono text-xs">{item.admin_key_fingerprint}</td><td className="p-2 font-semibold">{item.action}</td><td className="p-2">{item.target_table}{item.target_id != null ? ` #${item.target_id}` : ""}</td><td className="max-w-sm p-2"><pre className="whitespace-pre-wrap break-words text-xs">{item.changes ?? "-"}</pre></td><td className="p-2 font-mono text-xs">{item.request_id ?? "-"}</td></tr>)}</tbody>
            </table>
          </div>
          {auditItems.length === 0 && !auditLoading && <p className="py-8 text-center text-sm">Belum ada audit log.</p>}
          <div className="mt-4 flex items-center gap-3"><button type="button" className={buttonCls} disabled={auditLoading || auditOffset === 0} onClick={() => void fetchAuditLogs(Math.max(0, auditOffset - 25))}>Sebelumnya</button><span className="text-sm">{auditOffset + 1}–{Math.min(auditOffset + auditItems.length, auditTotal)}</span><button type="button" className={buttonCls} disabled={auditLoading || auditOffset + 25 >= auditTotal} onClick={() => void fetchAuditLogs(auditOffset + 25)}>Berikutnya</button></div>
        </div>
      ) : (
        <>
          {/* Content Management */}
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
                <button type="submit" disabled={loading} className={`${buttonCls} w-fit`}>{loading ? "Ngolah…" : "Jalankan"}</button>
              </form>
            )}
          </div>

          {/* Dataset upload */}
          <div className={cardCls}>
            <h3 className="font-semibold text-sogan-800 dark:text-cream-200">Upload Dataset AI</h3>
            <form onSubmit={uploadDataset} className="mt-3 grid gap-3">
              <label className={labelCls}>
                File (JSON/CSV)
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                  className={inputCls}
                />
              </label>
              <button type="submit" disabled={!uploadFile || loading || (role !== "" && !permissions.includes("dataset.write"))} className={buttonCls}>
                {loading ? "Mengunggah…" : "Unggah"}
              </button>
            </form>
          </div>
        </>
      )}

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
