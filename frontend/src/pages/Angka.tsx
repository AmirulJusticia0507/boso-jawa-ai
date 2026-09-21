import { useState } from "react";
import { PageHeader, CopyButton, cardCls, inputCls, labelCls } from "../components/ui";

const LATIN_TO_JAWA: Record<string, string> = {
  "0": "꧐",
  "1": "꧑",
  "2": "꧒",
  "3": "꧓",
  "4": "꧔",
  "5": "꧕",
  "6": "꧖",
  "7": "꧗",
  "8": "꧘",
  "9": "꧙",
};

const JAWA_TO_LATIN: Record<string, string> = Object.fromEntries(
  Object.entries(LATIN_TO_JAWA).map(([k, v]) => [v, k])
);

function latinToJawa(num: string): string {
  return num
    .split("")
    .map((ch) => LATIN_TO_JAWA[ch] ?? ch)
    .join("");
}

function jawaToLatin(num: string): string {
  return num
    .split("")
    .map((ch) => JAWA_TO_LATIN[ch] ?? ch)
    .join("");
}

export default function Angka() {
  const [input, setInput] = useState("1234567890");
  const [mode, setMode] = useState<"latin_to_jawa" | "jawa_to_latin">("latin_to_jawa");

  const output =
    mode === "latin_to_jawa" ? latinToJawa(input) : jawaToLatin(input);

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦱꦃꦗꦮ"
        title="Converter Angka Jawa"
        desc="Konversi angka Latin (0-9) menyang aksara Jawa (꧐-꧙) lan sebaliknya."
      />

      <div className="grid max-w-2xl gap-4">
        <label className={labelCls}>
          Mode
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as typeof mode)}
            className={inputCls}
          >
            <option value="latin_to_jawa">Latin → Aksara Jawa</option>
            <option value="jawa_to_latin">Aksara Jawa → Latin</option>
          </select>
        </label>

        <label className={labelCls}>
          Input
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === "latin_to_jawa" ? "Contoh: 12345" : "Contoh: ꧑꧒꧓꧔꧕"}
            className={inputCls}
          />
        </label>
      </div>

      {output && (
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
              Hasil
            </h3>
            <CopyButton text={output} />
          </div>
          <p className="mt-2 overflow-x-auto rounded-xl bg-cream-100 p-4 font-jawa text-4xl leading-loose text-sogan-900 dark:bg-sogan-800 dark:text-cream-100">
            {output}
          </p>
        </div>
      )}

      <div className={cardCls}>
        <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
          Papan Angka Jawa
        </h3>
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
          {Object.entries(LATIN_TO_JAWA).map(([latin, jawa]) => (
            <div
              key={latin}
              className="flex flex-col items-center rounded-xl border border-cream-200 bg-cream-50 p-2 dark:border-sogan-700 dark:bg-sogan-800"
            >
              <span className="font-jawa text-2xl text-sogan-900 dark:text-prada-300">
                {jawa}
              </span>
              <span className="text-xs text-ink-900/60 dark:text-cream-200/60">
                {latin}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
