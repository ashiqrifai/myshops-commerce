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
  useImportCollectionsCsvMutation,
} from "@/store/api/collectionApi";

import type {
  CollectionImportMode,
  CollectionImportResponse,
} from "@/store/api/collectionApi";

interface CollectionImportDialogProps {
  open:
    boolean;

  onClose:
    () => void;
}

const TEMPLATE =
`name,slug,description,shortDescription,collectionType,sortOrder,isActive,isFeatured,showInMenu,showOnHome,isSearchable,showProductCount,publishedFrom,publishedUntil,metaTitle,metaDescription,metaKeywords,canonicalUrl,robotsIndex,robotsFollow
Flash Deals,flash-deals,Limited-time offers,Today's best deals,MANUAL,1,true,true,false,true,true,true,,,Flash Deals,Shop today's flash deals,flash deals,,true,true
New Arrivals,new-arrivals,Latest products,Recently added products,MANUAL,2,true,true,true,true,true,true,,,New Arrivals,Shop newly added products,new arrivals,,true,true
Samsung,samsung,Shop Samsung products,Samsung collection,MANUAL,3,true,false,true,false,true,true,,,Samsung,Shop Samsung products,samsung galaxy,,true,true
`;

export default function CollectionImportDialog({
  open,
  onClose,
}: CollectionImportDialogProps) {
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
    useState<CollectionImportMode>(
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
    useState<CollectionImportResponse | null>(
      null
    );

  const [
    importCollections,
    {
      isLoading,
    },
  ] =
    useImportCollectionsCsvMutation();

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
        "collection-import-template.csv";

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
          await importCollections({
            file,
            importMode,
            continueOnError,
          }).unwrap();

        setResult(
          response
        );

        const summary =
          response.data
            .summary;

        if (
          summary.failed >
            0
        ) {
          toast.warning(
            `Import completed with ${summary.failed} failed row(s).`
          );
        } else {
          toast.success(
            "Collections imported successfully."
          );
        }
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to import collections."
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
              Import collections
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Upload collection master data from a CSV file.
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
            className="flex size-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
            aria-label="Close collection import"
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
                <p className="text-sm font-semibold text-[#202223]">
                  CSV template
                </p>

                <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                  Use MANUAL or SMART for collectionType. Product assignments are managed separately.
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
            <label className="mb-2 block text-sm font-semibold text-[#202223]">
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
              ) => {
                setFile(
                  event.target
                    .files?.[
                      0
                    ] ||
                    null
                );

                setResult(
                  null
                );
              }}
              className="block w-full rounded-lg border border-[#babfc3] bg-white p-2 text-sm"
            />

            {file ? (
              <div className="mt-2 rounded-lg bg-[#f6f6f7] px-3 py-2">
                <p className="text-xs text-[#6d7175]">
                  Selected file
                </p>

                <p className="mt-0.5 truncate text-sm font-semibold text-[#202223]">
                  {
                    file.name
                  }
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-[#202223]">
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
                    .value as CollectionImportMode
                )
              }
              className="h-10 w-full rounded-lg border border-[#babfc3] bg-white px-3 text-sm outline-none focus:border-[#458fff] focus:ring-1 focus:ring-[#458fff]"
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

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-[#e1e3e5] p-3">
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
              className="mt-0.5 size-4"
            />

            <div>
              <p className="text-sm font-medium text-[#202223]">
                Continue when a row fails
              </p>

              <p className="mt-1 text-xs leading-5 text-[#6d7175]">
                Valid collections will still be imported even when another row contains an error.
              </p>
            </div>
          </label>

          {result ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#202223]">
                  Import summary
                </h3>

                <p className="mt-1 text-xs text-[#6d7175]">
                  Mode:{" "}
                  <span className="font-semibold">
                    {
                      result.data
                        .importMode
                    }
                  </span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <SummaryCard
                  label="Total"
                  value={
                    result.data
                      .summary
                      .total
                  }
                />

                <SummaryCard
                  label="Created"
                  value={
                    result.data
                      .summary
                      .created
                  }
                />

                <SummaryCard
                  label="Updated"
                  value={
                    result.data
                      .summary
                      .updated
                  }
                />

                <SummaryCard
                  label="Skipped"
                  value={
                    result.data
                      .summary
                      .skipped
                  }
                />

                <SummaryCard
                  label="Failed"
                  value={
                    result.data
                      .summary
                      .failed
                  }
                />
              </div>

              {result.data
                .results.length >
              0 ? (
                <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
                  <div className="bg-[#fafbfb] px-4 py-3 text-sm font-semibold text-[#202223]">
                    Imported rows
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {result.data
                      .results.map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              `${item.rowNumber}-${item.slug || index}`
                            }
                            className="flex flex-col gap-1 border-t border-[#e1e3e5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#202223]">
                                Row{" "}
                                {
                                  item.rowNumber
                                }

                                {item.name
                                  ? ` · ${item.name}`
                                  : ""}
                              </p>

                              <p className="mt-0.5 text-xs text-[#6d7175]">
                                {item.slug
                                  ? `Slug: ${item.slug}`
                                  : ""}

                                {item.slug &&
                                item.collectionType
                                  ? " · "
                                  : ""}

                                {item.collectionType
                                  ? `Type: ${item.collectionType}`
                                  : ""}
                              </p>

                              {item.message ? (
                                <p className="mt-1 text-xs text-[#6d7175]">
                                  {
                                    item.message
                                  }
                                </p>
                              ) : null}
                            </div>

                            {item.action ? (
                              <ActionBadge
                                action={
                                  item.action
                                }
                              />
                            ) : null}
                          </div>
                        )
                      )}
                  </div>
                </div>
              ) : null}

              {result.data
                .errors.length >
              0 ? (
                <div className="overflow-hidden rounded-xl border border-red-200">
                  <div className="bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    Import errors
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {result.data
                      .errors.map(
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
                            <p className="font-semibold text-[#202223]">
                              Row{" "}
                              {
                                error.rowNumber
                              }

                              {error.slug
                                ? ` · ${error.slug}`
                                : ""}
                            </p>

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

        <div className="flex flex-col-reverse gap-3 border-t border-[#e1e3e5] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-[#6d7175]">
            Images, landing pages and manual product assignments can be configured after import.
          </p>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={
                close
              }
              disabled={
                isLoading
              }
              className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-semibold hover:bg-[#f6f6f7] disabled:opacity-50"
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
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

function ActionBadge({
  action,
}: {
  action:
    | "CREATED"
    | "UPDATED"
    | "SKIPPED";
}) {
  const className =
    action ===
    "CREATED"
      ? "bg-emerald-50 text-emerald-700"
      : action ===
        "UPDATED"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={[
        "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold",
        className,
      ].join(
        " "
      )}
    >
      {action ===
      "CREATED"
        ? "Created"
        : action ===
          "UPDATED"
          ? "Updated"
          : "Skipped"}
    </span>
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