const jwt = require("jsonwebtoken");

/*
|--------------------------------------------------------------------------
| Configuration
|--------------------------------------------------------------------------
*/

const TAMARA_API_BASE_URL =
  process.env.TAMARA_API_BASE_URL ||
  "https://api-sandbox.tamara.co";

const TAMARA_API_TOKEN =
  process.env.TAMARA_API_TOKEN || "";

const TAMARA_NOTIFICATION_TOKEN =
  process.env.TAMARA_NOTIFICATION_TOKEN || "";

const TAMARA_COUNTRY_CODE =
  process.env.TAMARA_COUNTRY_CODE || "AE";

const TAMARA_CURRENCY =
  process.env.TAMARA_CURRENCY || "AED";

const TAMARA_ELIGIBILITY_PATH =
  process.env.TAMARA_ELIGIBILITY_PATH ||
  "/pre-checkout/v1/eligibility";

const TAMARA_CHECKOUT_PATH =
  process.env.TAMARA_CHECKOUT_PATH ||
  "/checkout";

const TAMARA_CAPTURE_PATH =
  process.env.TAMARA_CAPTURE_PATH ||
  "/payments/capture";

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const ensureTamaraConfigured = () => {
  const enabled =
    String(
      process.env.TAMARA_ENABLED ??
        "true"
    ).toLowerCase() !==
    "false";

  if (!enabled) {
    throw new Error(
      "Tamara integration is disabled"
    );
  }

  if (!TAMARA_API_TOKEN) {
    throw new Error(
      "TAMARA_API_TOKEN is not configured"
    );
  }

  if (!TAMARA_API_BASE_URL) {
    throw new Error(
      "TAMARA_API_BASE_URL is not configured"
    );
  }
};

const parseResponseBody =
  async (response) => {
    const text =
      await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(
        text
      );
    } catch {
      return {
        raw:
          text,
      };
    }
  };

  const tamaraRequest =
  async ({
    method = "GET",
    path,
    body,
    timeoutMs = null,
  }) => {
    ensureTamaraConfigured();

    const url =
      `${TAMARA_API_BASE_URL}${path}`;

    const headers = {
      Accept:
        "application/json",

      Authorization:
        `Bearer ${TAMARA_API_TOKEN}`,
    };

    if (
      body !== undefined
    ) {
      headers[
        "Content-Type"
      ] =
        "application/json";
    }

    /*
    |--------------------------------------------------------------------------
    | Optional Request Timeout
    |--------------------------------------------------------------------------
    |
    | Used especially by Tamara's Pre-checkout Eligibility API,
    | where the merchant guideline specifies a 200 ms timeout.
    |
    | Other Tamara APIs do NOT receive this timeout unless
    | timeoutMs is explicitly supplied.
    |--------------------------------------------------------------------------
    */

    const controller =
      new AbortController();

    let timeoutId =
      null;

    if (
      timeoutMs !== null &&
      Number(timeoutMs) > 0
    ) {
      timeoutId =
        setTimeout(
          () => {
            controller.abort();
          },
          Number(
            timeoutMs
          )
        );
    }

    try {
      const response =
        await fetch(
          url,
          {
            method,

            headers,

            signal:
              controller.signal,

            body:
              body !==
              undefined
                ? JSON.stringify(
                    body
                  )
                : undefined,
          }
        );

      const data =
        await parseResponseBody(
          response
        );

      if (!response.ok) {
        const error =
          new Error(
            data?.message ||
              data?.error ||
              `Tamara API returned HTTP ${response.status}`
          );

        error.status =
          response.status;

        error.tamaraResponse =
          data;

        throw error;
      }

      return data;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Timeout
      |--------------------------------------------------------------------------
      */

      if (
        error?.name ===
        "AbortError"
      ) {
        const timeoutError =
          new Error(
            `Tamara API request timed out after ${timeoutMs}ms`
          );

        timeoutError.status =
          504;

        timeoutError.code =
          "TAMARA_TIMEOUT";

        timeoutError.timeoutMs =
          timeoutMs;

        throw timeoutError;
      }

      throw error;
    } finally {
      if (
        timeoutId !==
        null
      ) {
        clearTimeout(
          timeoutId
        );
      }
    }
  };
/*
|--------------------------------------------------------------------------
| Eligibility
|--------------------------------------------------------------------------
|
| POST /pre-checkout/v1/eligibility
|--------------------------------------------------------------------------
*/

const checkEligibility =
  async ({
    amount,
    currency =
      TAMARA_CURRENCY,
    countryCode =
      TAMARA_COUNTRY_CODE,
    phoneNumber,
  }) => {
    const numericAmount =
      Number(
        amount
      );

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      throw new Error(
        "A valid Tamara eligibility amount is required"
      );
    }

    const payload = {
      order: {
        total_amount: {
          amount:
            Number(
              numericAmount.toFixed(
                2
              )
            ),

          currency:
            String(
              currency
            ).toUpperCase(),
        },
      },

      customer: {},
    };

    if (
      phoneNumber &&
      String(
        phoneNumber
      ).trim()
    ) {
      payload
        .customer
        .phone_number =
        String(
          phoneNumber
        )
          .replace(
            /\D/g,
            ""
          )
          .trim();
    }

    console.log(
      "[Tamara eligibility request]",
      JSON.stringify(
        {
          path:
            TAMARA_ELIGIBILITY_PATH,

          payload,
        },
        null,
        2
      )
    );

    const result =
      await tamaraRequest({
        method:
          "POST",

        path:
          TAMARA_ELIGIBILITY_PATH,

        body:
          payload,
      });

    console.log(
      "[Tamara eligibility response]",
      JSON.stringify(
        result,
        null,
        2
      )
    );

    return result;
  };

