"use client";

const WHATSAPP_NUMBER =
  "971547913579";

const DEFAULT_MESSAGE =
  "Hi MyShops, I need some assistance.";

export default function WhatsAppFloatButton() {
  const whatsappUrl =
    `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      DEFAULT_MESSAGE
    )}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with MyShops on WhatsApp"
      title="Chat with us on WhatsApp"
      className="
        fixed
        bottom-6
        right-5
        z-[80]

        flex
        h-[58px]
        w-[58px]
        items-center
        justify-center

        rounded-full
        bg-transparent
        text-[#25D366]

        opacity-70

        transition-all
        duration-200

        hover:-translate-y-1
        hover:scale-105
        hover:opacity-100

        sm:bottom-7
        sm:right-7
        sm:h-[62px]
        sm:w-[62px]
      "
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        className="
          h-[42px]
          w-[42px]

          drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]

          sm:h-[46px]
          sm:w-[46px]
        "
        fill="currentColor"
      >
        <path d="M16.04 3C9.39 3 4 8.31 4 14.86c0 2.31.68 4.56 1.96 6.48L4 29l7.88-2.04a12.2 12.2 0 0 0 4.15.73h.01C22.68 27.69 28 22.38 28 15.83 28 9.28 22.69 3 16.04 3Zm0 22.68h-.01a10.1 10.1 0 0 1-5.14-1.4l-.37-.22-4.68 1.21 1.25-4.48-.24-.38a9.78 9.78 0 0 1-1.55-5.28c0-5.43 4.49-9.85 10.02-9.85 5.52 0 10.01 4.42 10.01 9.85 0 5.44-4.49 10.55-9.29 10.55Zm5.49-7.38c-.3-.15-1.78-.86-2.06-.96-.27-.1-.47-.15-.67.15-.2.29-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.14-1.27-.46-2.42-1.47a9.05 9.05 0 0 1-1.68-2.06c-.18-.3-.02-.45.13-.6.14-.13.3-.34.45-.51.15-.17.2-.29.3-.49.1-.19.05-.36-.02-.51-.08-.15-.68-1.61-.93-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.36-.27.3-1.04 1-1.04 2.44s1.07 2.83 1.22 3.03c.15.19 2.1 3.15 5.09 4.42.71.3 1.27.49 1.7.63.72.22 1.37.19 1.88.12.58-.08 1.78-.72 2.03-1.41.25-.7.25-1.29.18-1.42-.08-.12-.28-.19-.58-.34Z" />
      </svg>

      <span className="sr-only">
        WhatsApp
      </span>
    </a>
  );
}