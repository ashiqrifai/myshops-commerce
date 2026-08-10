import type { ReactNode } from "react";

interface FormSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  icon?: ReactNode;
  rightContent?: ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
  contentClassName?: string;
  divided?: boolean;
}

export default function FormSection({
  children,
  title,
  description,
  icon,
  rightContent,
  columns = 1,
  className = "",
  contentClassName = "",
  divided = false,
}: FormSectionProps) {
  return (
    <section
      className={[
        divided
          ? "border-b border-[#e1e3e5] pb-6 last:border-b-0 last:pb-0"
          : "",
        className,
      ].join(" ")}
    >
      {(title || description || icon || rightContent) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            {icon && (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f1f2f3] text-[#45484c]">
                {icon}
              </div>
            )}

            <div className="min-w-0">
              {title && (
                <h3 className="text-sm font-semibold text-[#202223]">
                  {title}
                </h3>
              )}

              {description && (
                <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6d7175]">
                  {description}
                </p>
              )}
            </div>
          </div>

          {rightContent && (
            <div className="shrink-0">
              {rightContent}
            </div>
          )}
        </div>
      )}

      <div
        className={[
          "grid gap-4",
          getColumnClassName(columns),
          contentClassName,
        ].join(" ")}
      >
        {children}
      </div>
    </section>
  );
}

function getColumnClassName(
  columns: 1 | 2 | 3 | 4
) {
  switch (columns) {
    case 2:
      return "grid-cols-1 md:grid-cols-2";

    case 3:
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

    case 4:
      return "grid-cols-1 md:grid-cols-2 xl:grid-cols-4";

    default:
      return "grid-cols-1";
  }
}