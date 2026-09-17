const protectionAssignmentService =
  require(
    "./protectionAssignment.service"
  );

exports.listProtectionAssignments =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await protectionAssignmentService
          .listProtectionAssignments({
            companyId:
              req.user.companyId,

            page:
              req.query.page ||
              1,

            pageSize:
              req.query.pageSize ||
              30,

            schemeId:
              req.query
                .schemeId,

            scopeType:
              req.query
                .scopeType,

            scopeId:
              req.query
                .scopeId,

            isActive:
              req.query
                .isActive,

            search:
              req.query
                .search,
          });

      res.status(200).json({
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

exports.getProtectionAssignmentById =
  async (
    req,
    res,
    next
  ) => {
    try {
      const assignment =
        await protectionAssignmentService
          .getProtectionAssignmentById({
            companyId:
              req.user.companyId,

            assignmentId:
              req.params.id,
          });

      res.status(200).json({
        success:
          true,

        data:
          assignment,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.createProtectionAssignment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const assignment =
        await protectionAssignmentService
          .createProtectionAssignment({
            companyId:
              req.user.companyId,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(201).json({
        success:
          true,

        message:
          "Protection assignment created successfully.",

        data:
          assignment,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.updateProtectionAssignment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const assignment =
        await protectionAssignmentService
          .updateProtectionAssignment({
            companyId:
              req.user.companyId,

            assignmentId:
              req.params.id,

            userId:
              req.user.id,

            payload:
              req.body,
          });

      res.status(200).json({
        success:
          true,

        message:
          "Protection assignment updated successfully.",

        data:
          assignment,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.changeProtectionAssignmentStatus =
  async (
    req,
    res,
    next
  ) => {
    try {
      const assignment =
        await protectionAssignmentService
          .changeProtectionAssignmentStatus({
            companyId:
              req.user.companyId,

            assignmentId:
              req.params.id,

            userId:
              req.user.id,

            isActive:
              req.body
                .isActive,
          });

      res.status(200).json({
        success:
          true,

        message:
          req.body
            .isActive
            ? "Protection assignment activated successfully."
            : "Protection assignment deactivated successfully.",

        data:
          assignment,
      });
    } catch (
      error
    ) {
      next(
        error
      );
    }
  };

exports.deleteProtectionAssignment =
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await protectionAssignmentService
          .deleteProtectionAssignment({
            companyId:
              req.user.companyId,

            assignmentId:
              req.params.id,
          });

      res.status(200).json({
        success:
          true,

        message:
          "Protection assignment deleted successfully.",

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
