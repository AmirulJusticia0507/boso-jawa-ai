import { useEffect, useRef, useState } from "react";
import { PageHeader, CopyButton, ShareButton, buttonCls, errorCls, inputCls } from "../components/ui";
import { useHistory } from "../contexts/HistoryContext";
import { ApiError, chat, getModels } from "../services/api";
import type { ChatMessage, KnowledgeSource } from "../types/basa";

const SYSTEM_MESSAGE: ChatMessage = {
  role: "system",
  content: "Kowe asisten basa Jawa. Jawab nganggo basa Jawa ngoko lan padha ngerti tata krama ugi.",
};
const STORAGE_KEY = "boso-jawa-ai-chat";
const MODEL_KEY = "boso-jawa-ai-model";

function loadMessages(): ChatMessage[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as ChatMessage[];
    const valid = saved.filter(
      (message) =>
        ["user", "assistant"].includes(message.role) &&
        typeof message.content === "string" &&
        message.content.trim() !== "",
    );
    return [SYSTEM_MESSAGE, ...valid.slice(-19)];
  } catch {
    return [SYSTEM_MESSAGE];
  }
}

export default function AI() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [models, setModels] = useState<string[]>([]);
  const [model, setModel] = useState(() => localStorage.getItem(MODEL_KEY) ?? "deepseek-v4-flash");
  const [loadingModels, setLoadingModels] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [lastFailed, setLastFailed] = useState<ChatMessage | null>(null);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const controllerRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const { add: addHistory } = useHistory();

  useEffect(() => {
    const conversation = messages.filter((message) => message.role !== "system").slice(-19);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversation));
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  useEffect(() => localStorage.setItem(MODEL_KEY, model), [model]);
  useEffect(() => () => controllerRef.current?.abort(), []);

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

  async function sendMessage(userMsg: ChatMessage, base: ChatMessage[], appendUser: boolean) {
    const pending = appendUser ? [...base, userMsg] : base;
    const requestMessages = [
      SYSTEM_MESSAGE,
      ...pending.filter((message) => message.role !== "system").slice(-19),
    ];
    if (appendUser) setMessages(requestMessages);
    setGenerating(true);
    setLastFailed(null);
    setError("");
    const controller = new AbortController();
    controllerRef.current = controller;
    try {
      const res = await chat({ messages: requestMessages, model, max_tokens: 600 }, controller.signal);
      setMessages((previous) => [...previous, { role: "assistant", content: res.data.answer }]);
      setSources(res.data.sources);
      addHistory({ type: "chat", input: userMsg.content, output: res.data.answer });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setLastFailed(userMsg);
      setError(err instanceof ApiError ? err.message : "Terjadi kesalahan.");
    } finally {
      if (controllerRef.current === controller) controllerRef.current = null;
      setGenerating(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim() === "" || generating) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    setInput("");
    await sendMessage(userMsg, messages, true);
  }

  function resetChat() {
    controllerRef.current?.abort();
    setMessages([SYSTEM_MESSAGE]);
    setInput("");
    setError("");
    setLastFailed(null);
    setSources([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  return (
    <section className="space-y-5">
      <PageHeader aksara="ꦄꦆ" title="Asisten AI Basa Jawa" desc="Obrol karo asisten AI kang ngerti basa Jawa — ngoko, krama, lan krama inggil." />

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={fetchModels} disabled={loadingModels} className={`${buttonCls} text-xs`}>
          {loadingModels ? "Ngelek…" : "Pilih Model"}
        </button>
        {models.length > 0 && (
          <select value={model} onChange={(e) => setModel(e.target.value)} className={`${inputCls} !max-w-[220px] text-sm`}>
            {models.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        )}
        <span className="text-xs text-ink-900/60 dark:text-cream-200/60">{model}</span>
        <button type="button" onClick={resetChat} className={`${buttonCls} ml-auto text-xs`}>Reset chat</button>
      </div>

      {error !== "" && (
        <div className="flex flex-wrap items-center gap-2">
          <p className={errorCls}>{error}</p>
          {lastFailed != null && (
            <button type="button" className={`${buttonCls} text-xs`} disabled={generating} onClick={() => void sendMessage(lastFailed, messages, false)}>Coba maneh</button>
          )}
        </div>
      )}

      {sources.length > 0 && (
        <details className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm dark:border-sogan-700 dark:bg-sogan-900">
          <summary className="cursor-pointer font-semibold">Sumber internal ({sources.length})</summary>
          <ul className="mt-3 space-y-2">
            {sources.map((source, index) => (
              <li key={`${source.category}-${source.title}-${index}`}>
                <span className="font-semibold">{source.citation} {source.title}</span>
                <span className="text-ink-900/60 dark:text-cream-200/60"> · {source.category}</span>
                <span className="ml-2 rounded-full bg-cream-200 px-2 py-0.5 text-xs dark:bg-sogan-700">{Math.round(source.score * 100)}% relevan</span>
                <p className="mt-0.5 text-ink-900/80 dark:text-cream-200/80">{source.content}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="flex h-[60vh] min-h-[320px] max-h-[720px] flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm dark:border-sogan-700 dark:bg-sogan-900">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.filter((message) => message.role !== "system").map((message, index) => (
            <div key={index} className={message.role === "user" ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-sogan-800 px-4 py-2.5 text-sm text-cream-50 dark:bg-prada-500 dark:text-sogan-950" : "rounded-2xl rounded-bl-sm border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-100"}>
              <p className="mb-1 text-xs font-semibold text-prada-600 opacity-70 dark:text-prada-400">{message.role === "user" ? "You" : "AI"}</p>
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
              {message.role === "assistant" && (
                <div className="mt-2 flex justify-end gap-2"><CopyButton text={message.content} /><ShareButton text={message.content} title="Balasan AI Boso Jawa" /></div>
              )}
            </div>
          ))}
          {generating && <div className="rounded-2xl rounded-bl-sm border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink-900/60 dark:border-sogan-700 dark:bg-sogan-800 dark:text-cream-200/60"><span className="inline-block animate-pulse">Ngomek…</span></div>}
          <div ref={endRef} />
        </div>

        <form onSubmit={handleSend} className="flex gap-2 border-t border-cream-200 p-3 dark:border-sogan-700">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tanya babagan basa Jawa…" className={inputCls} disabled={generating} />
          {generating ? <button type="button" onClick={() => controllerRef.current?.abort()} className={buttonCls}>Mandheg</button> : <button type="submit" disabled={input.trim() === ""} className={buttonCls}>Kirim</button>}
        </form>
      </div>
    </section>
  );
}
