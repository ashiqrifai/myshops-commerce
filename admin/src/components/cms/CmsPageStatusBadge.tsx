import type {
    CmsPageChannel,
    CmsPageStatus,
  } from "@/types/cms";
  
  interface CmsPageStatusBadgeProps {
    status?: CmsPageStatus;
    channel?: CmsPageChannel;
    isActive?: boolean;
  }
  
  const statusClasses: Record<
    CmsPageStatus,
    string
  > = {
    DRAFT:
      "bg-[#f1f2f3] text-[#4a4f53]",
    PUBLISHED:
      "bg-[#e3f1df] text-[#276749]",
    UNPUBLISHED:
      "bg-[#fff4e5] text-[#8a6116]",
    ARCHIVED:
      "bg-[#fbeae5] text-[#a23b2a]",
  };
  
  const channelClasses: Record<
    CmsPageChannel,
    string
  > = {
    WEBSITE:
      "bg-[#e8f3ff] text-[#245d8c]",
    KIOSK:
      "bg-[#f0eaff] text-[#6842a8]",
    BOTH:
      "bg-[#e9f7ef] text-[#276749]",
  };
  
  export default function CmsPageStatusBadge({
    status,
    channel,
    isActive,
  }: CmsPageStatusBadgeProps) {
    if (status) {
      return (
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
            statusClasses[status],
          ].join(" ")}
        >
          {status
            .toLowerCase()
            .replace("_", " ")
            .replace(/\b\w/g, (value) =>
              value.toUpperCase()
            )}
        </span>
      );
    }
  
    if (channel) {
      return (
        <span
          className={[
            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
            channelClasses[channel],
          ].join(" ")}
        >
          {channel === "KIOSK"
            ? "Android Kiosk"
            : channel === "BOTH"
              ? "Website & Kiosk"
              : "Website"}
        </span>
      );
    }
  
    return (
      <span
        className={[
          "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
          isActive
            ? "bg-[#e3f1df] text-[#276749]"
            : "bg-[#fbeae5] text-[#a23b2a]",
        ].join(" ")}
      >
        {isActive ? "Enabled" : "Disabled"}
      </span>
    );
  }