"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  LucideIcon,
} from "lucide-react";

import {
  MoreHorizontal,
} from "lucide-react";

export interface DataTableAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
  hidden?: boolean;
  destructive?: boolean;
  separatorBefore?: boolean;
}

interface DataTableActionsProps {
  actions: DataTableAction[];
  label?: string;
  disabled?: boolean;
  align?: "left" | "right";
}

export default function DataTableActions({
  actions,
  label = "Open actions",
  disabled = false,
  align = "right",
}: DataTableActionsProps) {
  const [
    isOpen,
    setIsOpen,
  ] = useState(false);

  const containerRef =
    useRef<HTMLDivElement>(
      null
    );

  const visibleActions =
    actions.filter(
      (action) =>
        !action.hidden
    );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (
      event: MouseEvent
    ) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node
        )
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key ===
        "Escape"
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handlePointerDown
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handlePointerDown
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [isOpen]);

  if (
    !visibleActions.length
  ) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-flex"
    >
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={
          isOpen
        }
        disabled={disabled}
        onClick={() =>
          setIsOpen(
            (current) =>
              !current
          )
        }
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-[#61666b] transition hover:border-[#d8dadd] hover:bg-[#f6f6f7] hover:text-[#202223] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MoreHorizontal
          size={19}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className={[
            "absolute top-full z-50 mt-1 min-w-52 overflow-hidden rounded-xl border border-[#e1e3e5] bg-white py-1.5 shadow-xl",
            align ===
            "right"
              ? "right-0"
              : "left-0",
          ].join(" ")}
        >
          {visibleActions.map(
            (
              action,
              index
            ) => {
              const Icon =
                action.icon;

              return (
                <div
                  key={
                    action.key
                  }
                >
                  {action.separatorBefore &&
                    index >
                      0 && (
                      <div className="my-1 border-t border-[#e1e3e5]" />
                    )}

                  <button
                    type="button"
                    role="menuitem"
                    disabled={
                      action.disabled
                    }
                    onClick={() => {
                      if (
                        action.disabled
                      ) {
                        return;
                      }

                      setIsOpen(
                        false
                      );

                      action.onClick();
                    }}
                    className={[
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition",
                      action.destructive
                        ? "text-red-600 hover:bg-red-50"
                        : "text-[#303030] hover:bg-[#f6f6f7]",
                      action.disabled
                        ? "cursor-not-allowed opacity-40"
                        : "",
                    ].join(" ")}
                  >
                    {Icon && (
                      <Icon
                        size={16}
                        aria-hidden="true"
                      />
                    )}

                    <span className="flex-1">
                      {
                        action.label
                      }
                    </span>
                  </button>
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}