import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const DEFAULT_DESCRIPTION = "Sinau basa lan sastra Jawa: transliterasi Aksara Jawa, kamus unggah-ungguh, paribasan, macapat, lan asisten AI.";
const TITLES: Record<string, string> = {
  "/": "Boso Jawa AI — Nguri-uri Basa Jawa",
  "/aksara": "Transliterasi Aksara Jawa — Boso Jawa AI",
  "/kawruh": "Kamus lan Korektor Unggah-Ungguh — Boso Jawa AI",
  "/paribasan": "Paribasan, Bebasan, lan Saloka — Boso Jawa AI",
  "/macapat": "Checker Tembang Macapat — Boso Jawa AI",
  "/ai": "Asisten AI Basa Jawa — Boso Jawa AI",
  "/sinau": "Sinau Basa Jawa — Boso Jawa AI",
};

function setMeta(selector: string, attribute: string, value: string) {
  const element = document.querySelector<HTMLMetaElement>(selector);
  if (element) element.setAttribute(attribute, value);
}

export default function Seo() {
  const location = useLocation();
  useEffect(() => {
    const title = TITLES[location.pathname] ?? "Boso Jawa AI";
    document.title = title;
    setMeta('meta[name="description"]', "content", DEFAULT_DESCRIPTION);
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", DEFAULT_DESCRIPTION);
    setMeta('meta[property="og:url"]', "content", window.location.href);
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, [location.pathname]);
  return null;
}
