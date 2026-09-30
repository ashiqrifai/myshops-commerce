const crypto =
  require(
    "crypto"
  );


const {
  TOOL_DEFINITIONS,
} = require(
  "./kioskAi.tools"
);


const safetyIdentifier =
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


const connect =
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


      /*
       * IMPORTANT:
       * Preserve the WebRTC SDP exactly as received.
       *
       * Do not trim it. SDP is line-oriented and the
       * terminating CRLF/newline must be preserved when
       * forwarding the offer to OpenAI Realtime.
       */
      const sdp =
        typeof req.body ===
        "string"
          ? req.body
          : "";


      if (
        !sdp.trim()
      ) {

        const error =
          new Error(
            "WebRTC SDP offer is required."
          );

        error.statusCode =
          400;

        throw error;
      }


      console.log(
        "[KIOSK-AI-WEBRTC] offer received",
        {
          length:
            sdp.length,

          startsWithVersion:
            sdp.startsWith(
              "v=0"
            ),

          endsWithNewline:
            sdp.endsWith(
              "\n"
            ),

          containsAudio:
            sdp.includes(
              "m=audio"
            ),
        }
      );


      const session = {
        type:
          "realtime",

        model:
          process.env
            .OPENAI_REALTIME_MODEL ||
          "gpt-realtime-2.1",

        instructions:
          [
            "You are MyShops AI.",
            "You are speaking to a customer standing at a MyShops retail kiosk.",
            "Speak naturally like an excellent retail salesperson.",
            "Be warm, concise and conversational.",
            "Ask at most one useful follow-up question at a time.",
            "Never invent products, prices, stock, discounts, promotions, warranty or protection plans.",
            "Use approved MyShops tools for commercial facts.",
            "The customer should never need to say send or press a send button.",
          ]
            .join(
              " "
            ),

        tools:
          TOOL_DEFINITIONS,

        tool_choice:
          "auto",

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
      };


      const form =
        new FormData();

      form.set(
        "sdp",
        sdp
      );

      form.set(
        "session",
        JSON.stringify(
          session
        )
      );


      const response =
        await fetch(
          "https://api.openai.com/v1/realtime/calls",
          {
            method:
              "POST",

            headers: {
              Authorization:
                `Bearer ${apiKey}`,

              "OpenAI-Safety-Identifier":
                safetyIdentifier(
                  req
                ),
            },

            body:
              form,
          }
        );


      const answerSdp =
        await response
          .text();


      if (
        !response.ok
      ) {

        console.error(
          "[KIOSK-AI-WEBRTC]",
          response.status,
          answerSdp
        );

        const error =
          new Error(
            "Unable to establish MyShops AI voice session."
          );

        error.statusCode =
          response.status;

        throw error;
      }


      const location =
        response.headers
          .get(
            "location"
          );


      const callId =
        location
          ?.split(
            "/"
          )
          .pop() ||
        null;


      console.log(
        "[KIOSK-AI-WEBRTC] connected",
        {
          callId,
          model:
            session.model,
        }
      );


      res
        .status(
          200
        )
        .type(
          "application/sdp"
        )
        .set(
          "X-OpenAI-Call-Id",
          callId ||
          ""
        )
        .send(
          answerSdp
        );

    } catch (
      error
    ) {

      next(
        error
      );
    }
  };


module.exports = {
  connect,
};
