export default function Spinner({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
        style={{ animationDuration: "1.2s" }}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="currentColor"
          className="text-cream-200 dark:text-sogan-700"
          strokeWidth="4"
        />
        {/* Spinning arc — kawung petal inspired */}
        <path
          d="M50 8 A42 42 0 0 1 92 50"
          fill="none"
          stroke="currentColor"
          className="text-prada-500"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Center kawung dot */}
        <circle cx="50" cy="50" r="6" fill="currentColor" className="text-prada-400" />
        {/* 4 small petal hints */}
        <circle cx="50" cy="34" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
        <circle cx="66" cy="50" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
        <circle cx="50" cy="66" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
        <circle cx="34" cy="50" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
      </svg>
      <p className="font-jawa text-sm text-sogan-700 dark:text-cream-200/70">
        Nyedhiyakake...
      </p>
    </div>
  );
}
