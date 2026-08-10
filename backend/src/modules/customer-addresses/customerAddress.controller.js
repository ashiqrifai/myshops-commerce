const service =
  require(
    "./customerAddress.service"
  );

const messages =
  require(
    "./customerAddress.messages"
  );

exports.list =
  async (
    req,
    res,
    next
  ) => {
    try {
      const addresses =
        await service
          .listAddresses({
            customer:
              req.customer,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            addresses,

          meta: {
            count:
              addresses.length,
          },
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

exports.getById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const address =
        await service
          .getAddress({
            customer:
              req.customer,

            addressId:
              req.params.id,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            address,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

exports.create =
  async (
    req,
    res,
    next
  ) => {
    try {
      const address =
        await service
          .createAddress({
            customer:
              req.customer,

            payload:
              req.body,
          });

      return res
        .status(
          201
        )
        .json({
          success:
            true,

          message:
            messages.CREATED,

          data:
            address,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

exports.update =
  async (
    req,
    res,
    next
  ) => {
    try {
      const address =
        await service
          .updateAddress({
            customer:
              req.customer,

            addressId:
              req.params.id,

            payload:
              req.body,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            messages.UPDATED,

          data:
            address,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

exports.remove =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await service
          .deleteAddress({
            customer:
              req.customer,

            addressId:
              req.params.id,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            messages.DELETED,

          data:
            result,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

exports.setDefaultShipping =
  async (
    req,
    res,
    next
  ) => {
    try {
      const address =
        await service
          .setDefaultShipping({
            customer:
              req.customer,

            addressId:
              req.params.id,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            messages
              .DEFAULT_SHIPPING_UPDATED,

          data:
            address,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };

exports.setDefaultBilling =
  async (
    req,
    res,
    next
  ) => {
    try {
      const address =
        await service
          .setDefaultBilling({
            customer:
              req.customer,

            addressId:
              req.params.id,
          });

      return res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            messages
              .DEFAULT_BILLING_UPDATED,

          data:
            address,
        });
    } catch (
      error
    ) {
      return next(
        error
      );
    }
  };
