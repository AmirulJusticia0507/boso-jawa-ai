import { NavLink, Outlet } from "react-router-dom";

const LINKS = [
  { to: "/", label: "Beranda", end: true },
  { to: "/aksara", label: "Aksara", end: false },
  { to: "/kawruh", label: "Kawruh", end: false },
  { to: "/macapat", label: "Macapat", end: false },
  { to: "/ai", label: "AI", end: false },
];

function navClass(isActive: boolean) {
  return isActive
    ? "rounded-full bg-sogan-800 px-4 py-1.5 text-sm font-semibold text-cream-50"
    : "rounded-full px-4 py-1.5 text-sm font-medium text-sogan-800 hover:bg-cream-100";
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-cream-50 text-ink-900">
      <header className="sticky top-0 z-50 border-b border-prada-500/40 bg-cream-50/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="batik-kawung flex h-11 w-11 items-center justify-center rounded-xl font-jawa text-lg whitespace-nowrap text-prada-300 shadow">
              ꦧꦱ
            </span>
            <div>
              <p className="font-display text-lg font-bold leading-tight text-sogan-900">
                Boso Jawa AI
              </p>
              <p className="text-xs tracking-wide text-sogan-700">
                Nguri-uri basa lan sastra Jawa
              </p>
            </div>
          </div>
          <nav className="ml-auto flex flex-wrap gap-1">
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
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>

      <footer className="bg-sogan-900 text-cream-100">
        <div className="batik-parang h-2 opacity-70" />
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-6 text-sm">
          <span className="font-jawa text-prada-300">ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀</span>
          <span>
            Boso Jawa AI — pelestarian basa lan sastra Jawa secara digital.
          </span>
        </div>
      </footer>
    </div>
  );
}
