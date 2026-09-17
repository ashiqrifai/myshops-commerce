export interface PublicPickupLocation {
  id: string;
  code: string;
  name: string;
  locationType:
    | "STORE"
    | "HUB"
    | "WAREHOUSE";
  emirate: string | null;
  city: string | null;
  area: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  landmark: string | null;
  phone: string | null;
  pickupLeadTimeMinutes: number;
  pickupInstructions: string | null;
  availableQuantity: number;
  available: boolean;
  requestedQuantity: number;
}

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/+$/, "");

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export async function getPublicPickupLocations({
  variantId,
  quantity,
  signal,
}: {
  variantId: string;
  quantity: number;
  signal?: AbortSignal;
}): Promise<PublicPickupLocation[]> {
  const params =
    new URLSearchParams({
      variantId,
      quantity:
        String(quantity),
    });

  const response =
    await fetch(
      `${API_BASE_URL}/public/storefront/pickup-locations?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Accept:
            "application/json",
          "x-company-code":
            COMPANY_CODE,
        },
        cache:
          "no-store",
        signal,
      }
    );

  if (!response.ok) {
    throw new Error(
      "Unable to load pickup locations."
    );
  }

  const payload =
    await response.json();

  return Array.isArray(
    payload?.data
  )
    ? payload.data
    : [];
}
