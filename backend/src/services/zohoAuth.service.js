/*
|--------------------------------------------------------------------------
| Zoho Authentication Service
|--------------------------------------------------------------------------
|
| Zoho OAuth token is managed by the existing VK Tech authentication
| middleware.
|
| MyShops does NOT store:
| - Zoho client secret
| - Zoho refresh token
|
|--------------------------------------------------------------------------
*/

let cachedAccessToken =
  null;

let cachedExpiresAt =
  0;

const getRequiredEnv =
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

/*
|--------------------------------------------------------------------------
| Extract Token
|--------------------------------------------------------------------------
|
| We don't yet know the exact response shape from vktech.app.
| This supports the common possibilities.
|--------------------------------------------------------------------------
*/

const extractAccessToken =
  (
    payload
  ) => {
    if (
      !payload
    ) {
      return null;
    }

    /*
     * vktech.app returns:
     *
     * [
     *   {
     *     access_token: "..."
     *   }
     * ]
     */
    if (
      Array.isArray(
        payload
      )
    ) {
      if (
        payload.length ===
        0
      ) {
        return null;
      }

      return extractAccessToken(
        payload[0]
      );
    }

    if (
      typeof payload ===
      "string"
    ) {
      return payload.trim();
    }

    return (
      payload.access_token ||
      payload.accessToken ||
      payload.token ||
      payload.data
        ?.access_token ||
      payload.data
        ?.accessToken ||
      payload.data
        ?.token ||
      null
    );
  };

/*
|--------------------------------------------------------------------------
| Get Zoho Access Token
|--------------------------------------------------------------------------
*/

const getAccessToken =
  async ({
    forceRefresh =
      false,
  } = {}) => {
    /*
     * Cache for only a short period.
     *
     * vktech.app remains the actual authority
     * for Zoho authentication.
     */

    if (
      !forceRefresh &&
      cachedAccessToken &&
      cachedExpiresAt >
        Date.now()
    ) {
      return cachedAccessToken;
    }

    const authUrl =
      getRequiredEnv(
        "ZOHO_AUTH_URL"
      );

    const apiKey =
      getRequiredEnv(
        "ZOHO_AUTH_API_KEY"
      );

    const response =
      await fetch(
        authUrl,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json",

            "api-key-header":
              apiKey,
          },

          cache:
            "no-store",
        }
      );

    const payload =
      await response
        .json()
        .catch(
          () => null
        );

    if (
      !response.ok
    ) {
      throw new Error(
        payload
          ?.message ||
        payload
          ?.error ||
        `Zoho authentication service returned HTTP ${response.status}.`
      );
    }

    const accessToken =
      extractAccessToken(
        payload
      );

    if (
      !accessToken
    ) {
      console.error(
        "Unexpected Zoho authentication response:",
        payload
      );

      throw new Error(
        "Zoho authentication service did not return an access token."
      );
    }

    /*
     * Short local cache.
     *
     * We don't need to know the actual Zoho
     * expiry because vktech.app handles that.
     */
    cachedAccessToken =
      String(
        accessToken
      )
        .replace(
          /^Zoho-oauthtoken\s+/i,
          ""
        )
        .trim();

    cachedExpiresAt =
      Date.now() +
      5 *
        60 *
        1000;

    return cachedAccessToken;
  };

const clearAccessTokenCache =
  () => {
    cachedAccessToken =
      null;

    cachedExpiresAt =
      0;
  };

module.exports = {
  getAccessToken,
  clearAccessTokenCache,
};