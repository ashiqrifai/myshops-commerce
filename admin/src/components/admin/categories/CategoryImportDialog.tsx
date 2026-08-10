"use client";

import {
  FileSpreadsheet,
  LoaderCircle,
  Upload,
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
  useImportCategoriesCsvMutation,
} from "@/store/api/categoryApi";

import type {
  CategoryImportMode,
  CategoryImportResponse,
} from "@/store/api/categoryApi";

interface CategoryImportDialogProps {
  open:
    boolean;

  onClose:
    () => void;
}

const TEMPLATE =
`name,slug,parentSlug,sortOrder,isActive,showInMenu,showOnHome,isFeatured,isSearchable
Mobiles,mobiles,,1,true,true,true,true,true
Apple,apple,mobiles,1,true,true,false,false,true
Samsung,samsung,mobiles,2,true,true,false,false,true
Accessories,accessories,,2,true,true,true,false,true
Cases,cases,accessories,1,true,true,false,false,true
`;

export default function CategoryImportDialog({
  open,
  onClose,
}: CategoryImportDialogProps) {
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
    importMode,
    setImportMode,
  ] =
    useState<CategoryImportMode>(
      "CREATE_OR_UPDATE"
    );

  const [
    continueOnError,
    setContinueOnError,
  ] =
    useState(
      true
    );

  const [
    result,
    setResult,
  ] =
    useState<CategoryImportResponse | null>(
      null
    );

  const [
    importCategories,
    {
      isLoading,
    },
  ] =
    useImportCategoriesCsvMutation();

  if (
    !open
  ) {
    return null;
  }

  const reset =
    () => {
      setFile(
        null
      );

      setResult(
        null
      );

      setImportMode(
        "CREATE_OR_UPDATE"
      );

      setContinueOnError(
        true
      );

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    };

  const close =
    () => {
      if (
        isLoading
      ) {
        return;
      }

      reset();
      onClose();
    };

  const downloadTemplate =
    () => {
      const blob =
        new Blob(
          [
            TEMPLATE,
          ],
          {
            type:
              "text/csv;charset=utf-8",
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          "a"
        );

      anchor.href =
        url;

      anchor.download =
        "category-import-template.csv";

      document.body.appendChild(
        anchor
      );

      anchor.click();

      anchor.remove();

      URL.revokeObjectURL(
        url
      );
    };

  const submit =
    async () => {
      if (
        !file
      ) {
        toast.error(
          "Please select a CSV file."
        );

        return;
      }

      try {
        const response =
          await importCategories({
            file,
            importMode,
            continueOnError,
          }).unwrap();

        setResult(
          response
        );

        const summary =
          response.data.summary;

        if (
          summary.failed >
            0
        ) {
          toast.warning(
            `Import completed with ${summary.failed} failed row(s).`
          );
        } else {
          toast.success(
            "Categories imported successfully."
          );
        }
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to import categories."
          )
        );
      }
    };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#e1e3e5] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Import categories
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Upload categories and category hierarchy from CSV.
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
            className="flex size-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3]"
          >
            <X
              size={
                19
              }
            />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-xl border border-[#c9cccf] bg-[#fafbfb] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold">
                  CSV template
                </p>

                <p className="mt-1 text-xs text-[#6d7175]">
                  Use parentSlug to create category hierarchy.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  downloadTemplate
                }
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7]"
              >
                <FileSpreadsheet
                  size={
                    16
                  }
                />

                Download template
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              CSV file
            </label>

            <input
              ref={
                inputRef
              }
              type="file"
              accept=".csv,text/csv"
              onChange={(
                event
              ) =>
                setFile(
                  event.target
                    .files?.[
                      0
                    ] ||
                    null
                )
              }
              className="block w-full rounded-lg border border-[#babfc3] bg-white p-2 text-sm"
            />

            {file ? (
              <p className="mt-2 text-xs text-[#6d7175]">
                Selected:{" "}
                <span className="font-semibold text-[#202223]">
                  {
                    file.name
                  }
                </span>
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">
              Import mode
            </label>

            <select
              value={
                importMode
              }
              onChange={(
                event
              ) =>
                setImportMode(
                  event.target
                    .value as CategoryImportMode
                )
              }
              className="h-10 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm outline-none focus:border-[#458fff]"
            >
              <option value="CREATE_OR_UPDATE">
                Create or update
              </option>

              <option value="CREATE_ONLY">
                Create only
              </option>

              <option value="UPDATE_ONLY">
                Update only
              </option>
            </select>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#e1e3e5] p-3">
            <input
              type="checkbox"
              checked={
                continueOnError
              }
              onChange={(
                event
              ) =>
                setContinueOnError(
                  event.target
                    .checked
                )
              }
              className="size-4"
            />

            <div>
              <p className="text-sm font-medium">
                Continue when a row fails
              </p>

              <p className="text-xs text-[#6d7175]">
                Valid rows will still be imported when other rows contain errors.
              </p>
            </div>
          </label>

          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SummaryCard
                  label="Total"
                  value={
                    result.data
                      .summary.total
                  }
                />

                <SummaryCard
                  label="Created"
                  value={
                    result.data
                      .summary.created
                  }
                />

                <SummaryCard
                  label="Updated"
                  value={
                    result.data
                      .summary.updated
                  }
                />

                <SummaryCard
                  label="Skipped"
                  value={
                    result.data
                      .summary.skipped
                  }
                />

                <SummaryCard
                  label="Failed"
                  value={
                    result.data
                      .summary.failed
                  }
                />
              </div>

              {result.data.errors.length >
              0 ? (
                <div className="overflow-hidden rounded-xl border border-red-200">
                  <div className="bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    Import errors
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {result.data.errors.map(
                      (
                        error,
                        index
                      ) => (
                        <div
                          key={
                            `${error.rowNumber}-${index}`
                          }
                          className="border-t border-red-100 px-4 py-3 text-sm"
                        >
                          <span className="font-semibold">
                            Row{" "}
                            {
                              error.rowNumber
                            }
                          </span>

                          {error.slug
                            ? ` · ${error.slug}`
                            : ""}

                          <p className="mt-1 text-red-700">
                            {
                              error.message
                            }
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

        <div className="flex items-center justify-end gap-3 border-t border-[#e1e3e5] px-6 py-4">
          <button
            type="button"
            onClick={
              close
            }
            disabled={
              isLoading
            }
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() =>
              void submit()
            }
            disabled={
              !file ||
              isLoading
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <LoaderCircle
                size={
                  16
                }
                className="animate-spin"
              />
            ) : (
              <Upload
                size={
                  16
                }
              />
            )}

            {isLoading
              ? "Importing..."
              : "Import CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-3 text-center">
      <div className="text-xl font-bold text-[#202223]">
        {value}
      </div>

      <div className="mt-1 text-xs text-[#6d7175]">
        {label}
      </div>
    </div>
  );
}

function getApiErrorMessage(
  error:
    unknown,
  fallback:
    string
): string {
  if (
    typeof error !==
      "object" ||
    error ===
      null
  ) {
    return fallback;
  }

  const apiError =
    error as {
      data?: {
        error?: {
          message?:
            string;
        };

        message?:
          string;
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