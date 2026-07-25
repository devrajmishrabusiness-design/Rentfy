/**
 * Authentication Flow Tests - v2.0 (Separate Auth Architecture)
 *
 * Tests for role-specific auth pages.
 */

/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resend: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
      exchangeCodeForSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(),
      single: vi.fn(),
    })),
  },
}));

vi.mock("@/lib/supabase-browser", () => ({
  supabase: mockSupabase,
}));

vi.mock("@/app/ErrorMessage", () => ({
  default: ({ message }: { message: string | null }) => {
    if (!message) return null;
    return (
      <div className="mt-4 rounded-2xl border border-[var(--brand-error)] bg-red-50 px-4 py-3 text-sm font-medium text-[var(--brand-error)]" role="alert">
        {message}
      </div>
    );
  },
}));

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
    refresh: mockRefresh,
    back: vi.fn(),
  })),
  useSearchParams: vi.fn(() => new URLSearchParams("code=valid&type=signup")),
}));

const ToastProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const ConfirmProvider = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ToastProvider>
      <ConfirmProvider>
        {ui}
      </ConfirmProvider>
    </ToastProvider>
  );
}

import AgencyLoginPage from "@/app/login/agency/page";
import AgencySignupPage from "@/app/signup/agency/page";
import RenterLoginPage from "@/app/login/renter/page";
import RenterSignupPage from "@/app/signup/renter/page";
import ForgotPasswordPage from "@/app/auth/forgot-password/page";
import ResetPasswordPage from "@/app/auth/reset-password/page";
import VerifyEmailPage from "@/app/auth/verify-email/page";

describe("Agency Login - /login/agency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it("shows agency login form", () => {
    renderWithProviders(<AgencyLoginPage />);
    expect(screen.getByText(/agency sign in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("shows error for invalid credentials", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    renderWithProviders(<AgencyLoginPage />);
    await user.type(screen.getByLabelText(/^email$/i), "wrong@email.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });

  it("shows unverified email state when email not confirmed", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { email: "test@test.com", email_confirmed_at: null } },
      error: null,
    });

    renderWithProviders(<AgencyLoginPage />);
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/verify your email first/i)).toBeInTheDocument();
    });
  });

  it("shows wrong-portal message when renter profile exists", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "renter_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "renter-1" } }),
        };
      }
      if (table === "agency_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return mockSupabase.from(table);
    });

    renderWithProviders(<AgencyLoginPage />);
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/wrong portal/i)).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes("This account belongs to a") && content.includes("Renter"), { exact: false })).toBeInTheDocument();
    });
  });

  it("links to agency signup", () => {
    renderWithProviders(<AgencyLoginPage />);
    const signupLink = screen.getByRole("link", { name: /create an account/i });
    expect(signupLink).toHaveAttribute("href", "/signup/agency");
  });

  it("shows forgot password link", () => {
    renderWithProviders(<AgencyLoginPage />);
    expect(screen.getByRole("link", { name: /forgot password/i })).toHaveAttribute("href", "/forgot-password");
  });
});

describe("Agency Signup - /signup/agency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("shows agency signup form with required fields", () => {
    renderWithProviders(<AgencySignupPage />);
    expect(screen.getByText(/agency sign up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/agency name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/owner name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows verify email screen after successful signup", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-1", email: "agency@test.com", email_confirmed_at: null } },
      error: null,
    });

    renderWithProviders(<AgencySignupPage />);
    await user.type(screen.getByLabelText(/agency name/i), "Test Agency");
    await user.type(screen.getByLabelText(/owner name/i), "John Doe");
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/city/i), "Noida");
    await user.type(screen.getByLabelText(/^email$/i), "agency@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
      expect(screen.getByText(/agency@test.com/i)).toBeInTheDocument();
    });
  });

  it("shows duplicate email error when signup fails with already registered", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "User already registered" },
    });

    renderWithProviders(<AgencySignupPage />);
    await user.type(screen.getByLabelText(/agency name/i), "Test Agency");
    await user.type(screen.getByLabelText(/owner name/i), "John Doe");
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/city/i), "Noida");
    await user.type(screen.getByLabelText(/^email$/i), "existing@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
    });
  });

  it("validates password match", async () => {
    const user = userEvent.setup();
    renderWithProviders(<AgencySignupPage />);
    await user.type(screen.getByLabelText(/agency name/i), "Test Agency");
    await user.type(screen.getByLabelText(/owner name/i), "John Doe");
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/city/i), "Noida");
    await user.type(screen.getByLabelText(/^email$/i), "agency@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "different");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("links to agency login", () => {
    renderWithProviders(<AgencySignupPage />);
    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login/agency");
  });
});

