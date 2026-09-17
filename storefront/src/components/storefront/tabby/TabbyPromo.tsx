"use client";

import {
  useEffect,
  useId,
} from "react";

const SCRIPT_URL =
  "https://checkout.tabby.ai/tabby-promo.js";

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || "";

/*
 * Tabby QA explicitly supplied MSE as the merchant code.
 * Frontend snippets use only the public key + merchant code.
 */
const MERCHANT_CODE =
  "MSE";

interface TabbyPromoConstructor {
  new (
    options: {
      selector:
        string;

      currency:
        string;

      price:
        string;

      lang:
        "en" |
        "ar";

      source:
        "product" |
        "cart";

      shouldInheritBg:
        boolean;

      publicKey:
        string;

      merchantCode:
        string;
    }
  ): unknown;
}

declare global {
  interface Window {
    TabbyPromo?:
      TabbyPromoConstructor;
  }
}

interface TabbyPromoProps {
  amount:
    number;

  currencyCode?:
    string;

  language?:
    "en" |
    "ar";

  source?:
    "product" |
    "cart";
}

export default function TabbyPromo({
  amount,
  currencyCode =
    "AED",
  language =
    "en",
  source =
    "cart",
}: TabbyPromoProps) {
  const reactId =
    useId();

  const elementId =
    `tabby-promo-${reactId.replace(
      /:/g,
      ""
    )}`;

  useEffect(
    () => {
      if (
        !PUBLIC_KEY ||
        amount <= 0
      ) {
        return;
      }

      let cancelled =
        false;

      const initialise =
        () => {
          if (
            cancelled ||
            !window.TabbyPromo
          ) {
            return;
          }

          const container =
            document.getElementById(
              elementId
            );

          if (
            !container
          ) {
            return;
          }

          container.innerHTML =
            "";

          new window.TabbyPromo({
            selector:
              `#${elementId}`,

            currency:
              currencyCode
                .trim()
                .toUpperCase(),

            price:
              Number(
                amount
              ).toFixed(
                2
              ),

            lang:
              language,

            source,

            shouldInheritBg:
              false,

            publicKey:
              PUBLIC_KEY,

            merchantCode:
              MERCHANT_CODE,
          });
        };

      if (
        window.TabbyPromo
      ) {
        initialise();

        return () => {
          cancelled =
            true;
        };
      }

      let script =
        document.querySelector<HTMLScriptElement>(
          `script[src="${SCRIPT_URL}"]`
        );

      const handleLoad =
        () => {
          initialise();
        };

      if (
        !script
      ) {
        script =
          document.createElement(
            "script"
          );

        script.src =
          SCRIPT_URL;

        script.async =
          true;

        script.dataset.tabbyPromo =
          "true";

        document.head.appendChild(
          script
        );
      }

      script.addEventListener(
        "load",
        handleLoad
      );

      return () => {
        cancelled =
          true;

        script?.removeEventListener(
          "load",
          handleLoad
        );
      };
    },
    [
      amount,
      currencyCode,
      elementId,
      language,
      source,
    ]
  );

  if (
    !PUBLIC_KEY ||
    amount <= 0
  ) {
    return null;
  }

  return (
    <div className="w-full">
      <div
        id={
          elementId
        }
      />
    </div>
  );
}
