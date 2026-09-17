import {
  Suspense,
} from "react";

import ResetPasswordForm from "@/components/account/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-storefront-background px-4 py-16">
      <div className="mx-auto max-w-lg rounded-[24px] border border-storefront bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-black text-storefront-text">
            Reset password
          </h1>

          <p className="mt-3 text-sm leading-6 text-storefront-muted">
            Choose a new password for your MyShops customer account.
          </p>
        </div>

        <div className="mt-8">
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm font-semibold text-storefront-muted">
                Loading password reset…
              </div>
            }
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
