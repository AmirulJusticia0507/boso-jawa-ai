import { useEffect, useState } from "react";
import { ApiError, clearUserTokens, createUserBookmark, deleteUserBookmark, getUserCaptcha, getUserProfile, getUserToken, listUserBookmarks, sendUserFeedback, userAuth, type MathCaptcha, type UserBookmark } from "../services/api";
import { PageHeader, buttonCls, cardCls, inputCls, labelCls } from "../components/ui";

export default function Account() {
  const [profile, setProfile] = useState<{ id: number; username: string } | null>(null);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [bookmarks, setBookmarks] = useState<UserBookmark[]>([]);
  const [title, setTitle] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [collection, setCollection] = useState("Favorit");
  const [feedback, setFeedback] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(() => Boolean(getUserToken()));
  const [captcha, setCaptcha] = useState<MathCaptcha | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  function loadCaptcha() {
    setCaptchaAnswer("");
    getUserCaptcha().then(setCaptcha).catch(() => setMessage("CAPTCHA ora bisa dimuat."));
  }

  useEffect(() => {
    if (!getUserToken()) { loadCaptcha(); return; }
    Promise.all([getUserProfile(), listUserBookmarks()])
      .then(([user, saved]) => { setProfile(user.data); setBookmarks(saved); })
      .catch(() => { clearUserTokens(); loadCaptcha(); })
      .finally(() => setLoading(false));
  }, []);

  async function authenticate(e: React.FormEvent) {
    e.preventDefault();
    try {
      if (!captcha) return;
      await userAuth(mode, username, password, captcha.token, Number(captchaAnswer));
      window.location.reload();
    } catch (error) { setMessage(error instanceof ApiError ? error.message : "Autentikasi gagal."); loadCaptcha(); }
  }

  async function addBookmark(e: React.FormEvent) {
    e.preventDefault();
    try {
      const item = await createUserBookmark({ resource_type: "custom", resource_id: resourceId || crypto.randomUUID(), title, collection, note: null });
      setBookmarks((items) => [item, ...items]); setTitle(""); setResourceId("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Bookmark gagal."); }
  }

  async function submitFeedback(e: React.FormEvent) {
    e.preventDefault();
    try {
      await sendUserFeedback({ resource_type: "general", message: feedback, suggestion: suggestion || undefined });
      setFeedback(""); setSuggestion(""); setMessage("Feedback wis dikirim. Matur nuwun.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Feedback gagal dikirim.");
    }
  }

  if (loading) return <p className="py-12 text-center">Mriksa sesi akun...</p>;
  if (!profile) return <section className="space-y-5"><PageHeader aksara="ꦥꦔꦒꦺꦴ" title="Akun Pengguna" desc="Login kanggo nyelarasake progres lan data pribadi antar piranti." /><form onSubmit={authenticate} className={`${cardCls} mx-auto grid max-w-md gap-3`}><label className={labelCls}>Username<input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} /></label><label className={labelCls}>Password<input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></label><label className={labelCls}>Pira asile {captcha?.question ?? "..."}<input type="number" className={inputCls} value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} required min={0} max={100} /></label><button className={buttonCls} disabled={!captcha}>{mode === "login" ? "Login" : "Daftar"}</button><button type="button" className="text-sm text-prada-700 underline dark:text-prada-300" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); loadCaptcha(); }}>{mode === "login" ? "Durung duwe akun? Daftar" : "Wis duwe akun? Login"}</button>{message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}</form></section>;

  return <section className="space-y-5"><PageHeader aksara="ꦥꦔꦒꦺꦴ" title={`Sugeng rawuh, ${profile.username}`} desc="Riwayat lan progresmu diselarasake nalika login." /><button className={buttonCls} onClick={() => { clearUserTokens(); window.location.reload(); }}>Logout</button>
    <form onSubmit={addBookmark} className={`${cardCls} grid gap-3`}><h2 className="font-semibold">Bookmark lan koleksi pribadi</h2><div className="grid gap-3 sm:grid-cols-3"><input className={inputCls} placeholder="Judul" value={title} onChange={(e) => setTitle(e.target.value)} required /><input className={inputCls} placeholder="ID utawa URL" value={resourceId} onChange={(e) => setResourceId(e.target.value)} /><input className={inputCls} placeholder="Koleksi" value={collection} onChange={(e) => setCollection(e.target.value)} required /></div><button className={`${buttonCls} w-fit`}>Tambah bookmark</button><div className="grid gap-2 sm:grid-cols-2">{bookmarks.map((item) => <article key={item.id} className="rounded-xl bg-cream-50 p-3 dark:bg-sogan-800"><strong>{item.title}</strong><p className="text-xs">{item.collection}</p><button type="button" className="mt-2 text-xs text-red-600" onClick={async () => { await deleteUserBookmark(item.id); setBookmarks((all) => all.filter((x) => x.id !== item.id)); }}>Hapus</button></article>)}</div></form>
    <form onSubmit={submitFeedback} className={`${cardCls} grid gap-3`}><h2 className="font-semibold">Feedback utawa usulan koreksi</h2><textarea className={inputCls} placeholder="Jelasna masalah data" value={feedback} onChange={(e) => setFeedback(e.target.value)} required minLength={5} /><textarea className={inputCls} placeholder="Usulan koreksi (opsional)" value={suggestion} onChange={(e) => setSuggestion(e.target.value)} /><button className={`${buttonCls} w-fit`}>Kirim feedback</button>{message && <p className="text-sm text-godong-700 dark:text-green-400">{message}</p>}</form>
  </section>;
}
