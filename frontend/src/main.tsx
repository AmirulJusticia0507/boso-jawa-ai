import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import Layout from "./components/Layout";
import "./styles/main.css";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Aksara = lazy(() => import("./pages/Aksara"));
const AksaraTable = lazy(() => import("./pages/AksaraTable"));
const Angka = lazy(() => import("./pages/Angka"));
const Cookies = lazy(() => import("./pages/Cookies"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Kawruh = lazy(() => import("./pages/Kawruh"));
const Paribasan = lazy(() => import("./pages/Paribasan"));
const History = lazy(() => import("./pages/History"));
const Macapat = lazy(() => import("./pages/Macapat"));
const Privacy = lazy(() => import("./pages/Privacy"));
const AI = lazy(() => import("./pages/AI"));

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <svg
            width="48"
            height="48"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className="animate-spin"
            style={{ animationDuration: "1.2s" }}
          >
            <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" className="text-cream-200 dark:text-sogan-700" strokeWidth="4" />
            <path d="M50 8 A42 42 0 0 1 92 50" fill="none" stroke="currentColor" className="text-prada-500" strokeWidth="5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="6" fill="currentColor" className="text-prada-400" />
            <circle cx="50" cy="34" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
            <circle cx="66" cy="50" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
            <circle cx="50" cy="66" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
            <circle cx="34" cy="50" r="3" fill="currentColor" className="text-prada-300 opacity-60" />
          </svg>
          <p className="font-jawa text-sm text-sogan-700 dark:text-cream-200/70">
            Nyedhiyakake...
          </p>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <LazyPage><Home /></LazyPage> },
      { path: "about", element: <LazyPage><About /></LazyPage> },
      { path: "aksara", element: <LazyPage><Aksara /></LazyPage> },
      { path: "aksara-table", element: <LazyPage><AksaraTable /></LazyPage> },
      { path: "angka", element: <LazyPage><Angka /></LazyPage> },
      { path: "cookies", element: <LazyPage><Cookies /></LazyPage> },
      { path: "faq", element: <LazyPage><FAQ /></LazyPage> },
      { path: "kawruh", element: <LazyPage><Kawruh /></LazyPage> },
      { path: "paribasan", element: <LazyPage><Paribasan /></LazyPage> },
      { path: "history", element: <LazyPage><History /></LazyPage> },
      { path: "macapat", element: <LazyPage><Macapat /></LazyPage> },
      { path: "privacy", element: <LazyPage><Privacy /></LazyPage> },
      { path: "ai", element: <LazyPage><AI /></LazyPage> },
    ],
  },
]);

const root = document.getElementById("root");
if (root == null) {
  throw new Error("Elemen #root tidak ditemukan.");
}
createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <HistoryProvider>
        <RouterProvider router={router} />
      </HistoryProvider>
    </ThemeProvider>
  </StrictMode>,
);
