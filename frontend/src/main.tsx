import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { HistoryProvider } from "./contexts/HistoryContext";
import Layout from "./components/Layout";
import Aksara from "./pages/Aksara";
import AksaraTable from "./pages/AksaraTable";
import Angka from "./pages/Angka";
import Home from "./pages/Home";
import Kawruh from "./pages/Kawruh";
import History from "./pages/History";
import Macapat from "./pages/Macapat";
import AI from "./pages/AI";
import "./styles/main.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: "aksara", element: <Aksara /> },
      { path: "aksara-table", element: <AksaraTable /> },
      { path: "angka", element: <Angka /> },
      { path: "kawruh", element: <Kawruh /> },
      { path: "history", element: <History /> },
      { path: "macapat", element: <Macapat /> },
      { path: "ai", element: <AI /> },
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
