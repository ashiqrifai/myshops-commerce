"use client";

import {
  CreditCard,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCartHydrated,
  selectCartItems,
  selectCartSubtotal,
  selectCartTax,
  selectCartTotal,
} from "@/store/slices/cartSlice";

import CouponSection from "./CouponSection";
import CheckoutAiAssistant from "./CheckoutAiAssistant";

import type {
  AppliedCoupon,
} from "./CouponSection";

type DeliveryMethod =
  | "STANDARD"
  | "EXPRESS"
  | "PICKUP";

type PaymentMethod =
  | "COD"
  | "CARD"
  | "TABBY"
  | "TAMARA";

interface CheckoutForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  addressLine1: string;
  addressLine2: string;
  emirate: string;
  city: string;
  area: string;
  landmark: string;

  deliveryMethod:
    DeliveryMethod;

  paymentMethod:
    PaymentMethod;

  notes: string;
}

const initialForm:
  CheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",

  addressLine1: "",
  addressLine2: "",
  emirate: "Dubai",
  city: "",
  area: "",
  landmark: "",

  deliveryMethod:
    "STANDARD",

  paymentMethod:
    "COD",

  notes: "",
};

const deliveryOptions = [
  {
    code:
      "STANDARD" as const,
    title:
      "Standard delivery",
    description:
      "Delivery within 2–4 business days",
    amount: 0,
    icon: Truck,
  },
  {
    code:
      "EXPRESS" as const,
    title:
      "Express delivery",
    description:
      "Priority delivery where available",
    amount: 25,
    icon:
      PackageCheck,
  },
  {
    code:
      "PICKUP" as const,
    title:
      "Store pickup",
    description:
      "Collect from an available MyShops location",
    amount: 0,
    icon: MapPin,
  },
];

const paymentOptions = [
  {
    code: "COD" as const,
    title:
      "Cash on delivery",
    description:
      "Pay when your order arrives",
    enabled: true,
  },
  {
    code:
      "CARD" as const,
    title:
      "Credit or debit card",
    description:
      "Secure online card payment",
    enabled: false,
  },
  {
    code:
      "TABBY" as const,
    title: "Tabby",
    description:
      "Split your payment",
    enabled: false,
  },
  {
    code:
      "TAMARA" as const,
    title: "Tamara",
    description:
      "Flexible payment options",
    enabled: false,
  },
];

const money = (
  value: number,
  currencyCode: string
) =>
  new Intl.NumberFormat(
    "en-AE",
    {
      style:
        "currency",
      currency:
        currencyCode ||
        "AED",
      minimumFractionDigits:
        2,
      maximumFractionDigits:
        2,
    }
  ).format(value);

