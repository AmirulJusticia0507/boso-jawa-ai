import { useState, useCallback } from "react";
import { NavLink, Outlet, Link, useNavigation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import usePullToRefresh from "../hooks/usePullToRefresh";
import Seo from "./Seo";
import InstallPrompt from "./InstallPrompt";

const NAV_GROUPS: { label: string; items: { to: string; label: string; end?: boolean }[] }[] = [
  {
    label: "Basa",
    items: [
      { to: "/", label: "Beranda", end: true },
      { to: "/kawruh", label: "Kawruh" },
      { to: "/paribasan", label: "Paribasan" },
      { to: "/macapat", label: "Macapat" },
    ],
  },
  {
    label: "Alat",
    items: [
      { to: "/aksara", label: "Aksara" },
      { to: "/angka", label: "Angka" },
      { to: "/ai", label: "Tanya AI" },
      { to: "/sinau", label: "Sinau" },
    ],
  },
  {
    label: "Akun",
    items: [
      { to: "/account", label: "Akun" },
      { to: "/history", label: "Riwayat" },
    ],
  },
];

function navClass(isActive: boolean) {
  return isActive
    ? "flex items-center gap-3 rounded-xl bg-sogan-800 px-3 py-1 text-sm font-semibold text-cream-50 dark:bg-prada-500 dark:text-sogan-950"
    : "flex items-center gap-3 rounded-xl px-3 py-1 text-sm font-medium text-sogan-800 hover:bg-cream-100 dark:text-cream-200 dark:hover:bg-sogan-800";
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

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sogan-900 shadow-sm ring-1 ring-prada-500/40 dark:bg-sogan-800" aria-hidden="true">
        <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none">
          <circle cx="24" cy="24" r="19" stroke="#c9a227" strokeOpacity=".45" />
          <g stroke="#e7c873" strokeWidth="1.7">
            <ellipse cx="24" cy="16.5" rx="4.2" ry="6.1" />
            <ellipse cx="31.5" cy="24" rx="6.1" ry="4.2" />
            <ellipse cx="24" cy="31.5" rx="4.2" ry="6.1" />
            <ellipse cx="16.5" cy="24" rx="6.1" ry="4.2" />
          </g>
          <circle cx="24" cy="24" r="2.2" fill="#e7c873" />
          <circle cx="24" cy="16.5" r="1.15" fill="#c9a227" />
          <circle cx="31.5" cy="24" r="1.15" fill="#c9a227" />
          <circle cx="24" cy="31.5" r="1.15" fill="#c9a227" />
          <circle cx="16.5" cy="24" r="1.15" fill="#c9a227" />
        </svg>
      </span>
      {!compact && (
        <div>
          <p className="font-display text-lg font-bold leading-tight text-sogan-900 dark:text-cream-50">
            Boso Jawa AI
          </p>
          <p className="text-xs tracking-wide text-sogan-700 dark:text-cream-200/70">
            Nguri-uri basa lan sastra Jawa
          </p>
        </div>
      )}
    </Link>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-white text-sogan-800 transition hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-prada-300 dark:hover:bg-sogan-700"
      aria-label="Ganti tema"
    >
      {theme === "light" ? "☽" : "☀"}
    </button>
  );
}

const FOOTER_LINKS = [
  { to: "/about", label: "Tentang" },
  { to: "/privacy", label: "Privasi" },
  { to: "/cookies", label: "Cookies" },
  { to: "/faq", label: "FAQ" },
  { to: "/admin", label: "Admin" },
];

const MISC_LINKS = [
  { to: "/about", label: "Tentang" },
  { to: "/privacy", label: "Privasi" },
  { to: "/cookies", label: "Cookies" },
  { to: "/faq", label: "FAQ" },
];

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing } = usePullToRefresh(handleRefresh);

  return (
    <div className="flex h-full bg-cream-50 text-ink-900 dark:bg-sogan-950 dark:text-cream-100">
      <Seo />

      {/* Sidebar statis (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-prada-500/20 bg-cream-50/95 px-4 py-4 dark:border-prada-500/10 dark:bg-sogan-950/95 md:flex">
        <Logo />

        <nav className="mt-4 flex-1 space-y-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-sogan-700/60 dark:text-cream-200/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) => navClass(isActive)}
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-sogan-700/60 dark:text-cream-200/40">
              Lainnya
            </p>
            <div className="space-y-0.5">
              {MISC_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) => navClass(isActive)}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div className="mt-4 flex items-center justify-between border-t border-cream-200/60 pt-3 dark:border-sogan-700/60">
          <span className="text-xs text-sogan-700 dark:text-cream-200/60">Tema</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Kolom utama */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* Header mobile: logo + dropdown menu */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-prada-500/40 bg-cream-50/90 backdrop-blur dark:border-prada-500/20 dark:bg-sogan-950/90 md:hidden">
          <div className="flex items-center gap-3 px-4 py-3">
            <Logo compact />
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-cream-200 bg-white text-sogan-800 transition hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-prada-300 dark:hover:bg-sogan-700"
                aria-label="Menu"
                aria-expanded={menuOpen}
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

          {/* Dropdown menu dari kiri */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              menuOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <nav className="space-y-4 border-t border-cream-200/50 px-4 py-3 dark:border-sogan-700/50">
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-sogan-700/60 dark:text-cream-200/40">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.items.map((l) => (
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
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </header>

        <PullIndicator distance={pullDistance} refreshing={refreshing} />

        <main className="mx-auto w-full max-w-3xl min-h-0 flex-1 overflow-y-auto px-4 py-8">
          <InstallPrompt />
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
          <div className="mx-auto max-w-3xl px-4 py-6">
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
              {FOOTER_LINKS.map((l) => (
                <Link key={l.to} to={l.to} className="hover:text-prada-300 transition">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}