/*
|--------------------------------------------------------------------------
| Create Checkout Session
|--------------------------------------------------------------------------
*/

const createCheckoutSession =
  async (
    payload
  ) => {
    if (!payload) {
      throw new Error(
        "Tamara checkout payload is required"
      );
    }

    return tamaraRequest({
      method:
        "POST",

      path:
        TAMARA_CHECKOUT_PATH,

      body:
        payload,
    });
  };

/*
|--------------------------------------------------------------------------
| Get Tamara Order
|--------------------------------------------------------------------------
*/

const getOrderDetails =
  async (
    tamaraOrderId
  ) => {
    if (
      !tamaraOrderId
    ) {
      throw new Error(
        "Tamara order ID is required"
      );
    }

    return tamaraRequest({
      method:
        "GET",

      path:
        `/orders/${encodeURIComponent(
          tamaraOrderId
        )}`,
    });
  };

/*
|--------------------------------------------------------------------------
| Capture Tamara Order
|--------------------------------------------------------------------------
|
| POST /payments/capture
|--------------------------------------------------------------------------
*/

const captureOrder =
  async (
    payload
  ) => {
    if (!payload) {
      throw new Error(
        "Tamara capture payload is required"
      );
    }

    if (
      !payload.order_id
    ) {
      throw new Error(
        "Tamara order_id is required for capture"
      );
    }

    if (
      !payload
        .total_amount ||
      payload
        .total_amount
        .amount ===
        undefined ||
      payload
        .total_amount
        .amount ===
        null
    ) {
      throw new Error(
        "Tamara capture total_amount is required"
      );
    }

    if (
      !payload
        .shipping_info
    ) {
      throw new Error(
        "Tamara capture shipping_info is required"
      );
    }

    return tamaraRequest({
      method:
        "POST",

      path:
        TAMARA_CAPTURE_PATH,

      body:
        payload,
    });
  };

/*
|--------------------------------------------------------------------------
| Webhook Token Extraction
|--------------------------------------------------------------------------
*/

const extractWebhookToken =
  (req) => {
    const queryToken =
      req?.query
        ?.tamaraToken;

    if (queryToken) {
      return String(
        queryToken
      ).trim();
    }

    const authorization =
      req?.headers
        ?.authorization;

    if (
      authorization &&
      authorization
        .toLowerCase()
        .startsWith(
          "bearer "
        )
    ) {
      return authorization
        .substring(
          7
        )
        .trim();
    }

    return null;
  };

/*
|--------------------------------------------------------------------------
| Verify Webhook
|--------------------------------------------------------------------------
*/

const verifyWebhookToken =
  (token) => {
    if (
      !TAMARA_NOTIFICATION_TOKEN
    ) {
      const error =
        new Error(
          "TAMARA_NOTIFICATION_TOKEN is not configured"
        );

      error.status =
        500;

      throw error;
    }

    if (!token) {
      const error =
        new Error(
          "Tamara webhook token is missing"
        );

      error.status =
        401;

      throw error;
    }

    try {
      return jwt.verify(
        token,
        TAMARA_NOTIFICATION_TOKEN,
        {
          algorithms: [
            "HS256",
          ],
        }
      );
    } catch (
      error
    ) {
      const authError =
        new Error(
          "Invalid Tamara webhook token"
        );

      authError.status =
        401;

      authError.originalError =
        error;

      throw authError;
    }
  };

/*
|--------------------------------------------------------------------------
| Simplified Refund
|--------------------------------------------------------------------------
|
| Tamara:
| POST /payments/simplified-refund/{order_id}
|--------------------------------------------------------------------------
*/

const refundOrder =
  async ({
    tamaraOrderId,
    amount,
    currency =
      TAMARA_CURRENCY,
    comment,
    merchantRefundId,
  }) => {
    if (!tamaraOrderId) {
      throw new Error(
        "Tamara order ID is required for refund"
      );
    }

    const numericAmount =
      Number(amount);

    if (
      !Number.isFinite(
        numericAmount
      ) ||
      numericAmount <= 0
    ) {
      throw new Error(
        "A valid Tamara refund amount is required"
      );
    }

    const normalizedComment =
      String(
        comment || ""
      ).trim();

    if (!normalizedComment) {
      throw new Error(
        "Tamara refund comment is required"
      );
    }

    const payload = {
      total_amount: {
        amount:
          Number(
            numericAmount.toFixed(
              2
            )
          ),

        currency:
          String(
            currency ||
              TAMARA_CURRENCY
          ).toUpperCase(),
      },

      comment:
        normalizedComment,
    };

    if (
      merchantRefundId
    ) {
      payload.merchant_refund_id =
        String(
          merchantRefundId
        );
    }

    return tamaraRequest({
      method:
        "POST",

      path:
        `/payments/simplified-refund/${encodeURIComponent(
          tamaraOrderId
        )}`,

      body:
        payload,
    });
  };

module.exports = {
  TAMARA_API_BASE_URL,
  TAMARA_COUNTRY_CODE,
  TAMARA_CURRENCY,

  checkEligibility,
  createCheckoutSession,
  getOrderDetails,
  captureOrder,
  refundOrder,
  extractWebhookToken,
  verifyWebhookToken,
};
