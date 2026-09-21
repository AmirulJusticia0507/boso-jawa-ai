import { PageHeader, cardCls } from "../components/ui";
import { useHistory } from "../contexts/HistoryContext";

const TYPE_LABELS: Record<string, string> = {
  transliterasi: "Transliterasi",
  chat: "Chat AI",
  macapat: "Macapat",
  angka: "Angka",
};

const TYPE_ICONS: Record<string, string> = {
  transliterasi: "ꦲꦏ꧀ꦱꦫ",
  chat: "ꦄꦄ",
  macapat: "ꦩꦕꦥꦠ꧀",
  angka: "ꦱꦃꦗꦮ",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Sawijining";
  if (mins < 60) return `${mins} menit kepungkur`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam kepungkur`;
  const days = Math.floor(hrs / 24);
  return `${days} dina kepungkur`;
}

export default function History() {
  const { items, remove, clear } = useHistory();

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between">
        <PageHeader
          aksara="ꦬꦶꦱꦶꦱ꧀"
          title="Riwayat"
          desc="Riwayat transliterasi, chat, macapat, lan konversi angka."
        />
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="mt-2 shrink-0 rounded-full border border-red-200 bg-red-50 px-4 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900"
          >
            Busak Kabeh
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={cardCls}>
          <p className="text-center text-sm text-ink-900/60 dark:text-cream-200/60">
            Belum ana riwayat.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className={`${cardCls} mt-0 group`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-jawa text-lg text-prada-600 dark:text-prada-400">
                      {TYPE_ICONS[item.type]}
                    </span>
                    <span className="text-xs font-semibold text-sogan-700 dark:text-prada-300">
                      {TYPE_LABELS[item.type]}
                    </span>
                    <span className="text-xs text-ink-900/40 dark:text-cream-200/40">
                      · {timeAgo(item.timestamp)}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm text-ink-900/80 dark:text-cream-200/80">
                    <span className="font-medium text-sogan-900 dark:text-cream-100">Input:</span>{" "}
                    {item.input}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-ink-900/80 dark:text-cream-200/80">
                    <span className="font-medium text-sogan-900 dark:text-cream-100">Output:</span>{" "}
                    {item.output}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  className="shrink-0 rounded-full p-1.5 text-ink-900/30 transition hover:bg-red-50 hover:text-red-600 dark:text-cream-200/30 dark:hover:bg-red-950 dark:hover:text-red-400"
                  aria-label="Hapus"
                >
                  ✕
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
