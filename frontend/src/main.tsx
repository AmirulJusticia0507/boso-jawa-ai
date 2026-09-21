import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Aksara from "./pages/Aksara";
import Home from "./pages/Home";
import Kawruh from "./pages/Kawruh";
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
      { path: "kawruh", element: <Kawruh /> },
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
    <RouterProvider router={router} />
  </StrictMode>,
);
