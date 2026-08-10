"use client";

import {
  AlertCircle,
  Braces,
  ImageIcon,
  LoaderCircle,
  Replace,
  Trash2,
} from "lucide-react";

import {
  useMemo,
  useState,
} from "react";

import MediaAssetPicker from "@/components/media/MediaAssetPicker";

import {
  useGetMediaAssetByIdQuery,
} from "@/store/api/mediaApi";

import type {
  MediaAsset,
  MediaAssetClassification,
} from "@/types/media";

interface DynamicObjectEditorProps {
  title: string;
  description: string;
  value: Record<string, unknown>;
  onChange: (
    value: Record<string, unknown>
  ) => void;
}

interface DynamicFieldProps {
  fieldKey: string;
  value: unknown;
  onChange: (value: unknown) => void;
}

interface MediaFieldProps {
  fieldKey: string;
  value: string | null;
  onChange: (
    value: string | null
  ) => void;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const formatLabel = (
  value: string
): string => {
  return value
    .replace(
      /([a-z0-9])([A-Z])/g,
      "$1 $2"
    )
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
};

const isHexColor = (
  value: unknown
): value is string => {
  return (
    typeof value === "string" &&
    /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(
      value
    )
  );
};

const isUuid = (
  value: unknown
): value is string => {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    )
  );
};

const isMediaFieldKey = (
  fieldKey: string
): boolean => {
  const normalized =
    fieldKey.toLowerCase();

  return (
    normalized.endsWith(
      "assetid"
    ) ||
    normalized.endsWith(
      "mediaassetid"
    ) ||
    normalized === "assetid" ||
    normalized ===
      "mediaassetid" ||
    normalized.includes(
      "imageassetid"
    ) ||
    normalized.includes(
      "videoassetid"
    ) ||
    normalized.includes(
      "documentassetid"
    ) ||
    normalized.includes(
      "logoassetid"
    ) ||
    normalized.includes(
      "bannerassetid"
    ) ||
    normalized.includes(
      "backgroundassetid"
    )
  );
};

const getMediaClassification = (
  fieldKey: string
): MediaAssetClassification => {
  const normalized =
    fieldKey.toLowerCase();

  if (
    normalized.includes("product")
  ) {
    return "PRODUCT";
  }

  if (
    normalized.includes("brand") ||
    normalized.includes("logo")
  ) {
    return "BRAND";
  }

  if (
    normalized.includes("category")
  ) {
    return "CATEGORY";
  }

  if (
    normalized.includes(
      "promotion"
    ) ||
    normalized.includes("offer")
  ) {
    return "PROMOTION";
  }

  return "CMS";
};

const resolveMediaUrl = (
  url?: string | null
): string | null => {
  if (!url) {
    return null;
  }

  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
};

const getAssetPreviewUrl = (
  asset?: MediaAsset | null
): string | null => {
  if (!asset) {
    return null;
  }

  const previewVariant =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "PREVIEW" &&
        variant.format === "webp" &&
        variant.isActive
    );

  const thumbnailVariant =
    asset.variants?.find(
      (variant) =>
        variant.variantType ===
          "THUMBNAIL" &&
        variant.format === "webp" &&
        variant.isActive
    );

  return resolveMediaUrl(
    previewVariant?.publicUrl ||
      thumbnailVariant?.publicUrl ||
      asset.publicUrl
  );
};

