import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold text-orange-600">
          404
        </p>

        <h1 className="mt-3 text-3xl font-bold text-zinc-950">
          Page not found
        </h1>

        <p className="mt-3 text-zinc-600">
          The requested storefront
          page is unavailable or has
          not been published.
        </p>

        <Link
          href="/"
          className="mt-7 inline-flex h-11 items-center justify-center rounded-lg bg-zinc-950 px-6 text-sm font-semibold text-white hover:bg-zinc-800"
        >
          Return home
        </Link>
      </div>
    </main>
  );
}