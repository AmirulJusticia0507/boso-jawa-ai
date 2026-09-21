import { PageHeader, cardCls } from "../components/ui";

export default function Privacy() {
  return (
    <section className="space-y-8">
      <PageHeader
        aksara="ꦧꦺꦂꦤ꧀ꦱꦂ Wrocilak"
        title="Kebijakan Privasi"
        desc="Cara kita njaga data lan privasi sampeyan."
      />

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          1. Data sing Diumpum
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          Boso Jawa AI <strong>ora nyimpen data pribadi</strong> sampeyan ing
          server. Kabeh input (teks transliterasi, obrolan AI, lirik macapat)
          diproses langsung lan ora disimpen permanen.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
          <li>Input transliterasi → diproses, ora disimpen</li>
          <li>Pesenh chat AI → dikirim menyang API AI, ora disimpen ing server kita</li>
          <li>Lirik macapat → diproses kangge validasi, ora disimpen</li>
        </ul>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          2. Penyimpanan Lokal
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          Data sing disimpen ing browser sampeyan (localStorage):
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
          <li>
            <strong>Riwayat</strong> — 50 item pungkasan transliterasi, chat,
            macapat, lan angka. Bisa dihapus kapan wae.
          </li>
          <li>
            <strong>Preferensi tema</strong> — pilihan light/dark mode.
          </li>
        </ul>
        <p className="mt-3 text-sm text-ink-900/80 dark:text-cream-200/80">
          Kabeh data iki tetep ana ing browser sampeyan lan ora dikirim menyang
          server maneh.
        </p>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          3. Keamanan
        </h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
          <li>Semua komunikasi nganggo HTTPS</li>
          <li>API key AI ora diunggah menyang frontend</li>
          <li>Input disanitasasi sadurunge diproses</li>
          <li>ORA ana tracking / analytics pihak katelu</li>
        </ul>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          4. Pihak Katelu
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          Kita <strong>ora nuduhake data</strong> karo pihak katelu. Satu-satune
          pihak katelu yaiku provider AI (OpenRouter) kanggo memproses obrolan
          AI, lan padha uga ora nyimpen data sampeyan.
        </p>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          5. Hak Sampeyan
        </h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
          <li>Mbusak riwayat kapan wae (tombol "Busak Kabeh" ing halaman Riwayat)</li>
          <li>Mboten nganggo aplikasi yen ora remen</li>
          <li>Nglaporake bug utawa pitakon menyang tim kami</li>
        </ul>
      </div>
    </section>
  );
}