function MediaField({
  fieldKey,
  value,
  onChange,
}: MediaFieldProps) {
  const [pickerOpen, setPickerOpen] =
    useState(false);

  const label = formatLabel(fieldKey);

  const validAssetId =
    isUuid(value) ? value : null;

  const {
    data: assetResponse,
    isLoading,
    isFetching,
    isError,
  } = useGetMediaAssetByIdQuery(
    validAssetId || "",
    {
      skip: !validAssetId,
    }
  );

  const asset =
    assetResponse?.data || null;

  const previewUrl =
    getAssetPreviewUrl(asset);

  const classification =
    getMediaClassification(
      fieldKey
    );

  const handleAssetSelection = (
    selectedAsset: MediaAsset
  ) => {
    onChange(selectedAsset.id);
    setPickerOpen(false);
  };

  return (
    <>
      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label className="text-sm font-medium">
            {label}
          </label>

          {value && (
            <span className="rounded-full bg-[#e3f1df] px-2 py-0.5 text-[10px] font-medium text-[#276749]">
              Selected
            </span>
          )}
        </div>

        {!value ? (
          <button
            type="button"
            onClick={() =>
              setPickerOpen(true)
            }
            className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-[#fafafa] px-5 text-center transition hover:border-[#8c9196] hover:bg-[#f6f6f7]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
              <ImageIcon
                size={21}
                className="text-[#6d7175]"
              />
            </div>

            <p className="mt-3 text-sm font-semibold">
              Choose media
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              Select an asset from the
              Digital Asset Library.
            </p>
          </button>
        ) : isLoading ||
          isFetching ? (
          <div className="flex min-h-[150px] items-center justify-center rounded-xl border border-[#e1e3e5] bg-[#fafafa]">
            <div className="text-center">
              <LoaderCircle
                size={21}
                className="mx-auto animate-spin"
              />

              <p className="mt-2 text-xs text-[#6d7175]">
                Loading media...
              </p>
            </div>
          </div>
        ) : asset ? (
          <div className="overflow-hidden rounded-xl border border-[#e1e3e5] bg-white">
            <div className="flex min-h-[180px] items-center justify-center bg-[#f6f6f7] p-4">
              {asset.assetType ===
                "IMAGE" &&
              previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={
                    asset.altText ||
                    asset.title ||
                    asset.originalFileName
                  }
                  className="max-h-[220px] w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon
                    size={38}
                    className="mx-auto text-[#8c9196]"
                  />

                  <p className="mt-2 text-xs font-medium">
                    {asset.assetType}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4">
              <p className="truncate text-sm font-semibold">
                {asset.title ||
                  asset.originalFileName}
              </p>

              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6d7175]">
                <span>
                  {asset.classification}
                </span>

                {asset.width &&
                  asset.height && (
                    <>
                      <span>•</span>

                      <span>
                        {asset.width} ×{" "}
                        {asset.height}
                      </span>
                    </>
                  )}

                <span>•</span>

                <span>
                  {asset.extension.toUpperCase()}
                </span>
              </div>

              <p className="mt-2 truncate font-mono text-[10px] text-[#8c9196]">
                {asset.id}
              </p>

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPickerOpen(true)
                  }
                  className="flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium hover:bg-[#f6f6f7]"
                >
                  <Replace size={15} />
                  Replace
                </button>

                <button
                  type="button"
                  onClick={() =>
                    onChange(null)
                  }
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={15} />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0 text-red-700"
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-red-800">
                  Media asset unavailable
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  {isError
                    ? "The selected asset could not be loaded."
                    : "The stored asset ID is invalid or no longer available."}
                </p>

                <p className="mt-2 truncate font-mono text-[10px] text-red-600">
                  {String(value)}
                </p>

                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPickerOpen(true)
                    }
                    className="h-9 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Choose replacement
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onChange(null)
                    }
                    className="h-9 rounded-lg border border-red-300 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-100"
                  >
                    Clear value
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
          {fieldKey}
        </p>
      </div>

      {pickerOpen && (
        <MediaAssetPicker
          key={
            validAssetId ||
            `${fieldKey}-empty`
          }
          isOpen
          selectedAssetId={
            validAssetId
          }
          title={`Select ${label}`}
          description={`Choose an asset for the ${label.toLowerCase()} field.`}
          classification={
            classification
          }
          allowPdf={
            fieldKey
              .toLowerCase()
              .includes("document") ||
            fieldKey
              .toLowerCase()
              .includes("pdf")
          }
          onClose={() =>
            setPickerOpen(false)
          }
          onSelect={
            handleAssetSelection
          }
        />
      )}
    </>
  );
}

