"use client";

import Link from "next/link";

import {
  Bot,
  ChevronRight,
  ImageIcon,
  LoaderCircle,
  Search,
  Send,
  ShoppingBag,
  Sparkles,
  X,
} from "lucide-react";

import {
  usePathname,
} from "next/navigation";

import {
  useMemo,
  useState,
} from "react";

import {
  useAppSelector,
} from "@/store/hooks";

import {
  selectCartItems,
  selectCartTotal,
} from "@/store/slices/cartSlice";

import {
  askStorefrontAi,
} from "@/lib/storefront/storefront-ai-api";

import type {
  StorefrontAiConversationMessage,
  StorefrontAiProduct,
} from "@/lib/storefront/storefront-ai-api";

import type {
  StorefrontData,
} from "@/types/storefront";

interface UiMessage {
  id: string;

  role:
    | "assistant"
    | "user";

  text: string;

  products?:
    StorefrontAiProduct[];
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

const getPageContext = (
  pathname: string
) => {
  const segments =
    pathname
      .split("/")
      .filter(Boolean);

  if (
    segments[0] ===
      "products" &&
    segments[1]
  ) {
    return {
      pageType:
        "PRODUCT",
      productSlug:
        segments[1],
      pathname,
    };
  }

  if (
    segments[0] ===
      "category" &&
    segments[1]
  ) {
    return {
      pageType:
        "CATEGORY",
      categorySlug:
        segments[1],
      pathname,
    };
  }

  if (
    segments[0] ===
      "brand" &&
    segments[1]
  ) {
    return {
      pageType:
        "BRAND",
      brandSlug:
        segments[1],
      pathname,
    };
  }

  if (
    segments[0] ===
    "cart"
  ) {
    return {
      pageType:
        "CART",
      pathname,
    };
  }

  if (
    segments[0] ===
    "checkout"
  ) {
    return {
      pageType:
        "CHECKOUT",
      pathname,
    };
  }

  return {
    pageType:
      pathname === "/"
        ? "HOME"
        : "OTHER",
    pathname,
  };
};

export default function StorefrontAiAssistant({
  storefront,
}: {
  storefront:
    StorefrontData;
}) {
  const pathname =
    usePathname();

  const items =
    useAppSelector(
      selectCartItems
    );

  const cartTotal =
    useAppSelector(
      selectCartTotal
    );

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
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  const [
    messages,
    setMessages,
  ] =
    useState<
      UiMessage[]
    >([
      {
        id:
          "welcome",
        role:
          "assistant",
        text:
          "Hi! Tell me what you’re shopping for, your budget, preferred brand, colour or features.",
      },
    ]);

  const pageContext =
    useMemo(
      () =>
        getPageContext(
          pathname
        ),
      [pathname]
    );

  const currencyCode =
    items[0]
      ?.currencyCode ||
    storefront.company
      .currency ||
    "AED";

  const suggestions =
    useMemo(() => {
      if (
        pageContext.pageType ===
        "PRODUCT"
      ) {
        return [
          "Suggest compatible accessories",
          "Is there a cheaper alternative?",
          "Compare similar products",
          "What should I check before buying?",
        ];
      }

      if (
        pageContext.pageType ===
        "CATEGORY"
      ) {
        return [
          "Show the best value options",
          "Find products under AED 2,500",
          "Which brands should I consider?",
          "Help me choose",
        ];
      }

      if (
        pageContext.pageType ===
          "CART" ||
        pageContext.pageType ===
          "CHECKOUT"
      ) {
        return [
          "What’s in my cart?",
          "Suggest useful accessories",
          "Explain delivery options",
          "Which payments are available?",
        ];
      }

      return [
        "Find a phone under AED 3,000",
        "Show gaming laptops",
        "Recommend wireless earbuds",
        "Help me choose a TV",
      ];
    }, [
      pageContext.pageType,
    ]);

  const sendMessage =
    async (
      value = input
    ) => {
      const message =
        value.trim();

      if (
        !message ||
        loading
      ) {
        return;
      }

      const userEntry:
        UiMessage = {
        id:
          `user-${Date.now()}`,
        role: "user",
        text: message,
      };

      const previousConversation:
        StorefrontAiConversationMessage[] =
        messages
          .filter(
            (entry) =>
              entry.id !==
              "welcome"
          )
          .slice(-8)
          .map((entry) => ({
            role:
              entry.role,
            text:
              entry.text,
          }));

      setMessages(
        (current) => [
          ...current,
          userEntry,
        ]
      );

      setInput("");
      setError(null);
      setLoading(true);

      try {
        const result =
          await askStorefrontAi({
            message,

            conversation:
              previousConversation,

            pageContext,

            cartContext: {
              items,
              total:
                cartTotal,
              currencyCode,
            },

            channel:
              "WEBSITE",
          });

        setMessages(
          (current) => [
            ...current,
            {
              id:
                `assistant-${Date.now()}`,
              role:
                "assistant",
              text:
                result.message,
              products:
                result.products,
            },
          ]
        );
      } catch (
        caughtError
      ) {
        setError(
          caughtError instanceof
          Error
            ? caughtError.message
            : "The assistant is temporarily unavailable."
        );
      } finally {
        setLoading(false);
      }
    };

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

          <aside className="absolute bottom-0 right-0 top-0 flex w-full max-w-[470px] flex-col bg-white shadow-2xl">
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
                    Catalogue-powered shopping assistant
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
                        suggestion
                      }
                      type="button"
                      onClick={() =>
                        sendMessage(
                          suggestion
                        )
                      }
                      className="flex items-center gap-2 rounded-xl border border-storefront bg-white p-3 text-left text-[11px] font-bold text-storefront-text transition hover:border-storefront-primary hover:bg-storefront-secondary"
                    >
                      <Sparkles
                        size={14}
                        className="shrink-0 text-storefront-primary"
                      />

