import { render, screen } from "@testing-library/react";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "../components/ErrorBoundary";
import Spinner from "../components/Spinner";

function Boom(): never {
  throw new Error("ledakan");
}

function suppressEvent(event: Event): void {
  event.preventDefault();
  event.stopImmediatePropagation();
}

describe("Spinner", () => {
  it("menampilkan pesan memuat dan spinner yang bisa diakses", () => {
    render(<Spinner />);
    expect(screen.getByText("Nyedhiyakake...")).toBeInTheDocument();
  });

  it("menghormati ukuran khusus", () => {
    const { container } = render(<Spinner size={96} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "96");
    expect(svg).toHaveAttribute("height", "96");
  });
});

describe("ErrorBoundary", () => {
  // Saat anak melempar error, React menuliskannya ke console.error dan jsdom
  // ikut melaporkan error sebagai event `window.error`. Keduanya disamarkan agar
  // output test tetap bersih; ErrorBoundary sendiri tetap diuji.
  beforeAll(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.addEventListener("error", suppressEvent);
  });

  afterAll(() => {
    window.removeEventListener("error", suppressEvent);
    vi.restoreAllMocks();
  });

  it("merender children selama tidak ada error", () => {
    render(
      <ErrorBoundary>
        <p>Halo, dhedha</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("Halo, dhedha")).toBeInTheDocument();
  });

  it("menampilkan pesan fallback dan tombol muat ulang saat anak melempar error", () => {
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );

    expect(
      screen.getByRole("heading", { name: /Aplikasi nemoni masalah/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Muat ulang" })).toBeInTheDocument();
  });
});
