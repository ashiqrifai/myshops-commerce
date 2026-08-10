const cmsSectionTypeService = require(
  "./cmsSectionType.service"
);

const parseBooleanQuery = (
  value,
  defaultValue
) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (
    value === true ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === "false"
  ) {
    return false;
  }

  return defaultValue;
};

exports.listCmsSectionTypes = async (
  req,
  res,
  next
) => {
  try {
    const sectionTypes =
      await cmsSectionTypeService.listCmsSectionTypes(
        {
          companyId:
            req.user.companyId,

          category:
            req.query.category,

          channel:
            req.query.channel,

          search:
            req.query.search,

          isActive:
            parseBooleanQuery(
              req.query.isActive,
              true
            ),
        }
      );

    res.status(200).json({
      success: true,
      data: sectionTypes,
    });
  } catch (error) {
    next(error);
  }
};

exports.getCmsSectionTypeById =
  async (req, res, next) => {
    try {
      const sectionType =
        await cmsSectionTypeService.getCmsSectionTypeById(
          {
            companyId:
              req.user.companyId,

            sectionTypeId:
              req.params.id,
          }
        );

      res.status(200).json({
        success: true,
        data: sectionType,
      });
    } catch (error) {
      next(error);
    }
  };

exports.syncCmsSectionTypeDefaults =
  async (req, res, next) => {
    try {
      const result =
        await cmsSectionTypeService.syncCmsSectionTypeDefaults(
          {
            companyId:
              req.user.companyId,

            sectionTypeId:
              req.params.id,

            userId:
              req.user.id,
          }
        );

      res.status(200).json({
        success: true,

        message:
          result.updatedSections > 0
            ? `${result.updatedSections} CMS section${
                result.updatedSections ===
                1
                  ? ""
                  : "s"
              } synchronized successfully.`
            : "All CMS sections already match the section type defaults.",

        data: result,
      });
    } catch (error) {
      next(error);
    }
  };