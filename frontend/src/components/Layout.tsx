import { useState, useCallback } from "react";
import { NavLink, Outlet, Link, useNavigation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import usePullToRefresh from "../hooks/usePullToRefresh";
import Seo from "./Seo";
import InstallPrompt from "./InstallPrompt";

/** Kunci localStorage untuk menyimpan status sidebar yang dicollapse. */
const SIDEBAR_KEY = "boso-jawa-sidebar-collapsed";

/** Path ikon 24x24 (stroke) untuk tiap menu, dipakai saat sidebar dicollapse. */
const ICONS: Record<string, string> = {
  beranda: "M3 10.5 12 3l9 7.5M5.5 9.75V19a1.5 1.5 0 0 0 1.5 1.5H10v-5h4v5h3a1.5 1.5 0 0 0 1.5-1.5V9.75",
  kawruh: "M4 5.5A2.5 2.5 0 0 1 6.5 3H19v14H6.5A2.5 2.5 0 0 0 4 19.5zm0 14A2.5 2.5 0 0 1 6.5 17H19v4H6.5A2.5 2.5 0 0 1 4 19.5z",
  paribasan: "M6.5 7.5h11M6.5 12h11M6.5 16.5h7",
  macapat: "M9 17V6l9-2v11M9 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm9-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  aksara: "M4 8.5V6h16v2.5M12 6v12M8.5 18h7",
  angka: "M9 8 7 16M15 8l-2 8M4.5 12h15",
  ai: "M11 3.5l1.5 3.6 3.6 1.5-3.6 1.5L11 13.7 9.5 10.1 5.9 8.6l3.6-1.5zM17.5 14l.9 2 2 .9-2 .9-.9 2-.9-2-2-.9 2-.9z",
  sinau: "M12 4 2.5 9 12 14l9.5-5L12 4zM6 11v4.5c0 1.7 2.7 3 6 3s6-1.3 6-3V11",
  akun: "M12 12a3.75 3.75 0 1 0 0-7.5 3.75 3.75 0 0 0 0 7.5zM4.75 20a7.25 7.25 0 0 1 14.5 0",
  riwayat: "M12 7.5V12l3 1.8M20.5 12a8.5 8.5 0 1 1-2.6-6.1M3 4.5V10h5.5",
  tentang: "M12 11.5v5M12 7.8h.01M20.5 12a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0z",
  privasi: "M12 3.2 19 6v5.6c0 4.2-2.9 8-7 9.2-4.1-1.2-7-5-7-9.2V6z",
  cookies: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM9 9.5h.01M14.5 8h.01M8 14.5h.01M14 14.5h.01M11.5 12h.01",
  faq: "M4 5.5h16v11H9l-5 4zM9.5 10a2.5 2.5 0 1 1 4 2c-.8.6-1.5 1-1.5 2M12 16.8h.01",
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-5 w-5 shrink-0"}
      aria-hidden="true"
    >
      <path d={ICONS[name] ?? ICONS.beranda} />
    </svg>
  );
}

const NAV_GROUPS: { label: string; items: { to: string; label: string; icon: string; end?: boolean }[] }[] = [
  {
    label: "Basa",
    items: [
      { to: "/", label: "Beranda", icon: "beranda", end: true },
      { to: "/kawruh", label: "Kawruh", icon: "kawruh" },
      { to: "/paribasan", label: "Paribasan", icon: "paribasan" },
      { to: "/macapat", label: "Macapat", icon: "macapat" },
    ],
  },
  {
    label: "Alat",
    items: [
      { to: "/aksara", label: "Aksara", icon: "aksara" },
      { to: "/angka", label: "Angka", icon: "angka" },
      { to: "/ai", label: "Tanya AI", icon: "ai" },
      { to: "/sinau", label: "Sinau", icon: "sinau" },
    ],
  },
  {
    label: "Akun",
    items: [
      { to: "/account", label: "Akun", icon: "akun" },
      { to: "/history", label: "Riwayat", icon: "riwayat" },
    ],
  },
];

