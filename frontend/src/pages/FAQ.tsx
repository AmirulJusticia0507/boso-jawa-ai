import { useState } from "react";
import { PageHeader, cardCls } from "../components/ui";

interface FAQItem {
  q: string;
  a: string;
}

const FAQ_DATA: FAQItem[] = [
  {
    q: "Apa iki Boso Jawa AI?",
    a: "Boso Jawa AI yaiku sistem digital kanggo pelestarian basa Jawa. Ana 5 fitur utama: transliterasi aksara, converter angka, kamus undha-usuk, validator macapat, lan asisten AI kang ngerti basa Jawa.",
  },
  {
    q: "Carana nganggo transliterasi aksara?",
    a: "Mlebu ing halaman Aksara, pilih arah (Latin → Aksara utawa Aksara → Latin), ketik teks, banjur klik tombol 'Transliterasi'. Hasil bakal muncul kanthi otomatis, kalebu pasangan, taling-tarung, lan panyigeg.",
  },
  {
    q: "Apa basa Jawa sing didhukung?",
    a: "Kita ndhukung kabeh tingkatan basa Jawa: Ngoko, Krama Lugu, Krama Inggil, lan terjemahan menyang Bahasa Indonesia. Converter angka ndhukung aksara Jawa (꧐-꧙).",
  },
  {
    q: "Apakah bisa digunakake tanpa internet?",
    a: "Sebagian fitur bisa digunakake offline (transliterasi, converter angka, daftar aksara). Nanging fitur AI lan kamus undha-usuk butuh koneksi internet amarga nyambung menyang server.",
  },
  {
    q: "Data sing saya ketik disimpen ing endi?",
    a: "Data input ora disimpen ing server. Kabeh diproses langsung lan ora permanen. Riwayat mung disimpen ing browser sampeyan (localStorage) lan bisa dihapus kapan wae.",
  },
  {
    q: "Carane mbusak riwayat?",
    a: "Mlebu ing halaman Riwayat, klik tombol '✕' ing saben item kanggo mbusak siji-siji, utawa klik 'Busak Kabeh' kanggo mbusak kabeh riwayat.",
  },
  {
    q: "Apa support tembang macapat kabeh?",
    a: "Ya, kita ndhukung 11 tembang macapat: Asmaradana, Dhangdanggula, Durma, Jurud emung, Maskumambang, Megatruh, Minarsih, Pocung, Puntur, Sinom, lan Girisa. Validasi guru gatra, wilangan, lan lagu diolah otomatis.",
  },
  {
    q: "Kepiye carane ngganti tema (light/dark)?",
    a: "Klik tombol ☽ (dark mode) utawa ☀ (light mode) ing nav bar pojok tengen. Tema bakal disimpen otomatis ing browser sampeyan.",
  },
];

function FAQAccordion({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-cream-200 bg-white dark:border-sogan-700 dark:bg-sogan-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-sogan-900 transition hover:bg-cream-50 dark:text-cream-100 dark:hover:bg-sogan-800"
      >
        <span>{item.q}</span>
        <span className="ml-2 shrink-0 text-lg text-prada-600 dark:text-prada-400">
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <div className="border-t border-cream-200 px-4 py-3 text-sm leading-relaxed text-ink-900/80 dark:border-sogan-700 dark:text-cream-200/80">
          {item.a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <section className="space-y-8">
      <PageHeader
        aksara="ꦥꦶꦠꦱꦺꦁ"
        title="Pitakonan Umum (FAQ)"
        desc="Wangsulan kanggo pitakonan sing asring ditakokake babagan Boso Jawa AI."
      />

      <div className="space-y-3">
        {FAQ_DATA.map((item) => (
          <FAQAccordion key={item.q} item={item} />
        ))}
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
          Isih Ana Pitakon?
        </h3>
        <p className="mt-2 text-sm text-ink-900/70 dark:text-cream-200/70">
          Yen sampeyan isih duwe pitakon sing ora ana ing ndhuwur, mangga
          hubungi kita liwat GitHub utawa email.
        </p>
        <a
          href="https://github.com/AmirulJusticia0507/boso-jawa-ai/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block text-sm font-semibold text-prada-600 hover:underline dark:text-prada-400"
        >
          Laporkan Pitakon →
        </a>
      </div>
    </section>
  );
}
