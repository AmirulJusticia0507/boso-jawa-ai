import { PageHeader, cardCls } from "../components/ui";

const TIM = [
  {
    name: "Amirul Putra Justicia",
    role: "Pengembang Boso Jawa AI",
    desc: "Fullstack Engineer sing ngembangake Boso Jawa AI kanthi semangat pelestarian basa Jawa ing jaman digital.",
  },
];

const TEKNOLOGI = [
  { name: "React + TypeScript", desc: "Frontend modern, komponen reaktif" },
  { name: "Tailwind CSS v4", desc: "Styling cepat, dark mode bawaan" },
  { name: "FastAPI (Python)", desc: "Backend API cepat & ringan" },
  { name: "AI / LLM", desc: "Asisten AI kang ngerti basa Jawa" },
];

export default function About() {
  return (
    <section className="space-y-8">
      <PageHeader
        aksara="ꦧ꧀ꦭꦱ꧀ꦗꦤ꧀"
        title="Babagan Boso Jawa AI"
        desc="Kenali luwih jero babagan proyek iki, tujuan, lan teknologi sing digunakake."
      />

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Visi & Misi
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          <strong>Boso Jawa AI</strong> minangka proyek pelestarian basa Jawa
          ing jaman digital. Kami percaya basa Jawa tetap relevan lan bisa
          diakses dening kabeh wong, tanpa kudu nglalekake warisan budaya.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
          <li>
            <strong>Transliterasi</strong> — mbantu wong nulis lan maca aksara
            Jawa.
          </li>
          <li>
            <strong>Kamus Undha-Usuk</strong> — mbantu ngerti tingkatan basa
            (ngoko, krama, krama inggil).
          </li>
          <li>
            <strong>Validator Macapat</strong> — mbantu ngurutake tembang Jawa
            kanthi paugeran sing bener.
          </li>
          <li>
            <strong>Asisten AI</strong> — mbantu wong ngobrol nganggo basa
            Jawa.
          </li>
        </ul>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Teknologi
        </h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TEKNOLOGI.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-cream-200 bg-cream-50 p-3 dark:border-sogan-700 dark:bg-sogan-800"
            >
              <p className="text-sm font-semibold text-sogan-900 dark:text-cream-100">
                {t.name}
              </p>
              <p className="mt-0.5 text-xs text-ink-900/60 dark:text-cream-200/60">
                {t.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Kontributor
        </h3>
        <div className="mt-3 space-y-3">
          {TIM.map((p) => (
            <div key={p.name}>
              <p className="font-semibold text-sogan-900 dark:text-cream-100">
                {p.name}
              </p>
              <p className="text-xs text-prada-600 dark:text-prada-400">
                {p.role}
              </p>
              <p className="mt-1 text-sm text-ink-900/70 dark:text-cream-200/70">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Dukung Proyek Iki
        </h3>
        <p className="mt-3 text-sm text-ink-900/80 dark:text-cream-200/80">
          Proyek iki open source. Yen sampeyan pengin kontribusi, mangga kunjungi
          repositori GitHub kami utawa laporake bug.
        </p>
        <a
          href="https://github.com/AmirulJusticia0507/boso-jawa-ai"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-prada-600 hover:underline dark:text-prada-400"
        >
          GitHub →
        </a>
      </div>
    </section>
  );
}
