const {
    getAccessToken,
  } =
    require(
      "./zohoAuth.service"
    );
  
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
  | Zoho Configuration
  |--------------------------------------------------------------------------
  */
  
  const getZohoConfig =
    () => {
      const organizationId =
        getRequiredEnv(
          "ZOHO_ORGANIZATION_ID"
        );
  
      const apiBaseUrl =
        String(
          process.env
            .ZOHO_API_BASE_URL ||
          "https://www.zohoapis.com"
        )
          .trim()
          .replace(
            /\/+$/,
            ""
          );
  
      return {
        organizationId,
        apiBaseUrl,
      };
    };
  
  /*
  |--------------------------------------------------------------------------
  | Get Zoho Locations
  |--------------------------------------------------------------------------
  */
  
  const getLocations =
    async () => {
      const {
        organizationId,
        apiBaseUrl,
      } =
        getZohoConfig();
  
      const accessToken =
        await getAccessToken();
  
      const params =
        new URLSearchParams({
          organization_id:
            organizationId,
        });
  
      const response =
        await fetch(
          `${apiBaseUrl}/inventory/v1/locations?${params.toString()}`,
          {
            method:
              "GET",
  
            headers: {
              Accept:
                "application/json",
  
              Authorization:
                `Zoho-oauthtoken ${accessToken}`,
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
          `Zoho locations API returned HTTP ${response.status}.`
        );
      }
  
      if (
        !payload ||
        Number(
          payload.code
        ) !==
          0
      ) {
        throw new Error(
          payload
            ?.message ||
          "Unable to load Zoho locations."
        );
      }
  
      const locations =
        Array.isArray(
          payload.locations
        )
          ? payload.locations
          : [];
  
      return locations.map(
        (
          location
        ) => ({
          locationId:
            String(
              location.location_id ||
              ""
            ),
  
          locationName:
            location.location_name ||
            null,
  
          type:
            location.type ||
            null,
  
          status:
            location.status ||
            (
              location
                .is_location_active ===
              true
                ? "active"
                : location
                      .is_location_active ===
                    false
                  ? "inactive"
                  : null
            ),
  
          isPrimary:
            location.is_primary ??
            location.is_primary_location ??
            false,
  
          parentLocationId:
            location.parent_location_id
              ? String(
                  location.parent_location_id
                )
              : null,
  
          address: {
            city:
              location.address
                ?.city ||
              null,
  
            state:
              location.address
                ?.state ||
              null,
  
            country:
              location.address
                ?.country ||
              null,
  
            streetAddress1:
              location.address
                ?.street_address1 ||
              null,
  
            streetAddress2:
              location.address
                ?.street_address2 ||
              null,
          },
        })
      );
    };
  
  module.exports = {
    getLocations,
  };