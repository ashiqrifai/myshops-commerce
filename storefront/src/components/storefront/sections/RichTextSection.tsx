import Link from "next/link";

import type {
  StorefrontSection,
} from "@/types/storefront";

interface RichTextSectionProps {
  section:
    StorefrontSection;
}

const stringValue = (
  value: unknown,
  fallback = ""
) =>
  typeof value ===
  "string"
    ? value.trim()
    : fallback;

export default function RichTextSection({
  section,
}: RichTextSectionProps) {
  const content =
    section.content ||
    {};

  const settings =
    section.settings ||
    {};

  const title =
    stringValue(
      content.title
    );

  const subtitle =
    stringValue(
      content.subtitle
    );

  const html =
    stringValue(
      content.html
    );

  const buttonText =
    stringValue(
      content.buttonText
    );

  const buttonUrl =
    stringValue(
      content.buttonUrl
    );

  const maxWidth =
    stringValue(
      settings.maxWidth,
      "900px"
    );

  const alignment =
    stringValue(
      settings.alignment,
      "LEFT"
    ).toUpperCase();

  const backgroundColor =
    stringValue(
      settings.backgroundColor,
      "#FFFFFF"
    );

  const textAlignClass =
    alignment ===
    "CENTER"
      ? "text-center"
      : alignment ===
          "RIGHT"
        ? "text-right"
        : "text-left";

  return (
    <section
      data-section-id={
        section.id
      }
      data-section-code={
        section.code
      }
      data-section-type={
        section.type.code
      }
      style={{
        backgroundColor,
      }}
      className="w-full"
    >
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div
          className={[
            "mx-auto",
            textAlignClass,
          ].join(
            " "
          )}
          style={{
            maxWidth,
          }}
        >
          {title ? (
            <h1 className="text-3xl font-black tracking-tight text-storefront-text sm:text-4xl">
              {title}
            </h1>
          ) : null}

          {subtitle ? (
            <p className="mt-3 text-base leading-7 text-storefront-muted sm:text-lg">
              {subtitle}
            </p>
          ) : null}

          {html ? (
            <div
              className={[
                "mt-8",
                "text-[15px] leading-7 text-storefront-text",
                "[&_h1]:mb-5 [&_h1]:mt-10 [&_h1]:text-3xl [&_h1]:font-black",
                "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-black",
                "[&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-bold",
                "[&_p]:mb-5",
                "[&_strong]:font-black",
                "[&_ul]:mb-6 [&_ul]:ml-6 [&_ul]:list-disc [&_ul]:space-y-2",
                "[&_ol]:mb-6 [&_ol]:ml-6 [&_ol]:list-decimal [&_ol]:space-y-2",
                "[&_li]:pl-1",
                "[&_a]:font-semibold [&_a]:text-storefront-primary [&_a]:underline",
                "[&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-storefront-primary [&_blockquote]:pl-5 [&_blockquote]:italic",
              ].join(
                " "
              )}
              dangerouslySetInnerHTML={{
                __html:
                  html,
              }}
            />
          ) : null}

          {buttonText &&
          buttonUrl ? (
            <div className="mt-8">
              <Link
                href={
                  buttonUrl
                }
                className="inline-flex min-h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-6 py-3 text-sm font-black text-white transition hover:opacity-90"
              >
                {
                  buttonText
                }
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}