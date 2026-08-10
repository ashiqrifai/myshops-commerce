"use client";

import {
  ChangeEvent,
  DragEvent,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useSelector,
} from "react-redux";

import type {
  RootState,
} from "@/store";

import {
  useExecuteProductImportMutation,
  usePreviewProductImportMutation,
} from "@/store/api/productImportApi";

import type {
  ExecutionResponse,
  ImportMode,
  PreviewProduct,
  PreviewResponse,
  ProductAction,
} from "@/store/api/productImportApi";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

function formatBytes(
  bytes?: number
): string {
  if (
    bytes === undefined ||
    bytes === null
  ) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kilobytes =
    bytes / 1024;

  if (kilobytes < 1024) {
    return `${kilobytes.toFixed(1)} KB`;
  }

  return `${(
    kilobytes / 1024
  ).toFixed(1)} MB`;
}

function getActionClasses(
  action: ProductAction
): string {
  switch (action) {
    case "CREATE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "UPDATE":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "NO_CHANGE":
      return "bg-slate-100 text-slate-700 ring-slate-500/20";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function getExecutionErrorText(
  error:
    | string
    | {
        message?: string;
        code?: string | null;
      }
): string {
  if (typeof error === "string") {
    return error;
  }

  return error.message || "Execution failed.";
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (
    typeof error === "object" &&
    error !== null
  ) {
    const candidate =
      error as {
        data?: {
          message?: string;
          error?: {
            message?: string;
          };
        };
        error?: string;
        message?: string;
      };

    return (
      candidate.data?.message ||
      candidate.data?.error?.message ||
      candidate.error ||
      candidate.message ||
      fallback
    );
  }

  return fallback;
}

export default function ProductImportPage() {
  const inputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const accessToken =
    useSelector(
      (state: RootState) =>
        state.auth.accessToken
    );

  const [
    previewProductImportRequest,
    {
      isLoading:
        isPreviewing,
    },
  ] =
    usePreviewProductImportMutation();

  const [
    executeProductImportRequest,
    {
      isLoading:
        isExecuting,
    },
  ] =
    useExecuteProductImportMutation();

  const [
    selectedFile,
    setSelectedFile,
  ] = useState<File | null>(
    null
  );

  const [
    importMode,
    setImportMode,
  ] = useState<ImportMode>(
    "CREATE_OR_UPDATE"
  );

  const [
    removeEmptyRows,
    setRemoveEmptyRows,
  ] = useState(true);

  const [
    continueOnError,
    setContinueOnError,
  ] = useState(true);

  const [
    isDragging,
    setIsDragging,
  ] = useState(false);

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    previewResponse,
    setPreviewResponse,
  ] =
    useState<PreviewResponse | null>(
      null
    );

  const [
    executionResponse,
    setExecutionResponse,
  ] =
    useState<ExecutionResponse | null>(
      null
    );

  const preview =
    previewResponse?.data || null;

  const validProducts =
    useMemo(
      () =>
        preview?.products.filter(
          (product) =>
            product.valid === true
        ) || [],
      [preview]
    );

  const invalidProducts =
    useMemo(
      () =>
        preview?.products.filter(
          (product) =>
            product.valid !== true
        ) || [],
      [preview]
    );

  const resetMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const resetResults = () => {
    setPreviewResponse(null);
    setExecutionResponse(null);
  };

  const validateFile = (
    file: File
  ): string | null => {
    const isCsv =
      file.name
        .toLowerCase()
        .endsWith(".csv");

    if (!isCsv) {
      return "Please select a CSV file.";
    }

    const maxSize =
      10 * 1024 * 1024;

    if (file.size > maxSize) {
      return "The CSV file must not exceed 10 MB.";
    }

    return null;
  };

  const selectFile = (
    file: File
  ) => {
    resetMessages();
    resetResults();

    const validationError =
      validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setErrorMessage(
        validationError
      );
      return;
    }

    setSelectedFile(file);
    setSuccessMessage(
      `${file.name} is ready for preview.`
    );
  };

  const handleFileChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      event.target.files?.[0];

    if (file) {
      selectFile(file);
    }

    event.target.value = "";
  };

  const handleDragOver = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (
    event: DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      selectFile(file);
    }
  };

  const downloadTemplate =
    async (
      includeExamples: boolean
    ) => {
      resetMessages();

      if (!accessToken) {
        setErrorMessage(
          "Your login session is unavailable. Please log in again."
        );
        return;
      }

      setIsDownloading(true);

      try {
        const response =
          await fetch(
            `${API_URL}/product-import/template/download?includeExamples=${includeExamples}`,
            {
              method:
                "GET",

              credentials:
                "include",

              headers: {
                Authorization:
                  `Bearer ${accessToken}`,
              },
            }
          );

        if (!response.ok) {
          let message =
            "Template download failed.";

          try {
            const errorBody =
              await response.json();

            message =
              errorBody?.message ||
              errorBody?.error?.message ||
              message;
          } catch {
            // Response was not JSON.
          }

          throw new Error(
            message
          );
        }

        const blob =
          await response.blob();

        const disposition =
          response.headers.get(
            "content-disposition"
          );

        const fileNameMatch =
          disposition?.match(
            /filename="?([^"]+)"?/
          );

        const fileName =
          fileNameMatch?.[1] ||
          (
            includeExamples
              ? "product-import-example.csv"
              : "product-import-template.csv"
          );

        const objectUrl =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          objectUrl;

        anchor.download =
          fileName;

        document.body.appendChild(
          anchor
        );

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(
          objectUrl
        );

        setSuccessMessage(
          `${fileName} downloaded successfully.`
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Template download failed."
        );
      } finally {
        setIsDownloading(false);
      }
    };

  const previewImport =
    async () => {
      resetMessages();
      setExecutionResponse(
        null
      );

      if (!selectedFile) {
        setErrorMessage(
          "Please select a CSV file first."
        );
        return;
      }

      try {
        const body =
          await previewProductImportRequest({
            file:
              selectedFile,

            importMode,

            removeEmptyRows,
          }).unwrap();

        setPreviewResponse(
          body
        );

        if (
          body.data.hasErrors
        ) {
          setErrorMessage(
            "Preview completed. Correct the highlighted validation errors before executing."
          );
        } else {
          setSuccessMessage(
            "Preview completed successfully. The import is ready to execute."
          );
        }
      } catch (error: unknown) {
        setPreviewResponse(
          null
        );

        setErrorMessage(
          getApiErrorMessage(
            error,
            "Unable to preview the CSV."
          )
        );
      }
    };

  const executeImport =
    async () => {
      resetMessages();

      if (!preview) {
        setErrorMessage(
          "Generate a preview before executing the import."
        );
        return;
      }

      if (!preview.canExecute) {
        setErrorMessage(
          "This preview cannot be executed. Correct the validation errors first."
        );
        return;
      }

      const confirmed =
        window.confirm(
          `Execute ${preview.summary.executableProducts} product import operation(s)?`
        );

      if (!confirmed) {
        return;
      }

      try {
        const body =
          await executeProductImportRequest({
            preview,

            continueOnError,
          }).unwrap();

        setExecutionResponse(
          body
        );

        if (
          body.data.summary.failed >
          0
        ) {
          setErrorMessage(
            body.message
          );
        } else {
          setSuccessMessage(
            body.message
          );
        }
      } catch (error: unknown) {
        setErrorMessage(
          getApiErrorMessage(
            error,
            "Product import execution failed."
          )
        );
      }
    };

  const clearImport = () => {
    setSelectedFile(null);
    resetResults();
    resetMessages();

    if (inputRef.current) {
      inputRef.current.value =
        "";
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Product CSV Import
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Download the current template, upload your CSV,
            validate every product, and execute the approved import.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isDownloading}
            onClick={() =>
              downloadTemplate(false)
            }
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading
              ? "Downloading..."
              : "Download blank template"}
          </button>

          <button
            type="button"
            disabled={isDownloading}
            onClick={() =>
              downloadTemplate(true)
            }
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDownloading
              ? "Downloading..."
              : "Download example"}
          </button>
        </div>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {successMessage}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-4 md:p-5">
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              Import mode
            </span>

            <select
              value={importMode}
              onChange={(event) => {
                setImportMode(
                  event.target
                    .value as ImportMode
                );

                resetResults();
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
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
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <input
              type="checkbox"
              checked={removeEmptyRows}
              onChange={(event) =>
                setRemoveEmptyRows(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300"
            />

            <span>
              <span className="block text-sm font-medium text-slate-700">
                Remove empty rows
              </span>

              <span className="block text-xs text-slate-500">
                Ignore completely blank CSV rows.
              </span>
            </span>
          </label>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2">
            <input
              type="checkbox"
              checked={continueOnError}
              onChange={(event) =>
                setContinueOnError(
                  event.target.checked
                )
              }
              className="h-4 w-4 rounded border-slate-300"
            />

            <span>
              <span className="block text-sm font-medium text-slate-700">
                Continue on error
              </span>

              <span className="block text-xs text-slate-500">
                Continue with later products if one transaction fails.
              </span>
            </span>
          </label>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={
            handleFileChange
          }
          className="hidden"
        />

        <div
          onDragOver={
            handleDragOver
          }
          onDragLeave={
            handleDragLeave
          }
          onDrop={handleDrop}
          className={`mt-5 rounded-xl border-2 border-dashed p-8 text-center transition ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-slate-300 bg-slate-50"
          }`}
        >
          <div className="text-base font-medium text-slate-800">
            Drop your product CSV here
          </div>

          <p className="mt-1 text-sm text-slate-500">
            CSV only, maximum file size 10 MB.
          </p>

          <button
            type="button"
            onClick={() =>
              inputRef.current?.click()
            }
            className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Choose CSV file
          </button>
        </div>

        {selectedFile ? (
          <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-medium text-slate-900">
                {selectedFile.name}
              </div>

              <div className="text-xs text-slate-500">
                {formatBytes(
                  selectedFile.size
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={
                  clearImport
                }
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
              >
                Clear
              </button>

              <button
                type="button"
                disabled={
                  isPreviewing
                }
                onClick={
                  previewImport
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPreviewing
                  ? "Validating..."
                  : "Preview import"}
              </button>
            </div>
          </div>
        ) : null}
      </section>

      {preview ? (
        <>
          <section>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
              <MetricCard
                label="CSV rows"
                value={
                  preview.summary
                    .totalRows
                }
              />

              <MetricCard
                label="Products"
                value={
                  preview.summary
                    .totalProducts
                }
              />

              <MetricCard
                label="Valid"
                value={
                  preview.summary
                    .validProducts
                }
                tone="success"
              />

              <MetricCard
                label="Invalid"
                value={
                  preview.summary
                    .invalidProducts
                }
                tone="danger"
              />

              <MetricCard
                label="Create"
                value={
                  preview.summary
                    .createProducts
                }
                tone="success"
              />

              <MetricCard
                label="Update"
                value={
                  preview.summary
                    .updateProducts
                }
                tone="info"
              />

              <MetricCard
                label="Variants"
                value={
                  preview.summary
                    .totalVariants
                }
              />

              <MetricCard
                label="Errors"
                value={
                  preview.summary
                    .totalErrors
                }
                tone="danger"
              />
            </div>
          </section>

          {preview.validation.errors
            .length > 0 ? (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4">
              <h2 className="font-medium text-red-900">
                File-level errors
              </h2>

              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-800">
                {preview.validation.errors.map(
                  (error) => (
                    <li key={error}>
                      {error}
                    </li>
                  )
                )}
              </ul>
            </section>
          ) : null}

          {invalidProducts.length >
          0 ? (
            <ProductValidationSection
              title="Products requiring correction"
              products={
                invalidProducts
              }
              defaultExpanded
            />
          ) : null}

          {validProducts.length >
          0 ? (
            <ProductValidationSection
              title="Valid products"
              products={
                validProducts
              }
            />
          ) : null}

          <section className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-slate-900">
                Import execution
              </div>

              <div className="mt-1 text-sm text-slate-500">
                {preview.canExecute
                  ? `${preview.summary.executableProducts} product operation(s) are ready.`
                  : "No products can be executed until validation errors are corrected."}
              </div>
            </div>

            <button
              type="button"
              disabled={
                !preview.canExecute ||
                isExecuting
              }
              onClick={
                executeImport
              }
              className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isExecuting
                ? "Importing..."
                : "Confirm and import"}
            </button>
          </section>
        </>
      ) : null}

      {executionResponse ? (
        <ExecutionResults
          response={
            executionResponse
          }
        />
      ) : null}
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?:
    | "default"
    | "success"
    | "danger"
    | "info";
}) {
  const toneClasses = {
    default:
      "border-slate-200 bg-white text-slate-900",

    success:
      "border-emerald-200 bg-emerald-50 text-emerald-900",

    danger:
      "border-red-200 bg-red-50 text-red-900",

    info:
      "border-blue-200 bg-blue-50 text-blue-900",
  };

  return (
    <div
      className={`rounded-xl border p-3 ${toneClasses[tone]}`}
    >
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">
        {label}
      </div>

      <div className="mt-1 text-2xl font-semibold">
        {value}
      </div>
    </div>
  );
}

function ProductValidationSection({
  title,
  products,
  defaultExpanded = false,
}: {
  title: string;
  products: PreviewProduct[];
  defaultExpanded?: boolean;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-medium text-slate-900">
          {title}
        </h2>
      </div>

      <div className="divide-y divide-slate-200">
        {products.map(
          (product) => (
            <details
              key={`${product.parentSku}-${product.rowNumbers.join("-")}`}
              open={
                defaultExpanded
              }
              className="group"
            >
              <summary className="cursor-pointer list-none px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-medium text-slate-900">
                      {product.parentSku ||
                        "Missing parent SKU"}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      Rows{" "}
                      {product.rowNumbers.join(
                        ", "
                      )}
                      {" · "}
                      {product.summary
                        ?.count || 0}{" "}
                      variant(s)
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getActionClasses(
                        product.action
                      )}`}
                    >
                      {product.action}
                    </span>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        product.valid
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      {product.valid
                        ? "Valid"
                        : "Invalid"}
                    </span>
                  </div>
                </div>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                {product.validation
                  ?.errors?.length ? (
                  <div>
                    <div className="text-sm font-medium text-red-800">
                      Errors
                    </div>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-red-700">
                      {product.validation.errors.map(
                        (error) => (
                          <li key={error}>
                            {error}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : null}

                {product.validation
                  ?.warnings?.length ? (
                  <div className="mt-4">
                    <div className="text-sm font-medium text-amber-800">
                      Warnings
                    </div>

                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
                      {product.validation.warnings.map(
                        (warning) => (
                          <li key={warning}>
                            {warning}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <PreviewDetail
                    label="Product type"
                    value={
                      product.productType ||
                      "—"
                    }
                  />

                  <PreviewDetail
                    label="Default SKU"
                    value={
                      product.summary
                        ?.defaultSku ||
                      "—"
                    }
                  />

                  <PreviewDetail
                    label="Prices"
                    value={String(
                      product.summary
                        ?.priceCount || 0
                    )}
                  />

                  <PreviewDetail
                    label="Existing product"
                    value={
                      product.existingProductId
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>

                {product.summary?.skus
                  ?.length ? (
                  <div className="mt-4">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Variant SKUs
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.summary.skus.map(
                        (sku) => (
                          <span
                            key={sku}
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                          >
                            {sku}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </details>
          )
        )}
      </div>
    </section>
  );
}

function PreviewDetail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

function ExecutionResults({
  response,
}: {
  response: ExecutionResponse;
}) {
  const execution =
    response.data;

  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="font-medium text-slate-900">
          Import result
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {response.message}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 lg:grid-cols-7">
        <MetricCard
          label="Succeeded"
          value={
            execution.summary
              .succeeded
          }
          tone="success"
        />

        <MetricCard
          label="Failed"
          value={
            execution.summary.failed
          }
          tone="danger"
        />

        <MetricCard
          label="Skipped"
          value={
            execution.summary
              .skipped
          }
        />

        <MetricCard
          label="Created"
          value={
            execution.summary
              .created
          }
          tone="success"
        />

        <MetricCard
          label="Updated"
          value={
            execution.summary
              .updated
          }
          tone="info"
        />

        <MetricCard
          label="Variants"
          value={
            execution.summary
              .variants
          }
        />

        <MetricCard
          label="Prices"
          value={
            execution.summary.prices
          }
        />
      </div>

      <div className="overflow-x-auto border-t border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Parent SKU
              </th>

              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Action
              </th>

              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Result
              </th>

              <th className="px-4 py-3 text-right font-medium text-slate-600">
                Variants
              </th>

              <th className="px-4 py-3 text-right font-medium text-slate-600">
                Prices
              </th>

              <th className="px-4 py-3 text-left font-medium text-slate-600">
                Message
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 bg-white">
            {execution.products.map(
              (product) => (
                <tr
                  key={`${product.parentSku}-${product.action}`}
                >
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                    {product.parentSku}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${getActionClasses(
                        product.action
                      )}`}
                    >
                      {product.action}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={
                        product.success
                          ? "text-emerald-700"
                          : product.skipped
                            ? "text-amber-700"
                            : "text-red-700"
                      }
                    >
                      {product.success
                        ? product.skipped
                          ? "Skipped"
                          : "Success"
                        : "Failed"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right text-slate-700">
                    {product.variantCount ||
                      0}
                  </td>

                  <td className="px-4 py-3 text-right text-slate-700">
                    {product.priceCount ||
                      0}
                  </td>

                  <td className="px-4 py-3 text-slate-600">
                    {product.errors
                      ?.length
                      ? product.errors
                          .map(
                            getExecutionErrorText
                          )
                          .join("; ")
                      : product.warnings
                          ?.length
                        ? product.warnings.join(
                            "; "
                          )
                        : "—"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}