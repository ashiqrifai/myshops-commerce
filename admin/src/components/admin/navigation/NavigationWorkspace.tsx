"use client";

import type {
  ReactNode,
} from "react";

interface NavigationWorkspaceProps {
  treePanel: ReactNode;
  designerPanel: ReactNode;
  previewPanel: ReactNode;
  inspectorPanel?: ReactNode;
}

export default function NavigationWorkspace({
  treePanel,
  designerPanel,
  previewPanel,
  inspectorPanel,
}: NavigationWorkspaceProps) {
  const hasInspector =
    Boolean(
      inspectorPanel
    );

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
      <div
        className={[
          "grid min-h-[720px] grid-cols-1",

          "xl:grid-cols-[280px_minmax(0,1fr)]",

          hasInspector
            ? "min-[1900px]:grid-cols-[280px_minmax(440px,0.9fr)_minmax(520px,1.05fr)_360px]"
            : "min-[1900px]:grid-cols-[290px_minmax(460px,0.9fr)_minmax(560px,1.15fr)]",
        ].join(
          " "
        )}
      >
        <div
          className={[
            "min-w-0 border-b border-[#e1e3e5]",
            "xl:border-b-0 xl:border-r",
            "min-[1900px]:border-b-0 min-[1900px]:border-r",
          ].join(
            " "
          )}
        >
          {treePanel}
        </div>

        <div
          className={[
            "min-w-0 border-b border-[#e1e3e5]",
            "xl:border-b-0",
            "min-[1900px]:border-r",
          ].join(
            " "
          )}
        >
          {designerPanel}
        </div>

        <div
          className={[
            "min-w-0 bg-[#f6f6f7]",
            "xl:col-span-2 xl:border-t xl:border-[#e1e3e5]",
            "min-[1900px]:col-span-1 min-[1900px]:border-t-0",
            hasInspector
              ? "min-[1900px]:border-r min-[1900px]:border-[#e1e3e5]"
              : "",
          ].join(
            " "
          )}
        >
          {previewPanel}
        </div>

        {inspectorPanel && (
          <div
            className={[
              "min-w-0 border-t border-[#e1e3e5] bg-white",
              "xl:col-span-2",
              "min-[1900px]:col-span-1 min-[1900px]:border-t-0",
            ].join(
              " "
            )}
          >
            {inspectorPanel}
          </div>
        )}
      </div>
    </section>
  );
}