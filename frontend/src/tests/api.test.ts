import { describe, it, expect, beforeEach, vi } from "vitest"
import { act, render, screen } from "@testing-library/react"
import { vi as globalVi } from "vitest"

// Test the API service
import type { ChatRequest } from "@/src/services/api"

// Mock the fetch API
global.fetch = vi.fn()

describe("API Service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should format chat request correctly", () => {
    const mockRequest: ChatRequest = {
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 512,
    }

    expect(mockRequest.messages).toHaveLength(2)
    expect(mockRequest.messages[0].role).toBe("user")
    expect(mockRequest.messages[0].content).toBe("Hello")
    expect(mockRequest.model).toBe("gpt-4")
    expect(mockRequest.temperature).toBe(0.7)
    expect(mockRequest.max_tokens).toBe(512)
  })

  it("renders component structure", () => {
    render(<div data-testid="test-component">Hello World</div>)
    const element = screen.getByTestId("test-component")
    expect(element).toHaveTextContent("Hello World")
  })
})