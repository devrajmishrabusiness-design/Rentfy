import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => "/property/123"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/lib/supabase-browser", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    })),
  },
}));

import SharePropertyButton from "@/app/property/SharePropertyButton";

describe("SharePropertyButton", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    vi.resetModules();
  });

  it("renders share button", () => {
    render(<SharePropertyButton propertyId="123" propertyTitle="Test Property" />);
    expect(screen.getByRole("button", { name: /share property/i })).toBeInTheDocument();
  });

  it("copies URL when navigator.share is unavailable", async () => {
    const user = userEvent.setup();
    const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
    });

    render(<SharePropertyButton propertyId="123" propertyTitle="Test Property" />);
    const button = screen.getByRole("button", { name: /share property/i });
    await user.click(button);

    expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });

  it("shows copied feedback after clicking", async () => {
    const user = userEvent.setup();
    const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, "clipboard", {
      value: mockClipboard,
      writable: true,
    });
    Object.defineProperty(navigator, "share", {
      value: undefined,
      writable: true,
    });

    render(<SharePropertyButton propertyId="123" propertyTitle="Test Property" />);
    const button = screen.getByRole("button", { name: /share property/i });
    await user.click(button);

    expect(screen.getByText("Copied!")).toBeInTheDocument();
  });
});