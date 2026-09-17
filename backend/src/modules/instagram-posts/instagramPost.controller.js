const instagramPostService =
  require(
    "./instagramPost.service"
  );

exports.listInstagramPosts =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await instagramPostService
          .listInstagramPosts({
            companyId:
              req.user.companyId,

            page:
              req.query.page ||
              1,

            pageSize:
              req.query
                .pageSize ||
              30,

            search:
              req.query.search,

            isActive:
              req.query
                .isActive,

            sortBy:
              req.query
                .sortBy ||
              "sortOrder",

            sortDirection:
              req.query
                .sortDirection ||
              "ASC",
          });

      res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            result.rows,

          pagination:
            result.pagination,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.getInstagramPostById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const post =
        await instagramPostService
          .getInstagramPostById({
            companyId:
              req.user.companyId,

            instagramPostId:
              req.params.id,
          });

      res
        .status(
          200
        )
        .json({
          success:
            true,

          data:
            post,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.createInstagramPost =
  async (
    req,
    res,
    next
  ) => {
    try {
      const post =
        await instagramPostService
          .createInstagramPost({
            companyId:
              req.user.companyId,

            payload:
              req.body,
          });

      res
        .status(
          201
        )
        .json({
          success:
            true,

          message:
            "Instagram post created successfully.",

          data:
            post,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.updateInstagramPost =
  async (
    req,
    res,
    next
  ) => {
    try {
      const post =
        await instagramPostService
          .updateInstagramPost({
            companyId:
              req.user.companyId,

            instagramPostId:
              req.params.id,

            payload:
              req.body,
          });

      res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            "Instagram post updated successfully.",

          data:
            post,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.changeInstagramPostStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const post =
        await instagramPostService
          .changeInstagramPostStatus({
            companyId:
              req.user.companyId,

            instagramPostId:
              req.params.id,

            isActive:
              req.body.isActive,
          });

      res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            req.body
              .isActive
              ? "Instagram post activated successfully."
              : "Instagram post deactivated successfully.",

          data:
            post,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.deleteInstagramPost =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await instagramPostService
          .deleteInstagramPost({
            companyId:
              req.user.companyId,

            instagramPostId:
              req.params.id,
          });

      res
        .status(
          200
        )
        .json({
          success:
            true,

          message:
            "Instagram post deleted successfully.",

          data:
            result,
        });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };