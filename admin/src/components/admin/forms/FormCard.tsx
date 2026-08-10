import type { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  title?: string;
  description?: string;
  headerContent?: ReactNode;
  footerContent?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export default function FormCard({
  children,
  title,
  description,
  headerContent,
  footerContent,
  className = "",
  contentClassName = "",
}: FormCardProps) {
  const hasHeader =
    Boolean(title) ||
    Boolean(description) ||
    Boolean(headerContent);

  return (
    <section
      className={[
        "overflow-hidden rounded-xl border border-[#e1e3e5] bg-white shadow-sm",
        className,
      ].join(" ")}
    >
      {hasHeader && (
        <header className="flex flex-col gap-3 border-b border-[#e1e3e5] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title && (
              <h2 className="text-base font-semibold text-[#202223]">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 max-w-3xl text-sm leading-6 text-[#6d7175]">
                {description}
              </p>
            )}
          </div>

          {headerContent && (
            <div className="shrink-0">
              {headerContent}
            </div>
          )}
        </header>
      )}

      <div
        className={[
          "p-5",
          contentClassName,
        ].join(" ")}
      >
        {children}
      </div>

      {footerContent && (
        <footer className="border-t border-[#e1e3e5] bg-[#fafafa] px-5 py-4">
          {footerContent}
        </footer>
      )}
    </section>
  );
}