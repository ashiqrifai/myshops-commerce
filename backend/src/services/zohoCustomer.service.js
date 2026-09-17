const {
  Op,
} =
  require(
    "sequelize"
  );

const db =
  require(
    "../models"
  );

const {
    getAccessToken,
  } =
    require(
      "./zohoAuth.service"
    );
  
  /*
  |--------------------------------------------------------------------------
  | Configuration
  |--------------------------------------------------------------------------
  */
  
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
  | Normalizers
  |--------------------------------------------------------------------------
  */
  
  const normalizeEmail =
    (
      value
    ) =>
      String(
        value ||
        ""
      )
        .trim()
        .toLowerCase();
  
  const normalizePhone =
    (
      value
    ) => {
      const raw =
        String(
          value ||
          ""
        ).trim();
  
      if (!raw) {
        return "";
      }
  
      return raw.replace(
        /[\s\-()]/g,
        ""
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | UAE Place of Supply
  |--------------------------------------------------------------------------
  */

  const UAE_EMIRATES = {
    "ABU DHABI": {
      code: "AB",
      name: "Abu Dhabi",
    },

    "AJMAN": {
      code: "AJ",
      name: "Ajman",
    },

    "DUBAI": {
      code: "DU",
      name: "Dubai",
    },

    "FUJAIRAH": {
      code: "FU",
      name: "Fujairah",
    },

    "RAS AL KHAIMAH": {
      code: "RA",
      name: "Ras Al Khaimah",
    },

    "RAS AL-KHAIMAH": {
      code: "RA",
      name: "Ras Al Khaimah",
    },

    "RAK": {
      code: "RA",
      name: "Ras Al Khaimah",
    },

    "SHARJAH": {
      code: "SH",
      name: "Sharjah",
    },

    "UMM AL QUWAIN": {
      code: "UM",
      name: "Umm Al Quwain",
    },

    "UMM AL-QUWAIN": {
      code: "UM",
      name: "Umm Al Quwain",
    },

    "UAQ": {
      code: "UM",
      name: "Umm Al Quwain",
    },
  };

  const resolveUaeEmirate =
    (
      address
    ) => {
      const candidates =
        [
          address
            ?.emirate,

          address
            ?.city,

          address
            ?.state,

          address
            ?.area,
        ]
          .map(
            (
              value
            ) =>
              String(
                value ||
                ""
              )
                .trim()
                .toUpperCase()
          )
          .filter(
            Boolean
          );

      for (
        const candidate of
        candidates
      ) {
        if (
          UAE_EMIRATES[
            candidate
          ]
        ) {
          return UAE_EMIRATES[
            candidate
          ];
        }

        for (
          const [
            key,
            emirate,
          ] of
          Object.entries(
            UAE_EMIRATES
          )
        ) {
          if (
            candidate.includes(
              key
            )
          ) {
            return emirate;
          }
        }
      }

      return null;
    };

  const getRequiredUaeEmirate =
    (
      address
    ) => {
      const emirate =
        resolveUaeEmirate(
          address
        );

      if (
        !emirate
      ) {
        throw new Error(
          "Unable to determine UAE emirate / Zoho place of supply from the effective order address."
        );
      }

      return emirate;
    };

  /*
  |--------------------------------------------------------------------------
  | Zoho API Helper
  |--------------------------------------------------------------------------
  */
  
  const zohoGet =
    async (
      path,
      params = {}
    ) => {
      const {
        organizationId,
        apiBaseUrl,
      } =
        getZohoConfig();
  
      const token =
        await getAccessToken();
  
      const searchParams =
        new URLSearchParams({
          organization_id:
            organizationId,
  
          ...Object.fromEntries(
            Object.entries(
              params
            ).filter(
              (
                [
                  ,
                  value,
                ]
              ) =>
                value !==
                  undefined &&
                value !==
                  null &&
                String(
                  value
                ).trim() !==
                  ""
            )
          ),
        });
  
      const response =
        await fetch(
          `${apiBaseUrl}/books/v3/${path}?${searchParams.toString()}`,
          {
            method:
              "GET",
  
            headers: {
              Accept:
                "application/json",
  
              Authorization:
                `Zoho-oauthtoken ${token}`,
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
  
      if (!response.ok) {
        throw new Error(
          payload
            ?.message ||
          `Zoho API returned HTTP ${response.status}.`
        );
      }
  
      return payload;
    };
  
  const zohoPost =
    async (
      path,
      body
    ) => {
      const {
        organizationId,
        apiBaseUrl,
      } =
        getZohoConfig();
  
      const token =
        await getAccessToken();
  
      const response =
        await fetch(
          `${apiBaseUrl}/books/v3/${path}?organization_id=${encodeURIComponent(
            organizationId
          )}`,
          {
            method:
              "POST",
  
            headers: {
              Accept:
                "application/json",
  
              "Content-Type":
                "application/json",
  
              Authorization:
                `Zoho-oauthtoken ${token}`,
            },
  
            body:
              JSON.stringify(
                body
              ),
          }
        );
  
      const payload =
        await response
          .json()
          .catch(
            () => null
          );
  
      if (
        !response.ok ||
        Number(
          payload
            ?.code
        ) !==
          0
      ) {
        throw new Error(
          payload
            ?.message ||
          `Zoho API returned HTTP ${response.status}.`
        );
      }
  
      return payload;
    };
  
  const zohoPut =
    async (
      path,
      body
    ) => {
      const {
        organizationId,
        apiBaseUrl,
      } =
        getZohoConfig();

      const token =
        await getAccessToken();

      const response =
        await fetch(
          `${apiBaseUrl}/books/v3/${path}?organization_id=${encodeURIComponent(
            organizationId
          )}`,
          {
            method:
              "PUT",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Zoho-oauthtoken ${token}`,
            },

            body:
              JSON.stringify(
                body
              ),
          }
        );

      const payload =
        await response
          .json()
          .catch(
            () => null
          );

      if (
        !response.ok ||
        Number(
          payload
            ?.code
        ) !==
          0
      ) {
        throw new Error(
          payload
            ?.message ||
          `Zoho API returned HTTP ${response.status}.`
        );
      }

      return payload;
    };

  const getZohoCustomerById =
    async (
      customerId
    ) => {
      const payload =
        await zohoGet(
          `contacts/${encodeURIComponent(
            customerId
          )}`
        );

      return (
        payload
          ?.contact ||
        null
      );
    };

  /*
  |--------------------------------------------------------------------------
  | Effective Address
  |--------------------------------------------------------------------------
  |
  | Delivery address wins when it contains a recognisable UAE emirate.
  |
  | For pickup-only orders, the shipping address can legitimately be blank.
  | In that case we load the selected pickup InventoryLocation through the
  | shipment allocation and use that store's emirate/city for Zoho.
  |--------------------------------------------------------------------------
  */

  const resolveEffectiveZohoAddress =
    async ({
      order,
      address,
    }) => {
      /*
       * Normal delivery address wins when it already
       * resolves to a valid UAE emirate.
       */
      if (
        resolveUaeEmirate(
          address
        )
      ) {
        return address;
      }

      /*
       * Pickup fallback.
       *
       * Keep these queries deliberately simple instead
       * of using a deep Sequelize include. PostgreSQL can
       * reject the generated nested alias SQL with:
       *
       * missing FROM-clause entry for table
       * "items->allocations->inventoryLocation"
       */
      const pickupShipment =
        await db.OrderShipment.findOne({
          where: {
            orderId:
              order.id,

            deliveryMethod:
              "PICKUP",
          },

          attributes: [
            "id",
            "orderId",
            "deliveryMethod",
            "deliveryLabel",
          ],

          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],

          raw:
            true,
        });

      if (
        !pickupShipment
      ) {
        return (
          address ||
          null
        );
      }

      const shipmentItems =
        await db.OrderShipmentItem.findAll({
          where: {
            orderShipmentId:
              pickupShipment.id,
          },

          attributes: [
            "id",
            "orderShipmentId",
            "orderItemId",
          ],

          raw:
            true,
        });

      if (
        !shipmentItems.length
      ) {
        return (
          address ||
          null
        );
      }

      const shipmentItemIds =
        shipmentItems.map(
          item =>
            item.id
        );

      const allocation =
        await db.OrderShipmentAllocation.findOne({
          where: {
            orderShipmentItemId: {
              [Op.in]:
                shipmentItemIds,
            },

            status: {
              [Op.in]: [
                "RESERVED",
                "FULFILLED",
              ],
            },
          },

          attributes: [
            "id",
            "inventoryLocationId",
            "status",
          ],

          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],

          raw:
            true,
        });

      if (
        !allocation
          ?.inventoryLocationId
      ) {
        return (
          address ||
          null
        );
      }

      const location =
        await db.InventoryLocation.findOne({
          where: {
            id:
              allocation
                .inventoryLocationId,

            companyId:
              order.companyId,

            isActive:
              true,
          },

          attributes: [
            "id",
            "code",
            "name",
            "countryCode",
            "country",
            "emirate",
            "city",
            "area",
            "addressLine1",
            "addressLine2",
            "landmark",
            "phone",
          ],

          raw:
            true,
        });

      if (
        !location
      ) {
        return (
          address ||
          null
        );
      }

      return {
        addressLine1:
          location
            .addressLine1 ||
          location
            .name ||
          location
            .code ||
          "Store Pickup",

        addressLine2:
          location
            .addressLine2 ||
          null,

        emirate:
          location
            .emirate ||
          location
            .city ||
          null,

        city:
          location
            .city ||
          location
            .emirate ||
          null,

        area:
          location
            .area ||
          null,

        landmark:
          location
            .landmark ||
          null,

        countryCode:
          location
            .countryCode ||
          "AE",

        country:
          location
            .country ||
          "United Arab Emirates",

        mobile:
          location
            .phone ||
          order
            .customerPhone ||
          null,

        pickupLocationId:
          location
            .id,

        pickupLocationCode:
          location
            .code,

        pickupLocationName:
          location
            .name,
      };
    };

  /*
  |--------------------------------------------------------------------------
  | Ensure Zoho Customer Place of Supply
  |--------------------------------------------------------------------------
  */

  const ensureZohoCustomerPlaceOfSupply =
    async ({
      customerId,
      address,
      order = null,
    }) => {
      const emirate =
        getRequiredUaeEmirate(
          address
        );

      const contact =
        await getZohoCustomerById(
          customerId
        );

      if (
        !contact
      ) {
        throw new Error(
          `Zoho customer ${customerId} could not be loaded.`
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Current Order Address Wins
      |--------------------------------------------------------------------------
      |
      | Zoho contacts can contain an address from an older order.
      | For ecommerce, the immutable order address is authoritative for the
      | current Sales Order. Always synchronize the resolved contact with that
      | address, even when the place-of-supply code has not changed.
      |--------------------------------------------------------------------------
      */

      const firstName =
        String(
          order
            ?.customerFirstName ||
          address
            ?.firstName ||
          ""
        ).trim();

      const lastName =
        String(
          order
            ?.customerLastName ||
          address
            ?.lastName ||
          ""
        ).trim();

      const orderName =
        [
          firstName,
          lastName,
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
          .trim();

      const attention =
        orderName ||
        contact
          .contact_name ||
        "";

      const orderEmail =
        normalizeEmail(
          order
            ?.customerEmail ||
          address
            ?.email
        );

      const orderMobile =
        String(
          order
            ?.customerPhone ||
          address
            ?.mobile ||
          ""
        ).trim();

      const addressLine =
        [
          address
            ?.addressLine1,
          address
            ?.addressLine2,
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          );

      const body = {
        /*
         * Keep the existing Zoho contact name for an already-resolved contact.
         * For a newly-created customer this is already the order customer's
         * name. Address attention always uses the current order customer.
         */
        contact_name:
          contact
            .contact_name ||
          attention,

        contact_type:
          contact
            .contact_type ||
          "customer",

        tax_treatment:
          contact
            .tax_treatment ||
          "vat_not_registered",

        country_code:
          emirate.code,

        ...(orderEmail
          ? {
              email:
                orderEmail,
            }
          : {}),

        ...(orderMobile
          ? {
              phone:
                orderMobile,

              mobile:
                orderMobile,
            }
          : {}),

        billing_address: {
          attention,

          address:
            addressLine,

          street2:
            "",

          city:
            address
              ?.city ||
            emirate.name,

          state:
            emirate.name,

          zip:
            "",

          country:
            address
              ?.country ||
            "United Arab Emirates",

          phone:
            address
              ?.mobile ||
            orderMobile ||
            "",
        },

        shipping_address: {
          attention,

          address:
            addressLine,

          street2:
            "",

          city:
            address
              ?.city ||
            emirate.name,

          state:
            emirate.name,

          zip:
            "",

          country:
            address
              ?.country ||
            "United Arab Emirates",

          phone:
            address
              ?.mobile ||
            orderMobile ||
            "",
        },
      };

      const payload =
        await zohoPut(
          `contacts/${encodeURIComponent(
            customerId
          )}`,
          body
        );

      return {
        contact:
          payload
            ?.contact ||
          contact,

        updated:
          true,

        placeOfSupply:
          emirate.code,
      };
    };

  /*
  |--------------------------------------------------------------------------
  | Search By Email
  |--------------------------------------------------------------------------
  */
  
  const findZohoCustomerByEmail =
    async (
      email
    ) => {
      const normalizedEmail =
        normalizeEmail(
          email
        );
  
      if (!normalizedEmail) {
        return null;
      }
  
      const payload =
        await zohoGet(
          "contacts",
          {
            email:
              normalizedEmail,
          }
        );
  
      const contacts =
        Array.isArray(
          payload
            ?.contacts
        )
          ? payload.contacts
          : [];
  
      const exact =
        contacts.find(
          (
            contact
          ) => {
            const primaryEmail =
              normalizeEmail(
                contact.email
              );
  
            if (
              primaryEmail ===
              normalizedEmail
            ) {
              return true;
            }
  
            const persons =
              Array.isArray(
                contact
                  .contact_persons
              )
                ? contact
                    .contact_persons
                : [];
  
            return persons.some(
              (
                person
              ) =>
                normalizeEmail(
                  person.email
                ) ===
                normalizedEmail
            );
          }
        );
  
      /*
       * IMPORTANT:
       * Zoho's contact search may return broad/partial matches.
       * Never attach an ecommerce order to contacts[0].
       * Only an exact normalized email match is safe.
       */
      return (
        exact ||
        null
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Search By Mobile
  |--------------------------------------------------------------------------
  */
  
  const findZohoCustomerByMobile =
    async (
      mobile
    ) => {
      const normalizedMobile =
        normalizePhone(
          mobile
        );
  
      if (!normalizedMobile) {
        return null;
      }
  
      /*
       * Zoho search parameter.
       *
       * Depending on the account,
       * phone/mobile can be indexed differently.
       */
      let payload =
        await zohoGet(
          "contacts",
          {
            phone:
              normalizedMobile,
          }
        );
  
      let contacts =
        Array.isArray(
          payload
            ?.contacts
        )
          ? payload.contacts
          : [];
  
      if (
        !contacts.length
      ) {
        payload =
          await zohoGet(
            "contacts",
            {
              mobile:
                normalizedMobile,
            }
          );
  
        contacts =
          Array.isArray(
            payload
              ?.contacts
          )
            ? payload.contacts
            : [];
      }
  
      const exact =
        contacts.find(
          (
            contact
          ) => {
            const candidates =
              [
                contact.phone,
                contact.mobile,
              ]
                .map(
                  normalizePhone
                )
                .filter(
                  Boolean
                );
  
            if (
              candidates.includes(
                normalizedMobile
              )
            ) {
              return true;
            }
  
            const persons =
              Array.isArray(
                contact
                  .contact_persons
              )
                ? contact
                    .contact_persons
                : [];
  
            return persons.some(
              (
                person
              ) =>
                [
                  person.phone,
                  person.mobile,
                ]
                  .map(
                    normalizePhone
                  )
                  .includes(
                    normalizedMobile
                  )
            );
          }
        );
  
      /*
       * IMPORTANT:
       * A phone/mobile search can also return broad results.
       * Only an exact normalized phone/mobile match is safe.
       */
      return (
        exact ||
        null
      );
    };
  
  /*
  |--------------------------------------------------------------------------
  | Create Zoho Customer
  |--------------------------------------------------------------------------
  */
  
  const createZohoCustomer =
    async ({
      order,
      address,
    }) => {
      const firstName =
        String(
          order.customerFirstName ||
          ""
        ).trim();
  
      const lastName =
        String(
          order.customerLastName ||
          ""
        ).trim();
  
      const email =
        normalizeEmail(
          order.customerEmail
        );
  
      const mobile =
        String(
          order.customerPhone ||
          ""
        ).trim();
  
      const contactName =
        [
          firstName,
          lastName,
        ]
          .filter(
            Boolean
          )
          .join(
            " "
          )
          .trim() ||
        email ||
        mobile ||
        `MyShops Customer ${order.orderNumber}`;
  
      const addressLine =
        [
          address
            ?.addressLine1,
          address
            ?.addressLine2,
        ]
          .filter(
            Boolean
          )
          .join(
            ", "
          );
  
      const body = {
        contact_name:
          contactName,
  
        contact_type:
          "customer",
  
        ...(email
          ? {
              email,
            }
          : {}),
  
        ...(mobile
          ? {
              phone:
                mobile,
  
              mobile,
            }
          : {}),
  
        contact_persons: [
          {
            first_name:
              firstName ||
              contactName,
  
            last_name:
              lastName ||
              "",
  
            email:
              email ||
              "",
  
            phone:
              mobile ||
              "",
  
            mobile:
              mobile ||
              "",
  
            is_primary_contact:
              true,
          },
        ],
  
        ...(address
          ? {
              billing_address: {
                attention:
                  contactName,
  
                address:
                  addressLine,
  
                city:
                  address.city ||
                  "",
  
                state:
                  address.emirate ||
                  "",
  
                country:
                  address.country ||
                  "United Arab Emirates",
  
                phone:
                  address.mobile ||
                  mobile ||
                  "",
              },
  
              shipping_address: {
                attention:
                  contactName,
  
                address:
                  addressLine,
  
                city:
                  address.city ||
                  "",
  
                state:
                  address.emirate ||
                  "",
  
                country:
                  address.country ||
                  "United Arab Emirates",
  
                phone:
                  address.mobile ||
                  mobile ||
                  "",
              },
            }
          : {}),
      };
  
      const payload =
        await zohoPost(
          "contacts",
          body
        );
  
      const contact =
        payload
          ?.contact;
  
      if (
        !contact
          ?.contact_id
      ) {
        throw new Error(
          "Zoho customer creation returned no contact_id."
        );
      }
  
      return contact;
    };
  
  /*
  |--------------------------------------------------------------------------
  | Resolve Customer
  |--------------------------------------------------------------------------
  */

  const resolveZohoCustomer =
    async ({
      order,
      address,
    }) => {
      const effectiveAddress =
        await resolveEffectiveZohoAddress({
          order,
          address,
        });

      /*
       * 1. Existing local mapping.
       */
      if (
        order.customer
          ?.zohoCustomerId
      ) {
        const customerId =
          String(
            order.customer
              .zohoCustomerId
          );

        const placeOfSupply =
          await ensureZohoCustomerPlaceOfSupply({
            customerId,

            address:
              effectiveAddress,

            order,
          });

        return {
          customerId,

          source:
            "LOCAL_MAPPING",

          placeOfSupply:
            placeOfSupply
              .placeOfSupply,

          customerUpdated:
            placeOfSupply
              .updated,

          effectiveAddress,
        };
      }

      /*
       * 2. Search by email.
       */
      let zohoCustomer =
        await findZohoCustomerByEmail(
          order.customerEmail
        );

      let source =
        zohoCustomer
          ? "ZOHO_EMAIL"
          : null;

      /*
       * 3. Search by mobile.
       */
      if (
        !zohoCustomer
      ) {
        zohoCustomer =
          await findZohoCustomerByMobile(
            order.customerPhone
          );

        if (
          zohoCustomer
        ) {
          source =
            "ZOHO_MOBILE";
        }
      }

      /*
       * 4. Create if not found.
       */
      if (
        !zohoCustomer
      ) {
        zohoCustomer =
          await createZohoCustomer({
            order,

            address:
              effectiveAddress,
          });

        source =
          "ZOHO_CREATED";
      }

      const customerId =
        String(
          zohoCustomer
            .contact_id ||
          ""
        ).trim();

      if (
        !customerId
      ) {
        throw new Error(
          "Unable to resolve Zoho customer_id."
        );
      }

      const placeOfSupply =
        await ensureZohoCustomerPlaceOfSupply({
          customerId,

          address:
            effectiveAddress,

          order,
        });

      /*
       * 5. Cache mapping for registered MyShops customer.
       */
      if (
        order.customer
      ) {
        await order.customer.update({
          zohoCustomerId:
            customerId,

          zohoLastSyncedAt:
            new Date(),
        });
      }

      return {
        customerId,

        source,

        placeOfSupply:
          placeOfSupply
            .placeOfSupply,

        customerUpdated:
          placeOfSupply
            .updated,

        effectiveAddress,
      };
    };

  module.exports = {
    findZohoCustomerByEmail,
    findZohoCustomerByMobile,
    createZohoCustomer,
    resolveZohoCustomer,
    ensureZohoCustomerPlaceOfSupply,
    resolveUaeEmirate,
    resolveEffectiveZohoAddress,
  };
