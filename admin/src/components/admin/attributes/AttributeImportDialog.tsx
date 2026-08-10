"use client";

import {
  AlertCircle,
  CheckCircle2,
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
  useImportAttributesCsvMutation,
} from "@/store/api/attributeApi";

import type {
  AttributeImportMode,
  AttributeImportResponse,
} from "@/store/api/attributeApi";

/*
|--------------------------------------------------------------------------
| Props
|--------------------------------------------------------------------------
*/

interface AttributeImportDialogProps {
  open:
    boolean;

  onClose:
    () => void;

  onImported?:
    () => void;
}

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function AttributeImportDialog({
  open,
  onClose,
  onImported,
}: AttributeImportDialogProps) {
  const fileInputRef =
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
    useState<AttributeImportMode>(
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
    useState<AttributeImportResponse | null>(
      null
    );

  const [
    importAttributes,
    {
      isLoading,
    },
  ] =
    useImportAttributesCsvMutation();

  if (
    !open
  ) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Select File
  |--------------------------------------------------------------------------
  */

  const handleFileChange = (
    event:
      React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[
        0
      ] ||
      null;

    setResult(
      null
    );

    if (
      !selectedFile
    ) {
      setFile(
        null
      );

      return;
    }

    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(
          ".csv"
        )
    ) {
      toast.error(
        "Please select a CSV file."
      );

      event.target.value =
        "";

      setFile(
        null
      );

      return;
    }

    if (
      selectedFile.size >
      5 *
        1024 *
        1024
    ) {
      toast.error(
        "The CSV file cannot exceed 5 MB."
      );

      event.target.value =
        "";

      setFile(
        null
      );

      return;
    }

    setFile(
      selectedFile
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Reset
  |--------------------------------------------------------------------------
  */

  const resetDialog =
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
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Close
  |--------------------------------------------------------------------------
  */

  const handleClose =
    () => {
      if (
        isLoading
      ) {
        return;
      }

      resetDialog();

      onClose();
    };

  /*
  |--------------------------------------------------------------------------
  | Import
  |--------------------------------------------------------------------------
  */

  const handleImport =
    async () => {
      if (
        !file
      ) {
        toast.error(
          "Please select an attribute CSV file."
        );

        return;
      }

      setResult(
        null
      );

      try {
        const response =
          await importAttributes({
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
          summary.failed ===
          0
        ) {
          toast.success(
            `Attribute import completed. ${summary.created} created, ${summary.updated} updated and ${summary.skipped} skipped.`
          );
        } else if (
          summary.created >
            0 ||
          summary.updated >
            0 ||
          summary.skipped >
            0
        ) {
          toast.warning(
            `Import completed with ${summary.failed} failed row${
              summary.failed ===
              1
                ? ""
                : "s"
            }.`
          );
        } else {
          toast.error(
            "Attribute import failed."
          );
        }

        onImported?.();
      } catch (
        error
      ) {
        toast.error(
          getApiErrorMessage(
            error,
            "Unable to import attributes."
          )
        );
      }
    };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/*
      |--------------------------------------------------------------------------
      | Backdrop
      |--------------------------------------------------------------------------
      */}

      <button
        type="button"
        aria-label="Close attribute import dialog"
        onClick={
          handleClose
        }
        className="absolute inset-0 bg-black/40"
      />

      {/*
      |--------------------------------------------------------------------------
      | Dialog
      |--------------------------------------------------------------------------
      */}

      <div className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#e1e3e5] bg-white shadow-2xl">
        {/*
        |--------------------------------------------------------------------------
        | Header
        |--------------------------------------------------------------------------
        */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#e1e3e5] bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet
                size={
                  20
                }
              />

              <h2 className="text-lg font-semibold">
                Import attributes
              </h2>
            </div>

            <p className="mt-1 text-sm leading-6 text-[#6d7175]">
              Import attributes, selectable options and category assignments
              from a CSV file.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isLoading
            }
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#d2d5d8] bg-white text-[#5c5f62] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X
              size={
                18
              }
            />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/*
          |--------------------------------------------------------------------------
          | CSV Help
          |--------------------------------------------------------------------------
          */}

          <section className="rounded-xl border border-[#dfe3e8] bg-[#f6f6f7] p-4">
            <p className="text-sm font-semibold text-[#202223]">
              CSV format
            </p>

            <p className="mt-2 text-xs leading-5 text-[#6d7175]">
              Each CSV row represents one attribute. Existing attributes are
              matched using the attribute code.
            </p>

            <div className="mt-4 overflow-x-auto rounded-lg border border-[#e1e3e5] bg-white p-3">
              <code className="whitespace-nowrap text-xs text-[#454f5b]">
                name,code,description,inputType,dataType,unit,isVariantDefining,isFilterable,isSearchable,isComparable,isRequired,displayOrder,isActive,options,categorySlugs
              </code>
            </div>

            <div className="mt-4 space-y-3">
              <HelpRow
                title="Normal options"
                example="128 GB|256 GB|512 GB|1 TB"
              />

              <HelpRow
                title="Colour options"
                example="Black::black::#000000|White::white::#FFFFFF"
              />

              <HelpRow
                title="Category assignments"
                example="mobile-phones|tablets|laptops"
              />
            </div>

            <div className="mt-4 rounded-lg border border-[#e1e3e5] bg-white px-3 py-3 text-xs leading-5 text-[#6d7175]">
              <span className="font-semibold text-[#202223]">
                Important:
              </span>{" "}
              categorySlugs must match the actual active category slugs in the
              database.
            </div>
          </section>

          {/*
          |--------------------------------------------------------------------------
          | Select File
          |--------------------------------------------------------------------------
          */}

          <section>
            <label className="mb-2 block text-sm font-semibold text-[#202223]">
              CSV file
            </label>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current
                  ?.click()
              }
              disabled={
                isLoading
              }
              className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-[#fafbfb] px-6 py-8 text-center transition hover:border-[#8c9196] hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload
                size={
                  28
                }
                className="text-[#6d7175]"
              />

              {file ? (
                <>
                  <p className="mt-3 max-w-full truncate text-sm font-semibold text-[#202223]">
                    {
                      file.name
                    }
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    {
                      formatBytes(
                        file.size
                      )
                    }
                  </p>

                  <p className="mt-2 text-xs font-semibold text-[#2c6ecb]">
                    Click to choose another file
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-3 text-sm font-semibold text-[#202223]">
                    Select attribute CSV
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    CSV only, maximum file size 5 MB
                  </p>
                </>
              )}
            </button>

            <input
              ref={
                fileInputRef
              }
              type="file"
              accept=".csv,text/csv"
              onChange={
                handleFileChange
              }
              className="hidden"
            />
          </section>

          {/*
          |--------------------------------------------------------------------------
          | Import Mode
          |--------------------------------------------------------------------------
          */}

          <section>
            <label
              htmlFor="attribute-import-mode"
              className="mb-2 block text-sm font-semibold text-[#202223]"
            >
              Import mode
            </label>

            <select
              id="attribute-import-mode"
              value={
                importMode
              }
              onChange={(
                event
              ) =>
                setImportMode(
                  event.target
                    .value as AttributeImportMode
                )
              }
              disabled={
                isLoading
              }
              className="admin-input"
            >
              <option value="CREATE_OR_UPDATE">
                Create new and update existing
              </option>

              <option value="CREATE_ONLY">
                Create new only
              </option>

              <option value="UPDATE_ONLY">
                Update existing only
              </option>
            </select>

            <p className="mt-2 text-xs leading-5 text-[#6d7175]">
              CREATE_OR_UPDATE is normally the best option for maintaining the
              attribute master.
            </p>
          </section>

          {/*
          |--------------------------------------------------------------------------
          | Continue On Error
          |--------------------------------------------------------------------------
          */}

          <section>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-white p-4">
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
                disabled={
                  isLoading
                }
                className="mt-0.5 h-4 w-4 shrink-0 rounded"
              />

              <span>
                <span className="block text-sm font-semibold text-[#202223]">
                  Continue when a row fails
                </span>

                <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
                  Valid attributes will continue importing while invalid rows
                  are reported separately.
                </span>
              </span>
            </label>
          </section>

          {/*
          |--------------------------------------------------------------------------
          | Result
          |--------------------------------------------------------------------------
          */}

          {result ? (
            <ImportResult
              result={
                result
              }
            />
          ) : null}
        </div>

        {/*
        |--------------------------------------------------------------------------
        | Footer
        |--------------------------------------------------------------------------
        */}

        <div className="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-[#e1e3e5] bg-white px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isLoading
            }
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium text-[#202223] transition hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            {
              result
                ? "Close"
                : "Cancel"
            }
          </button>

          <button
            type="button"
            onClick={
              handleImport
            }
            disabled={
              !file ||
              isLoading
            }
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
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

/*
|--------------------------------------------------------------------------
| Help Row
|--------------------------------------------------------------------------
*/

function HelpRow({
  title,
  example,
}: {
  title:
    string;

  example:
    string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[#454f5b]">
        {
          title
        }
      </p>

      <div className="mt-1 overflow-x-auto rounded-md bg-white px-2.5 py-2">
        <code className="whitespace-nowrap text-[11px] text-[#6d7175]">
          {
            example
          }
        </code>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Import Result
|--------------------------------------------------------------------------
*/

function ImportResult({
  result,
}: {
  result:
    AttributeImportResponse;
}) {
  const summary =
    result.data
      .summary;

  const hasErrors =
    summary.failed >
    0;

  return (
    <section className="space-y-4">
      {/*
      |--------------------------------------------------------------------------
      | Summary
      |--------------------------------------------------------------------------
      */}

      <div
        className={[
          "rounded-xl border p-4",

          hasErrors
            ? "border-[#f0c36d] bg-[#fff8e5]"
            : "border-[#aee9d1] bg-[#f1f8f5]",
        ].join(
          " "
        )}
      >
        <div className="flex items-start gap-3">
          {hasErrors ? (
            <AlertCircle
              size={
                21
              }
              className="mt-0.5 shrink-0 text-[#8a6116]"
            />
          ) : (
            <CheckCircle2
              size={
                21
              }
              className="mt-0.5 shrink-0 text-[#008060]"
            />
          )}

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#202223]">
              {hasErrors
                ? "Import completed with errors"
                : "Import completed successfully"}
            </p>

            <p className="mt-1 text-xs leading-5 text-[#6d7175]">
              {
                summary.total
              }{" "}
              {summary.total ===
              1
                ? "row"
                : "rows"}{" "}
              processed.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          <SummaryBox
            label="Total"
            value={
              summary.total
            }
          />

          <SummaryBox
            label="Created"
            value={
              summary.created
            }
          />

          <SummaryBox
            label="Updated"
            value={
              summary.updated
            }
          />

          <SummaryBox
            label="Skipped"
            value={
              summary.skipped
            }
          />

          <SummaryBox
            label="Failed"
            value={
              summary.failed
            }
          />
        </div>
      </div>

      {/*
      |--------------------------------------------------------------------------
      | Successful / Processed Rows
      |--------------------------------------------------------------------------
      */}

      {result.data.results.length >
      0 ? (
        <div className="overflow-hidden rounded-xl border border-[#e1e3e5]">
          <div className="border-b border-[#e1e3e5] bg-[#f6f6f7] px-4 py-3">
            <p className="text-sm font-semibold text-[#202223]">
              Import results
            </p>
          </div>

          <div className="max-h-64 overflow-auto">
            <table className="min-w-full divide-y divide-[#e1e3e5] text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Row
                  </th>

                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Attribute
                  </th>

                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Code
                  </th>

                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#e1e3e5]">
                {result.data.results.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        `${item.rowNumber}-${item.code || index}`
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[#6d7175]">
                        {
                          item.rowNumber
                        }
                      </td>

                      <td className="px-4 py-3 font-medium text-[#202223]">
                        {
                          item.name ||
                          "—"
                        }
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-mono text-[#6d7175]">
                        {
                          item.code ||
                          "—"
                        }
                      </td>

                      <td className="px-4 py-3">
                        <ActionBadge
                          action={
                            item.action
                          }
                        />
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/*
      |--------------------------------------------------------------------------
      | Errors
      |--------------------------------------------------------------------------
      */}

      {result.data.errors.length >
      0 ? (
        <div className="overflow-hidden rounded-xl border border-[#f0b9ad]">
          <div className="border-b border-[#f0b9ad] bg-[#fbeae5] px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertCircle
                size={
                  16
                }
                className="text-[#a23b2a]"
              />

              <p className="text-sm font-semibold text-[#a23b2a]">
                Failed rows
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-auto">
            <table className="min-w-full divide-y divide-[#f0d7d1] text-left text-xs">
              <thead className="sticky top-0 bg-white">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Row
                  </th>

                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Attribute
                  </th>

                  <th className="px-4 py-3 font-semibold text-[#6d7175]">
                    Error
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#f0d7d1]">
                {result.data.errors.map(
                  (
                    item,
                    index
                  ) => (
                    <tr
                      key={
                        `${item.rowNumber}-${item.code || index}`
                      }
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-[#6d7175]">
                        {
                          item.rowNumber
                        }
                      </td>

                      <td className="px-4 py-3">
                        <p className="font-medium text-[#202223]">
                          {
                            item.name ||
                            "—"
                          }
                        </p>

                        {item.code ? (
                          <p className="mt-0.5 font-mono text-[11px] text-[#8c9196]">
                            {
                              item.code
                            }
                          </p>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 leading-5 text-[#a23b2a]">
                        {
                          item.message
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Summary Box
|--------------------------------------------------------------------------
*/

function SummaryBox({
  label,
  value,
}: {
  label:
    string;

  value:
    number;
}) {
  return (
    <div className="rounded-lg border border-black/5 bg-white px-3 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#8c9196]">
        {
          label
        }
      </p>

      <p className="mt-1 text-lg font-semibold text-[#202223]">
        {
          value
        }
      </p>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Action Badge
|--------------------------------------------------------------------------
*/

function ActionBadge({
  action,
}: {
  action:
    | "CREATED"
    | "UPDATED"
    | "SKIPPED"
    | undefined;
}) {
  if (
    action ===
    "CREATED"
  ) {
    return (
      <span className="inline-flex rounded-full bg-[#e3f1df] px-2 py-1 text-[10px] font-bold text-[#2c6e49]">
        CREATED
      </span>
    );
  }

  if (
    action ===
    "UPDATED"
  ) {
    return (
      <span className="inline-flex rounded-full bg-[#e7f3ff] px-2 py-1 text-[10px] font-bold text-[#2c6ecb]">
        UPDATED
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-[#f1f2f3] px-2 py-1 text-[10px] font-bold text-[#6d7175]">
      SKIPPED
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Format Bytes
|--------------------------------------------------------------------------
*/

function formatBytes(
  bytes:
    number
): string {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes /
    1024;

  if (
    kilobytes <
    1024
  ) {
    return `${kilobytes.toFixed(
      1
    )} KB`;
  }

  const megabytes =
    kilobytes /
    1024;

  return `${megabytes.toFixed(
    1
  )} MB`;
}

/*
|--------------------------------------------------------------------------
| API Error
|--------------------------------------------------------------------------
*/

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

          details?: Array<{
            message?:
              string;
          }>;
        };

        message?:
          string;
      };
    };

  const firstDetail =
    apiError.data
      ?.error
      ?.details
      ?.find(
        (
          item
        ) =>
          Boolean(
            item?.message
          )
      )
      ?.message;

  return (
    firstDetail ||
    apiError.data
      ?.error
      ?.message ||
    apiError.data
      ?.message ||
    fallback
  );
}