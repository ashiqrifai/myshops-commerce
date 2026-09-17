"use client";

import Image from "next/image";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

import {
  useEffect,
  useState,
} from "react";

export default function NavigationLoader() {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const [
    isNavigating,
    setIsNavigating,
  ] = useState(false);

  /*
  |--------------------------------------------------------------------------
  | Finish Loader After Route Change
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    setIsNavigating(
      false
    );
  }, [
    pathname,
    searchParams,
  ]);

  /*
  |--------------------------------------------------------------------------
  | Detect Internal Navigation
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleClick = (
      event: MouseEvent
    ) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target =
        event.target as
          | HTMLElement
          | null;

      if (!target) {
        return;
      }

      const anchor =
        target.closest(
          "a"
        ) as
          | HTMLAnchorElement
          | null;

      if (!anchor) {
        return;
      }

      const href =
        anchor.getAttribute(
          "href"
        );

      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith(
          "mailto:"
        ) ||
        href.startsWith(
          "tel:"
        ) ||
        anchor.target ===
          "_blank" ||
        anchor.hasAttribute(
          "download"
        )
      ) {
        return;
      }

      let destination:
        URL;

      try {
        destination =
          new URL(
            anchor.href,
            window.location
              .href
          );
      } catch {
        return;
      }

      /*
       * External links do not use
       * the storefront loader.
       */
      if (
        destination.origin !==
        window.location.origin
      ) {
        return;
      }

      const currentUrl =
        new URL(
          window.location
            .href
        );

      /*
       * Ignore navigation to the
       * exact current URL.
       */
      if (
        destination.pathname ===
          currentUrl.pathname &&
        destination.search ===
          currentUrl.search &&
        destination.hash ===
          currentUrl.hash
      ) {
        return;
      }

      setIsNavigating(
        true
      );
    };

    document.addEventListener(
      "click",
      handleClick,
      true
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClick,
        true
      );
    };
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Nothing To Render
  |--------------------------------------------------------------------------
  */

  if (!isNavigating) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Loader
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className={[
        "pointer-events-none",

        "fixed",
        "inset-0",
        "z-[99999]",

        "flex",
        "items-center",
        "justify-center",

        /*
         * Light transparent overlay.
         * Existing page remains visible.
         */
        "bg-white/25",

        /*
         * Small amount of glass blur.
         */
        "backdrop-blur-[1.5px]",

        /*
         * Smooth overlay entrance.
         */
        "animate-[storefront-loader-overlay_180ms_ease-out_both]",
      ].join(
        " "
      )}
      role="status"
      aria-label="Loading"
    >
      {/*
      |--------------------------------------------------------------------------
      | Logo Container
      |--------------------------------------------------------------------------
      */}

      <div
        className={[
          "relative",

          "flex",
          "items-center",
          "justify-center",

          /*
           * Floating / breathing animation.
           */
          "animate-[storefront-logo-loading_1.6s_ease-in-out_infinite]",
        ].join(
          " "
        )}
      >
        {/*
         * Soft glow behind logo.
         *
         * This is separate from the image shadow
         * and gives much stronger separation from
         * product images underneath.
         */}

        <div
          aria-hidden="true"
          className={[
            "absolute",

            "inset-[-28px]",

            "-z-10",

            "rounded-[40px]",

            "bg-white/65",

            "blur-2xl",

            "animate-[storefront-logo-glow_1.6s_ease-in-out_infinite]",
          ].join(
            " "
          )}
        />

        {/*
        |--------------------------------------------------------------------------
        | MyShops Logo
        |--------------------------------------------------------------------------
        */}

        <Image
          src="/myshops-logo.png"
          alt="MyShops"
          width={220}
          height={80}
          priority
          className={[
            "relative",

            "h-auto",

            "w-[155px]",
            "sm:w-[180px]",
            "lg:w-[205px]",

            /*
             * Strong shadow.
             */
            "drop-shadow-[0_8px_12px_rgba(0,0,0,0.42)]",

            /*
             * Additional deeper shadow.
             */
            "[filter:drop-shadow(0_8px_12px_rgba(0,0,0,0.42))_drop-shadow(0_18px_30px_rgba(0,0,0,0.28))]",
          ].join(
            " "
          )}
        />
      </div>
    </div>
  );
}