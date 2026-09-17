"use client";

import { ArrowDown, ArrowUp, ImageIcon, LoaderCircle, Plus, Replace, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import MediaAssetPicker from "@/components/media/MediaAssetPicker";
import { useGetMediaAssetByIdQuery } from "@/store/api/mediaApi";
import type { MediaAsset } from "@/types/media";

interface Props {
  value: Record<string, unknown>;
  settings: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onSettingsChange: (value: Record<string, unknown>) => void;
}

interface Slide {
  id: string;
  text: string;
  linkText: string;
  linkUrl: string;
  desktopAssetId: string | null;
  mobileAssetId: string | null;
  backgroundColor: string;
  textColor: string;
  isActive: boolean;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5080/api/v1")
  .replace(/\/api\/v1\/?$/, "");

const newId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `announcement-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const emptySlide = (): Slide => ({
  id: newId(),
  text: "",
  linkText: "",
  linkUrl: "",
  desktopAssetId: null,
  mobileAssetId: null,
  backgroundColor: "#28ABB5",
  textColor: "#FFFFFF",
  isActive: true,
});

const normalizeSlide = (input: unknown): Slide => {
  const s = input && typeof input === "object" && !Array.isArray(input)
    ? input as Record<string, unknown>
    : {};
  return {
    id: typeof s.id === "string" && s.id ? s.id : newId(),
    text: typeof s.text === "string" ? s.text : "",
    linkText: typeof s.linkText === "string" ? s.linkText : "",
    linkUrl: typeof s.linkUrl === "string" ? s.linkUrl : "",
    desktopAssetId: typeof s.desktopAssetId === "string" ? s.desktopAssetId : null,
    mobileAssetId: typeof s.mobileAssetId === "string" ? s.mobileAssetId : null,
    backgroundColor: typeof s.backgroundColor === "string" ? s.backgroundColor : "#28ABB5",
    textColor: typeof s.textColor === "string" ? s.textColor : "#FFFFFF",
    isActive: s.isActive !== false,
  };
};

const resolveUrl = (url?: string | null) => {
  if (!url) return null;
  return /^https?:\/\//.test(url) ? url : `${API_BASE_URL}${url}`;
};

const previewUrl = (asset?: MediaAsset | null) => {
  if (!asset) return null;
  const preferred = ["PREVIEW", "THUMBNAIL", "MEDIUM", "SMALL", "ORIGINAL"];
  for (const kind of preferred) {
    const v = asset.variants?.find(
      (x) => x.variantType === kind && x.isActive && Boolean(x.publicUrl)
    );
    if (v?.publicUrl) return resolveUrl(v.publicUrl);
  }
  return resolveUrl(asset.publicUrl);
};

function MediaField({
  label, value, onChange,
}: {
  label: string;
  value: string | null;
  onChange: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isFetching } = useGetMediaAssetByIdQuery(value || "", {
    skip: !value,
  });
  const asset = data?.data || null;
  const url = previewUrl(asset);

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium">{label}</label>
        {!value ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex min-h-[120px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-[#fafafa] p-4"
          >
            <ImageIcon size={20} className="text-[#6d7175]" />
            <span className="mt-2 text-xs font-semibold">Choose image</span>
          </button>
        ) : isLoading || isFetching ? (
          <div className="flex min-h-[120px] items-center justify-center rounded-xl border border-[#e1e3e5]">
            <LoaderCircle size={20} className="animate-spin" />
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
            <div className="flex h-[120px] items-center justify-center bg-[#f6f6f7] p-2">
              {url ? <img src={url} alt={asset?.altText || asset?.title || label} className="h-full w-full object-contain" /> : <ImageIcon size={24} />}
            </div>
            <div className="flex gap-2 p-2">
              <button type="button" onClick={() => setOpen(true)} className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg border border-[#babfc3] text-xs">
                <Replace size={13} /> Replace
              </button>
              <button type="button" onClick={() => onChange(null)} className="flex h-8 items-center rounded-lg border border-red-200 px-2 text-red-600">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {open ? (
        <MediaAssetPicker
          isOpen
          selectedAssetId={value}
          title={`Select ${label}`}
          description="Select an image from the Digital Asset Library."
          classification="CMS"
          allowPdf={false}
          onClose={() => setOpen(false)}
          onSelect={(asset) => {
            onChange(asset.id);
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

export default function AnnouncementBarEditor({
  value, settings, onChange, onSettingsChange,
}: Props) {
  const slides = useMemo(
    () => (Array.isArray(value.slides) ? value.slides : Array.isArray(value.items) ? value.items : []).map(normalizeSlide),
    [value.slides, value.items]
  );

  const saveSlides = (next: Slide[]) =>
    onChange({ ...value, items: undefined, slides: next });

  const patchSlide = (index: number, patch: Partial<Slide>) =>
    saveSlides(slides.map((s, i) => i === index ? { ...s, ...patch } : s));

  const setting = (key: string, next: unknown) =>
    onSettingsChange({ ...settings, [key]: next });

  const move = (index: number, by: -1 | 1) => {
    const target = index + by;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target], next[index]];
    saveSlides(next);
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <h2 className="text-base font-semibold">Announcement carousel</h2>
        <p className="mt-1 text-sm text-[#6d7175]">Create rotating announcement slides with optional desktop and mobile artwork.</p>
      </div>

      <div className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <span className="mb-1 block text-sm font-medium">Transition</span>
            <select value={typeof settings.transition === "string" ? settings.transition : "FADE"} onChange={(e) => setting("transition", e.target.value)} className="admin-input">
              <option value="FADE">Fade</option>
              <option value="SLIDE_LEFT">Slide left</option>
              <option value="SLIDE_RIGHT">Slide right</option>
              <option value="SLIDE_UP">Slide up</option>
              <option value="SLIDE_DOWN">Slide down</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Slide duration (ms)</span>
            <input type="number" min={1500} step={500} value={typeof settings.autoplayDelayMs === "number" ? settings.autoplayDelayMs : 4000} onChange={(e) => setting("autoplayDelayMs", Number(e.target.value))} className="admin-input" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Desktop height</span>
            <input type="number" min={30} value={typeof settings.height === "number" ? settings.height : 36} onChange={(e) => setting("height", Number(e.target.value))} className="admin-input" />
          </label>

          <label>
            <span className="mb-1 block text-sm font-medium">Mobile height</span>
            <input type="number" min={30} value={typeof settings.mobileHeight === "number" ? settings.mobileHeight : 36} onChange={(e) => setting("mobileHeight", Number(e.target.value))} className="admin-input" />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={settings.autoplay !== false} onChange={(e) => setting("autoplay", e.target.checked)} />
          Autoplay
        </label>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Slides ({slides.length})</h3>
          <button type="button" onClick={() => saveSlides([...slides, emptySlide()])} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white">
            <Plus size={16} /> Add slide
          </button>
        </div>

        {slides.map((slide, index) => (
          <div key={slide.id} className="rounded-xl border border-[#e1e3e5] bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Slide {index + 1}</p>
                <p className="mt-1 text-xs text-[#6d7175]">{slide.text || "Image-only announcement"}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" disabled={index === 0} onClick={() => move(index, -1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d2d5d8] disabled:opacity-30"><ArrowUp size={14} /></button>
                <button type="button" disabled={index === slides.length - 1} onClick={() => move(index, 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d2d5d8] disabled:opacity-30"><ArrowDown size={14} /></button>
                <button type="button" onClick={() => saveSlides(slides.filter((_, i) => i !== index))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <MediaField label="Desktop image" value={slide.desktopAssetId} onChange={(desktopAssetId) => patchSlide(index, { desktopAssetId })} />
              <MediaField label="Mobile image" value={slide.mobileAssetId} onChange={(mobileAssetId) => patchSlide(index, { mobileAssetId })} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1 block text-sm font-medium">Announcement text</span>
                <input value={slide.text} onChange={(e) => patchSlide(index, { text: e.target.value })} className="admin-input" placeholder="Free Delivery in Dubai, Abu Dhabi & Sharjah" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Link text</span>
                <input value={slide.linkText} onChange={(e) => patchSlide(index, { linkText: e.target.value })} className="admin-input" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Link URL</span>
                <input value={slide.linkUrl} onChange={(e) => patchSlide(index, { linkUrl: e.target.value })} className="admin-input" placeholder="/collections/back-to-school-promotions" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Background color</span>
                <input type="color" value={slide.backgroundColor} onChange={(e) => patchSlide(index, { backgroundColor: e.target.value })} className="h-10 w-full rounded-lg border border-[#d2d5d8] p-1" />
              </label>
              <label>
                <span className="mb-1 block text-sm font-medium">Text color</span>
                <input type="color" value={slide.textColor} onChange={(e) => patchSlide(index, { textColor: e.target.value })} className="h-10 w-full rounded-lg border border-[#d2d5d8] p-1" />
              </label>
            </div>

            <label className="mt-4 inline-flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={slide.isActive} onChange={(e) => patchSlide(index, { isActive: e.target.checked })} />
              Active
            </label>
          </div>
        ))}
      </div>
    </section>
  );
}
