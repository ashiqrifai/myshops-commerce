const {
    body,
    param,
    query,
  } = require("express-validator");
  
  exports.mediaFolderIdValidation = [
    param("id")
      .isUUID()
      .withMessage(
        "A valid media folder ID is required."
      ),
  ];
  
  exports.listMediaFoldersValidation = [
    query("search")
      .optional()
      .trim()
      .isLength({ max: 150 })
      .withMessage(
        "Search cannot exceed 150 characters."
      ),
  
    query("parentFolderId")
      .optional({ nullable: true })
      .custom((value) => {
        if (
          value === "" ||
          value === "null" ||
          value === null
        ) {
          return true;
        }
  
        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
        return uuidPattern.test(value);
      })
      .withMessage(
        "parentFolderId must be a valid UUID or null."
      ),
  
    query("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  
    query("includeAssetCount")
      .optional()
      .isBoolean()
      .withMessage(
        "includeAssetCount must be true or false."
      )
      .toBoolean(),
  ];
  
  exports.createMediaFolderValidation = [
    body("name")
      .trim()
      .notEmpty()
      .withMessage(
        "Folder name is required."
      )
      .isLength({
        min: 1,
        max: 150,
      })
      .withMessage(
        "Folder name must contain between 1 and 150 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Folder code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({
        max: 120,
      })
      .withMessage(
        "Folder code cannot exceed 120 characters."
      ),
  
    body("parentFolderId")
      .optional({ nullable: true })
      .isUUID()
      .withMessage(
        "Parent folder ID must be a valid UUID."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Folder description must be valid text."
      ),
  
    body("displayOrder")
      .optional()
      .isInt({
        min: 0,
        max: 100000,
      })
      .withMessage(
        "Display order must be a valid non-negative integer."
      )
      .toInt(),
  
    body("isActive")
      .optional()
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];
  
  exports.updateMediaFolderValidation = [
    ...exports.mediaFolderIdValidation,
  
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage(
        "Folder name cannot be empty."
      )
      .isLength({
        min: 1,
        max: 150,
      })
      .withMessage(
        "Folder name must contain between 1 and 150 characters."
      ),
  
    body("code")
      .optional()
      .trim()
      .matches(/^[A-Za-z0-9_-]+$/)
      .withMessage(
        "Folder code may contain letters, numbers, underscores and hyphens only."
      )
      .isLength({
        max: 120,
      })
      .withMessage(
        "Folder code cannot exceed 120 characters."
      ),
  
    body("parentFolderId")
      .optional({ nullable: true })
      .custom((value) => {
        if (value === null) {
          return true;
        }
  
        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
        return uuidPattern.test(value);
      })
      .withMessage(
        "Parent folder ID must be a valid UUID or null."
      ),
  
    body("description")
      .optional({ nullable: true })
      .isString()
      .withMessage(
        "Folder description must be valid text."
      ),
  
    body("displayOrder")
      .optional()
      .isInt({
        min: 0,
        max: 100000,
      })
      .withMessage(
        "Display order must be a valid non-negative integer."
      )
      .toInt(),
  ];
  
  exports.changeMediaFolderActiveValidation = [
    ...exports.mediaFolderIdValidation,
  
    body("isActive")
      .isBoolean()
      .withMessage(
        "isActive must be true or false."
      )
      .toBoolean(),
  ];