export default function CheckoutPageClient() {
  const router =
    useRouter();

  const hydrated =
    useAppSelector(
      selectCartHydrated
    );

  const items =
    useAppSelector(
      selectCartItems
    );

  const subtotal =
    useAppSelector(
      selectCartSubtotal
    );

  const tax =
    useAppSelector(
      selectCartTax
    );

  const cartTotal =
    useAppSelector(
      selectCartTotal
    );

  const [
    form,
    setForm,
  ] =
    useState<CheckoutForm>(
      initialForm
    );

  const [
    errors,
    setErrors,
  ] =
    useState<
      Record<string, string>
    >({});

  const [
    submitMessage,
    setSubmitMessage,
  ] =
    useState<string | null>(
      null
    );

  const [
    appliedCoupon,
    setAppliedCoupon,
  ] =
    useState<
      AppliedCoupon | null
    >(null);

  const currencyCode =
    items[0]
      ?.currencyCode ||
    "AED";

  const baseDeliveryAmount =
    useMemo(
      () =>
        deliveryOptions.find(
          (option) =>
            option.code ===
            form.deliveryMethod
        )?.amount || 0,
      [
        form.deliveryMethod,
      ]
    );

  const discountAmount =
    useMemo(() => {
      if (
        !appliedCoupon
      ) {
        return 0;
      }

      if (
        appliedCoupon.type ===
        "PERCENTAGE"
      ) {
        return Math.min(
          subtotal,
          subtotal *
            (appliedCoupon.value /
              100)
        );
      }

      if (
        appliedCoupon.type ===
        "FIXED"
      ) {
        return Math.min(
          subtotal,
          appliedCoupon.value
        );
      }

      return 0;
    }, [
      appliedCoupon,
      subtotal,
    ]);

  const deliveryAmount =
    appliedCoupon?.type ===
    "FREE_SHIPPING"
      ? 0
      : baseDeliveryAmount;

  const grandTotal =
    Math.max(
      0,
      cartTotal +
        deliveryAmount -
        discountAmount
    );

  const update = <
    K extends keyof CheckoutForm,
  >(
    key: K,
    value: CheckoutForm[K]
  ) => {
    setForm(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    setErrors(
      (current) => ({
        ...current,
        [key]: "",
      })
    );
  };

  const validate = () => {
    const nextErrors:
      Record<string, string> =
      {};

    if (
      !form.firstName.trim()
    ) {
      nextErrors.firstName =
        "First name is required.";
    }

    if (
      !form.lastName.trim()
    ) {
      nextErrors.lastName =
        "Last name is required.";
    }

    if (
      !form.email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email
      )
    ) {
      nextErrors.email =
        "Enter a valid email address.";
    }

    if (
      !form.phone.trim() ||
      form.phone.replace(
        /\D/g,
        ""
      ).length < 9
    ) {
      nextErrors.phone =
        "Enter a valid mobile number.";
    }

    if (
      form.deliveryMethod !==
        "PICKUP" &&
      !form.addressLine1.trim()
    ) {
      nextErrors.addressLine1 =
        "Delivery address is required.";
    }

    if (
      form.deliveryMethod !==
        "PICKUP" &&
      !form.city.trim()
    ) {
      nextErrors.city =
        "City is required.";
    }

    if (
      form.deliveryMethod !==
        "PICKUP" &&
      !form.area.trim()
    ) {
      nextErrors.area =
        "Area is required.";
    }

    setErrors(
      nextErrors
    );

    return (
      Object.keys(
        nextErrors
      ).length === 0
    );
  };

  const submitOrder = () => {
    setSubmitMessage(
      null
    );

    if (!validate()) {
      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      });

      return;
    }

    setSubmitMessage(
      "Checkout details are valid. The public order API must now be connected before live order placement."
    );
  };

  if (!hydrated) {
    return (
      <div className="py-24 text-center text-sm text-storefront-muted">
        Loading checkout…
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-20">
        <div className="mx-auto max-w-xl rounded-[22px] border border-storefront bg-storefront-surface p-8 text-center">
          <h1 className="text-2xl font-black text-storefront-text">
            Your cart is empty
          </h1>

          <p className="mt-3 text-sm text-storefront-muted">
            Add products before proceeding to checkout.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-6 h-11 rounded-storefront-button bg-storefront-primary px-6 text-sm font-black text-white"
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-storefront-primary">
            Secure checkout
          </p>

          <h1 className="mt-2 text-3xl font-black text-storefront-text sm:text-4xl">
            Complete your order
          </h1>

          <p className="mt-2 text-sm text-storefront-muted">
            Enter your delivery and payment details.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="space-y-6">
            <CheckoutSection
              icon={
                ShieldCheck
              }
              title="Contact information"
              subtitle="Used for order confirmation and delivery updates."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="First name"
                  value={
                    form.firstName
                  }
                  error={
                    errors.firstName
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "firstName",
                      value
                    )
                  }
                />

                <Field
                  label="Last name"
                  value={
                    form.lastName
                  }
                  error={
                    errors.lastName
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "lastName",
                      value
                    )
                  }
                />

                <Field
                  label="Email"
                  type="email"
                  value={
                    form.email
                  }
                  error={
                    errors.email
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "email",
                      value
                    )
                  }
                />

                <Field
                  label="Mobile number"
                  type="tel"
                  placeholder="+971"
                  value={
                    form.phone
                  }
                  error={
                    errors.phone
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "phone",
                      value
                    )
                  }
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={MapPin}
              title="Delivery address"
              subtitle="UAE delivery information."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Address line 1"
                    value={
                      form.addressLine1
                    }
                    error={
                      errors.addressLine1
                    }
                    onChange={(
                      value
                    ) =>
                      update(
                        "addressLine1",
                        value
                      )
                    }
                  />
                </div>

                <div className="sm:col-span-2">
                  <Field
                    label="Address line 2"
                    value={
                      form.addressLine2
                    }
                    onChange={(
                      value
                    ) =>
                      update(
                        "addressLine2",
                        value
                      )
                    }
                  />
                </div>

                <SelectField
                  label="Emirate"
                  value={
                    form.emirate
                  }
                  options={[
                    "Abu Dhabi",
                    "Dubai",
                    "Sharjah",
                    "Ajman",
                    "Umm Al Quwain",
                    "Ras Al Khaimah",
                    "Fujairah",
                  ]}
                  onChange={(
                    value
                  ) =>
                    update(
                      "emirate",
                      value
                    )
                  }
                />

                <Field
                  label="City"
                  value={
                    form.city
                  }
                  error={
                    errors.city
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "city",
                      value
                    )
                  }
                />

                <Field
                  label="Area"
                  value={
                    form.area
                  }
                  error={
                    errors.area
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "area",
                      value
                    )
                  }
                />

                <Field
                  label="Landmark"
                  value={
                    form.landmark
                  }
                  onChange={(
                    value
                  ) =>
                    update(
                      "landmark",
                      value
                    )
                  }
                />
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={Truck}
              title="Delivery method"
            >
              <div className="space-y-3">
                {deliveryOptions.map(
                  (option) => (
                    <button
                      key={
                        option.code
                      }
                      type="button"
                      onClick={() =>
                        update(
                          "deliveryMethod",
                          option.code
                        )
                      }
                      className={[
                        "flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition",
                        form.deliveryMethod ===
                        option.code
                          ? "border-storefront-primary bg-storefront-secondary"
                          : "border-storefront bg-white hover:border-storefront-primary/50",
                      ].join(
                        " "
                      )}
                    >
                      <option.icon
                        size={21}
                        className="text-storefront-primary"
                      />

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-storefront-text">
                          {
                            option.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-storefront-muted">
                          {
                            option.description
                          }
                        </p>
                      </div>

                      <span className="text-sm font-black text-storefront-text">
                        {option.amount ===
                        0
                          ? "Free"
                          : money(
                              option.amount,
                              currencyCode
                            )}
                      </span>
                    </button>
                  )
                )}
              </div>
            </CheckoutSection>

            <CheckoutSection
              icon={
                CreditCard
              }
              title="Payment method"
            >
              <div className="space-y-3">
                {paymentOptions.map(
                  (option) => (
                    <button
                      key={
                        option.code
                      }
                      type="button"
                      disabled={
                        !option.enabled
                      }
                      onClick={() =>
                        update(
                          "paymentMethod",
                          option.code
                        )
                      }
                      className={[
                        "flex w-full items-center justify-between rounded-2xl border p-4 text-left transition",
                        !option.enabled
                          ? "cursor-not-allowed border-storefront bg-slate-50 opacity-60"
                          : form.paymentMethod ===
                              option.code
                            ? "border-storefront-primary bg-storefront-secondary"
                            : "border-storefront bg-white hover:border-storefront-primary/50",
                      ].join(
                        " "
                      )}
                    >
                      <div>
                        <p className="text-sm font-black text-storefront-text">
                          {
                            option.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-storefront-muted">
                          {
                            option.description
                          }
                        </p>
                      </div>

                      {!option.enabled ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600">
                          Coming soon
                        </span>
                      ) : null}
                    </button>
                  )
                )}
              </div>
            </CheckoutSection>

            <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-7">
              <label className="text-sm font-black text-storefront-text">
                Order notes
              </label>

              <textarea
                value={
                  form.notes
                }
                onChange={(
                  event
                ) =>
                  update(
                    "notes",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Optional delivery instructions"
                className="mt-3 w-full rounded-xl border border-storefront bg-white px-4 py-3 text-sm text-storefront-text outline-none focus:border-storefront-primary"
              />
            </section>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[22px] border border-storefront bg-storefront-surface p-5 shadow-sm sm:p-6">
              <h2 className="text-xl font-black text-storefront-text">
                Order summary
              </h2>

              <div className="mt-5 max-h-[360px] space-y-4 overflow-auto pr-1">
                {items.map(
                  (item) => (
                    <div
                      key={
                        item.key
                      }
                      className="flex gap-3"
                    >
                      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-storefront bg-white">
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={
                              item.imageUrl
                            }
                            alt={
                              item.productName
                            }
                            className="h-full w-full object-contain p-2"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black text-storefront-text">
                          {
                            item.productName
                          }
                        </p>

                        <p className="mt-1 text-xs text-storefront-muted">
                          Qty:{" "}
                          {
                            item.quantity
                          }
                        </p>
                      </div>

                      <span className="text-sm font-black text-storefront-text">
                        {money(
                          item.unitPrice *
                            item.quantity,
                          item.currencyCode
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="my-5 border-t border-storefront" />

              <CouponSection
                appliedCoupon={
                  appliedCoupon
                }
                onApply={
                  setAppliedCoupon
                }
              />

              <div className="my-5 border-t border-storefront" />

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-storefront-muted">
                    Subtotal
                  </dt>

                  <dd className="font-bold text-storefront-text">
                    {money(
                      subtotal,
                      currencyCode
                    )}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-storefront-muted">
                    VAT
                  </dt>

                  <dd className="font-bold text-storefront-text">
                    {tax > 0
                      ? money(
                          tax,
                          currencyCode
                        )
                      : "Included"}
                  </dd>
                </div>

                <div className="flex justify-between gap-4">
                  <dt className="text-storefront-muted">
                    Delivery
                  </dt>

                  <dd className="font-bold text-storefront-text">
                    {deliveryAmount ===
                    0
                      ? "Free"
                      : money(
                          deliveryAmount,
                          currencyCode
                        )}
                  </dd>
                </div>

                {discountAmount >
                0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-emerald-700">
                      Discount
                    </dt>

                    <dd className="font-black text-emerald-700">
                      -
                      {money(
                        discountAmount,
                        currencyCode
                      )}
                    </dd>
                  </div>
                ) : null}
              </dl>

              <div className="my-5 border-t border-storefront" />

              <div className="flex items-end justify-between gap-4">
                <span className="text-sm font-black text-storefront-text">
                  Total
                </span>

                <span className="text-2xl font-black text-storefront-text">
                  {money(
                    grandTotal,
                    currencyCode
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={
                  submitOrder
                }
                className="mt-6 h-12 w-full rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white transition hover:opacity-90"
              >
                Place order
              </button>

              {submitMessage ? (
                <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800">
                  {
                    submitMessage
                  }
                </p>
              ) : null}

              <p className="mt-4 text-center text-[11px] leading-5 text-storefront-muted">
                Final prices, coupons and availability will be validated securely by the backend before order creation.
              </p>
            </div>
          </aside>
        </div>
      </div>

      <CheckoutAiAssistant
        items={items}
        deliveryMethod={
          form.deliveryMethod
        }
        paymentMethod={
          form.paymentMethod
        }
        total={
          grandTotal
        }
        currencyCode={
          currencyCode
        }
        appliedCouponCode={
          appliedCoupon?.code ||
          null
        }
      />
    </>
  );
}

function CheckoutSection({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon:
    typeof ShieldCheck;
  title: string;
  subtitle?: string;
  children:
    React.ReactNode;
}) {
  return (
    <section className="rounded-[22px] border border-storefront bg-storefront-surface p-5 sm:p-7">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
          <Icon
            size={20}
          />
        </div>

        <div>
          <h2 className="text-lg font-black text-storefront-text">
            {title}
          </h2>

          {subtitle ? (
            <p className="text-xs text-storefront-muted">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-storefront-text">
        {label}
      </span>

      <input
        type={type}
        value={value}
        placeholder={
          placeholder
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className={[
          "h-11 w-full rounded-xl border bg-white px-3 text-sm text-storefront-text outline-none",
          error
            ? "border-red-500"
            : "border-storefront focus:border-storefront-primary",
        ].join(" ")}
      />

      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-storefront-text">
        {label}
      </span>

      <select
        value={value}
        onChange={(
          event
        ) =>
          onChange(
            event.target.value
          )
        }
        className="h-11 w-full rounded-xl border border-storefront bg-white px-3 text-sm text-storefront-text outline-none focus:border-storefront-primary"
      >
        {options.map(
          (option) => (
            <option
              key={
                option
              }
              value={
                option
              }
            >
              {option}
            </option>
          )
        )}
      </select>
    </label>
  );
}
