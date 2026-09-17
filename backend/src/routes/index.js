const express = require("express");

const authRoutes = require(
  "../modules/auth/auth.routes"
);

const settingsRoutes = require(
  "../modules/settings/settings.routes"
);

const publicSettingsRoutes = require(
  "./publicSettingsRoutes"
);

const cmsPageRoutes = require(
  "../modules/cms-pages/cmsPage.routes"
);

const cmsSectionTypeRoutes = require(
  "../modules/cms-section-types/cmsSectionType.routes"
);

const cmsPageSectionRoutes = require(
  "../modules/cms-page-sections/cmsPageSection.routes"
);

const mediaFolderRoutes = require(
  "../modules/media-folders/mediaFolder.routes"
);

const mediaAssetRoutes = require(
  "../modules/media-assets/mediaAsset.routes"
);

const publicPreBookingRoutes =
  require(
    "../modules/public-pre-booking/publicPreBooking.routes"
  );

const navigationRoutes = require(
    "../modules/navigation/navigation.routes"
);
  
const publicNavigationRoutes =
    require(
      "../modules/navigation/publicNavigation.routes"
    );


    const categoryRoutes =
    require(
      "../modules/categories/category.routes"
    );

    const brandRoutes = require(
      "../modules/brands/brand.routes"
    );

    const attributeRoutes = require(
      "../modules/attributes/attribute.routes"
    );

    const attributeImportRoutes =
  require(
    "../modules/attribute-import/attributeImport.routes"
  );

    const productRoutes = require(
      "../modules/products/product.routes"
    );

    const priceListRoutes = require(
      "../modules/pricing/priceList.routes"
    );

    const variantPriceRoutes = require(
      "../modules/pricing/variantPrice.routes"
    );

    const priceResolverRoutes = require(
      "../modules/pricing/priceResolver.routes"
    );

    const pricingFacadeRoutes = require(
      "../modules/pricing/pricingFacade.routes"
    );

    const pricingImportRoutes = require(
      "../modules/pricingImport/pricingImport.routes"
    );

    const collectionRoutes =
  require(
    "../modules/collections/collection.routes"
  );

  const productImportRoutes =
  require(
    "../modules/product-import/productImport.routes"
  );

  const customerAuthRoutes = require(
    "../modules/customer-auth/customerAuth.routes"
  );

  const customerAddressRoutes =
  require(
    "../modules/customer-addresses/customerAddress.routes"
  );

  const customerNotificationRoutes =
require(
  "../modules/notifications/notification.routes"
);

const categoryImportRoutes =
require(
  "../modules/category-import/categoryImport.routes"
);

const brandImportRoutes =
require(
  "../modules/brand-import/brandImport.routes"
);
  
const collectionImportRoutes =
require(
  "../modules/collection-import/collectionImport.routes"
);

const supplierRoutes = require(
  "../modules/suppliers/supplier.routes"
);

const inventoryLocationRoutes = require(
  "../modules/inventory-locations/inventoryLocation.routes"
);

const inventoryRoutes = require(
  "../modules/inventory/inventory.routes"
);

const inventoryImportRoutes =
  require("../modules/inventory-import/inventoryImport.routes");

const tamaraRoutes = require("../routes/tamaraRoutes");
const tabbyRoutes = require("../routes/tabbyRoutes");

const adminOrderRoutes =
  require(
    "./adminOrderRoutes"
  );

  const publicOrderTrackingRoutes =
  require(
    "./publicOrderTracking.routes"
  );

  const productMergeRoutes = require(
    "../modules/products/productMerge.routes"
  );

  const giftVoucherPromotionRoutes = require("../modules/gift-voucher-promotions/giftVoucherPromotion.routes");


  const bundlePromotionRoutes = require(
    "../modules/bundle-promotions/bundlePromotion.routes"
  );

  const preBookingRoutes =
  require(
    "../modules/pre-booking/preBooking.routes"
  );

  const publicStorefrontRoutes =
  require(
    "../modules/public-storefront/publicStorefront.routes"
  );


const router = express.Router();

router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      name: "MyShops Commerce API",
      version: "1.0.0",
      description:
        "Shared commerce backend for the MyShops website, admin panel and Android AI kiosk",
      timestamp: new Date().toISOString(),
    },
  });
});

router.use(
  "/admin/auth",
  authRoutes
);

router.use(
  "/admin/settings",
  settingsRoutes
);

router.use(
  "/admin/cms/pages",
  cmsPageRoutes
);

router.use(
  "/admin/cms/section-types",
  cmsSectionTypeRoutes
);

router.use(
  "/admin/cms/pages/:pageId/sections",
  cmsPageSectionRoutes
);

router.use(
  "/public/settings",
  publicSettingsRoutes
);

router.use(
  "/admin/media/folders",
  mediaFolderRoutes
);

router.use(
  "/admin/media/assets",
  mediaAssetRoutes
);

router.use(
  "/public/storefront",
  publicStorefrontRoutes
);


router.use(
  "/public/pre-booking",
  publicPreBookingRoutes
);


router.use(
  "/admin/cms/navigation",
  navigationRoutes
);

router.use(
  "/public/navigation",
  publicNavigationRoutes
);

router.use(
  "/categories",
  categoryRoutes
);


router.use(
  "/category-import",
  categoryImportRoutes
);

router.use(
  "/brands",
  brandRoutes
);

router.use(
  "/attributes",
  attributeRoutes
);

router.use(
  "/attribute-import",
  attributeImportRoutes
);

router.use(
  "/products",
  productRoutes
);

router.use(
  "/pricing/price-lists",
  priceListRoutes
);

router.use(
  "/pricing/variant-prices",
  variantPriceRoutes
);

router.use(
  "/pricing",
  priceResolverRoutes
);

router.use(
  "/pricing",
  pricingFacadeRoutes
);

router.use(
  "/pricing/import",
  pricingImportRoutes
);

router.use(
  "/collections",
  collectionRoutes
);

router.use(
  "/product-import",
  productImportRoutes
);

router.use(
  "/public/customer-auth",
  customerAuthRoutes
);

router.use(
  "/public/customer-addresses",
  customerAddressRoutes
);

router.use(
  "/public/customer-notifications",
  customerNotificationRoutes
);

router.use(
  "/brand-import",
  brandImportRoutes
);

router.use(
  "/collection-import",
  collectionImportRoutes
);

router.use(
  "/suppliers",
  supplierRoutes
);

router.use(
  "/inventory-locations",
  inventoryLocationRoutes
);

router.use(
  "/inventory",
  inventoryRoutes
);

router.use(
  "/inventory-import",
  inventoryImportRoutes
);

router.use(
  "/payments/tamara",
  tamaraRoutes
);

router.use(
  "/payments/tabby",
  tabbyRoutes
);

router.use(
  "/admin/orders",
  adminOrderRoutes
);

router.use(
  "/public/order-tracking",
  publicOrderTrackingRoutes
);

router.use(
  "/products/merge",
  productMergeRoutes
);


router.use("/gift-voucher-promotions", giftVoucherPromotionRoutes);


router.use(
  "/bundle-promotions",
  bundlePromotionRoutes
);


router.use(
  "/pre-booking",
  preBookingRoutes
);


module.exports = router;