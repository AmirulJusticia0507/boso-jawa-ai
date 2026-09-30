import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader, CopyButton, ShareButton, buttonCls, cardCls, errorCls, inputCls, labelCls } from "../components/ui";
import { useHistory } from "../contexts/HistoryContext";
import { ApiError, transliterate } from "../services/api";
import type { Direction, TransliterateData } from "../types/basa";

const KEY_GROUPS = [
  { name: "Carakan", keys: [["Ha", "\uA9B2"], ["Na", "\uA9A4"], ["Ca", "\uA995"], ["Ra", "\uA9AB"], ["Ka", "\uA98F"], ["Da", "\uA9A2"], ["Ta", "\uA9A0"], ["Sa", "\uA9B1"], ["Wa", "\uA9AE"], ["La", "\uA9AD"], ["Pa", "\uA9A5"], ["Dha", "\uA99D"], ["Ja", "\uA997"], ["Ya", "\uA9AA"], ["Nya", "\uA99A"], ["Ma", "\uA9A9"], ["Ga", "\uA992"], ["Ba", "\uA9A7"], ["Tha", "\uA99B"], ["Nga", "\uA994"]] },
  { name: "Sandhangan", keys: [["Wulu", "\uA9B6"], ["Suku", "\uA9B8"], ["Taling", "\uA9BA"], ["Pepet", "\uA9BC"], ["Tarung", "\uA9B4"], ["Pangkon", "\uA9C0"]] },
  { name: "Panyigeg", keys: [["Cecak", "\uA981"], ["Layar", "\uA982"], ["Wignyan", "\uA983"]] },
] as const;

