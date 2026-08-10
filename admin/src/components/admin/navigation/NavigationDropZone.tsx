"use client";

import {
  useDroppable,
} from "@dnd-kit/core";

export type NavigationDropMode =
  | "BEFORE"
  | "INSIDE"
  | "AFTER"
  | "ROOT_END";

interface NavigationDropZoneProps {
  id: string;

  mode:
    NavigationDropMode;

  level?: number;

  label?: string;

  visible?: boolean;
}

export default function NavigationDropZone({
  id,
  mode,
  level = 0,
  label,
  visible = true,
}: NavigationDropZoneProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id,

    data: {
      type:
        "NAVIGATION_DROP_ZONE",

      mode,
    },
  });

  /*
   * Important:
   * Never return null here.
   *
   * dnd-kit must have the drop
   * zone mounted before dragging
   * begins so it can measure it.
   */

  if (
    mode ===
    "INSIDE"
  ) {
    return (
      <div
        ref={setNodeRef}
        className={[
          "mx-3 overflow-hidden rounded-lg border border-dashed transition-all",
          visible
            ? "my-1 min-h-10 px-3 py-2"
            : "my-0 h-0 min-h-0 border-transparent px-3 py-0",
          visible &&
          isOver
            ? "border-[#005bd3] bg-[#eef4ff] font-medium text-[#005bd3]"
            : visible
              ? "border-[#c9cccf] bg-[#fafafa] text-[#6d7175]"
              : "text-transparent",
        ].join(" ")}
        style={{
          marginLeft:
            64 +
            level * 30,
        }}
      >
        {label ||
          "Drop inside"}
      </div>
    );
  }

  if (
    mode ===
    "ROOT_END"
  ) {
    return (
      <div
        ref={setNodeRef}
        className={[
          "m-3 flex overflow-hidden items-center justify-center rounded-xl border border-dashed text-sm transition-all",
          visible
            ? "min-h-14"
            : "m-0 h-0 min-h-0 border-transparent",
          visible &&
          isOver
            ? "border-[#005bd3] bg-[#eef4ff] font-medium text-[#005bd3]"
            : visible
              ? "border-[#c9cccf] bg-[#fafafa] text-[#6d7175]"
              : "text-transparent",
        ].join(" ")}
      >
        {label ||
          "Drop here to make this a top-level item"}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={[
        "relative transition-all",
        visible
          ? "h-5"
          : "h-0",
        visible &&
        isOver
          ? "bg-[#eef4ff]"
          : "",
      ].join(" ")}
      style={{
        marginLeft:
          48 +
          level * 30,
      }}
    >
      <div
        className={[
          "absolute left-0 right-4 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition",
          visible &&
          isOver
            ? "bg-[#005bd3]"
            : "bg-transparent",
        ].join(" ")}
      />

      {visible &&
        isOver && (
          <div className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#005bd3]" />
        )}
    </div>
  );
}