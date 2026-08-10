"use client";

import type {
  ProductChannel,
  ProductChannelCode,
  ProductPublishStatus,
} from "@/types/product";

const CHANNELS: Array<{ code: ProductChannelCode; label: string; description: string }> = [
  { code: "WEBSITE", label: "Website", description: "Public ecommerce storefront." },
  { code: "KIOSK", label: "AI Kiosk", description: "In-store product discovery experience." },
];

export default function ProductChannelPanel({
  value,
  onChange,
}: {
  value: ProductChannel[];
  onChange: (value: ProductChannel[]) => void;
}) {
  const update = (code: ProductChannelCode, patch: Partial<ProductChannel>) => {
    const existing = value.find((item) => item.channelCode === code);
    const next: ProductChannel = {
      channelCode: code,
      isVisible: false,
      publishStatus: "DRAFT",
      channelTitle: null,
      channelDescription: null,
      ...existing,
      ...patch,
    };

    onChange([
      ...value.filter((item) => item.channelCode !== code),
      next,
    ]);
  };

  return (
    <div className="space-y-3">
      {CHANNELS.map((channel) => {
        const item =
          value.find((entry) => entry.channelCode === channel.code) ||
          ({
            channelCode: channel.code,
            isVisible: false,
            publishStatus: "DRAFT",
          } as ProductChannel);

        return (
          <div key={channel.code} className="rounded-xl border border-[#e1e3e5] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">{channel.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#6d7175]">{channel.description}</p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={item.isVisible}
                onClick={() => update(channel.code, { isVisible: !item.isVisible })}
                className={[
                  "relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition",
                  item.isVisible ? "bg-[#303030]" : "bg-[#babfc3]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
                    item.isVisible ? "left-[22px]" : "left-0.5",
                  ].join(" ")}
                />
              </button>
            </div>

            {item.isVisible && (
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <select
                  value={item.publishStatus}
                  onChange={(event) =>
                    update(channel.code, {
                      publishStatus: event.target.value as ProductPublishStatus,
                    })
                  }
                  className="admin-input"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="UNPUBLISHED">Unpublished</option>
                </select>

                <input
                  value={item.channelTitle || ""}
                  onChange={(event) => update(channel.code, { channelTitle: event.target.value })}
                  className="admin-input"
                  placeholder="Optional channel title"
                />

                <textarea
                  value={item.channelDescription || ""}
                  onChange={(event) => update(channel.code, { channelDescription: event.target.value })}
                  rows={3}
                  className="admin-input min-h-[90px] resize-y py-3 md:col-span-2"
                  placeholder="Optional channel-specific description"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
