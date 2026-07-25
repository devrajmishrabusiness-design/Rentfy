import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearchParams } from "next/navigation";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => "/rent"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
}));

import RentSortSelect from "@/app/rent/RentSortSelect";

describe("RentSortSelect", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renders sort dropdown with default 'newest'", () => {
    render(<RentSortSelect />);
    const select = screen.getByRole("combobox", { name: /sort properties/i });
    expect(select).toHaveValue("newest");
  });

  it("renders all sort options", () => {
    render(<RentSortSelect />);
    const select = screen.getByRole("combobox", { name: /sort properties/i });
    expect(select).toContainHTML("Newest First");
    expect(select).toContainHTML("Price: Low to High");
    expect(select).toContainHTML("Price: High to Low");
    expect(select).toContainHTML("Most Relevant");
  });

  it("updates URL when sort changes", async () => {
    const user = userEvent.setup();
    render(<RentSortSelect />);
    const select = screen.getByRole("combobox", { name: /sort properties/i });
    await user.selectOptions(select, "price_asc");

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const url = mockReplace.mock.calls[0][0];
    expect(url).toContain("sort=price_asc");
    expect(url).not.toContain("page=");
  });

  it("removes sort param when reset to newest", async () => {
    const user = userEvent.setup();
    vi.mocked(useSearchParams).mockReturnValue(new URLSearchParams("sort=price_desc"));
    render(<RentSortSelect />);
    const select = screen.getByRole("combobox", { name: /sort properties/i });
    await user.selectOptions(select, "newest");

    expect(mockReplace).toHaveBeenCalledTimes(1);
    const url = mockReplace.mock.calls[0][0];
    expect(url).not.toContain("sort=");
  });
});