"use client";

import { useState } from "react";
import { CalendarClock, ImageIcon, LoaderCircle, Replace, Trash2 } from "lucide-react";
import ProductPicker from "@/components/cms/pickers/ProductPicker";
import CategoryPicker from "@/components/cms/pickers/CategoryPicker";
import BrandPicker from "@/components/cms/pickers/BrandPicker";
import MediaAssetPicker from "@/components/media/MediaAssetPicker";
import { useGetMediaAssetByIdQuery } from "@/store/api/mediaApi";
import type { MediaAsset } from "@/types/media";

type SourceType = "MANUAL" | "CATEGORY" | "BRAND";
type Layout = "SIDE_BANNER" | "BANNER_TOP" | "PRODUCTS_ONLY";

interface Content {
  badge?: string;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  buttonUrl?: string;
  openInNewTab?: boolean;
  desktopAssetId?: string | null;
  mobileAssetId?: string | null;
  productIds?: string[];
  categoryId?: string | null;
  brandId?: string | null;
  bookingStartAt?: string | null;
  bookingEndAt?: string | null;
}

interface Settings {
  sourceType?: SourceType;
  layout?: Layout;
  showLaunchDate?: boolean;
  showBookingDeadline?: boolean;
  showDeposit?: boolean;
  showCountdown?: boolean;
  showAvailabilityBadge?: boolean;
  showNavigation?: boolean;
  maximumProducts?: number;
}

interface Props {
  value: Record<string, unknown>;
  settings: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
  onSettingsChange: (value: Record<string, unknown>) => void;
}

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5080/api/v1")
  .replace(/\/api\/v1\/?$/, "");

const resolveUrl = (value?: string | null) => {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `${API_BASE_URL}${value.startsWith("/") ? value : `/${value}`}`;
};

const getPreview = (asset?: MediaAsset | null) => {
  if (!asset) return null;
  const preferred = ["PREVIEW", "THUMBNAIL", "MEDIUM", "SMALL", "ORIGINAL"];
  for (const type of preferred) {
    const variant = asset.variants?.find(
      (item) => item.variantType === type && item.isActive && item.publicUrl
    );
    if (variant?.publicUrl) return resolveUrl(variant.publicUrl);
  }
  const enriched = asset as MediaAsset & { previewUrl?: string | null; thumbnailUrl?: string | null };
  return resolveUrl(enriched.previewUrl) || resolveUrl(enriched.thumbnailUrl) || resolveUrl(asset.publicUrl);
};

const toDateTimeLocal = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-medium text-[#202223]">{children}</label>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex w-full items-center justify-between rounded-xl border bg-white p-4 text-left">
      <span className="text-sm font-medium">{label}</span>
      <span className={["relative h-6 w-11 rounded-full", value ? "bg-[#303030]" : "bg-[#c9cccf]"].join(" ")}>
        <span className={["absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition", value ? "left-[22px]" : "left-0.5"].join(" ")} />
      </span>
    </button>
  );
}

