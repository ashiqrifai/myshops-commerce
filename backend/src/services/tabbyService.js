const API_URL = (process.env.TABBY_API_URL || "https://api.tabby.ai").replace(/\/+$/, "");

const required = (name) => {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const error = new Error(`${name} is not configured.`);
    error.statusCode = 500;
    throw error;
  }
  return value;
};

const request = async ({ path, method = "GET", body }) => {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${required("TABBY_SECRET_KEY")}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let data = null;
  try { data = await response.json(); } catch {}

  if (!response.ok) {
    const error = new Error(
      data?.error || data?.message ||
      `Tabby request failed with status ${response.status}.`
    );
    error.statusCode = response.status;
    error.providerPayload = data;
    throw error;
  }

  return data;
};

exports.createCheckout = ({ payment, lang = "en", merchantUrls }) =>
  request({
    path: "/api/v2/checkout",
    method: "POST",
    body: {
      payment,
      lang,
      merchant_code: required("TABBY_MERCHANT_CODE"),
      merchant_urls: merchantUrls,
    },
  });

exports.getPayment = (paymentId) =>
  request({
    path: `/api/v2/payments/${encodeURIComponent(paymentId)}`,
  });


exports.capturePayment = (
  paymentId,
  payload
) =>
  request({
    path:
      `/api/v2/payments/${encodeURIComponent(
        paymentId
      )}/captures`,
    method:
      "POST",
    body:
      payload,
  });
