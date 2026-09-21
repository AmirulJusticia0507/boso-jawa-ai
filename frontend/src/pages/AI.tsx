import { useState } from "react";
import { PageHeader, CopyButton, buttonCls, errorCls, inputCls } from "../components/ui";
import { ApiError, chat, getModels } from "../services/api";
import type { ChatMessage } from "../types/basa";

export default function AI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "system", content: "Kowe asisten basa Jawa. Jawab nganggo basa Jawa ngoko lan padha ngerti tata krama ugi." },
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState("auto:free");
  const [loadingModels, setLoadingModels] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function fetchModels() {
    setLoadingModels(true);
    try {
      const res = await getModels();
      setModels(res.data);
      setError("");
    } catch (err) {
      setModels([]);
      setError(err instanceof ApiError ? err.message : "Gagol ambil model.");
    } finally {
      setLoadingModels(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === "" || generating) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setGenerating(true);
    setError("");
            try {
              const res = await chat({
                messages: [...messages, userMsg],
                model,
                max_tokens: 600,
              });
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: res.data.answer },
              ]);
            } catch (err) {
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section className="space-y-5">
      <PageHeader
        aksara="ꦄꦆ"
        title="Asisten AI Basa Jawa"
        desc="Obrol karo asisten AI kang ngerti basa Jawa — ngoko, krama, lan krama inggil."
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={fetchModels}
          disabled={loadingModels}
          className={`${buttonCls} text-xs`}
        >
          {loadingModels ? "Ngelek…" : "Pilih Model"}
        </button>
        {models.length > 0 && (
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className={`${inputCls} !max-w-[220px] text-sm`}
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        )}
        <span className="text-xs text-ink-900/60">
          {model}
        </span>
      </div>

      {error !== "" && <p className={errorCls}>{error}</p>}

      <div className="flex h-[60vh] min-h-[320px] max-h-[720px] flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="flex-1 overflow-y-auto space-y-3 p-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-sogan-800 px-4 py-2.5 text-sm text-cream-50 dark:bg-prada-500 dark:text-sogan-950"
                  : "rounded-2xl rounded-bl-sm border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-100"
              }
            >
              <p className="text-xs font-semibold text-prada-600 mb-1 opacity-70">
                {m.role === "system" ? "Asisten" : m.role === "user" ? "You" : "AI"}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed">
                {m.content}
              </p>
              {m.role === "assistant" && (
                <div className="mt-2 flex justify-end">
                  <CopyButton text={m.content} />
                </div>
              )}
            </div>
          ))}
          {generating && (
            <div className="rounded-2xl rounded-bl-sm border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink-900/60">
              <span className="inline-block animate-pulse">Ngomek…</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-cream-200 p-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya babagan basa Jawa…"
            className={inputCls}
            disabled={generating}
          />
          <button
            type="submit"
            disabled={generating || input.trim() === ""}
            className={buttonCls}
          >
            Kirim
          </button>
        </form>
      </div>
    </section>
  );
}
