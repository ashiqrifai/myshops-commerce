"use client";

import Link from "next/link";

import {
  FormEvent,
  useState,
} from "react";

import type {
  StorefrontData,
} from "@/types/storefront";

interface StorefrontFooterProps {
  storefront:
    StorefrontData;
}

/*
|--------------------------------------------------------------------------
| MyShops Footer Logo
|--------------------------------------------------------------------------
*/

const MYSHOPS_FOOTER_LOGO_URL =
  "https://api.vkposme.tech/media/eba8444b-69bb-4d13-84cb-1c0a63313075/fb4697a6-c36f-4b05-aa6b-68810ba0345c/original/myshops-logo-landscape-2-afede6ebaee175db.avif";

/*
|--------------------------------------------------------------------------
| Newsletter Endpoint
|--------------------------------------------------------------------------
|
| Update this if your final newsletter API route is different.
|
|--------------------------------------------------------------------------
*/

const API_BASE_URL = (
  process.env
    .NEXT_PUBLIC_API_URL ||
  "https://api.vkposme.tech/api/v1"
).replace(/\/$/, "");

const NEWSLETTER_ENDPOINT =
  `${API_BASE_URL}/public/newsletter/subscribe`;
/*
|--------------------------------------------------------------------------
| Footer Navigation
|--------------------------------------------------------------------------
*/

const footerGroups = [
  {
    title:
      "SHOP",

    links: [
      [
        "Mobile Phones",
        "/category/mobiles",
      ],
      [
        "Laptops & Tablets",
        "/category/laptops-and-tablets",
      ],
      [
        "Accessories",
        "/category/accessories",
      ],
      [
        "Gaming",
        "/category/gaming",
      ],
      [
        "Wearables",
        "/category/wearables",
      ],
      [
        "Cameras",
        "/category/photo-and-video",
      ],
    ],
  },

  {
    title:
      "ACCOUNT",

    links: [
      [
        "My Account",
        "/account",
      ],
      [
        "Orders",
        "/account/orders",
      ],
      [
        "Wishlist",
        "/wishlist",
      ],
      [
        "Track Order",
        "/account/orders",
      ],
      [
        "Returns",
        "/returns",
      ],
    ],
  },

  {
    title:
      "INFO",

    links: [
      [
        "About Us",
        "/about",
      ],
      [
        "Store",
        "/stores",
      ],
    ],
  },

  {
    title:
      "HELP",

    links: [
      [
        "Contact Us",
        "/contact",
      ],
      [
        "Privacy Policy",
        "/privacy",
      ],
    ],
  },
] as const;

/*
|--------------------------------------------------------------------------
| Social Icons
|--------------------------------------------------------------------------
*/

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[21px] w-[21px]"
      fill="currentColor"
    >
      <path d="M13.6 22v-8.9h3l.45-3.48H13.6V7.4c0-1 .28-1.7 1.74-1.7h1.86V2.6c-.32-.04-1.43-.14-2.72-.14-2.7 0-4.55 1.65-4.55 4.68v2.48H6.88v3.48h3.05V22h3.67Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[23px] w-[23px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5.5"
      />

      <circle
        cx="12"
        cy="12"
        r="4.2"
      />

      <circle
        cx="17.5"
        cy="6.5"
        r="1.15"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[21px] w-[21px]"
      fill="currentColor"
    >
      <path d="M5.34 8.01H2.15V21.5h3.19V8.01Zm-1.6-5.5A1.86 1.86 0 1 0 3.74 6.23a1.86 1.86 0 0 0 0-3.72ZM21.85 13.76c0-4.08-2.18-5.98-5.1-5.98a4.42 4.42 0 0 0-4 2.2V8.01H9.57V21.5h3.18v-6.68c0-1.76.33-3.46 2.5-3.46 2.14 0 2.17 2 2.17 3.58v6.56h3.18v-7.74Z" />
    </svg>
  );
}

/*
|--------------------------------------------------------------------------
| Footer
|--------------------------------------------------------------------------
*/

