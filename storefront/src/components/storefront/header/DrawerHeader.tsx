"use client";

import {
  CircleUserRound,
  X,
} from "lucide-react";

import Link from "next/link";

import type {
  RefObject,
} from "react";

interface DrawerHeaderProps {
  accountUrl: string;
  accountLabel: string;
  open: boolean;
  onClose: () => void;
  closeButtonRef:
    RefObject<HTMLButtonElement | null>;
}

export default function DrawerHeader({
  accountUrl,
  accountLabel,
  open,
  onClose,
  closeButtonRef,
}: DrawerHeaderProps) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-4 bg-slate-900 px-5 text-white">
      <Link
        href={accountUrl}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md py-2 font-bold outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-white/70"
      >
        <CircleUserRound
          size={29}
          aria-hidden="true"
          className="shrink-0"
        />

        <span className="truncate text-lg">
          {accountLabel}
        </span>
      </Link>

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close navigation drawer"
        tabIndex={open ? 0 : -1}
        className="flex size-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none"
      >
        <X
          size={25}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
