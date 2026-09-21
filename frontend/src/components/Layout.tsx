import { useState, useCallback } from "react";
import { NavLink, Outlet, Link, useNavigation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import usePullToRefresh from "../hooks/usePullToRefresh";

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

function PullIndicator({ distance, refreshing }: { distance: number; refreshing: boolean }) {
  if (distance === 0 && !refreshing) return null;
  const rotation = (distance / 80) * 360;
  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all"
      style={{ height: refreshing ? 56 : distance }}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 100 100"
        className={refreshing ? "animate-spin" : ""}
        style={refreshing ? { animationDuration: "1s" } : { transform: `rotate(${rotation}deg)` }}
      >
        <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-cream-200 dark:text-sogan-700" strokeWidth="4" />
        <path
          d="M50 12 A38 38 0 0 1 88 50"
          fill="none"
          stroke="currentColor"
          className="text-prada-500"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="50" cy="50" r="5" fill="currentColor" className="text-prada-400" />
      </svg>
    </div>
  );
}

export default function Layout() {
  const { theme, toggle } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing } = usePullToRefresh(handleRefresh);

  return (
    <div className="flex h-full flex-col bg-cream-50 text-ink-900 dark:bg-sogan-950 dark:text-cream-100">
      <header className="shrink-0 border-b border-prada-500/40 bg-cream-50/90 backdrop-blur dark:border-prada-500/20 dark:bg-sogan-950/90">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
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
          </Link>

          {/* Desktop nav */}
          <nav className="ml-auto hidden items-center gap-1 md:flex">
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

          {/* Mobile: theme toggle + hamburger */}
          <div className="ml-auto flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggle}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-white text-sogan-800 transition hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-prada-300 dark:hover:bg-sogan-700"
              aria-label="Ganti tema"
            >
              {theme === "light" ? "☽" : "☀"}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-white text-sogan-800 transition hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-prada-300 dark:hover:bg-sogan-700"
              aria-label="Menu"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
            menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="flex flex-wrap gap-1 border-t border-cream-200/50 px-4 py-3 dark:border-sogan-700/50">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => navClass(isActive)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* Pull-to-refresh indicator */}
      <PullIndicator distance={pullDistance} refreshing={refreshing} />

      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-4 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <svg
              width="48"
              height="48"
              viewBox="0 0 100 100"
              xmlns="http://www.w3.org/2000/svg"
              className="animate-spin"
              style={{ animationDuration: "1.2s" }}
            >
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-cream-200 dark:text-sogan-700" strokeWidth="4" />
              <path d="M50 8 A42 42 0 0 1 92 50" fill="none" stroke="currentColor" className="text-prada-500" strokeWidth="5" strokeLinecap="round" />
              <circle cx="50" cy="50" r="6" fill="currentColor" className="text-prada-400" />
              <circle cx="50" cy="34" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
              <circle cx="66" cy="50" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
              <circle cx="50" cy="66" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
              <circle cx="34" cy="50" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
            </svg>
            <p className="font-jawa text-sm text-sogan-700 dark:text-cream-200/70">
              Nyedhiyakake...
            </p>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      <footer className="shrink-0 bg-sogan-900 text-cream-100">
        <div className="batik-parang h-2 opacity-70" />
        <div className="mx-auto max-w-5xl px-4 py-6">
          <p className="font-display text-center text-base font-bold italic text-prada-300">
            "Wong Jowo Ojo Ilang Jowo ne"
          </p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="font-jawa text-prada-300">ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀</span>
            <span>
              Boso Jawa AI — pelestarian basa lan sastra Jawa secara digital.
            </span>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-3 text-xs text-cream-200/60">
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
