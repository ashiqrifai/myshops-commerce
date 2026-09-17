"use client";

import {
  useState,
} from "react";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
} from "lucide-react";

import Link from "next/link";

import {
  toast,
} from "sonner";

import {
  useExecuteInventoryImportMutation,
  usePreviewInventoryImportMutation,
} from "@/store/api/inventoryImportApi";

import type {
  InventoryImportPreviewResponse,
} from "@/types/inventoryImport";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "";

export default function InventoryImportPage() {
  const [file, setFile] =
    useState<File | null>(
      null
    );

  const [
    previewData,
    setPreviewData,
  ] =
    useState<
      InventoryImportPreviewResponse["data"] |
        null
    >(null);

  const [
    previewImport,
    {
      isLoading:
        previewing,
    },
  ] =
    usePreviewInventoryImportMutation();

  const [
    executeImport,
    {
      isLoading:
        importing,
    },
  ] =
    useExecuteInventoryImportMutation();

  const handlePreview =
    async () => {
      if (!file) {
        toast.error(
          "Select a CSV file first."
        );
        return;
      }

      try {
        const result =
          await previewImport(
            file
          ).unwrap();

        setPreviewData(
          result.data
        );

        toast.success(
          "Preview generated successfully."
        );
      } catch (
        error: unknown
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to preview inventory import."
          )
        );
      }
    };

  const handleExecute =
    async () => {
      if (
        !previewData ||
        previewData.errors
          .length > 0
      ) {
        return;
      }

      try {
        const result =
          await executeImport({
            rows:
              previewData.rows,
          }).unwrap();

        toast.success(
          result.message ||
            "Inventory import completed successfully."
        );

        setPreviewData(
          null
        );

        setFile(
          null
        );
      } catch (
        error: unknown
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to execute inventory import."
          )
        );
      }
    };

  return (
    <main className="min-h-screen bg-[#f6f6f7]">
      <div className="mx-auto w-full max-w-[1450px] px-5 py-6 md:px-8">
        <div className="mb-5">
          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4d5156] hover:text-[#202223]"
          >
            <ArrowLeft
              size={16}
            />
            Back to inventory
          </Link>
        </div>

        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#202223]">
              Import location stock
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Upload absolute on-hand and reserved quantities by location and variant SKU.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`${API_URL}/inventory-import/template`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
            >
              <Download
                size={16}
              />
              Download template
            </a>

            <a
              href={`${API_URL}/inventory-import/export`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7]"
            >
              <FileSpreadsheet
                size={16}
              />
              Export current stock
            </a>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <label className="block">
              <span className="text-sm font-semibold text-[#202223]">
                CSV file
              </span>

              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  const selectedFile =
                    event.target
                      .files?.[0] ||
                    null;

                  setFile(
                    selectedFile
                  );

                  setPreviewData(
                    null
                  );
                }}
                className="mt-2 block w-full rounded-lg border border-[#babfc3] bg-white px-3 py-2 text-sm"
              />
            </label>

            <button
              type="button"
              onClick={
                handlePreview
              }
              disabled={
                !file ||
                previewing
              }
              className="self-end inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:opacity-50"
            >
              {previewing ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Upload
                  size={16}
                />
              )}
              Preview import
            </button>
          </div>
        </section>

        {previewData ? (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
              <Summary label="Total" value={previewData.summary.total} />
              <Summary label="Valid" value={previewData.summary.valid} />
              <Summary label="Create" value={previewData.summary.create} />
              <Summary label="Update" value={previewData.summary.update} />
              <Summary label="Unchanged" value={previewData.summary.unchanged} />
              <Summary label="Failed" value={previewData.summary.failed} />
            </section>

            {previewData.errors.length > 0 ? (
              <section className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle
                    size={18}
                  />
                  <h2 className="font-semibold">
                    Import contains errors
                  </h2>
                </div>

                <div className="mt-4 space-y-2">
                  {previewData.errors.map(
                    (
                      error,
                      index
                    ) => (
                      <div
                        key={`${error.rowNumber}-${index}`}
                        className="rounded-lg bg-white p-3 text-sm text-red-800"
                      >
                        <strong>
                          Row{" "}
                          {error.rowNumber}
                        </strong>
                        {" · "}
                        {error.locationCode || "—"}
                        {" · "}
                        {error.variantSku || "—"}
                        {" — "}
                        {error.message}
                      </div>
                    )
                  )}
                </div>
              </section>
            ) : (
              <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2
                    size={18}
                  />
                  <p className="font-semibold">
                    Preview is valid and ready to import.
                  </p>
                </div>
              </section>
            )}

            <section className="mt-6 overflow-hidden rounded-2xl border border-[#e1e3e5] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e1e3e5]">
                  <thead className="bg-[#fafbfb]">
                    <tr>
                      {[
                        "Row",
                        "Location",
                        "SKU",
                        "Product / Variant",
                        "Current On Hand",
                        "Current Reserved",
                        "New On Hand",
                        "New Reserved",
                        "Action",
                      ].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#6d7175]"
                          >
                            {heading}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-[#e1e3e5]">
                    {previewData.rows.map(
                      (row) => (
                        <tr
                          key={row.rowNumber}
                        >
                          <td className="px-4 py-3 text-sm">
                            {row.rowNumber}
                          </td>

                          <td className="px-4 py-3 text-sm font-semibold">
                            {row.locationCode}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            {row.variantSku}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            <p className="font-semibold">
                              {row.productName}
                            </p>
                            <p className="text-xs text-[#6d7175]">
                              {row.variantName}
                            </p>
                          </td>

                          <td className="px-4 py-3 text-sm">
                            {row.currentQuantityOnHand ?? "—"}
                          </td>

                          <td className="px-4 py-3 text-sm">
                            {row.currentQuantityReserved ?? "—"}
                          </td>

                          <td className="px-4 py-3 text-sm font-semibold">
                            {row.quantityOnHand}
                          </td>

                          <td className="px-4 py-3 text-sm font-semibold">
                            {row.quantityReserved}
                          </td>

                          <td className="px-4 py-3">
                            <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-semibold">
                              {row.action}
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={
                  handleExecute
                }
                disabled={
                  importing ||
                  previewData.errors
                    .length > 0
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#008060] px-6 text-sm font-semibold text-white hover:bg-[#006e52] disabled:opacity-50"
              >
                {importing ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <CheckCircle2
                    size={17}
                  />
                )}
                Import stock
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <p className="text-sm text-[#6d7175]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[#202223]">
        {value}
      </p>
    </div>
  );
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    typeof error !==
      "object" ||
    error === null
  ) {
    return fallback;
  }

  const apiError =
    error as {
      data?: {
        error?: {
          message?: string;
        };
        message?: string;
      };
    };

  return (
    apiError.data
      ?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}