const MISC_ITEMS = [
  { to: "/about", label: "Tentang", icon: "tentang" },
  { to: "/privacy", label: "Privasi", icon: "privasi" },
  { to: "/cookies", label: "Cookies", icon: "cookies" },
  { to: "/faq", label: "FAQ", icon: "faq" },
];

function navClass(isActive: boolean, collapsed: boolean) {
  const shape = collapsed
    ? "flex items-center justify-center rounded-xl px-0 py-1.5"
    : "flex items-center gap-3 rounded-xl px-3 py-1";
  return isActive
    ? `${shape} bg-sogan-800 text-sm font-semibold text-cream-50 dark:bg-prada-500 dark:text-sogan-950`
    : `${shape} text-sm font-medium text-sogan-800 hover:bg-cream-100 dark:text-cream-200 dark:hover:bg-sogan-800`;
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
    <Link to="/" className={`flex items-center ${compact ? "justify-center" : "gap-3"}`}>
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

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "1",
  );
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      localStorage.setItem(SIDEBAR_KEY, prev ? "0" : "1");
      return !prev;
    });
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const { pullDistance, refreshing } = usePullToRefresh(handleRefresh);

  return (
    <div className="flex h-full bg-cream-50 text-ink-900 dark:bg-sogan-950 dark:text-cream-100">
      <Seo />

      {/* Sidebar statis (desktop) */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col overflow-y-auto border-r border-prada-500/20 bg-cream-50/95 px-4 py-4 transition-[width] duration-200 dark:border-prada-500/10 dark:bg-sogan-950/95 md:flex ${
          collapsed ? "w-[68px] px-2" : "w-64"
        }`}
      >
        <div className={collapsed ? "flex flex-col items-center gap-2" : "flex items-center gap-3"}>
          <Logo compact={collapsed} />
          {!collapsed && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="ml-auto flex h-7 w-7 items-center justify-center rounded-full text-sogan-700 transition hover:bg-cream-200 dark:text-cream-200/70 dark:hover:bg-sogan-800"
              aria-label="Ciutkan sidebar"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="mt-2 flex h-8 w-8 items-center justify-center rounded-full text-sogan-700 transition hover:bg-cream-200 dark:text-cream-200/70 dark:hover:bg-sogan-800"
            aria-label="Lebarkan sidebar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        )}

        <nav className="mt-4 flex-1 space-y-3">
          {NAV_GROUPS.map((group, gi) => (
            <div key={group.label}>
              {collapsed ? (
                gi > 0 && (
                  <div className="mx-auto mb-2 h-px w-6 bg-cream-200 dark:bg-sogan-700" />
                )
              ) : (
                <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-sogan-700/60 dark:text-cream-200/40">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {group.items.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    title={collapsed ? l.label : undefined}
                    className={({ isActive }) => navClass(isActive, collapsed)}
                  >
                    <NavIcon name={l.icon} />
                    {!collapsed && <span>{l.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div>
            {collapsed ? (
              <div className="mx-auto mb-2 h-px w-6 bg-cream-200 dark:bg-sogan-700" />
            ) : (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-widest text-sogan-700/60 dark:text-cream-200/40">
                Lainnya
              </p>
            )}
            <div className="space-y-0.5">
              {MISC_ITEMS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  title={collapsed ? l.label : undefined}
                  className={({ isActive }) => navClass(isActive, collapsed)}
                >
                  <NavIcon name={l.icon} />
                  {!collapsed && <span>{l.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        <div
          className={`mt-4 flex items-center border-t border-cream-200/60 pt-3 dark:border-sogan-700/60 ${
            collapsed ? "justify-center" : "justify-between"
          }`}
        >
          {!collapsed && (
            <span className="text-xs text-sogan-700 dark:text-cream-200/60">Tema</span>
          )}
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
                        className={({ isActive }) => navClass(isActive, false)}
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