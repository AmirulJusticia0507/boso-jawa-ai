describe("Boso Jawa AI E2E Tests", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  it(" homepage loads successfully", () => {
    cy.contains("Boso Jawa AI")
    cy.url().should("include", "/")
  })

  it("navigates to aksara page", () => {
    cy.visit("/aksara")
    cy.contains("Aksara Jawa")
  })

  it("navigates to AI chat page", () => {
    cy.visit("/ai")
    cy.contains("AI Chat")
  })
})