describe("Renter Login - /login/renter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
  });

  it("shows renter login form", () => {
    renderWithProviders(<RenterLoginPage />);
    expect(screen.getByText(/renter sign in/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it("shows error for invalid credentials", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    renderWithProviders(<RenterLoginPage />);
    await user.type(screen.getByLabelText(/^email$/i), "wrong@email.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrongpassword");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument();
    });
  });

  it("shows wrong-portal message when agency profile exists", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: "user-1", email: "test@test.com", email_confirmed_at: "2024-01-01" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "agency_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: "agency-1" } }),
        };
      }
      if (table === "renter_profiles") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        };
      }
      return mockSupabase.from(table);
    });

    renderWithProviders(<RenterLoginPage />);
    await user.type(screen.getByLabelText(/^email$/i), "test@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/wrong portal/i)).toBeInTheDocument();
      expect(screen.getByText((content, element) => content.includes("This account belongs to an") && content.includes("Agency"), { exact: false })).toBeInTheDocument();
    });
  });

  it("links to renter signup", () => {
    renderWithProviders(<RenterLoginPage />);
    const signupLink = screen.getByRole("link", { name: /create an account/i });
    expect(signupLink).toHaveAttribute("href", "/signup/renter");
  });
});

describe("Renter Signup - /signup/renter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("shows renter signup form with full name field", () => {
    renderWithProviders(<RenterSignupPage />);
    expect(screen.getByText(/renter sign up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contact number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it("shows verify email screen after successful signup", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: "user-1", email: "renter@test.com", email_confirmed_at: null } },
      error: null,
    });

    renderWithProviders(<RenterSignupPage />);
    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/^email$/i), "renter@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });

  it("shows duplicate email error when signup fails with already registered", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: "duplicate key value violates unique constraint" },
    });

    renderWithProviders(<RenterSignupPage />);
    await user.type(screen.getByLabelText(/full name/i), "John Doe");
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/^email$/i), "existing@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/an account with this email already exists/i)).toBeInTheDocument();
    });
  });

  it("validates full name required", async () => {
    const user = userEvent.setup();
    renderWithProviders(<RenterSignupPage />);
    await user.type(screen.getByLabelText(/full name/i), "J");
    await user.type(screen.getByLabelText(/contact number/i), "9876543210");
    await user.type(screen.getByLabelText(/^email$/i), "renter@test.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
    });
  });

  it("links to renter login", () => {
    renderWithProviders(<RenterSignupPage />);
    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toHaveAttribute("href", "/login/renter");
  });
});

describe("Forgot Password - /forgot-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
  });

  it("shows email input and submit button", () => {
    renderWithProviders(<ForgotPasswordPage />);
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send reset link/i })).toBeInTheDocument();
  });

  it("calls resetPasswordForEmail on submit", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email address/i), "test@test.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@test.com", {
        redirectTo: expect.stringContaining("/reset-password"),
      });
    });
  });

  it("shows success state after sending reset email", async () => {
    const user = userEvent.setup();
    mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null });

    renderWithProviders(<ForgotPasswordPage />);
    await user.type(screen.getByLabelText(/email address/i), "test@test.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    await waitFor(() => {
      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
    });
  });
});

describe("Reset Password - /reset-password", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
  });

  it("verifies code on mount", async () => {
    renderWithProviders(<ResetPasswordPage />);

    await waitFor(() => {
      expect(screen.getByText(/set a new password/i)).toBeInTheDocument();
    });
  });
});

describe("Verify Email - /verify-email", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPush.mockClear();
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { email: "test@test.com" } } });
  });

  it("shows verification failed for invalid code", async () => {
    mockSupabase.auth.exchangeCodeForSession.mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid code" },
    });

    renderWithProviders(<VerifyEmailPage />);

    await waitFor(() => {
      expect(screen.getByText(/verification failed/i)).toBeInTheDocument();
    });
  });
});