const {
  EMIRATE_DISPLAY_NAMES,
} = require(
  "./customerAddress.constants"
);

const toNumberOrNull =
  (
    value
  ) => {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ""
    ) {
      return null;
    }

    const parsed =
      Number(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : null;
  };

const mapCustomerAddress =
  (
    model
  ) => {
    const address =
      model?.get
        ? model.get({
            plain:
              true,
          })
        : model;

    if (
      !address
    ) {
      return null;
    }

    return {
      id:
        address.id,

      companyId:
        address.companyId,

      customerId:
        address.customerId,

      addressType:
        address.addressType,

      label:
        address.label,

      recipient: {
        firstName:
          address.firstName,

        lastName:
          address.lastName,

        fullName:
          [
            address.firstName,
            address.lastName,
          ]
            .filter(
              Boolean
            )
            .join(
              " "
            ),

        companyName:
          address.companyName,

        mobile:
          address.mobile,

        email:
          address.email,
      },

      location: {
        countryCode:
          address.countryCode,

        country:
          address.country,

        emirate:
          address.emirate,

        emirateDisplayName:
          EMIRATE_DISPLAY_NAMES[
            address.emirate
          ] ||
          address.emirate,

        city:
          address.city,

        area:
          address.area,

        street:
          address.street,

        building:
          address.building,

        floor:
          address.floor,

        apartment:
          address.apartment,

        villaNumber:
          address.villaNumber,

        landmark:
          address.landmark,

        postalCode:
          address.postalCode,

        latitude:
          toNumberOrNull(
            address.latitude
          ),

        longitude:
          toNumberOrNull(
            address.longitude
          ),
      },

      deliveryInstructions:
        address.deliveryInstructions,

      isDefaultShipping:
        address.isDefaultShipping,

      isDefaultBilling:
        address.isDefaultBilling,

      isActive:
        address.isActive,

      createdAt:
        address.createdAt,

      updatedAt:
        address.updatedAt,
    };
  };

module.exports = {
  mapCustomerAddress,
};
