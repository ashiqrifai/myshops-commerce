"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  X,
} from "lucide-react";

import {
  useRef,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import {
  useImportGiftVoucherPromotionsMutation,
} from "@/store/api/giftVoucherPromotionImportApi";

import type {
  GiftVoucherImportResult,
} from "@/types/giftVoucherPromotionImport";

interface Props {
  open:
    boolean;

  onClose:
    () => void;

  onImported:
    () => void;
}

const getErrorMessage =
  (
    error:
      unknown
  ) => {
    const apiError =
      error as {
        data?: {
          message?:
            string;

          error?: {
            message?:
              string;
          } | string;
        };
      };

    if (
      typeof apiError.data
        ?.error ===
      "string"
    ) {
      return apiError.data.error;
    }

    return (
      (
        typeof apiError.data
          ?.error ===
        "object"
          ? apiError.data
              ?.error
              ?.message
          : null
      ) ||
      apiError.data
        ?.message ||
      "Unable to import Gift Voucher CSV."
    );
  };

export default function GiftVoucherImportDialog({
  open,
  onClose,
  onImported,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null
    );

  const [
    result,
    setResult,
  ] =
    useState<GiftVoucherImportResult | null>(
      null
    );

  const [
    importCsv,
    {
      isLoading,
    },
  ] =
    useImportGiftVoucherPromotionsMutation();

  if (
    !open
  ) {
    return null;
  }

  const close =
    () => {
      if (
        isLoading
      ) {
        return;
      }

      setFile(
        null
      );

      setResult(
        null
      );

      onClose();
    };

  const handleImport =
    async () => {
      if (
        !file
      ) {
        toast.error(
          "Select a CSV file first."
        );

        return;
      }

      try {
        const response =
          await importCsv(
            file
          ).unwrap();

        setResult(
          response.data
        );

        if (
          response.data
            .failedRows >
          0
        ) {
          toast.warning(
            `Import completed with ${response.data.failedRows} failed row(s).`
          );
        } else {
          toast.success(
            "Gift Voucher CSV imported successfully."
          );
        }

        onImported();
      } catch (
        error
      ) {
        toast.error(
          getErrorMessage(
            error
          )
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#e1e3e5] p-5">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Import Gift Voucher Promotions
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              One CSV row represents one SKU assignment. Rows with the same promotion code are grouped into one promotion.
            </p>
          </div>

          <button
            type="button"
            onClick={
              close
            }
            disabled={
              isLoading
            }
            className="inline-flex size-9 items-center justify-center rounded-lg border border-[#babfc3] hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            <X
              size={
                16
              }
            />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
            <p className="text-sm font-semibold text-[#202223]">
              Import behavior
            </p>

            <p className="mt-2 text-sm leading-6 text-[#6d7175]">
              Existing promotion codes are updated. Product/variant assignments for that promotion are replaced by the assignments in this CSV group. If any SKU inside a promotion cannot be resolved, that promotion is not imported, while other promotion groups continue.
            </p>
          </div>

          <button
            type="button"
            disabled={
              isLoading
            }
            onClick={() =>
              inputRef.current
                ?.click()
            }
            className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-white p-6 text-center hover:bg-[#fafbfb] disabled:opacity-50"
          >
            <FileUp
              size={
                28
              }
              className="text-[#6d7175]"
            />

            <span className="mt-3 text-sm font-semibold text-[#202223]">
              {file
                ? file.name
                : "Choose CSV file"}
            </span>

            <span className="mt-1 text-xs text-[#8c9196]">
              CSV only · maximum 10 MB
            </span>
          </button>

          <input
            ref={
              inputRef
            }
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(
              event
            ) => {
              const selected =
                event.target
                  .files
                  ?.[
                    0
                  ] ||
                null;

              setFile(
                selected
              );

              setResult(
                null
              );
            }}
          />

          {result ? (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Summary
                  label="Rows"
                  value={
                    result.totalRows
                  }
                />

                <Summary
                  label="Created"
                  value={
                    result.createdPromotions
                  }
                />

                <Summary
                  label="Updated"
                  value={
                    result.updatedPromotions
                  }
                />

                <Summary
                  label="Failed rows"
                  value={
                    result.failedRows
                  }
                />
              </div>

              <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
                <div className="border-b border-[#e1e3e5] bg-[#f6f6f7] px-4 py-3 text-sm font-semibold text-[#202223]">
                  Promotion results
                </div>

                <div className="max-h-56 overflow-y-auto">
                  {result.promotionResults.map(
                    promotion => (
                      <div
                        key={
                          `${promotion.promotionCode}:${promotion.status}`
                        }
                        className="flex items-start gap-3 border-b border-[#f1f2f3] px-4 py-3 text-sm last:border-b-0"
                      >
                        {promotion.status ===
                        "FAILED" ? (
                          <AlertCircle
                            size={
                              17
                            }
                            className="mt-0.5 shrink-0 text-red-600"
                          />
                        ) : (
                          <CheckCircle2
                            size={
                              17
                            }
                            className="mt-0.5 shrink-0 text-emerald-600"
                          />
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-[#202223]">
                            {promotion.promotionCode}
                          </p>

                          <p className="mt-0.5 text-xs text-[#6d7175]">
                            {promotion.status} · {promotion.rowCount} row(s)
                            {promotion.assignmentCount !==
                            undefined
                              ? ` · ${promotion.assignmentCount} assignment(s)`
                              : ""}
                          </p>

                          {promotion.message ? (
                            <p className="mt-1 text-xs text-[#8c9196]">
                              {promotion.message}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {result.errors.length ? (
                <div className="overflow-hidden rounded-xl border border-red-200">
                  <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                    Import errors
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {result.errors.map(
                      (
                        error,
                        index
                      ) => (
                        <div
                          key={
                            `${error.rowNumber || index}:${index}`
                          }
                          className="border-b border-red-100 px-4 py-3 text-sm last:border-b-0"
                        >
                          <p className="font-medium text-red-800">
                            Row {error.rowNumber || "—"}
                            {error.variantSku
                              ? ` · SKU ${error.variantSku}`
                              : ""}
                          </p>

                          <p className="mt-1 text-xs text-red-700">
                            {error.message}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e1e3e5] p-5">
          <button
            type="button"
            onClick={
              close
            }
            disabled={
              isLoading
            }
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold text-[#303030] hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() =>
              void handleImport()
            }
            disabled={
              isLoading ||
              !file
            }
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileUp
              size={
                16
              }
            />

            {isLoading
              ? "Importing..."
              : "Import CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Summary({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-[#6d7175]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-semibold text-[#202223]">
        {value}
      </p>
    </div>
  );
}
