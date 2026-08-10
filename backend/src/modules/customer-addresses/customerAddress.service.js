const {
  Op,
} = require(
  "sequelize"
);

const db =
  require(
    "../../models"
  );

const AppError =
  require(
    "../../utils/AppError"
  );

const messages =
  require(
    "./customerAddress.messages"
  );

const {
  mapCustomerAddress,
} = require(
  "./customerAddress.mapper"
);

const cleanNullable =
  (
    value
  ) => {
    if (
      value ===
        undefined ||
      value ===
        null
    ) {
      return null;
    }

    const text =
      String(
        value
      ).trim();

    return text ||
      null;
  };

const buildPayload =
  ({
    customer,
    payload,
  }) => ({
    companyId:
      customer.companyId,

    customerId:
      customer.id,

    addressType:
      String(
        payload.addressType ||
        "HOME"
      )
        .trim()
        .toUpperCase(),

    label:
      String(
        payload.label ||
        "Home"
      ).trim(),

    firstName:
      String(
        payload.firstName
      ).trim(),

    lastName:
      cleanNullable(
        payload.lastName
      ),

    companyName:
      cleanNullable(
        payload.companyName
      ),

    mobile:
      String(
        payload.mobile
      ).trim(),

    email:
      cleanNullable(
        payload.email
      )?.toLowerCase() ||
      null,

    countryCode:
      String(
        payload.countryCode ||
        "AE"
      )
        .trim()
        .toUpperCase(),

    country:
      String(
        payload.country ||
        "United Arab Emirates"
      ).trim(),

    emirate:
      String(
        payload.emirate
      )
        .trim()
        .toUpperCase(),

    city:
      cleanNullable(
        payload.city
      ),

    area:
      String(
        payload.area
      ).trim(),

    street:
      String(
        payload.street
      ).trim(),

    building:
      String(
        payload.building
      ).trim(),

    floor:
      cleanNullable(
        payload.floor
      ),

    apartment:
      cleanNullable(
        payload.apartment
      ),

    villaNumber:
      cleanNullable(
        payload.villaNumber
      ),

    landmark:
      cleanNullable(
        payload.landmark
      ),

    postalCode:
      cleanNullable(
        payload.postalCode
      ),

    latitude:
      payload.latitude ===
        undefined ||
      payload.latitude ===
        null ||
      payload.latitude ===
        ""
        ? null
        : Number(
            payload.latitude
          ),

    longitude:
      payload.longitude ===
        undefined ||
      payload.longitude ===
        null ||
      payload.longitude ===
        ""
        ? null
        : Number(
            payload.longitude
          ),

    deliveryInstructions:
      cleanNullable(
        payload.deliveryInstructions
      ),

    isDefaultShipping:
      payload.isDefaultShipping ===
      true,

    isDefaultBilling:
      payload.isDefaultBilling ===
      true,

    updatedBy:
      customer.id,
  });

const findOwnedAddress =
  async ({
    customer,
    addressId,
    transaction,
    lock,
  }) => {
    const address =
      await db.CustomerAddress
        .findOne({
          where: {
            id:
              addressId,

            companyId:
              customer.companyId,

            customerId:
              customer.id,

            isActive:
              true,
          },

          transaction,

          lock:
            lock ||
            undefined,
        });

    if (
      !address
    ) {
      throw new AppError(
        messages.NOT_FOUND,
        404,
        "CUSTOMER_ADDRESS_NOT_FOUND"
      );
    }

    return address;
  };

const clearDefaultFlag =
  async ({
    customer,
    field,
    exceptId,
    transaction,
  }) => {
    await db.CustomerAddress
      .update(
        {
          [
            field
          ]:
            false,

          updatedBy:
            customer.id,
        },

        {
          where: {
            companyId:
              customer.companyId,

            customerId:
              customer.id,

            isActive:
              true,

            id: {
              [
                Op.ne
              ]:
                exceptId,
            },

            [
              field
            ]:
              true,
          },

          transaction,
        }
      );
  };

const ensureDefaults =
  async ({
    customer,
    transaction,
  }) => {
    const addresses =
      await db.CustomerAddress
        .findAll({
          where: {
            companyId:
              customer.companyId,

            customerId:
              customer.id,

            isActive:
              true,
          },

          order: [
            [
              "createdAt",
              "ASC",
            ],
          ],

          transaction,

          lock:
            transaction
              ?.LOCK
              ?.UPDATE,
        });

    if (
      !addresses.length
    ) {
      return;
    }

    if (
      !addresses.some(
        (
          address
        ) =>
          address
            .isDefaultShipping
      )
    ) {
      await addresses[
        0
      ].update(
        {
          isDefaultShipping:
            true,

          updatedBy:
            customer.id,
        },

        {
          transaction,
        }
      );
    }

    if (
      !addresses.some(
        (
          address
        ) =>
          address
            .isDefaultBilling
      )
    ) {
      await addresses[
        0
      ].update(
        {
          isDefaultBilling:
            true,

          updatedBy:
            customer.id,
        },

        {
          transaction,
        }
      );
    }
  };

