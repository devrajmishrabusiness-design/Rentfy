import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => "/rent"),
  useSearchParams: vi.fn(() => new URLSearchParams("type=Apartment&bedrooms=2")),
}));

import ActiveFilters from "@/app/rent/ActiveFilters";

describe("ActiveFilters", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it("renders active filters with labels", () => {
    render(
      <ActiveFilters
        filters={{
          type: "Apartment",
          bedrooms: "2",
        }}
      />
    );

    expect(screen.getByText("Property Type:")).toBeInTheDocument();
    expect(screen.getByText("Apartment")).toBeInTheDocument();
    expect(screen.getByText("Bedrooms:")).toBeInTheDocument();
    expect(screen.getByText("2 BHK")).toBeInTheDocument();
  });

  it("does not render when no filters are active", () => {
    const { container } = render(<ActiveFilters filters={{}} />);
    expect(container.firstChild).toBeNull();
  });

  it("removes individual filter when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ActiveFilters
        filters={{
          type: "Apartment",
        }}
      />
    );

    const removeButton = screen.getByLabelText(/remove property type filter/i);
    await user.click(removeButton);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace.mock.calls[0][0]).toBe("/rent?bedrooms=2");
  });

  it("clears all filters when clear all is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ActiveFilters
        filters={{
          type: "Apartment",
          bedrooms: "2",
        }}
      />
    );

    const clearAllButton = screen.getByLabelText(/clear all filters/i);
    await user.click(clearAllButton);

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const url = mockReplace.mock.calls[0][0];
    expect(url).toBe("/rent");
  });
});