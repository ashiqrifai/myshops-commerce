"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

interface FlashDealCountdownProps {
  endAt:
    | string
    | null;

  textColor?: string;
  onExpired?: () => void;
}

interface RemainingTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calculateRemaining(
  endAt:
    | string
    | null
): RemainingTime {
  if (!endAt) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
    };
  }

  const target =
    new Date(
      endAt
    ).getTime();

  if (
    Number.isNaN(target)
  ) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: false,
    };
  }

  const difference =
    target - Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    };
  }

  return {
    days: Math.floor(
      difference /
        86_400_000
    ),

    hours: Math.floor(
      (difference %
        86_400_000) /
        3_600_000
    ),

    minutes: Math.floor(
      (difference %
        3_600_000) /
        60_000
    ),

    seconds: Math.floor(
      (difference %
        60_000) /
        1_000
    ),

    expired: false,
  };
}

function CountdownUnit({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="min-w-[64px] rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-center backdrop-blur-sm sm:min-w-[76px] sm:px-4 sm:py-3">
      <div className="text-xl font-black tabular-nums sm:text-2xl">
        {String(value).padStart(
          2,
          "0"
        )}
      </div>

      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">
        {label}
      </div>
    </div>
  );
}

export default function FlashDealCountdown({
  endAt,
  textColor =
    "#FFFFFF",
  onExpired,
}: FlashDealCountdownProps) {
  const [
    remaining,
    setRemaining,
  ] = useState(() =>
    calculateRemaining(
      endAt
    )
  );

  useEffect(() => {
    setRemaining(
      calculateRemaining(
        endAt
      )
    );

    if (!endAt) {
      return;
    }

    const timer =
      window.setInterval(
        () => {
          const next =
            calculateRemaining(
              endAt
            );

          setRemaining(
            next
          );

          if (
            next.expired
          ) {
            window.clearInterval(
              timer
            );

            onExpired?.();
          }
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [
    endAt,
    onExpired,
  ]);

  const units =
    useMemo(
      () => [
        {
          value:
            remaining.days,
          label: "Days",
        },
        {
          value:
            remaining.hours,
          label: "Hours",
        },
        {
          value:
            remaining.minutes,
          label: "Minutes",
        },
        {
          value:
            remaining.seconds,
          label: "Seconds",
        },
      ],
      [remaining]
    );

  if (
    !endAt ||
    remaining.expired
  ) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap gap-2 sm:gap-3"
      style={{
        color: textColor,
      }}
      aria-label="Flash deal countdown"
    >
      {units.map(
        (unit) => (
          <CountdownUnit
            key={unit.label}
            value={unit.value}
            label={unit.label}
          />
        )
      )}
    </div>
  );
}
