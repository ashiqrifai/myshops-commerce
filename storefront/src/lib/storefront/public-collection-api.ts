import type {
    PublicCollectionData,
    PublicCollectionResponse,
  } from "@/types/publicCollection";
  
  const API_URL = (
    process.env
      .NEXT_PUBLIC_API_URL ||
    "http://localhost:5080/api/v1"
  ).replace(
    /\/$/,
    ""
  );
  
  const COMPANY_CODE =
    process.env
      .NEXT_PUBLIC_COMPANY_CODE ||
    "MYSHOPS";
  
  export interface GetPublicCollectionParams {
    slug:
      string;
  
    channel?:
      "WEBSITE" |
      "KIOSK";
  
    page?:
      number;
  
    pageSize?:
      number;
  
    search?:
      string;
  
    brandIds?:
      string[];
  
    minPrice?:
      number;
  
    maxPrice?:
      number;
  
    sort?:
      string;
  }
  
  export class PublicCollectionApiError
    extends Error {
    status:
      number;
  
    code:
      string | null;
  
    constructor(
      message:
        string,
  
      status:
        number,
  
      code:
        string | null =
        null
    ) {
      super(
        message
      );
  
      this.name =
        "PublicCollectionApiError";
  
      this.status =
        status;
  
      this.code =
        code;
    }
  }
  
  export async function getPublicCollection({
    slug,
    channel =
      "WEBSITE",
    page,
    pageSize,
    search,
    brandIds,
    minPrice,
    maxPrice,
    sort,
  }: GetPublicCollectionParams): Promise<PublicCollectionData> {
    const query =
      new URLSearchParams();
  
    query.set(
      "channel",
      channel
    );
  
    if (page) {
      query.set(
        "page",
        String(page)
      );
    }
  
    if (pageSize) {
      query.set(
        "pageSize",
        String(pageSize)
      );
    }
  
    if (
      search?.trim()
    ) {
      query.set(
        "search",
        search.trim()
      );
    }
  
    if (
      brandIds?.length
    ) {
      query.set(
        "brandIds",
        brandIds.join(
          ","
        )
      );
    }
  
    if (
      minPrice !==
      undefined
    ) {
      query.set(
        "minPrice",
        String(
          minPrice
        )
      );
    }
  
    if (
      maxPrice !==
      undefined
    ) {
      query.set(
        "maxPrice",
        String(
          maxPrice
        )
      );
    }
  
    if (sort) {
      query.set(
        "sort",
        sort
      );
    }
  
    const response =
      await fetch(
        `${API_URL}/public/storefront/collections/${encodeURIComponent(
          slug
        )}?${query.toString()}`,
  
        {
          headers: {
            Accept:
              "application/json",
  
            "x-company-code":
              COMPANY_CODE,
          },
  
          cache:
            "no-store",
        }
      );
  
    const payload =
      await response
        .json()
        .catch(
          () =>
            null
        ) as
        | PublicCollectionResponse
        | {
            success?:
              boolean;
  
            error?: {
              code?:
                string;
  
              message?:
                string;
            };
  
            message?:
              string;
          }
        | null;
  
    if (
      !response.ok ||
      !payload ||
      !payload.success
    ) {
      const message =
  payload &&
  "error" in payload
    ? payload.error
        ?.message ||
      (
        "message" in payload
          ? payload.message
          : undefined
      )
    : payload &&
      "message" in payload
      ? payload.message
      : undefined;

const code =
  payload &&
  "error" in payload
    ? payload.error
        ?.code ||
      null
    : null;
  
      throw new PublicCollectionApiError(
        message ||
          "Unable to load collection.",
  
        response.status,
  
        code
      );
    }
  
    return (
      payload as PublicCollectionResponse
    ).data;
  }