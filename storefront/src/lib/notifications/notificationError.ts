export interface NormalizedCustomerError {
  message: string;
  code?: string;
  details: Array<{ field?: string; message?: string }>;
}

export const normalizeCustomerError = (error: unknown, fallbackMessage: string): NormalizedCustomerError => {
  if (error && typeof error === "object") {
    const candidate = error as { message?: unknown; code?: unknown; details?: unknown };
    const details = Array.isArray(candidate.details)
      ? candidate.details.filter((item) => item && typeof item === "object").map((item) => {
          const detail = item as { field?: unknown; message?: unknown };
          return { field: typeof detail.field === "string" ? detail.field : undefined, message: typeof detail.message === "string" ? detail.message : undefined };
        })
      : [];
    return {
      message: typeof candidate.message === "string" && candidate.message.trim() ? candidate.message : details.find((d) => d.message)?.message || fallbackMessage,
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      details,
    };
  }
  return { message: fallbackMessage, details: [] };
};
