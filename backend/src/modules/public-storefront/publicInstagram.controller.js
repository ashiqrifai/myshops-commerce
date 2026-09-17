const publicInstagramService =
  require(
    "./publicInstagram.service"
  );

const getInstagram =
  async (
    req,
    res,
    next
  ) => {
    try {
      const companyCode =
        req.headers[
          "x-company-code"
        ];

      const apiBaseUrl =
        `${req.protocol}://${req.get(
          "host"
        )}`;

      const data =
        await publicInstagramService
          .getPublicInstagram({
            companyCode,

            apiBaseUrl,

            limit:
              req.query
                ?.limit ||
              8,
          });

      return res.json({
        success:
          true,

        data,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

module.exports = {
  getInstagram,
};