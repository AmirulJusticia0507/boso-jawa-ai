export const inputCls =
  "w-full rounded-xl border border-cream-200 bg-white px-3 py-2 outline-none transition focus:border-prada-500 focus:ring-2 focus:ring-prada-500/30";

export const labelCls = "grid gap-1.5 text-sm font-semibold text-sogan-900";

export const buttonCls =
  "rounded-full bg-sogan-800 px-6 py-2.5 font-semibold text-cream-50 shadow transition hover:bg-sogan-700 disabled:cursor-default disabled:opacity-50";

export const cardCls =
  "mt-5 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm";

export const errorCls =
  "mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800";

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
