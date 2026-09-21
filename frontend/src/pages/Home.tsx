import { Link } from "react-router-dom";

const MODULES = [
  {
    to: "/aksara",
    aksara: "ꦲꦏ꧀ꦱꦫ",
    title: "Transliterasi Aksara",
    desc: "Latin ↔ Aksara: pasangan, taling-tarung, lan panyigeg otomatis.",
  },
  {
    to: "/angka",
    aksara: "ꦱꦃꦗꦮ",
    title: "Converter Angka",
    desc: "Konversi angka Latin (0-9) menyang aksara Jawa (꧐-꧙).",
  },
  {
    to: "/kawruh",
    aksara: "ꦏꦮꦿꦸꦃ",
    title: "Kawruh Undha-Usuk",
    desc: "Kamus Ngoko – Krama Lugu – Krama Inggil – Indonesia.",
  },
  {
    to: "/macapat",
    aksara: "ꦩꦕꦥꦠ꧀",
    title: "Checker Macapat",
    desc: "Validasi guru gatra, wilangan, lan lagu 11 tembang.",
  },
];

const STATS = [
  { n: "20", label: "Aksara carakan" },
  { n: "11", label: "Tembang macapat" },
  { n: "4", label: "Tingkat tutur" },
];

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="batik-kawung relative overflow-hidden rounded-3xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sogan-950/70 via-sogan-900/40 to-transparent" />
        <div className="relative px-6 py-12 md:px-14 md:py-16">
          <p className="font-jawa text-lg text-prada-300">
            ꦧꦱꦗꦮ • Boso Jawa AI
          </p>
          <h2 className="mt-2 max-w-xl font-display text-4xl font-bold leading-tight text-cream-50 md:text-5xl">
            Nguri-uri basa lan sastra Jawa ing jaman digital
          </h2>
          <p className="mt-4 max-w-xl text-cream-100/90">
            Engine transliterasi aksara, kamus undha-usuk, lan validator
            tembang macapat — dadi siji ing sak sistem.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/aksara"
              className="rounded-full bg-prada-500 px-6 py-2.5 font-semibold text-sogan-950 shadow transition hover:bg-prada-400"
            >
              Coba Transliterasi
            </Link>
            <Link
              to="/macapat"
              className="rounded-full border border-cream-100/50 px-6 py-2.5 font-semibold text-cream-50 transition hover:bg-cream-50/10"
            >
              Priksa Macapat
            </Link>
          </div>
          <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-prada-500/30 bg-sogan-950/50 px-4 py-3 text-center backdrop-blur-sm"
              >
                <p className="font-display text-3xl font-bold text-prada-300">
                  {s.n}
                </p>
                <p className="mt-1 text-xs text-cream-100/80">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {MODULES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className="group rounded-2xl border border-cream-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-sogan-700 dark:bg-sogan-900"
          >
            <div className="batik-parang h-1.5 w-16 rounded-full opacity-80" />
            <p className="mt-3 font-jawa text-2xl text-sogan-700 dark:text-prada-300">{m.aksara}</p>
            <h3 className="mt-1 font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
              {m.title}
            </h3>
            <p className="mt-1 text-sm text-ink-900/70 dark:text-cream-200/70">{m.desc}</p>
            <span className="mt-3 inline-block text-sm font-semibold text-prada-600 group-hover:underline dark:text-prada-400">
              Bukak →
            </span>
          </Link>
        ))}
      </section>
    </div>
  );
}
