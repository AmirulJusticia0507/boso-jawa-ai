/// <reference types="cypress" />

/**
 * E2E untuk halaman yang tidak butuh backend: navigasi, tautan, dan halaman 404.
 * Alur yang menyentuh API diuji terpisah di `with-backend.cy.ts`.
 */

const BRAND = "Boso Jawa AI";

describe("Halaman utama", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("menampilkan identitas situs dan heading utama", () => {
    cy.title().should("not.be.empty");
    cy.contains(BRAND).should("be.visible");
    cy.get("h2").should("exist");
  });

  it("tidak memuat error JavaScript saat render pertama", () => {
    // Error boundary akan mengganti seluruh halaman dengan pesan "nemoni masalah".
    cy.contains("Aplikasi nemoni masalah").should("not.exist");
  });

  it("menampilkan tautan navigasi utama", () => {
    cy.get("nav").within(() => {
      cy.contains("a", "Aksara").should("have.attr", "href", "/aksara");
      cy.contains("a", "Paribasan").should("have.attr", "href", "/paribasan");
    });
  });
});

describe("Navigasi antar halaman", () => {
  const ROUTES: Array<{ path: string; expect: string }> = [
    { path: "/aksara", expect: "Transliterasi Aksara Jawa" },
    { path: "/aksara-table", expect: "Daftar Aksara Jawa" },
    { path: "/angka", expect: "Converter Angka Jawa" },
    { path: "/paribasan", expect: "Paribasan, Bebasan, lan Saloka" },
    { path: "/macapat", expect: "Tembang Macapat" },
    { path: "/ai", expect: "Asisten AI Basa Jawa" },
    { path: "/faq", expect: "Pitakonan Umum" },
    { path: "/about", expect: "Babagan Boso Jawa AI" },
    { path: "/privacy", expect: "Kebijakan Privasi" },
    { path: "/cookies", expect: "Kebijakan Cookies" },
    { path: "/admin", expect: "Admin Konten" },
  ];

  ROUTES.forEach(({ path, expect }) => {
    it(`merender ${path} tanpa error boundary`, () => {
      cy.visit(path);
      cy.location("pathname").should("eq", path);
      cy.contains("Aplikasi nemoni masalah").should("not.exist");
      cy.contains(expect).should("exist");
    });
  });
});

describe("Halaman 404", () => {
  it("menampilkan halaman tidak ditemukan untuk rute asing", () => {
    cy.visit("/rute-yang-tidak-ada", { failOnStatusCode: false });
    cy.contains("Aplikasi nemoni masalah").should("not.exist");
    cy.contains("Kaca Ora Ketemu").should("exist");
  });
});

describe("Tautan footer", () => {
  it("membuka halaman privasi dari footer", () => {
    cy.visit("/");
    cy.get("footer").within(() => {
      cy.contains("a", /privasi/i).click();
    });
    cy.location("pathname").should("eq", "/privacy");
  });
});
