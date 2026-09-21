import { useState } from "react";
import { PageHeader, CopyButton, cardCls, inputCls } from "../components/ui";

interface AksaraItem {
  latin: string;
  aksara: string;
  sandhangan?: string;
  pasangan?: string;
}

const CARAKAN: AksaraItem[] = [
  { latin: "ha", aksara: "ꦲ", pasangan: "꧀ꦲ" },
  { latin: "na", aksara: "ꦤ", pasangan: "꧀ꦤ" },
  { latin: "ca", aksara: "ꦕ", pasangan: "꧀ꦕ" },
  { latin: "ra", aksara: "ꦫ", pasangan: "꧀ꦫ" },
  { latin: "ka", aksara: "ꦏ", pasangan: "꧀ꦏ" },
  { latin: "da", aksara: "ꦢ", pasangan: "꧀ꦢ" },
  { latin: "ta", aksara: "ꦠ", pasangan: "꧀ꦠ" },
  { latin: "sa", aksara: "ꦱ", pasangan: "꧀ꦱ" },
  { latin: "wa", aksara: "ꦮ", pasangan: "꧀ꦮ" },
  { latin: "la", aksara: "ꦭ", pasangan: "꧀ꦭ" },
  { latin: "pa", aksara: "ꦥ", pasangan: "꧀ꦥ" },
  { latin: "dha", aksara: "ꦣ", pasangan: "꧀ꦣ" },
  { latin: "ja", aksara: "ꦗ", pasangan: "꧀ꦗ" },
  { latin: "ya", aksara: "ꦪ", pasangan: "꧀ꦪ" },
  { latin: "nya", aksara: "ꦚ", pasangan: "꧀ꦚ" },
  { latin: "ma", aksara: "ꦩ", pasangan: "꧀ꦩ" },
  { latin: "ga", aksara: "ꦒ", pasangan: "꧀ꦒ" },
  { latin: "ba", aksara: "ꦧ", pasangan: "꧀ꦧ" },
  { latin: "tha", aksara: "ꦛ", pasangan: "꧀ꦛ" },
  { latin: "nga", aksara: "ꦔ", pasangan: "꧀ꦔ" },
];

const SANDHANGAN: AksaraItem[] = [
  { latin: "a (pendek)", aksara: "ꦴ", sandhangan: "tarung" },
  { latin: "i (panjang)", aksara: "ꦶ", sandhangan: "taling" },
  { latin: "u (panjang)", aksara: "ꦸ", sandhangan: "taling" },
  { latin: "é", aksara: "ꦺ", sandhangan: "taling" },
  { latin: "o", aksara: "ꦺꦴ", sandhangan: "taling-tarung" },
  { latin: "è", aksara: "ꦌ", sandhangan: "taling" },
  { latin: "ai", aksara: "ꦻ", sandhangan: "taling" },
  { latin: "au/ou", aksara: "ꦻꦴ", sandhangan: "taling-tarung" },
  { latin: "re", aksara: "ꦽ", sandhangan: "pangkon" },
  { latin: "ra (pendek)", aksara: "ꦿ", sandhangan: "pasangan" },
  { latin: "paingan (h)", aksara: "ꦃ", sandhangan: "swara" },
  { latin: "layar (r)", aksara: "ꦂ", sandhangan: "layar" },
  { latin: "cakra (r)", aksara: "ꦿ", sandhangan: "cakra" },
  { latin: "keret", aksara: "ꦿꦝ", sandhangan: "keret" },
  { latin: "pangkon", aksara: "꧀", sandhangan: "pangkon" },
];

export default function AksaraTable() {
  const [filter, setFilter] = useState("");

  const filteredCarakan = CARAKAN.filter(
    (a) =>
      a.latin.includes(filter.toLowerCase()) ||
      a.aksara.includes(filter)
  );

  const filteredSandhangan = SANDHANGAN.filter(
    (a) =>
      a.latin.includes(filter.toLowerCase()) ||
      a.aksara.includes(filter)
  );

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦲꦏ꧀ꦱꦫꦗꦮ"
        title="Daftar Aksara Jawa"
        desc="Referensi lengkap 20 aksara carakan, sandhangan, lan pasangan."
      />

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Goleki aksara…"
        className={`${inputCls} max-w-sm`}
      />

      <div className={cardCls}>
        <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
          Aksara Carakan (20)
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
          {filteredCarakan.map((a) => (
            <div
              key={a.latin}
              className="group relative flex flex-col items-center rounded-xl border border-cream-200 bg-cream-50 p-3 transition hover:shadow-md dark:border-sogan-700 dark:bg-sogan-800"
            >
              <span className="font-jawa text-3xl text-sogan-900 group-hover:text-prada-500 dark:text-cream-100 dark:group-hover:text-prada-400">
                {a.aksara}
              </span>
              <span className="mt-1 text-xs text-ink-900/70 dark:text-cream-200/70">
                {a.latin}
              </span>
              {a.pasangan && (
                <span className="mt-1 font-jawa text-lg text-sogan-700 opacity-0 group-hover:opacity-100 dark:text-prada-300">
                  {a.pasangan}
                </span>
              )}
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100">
                <CopyButton text={a.aksara} />
              </div>
            </div>
          ))}
        </div>
        {filteredCarakan.length === 0 && (
          <p className="mt-3 text-sm text-ink-900/60 dark:text-cream-200/60">
            Aksara ora ketemu.
          </p>
        )}
      </div>

      <div className={cardCls}>
        <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
          Sandhangan Swara & Angkan
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {filteredSandhangan.map((a) => (
            <div
              key={a.latin}
              className="group relative flex flex-col items-center rounded-xl border border-cream-200 bg-cream-50 p-3 transition hover:shadow-md dark:border-sogan-700 dark:bg-sogan-800"
            >
              <span className="font-jawa text-3xl text-sogan-900 group-hover:text-prada-500 dark:text-cream-100 dark:group-hover:text-prada-400">
                {a.aksara}
              </span>
              <span className="mt-1 text-xs text-ink-900/70 dark:text-cream-200/70">
                {a.latin}
              </span>
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100">
                <CopyButton text={a.aksara} />
              </div>
            </div>
          ))}
        </div>
        {filteredSandhangan.length === 0 && (
          <p className="mt-3 text-sm text-ink-900/60 dark:text-cream-200/60">
            Sandhangan ora ketemu.
          </p>
        )}
      </div>
    </section>
  );
}
