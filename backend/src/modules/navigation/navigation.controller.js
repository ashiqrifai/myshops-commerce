const navigationService = require(
    "./navigation.service"
  );
  
  exports.listNavigationMenus =
    async (
      req,
      res,
      next
    ) => {
      try {
        const result =
          await navigationService.listNavigationMenus(
            {
              companyId:
                req.user.companyId,
  
              page:
                req.query.page ||
                1,
  
              pageSize:
                req.query.pageSize ||
                25,
  
              search:
                req.query.search,
  
              channel:
                req.query.channel,
  
              menuType:
                req.query.menuType,
  
              isActive:
                req.query.isActive,
            }
          );
  
        res.status(200).json({
          success: true,
          data: result.rows,
          pagination:
            result.pagination,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.getNavigationMenuById =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.getNavigationMenuById(
            {
              companyId:
                req.user.companyId,
  
              menuId:
                req.params.id,
            }
          );
  
        res.status(200).json({
          success: true,
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.createNavigationMenu =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.createNavigationMenu(
            {
              companyId:
                req.user.companyId,
  
              userId:
                req.user.id,
  
              payload:
                req.body,
            }
          );
  
        res.status(201).json({
          success: true,
  
          message:
            "Navigation menu created successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.updateNavigationMenu =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.updateNavigationMenu(
            {
              companyId:
                req.user.companyId,
  
              menuId:
                req.params.id,
  
              userId:
                req.user.id,
  
              payload:
                req.body,
            }
          );
  
        res.status(200).json({
          success: true,
  
          message:
            "Navigation menu updated successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.changeNavigationMenuActive =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.changeNavigationMenuActive(
            {
              companyId:
                req.user.companyId,
  
              menuId:
                req.params.id,
  
              userId:
                req.user.id,
  
              isActive:
                req.body.isActive,
            }
          );
  
        res.status(200).json({
          success: true,
  
          message:
            req.body.isActive
              ? "Navigation menu enabled successfully."
              : "Navigation menu disabled successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.createNavigationItem =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.createNavigationItem(
            {
              companyId:
                req.user.companyId,
  
              menuId:
                req.params.menuId,
  
              userId:
                req.user.id,
  
              payload:
                req.body,
            }
          );
  
        res.status(201).json({
          success: true,
  
          message:
            "Navigation item created successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.updateNavigationItem =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.updateNavigationItem(
            {
              companyId:
                req.user.companyId,
  
              itemId:
                req.params.itemId,
  
              userId:
                req.user.id,
  
              payload:
                req.body,
            }
          );
  
        res.status(200).json({
          success: true,
  
          message:
            "Navigation item updated successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.deleteNavigationItem =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.deleteNavigationItem(
            {
              companyId:
                req.user.companyId,
  
              itemId:
                req.params.itemId,
            }
          );
  
        res.status(200).json({
          success: true,
  
          message:
            "Navigation item deleted successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };
  
  exports.reorderNavigationItems =
    async (
      req,
      res,
      next
    ) => {
      try {
        const menu =
          await navigationService.reorderNavigationItems(
            {
              companyId:
                req.user.companyId,
  
              menuId:
                req.params.menuId,
  
              userId:
                req.user.id,
  
              items:
                req.body.items,
            }
          );
  
        res.status(200).json({
          success: true,
  
          message:
            "Navigation items reordered successfully.",
  
          data: menu,
        });
      } catch (error) {
        next(error);
      }
    };