export default function Aksara() {
  const [text, setText] = useState("mangan soto ing jogja");
  const [direction, setDirection] = useState<Direction>("latin_to_aksara");
  const [result, setResult] = useState<TransliterateData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { add: addHistory } = useHistory();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertKey(value: string) {
    const input = textareaRef.current;
    const start = input?.selectionStart ?? text.length;
    const end = input?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + value + text.slice(end));
    setDirection("aksara_to_latin");
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + value.length, start + value.length);
    });
  }

  async function exportPng(value: string) {
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1400;
    canvas.height = 700;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fffaf0";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#3a1410";
    ctx.font = "bold 38px serif";
    ctx.fillText("Boso Jawa AI - Hasil Transliterasi", 70, 90);
    ctx.font = "52px 'Noto Sans Javanese', serif";
    const words = value.split(" ");
    let line = "", y = 190;
    for (const word of words) {
      const next = `${line}${word} `;
      if (ctx.measureText(next).width > 1260 && line) {
        ctx.fillText(line, 70, y);
        line = `${word} `;
        y += 82;
      } else line = next;
    }
    ctx.fillText(line, 70, y);
    const link = document.createElement("a");
    link.download = "transliterasi-aksara-jawa.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function exportPdf(value: string) {
    const popup = window.open("", "_blank", "width=900,height=700");
    if (!popup) {
      setError("Popup diblokir. Izinkan popup untuk ekspor PDF.");
      return;
    }
    const styles = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')].map((link) => link.outerHTML).join("");
    popup.document.write(`<!doctype html><html><head><title>Transliterasi Aksara Jawa</title>${styles}<style>body{padding:48px;color:#3a1410}p{font-size:42px;line-height:1.8;overflow-wrap:anywhere}@media print{button{display:none}}</style></head><body><h1>Hasil Transliterasi</h1><p class="font-jawa">${value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char]!)}</p><button onclick="print()">Simpan sebagai PDF</button></body></html>`);
    popup.document.close();
    popup.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await transliterate({
        text,
        direction,
        include_sandhangan: true,
      });
      setResult(res.data);
      const output = direction === "latin_to_aksara" ? res.data.aksara : res.data.latin;
      if (output) {
        addHistory({ type: "transliterasi", input: text, output });
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const output = result
    ? direction === "latin_to_aksara"
      ? result.aksara
      : result.latin
    : null;
  const rules = result?.rules_applied ?? [];

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦲꦏ꧀ꦱꦫ"
        title="Transliterasi Aksara Jawa"
        desc="Nulis latin dadi aksara Jawa — pasangan, taling-tarung, lan panyigeg diolah otomatis."
      />
      <Link
        to="/aksara-table"
        className="inline-block text-sm font-semibold text-prada-600 hover:underline dark:text-prada-400"
      >
        Lihat Daftar Aksara →
      </Link>
      <form onSubmit={handleSubmit} className="grid max-w-2xl gap-4">
        <label className={labelCls}>
          Teks
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className={inputCls}
          />
        </label>
        <details className={cardCls}>
          <summary className="cursor-pointer font-semibold">Keyboard Virtual Aksara Jawa</summary>
          {KEY_GROUPS.map((group) => <div key={group.name} className="mt-3"><p className="text-xs font-semibold text-abu-600">{group.name}</p><div className="mt-1 flex flex-wrap gap-2">{group.keys.map(([label, value]) => <button key={label} type="button" title={label} onClick={() => insertKey(value)} className="min-w-11 rounded-lg border border-cream-300 bg-cream-50 px-3 py-2 font-jawa text-xl hover:border-prada-500 dark:border-sogan-700 dark:bg-sogan-800">{value}</button>)}</div></div>)}
        </details>
        <label className={labelCls}>
          Arah
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as Direction)}
            className={inputCls}
          >
            <option value="latin_to_aksara">Latin → Aksara</option>
            <option value="aksara_to_latin">Aksara → Latin</option>
          </select>
        </label>
        <div>
          <button
            type="submit"
            disabled={loading || text.trim() === ""}
            className={buttonCls}
          >
            {loading ? "Ngolah…" : "Transliterasi"}
          </button>
        </div>
      </form>
      {error !== "" && <p className={errorCls}>{error}</p>}
      {output != null && (
        <div className={cardCls}>
          <div className="flex items-center justify-between">
            <h3 className="font-display text-lg font-bold text-sogan-900 dark:text-cream-50">
              Hasil
            </h3>
            <div className="flex gap-2">
              <CopyButton text={output} />
              <ShareButton text={output} title="Hasil Transliterasi Aksara Jawa" />
              <button type="button" className={buttonCls} onClick={() => exportPng(output)}>PNG</button>
              <button type="button" className={buttonCls} onClick={() => exportPdf(output)}>PDF</button>
            </div>
          </div>
          <p className="mt-2 overflow-x-auto rounded-xl bg-cream-100 p-4 font-jawa text-3xl leading-loose text-sogan-900 dark:bg-sogan-800 dark:text-cream-100">
            {output}
          </p>
          {(result?.ambiguities.length ?? 0) > 0 && <div className="mt-4 rounded-xl border border-kuning-300 bg-kuning-50 p-3 text-sm dark:bg-sogan-800"><h4 className="font-semibold">Input bisa ambigu</h4>{result?.ambiguities.map((item, i) => <div key={`${item.source}-${i}`} className="mt-2"><p>{item.message}</p>{item.suggestions.map((suggestion) => <button key={suggestion} type="button" className="mt-1 text-prada-700 underline" onClick={() => setText(suggestion)}>Gunakake: {suggestion}</button>)}</div>)}</div>}
          {(result?.segments.length ?? 0) > 0 && <div className="mt-4"><h4 className="text-sm font-semibold">Penjelasan per karakter / suku kata</h4><div className="mt-2 grid gap-2 sm:grid-cols-2">{result?.segments.map((segment, i) => <div key={`${segment.source}-${i}`} className="rounded-lg bg-cream-50 p-2 text-sm dark:bg-sogan-800"><span className="font-semibold">{segment.source}</span> → <span className="font-jawa text-lg">{segment.output}</span><p className="text-xs text-abu-600 dark:text-abu-300">{segment.explanation}</p></div>)}</div></div>}
          {rules.length > 0 && (
            <>
              <h4 className="mt-4 text-sm font-semibold text-sogan-900 dark:text-cream-100">
                Aturan yang diterapkan
              </h4>
              <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-ink-900/80 dark:text-cream-200/80">
                {rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
