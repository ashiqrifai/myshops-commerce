import Link from "next/link";

export default function ForgotPasswordPlaceholderPage() {
  return (
    <main className="min-h-screen bg-storefront-background px-4 py-16">
      <div className="mx-auto max-w-lg rounded-[24px] border border-storefront bg-white p-8 text-center">
        <h1 className="text-3xl font-black text-storefront-text">
          Forgot password
        </h1>

        <p className="mt-3 text-sm leading-6 text-storefront-muted">
          Password reset will be connected in Customer Identity Phase 2.
        </p>

        <Link
          href="/account/login"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white"
        >
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
