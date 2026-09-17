import ForgotPasswordForm from "@/components/account/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-storefront-background px-4 py-16">
      <div className="mx-auto max-w-lg rounded-[24px] border border-storefront bg-white p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-black text-storefront-text">
            Forgot password
          </h1>

          <p className="mt-3 text-sm leading-6 text-storefront-muted">
            Enter the email address linked to your MyShops account. If the account exists, we will send you a secure reset link.
          </p>
        </div>

        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