const listAddresses =
  async ({
    customer,
  }) => {
    const addresses =
      await db.CustomerAddress
        .findAll({
          where: {
            companyId:
              customer.companyId,

            customerId:
              customer.id,

            isActive:
              true,
          },

          order: [
            [
              "isDefaultShipping",
              "DESC",
            ],

            [
              "isDefaultBilling",
              "DESC",
            ],

            [
              "updatedAt",
              "DESC",
            ],
          ],
        });

    return addresses.map(
      mapCustomerAddress
    );
  };

const getAddress =
  async ({
    customer,
    addressId,
  }) =>
    mapCustomerAddress(
      await findOwnedAddress({
        customer,
        addressId,
      })
    );

const createAddress =
  async ({
    customer,
    payload,
  }) => {
    const transaction =
      await db.sequelize
        .transaction();

    try {
      const existingCount =
        await db.CustomerAddress
          .count({
            where: {
              companyId:
                customer.companyId,

              customerId:
                customer.id,

              isActive:
                true,
            },

            transaction,
          });

      const values =
        buildPayload({
          customer,
          payload,
        });

      values.createdBy =
        customer.id;

      if (
        existingCount ===
        0
      ) {
        values.isDefaultShipping =
          true;

        values.isDefaultBilling =
          true;
      }

      const address =
        await db.CustomerAddress
          .create(
            values,
            {
              transaction,
            }
          );

      if (
        address.isDefaultShipping
      ) {
        await clearDefaultFlag({
          customer,
          field:
            "isDefaultShipping",
          exceptId:
            address.id,
          transaction,
        });
      }

      if (
        address.isDefaultBilling
      ) {
        await clearDefaultFlag({
          customer,
          field:
            "isDefaultBilling",
          exceptId:
            address.id,
          transaction,
        });
      }

      await ensureDefaults({
        customer,
        transaction,
      });

      await transaction
        .commit();

      return mapCustomerAddress(
        address
      );
    } catch (
      error
    ) {
      await transaction
        .rollback();

      throw error;
    }
  };

const updateAddress =
  async ({
    customer,
    addressId,
    payload,
  }) => {
    const transaction =
      await db.sequelize
        .transaction();

    try {
      const address =
        await findOwnedAddress({
          customer,
          addressId,
          transaction,
          lock:
            transaction.LOCK
              .UPDATE,
        });

      const values =
        buildPayload({
          customer,
          payload,
        });

      await address.update(
        values,
        {
          transaction,
        }
      );

      if (
        address.isDefaultShipping
      ) {
        await clearDefaultFlag({
          customer,
          field:
            "isDefaultShipping",
          exceptId:
            address.id,
          transaction,
        });
      }

      if (
        address.isDefaultBilling
      ) {
        await clearDefaultFlag({
          customer,
          field:
            "isDefaultBilling",
          exceptId:
            address.id,
          transaction,
        });
      }

      await ensureDefaults({
        customer,
        transaction,
      });

      await transaction
        .commit();

      return mapCustomerAddress(
        address
      );
    } catch (
      error
    ) {
      await transaction
        .rollback();

      throw error;
    }
  };

const deleteAddress =
  async ({
    customer,
    addressId,
  }) => {
    const transaction =
      await db.sequelize
        .transaction();

    try {
      const address =
        await findOwnedAddress({
          customer,
          addressId,
          transaction,
          lock:
            transaction.LOCK
              .UPDATE,
        });

      await address.update(
        {
          isActive:
            false,

          isDefaultShipping:
            false,

          isDefaultBilling:
            false,

          updatedBy:
            customer.id,
        },

        {
          transaction,
        }
      );

      await ensureDefaults({
        customer,
        transaction,
      });

      await transaction
        .commit();

      return {
        id:
          address.id,

        deleted:
          true,
      };
    } catch (
      error
    ) {
      await transaction
        .rollback();

      throw error;
    }
  };

const setDefault =
  async ({
    customer,
    addressId,
    field,
  }) => {
    const transaction =
      await db.sequelize
        .transaction();

    try {
      const address =
        await findOwnedAddress({
          customer,
          addressId,
          transaction,
          lock:
            transaction.LOCK
              .UPDATE,
        });

      await clearDefaultFlag({
        customer,
        field,
        exceptId:
          address.id,
        transaction,
      });

      await address.update(
        {
          [
            field
          ]:
            true,

          updatedBy:
            customer.id,
        },

        {
          transaction,
        }
      );

      await transaction
        .commit();

      return mapCustomerAddress(
        address
      );
    } catch (
      error
    ) {
      await transaction
        .rollback();

      throw error;
    }
  };

module.exports = {
  listAddresses,
  getAddress,
  createAddress,
  updateAddress,
  deleteAddress,

  setDefaultShipping(
    args
  ) {
    return setDefault({
      ...args,

      field:
        "isDefaultShipping",
    });
  },

  setDefaultBilling(
    args
  ) {
    return setDefault({
      ...args,

      field:
        "isDefaultBilling",
    });
  },
};
