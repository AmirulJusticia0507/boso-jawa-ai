import { NavLink, Outlet, Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const LINKS = [
  { to: "/", label: "Beranda", end: true },
  { to: "/aksara", label: "Aksara", end: false },
  { to: "/angka", label: "Angka", end: false },
  { to: "/kawruh", label: "Kawruh", end: false },
  { to: "/macapat", label: "Macapat", end: false },
  { to: "/ai", label: "AI", end: false },
  { to: "/history", label: "Riwayat", end: false },
];

function navClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-sogan-800 px-4 py-1.5 text-sm font-semibold text-cream-50 dark:bg-prada-500 dark:text-sogan-950"
    : "rounded-full px-4 py-1.5 text-sm font-medium text-sogan-800 hover:bg-cream-100 dark:text-cream-200 dark:hover:bg-sogan-800";
}

export default function Layout() {
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-full flex-col bg-cream-50 text-ink-900 dark:bg-sogan-950 dark:text-cream-100">
      <header className="shrink-0 border-b border-prada-500/40 bg-cream-50/90 backdrop-blur dark:border-prada-500/20 dark:bg-sogan-950/90">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="batik-kawung flex h-11 w-11 items-center justify-center rounded-xl font-jawa text-lg whitespace-nowrap text-prada-300 shadow">
              ꦧꦱ
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-sogan-900 dark:text-cream-50">
                Boso Jawa AI
              </p>
              <p className="text-xs tracking-wide text-sogan-700 dark:text-cream-200/70">
                Nguri-uri basa lan sastra Jawa
              </p>
            </div>
          </div>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) => navClass(isActive)}
              >
                {l.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={toggle}
              className="ml-2 flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-white text-sogan-800 transition hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-prada-300 dark:hover:bg-sogan-700"
              aria-label="Ganti tema"
            >
              {theme === "light" ? "☽" : "☀"}
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="shrink-0 bg-sogan-900 text-cream-100">
        <div className="batik-parang h-2 opacity-70" />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-jawa text-prada-300">ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀</span>
            <span>
              Boso Jawa AI — pelestarian basa lan sastra Jawa secara digital.
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs text-cream-200/60">
            <Link to="/about" className="hover:text-prada-300 transition">Tentang</Link>
            <Link to="/privacy" className="hover:text-prada-300 transition">Privasi</Link>
            <Link to="/cookies" className="hover:text-prada-300 transition">Cookies</Link>
            <Link to="/faq" className="hover:text-prada-300 transition">FAQ</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
