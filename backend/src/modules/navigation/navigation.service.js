const {
    Op,
  } = require("sequelize");
  
  const db = require("../../models");
  const AppError = require(
    "../../utils/AppError"
  );
  
  const {
    NAVIGATION_MAX_DEPTH,
  } = require("./navigation.constants");
  
  const normalizeCode = (value) =>
    value.trim().toUpperCase();
  
  const modelToPlain = (record) =>
    typeof record?.get === "function"
      ? record.get({
          plain: true,
        })
      : record;
  
      const buildNavigationTree = (
        records
      ) => {
        const items = records.map(
          (record) => {
            const item =
              modelToPlain(record);
      
            return {
              ...item,
              children: [],
            };
          }
        );
      
        const itemMap = new Map();
      
        for (const item of items) {
          itemMap.set(item.id, item);
        }
      
        const createsCircularReference = (
          item
        ) => {
          if (!item.parentId) {
            return false;
          }
      
          if (item.parentId === item.id) {
            return true;
          }
      
          const visited = new Set([
            item.id,
          ]);
      
          let currentParentId =
            item.parentId;
      
          while (currentParentId) {
            if (
              visited.has(
                currentParentId
              )
            ) {
              return true;
            }
      
            visited.add(
              currentParentId
            );
      
            const parent =
              itemMap.get(
                currentParentId
              );
      
            if (!parent) {
              return false;
            }
      
            currentParentId =
              parent.parentId;
          }
      
          return false;
        };
      
        const rootItems = [];
      
        for (const item of items) {
          const hasValidParent =
            item.parentId &&
            itemMap.has(
              item.parentId
            );
      
          const hasCircularReference =
            createsCircularReference(
              item
            );
      
          if (hasCircularReference) {
            console.warn(
              "[Navigation] Circular parent reference detected",
              {
                itemId: item.id,
                label: item.label,
                parentId:
                  item.parentId,
              }
            );
      
            /*
             * Recover safely by rendering the
             * invalid item at root level.
             */
            item.parentId = null;
            item.depth = 0;
      
            rootItems.push(item);
      
            continue;
          }
      
          if (hasValidParent) {
            itemMap
              .get(item.parentId)
              .children.push(item);
          } else {
            rootItems.push(item);
          }
        }
      
        const visitedDuringSort =
          new Set();
      
        const sortItems = (
          currentItems
        ) => {
          currentItems.sort(
            (first, second) => {
              const orderDifference =
                Number(
                  first.displayOrder ||
                    0
                ) -
                Number(
                  second.displayOrder ||
                    0
                );
      
              if (
                orderDifference !== 0
              ) {
                return orderDifference;
              }
      
              return String(
                first.label || ""
              ).localeCompare(
                String(
                  second.label || ""
                )
              );
            }
          );
      
          for (
            const item of
            currentItems
          ) {
            if (
              visitedDuringSort.has(
                item.id
              )
            ) {
              console.warn(
                "[Navigation] Repeated item skipped during tree sorting",
                {
                  itemId: item.id,
                  label: item.label,
                }
              );
      
              item.children = [];
              continue;
            }
      
            visitedDuringSort.add(
              item.id
            );
      
            sortItems(
              item.children || []
            );
          }
        };
      
        sortItems(rootItems);
      
        return rootItems;
      };
  
  const getNavigationMenuRecord =
    async ({
      companyId,
      menuId,
      transaction,
    }) => {
      const menu =
        await db.NavigationMenu.findOne({
          where: {
            id: menuId,
            companyId,
          },
          transaction,
        });
  
      if (!menu) {
        throw new AppError(
          "Navigation menu not found.",
          404,
          "NAVIGATION_MENU_NOT_FOUND"
        );
      }
  
      return menu;
    };
  
  const getNavigationItemRecord =
    async ({
      companyId,
      itemId,
      transaction,
    }) => {
      const item =
        await db.NavigationItem.findOne({
          where: {
            id: itemId,
            companyId,
          },
          transaction,
        });
  
      if (!item) {
        throw new AppError(
          "Navigation item not found.",
          404,
          "NAVIGATION_ITEM_NOT_FOUND"
        );
      }
  
      return item;
    };
  
  const getMenuItems = async ({
    companyId,
    menuId,
    includeInactive = true,
    transaction,
  }) => {
    const where = {
      companyId,
      navigationMenuId: menuId,
    };
  
    if (!includeInactive) {
      where.isActive = true;
    }
  
    return db.NavigationItem.findAll({
      where,
  
      include: [
        {
          model: db.MediaAsset,
          as: "mediaAsset",
          required: false,
        },
      ],
  
      order: [
        ["displayOrder", "ASC"],
        ["label", "ASC"],
      ],
  
      transaction,
    });
  };
  
  const getNavigationMenuById =
    async ({
      companyId,
      menuId,
    }) => {
      const menu =
        await db.NavigationMenu.findOne({
          where: {
            id: menuId,
            companyId,
          },
  
          include: [
            {
              model: db.User,
              as: "createdByUser",
              attributes: [
                "id",
                "firstName",
                "lastName",
                "email",
              ],
              required: false,
            },
            {
              model: db.User,
              as: "updatedByUser",
              attributes: [
                "id",
                "firstName",
                "lastName",
                "email",
              ],
              required: false,
            },
          ],
        });
  
      if (!menu) {
        throw new AppError(
          "Navigation menu not found.",
          404,
          "NAVIGATION_MENU_NOT_FOUND"
        );
      }
  
      const items =
        await getMenuItems({
          companyId,
          menuId,
          includeInactive: true,
        });
  
      const result =
        modelToPlain(menu);
  
      result.items =
        buildNavigationTree(items);
  
      return result;
    };
  
  const listNavigationMenus =
    async ({
      companyId,
      page = 1,
      pageSize = 25,
      search,
      channel,
      menuType,
      isActive,
    }) => {
      const where = {
        companyId,
      };
  
      if (search) {
        where[Op.or] = [
          {
            name: {
              [Op.iLike]:
                `%${search}%`,
            },
          },
          {
            code: {
              [Op.iLike]:
                `%${search}%`,
            },
          },
          {
            description: {
              [Op.iLike]:
                `%${search}%`,
            },
          },
        ];
      }
  
      if (channel) {
        where.channel = channel;
      }
  
      if (menuType) {
        where.menuType =
          menuType;
      }
  
      if (
        typeof isActive ===
        "boolean"
      ) {
        where.isActive =
          isActive;
      }
  
      const numericPage =
        Number(page);
  
      const numericPageSize =
        Number(pageSize);
  
      const offset =
        (numericPage - 1) *
        numericPageSize;
  
      const result =
        await db.NavigationMenu.findAndCountAll(
          {
            where,
  
            limit:
              numericPageSize,
  
            offset,
  
            distinct: true,
  
            order: [
              ["updatedAt", "DESC"],
              ["name", "ASC"],
            ],
  
            include: [
              {
                model:
                  db.NavigationItem,
  
                as: "items",
  
                attributes: [
                  "id",
                ],
  
                required: false,
              },
              {
                model: db.User,
                as: "updatedByUser",
                attributes: [
                  "id",
                  "firstName",
                  "lastName",
                ],
                required: false,
              },
            ],
          }
        );
  
      const rows =
        result.rows.map(
          (record) => {
            const row =
              modelToPlain(record);
  
            row.itemCount =
              Array.isArray(
                row.items
              )
                ? row.items.length
                : 0;
  
            delete row.items;
  
            return row;
          }
        );
  
      return {
        rows,
  
        pagination: {
          page:
            numericPage,
  
          pageSize:
            numericPageSize,
  
          totalItems:
            result.count,
  
          totalPages:
            Math.ceil(
              result.count /
                numericPageSize
            ),
        },
      };
    };
  
  const createNavigationMenu =
    async ({
      companyId,
      userId,
      payload,
    }) => {
      const code =
        normalizeCode(
          payload.code
        );
  
      const existing =
        await db.NavigationMenu.findOne({
          where: {
            companyId,
            code,
          },
          attributes: ["id"],
        });
  
      if (existing) {
        throw new AppError(
          "A navigation menu with this code already exists.",
          409,
          "NAVIGATION_MENU_CODE_EXISTS"
        );
      }
  
      const menu =
        await db.NavigationMenu.create({
          companyId,
  
          name:
            payload.name.trim(),
  
          code,
  
          channel:
            payload.channel ||
            "WEBSITE",
  
          menuType:
            payload.menuType ||
            "MEGA_MENU",
  
          description:
            payload.description ||
            null,
  
          settings:
            payload.settings ||
            {},
  
            isActive:
            payload.isActive !==
            false,
  
          createdBy:
            userId,
  
          updatedBy:
            userId,
        });
  
      return getNavigationMenuById({
        companyId,
        menuId: menu.id,
      });
    };
  
  const updateNavigationMenu =
    async ({
      companyId,
      menuId,
      userId,
      payload,
    }) => {
      const menu =
        await getNavigationMenuRecord({
          companyId,
          menuId,
        });
  
      const updateValues = {
        updatedBy: userId,
      };
  
      if (
        Object.prototype.hasOwnProperty.call(
          payload,
          "code"
        )
      ) {
        const code =
          normalizeCode(
            payload.code
          );
  
        const duplicate =
          await db.NavigationMenu.findOne(
            {
              where: {
                companyId,
                code,
                id: {
                  [Op.ne]:
                    menu.id,
                },
              },
  
              attributes: [
                "id",
              ],
            }
          );
  
        if (duplicate) {
          throw new AppError(
            "A navigation menu with this code already exists.",
            409,
            "NAVIGATION_MENU_CODE_EXISTS"
          );
        }
  
        updateValues.code =
          code;
      }
  
      const allowedFields = [
        "name",
        "channel",
        "menuType",
        "description",
        "settings",
      ];
  
      for (
        const field of
        allowedFields
      ) {
        if (
          Object.prototype.hasOwnProperty.call(
            payload,
            field
          )
        ) {
          updateValues[field] =
            payload[field];
        }
      }
  
      if (
        typeof updateValues.name ===
        "string"
      ) {
        updateValues.name =
          updateValues.name.trim();
      }
  
      await menu.update(
        updateValues
      );
  
      return getNavigationMenuById({
        companyId,
        menuId: menu.id,
      });
    };
  
  const changeNavigationMenuActive =
    async ({
      companyId,
      menuId,
      userId,
      isActive,
    }) => {
      const menu =
        await getNavigationMenuRecord({
          companyId,
          menuId,
        });
  
      await menu.update({
        isActive,
        updatedBy: userId,
      });
  
      return getNavigationMenuById({
        companyId,
        menuId: menu.id,
      });
    };
  
  const calculateParentDepth =
    async ({
      companyId,
      menuId,
      parentId,
      transaction,
    }) => {
      if (!parentId) {
        return 0;
      }
  
      const parent =
        await db.NavigationItem.findOne({
          where: {
            id: parentId,
            companyId,
            navigationMenuId:
              menuId,
          },
          transaction,
        });
  
      if (!parent) {
        throw new AppError(
          "The selected parent navigation item was not found in this menu.",
          400,
          "NAVIGATION_PARENT_NOT_FOUND"
        );
      }
  
      const depth =
        Number(parent.depth) + 1;
  
      if (
        depth >
        NAVIGATION_MAX_DEPTH
      ) {
        throw new AppError(
          `Navigation items cannot exceed ${NAVIGATION_MAX_DEPTH} nested levels.`,
          400,
          "NAVIGATION_MAX_DEPTH_EXCEEDED"
        );
      }
  
      return depth;
    };
  
  const validateMediaAsset =
    async ({
      companyId,
      mediaAssetId,
      transaction,
    }) => {
      if (!mediaAssetId) {
        return;
      }
  
      const asset =
        await db.MediaAsset.findOne({
          where: {
            id: mediaAssetId,
            companyId,
          },
          attributes: ["id"],
          transaction,
        });
  
      if (!asset) {
        throw new AppError(
          "Selected media asset was not found.",
          400,
          "MEDIA_ASSET_NOT_FOUND"
        );
      }
    };
  
  const createNavigationItem =
    async ({
      companyId,
      menuId,
      userId,
      payload,
    }) => {
      const transaction =
        await db.sequelize.transaction();
  
      try {
        await getNavigationMenuRecord({
          companyId,
          menuId,
          transaction,
        });
  
        const depth =
          await calculateParentDepth({
            companyId,
            menuId,
            parentId:
              payload.parentId ||
              null,
            transaction,
          });
  
        await validateMediaAsset({
          companyId,
          mediaAssetId:
            payload.mediaAssetId,
          transaction,
        });
  
        let displayOrder =
          payload.displayOrder;
  
        if (
          displayOrder ===
            undefined ||
          displayOrder === null
        ) {
          const maxOrder =
            await db.NavigationItem.max(
              "displayOrder",
              {
                where: {
                  companyId,
                  navigationMenuId:
                    menuId,
  
                  parentId:
                    payload.parentId ||
                    null,
                },
  
                transaction,
              }
            );
  
          displayOrder =
            Number(
              maxOrder || 0
            ) + 10;
        }
  
        const item =
          await db.NavigationItem.create(
            {
              companyId,
  
              navigationMenuId:
                menuId,
  
              parentId:
                payload.parentId ||
                null,
  
              label:
                payload.label.trim(),
  
              itemType:
                payload.itemType ||
                "CUSTOM_LINK",
  
              referenceId:
                payload.referenceId ||
                null,
  
              url:
                payload.url ||
                null,
  
              icon:
                payload.icon ||
                null,
  
              mediaAssetId:
                payload.mediaAssetId ||
                null,
  
              description:
                payload.description ||
                null,
  
              badgeText:
                payload.badgeText ||
                null,
  
              badgeColor:
                payload.badgeColor ||
                null,
  
              displayOrder,
  
              depth,
  
              columnNumber:
                payload.columnNumber ||
                1,
  
              openInNewTab:
                payload.openInNewTab ===
                true,
  
              desktopVisible:
                payload.desktopVisible !==
                false,
  
              mobileVisible:
                payload.mobileVisible !==
                false,
  
              isFeatured:
                payload.isFeatured ===
                true,
  
              settings:
                payload.settings ||
                {},
  
                isActive:
                payload.isActive !==
                false,
  
              createdBy:
                userId,
  
              updatedBy:
                userId,
            },
            {
              transaction,
            }
          );
  
        await transaction.commit();
  
        return getNavigationMenuById({
          companyId,
          menuId:
            item.navigationMenuId,
        });
      } catch (error) {
        if (
          !transaction.finished
        ) {
          await transaction.rollback();
        }
  
        throw error;
      }
    };
  
  const isDescendant =
    async ({
      companyId,
      menuId,
      possibleParentId,
      itemId,
      transaction,
    }) => {
      let currentId =
        possibleParentId;
  
      const visited =
        new Set();
  
      while (currentId) {
        if (
          currentId === itemId
        ) {
          return true;
        }
  
        if (
          visited.has(currentId)
        ) {
          return true;
        }
  
        visited.add(currentId);
  
        const current =
          await db.NavigationItem.findOne({
            where: {
              id: currentId,
              companyId,
              navigationMenuId:
                menuId,
            },
  
            attributes: [
              "id",
              "parentId",
            ],
  
            transaction,
          });
  
        if (!current) {
          return false;
        }
  
        currentId =
          current.parentId;
      }
  
      return false;
    };
  
  const updateDescendantDepths =
    async ({
      companyId,
      menuId,
      parentId,
      parentDepth,
      userId,
      transaction,
    }) => {
      const children =
        await db.NavigationItem.findAll({
          where: {
            companyId,
            navigationMenuId:
              menuId,
            parentId,
          },
  
          transaction,
        });
  
      for (
        const child of children
      ) {
        const nextDepth =
          Number(parentDepth) + 1;
  
        if (
          nextDepth >
          NAVIGATION_MAX_DEPTH
        ) {
          throw new AppError(
            `Navigation items cannot exceed ${NAVIGATION_MAX_DEPTH} nested levels.`,
            400,
            "NAVIGATION_MAX_DEPTH_EXCEEDED"
          );
        }
  
        await child.update(
          {
            depth:
              nextDepth,
  
            updatedBy:
              userId,
          },
          {
            transaction,
          }
        );
  
        await updateDescendantDepths({
          companyId,
          menuId,
          parentId:
            child.id,
          parentDepth:
            nextDepth,
          userId,
          transaction,
        });
      }
    };

    const normalizePublicChannel = (
      value
    ) => {
      const normalized =
        String(
          value || "WEBSITE"
        ).toUpperCase();
    
      return normalized === "KIOSK"
        ? "KIOSK"
        : "WEBSITE";
    };
    
    const normalizePublicDevice = (
      value
    ) => {
      const normalized =
        String(
          value || "DESKTOP"
        ).toUpperCase();
    
      if (
        normalized === "MOBILE"
      ) {
        return "MOBILE";
      }
    
      if (
        normalized === "TABLET"
      ) {
        return "TABLET";
      }
    
      return "DESKTOP";
    };
    
    const normalizeAuthenticated = (
      value
    ) => {
      if (
        typeof value ===
        "boolean"
      ) {
        return value;
      }
    
      const normalized =
        String(
          value || ""
        )
          .trim()
          .toLowerCase();
    
      return [
        "true",
        "1",
        "yes",
        "authenticated",
      ].includes(
        normalized
      );
    };
    
    const normalizeDate = (
      value
    ) => {
      if (!value) {
        return null;
      }
    
      const date =
        new Date(value);
    
      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return null;
      }
    
      return date;
    };
    
    const getVisibilityRules = (
      item
    ) => {
      const settings =
        item.settings &&
        typeof item.settings ===
          "object"
          ? item.settings
          : {};
    
      const savedRules =
        settings.visibilityRules &&
        typeof settings.visibilityRules ===
          "object"
          ? settings.visibilityRules
          : {};
    
      return {
        audience:
          savedRules.audience ||
          "ALL",
    
        channels:
          Array.isArray(
            savedRules.channels
          ) &&
          savedRules.channels.length >
            0
            ? savedRules.channels
            : [
                "WEBSITE",
                "KIOSK",
              ],
    
        devices:
          Array.isArray(
            savedRules.devices
          ) &&
          savedRules.devices.length >
            0
            ? savedRules.devices
            : [
                "DESKTOP",
                "TABLET",
                "MOBILE",
              ],
    
        requirePromotion:
          savedRules.requirePromotion ===
          true,
    
        promotionStartAt:
          savedRules.promotionStartAt ||
          null,
    
        promotionEndAt:
          savedRules.promotionEndAt ||
          null,
      };
    };
    
    const matchesAudienceRule = ({
      audience,
      authenticated,
    }) => {
      if (
        audience ===
        "GUEST_ONLY"
      ) {
        return !authenticated;
      }
    
      if (
        audience ===
        "AUTHENTICATED_ONLY"
      ) {
        return authenticated;
      }
    
      return true;
    };
    
    const matchesPromotionRule = ({
      rules,
      now,
    }) => {
      if (
        !rules.requirePromotion
      ) {
        return true;
      }
    
      const startAt =
        normalizeDate(
          rules.promotionStartAt
        );
    
      const endAt =
        normalizeDate(
          rules.promotionEndAt
        );
    
      if (
        startAt &&
        now < startAt
      ) {
        return false;
      }
    
      if (
        endAt &&
        now > endAt
      ) {
        return false;
      }
    
      /*
       * When promotion scheduling is enabled,
       * require at least one valid boundary.
       */
      if (
        !startAt &&
        !endAt
      ) {
        return false;
      }
    
      return true;
    };
    
    const shouldShowNavigationItem = ({
      item,
      channel,
      device,
      authenticated,
      now,
    }) => {
      if (
        item.isActive ===
        false
      ) {
        return false;
      }
    
      if (
        device ===
          "MOBILE" &&
        item.mobileVisible ===
          false
      ) {
        return false;
      }
    
      if (
        device ===
          "DESKTOP" &&
        item.desktopVisible ===
          false
      ) {
        return false;
      }
    
      /*
       * Tablet currently follows desktopVisible
       * unless a device rule explicitly excludes it.
       */
      if (
        device ===
          "TABLET" &&
        item.desktopVisible ===
          false
      ) {
        return false;
      }
    
      const rules =
        getVisibilityRules(
          item
        );
    
      if (
        !rules.channels.includes(
          channel
        )
      ) {
        return false;
      }
    
      if (
        !rules.devices.includes(
          device
        )
      ) {
        return false;
      }
    
      if (
        !matchesAudienceRule({
          audience:
            rules.audience,
    
          authenticated,
        })
      ) {
        return false;
      }
    
      if (
        !matchesPromotionRule({
          rules,
          now,
        })
      ) {
        return false;
      }
    
      return true;
    };
    
    const isContainerItem = (
      item
    ) =>
      [
        "DROPDOWN",
        "MEGA_MENU",
        "HEADING",
      ].includes(
        item.itemType
      );
    
    const filterPublicNavigationTree = (
      items,
      context
    ) => {
      const result = [];
    
      for (
        const sourceItem of
        items || []
      ) {
        if (
          !shouldShowNavigationItem({
            item:
              sourceItem,
    
            ...context,
          })
        ) {
          continue;
        }
    
        const children =
          filterPublicNavigationTree(
            sourceItem.children ||
              [],
            context
          );
    
        /*
         * Empty structural containers should
         * not be rendered in public navigation.
         */
        if (
          isContainerItem(
            sourceItem
          ) &&
          children.length === 0
        ) {
          continue;
        }
    
        result.push({
          ...sourceItem,
          children,
        });
      }
    
      return result;
    };
    
    const getPublicNavigationByCode =
    async ({
      companyId,
      code,
      channel = "WEBSITE",
      device = "DESKTOP",
      authenticated = false,
      now = new Date(),
    }) => {
      console.log(
        "[Navigation Public] START",
        {
          companyId,
          code,
          channel,
          device,
        }
      );
  
      const normalizedCode =
        normalizeCode(code);
  
      const normalizedChannel =
        normalizePublicChannel(
          channel
        );
  
      const normalizedDevice =
        normalizePublicDevice(
          device
        );
  
      const isAuthenticated =
        normalizeAuthenticated(
          authenticated
        );
  
      console.log(
        "[Navigation Public] Before menu query",
        {
          normalizedCode,
          normalizedChannel,
        }
      );
  
      const menu =
        await db.NavigationMenu.findOne({
          where: {
            companyId,
  
            code:
              normalizedCode,
  
            isActive:
              true,
  
            channel: {
              [Op.in]: [
                normalizedChannel,
                "BOTH",
              ],
            },
          },
        });
  
      console.log(
        "[Navigation Public] After menu query",
        {
          found:
            Boolean(menu),
  
          menuId:
            menu?.id || null,
        }
      );
  
      if (!menu) {
        throw new AppError(
          "Public navigation menu not found.",
          404,
          "PUBLIC_NAVIGATION_NOT_FOUND"
        );
      }
  
      console.log(
        "[Navigation Public] Before items query",
        {
          menuId:
            menu.id,
        }
      );
  
      const records =
        await getMenuItems({
          companyId,
  
          menuId:
            menu.id,
  
          includeInactive:
            false,
        });
  
      console.log(
        "[Navigation Public] After items query",
        {
          count:
            records.length,
        }
      );
  
      console.log(
        "[Navigation Public] Before tree build"
      );
  
      const tree =
        buildNavigationTree(
          records
        );
  
      console.log(
        "[Navigation Public] After tree build",
        {
          rootCount:
            tree.length,
        }
      );
  
      console.log(
        "[Navigation Public] Before visibility filter"
      );
  
      const filteredItems =
        filterPublicNavigationTree(
          tree,
          {
            channel:
              normalizedChannel,
  
            device:
              normalizedDevice,
  
            authenticated:
              isAuthenticated,
  
            now:
              normalizeDate(now) ||
              new Date(),
          }
        );
  
      console.log(
        "[Navigation Public] After visibility filter",
        {
          rootCount:
            filteredItems.length,
        }
      );
  
      const result =
        modelToPlain(menu);
  
      result.items =
        filteredItems;
  
      console.log(
        "[Navigation Public] COMPLETE"
      );
  
      return result;
    }; 
  
  const updateNavigationItem =
    async ({
      companyId,
      itemId,
      userId,
      payload,
    }) => {
      const transaction =
        await db.sequelize.transaction();
  
      try {
        const item =
          await getNavigationItemRecord({
            companyId,
            itemId,
            transaction,
          });
  
        const updateValues = {
          updatedBy: userId,
        };
  
        if (
          Object.prototype.hasOwnProperty.call(
            payload,
            "parentId"
          )
        ) {
          const newParentId =
            payload.parentId ||
            null;
  
          if (
            newParentId ===
            item.id
          ) {
            throw new AppError(
              "A navigation item cannot be its own parent.",
              400,
              "NAVIGATION_SELF_PARENT"
            );
          }
  
          if (newParentId) {
            const createsCycle =
              await isDescendant({
                companyId,
                menuId:
                  item.navigationMenuId,
                possibleParentId:
                  newParentId,
                itemId: item.id,
                transaction,
              });
  
            if (createsCycle) {
              throw new AppError(
                "The selected parent would create a circular navigation hierarchy.",
                400,
                "NAVIGATION_CIRCULAR_HIERARCHY"
              );
            }
          }
  
          const nextDepth =
            await calculateParentDepth({
              companyId,
              menuId:
                item.navigationMenuId,
              parentId:
                newParentId,
              transaction,
            });
  
          updateValues.parentId =
            newParentId;
  
          updateValues.depth =
            nextDepth;
        }
  
        if (
          Object.prototype.hasOwnProperty.call(
            payload,
            "mediaAssetId"
          )
        ) {
          await validateMediaAsset({
            companyId,
            mediaAssetId:
              payload.mediaAssetId,
            transaction,
          });
        }
  
        const allowedFields = [
          "label",
          "itemType",
          "referenceId",
          "url",
          "icon",
          "mediaAssetId",
          "description",
          "badgeText",
          "badgeColor",
          "displayOrder",
          "columnNumber",
          "openInNewTab",
          "desktopVisible",
          "mobileVisible",
          "isFeatured",
          "settings",
          "isActive",
        ];
  
        for (
          const field of
          allowedFields
        ) {
          if (
            Object.prototype.hasOwnProperty.call(
              payload,
              field
            )
          ) {
            updateValues[field] =
              payload[field];
          }
        }
  
        if (
          typeof updateValues.label ===
          "string"
        ) {
          updateValues.label =
            updateValues.label.trim();
        }
  
        await item.update(
          updateValues,
          {
            transaction,
          }
        );
  
        if (
          Object.prototype.hasOwnProperty.call(
            updateValues,
            "depth"
          )
        ) {
          await updateDescendantDepths({
            companyId,
            menuId:
              item.navigationMenuId,
            parentId:
              item.id,
            parentDepth:
              updateValues.depth,
            userId,
            transaction,
          });
        }
  
        await transaction.commit();
  
        return getNavigationMenuById({
          companyId,
          menuId:
            item.navigationMenuId,
        });
      } catch (error) {
        if (
          !transaction.finished
        ) {
          await transaction.rollback();
        }
  
        throw error;
      }
    };
  
  const deleteNavigationItem =
    async ({
      companyId,
      itemId,
    }) => {
      const transaction =
        await db.sequelize.transaction();
  
      try {
        const item =
          await getNavigationItemRecord({
            companyId,
            itemId,
            transaction,
          });
  
        const menuId =
          item.navigationMenuId;
  
        await item.destroy({
          transaction,
        });
  
        await transaction.commit();
  
        return getNavigationMenuById({
          companyId,
          menuId,
        });
      } catch (error) {
        if (
          !transaction.finished
        ) {
          await transaction.rollback();
        }
  
        throw error;
      }
    };
  
  const reorderNavigationItems =
    async ({
      companyId,
      menuId,
      userId,
      items,
    }) => {
      const transaction =
        await db.sequelize.transaction();
  
      try {
        await getNavigationMenuRecord({
          companyId,
          menuId,
          transaction,
        });
  
        for (
          const requestedItem of
          items
        ) {
          const item =
            await db.NavigationItem.findOne({
              where: {
                id:
                  requestedItem.id,
  
                companyId,
  
                navigationMenuId:
                  menuId,
              },
  
              transaction,
            });
  
          if (!item) {
            throw new AppError(
              "One or more navigation items were not found in this menu.",
              400,
              "NAVIGATION_ITEM_NOT_FOUND"
            );
          }
  
          const parentId =
            requestedItem.parentId ===
            undefined
              ? item.parentId
              : requestedItem.parentId ||
                null;
  
          if (
            parentId === item.id
          ) {
            throw new AppError(
              "A navigation item cannot be its own parent.",
              400,
              "NAVIGATION_SELF_PARENT"
            );
          }
  
          const depth =
            await calculateParentDepth({
              companyId,
              menuId,
              parentId,
              transaction,
            });
  
          await item.update(
            {
              parentId,
              depth,
  
              displayOrder:
                requestedItem.displayOrder,
  
              columnNumber:
                requestedItem.columnNumber ||
                item.columnNumber ||
                1,
  
              updatedBy:
                userId,
            },
            {
              transaction,
            }
          );
        }
  
        await transaction.commit();
  
        return getNavigationMenuById({
          companyId,
          menuId,
        });
      } catch (error) {
        if (
          !transaction.finished
        ) {
          await transaction.rollback();
        }
  
        throw error;
      }
    };
  
    module.exports = {
      buildNavigationTree,
      filterPublicNavigationTree,
      getPublicNavigationByCode,
      listNavigationMenus,
      getNavigationMenuById,
      createNavigationMenu,
      updateNavigationMenu,
      changeNavigationMenuActive,
      createNavigationItem,
      updateNavigationItem,
      deleteNavigationItem,
      reorderNavigationItems,
    };