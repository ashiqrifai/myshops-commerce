"use client";

import {
  useEffect,
  useId,
} from "react";

const SCRIPT_URL =
  "https://cdn.tamara.co/widget-v2/tamara-widget.js";

const PUBLIC_KEY =
  process.env
    .NEXT_PUBLIC_TAMARA_PUBLIC_KEY ||
  "";

declare global {
  interface Window {
    tamaraWidgetConfig?: {
      lang:
        string;

      country:
        string;

      publicKey:
        string;

      css?:
        string;

      style?: {
        fontSize?:
          string;

        badgeRatio?:
          number;
      };
    };
  }

  namespace React {
    namespace JSX {
      interface IntrinsicElements {
        "tamara-widget": {
          id?:
            string;

          type?:
            string;

          amount?:
            string;

          config?:
            string;

          "inline-type"?:
            string;

          className?:
            string;

          key?:
            React.Key;
        };
      }
    }
  }
}

interface TamaraWidgetProps {
  amount:
    number;

  country?:
    "AE" |
    "SA";

  language?:
    "en" |
    "ar";

  className?:
    string;
}

export default function TamaraWidget({
  amount,
  country =
    "AE",
  language =
    "en",
  className =
    "",
}: TamaraWidgetProps) {
  const reactId =
    useId();

  const widgetId =
    `tamara-widget-${reactId.replace(
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

      window.tamaraWidgetConfig = {
        lang:
          language,

        country,

        publicKey:
          PUBLIC_KEY,

        style: {
          fontSize:
            "14px",

          badgeRatio:
            1.2,
        },
      };

      const initialiseWidget =
        () => {
          /*
           * Tamara's script scans the DOM
           * for <tamara-widget> elements.
           *
           * Dispatching this event also helps
           * when the amount changes after a
           * product variant/cart update.
           */
          window.dispatchEvent(
            new Event(
              "tamara-widget:refresh"
            )
          );
        };

      let script =
        document.querySelector<HTMLScriptElement>(
          `script[src="${SCRIPT_URL}"]`
        );

      const handleLoad =
        () => {
          initialiseWidget();
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

        script.defer =
          true;

        script.dataset.tamaraWidget =
          "true";

        document.head.appendChild(
          script
        );
      }

      script.addEventListener(
        "load",
        handleLoad
      );

      /*
       * If the Tamara script already exists,
       * refresh after React has updated the DOM.
       */
      if (
        script.dataset
          .loaded ===
        "true"
      ) {
        initialiseWidget();
      }

      const markLoaded =
        () => {
          if (
            script
          ) {
            script.dataset
              .loaded =
              "true";
          }
        };

      script.addEventListener(
        "load",
        markLoaded
      );

      return () => {
        script?.removeEventListener(
          "load",
          handleLoad
        );

        script?.removeEventListener(
          "load",
          markLoaded
        );
      };
    },
    [
      amount,
      country,
      language,
    ]
  );

  if (
    !PUBLIC_KEY ||
    !Number.isFinite(
      amount
    ) ||
    amount <= 0
  ) {
    return null;
  }

  return (
    <div
      className={
        className
      }
    >
      <tamara-widget
        key={
          `${widgetId}-${amount}`
        }
        id={
          widgetId
        }
        type="tamara-summary"
        amount={
          Number(
            amount
          ).toFixed(
            2
          )
        }
        config={JSON.stringify({
          badgePosition:
            "right",

          showExtraContent:
            "",
        })}
        inline-type="2"
      />
    </div>
  );
}