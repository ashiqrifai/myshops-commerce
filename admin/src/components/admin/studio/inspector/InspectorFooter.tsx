"use client";

import type {
  ReactNode,
} from "react";

interface InspectorFooterProps {
  children: ReactNode;
  className?: string;
}

export default function InspectorFooter({
  children,
  className = "",
}: InspectorFooterProps) {
  return (
    <footer
      className={[
        "border-t border-[#e1e3e5] bg-white px-4 py-3",
        className,
      ].join(
        " "
      )}
    >
      {children}
    </footer>
  );
}