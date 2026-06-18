import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          href="/"
          className="text-2xl font-bold text-blue-600"
        >
          Rentfy
        </Link>

        <div className="flex gap-4">
          <Link
            href="/"
            className="hover:text-blue-600"
          >
            Home
          </Link>

          <Link
            href="/login"
            className="hover:text-blue-600"
          >
            Agency Login
          </Link>

          <Link
            href="/dashboard"
            className="hover:text-blue-600"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </nav>
  );
}