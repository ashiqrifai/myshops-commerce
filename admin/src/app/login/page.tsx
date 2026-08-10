"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  Eye,
  EyeOff,
  LockKeyhole,
  Store,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { useLoginMutation } from "@/store/api/authApi";

import {
  setCredentials,
} from "@/store/slices/authSlice";

import {
  useAppDispatch,
  useAppSelector,
} from "@/store/hooks";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    accessToken,
    initialized,
  } = useAppSelector(
    (state) => state.auth
  );

  const [login, { isLoading }] =
    useLoginMutation();

  const [companyCode, setCompanyCode] =
    useState("MYSHOPS");

  const [loginValue, setLoginValue] =
    useState("admin@myshops.ae");

  const [password, setPassword] =
    useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  useEffect(() => {
    if (
      initialized &&
      accessToken
    ) {
      router.replace("/settings");
    }
  }, [
    accessToken,
    initialized,
    router,
  ]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      const result = await login({
        companyCode,
        login: loginValue,
        password,
      }).unwrap();

      localStorage.setItem(
        "myshops.admin.accessToken",
        result.data.accessToken
      );

      localStorage.setItem(
        "myshops.admin.user",
        JSON.stringify(result.data.user)
      );

      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken:
            result.data.accessToken,
        })
      );

      toast.success(
        "Welcome to MyShops Admin."
      );

      router.replace("/settings");
    } catch (error: unknown) {
      const apiError = error as {
        data?: {
          error?: {
            message?: string;
          };
        };
      };

      toast.error(
        apiError.data?.error?.message ||
          "Unable to sign in."
      );
    }
  };

  return (
    <main className="flex min-h-screen bg-[#f6f6f7]">
      <section className="flex w-full items-center justify-center px-5 py-10 lg:w-[46%]">
        <div className="w-full max-w-[430px]">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1a1a1a] text-white">
              <Store size={23} />
            </div>

            <div>
              <h1 className="text-xl font-semibold tracking-tight">
                MyShops
              </h1>

              <p className="text-sm text-[#6d7175]">
                Commerce Administration
              </p>
            </div>
          </div>

          <div className="admin-card p-7">
            <div className="mb-7">
              <h2 className="text-2xl font-semibold tracking-tight">
                Log in
              </h2>

              <p className="mt-2 text-sm text-[#6d7175]">
                Access the MyShops commerce
                management platform.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="companyCode"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Company code
                </label>

                <input
                  id="companyCode"
                  value={companyCode}
                  onChange={(event) =>
                    setCompanyCode(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  autoComplete="organization"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="login"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Email or username
                </label>

                <input
                  id="login"
                  type="text"
                  value={loginValue}
                  onChange={(event) =>
                    setLoginValue(
                      event.target.value
                    )
                  }
                  className="admin-input"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </label>
                </div>

                <div className="relative">
                  <LockKeyhole
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value
                      )
                    }
                    className="admin-input pl-10 pr-11"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (current) => !current
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6d7175]"
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="h-11 w-full rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading
                  ? "Logging in..."
                  : "Log in"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="relative hidden flex-1 overflow-hidden bg-[#1a1a1a] lg:flex lg:items-center lg:justify-center">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#77dd99] blur-3xl" />

          <div className="absolute -bottom-20 left-10 h-80 w-80 rounded-full bg-[#4b8cff] blur-3xl" />
        </div>

        <div className="relative max-w-xl px-12 text-white">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.22em] text-white/60">
            MyShops Commerce Platform
          </p>

          <h2 className="text-5xl font-semibold leading-tight tracking-tight">
            Manage your website and kiosk
            from one place.
          </h2>

          <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">
            Control content, products, themes,
            promotions, and customer experiences
            without changing code.
          </p>
        </div>
      </section>
    </main>
  );
}