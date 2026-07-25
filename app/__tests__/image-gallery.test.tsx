import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mockReplace = vi.fn();

vi.mock("next/navigation", () => {
  const router = {
    push: vi.fn(),
    replace: mockReplace,
    refresh: vi.fn(),
    back: vi.fn(),
  };
  return {
    useRouter: vi.fn(() => router),
    usePathname: vi.fn(() => "/property/123"),
    useSearchParams: vi.fn(() => new URLSearchParams()),
  };
});

import ImageGallery from "@/app/ImageGallery";

describe("ImageGallery", () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("renders placeholder when no images provided", () => {
    render(<ImageGallery images={[]} title="Test Property" />);
    expect(screen.getByText("No photos available")).toBeInTheDocument();
  });

  it("renders main image and thumbnails", () => {
    const images = [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg",
    ];
    render(<ImageGallery images={images} title="Test Property" />);
    expect(screen.getByRole("img", { name: "Test Property" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Photo 1 of 2/ })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Photo 2 of 2/ })).toBeInTheDocument();
  });

  it("shows image counter", () => {
    const images = ["https://example.com/img1.jpg"];
    render(<ImageGallery images={images} title="Test Property" />);
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("switches image when thumbnail is clicked", async () => {
    const user = userEvent.setup();
    const images = [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg",
    ];
    render(<ImageGallery images={images} title="Test Property" />);

    const thumbnails = screen.getAllByRole("button", { name: /Photo \d of 2/ });
    await user.click(thumbnails[1]);

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("navigates images with prev/next buttons", async () => {
    const user = userEvent.setup();
    const images = [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg",
    ];
    render(<ImageGallery images={images} title="Test Property" />);

    const nextBtn = screen.getByRole("button", { name: "Next image" });
    await user.click(nextBtn);
    expect(screen.getByText("2 / 2")).toBeInTheDocument();

    const prevBtn = screen.getByRole("button", { name: "Previous image" });
    await user.click(prevBtn);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("opens fullscreen on image click", async () => {
    const user = userEvent.setup();
    const images = ["https://example.com/img1.jpg"];
    render(<ImageGallery images={images} title="Test Property" />);

    const mainImage = screen.getByRole("img", { name: "Test Property" });
    await user.click(mainImage);

    expect(screen.getByRole("dialog", { name: "Image gallery fullscreen" })).toBeInTheDocument();
  });

  it("closes fullscreen with close button", async () => {
    const user = userEvent.setup();
    const images = ["https://example.com/img1.jpg"];
    render(<ImageGallery images={images} title="Test Property" />);

    const mainImage = screen.getByRole("img", { name: "Test Property" });
    await user.click(mainImage);

    const closeBtn = screen.getByRole("button", { name: "Close gallery" });
    await user.click(closeBtn);

    expect(screen.queryByRole("dialog", { name: "Image gallery fullscreen" })).not.toBeInTheDocument();
  });
});