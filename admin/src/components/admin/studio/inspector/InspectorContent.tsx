"use client";

import type {
  ReactNode,
} from "react";

interface InspectorContentProps {
  children: ReactNode;
  className?: string;
}

export default function InspectorContent({
  children,
  className = "",
}: InspectorContentProps) {
  return (
    <div
      className={[
        "min-h-0 flex-1 overflow-y-auto bg-[#f6f6f7] p-4",
        className,
      ].join(
        " "
      )}
    >
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}