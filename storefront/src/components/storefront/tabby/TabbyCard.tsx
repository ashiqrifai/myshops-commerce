"use client";

import {
  useEffect,
  useId,
} from "react";

const SCRIPT_URL =
  "https://checkout.tabby.ai/tabby-card.js";

const PUBLIC_KEY =
  process.env.NEXT_PUBLIC_TABBY_PUBLIC_KEY || "";

/*
 * Tabby QA explicitly supplied MSE as the merchant code.
 * Do not source this from NEXT_PUBLIC_TABBY_SECRET_KEY or any secret value.
 */
const MERCHANT_CODE =
  "MSE";

interface TabbyCardConstructor {
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
    TabbyCard?:
      TabbyCardConstructor;
  }
}

interface TabbyCardProps {
  amount:
    number;

  currencyCode?:
    string;

  language?:
    "en" |
    "ar";
}

export default function TabbyCard({
  amount,
  currencyCode =
    "AED",
  language =
    "en",
}: TabbyCardProps) {
  const reactId =
    useId();

  const elementId =
    `tabby-card-${reactId.replace(
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
            !window.TabbyCard
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

          new window.TabbyCard({
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

            shouldInheritBg:
              false,

            publicKey:
              PUBLIC_KEY,

            merchantCode:
              MERCHANT_CODE,
          });
        };

      if (
        window.TabbyCard
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

        script.dataset.tabbyCard =
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
