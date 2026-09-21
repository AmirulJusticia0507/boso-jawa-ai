export const inputCls =
  "w-full rounded-xl border border-cream-200 bg-white px-3 py-2 outline-none transition focus:border-prada-500 focus:ring-2 focus:ring-prada-500/30 dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-100 dark:focus:border-prada-400";

export const labelCls = "grid gap-1.5 text-sm font-semibold text-sogan-900 dark:text-cream-200";

export const buttonCls =
  "rounded-full bg-sogan-800 px-6 py-2.5 font-semibold text-cream-50 shadow transition hover:bg-sogan-700 disabled:cursor-default disabled:opacity-50 dark:bg-prada-500 dark:text-sogan-950 dark:hover:bg-prada-400";

export const cardCls =
  "mt-5 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm dark:border-sogan-700 dark:bg-sogan-900";

export const errorCls =
  "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200";

import { useState } from "react";

export function CopyButton({ text, className = "" }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-full border border-cream-200 bg-white px-3 py-1.5 text-xs font-medium text-sogan-800 transition hover:bg-cream-100 dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-200 dark:hover:bg-sogan-700 ${className}`}
    >
      {copied ? (
        <>
          <span className="text-godong-700 dark:text-green-400">✓</span> Tersalin
        </>
      ) : (
        <>
          <span>📋</span> Salin
        </>
      )}
    </button>
  );
}

export function PageHeader(props: { aksara: string; title: string; desc: string }) {
  return (
    <div>
      <p className="font-jawa text-xl text-prada-600">{props.aksara}</p>
      <h2 className="mt-1 font-display text-3xl font-bold text-sogan-900">
        {props.title}
      </h2>
      <p className="mt-1 max-w-xl text-sm text-ink-900/70">{props.desc}</p>
    </div>
  );
}
