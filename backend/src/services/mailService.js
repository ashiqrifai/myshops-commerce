const GRAPH_SCOPE = "https://graph.microsoft.com/.default";
const GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

const requiredEnv = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

let cachedAccessToken = null;
let cachedAccessTokenExpiresAt = 0;

const getGraphAccessToken = async () => {
  const now = Date.now();

  if (
    cachedAccessToken &&
    cachedAccessTokenExpiresAt > now + 60 * 1000
  ) {
    return cachedAccessToken;
  }

  const tenantId = requiredEnv("MICROSOFT_TENANT_ID");
  const clientId = requiredEnv("MICROSOFT_CLIENT_ID");
  const clientSecret = requiredEnv("MICROSOFT_CLIENT_SECRET");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    scope: GRAPH_SCOPE,
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://login.microsoftonline.com/${encodeURIComponent(
      tenantId
    )}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  const payload = await response.json();

  if (!response.ok || !payload?.access_token) {
    throw new Error(
      payload?.error_description ||
        payload?.error ||
        "Unable to obtain Microsoft Graph access token."
    );
  }

  cachedAccessToken = payload.access_token;
  cachedAccessTokenExpiresAt =
    now + Number(payload.expires_in || 3600) * 1000;

  return cachedAccessToken;
};

const sendGraphMail = async ({
  to,
  subject,
  html,
}) => {
  const senderEmail = requiredEnv("MAIL_FROM_EMAIL");
  const senderName = String(
    process.env.MAIL_FROM_NAME || "MyShops"
  ).trim();

  const accessToken = await getGraphAccessToken();

  const response = await fetch(
    `${GRAPH_BASE_URL}/users/${encodeURIComponent(
      senderEmail
    )}/sendMail`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          subject,
          body: {
            contentType: "HTML",
            content: html,
          },
          from: {
            emailAddress: {
              name: senderName,
              address: senderEmail,
            },
          },
          toRecipients: [
            {
              emailAddress: {
                address: to,
              },
            },
          ],
        },
        saveToSentItems: true,
      }),
    }
  );

  if (!response.ok) {
    let detail = "";

    try {
      const payload = await response.json();
      detail = payload?.error?.message || "";
    } catch {
      // ignore
    }

    throw new Error(
      detail ||
        `Microsoft Graph sendMail failed with HTTP ${response.status}.`
    );
  }
};

exports.sendPasswordResetEmail = async ({
  to,
  customerName,
  resetUrl,
  expiresMinutes,
}) => {
  const safeName = escapeHtml(customerName || "Customer");
  const safeResetUrl = escapeHtml(resetUrl);
  const safeExpiry = Number(expiresMinutes || 30);

  const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:32px;">
                <div style="font-size:24px;font-weight:800;margin-bottom:18px;">MyShops</div>

                <h1 style="font-size:24px;line-height:32px;margin:0 0 16px;">Reset your password</h1>

                <p style="font-size:15px;line-height:24px;margin:0 0 16px;">
                  Hello ${safeName},
                </p>

                <p style="font-size:15px;line-height:24px;margin:0 0 24px;">
                  We received a request to reset the password for your MyShops customer account.
                </p>

                <p style="margin:0 0 26px;">
                  <a
                    href="${safeResetUrl}"
                    style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 22px;border-radius:10px;"
                  >
                    Reset password
                  </a>
                </p>

                <p style="font-size:13px;line-height:21px;color:#6b7280;margin:0 0 12px;">
                  This link expires in ${safeExpiry} minutes and can only be used once.
                </p>

                <p style="font-size:13px;line-height:21px;color:#6b7280;margin:0;">
                  If you did not request a password reset, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

  await sendGraphMail({
    to,
    subject: "Reset your MyShops password",
    html,
  });
};

exports.sendGraphMail = sendGraphMail;