function MediaField({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  const [open, setOpen] = useState(false);
  const [localAsset, setLocalAsset] = useState<MediaAsset | null>(null);
  const { data, isFetching } = useGetMediaAssetByIdQuery(value || "", { skip: !value });
  const response = data as { data?: MediaAsset | { asset?: MediaAsset } } | undefined;
  const queried = response?.data && typeof response.data === "object" && "asset" in response.data
    ? response.data.asset || null
    : (response?.data as MediaAsset | undefined) || null;
  const asset = localAsset || queried;
  const preview = getPreview(asset);

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="border-b px-4 py-3 text-sm font-medium">{label}</div>
        {isFetching && !localAsset ? (
          <div className="flex aspect-[16/7] items-center justify-center bg-[#f6f6f7]"><LoaderCircle className="animate-spin" /></div>
        ) : preview ? (
          <div className="relative aspect-[16/7] bg-[#f6f6f7]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt={asset?.altText || asset?.title || label} className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-black/45 p-2">
              <button type="button" onClick={() => setOpen(true)} className="flex h-8 items-center gap-2 rounded-lg bg-white px-3 text-xs font-medium"><Replace size={14} />Replace</button>
              <button type="button" onClick={() => { setLocalAsset(null); onChange(null); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-red-600"><Trash2 size={14} /></button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setOpen(true)} className="flex aspect-[16/7] w-full flex-col items-center justify-center bg-[#f6f6f7] p-4">
            <ImageIcon size={26} className="text-[#8c9196]" />
            <span className="mt-2 text-sm font-semibold">Select image</span>
          </button>
        )}
      </div>

      <MediaAssetPicker
        isOpen={open}
        selectedAssetId={value}
        title={`Select ${label}`}
        description="Choose pre-booking artwork from the media library."
        classification="PROMOTION"
        onClose={() => setOpen(false)}
        onSelect={(selectedAsset) => {
          setLocalAsset(selectedAsset);
          onChange(selectedAsset.id);
          setOpen(false);
        }}
      />
    </>
  );
}

export default function PreBookingEditor({ value, settings, onChange, onSettingsChange }: Props) {
  const content = value as Content;
  const config = settings as Settings;
  const sourceType = String(config.sourceType || "MANUAL").trim().toUpperCase() as SourceType;
  const productIds = Array.isArray(content.productIds) ? content.productIds : [];
  const updateContent = (changes: Partial<Content>) => onChange({ ...value, ...changes });
  const updateSettings = (changes: Partial<Settings>) => onSettingsChange({ ...settings, ...changes });

  return (
    <div className="space-y-6">
      <section className="admin-card overflow-hidden">
        <div className="border-b px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#eef8f9] text-[#16828b]"><CalendarClock size={20} /></div>
            <div><h2 className="text-base font-semibold">Pre-booking campaign</h2><p className="mt-1 text-sm text-[#6d7175]">Promote upcoming products with launch information and reservation calls to action.</p></div>
          </div>
        </div>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div><Label>Badge</Label><input value={content.badge || ""} onChange={(e) => updateContent({ badge: e.target.value })} className="admin-input" placeholder="Coming Soon" /></div>
          <div><Label>Title</Label><input value={content.title || ""} onChange={(e) => updateContent({ title: e.target.value })} className="admin-input" /></div>
          <div className="md:col-span-2"><Label>Subtitle</Label><textarea rows={3} value={content.subtitle || ""} onChange={(e) => updateContent({ subtitle: e.target.value })} className="admin-input min-h-24" /></div>
          <div><Label>Button label</Label><input value={content.buttonLabel || ""} onChange={(e) => updateContent({ buttonLabel: e.target.value })} className="admin-input" /></div>
          <div><Label>Button URL</Label><input value={content.buttonUrl || ""} onChange={(e) => updateContent({ buttonUrl: e.target.value })} className="admin-input" placeholder="/pre-booking" /></div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b px-6 py-5"><h2 className="text-base font-semibold">Campaign media</h2></div>
        <div className="grid gap-5 p-6 lg:grid-cols-2">
          <MediaField label="Desktop banner" value={content.desktopAssetId || null} onChange={(desktopAssetId) => updateContent({ desktopAssetId })} />
          <MediaField label="Mobile banner" value={content.mobileAssetId || null} onChange={(mobileAssetId) => updateContent({ mobileAssetId })} />
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b px-6 py-5"><h2 className="text-base font-semibold">Booking window</h2></div>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div><Label>Booking starts</Label><input type="datetime-local" value={toDateTimeLocal(content.bookingStartAt)} onChange={(e) => updateContent({ bookingStartAt: e.target.value || null })} className="admin-input" /></div>
          <div><Label>Booking ends</Label><input type="datetime-local" value={toDateTimeLocal(content.bookingEndAt)} onChange={(e) => updateContent({ bookingEndAt: e.target.value || null })} className="admin-input" /></div>
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b px-6 py-5"><h2 className="text-base font-semibold">Product source</h2></div>
        <div className="space-y-6 p-6">
          <div><Label>Source type</Label><select value={sourceType} onChange={(e) => { const next = e.target.value as SourceType; updateSettings({ sourceType: next }); updateContent({ productIds: [], categoryId: null, brandId: null }); }} className="admin-input"><option value="MANUAL">Manual products</option><option value="CATEGORY">Category</option><option value="BRAND">Brand</option></select></div>
          {sourceType === "MANUAL" ? <ProductPicker selectedIds={productIds} onChange={(nextIds) => updateContent({ productIds: nextIds, categoryId: null, brandId: null })} /> : null}
          {sourceType === "CATEGORY" ? <CategoryPicker selectedId={content.categoryId || null} onChange={(categoryId) => updateContent({ categoryId, brandId: null, productIds: [] })} title="Select pre-booking category" description="Upcoming products from this category will be displayed." /> : null}
          {sourceType === "BRAND" ? <BrandPicker selectedId={content.brandId || null} onChange={(brandId) => updateContent({ brandId, categoryId: null, productIds: [] })} title="Select pre-booking brand" description="Upcoming products from this brand will be displayed." /> : null}
        </div>
      </section>

      <section className="admin-card overflow-hidden">
        <div className="border-b px-6 py-5"><h2 className="text-base font-semibold">Layout and display</h2></div>
        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div><Label>Layout</Label><select value={config.layout || "SIDE_BANNER"} onChange={(e) => updateSettings({ layout: e.target.value as Layout })} className="admin-input"><option value="SIDE_BANNER">Side banner and products</option><option value="BANNER_TOP">Banner above products</option><option value="PRODUCTS_ONLY">Products only</option></select></div>
          <div><Label>Maximum products</Label><input type="number" min={1} max={24} value={config.maximumProducts ?? 8} onChange={(e) => updateSettings({ maximumProducts: Number(e.target.value) })} className="admin-input" /></div>
          {(["showLaunchDate", "showBookingDeadline", "showDeposit", "showCountdown", "showAvailabilityBadge", "showNavigation"] as const).map((key) => <Toggle key={key} label={key.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase())} value={config[key] !== false} onChange={(next) => updateSettings({ [key]: next })} />)}
        </div>
      </section>
    </div>
  );
}
