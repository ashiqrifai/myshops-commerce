const express = require(
    "express"
  );
  
  const collectionController = require(
    "./collection.controller"
  );
  
  const authenticate = require(
    "../../middleware/authenticate"
  );
  
  const authorize = require(
    "../../middleware/authorize"
  );
  
  const validateRequest = require(
    "../../middleware/validateRequest"
  );
  
  const {
    collectionIdValidation,
    listCollectionsValidation,
    createCollectionValidation,
    updateCollectionValidation,
    changeCollectionStatusValidation,
    replaceCollectionProductsValidation,
    listCollectionProductsValidation,
  } = require(
    "./collection.validation"
  );
  
  const router =
    express.Router();
  
  router.use(
    authenticate
  );
  
  /*
  |--------------------------------------------------------------------------
  | Collection List and Create
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/",
    authorize(
      "collections.read"
    ),
    listCollectionsValidation,
    validateRequest,
    collectionController.listCollections
  );
  
  router.post(
    "/",
    authorize(
      "collections.create"
    ),
    createCollectionValidation,
    validateRequest,
    collectionController.createCollection
  );
  
  /*
  |--------------------------------------------------------------------------
  | Collection Products
  |--------------------------------------------------------------------------
  */
  
  router.get(
    "/:id/products",
    authorize(
      "collections.read"
    ),
    listCollectionProductsValidation,
    validateRequest,
    collectionController.getCollectionProducts
  );
  
  router.put(
    "/:id/products",
    authorize(
      "collections.update"
    ),
    replaceCollectionProductsValidation,
    validateRequest,
    collectionController.replaceCollectionProducts
  );
  
  /*
  |--------------------------------------------------------------------------
  | Collection Status
  |--------------------------------------------------------------------------
  */
  
  router.patch(
    "/:id/status",
    authorize(
      "collections.update"
    ),
    changeCollectionStatusValidation,
    validateRequest,
    collectionController.changeCollectionStatus
  );
  
  router.post(
    "/:id/refresh-smart",
    authorize(
      "collections.update"
    ),
    collectionIdValidation,
    validateRequest,
    collectionController
      .refreshSmartCollection
  );

  /*
  |--------------------------------------------------------------------------
  | Collection Detail, Update and Delete
  |--------------------------------------------------------------------------
  */
 
  
  router.get(
    "/:id",
    authorize(
      "collections.read"
    ),
    collectionIdValidation,
    validateRequest,
    collectionController.getCollectionById
  );
  
  router.put(
    "/:id",
    authorize(
      "collections.update"
    ),
    updateCollectionValidation,
    validateRequest,
    collectionController.updateCollection
  );
  
  router.delete(
    "/:id",
    authorize(
      "collections.delete"
    ),
    collectionIdValidation,
    validateRequest,
    collectionController.deleteCollection
  );

 
  
  module.exports = router;