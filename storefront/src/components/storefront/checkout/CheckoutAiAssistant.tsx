"use client";

import {
  Bot,
  ChevronRight,
  CircleHelp,
  PackageSearch,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  WalletCards,
  X,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import type {
  CartItem,
} from "@/store/slices/cartSlice";

interface CheckoutAiAssistantProps {
  items:
    CartItem[];

  deliveryMethod:
    | "STANDARD"
    | "EXPRESS"
    | "PICKUP";

  paymentMethod:
    | "COD"
    | "CARD"
    | "TABBY"
    | "TAMARA";

  total: number;

  currencyCode: string;

  appliedCouponCode?:
    | string
    | null;
}

interface ChatMessage {
  id: string;
  role:
    | "assistant"
    | "user";
  text: string;
}

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
      maximumFractionDigits:
        2,
    }
  ).format(value);

export default function CheckoutAiAssistant({
  items,
  deliveryMethod,
  paymentMethod,
  total,
  currencyCode,
  appliedCouponCode,
}: CheckoutAiAssistantProps) {
  const [
    open,
    setOpen,
  ] =
    useState(false);

  const [
    input,
    setInput,
  ] =
    useState("");

  const [
    messages,
    setMessages,
  ] =
    useState<
      ChatMessage[]
    >([
      {
        id:
          "welcome",
        role:
          "assistant",
        text:
          "Hi! I can help with your cart, delivery, payment, warranty and checkout.",
      },
    ]);

  const productSummary =
    useMemo(
      () =>
        items
          .map(
            (item) =>
              `${item.productName} × ${item.quantity}`
          )
          .join(", "),
      [items]
    );

  const deliveryLabel =
    deliveryMethod ===
    "EXPRESS"
      ? "Express delivery"
      : deliveryMethod ===
          "PICKUP"
        ? "Store pickup"
        : "Standard delivery";

  const paymentLabel =
    paymentMethod ===
    "COD"
      ? "Cash on delivery"
      : paymentMethod ===
          "CARD"
        ? "Card"
        : paymentMethod;

  const answer = (
    question: string
  ) => {
    const value =
      question
        .trim()
        .toLowerCase();

    if (
      value.includes(
        "cart"
      ) ||
      value.includes(
        "order"
      ) ||
      value.includes(
        "product"
      )
    ) {
      return `Your cart contains ${productSummary || "no products"}. Your current total is ${money(
        total,
        currencyCode
      )}.`;
    }

    if (
      value.includes(
        "delivery"
      ) ||
      value.includes(
        "tomorrow"
      ) ||
      value.includes(
        "express"
      )
    ) {
      return `Your selected method is ${deliveryLabel}. Express delivery is available in the checkout options where supported.`;
    }

    if (
      value.includes(
        "payment"
      ) ||
      value.includes(
        "card"
      ) ||
      value.includes(
        "tabby"
      ) ||
      value.includes(
        "tamara"
      )
    ) {
      return `Your selected payment method is ${paymentLabel}. Cash on delivery is currently enabled; Card, Tabby and Tamara are shown as coming soon until their integrations are connected.`;
    }

    if (
      value.includes(
        "coupon"
      ) ||
      value.includes(
        "discount"
      )
    ) {
      return appliedCouponCode
        ? `Coupon ${appliedCouponCode} is currently applied to your checkout.`
        : "You can try MYSHOPS10, WELCOME50 or FREESHIP in the coupon section.";
    }

    if (
      value.includes(
        "warranty"
      ) ||
      value.includes(
        "genuine"
      )
    ) {
      return "Products in your cart are presented as genuine products. Warranty information should be confirmed from each product page and the final order record.";
    }

    if (
      value.includes(
        "accessor"
      ) ||
      value.includes(
        "recommend"
      )
    ) {
      const hasPhone =
        items.some(
          (item) =>
            item.productName
              .toLowerCase()
              .includes(
                "iphone"
              ) ||
            item.productName
              .toLowerCase()
              .includes(
                "phone"
              )
        );

      if (hasPhone) {
        return "For your phone, useful add-ons could include a fast charger, protective case, screen protector and wireless earbuds. Product recommendations will become dynamic when the AI product-search API is connected.";
      }

      return "I can recommend compatible accessories once the AI product-search API is connected to the live catalogue.";
    }

    if (
      value.includes(
        "vat"
      ) ||
      value.includes(
        "tax"
      )
    ) {
      return "VAT is shown in your order summary. The backend order API will recalculate and validate tax before the order is created.";
    }

    return "I can help with your cart, total, delivery, payment methods, coupon, VAT, warranty or accessory suggestions.";
  };

  const sendMessage = (
    text = input
  ) => {
    const trimmed =
      text.trim();

    if (!trimmed) {
      return;
    }

    const userMessage:
      ChatMessage = {
      id:
        `user-${Date.now()}`,
      role:
        "user",
      text:
        trimmed,
    };

    const assistantMessage:
      ChatMessage = {
      id:
        `assistant-${Date.now()}`,
      role:
        "assistant",
      text:
        answer(
          trimmed
        ),
    };

    setMessages(
      (current) => [
        ...current,
        userMessage,
        assistantMessage,
      ]
    );

    setInput("");
  };

  const suggestions = [
    {
      label:
        "What’s in my cart?",
      icon:
        PackageSearch,
    },
    {
      label:
        "Can I get express delivery?",
      icon: Truck,
    },
    {
      label:
        "Which payments are available?",
      icon:
        WalletCards,
    },
    {
      label:
        "Suggest accessories",
      icon:
        Sparkles,
    },
    {
      label:
        "What about warranty?",
      icon:
        ShieldCheck,
    },
    {
      label:
        "Do I have a coupon?",
      icon:
        CircleHelp,
    },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        className="fixed bottom-5 right-5 z-[70] flex h-14 items-center gap-3 rounded-full bg-storefront-primary px-5 text-sm font-black text-white shadow-xl transition hover:-translate-y-0.5"
      >
        <Bot
          size={21}
        />

        <span className="hidden sm:inline">
          Ask MyShops AI
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            aria-label="Close assistant"
            onClick={() =>
              setOpen(false)
            }
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
          />

          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[430px] flex-col bg-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-storefront p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-storefront-secondary text-storefront-primary">
                  <Bot
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="text-base font-black text-storefront-text">
                    MyShops AI
                  </h2>

                  <p className="text-xs text-storefront-muted">
                    Checkout assistant
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-storefront-secondary"
              >
                <X
                  size={20}
                />
              </button>
            </header>

            <div className="border-b border-storefront p-4">
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map(
                  (
                    suggestion
                  ) => (
                    <button
                      key={
                        suggestion.label
                      }
                      type="button"
                      onClick={() =>
                        sendMessage(
                          suggestion.label
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border border-storefront bg-white p-3 text-left text-[11px] font-bold text-storefront-text transition hover:border-storefront-primary hover:bg-storefront-secondary"
                    >
                      <suggestion.icon
                        size={15}
                        className="shrink-0 text-storefront-primary"
                      />

                      <span className="min-w-0 flex-1">
                        {
                          suggestion.label
                        }
                      </span>

                      <ChevronRight
                        size={13}
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 p-4">
              {messages.map(
                (message) => (
                  <div
                    key={
                      message.id
                    }
                    className={[
                      "flex",
                      message.role ===
                      "user"
                        ? "justify-end"
                        : "justify-start",
                    ].join(
                      " "
                    )}
                  >
                    <div
                      className={[
                        "max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-6",
                        message.role ===
                        "user"
                          ? "rounded-br-md bg-storefront-primary text-white"
                          : "rounded-bl-md border border-storefront bg-white text-storefront-text",
                      ].join(
                        " "
                      )}
                    >
                      {
                        message.text
                      }
                    </div>
                  </div>
                )
              )}
            </div>

            <div className="border-t border-storefront p-4">
              <div className="flex gap-2">
                <input
                  value={
                    input
                  }
                  onChange={(
                    event
                  ) =>
                    setInput(
                      event.target.value
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault();

                      sendMessage();
                    }
                  }}
                  placeholder="Ask about your checkout"
                  className="h-12 min-w-0 flex-1 rounded-xl border border-storefront bg-white px-4 text-sm text-storefront-text outline-none focus:border-storefront-primary"
                />

                <button
                  type="button"
                  onClick={() =>
                    sendMessage()
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-storefront-primary text-white"
                >
                  <Send
                    size={18}
                  />
                </button>
              </div>

              <p className="mt-2 text-center text-[10px] text-storefront-muted">
                Demo assistant using live cart context. Backend AI integration comes next.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