                      <span className="min-w-0 flex-1">
                        {
                          suggestion
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
                        "max-w-[92%]",
                        message.role ===
                        "user"
                          ? ""
                          : "w-full",
                      ].join(
                        " "
                      )}
                    >
                      <div
                        className={[
                          "rounded-2xl px-4 py-3 text-sm leading-6",
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

                      {message.products
                        ?.length ? (
                        <div className="mt-3 space-y-2">
                          {message.products
                            .slice(
                              0,
                              4
                            )
                            .map(
                              (
                                product
                              ) => (
                                <Link
                                  key={
                                    product.id
                                  }
                                  href={
                                    product.productUrl
                                  }
                                  onClick={() =>
                                    setOpen(
                                      false
                                    )
                                  }
                                  className="flex gap-3 rounded-xl border border-storefront bg-white p-3 transition hover:border-storefront-primary"
                                >
                                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-storefront-secondary">
                                    {product.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={
                                          product.imageUrl
                                        }
                                        alt={
                                          product.name
                                        }
                                        className="h-full w-full object-contain p-1.5"
                                      />
                                    ) : (
                                      <ImageIcon
                                        size={22}
                                        className="text-storefront-muted"
                                      />
                                    )}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <p className="line-clamp-2 text-xs font-black text-storefront-text">
                                      {
                                        product.name
                                      }
                                    </p>

                                    {product.brand ? (
                                      <p className="mt-1 text-[10px] uppercase tracking-wide text-storefront-muted">
                                        {
                                          product.brand
                                        }
                                      </p>
                                    ) : null}

                                    {product.price ? (
                                      <p className="mt-2 text-sm font-black text-storefront-primary">
                                        {money(
                                          product.price
                                            .sellingPrice,
                                          product.price
                                            .currencyCode
                                        )}
                                      </p>
                                    ) : null}
                                  </div>
                                </Link>
                              )
                            )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                )
              )}

              {loading ? (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-storefront bg-white px-4 py-3 text-sm text-storefront-muted">
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                    Searching MyShops…
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="border-t border-storefront p-4">
              {items.length ? (
                <div className="mb-3 flex items-center justify-between rounded-xl bg-storefront-secondary px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 font-bold text-storefront-text">
                    <ShoppingBag
                      size={14}
                    />
                    {items.reduce(
                      (
                        total,
                        item
                      ) =>
                        total +
                        item.quantity,
                      0
                    )}{" "}
                    item(s) in cart
                  </span>

                  <span className="font-black text-storefront-primary">
                    {money(
                      cartTotal,
                      currencyCode
                    )}
                  </span>
                </div>
              ) : null}

              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-storefront-muted"
                  />

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
                    placeholder="What are you looking for?"
                    className="h-12 w-full rounded-xl border border-storefront bg-white pl-11 pr-4 text-sm text-storefront-text outline-none focus:border-storefront-primary"
                  />
                </div>

                <button
                  type="button"
                  disabled={
                    loading ||
                    !input.trim()
                  }
                  onClick={() =>
                    sendMessage()
                  }
                  className="flex h-12 w-12 items-center justify-center rounded-xl bg-storefront-primary text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send
                    size={18}
                  />
                </button>
              </div>

              <p className="mt-2 text-center text-[10px] text-storefront-muted">
                Product results come from the live MyShops catalogue.
              </p>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
