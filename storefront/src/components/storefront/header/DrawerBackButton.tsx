"use client";

import {
  ArrowLeft,
} from "lucide-react";

interface DrawerBackButtonProps {
  open: boolean;
  onBack: () => void;
}

export default function DrawerBackButton({
  open,
  onBack,
}: DrawerBackButtonProps) {
  return (
    <button
      type="button"
      onClick={onBack}
      tabIndex={open ? 0 : -1}
      className="flex min-h-14 w-full items-center gap-3 border-b border-slate-200 px-6 text-left font-bold text-slate-900 transition-colors hover:bg-slate-100 focus-visible:bg-slate-100 focus-visible:outline-none"
    >
      <ArrowLeft
        size={20}
        aria-hidden="true"
      />

      <span>Main menu</span>
    </button>
  );
}
