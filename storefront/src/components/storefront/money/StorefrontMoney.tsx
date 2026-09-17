"use client";

interface StorefrontMoneyProps {
  amount:
    | number
    | string
    | null
    | undefined;

  currencyCode?:
    string;

  className?:
    string;

  symbolClassName?:
    string;

  decimals?:
    number;

  showCurrencyCodeForNonAed?:
    boolean;
}

const AED_SYMBOL_URL =
  process.env
    .NEXT_PUBLIC_AED_SYMBOL_URL ||
  "https://api.vkposme.tech/media/eba8444b-69bb-4d13-84cb-1c0dc111432/2137d1fb-2abf-4fa3-b9cb-93b334e16530/original/uae-dirham-1544af84feeea415.png";

export default function StorefrontMoney({
  amount,
  currencyCode = "AED",
  className = "",
  symbolClassName = "",
  decimals = 2,
  showCurrencyCodeForNonAed = true,
}: StorefrontMoneyProps) {
  const numericAmount =
    Number(
      amount
    );

  if (
    amount === null ||
    amount === undefined ||
    !Number.isFinite(
      numericAmount
    )
  ) {
    return null;
  }

  const normalizedCurrency =
    String(
      currencyCode ||
        "AED"
    )
      .trim()
      .toUpperCase();

  const formattedNumber =
    new Intl.NumberFormat(
      "en-AE",
      {
        minimumFractionDigits:
          decimals,

        maximumFractionDigits:
          decimals,
      }
    ).format(
      numericAmount
    );

  /*
  |--------------------------------------------------------------------------
  | UAE Dirham
  |--------------------------------------------------------------------------
  |
  | Keep AED as the underlying ISO currency code.
  | Only replace its visual presentation with the official Dirham symbol.
  |
  |--------------------------------------------------------------------------
  */

  if (
    normalizedCurrency ===
    "AED"
  ) {
    return (
      <span
        className={[
          "inline-flex items-baseline gap-[0.22em]",
          className,
        ].join(
          " "
        )}
      >
        <img
          src={
            AED_SYMBOL_URL
          }
          alt="AED"
          aria-hidden="true"
          className={[
            "inline-block h-[0.78em] w-auto shrink-0 object-contain",
            symbolClassName,
          ].join(
            " "
          )}
        />

        <span>
          {
            formattedNumber
          }
        </span>
      </span>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Other Currencies
  |--------------------------------------------------------------------------
  */

  if (
    !showCurrencyCodeForNonAed
  ) {
    return (
      <span
        className={
          className
        }
      >
        {
          formattedNumber
        }
      </span>
    );
  }

  const formattedCurrency =
    new Intl.NumberFormat(
      "en-AE",
      {
        style:
          "currency",

        currency:
          normalizedCurrency,

        minimumFractionDigits:
          decimals,

        maximumFractionDigits:
          decimals,
      }
    ).format(
      numericAmount
    );

  return (
    <span
      className={
        className
      }
    >
      {
        formattedCurrency
      }
    </span>
  );
}