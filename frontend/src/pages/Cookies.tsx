import { PageHeader, cardCls } from "../components/ui";

export default function Cookies() {
  return (
    <section className="space-y-8">
      <PageHeader
        aksara="ꦏꦸꦏꦶ"
        title="Kebijakan Cookies"
        desc="Cara kita nganggo cookies lan storage ing browser sampeyan."
      />

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Apa iki Cookies?
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          Cookies yaiku file cilik sing disimpen ing browser kanggo nyimpen
          preferensi. Boso Jawa AI <strong>ora nganggo cookies pihak katelu</strong>
          lan <strong>ora nganggo tracking cookies</strong>.
        </p>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Apa sing Kita Pakai?
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          Kita <strong>mung nganggo localStorage</strong>, dudu cookies.
          LocalStorage yaiku penyimpanan lokal ing browser sampeyan sing bisa
          diakses dening JavaScript.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-cream-100 text-left text-sogan-900 dark:bg-sogan-800 dark:text-cream-100">
                <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Key
                </th>
                <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Tujuan
                </th>
                <th className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Durasi
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-cream-200 px-3 py-2 font-mono text-xs dark:border-sogan-700">
                  theme
                </td>
                <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Nyimpen pilihan tema (light/dark)
                </td>
                <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Permanent (nganti dihapus)
                </td>
              </tr>
              <tr className="bg-red-50 dark:bg-red-950">
                <td className="border border-cream-200 px-3 py-2 font-mono text-xs dark:border-sogan-700">
                  boso-jawa-history
                </td>
                <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Riwayat transliterasi, chat, macapat, angka
                </td>
                <td className="border border-cream-200 px-3 py-2 dark:border-sogan-700">
                  Max 50 item, bisa dihapus
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Analytics & Tracking
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-ink-900/80 dark:text-cream-200/80">
          Kita <strong>ora nganggo Google Analytics, Facebook Pixel, utawa
          tracking tool liyane</strong>. Ora ana data sampeyan sing dikirim
          menyang pihak katelu kanggo tujuan marketing utawa analytics.
        </p>
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-xl font-bold text-sogan-900 dark:text-cream-50">
          Cara Nggihang localStorage
        </h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
          <li>
            <strong>Chrome:</strong> F12 → Application → Local Storage →
            hapus manual
          </li>
          <li>
            <strong>Firefox:</strong> F12 → Storage → Local Storage → hapus
          </li>
          <li>
            <strong>Safari:</strong> Develop → Local Storage → hapus
          </li>
          <li>
            Utawa gunakake tombol <strong>"Busak Kabeh"</strong> ing halaman
            Riwayat
          </li>
        </ul>
      </div>
    </section>
  );
}
