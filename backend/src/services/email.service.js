const nodemailer =
  require(
    "nodemailer"
  );

const requiredEnv =
  (
    key
  ) => {
    const value =
      String(
        process.env[
          key
        ] ||
        ""
      ).trim();

    if (!value) {
      throw new Error(
        `${key} is not configured.`
      );
    }

    return value;
  };

const getTransporter =
  () =>
    nodemailer
      .createTransport({
        host:
          requiredEnv(
            "SMTP_HOST"
          ),

        port:
          Number(
            process.env
              .SMTP_PORT ||
            465
          ),

        secure:
          String(
            process.env
              .SMTP_SECURE ||
            "true"
          )
            .trim()
            .toLowerCase() ===
          "true",

        auth: {
          user:
            requiredEnv(
              "SMTP_USER"
            ),

          pass:
            requiredEnv(
              "SMTP_PASS"
            ),
        },

        pool:
          true,

        maxConnections:
          Number(
            process.env
              .SMTP_MAX_CONNECTIONS ||
            3
          ),

        maxMessages:
          Number(
            process.env
              .SMTP_MAX_MESSAGES ||
            100
          ),

        connectionTimeout:
          Number(
            process.env
              .SMTP_CONNECTION_TIMEOUT_MS ||
            15000
          ),

        greetingTimeout:
          Number(
            process.env
              .SMTP_GREETING_TIMEOUT_MS ||
            15000
          ),

        socketTimeout:
          Number(
            process.env
              .SMTP_SOCKET_TIMEOUT_MS ||
            30000
          ),
      });

const verifyEmailConnection =
  async () => {
    const transporter =
      getTransporter();

    await transporter.verify();

    return true;
  };

const sendEmail =
  async ({
    to,
    subject,
    html,
    text,
    replyTo =
      null,
  }) => {
    const transporter =
      getTransporter();

    return transporter
      .sendMail({
        from: {
          name:
            process.env
              .SMTP_FROM_NAME ||
            "MyShops",

          address:
            process.env
              .SMTP_FROM_EMAIL ||
            requiredEnv(
              "SMTP_USER"
            ),
        },

        to,
        subject,
        html,
        text,

        replyTo:
          replyTo ||
          process.env
            .SMTP_REPLY_TO ||
          undefined,
      });
  };

module.exports = {
  sendEmail,
  verifyEmailConnection,
};
