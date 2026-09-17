export interface PublicCategoryTreeItem {
  id: string;
  companyId?: string;
  parentCategoryId?: string | null;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  level?: number;
  sortOrder?: number;
  iconName?: string | null;
  iconUrl?: string | null;
  isActive?: boolean;
  showInMenu?: boolean;
  children: PublicCategoryTreeItem[];
}

interface PublicCategoryTreeResponse {
  success: boolean;
  data?: {
    categories: PublicCategoryTreeItem[];
  };
  error?: {
    code?: string;
    message?: string;
  };
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env.NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export async function getPublicCategoryTree(): Promise<
  PublicCategoryTreeItem[]
> {
  const response = await fetch(
    `${API_URL}/public/categories/tree?showInMenu=true`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-company-code": COMPANY_CODE,
      },
      cache: "no-store",
    }
  );

  let payload: PublicCategoryTreeResponse;

  try {
    payload =
      (await response.json()) as PublicCategoryTreeResponse;
  } catch {
    throw new Error(
      "Unable to read category response."
    );
  }

  if (!response.ok || !payload.success) {
    throw new Error(
      payload.error?.message ||
        `Unable to load categories. HTTP ${response.status}`
    );
  }

  return Array.isArray(payload.data?.categories)
    ? payload.data.categories
    : [];
}
