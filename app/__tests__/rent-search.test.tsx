import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => "/rent"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

vi.mock("@/app/rent/RentFilters", () => ({
  default: ({
    defaultValues,
  }: {
    defaultValues?: Record<string, string | undefined>;
  }) => (
    <div data-testid="rent-filters">
      <span data-testid="type-value">{defaultValues?.type}</span>
      <span data-testid="bedrooms-value">{defaultValues?.bedrooms}</span>
    </div>
  ),
}));

import RentSearch from "@/app/rent/RentSearch";

describe("RentSearch", () => {
  it("renders search input with placeholder", () => {
    render(<RentSearch />);
    const input = screen.getByRole("searchbox", { name: /search properties/i });
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("placeholder", "Search city, sector, or landmark...");
  });

  it("accepts default value", () => {
    render(<RentSearch defaultValue="Noida" />);
    const input = screen.getByRole("searchbox", { name: /search properties/i });
    expect(input).toHaveValue("Noida");
  });

  it("debounces URL updates by 300ms", async () => {
    const user = userEvent.setup();
    const { useRouter } = await import("next/navigation");
    const replaceMock = vi.fn();

    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      replace: replaceMock,
      refresh: vi.fn(),
      back: vi.fn(),
    } as ReturnType<typeof useRouter>);

    render(<RentSearch />);
    const input = screen.getByRole("searchbox", { name: /search properties/i });
    await user.type(input, "Sector 18");

    expect(replaceMock).not.toHaveBeenCalled();

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledTimes(1);
    }, { timeout: 4000 });

    const calledWith = replaceMock.mock.calls[0][0];
    expect(calledWith).toContain("search=Sector+18");
    expect(calledWith).not.toContain("page=");
  }, 5000);
});