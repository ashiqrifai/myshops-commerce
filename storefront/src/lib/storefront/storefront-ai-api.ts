export interface StorefrontAiConversationMessage {
  role:
    | "user"
    | "assistant";
  text: string;
}

export interface StorefrontAiProduct {
  id: string;
  name: string;
  slug: string;

  shortDescription?:
    | string
    | null;

  brand?:
    | string
    | null;

  category?:
    | string
    | null;

  sku: string;

  price:
    | {
        sellingPrice: number;
        compareAtPrice:
          | number
          | null;
        currencyCode: string;
        isTaxInclusive: boolean;
      }
    | null;

  attributes: Array<{
    name: string;
    code: string;
    value:
      | string
      | number;
  }>;

  imageUrl?:
    | string
    | null;

  productUrl: string;
}

export interface StorefrontAiResponse {
  success: boolean;

  data: {
    message: string;

    products:
      StorefrontAiProduct[];

    meta: {
      model: string;
      searchedCatalogue:
        boolean;
      resultCount: number;
    };
  };
}

const API_URL =
  process.env
    .NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1";

const COMPANY_CODE =
  process.env
    .NEXT_PUBLIC_COMPANY_CODE ||
  "MYSHOPS";

export async function askStorefrontAi(
  payload: {
    message: string;

    conversation:
      StorefrontAiConversationMessage[];

    pageContext:
      Record<
        string,
        unknown
      >;

    cartContext:
      Record<
        string,
        unknown
      >;

    channel?:
      | "WEBSITE"
      | "KIOSK";
  }
): Promise<
  StorefrontAiResponse["data"]
> {
  const response =
    await fetch(
      `${API_URL}/public/storefront/ai/chat`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",

          "x-company-code":
            COMPANY_CODE,
        },

        body:
          JSON.stringify({
            ...payload,

            channel:
              payload.channel ||
              "WEBSITE",
          }),
      }
    );

  let result:
    | StorefrontAiResponse
    | {
        success?: boolean;
        message?: string;
        error?: {
          message?: string;
        };
      };

  try {
    result =
      await response.json();
  } catch {
    throw new Error(
      "The AI assistant returned an invalid response."
    );
  }

  if (
    !response.ok ||
    !result.success ||
    !("data" in result)
  ) {
    throw new Error(
      result.error
        ?.message ||
        result.message ||
        "The AI assistant is temporarily unavailable."
    );
  }

  return result.data;
}