export default function StorefrontFooter({
  storefront,
}: StorefrontFooterProps) {
  const displayName =
    storefront.settings
      .company
      ?.displayName ||
    storefront.company.name;

  /*
  |--------------------------------------------------------------------------
  | Newsletter State
  |--------------------------------------------------------------------------
  */

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | Newsletter Submit
  |--------------------------------------------------------------------------
  */

  const handleNewsletterSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (!normalizedEmail) {
        setSuccess(false);

        setMessage(
          "Please enter your email address."
        );

        return;
      }

      setSubmitting(
        true
      );

      setMessage(
        ""
      );

      try {
        const response =
          await fetch(
            NEWSLETTER_ENDPOINT,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  email:
                    normalizedEmail,
                }),
            }
          );

        /*
         * If backend is not ready yet,
         * this will correctly show an error
         * instead of pretending subscription succeeded.
         */

        if (
          !response.ok
        ) {
          throw new Error(
            "Newsletter subscription failed."
          );
        }

        setSuccess(
          true
        );

        setMessage(
          "Thank you for subscribing."
        );

        setEmail(
          ""
        );
      } catch (
        error
      ) {
        console.error(
          "[Newsletter subscription error]",
          error
        );

        setSuccess(
          false
        );

        setMessage(
          "Unable to subscribe right now. Please try again later."
        );
      } finally {
        setSubmitting(
          false
        );
      }
    };

  return (
    <footer className="mt-auto border-t border-[#D1D5DB] bg-[#F3F4F6] text-[#111318]">

      {/*
      |--------------------------------------------------------------------------
      | Newsletter
      |--------------------------------------------------------------------------
      */}

      <div className="border-b border-[#D1D5DB] bg-white">
        <div
          className="
            mx-auto
            grid
            max-w-[1440px]
            gap-5
            px-4
            py-7

            sm:px-6
            sm:py-8

            lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]
            lg:items-center
            lg:gap-10
            lg:px-8
          "
        >
          {/*
          |--------------------------------------------------------------------------
          | Newsletter Text
          |--------------------------------------------------------------------------
          */}

          <div>
            <h2
              className="
                text-[20px]
                font-bold
                tracking-tight
                text-[#111318]

                sm:text-[22px]

                lg:text-2xl
              "
            >
              Stay in the loop
            </h2>

            <p
              className="
                mt-1.5
                max-w-2xl
                text-[13px]
                leading-5
                text-[#6B7280]

                sm:text-sm
                sm:leading-6
              "
            >
              Get the latest offers,
              new arrivals and exclusive
              MyShops deals delivered to
              your inbox.
            </p>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Newsletter Form
          |--------------------------------------------------------------------------
          */}

          <form
            onSubmit={
              handleNewsletterSubmit
            }
            className="w-full"
          >
            <div
              className="
                flex
                w-full
                flex-col
                gap-2.5

                sm:flex-row
                sm:gap-2
              "
            >
              <input
                type="email"
                value={
                  email
                }
                onChange={(
                  event
                ) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="Enter your email address"
                aria-label="Email address"
                autoComplete="email"
                className="
                  h-11
                  min-w-0
                  flex-1

                  rounded-lg
                  border
                  border-[#D1D5DB]

                  bg-white

                  px-4

                  text-sm
                  text-[#111318]

                  outline-none

                  transition

                  placeholder:text-[#9CA3AF]

                  focus:border-[#111318]
                  focus:ring-1
                  focus:ring-[#111318]
                "
              />

              <button
                type="submit"
                disabled={
                  submitting
                }
                className="
                  flex
                  h-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-lg

                  bg-[#0B0010]

                  px-6

                  text-sm
                  font-bold
                  text-white

                  transition

                  hover:bg-[#1A0A20]

                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {submitting
                  ? "Subscribing..."
                  : "Subscribe"}
              </button>
            </div>

            {message ? (
              <p
                className={[
                  "mt-2 text-xs font-medium",

                  success
                    ? "text-emerald-700"
                    : "text-red-600",
                ].join(
                  " "
                )}
              >
                {
                  message
                }
              </p>
            ) : null}
          </form>
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Main Footer
      |--------------------------------------------------------------------------
      */}

      <div className="mx-auto max-w-[1440px] px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(4,1fr)]">

          {/*
          |--------------------------------------------------------------------------
          | Brand
          |--------------------------------------------------------------------------
          */}

          <div>
            <Link
              href="/"
              aria-label={`${displayName} home`}
              className="inline-flex items-center"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}

              <img
                src={
                  MYSHOPS_FOOTER_LOGO_URL
                }
                alt={
                  displayName
                }
                className="h-auto w-[190px] max-w-full object-contain object-left sm:w-[210px]"
              />
            </Link>

            <p className="mt-5 max-w-md text-sm font-medium leading-7 text-[#5F6672]">
              Your one-stop destination
              for the latest mobiles,
              electronics and gadgets in
              the UAE. Fast delivery
              across Dubai, Abu Dhabi and
              Sharjah.
            </p>

            {/*
            |--------------------------------------------------------------------------
            | Toll Free
            |--------------------------------------------------------------------------
            */}

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#6B7280]">
                Toll Free
              </p>

              <a
                href="tel:8008989"
                className="
                  mt-1
                  inline-flex

                  text-[22px]
                  font-bold
                  tracking-tight
                  text-[#111318]

                  transition

                  hover:text-storefront-primary
                "
              >
                800 8989
              </a>
            </div>

            {/*
            |--------------------------------------------------------------------------
            | Social Media
            |--------------------------------------------------------------------------
            */}

            <div className="mt-7 flex flex-wrap items-center gap-3">

              {/*
              |--------------------------------------------------------------------------
              | Facebook
              |--------------------------------------------------------------------------
              */}

              <a
                href="https://www.facebook.com/myshops.ae/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow My Shops on Facebook"
                title="Facebook"
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-[13px]

                  bg-[#0B0010]
                  text-white

                  shadow-sm

                  transition-all
                  duration-200

                  hover:-translate-y-0.5
                  hover:bg-[#111318]
                  hover:shadow-md
                "
              >
                <FacebookIcon />
              </a>

              {/*
              |--------------------------------------------------------------------------
              | Instagram
              |--------------------------------------------------------------------------
              */}

              <a
                href="https://www.instagram.com/myshops.ae/?hl=en"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow My Shops on Instagram"
                title="Instagram"
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-[13px]

                  bg-[#0B0010]
                  text-white

                  shadow-sm

                  transition-all
                  duration-200

                  hover:-translate-y-0.5
                  hover:bg-[#111318]
                  hover:shadow-md
                "
              >
                <InstagramIcon />
              </a>

              {/*
              |--------------------------------------------------------------------------
              | LinkedIn
              |--------------------------------------------------------------------------
              */}

              <a
                href="https://www.linkedin.com/company/myshops-uae/?viewAsMember=true"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Follow My Shops on LinkedIn"
                title="LinkedIn"
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center

                  rounded-[13px]

                  bg-[#0B0010]
                  text-white

                  shadow-sm

                  transition-all
                  duration-200

                  hover:-translate-y-0.5
                  hover:bg-[#111318]
                  hover:shadow-md
                "
              >
                <LinkedInIcon />
              </a>
            </div>
          </div>

          {/*
          |--------------------------------------------------------------------------
          | Footer Navigation
          |--------------------------------------------------------------------------
          */}

          {footerGroups.map(
            (
              group
            ) => (
              <div
                key={
                  group.title
                }
              >
                <h3 className="text-sm font-black uppercase tracking-wide text-[#111318]">
                  {
                    group.title
                  }
                </h3>

                <div className="mt-5 space-y-3">
                  {group.links.map(
                    (
                      [
                        label,
                        href,
                      ]
                    ) => (
                      <Link
                        key={
                          label
                        }
                        href={
                          href
                        }
                        className="block text-sm font-medium text-[#5F6672] transition hover:text-storefront-primary"
                      >
                        {
                          label
                        }
                      </Link>
                    )
                  )}

                  {/*
                  |--------------------------------------------------------------------------
                  | Toll-free repeated under HELP
                  |--------------------------------------------------------------------------
                  |
                  | This makes the number easy to find
                  | even when users scan the HELP column.
                  |
                  |--------------------------------------------------------------------------
                  */}

                  {group.title ===
                  "HELP" ? (
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase tracking-wide text-[#111318]">
                        Toll Free
                      </p>

                      <a
                        href="tel:8008989"
                        className="mt-1 block text-sm font-bold text-[#111318] transition hover:text-storefront-primary"
                      >
                        800 8989
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          )}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Bottom Footer
        |--------------------------------------------------------------------------
        */}

        <div className="mt-12 flex flex-col gap-6 border-t border-[#D1D5DB] pt-7 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-[#6B7280]">
            ©{" "}
            {
              new Date()
                .getFullYear()
            }{" "}
            {
              displayName
            }
            . All rights reserved.
          </p>

          {/*
          |--------------------------------------------------------------------------
          | Payment Methods
          |--------------------------------------------------------------------------
          */}

          <div className="flex flex-wrap items-center gap-2">
            {[
              "PayPal",
              "VISA",
              "DISCOVER",
              "AMEX",
              "VISA",
              "XOOM",
            ].map(
              (
                payment,
                index
              ) => (
                <span
                  key={
                    `${payment}-${index}`
                  }
                  className="inline-flex h-7 items-center rounded border border-[#D1D5DB] bg-white px-2 text-[9px] font-black text-[#111318]"
                >
                  {
                    payment
                  }
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}