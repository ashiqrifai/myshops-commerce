const crypto =
  require(
    "crypto"
  );


const createSafetyIdentifier =
  (
    req
  ) => {

    const deviceId =
      String(
        req.kioskDevice
          ?.id ||
        req.kiosk
          ?.id ||
        "anonymous-kiosk"
      );

    return crypto
      .createHash(
        "sha256"
      )
      .update(
        deviceId
      )
      .digest(
        "hex"
      );
  };


const createLiveSession =
  async (
    req,
    res,
    next
  ) => {

    try {

      const apiKey =
        process.env
          .OPENAI_API_KEY;

      if (
        !apiKey
      ) {

        const error =
          new Error(
            "OPENAI_API_KEY is not configured."
          );

        error.statusCode =
          503;

        throw error;
      }


      const safetyIdentifier =
        createSafetyIdentifier(
          req
        );


      const response =
        await fetch(
          "https://api.openai.com/v1/realtime/client_secrets",
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${apiKey}`,

              "Content-Type":
                "application/json",

              "OpenAI-Safety-Identifier":
                safetyIdentifier,
            },

            body:
              JSON.stringify({
                session: {
                  type:
                    "realtime",

                  model:
                    process.env
                      .OPENAI_REALTIME_MODEL ||
                    "gpt-realtime-2.1",

                  instructions:
                    [
                      "You are MyShops AI.",
                      "You are a warm, concise in-store shopping assistant.",
                      "Speak naturally like an excellent retail salesperson.",
                      "Do not invent products, prices, stock, promotions, protection plans or discounts.",
                      "MyShops business facts must come from approved MyShops tools.",
                      "Ask at most one useful follow-up question at a time.",
                      "Keep spoken responses concise.",
                      "The customer is standing in front of a retail kiosk.",
                    ]
                      .join(
                        " "
                      ),

                  audio: {
                    output: {
                      voice:
                        "marin",
                    },

                    input: {
                      turn_detection: {
                        type:
                          "semantic_vad",
                      },
                    },
                  },
                },
              }),
          }
        );


      const body =
        await response
          .json();


      console.log(
        "[KIOSK-AI-LIVE] OpenAI response:",
        {
          ok:
            response.ok,

          status:
            response.status,

          keys:
            body &&
            typeof body ===
              "object"
              ? Object.keys(
                  body
                )
              : [],

          hasValue:
            Boolean(
              body?.value
            ),

          hasSession:
            Boolean(
              body?.session
            ),

          expiresAt:
            body?.expires_at ||
            null,
        }
      );


      if (
        !response.ok
      ) {

        const error =
          new Error(
            body?.error?.message ||
            "Unable to create realtime AI session."
          );

        error.statusCode =
          response.status;

        throw error;
      }


      return res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            body,
        });

    } catch (
      error
    ) {

      return next(
        error
      );
    }
  };


module.exports = {
  createLiveSession,
};
