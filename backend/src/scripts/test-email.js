require(
  "dotenv"
)
  .config();

const {
  verifyEmailConnection,
  sendEmail,
} =
  require(
    "../services/email.service"
  );

(async () => {
  try {
    const to =
      process.argv[2];

    if (!to) {
      throw new Error(
        "Usage: node src/scripts/test-email.js your@email.com"
      );
    }

    await verifyEmailConnection();

    console.log(
      "SMTP connection successful."
    );

    const result =
      await sendEmail({
        to,

        subject:
          "MyShops SMTP Test",

        html:
          "<h2>MyShops</h2><p>Your SMTP configuration is working.</p>",

        text:
          "MyShops SMTP configuration is working.",
      });

    console.log(
      "Test email sent:",
      result.messageId
    );
  } catch (
    error
  ) {
    console.error(
      error
    );

    process.exit(
      1
    );
  }
})();