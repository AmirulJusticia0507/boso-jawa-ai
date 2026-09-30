import { useState } from "react";
import { ApiError, createUserBookmark, getUserToken } from "../services/api";

interface BookmarkButtonProps {
  resourceType: string;
  resourceId: string | number;
  title: string;
}

export default function BookmarkButton({ resourceType, resourceId, title }: BookmarkButtonProps) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [message, setMessage] = useState("");

  async function save() {
    if (!getUserToken()) {
      setMessage("Login dhisik kanggo nyimpen.");
      return;
    }
    setStatus("saving");
    setMessage("");
    try {
      await createUserBookmark({
        resource_type: resourceType,
        resource_id: String(resourceId),
        title,
        collection: "Favorit",
        note: null,
      });
      setStatus("saved");
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setStatus("saved");
      else setMessage(error instanceof Error ? error.message : "Bookmark gagal disimpen.");
    } finally {
      setStatus((current) => current === "saving" ? "idle" : current);
    }
  }

  return (
    <div className="text-right">
      <button
        type="button"
        onClick={() => void save()}
        disabled={status !== "idle"}
        className="rounded-lg border border-cream-200 px-2.5 py-1.5 text-xs font-semibold text-sogan-700 hover:bg-cream-100 disabled:opacity-60 dark:border-sogan-600 dark:text-cream-200 dark:hover:bg-sogan-700"
      >
        {status === "saving" ? "Nyimpen…" : status === "saved" ? "Wis disimpen" : "☆ Simpen"}
      </button>
      {message !== "" && <p className="mt-1 max-w-32 text-xs text-red-600 dark:text-red-400">{message}</p>}
    </div>
  );
}
