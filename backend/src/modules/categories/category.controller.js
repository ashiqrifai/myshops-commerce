const categoryService =
  require(
    "./category.service"
  );

const createCategory = async (
  req,
  res,
  next
) => {
  try {
    const category =
      await categoryService.createCategory(
        {
          companyId:
            req.context.companyId,

          userId:
            req.context.userId,

          payload: req.body,
        }
      );

    res.status(201).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

const listCategories = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await categoryService.listCategories(
        {
          companyId:
            req.context.companyId,

          query: req.query,
        }
      );

    res.status(200).json({
      success: true,
      data: {
        categories:
          result.categories,
      },
      meta: {
        pagination:
          result.pagination,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCategoryTree = async (
  req,
  res,
  next
) => {
  try {
    const categories =
      await categoryService.getCategoryTree(
        {
          companyId:
            req.context.companyId,

          query: req.query,
        }
      );

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getCategory = async (
  req,
  res,
  next
) => {
  try {
    const category =
      await categoryService.getCategoryOrFail(
        {
          categoryId:
            req.params.categoryId,

          companyId:
            req.context.companyId,
        }
      );

    res.status(200).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (
  req,
  res,
  next
) => {
  try {
    const category =
      await categoryService.updateCategory(
        {
          categoryId:
            req.params.categoryId,

          companyId:
            req.context.companyId,

          userId:
            req.context.userId,

          payload: req.body,
        }
      );

    res.status(200).json({
      success: true,
      data: {
        category,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateCategoryStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const category =
        await categoryService.updateCategoryStatus(
          {
            categoryId:
              req.params
                .categoryId,

            companyId:
              req.context
                .companyId,

            userId:
              req.context.userId,

            isActive:
              req.body.isActive,

            includeChildren:
              req.body
                .includeChildren ||
              false,
          }
        );

      res.status(200).json({
        success: true,
        data: {
          category,
        },
      });
    } catch (error) {
      next(error);
    }
  };

const reorderCategories = async (
  req,
  res,
  next
) => {
  try {
    const categories =
      await categoryService.reorderCategories(
        {
          companyId:
            req.context.companyId,

          userId:
            req.context.userId,

          categories:
            req.body.categories,
        }
      );

    res.status(200).json({
      success: true,
      data: {
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (
  req,
  res,
  next
) => {
  try {
    const result =
      await categoryService.deleteCategory(
        {
          categoryId:
            req.params.categoryId,

          companyId:
            req.context.companyId,
        }
      );

    res.status(200).json({
      success: true,
      data: {
        id: result.id,
        message:
          "Category deleted successfully.",
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCategory,
  listCategories,
  getCategoryTree,
  getCategory,
  updateCategory,
  updateCategoryStatus,
  reorderCategories,
  deleteCategory,
};