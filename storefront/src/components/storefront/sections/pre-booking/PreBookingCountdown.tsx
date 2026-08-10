"use client";

import {
  useEffect,
  useState,
} from "react";

interface Remaining {
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
): Remaining {
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

export default function PreBookingCountdown({
  endAt,
}: {
  endAt:
    | string
    | null;
}) {
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
          }
        },
        1000
      );

    return () =>
      window.clearInterval(
        timer
      );
  }, [endAt]);

  if (
    !endAt ||
    remaining.expired
  ) {
    return null;
  }

  const units = [
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
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {units.map(
        ({ value, label }) => (
          <div
            key={label}
            className="min-w-[62px] rounded-xl border border-white/20 bg-black/20 px-3 py-2 text-center backdrop-blur"
          >
            <div className="text-xl font-black tabular-nums">
              {String(
                value
              ).padStart(
                2,
                "0"
              )}
            </div>

            <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.14em] opacity-75">
              {label}
            </div>
          </div>
        )
      )}
    </div>
  );
}
