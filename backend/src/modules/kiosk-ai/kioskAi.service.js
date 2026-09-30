const OpenAI =
  require(
    "openai"
  );

const {
  KIOSK_AI_INSTRUCTIONS,
} = require(
  "./kioskAi.prompt"
);

const {
  TOOL_DEFINITIONS,
  executeTool,
} = require(
  "./kioskAi.tools"
);


let client = null;

const sessions =
  new Map();


const getClient =
  () => {

    if (
      client
    ) {
      return client;
    }

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

    client =
      new OpenAI({
        apiKey,
      });

    return client;
  };


const normalizeSessionId =
  (
    value
  ) => {

    const sessionId =
      String(
        value ||
        ""
      )
        .trim();

    if (
      !sessionId
    ) {
      return `kiosk-${Date.now()}`;
    }

    return sessionId
      .slice(
        0,
        150
      );
  };


const getHistory =
  (
    sessionId
  ) =>
    sessions.get(
      sessionId
    ) ||
    [];


const saveHistory =
  (
    sessionId,
    history
  ) => {

    sessions.set(
      sessionId,
      history.slice(
        -20
      )
    );
  };


const buildContextMessage =
  (
    context
  ) => ({
    role:
      "developer",

    content:
      [
        {
          type:
            "input_text",

          text:
            [
              "CURRENT KIOSK CONTEXT",
              `Screen: ${
                context.screen ||
                "UNKNOWN"
              }`,
              `Product slug: ${
                context.productSlug ||
                "none"
              }`,
            ]
              .join(
                "\n"
              ),
        },
      ],
  });


const extractFunctionCalls =
  (
    response
  ) =>
    (
      response.output ||
      []
    )
      .filter(
        item =>
          item.type ===
          "function_call"
      );


const conversation =
  async ({
    sessionId,
    message,
    context = {},
    apiBaseUrl,
  }) => {

    const cleanMessage =
      String(
        message ||
        ""
      )
        .trim();

    if (
      !cleanMessage
    ) {

      const error =
        new Error(
          "Message is required."
        );

      error.statusCode =
        400;

      throw error;
    }


    const resolvedSessionId =
      normalizeSessionId(
        sessionId
      );

    const history =
      getHistory(
        resolvedSessionId
      );


    const userItem = {
      role:
        "user",

      content:
        [
          {
            type:
              "input_text",

            text:
              cleanMessage,
          },
        ],
    };


    let input = [
      buildContextMessage(
        context
      ),
      ...history,
      userItem,
    ];


    const openai =
      getClient();

    const model =
      process.env
        .OPENAI_KIOSK_MODEL ||
      "gpt-5.6-terra";


    let response =
      await openai
        .responses
        .create({
          model,

          instructions:
            KIOSK_AI_INSTRUCTIONS,

          input,

          tools:
            TOOL_DEFINITIONS,

          tool_choice:
            "auto",

          store:
            false,

          max_output_tokens:
            500,
        });


    /*
    |--------------------------------------------------------------------------
    | TOOL LOOP
    |--------------------------------------------------------------------------
    |
    | The model may request one or more MyShops tools.
    |
    | We execute them ourselves and return the results to the model.
    |--------------------------------------------------------------------------
    */

    let toolRounds =
      0;

    const toolTrace =
      [];

    while (
      extractFunctionCalls(
        response
      ).length >
        0
    ) {

      toolRounds +=
        1;

      if (
        toolRounds >
        5
      ) {

        throw new Error(
          "AI tool loop exceeded the allowed number of rounds."
        );
      }


      const functionCalls =
        extractFunctionCalls(
          response
        );


      const toolOutputs =
        [];


      for (
        const call
        of functionCalls
      ) {

        const result =
          await executeTool({
            name:
              call.name,

            arguments:
              call.arguments,

            apiBaseUrl,
          });


        toolTrace.push({
          name:
            call.name,

          arguments:
            call.arguments,

          resultSummary: {
            totalItems:
              result?.totalItems ??
              null,

            returnedProducts:
              Array.isArray(
                result?.products
              )
                ? result.products.length
                : null,
          },
        });


        toolOutputs.push({
          type:
            "function_call_output",

          call_id:
            call.call_id,

          output:
            JSON.stringify(
              result
            ),
        });
      }


      /*
       * Include the model's previous output items.
       *
       * This preserves the function_call items and their
       * call IDs before we append function_call_output.
       */

      input = [
        ...input,
        ...response.output,
        ...toolOutputs,
      ];


      response =
        await openai
          .responses
          .create({
            model,

            instructions:
              KIOSK_AI_INSTRUCTIONS,

            input,

            tools:
              TOOL_DEFINITIONS,

            tool_choice:
              "auto",

            store:
              false,

            max_output_tokens:
              500,
          });
    }


    const assistantText =
      String(
        response.output_text ||
        ""
      )
        .trim();


    if (
      !assistantText
    ) {

      throw new Error(
        "AI returned an empty response."
      );
    }


    const nextHistory = [
      ...history,
      userItem,
      {
        role:
          "assistant",

        content:
          [
            {
              type:
                "output_text",

              text:
                assistantText,
            },
          ],
      },
    ];


    saveHistory(
      resolvedSessionId,
      nextHistory
    );


    return {
      sessionId:
        resolvedSessionId,

      message:
        assistantText,

      speech:
        assistantText,

      actions:
        [],

      products:
        [],

      meta: {
        model,

        responseId:
          response.id,

        toolRounds,

        tools:
          toolTrace,
      },
    };
  };


const resetSession =
  async (
    sessionId
  ) => {

    const resolved =
      normalizeSessionId(
        sessionId
      );

    sessions.delete(
      resolved
    );

    return {
      sessionId:
        resolved,
    };
  };


module.exports = {
  conversation,
  resetSession,
};