const DynamicField = ({
  fieldKey,
  value,
  onChange,
}: DynamicFieldProps) => {
  const label = formatLabel(fieldKey);

  const mediaField =
    isMediaFieldKey(fieldKey);

  const isComplexValue =
    Array.isArray(value) ||
    (value !== null &&
      typeof value === "object");

  const [jsonText, setJsonText] =
    useState(() =>
      isComplexValue
        ? JSON.stringify(
            value,
            null,
            2
          )
        : ""
    );

  const [jsonError, setJsonError] =
    useState<string | null>(null);

  if (mediaField) {
    return (
      <MediaField
        fieldKey={fieldKey}
        value={
          typeof value === "string"
            ? value
            : null
        }
        onChange={onChange}
      />
    );
  }

  if (typeof value === "boolean") {
    return (
      <div className="flex items-start justify-between gap-5 rounded-xl border border-[#e1e3e5] bg-white p-4">
        <div>
          <label className="text-sm font-medium">
            {label}
          </label>

          <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
            {fieldKey}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            onChange(!value)
          }
          className={[
            "relative h-6 w-11 shrink-0 rounded-full transition",
            value
              ? "bg-[#303030]"
              : "bg-[#c9cccf]",
          ].join(" ")}
          aria-pressed={value}
          aria-label={`Toggle ${label}`}
        >
          <span
            className={[
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
              value
                ? "left-[22px]"
                : "left-0.5",
            ].join(" ")}
          />
        </button>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {label}
        </label>

        <input
          type="number"
          value={value}
          onChange={(event) => {
            const inputValue =
              event.target.value;

            onChange(
              inputValue === ""
                ? 0
                : Number(inputValue)
            );
          }}
          className="admin-input"
        />

        <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
          {fieldKey}
        </p>
      </div>
    );
  }

  if (isHexColor(value)) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {label}
        </label>

        <div className="flex items-center gap-2">
          <input
            type="color"
            value={value.slice(0, 7)}
            onChange={(event) =>
              onChange(
                event.target.value.toUpperCase()
              )
            }
            className="h-10 w-12 rounded-lg border border-[#8c9196] bg-white p-1"
          />

          <input
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            className="admin-input font-mono uppercase"
            maxLength={9}
          />
        </div>

        <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
          {fieldKey}
        </p>
      </div>
    );
  }

  if (typeof value === "string") {
    const useTextarea =
      value.length > 100 ||
      fieldKey
        .toLowerCase()
        .includes("description") ||
      fieldKey
        .toLowerCase()
        .includes("html") ||
      fieldKey
        .toLowerCase()
        .includes("text");

    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {label}
        </label>

        {useTextarea ? (
          <textarea
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            className="admin-input min-h-[110px] resize-y"
          />
        ) : (
          <input
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value
              )
            }
            className="admin-input"
          />
        )}

        <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
          {fieldKey}
        </p>
      </div>
    );
  }

  if (value === null) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          {label}
        </label>

        <input
          value=""
          onChange={(event) =>
            onChange(
              event.target.value ||
                null
            )
          }
          className="admin-input"
          placeholder="No value selected"
        />

        <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
          {fieldKey}
        </p>
      </div>
    );
  }

  if (isComplexValue) {
    const handleJsonChange = (
      nextText: string
    ) => {
      setJsonText(nextText);

      try {
        const parsed =
          JSON.parse(nextText);

        if (
          Array.isArray(value) &&
          !Array.isArray(parsed)
        ) {
          setJsonError(
            "This value must remain an array."
          );

          return;
        }

        if (
          !Array.isArray(value) &&
          (Array.isArray(parsed) ||
            parsed === null ||
            typeof parsed !==
              "object")
        ) {
          setJsonError(
            "This value must remain an object."
          );

          return;
        }

        setJsonError(null);
        onChange(parsed);
      } catch {
        setJsonError(
          "The JSON structure is not valid."
        );
      }
    };

    return (
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <Braces
            size={15}
            className="text-[#6d7175]"
          />

          <label className="text-sm font-medium">
            {label}
          </label>
        </div>

        <textarea
          value={jsonText}
          onChange={(event) =>
            handleJsonChange(
              event.target.value
            )
          }
          spellCheck={false}
          className={[
            "admin-input min-h-[180px] resize-y font-mono text-xs leading-5",
            jsonError
              ? "border-red-600"
              : "",
          ].join(" ")}
        />

        {jsonError && (
          <div className="mt-2 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle size={14} />
            {jsonError}
          </div>
        )}

        <p className="mt-1 font-mono text-[10px] text-[#8c9196]">
          {fieldKey}
        </p>
      </div>
    );
  }

  return null;
};

export default function DynamicObjectEditor({
  title,
  description,
  value,
  onChange,
}: DynamicObjectEditorProps) {
  const entries = useMemo(
    () =>
      Object.entries(value || {}),
    [value]
  );

  const handleFieldChange = (
    fieldKey: string,
    fieldValue: unknown
  ) => {
    onChange({
      ...value,
      [fieldKey]: fieldValue,
    });
  };

  return (
    <section className="admin-card overflow-hidden">
      <div className="border-b border-[#e1e3e5] px-6 py-5">
        <h2 className="text-base font-semibold">
          {title}
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          {description}
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <Braces
            size={30}
            className="mx-auto text-[#8c9196]"
          />

          <p className="mt-3 text-sm font-medium">
            No configurable fields
          </p>

          <p className="mt-1 text-sm text-[#6d7175]">
            This section currently has no
            predefined fields.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 p-6 md:grid-cols-2">
          {entries.map(
            ([fieldKey, fieldValue]) => {
              const fullWidth =
                isMediaFieldKey(
                  fieldKey
                ) ||
                Array.isArray(
                  fieldValue
                ) ||
                (fieldValue !== null &&
                  typeof fieldValue ===
                    "object");

              return (
                <div
                  key={fieldKey}
                  className={
                    fullWidth
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  <DynamicField
                    fieldKey={fieldKey}
                    value={fieldValue}
                    onChange={(
                      newValue
                    ) =>
                      handleFieldChange(
                        fieldKey,
                        newValue
                      )
                    }
                  />
                </div>
              );
            }
          )}
        </div>
      )}
    </section>
  );
}