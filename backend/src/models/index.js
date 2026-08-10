const sequelize = require("../config/database");

const Company = require("./Company");
const User = require("./User");
const Role = require("./Role");
const Permission = require("./Permission");
const UserRole = require("./UserRole");
const RolePermission = require("./RolePermission");
const RefreshToken = require("./RefreshToken");
const SystemSetting = require("./SystemSetting");
const CmsPage = require("./CmsPage");
const CmsSectionType = require("./CmsSectionType");
const CmsPageSection = require("./CmsPageSection");
const MediaFolder = require("./MediaFolder");
const MediaAsset = require("./MediaAsset");
const MediaAssetVariant = require("./MediaAssetVariant");
const MediaAssetUsage = require("./MediaAssetUsage");
const NavigationMenu = require("./NavigationMenu");
const NavigationItem = require("./NavigationItem");
const Category = require("./Category");
const Brand = require("./Brand");
const Attribute = require("./Attribute");
const AttributeOption = require("./AttributeOption");
const CategoryAttribute = require("./CategoryAttribute");
const Product = require("./Product");
const ProductCategory = require("./ProductCategory");
const ProductImage = require("./ProductImage");
const ProductChannel = require("./ProductChannel");
const ProductAttributeValue = require("./ProductAttributeValue");
const ProductVariant = require("./ProductVariant");
const ProductVariantAttributeValue = require("./ProductVariantAttributeValue");
const ProductVariantChannel = require("./ProductVariantChannel");
const PriceList = require("./PriceList");
const ProductVariantPrice = require("./ProductVariantPrice");
const PriceAuditLog = require("./PriceAuditLog");
const Collection =require("./Collection");
const ProductCollection =require("./ProductCollection");
const Customer = require("./Customer");
const CustomerRefreshToken = require("./CustomerRefreshToken");
const CustomerVerificationToken = require("./CustomerVerificationToken");
const CustomerPasswordResetToken = require("./CustomerPasswordResetToken");
const CustomerAddress = require("./CustomerAddress");
const Notification = require("./Notification");


const db = {
    sequelize,
    Company,
    User,
    Role,
    Permission,
    UserRole,
    RolePermission,
    RefreshToken,
    SystemSetting,
    CmsPage,
    CmsSectionType,
    CmsPageSection,
    MediaFolder,
    MediaAsset,
    MediaAssetVariant,
    MediaAssetUsage,
    NavigationMenu,
    NavigationItem,
    Category,
    Brand,
    Attribute,
    AttributeOption,
    CategoryAttribute,
    Product,
    ProductCategory,
    ProductImage,
    ProductChannel,
    ProductAttributeValue,
    ProductVariant,
    ProductVariantAttributeValue,
    ProductVariantChannel,
    PriceList,
    ProductVariantPrice,
    PriceAuditLog,
    Collection,
    ProductCollection,
    Customer,
    CustomerRefreshToken,
    CustomerVerificationToken,
    CustomerPasswordResetToken,
    CustomerAddress,
    Notification,

  };

   
Company.hasMany(User, {
  foreignKey: "companyId",
  as: "users",
});

User.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

Company.hasMany(Role, {
  foreignKey: "companyId",
  as: "roles",
});

Role.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

User.belongsToMany(Role, {
  through: UserRole,
  foreignKey: "userId",
  otherKey: "roleId",
  as: "roles",
});

Role.belongsToMany(User, {
  through: UserRole,
  foreignKey: "roleId",
  otherKey: "userId",
  as: "users",
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: "roleId",
  otherKey: "permissionId",
  as: "permissions",
});

Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: "permissionId",
  otherKey: "roleId",
  as: "roles",
});

User.hasMany(RefreshToken, {
  foreignKey: "userId",
  as: "refreshTokens",
});

RefreshToken.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

Company.hasMany(SystemSetting, {
    foreignKey: "companyId",
    as: "systemSettings",
  });
  
  SystemSetting.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  User.hasMany(SystemSetting, {
    foreignKey: "updatedBy",
    as: "updatedSettings",
  });
  
  SystemSetting.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });

  Company.hasMany(CmsPage, {
    foreignKey: "companyId",
    as: "cmsPages",
  });
  
  CmsPage.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  User.hasMany(CmsPage, {
    foreignKey: "createdBy",
    as: "createdCmsPages",
  });
  
  CmsPage.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(CmsPage, {
    foreignKey: "updatedBy",
    as: "updatedCmsPages",
  });
  
  CmsPage.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });

  Company.hasMany(CmsSectionType, {
    foreignKey: "companyId",
    as: "cmsSectionTypes",
  });
  
  CmsSectionType.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  Company.hasMany(CmsPageSection, {
    foreignKey: "companyId",
    as: "cmsPageSections",
  });
  
  CmsPageSection.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  CmsPage.hasMany(CmsPageSection, {
    foreignKey: "cmsPageId",
    as: "sections",
    onDelete: "CASCADE",
  });
  
  CmsPageSection.belongsTo(CmsPage, {
    foreignKey: "cmsPageId",
    as: "page",
  });
  
  CmsSectionType.hasMany(CmsPageSection, {
    foreignKey: "sectionTypeId",
    as: "pageSections",
  });
  
  CmsPageSection.belongsTo(CmsSectionType, {
    foreignKey: "sectionTypeId",
    as: "sectionType",
  });
  
  User.hasMany(CmsSectionType, {
    foreignKey: "createdBy",
    as: "createdCmsSectionTypes",
  });
  
  CmsSectionType.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(CmsSectionType, {
    foreignKey: "updatedBy",
    as: "updatedCmsSectionTypes",
  });
  
  CmsSectionType.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });
  
  User.hasMany(CmsPageSection, {
    foreignKey: "createdBy",
    as: "createdCmsPageSections",
  });
  
  CmsPageSection.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(CmsPageSection, {
    foreignKey: "updatedBy",
    as: "updatedCmsPageSections",
  });
  
  CmsPageSection.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });

  Company.hasMany(MediaFolder, {
    foreignKey: "companyId",
    as: "mediaFolders",
  });
  
  MediaFolder.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  MediaFolder.hasMany(MediaFolder, {
    foreignKey: "parentFolderId",
    as: "children",
  });
  
  MediaFolder.belongsTo(MediaFolder, {
    foreignKey: "parentFolderId",
    as: "parent",
  });
  
  Company.hasMany(MediaAsset, {
    foreignKey: "companyId",
    as: "mediaAssets",
  });
  
  MediaAsset.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  MediaFolder.hasMany(MediaAsset, {
    foreignKey: "folderId",
    as: "assets",
  });
  
  MediaAsset.belongsTo(MediaFolder, {
    foreignKey: "folderId",
    as: "folder",
  });
  
  MediaAsset.hasMany(MediaAssetVariant, {
    foreignKey: "mediaAssetId",
    as: "variants",
    onDelete: "CASCADE",
  });
  
  MediaAssetVariant.belongsTo(MediaAsset, {
    foreignKey: "mediaAssetId",
    as: "asset",
  });
  
  Company.hasMany(MediaAssetVariant, {
    foreignKey: "companyId",
    as: "mediaAssetVariants",
  });
  
  MediaAssetVariant.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  MediaAsset.hasMany(MediaAssetUsage, {
    foreignKey: "mediaAssetId",
    as: "usageRecords",
    onDelete: "RESTRICT",
  });
  
  MediaAssetUsage.belongsTo(MediaAsset, {
    foreignKey: "mediaAssetId",
    as: "asset",
  });
  
  Company.hasMany(MediaAssetUsage, {
    foreignKey: "companyId",
    as: "mediaAssetUsageRecords",
  });
  
  MediaAssetUsage.belongsTo(Company, {
    foreignKey: "companyId",
    as: "company",
  });
  
  User.hasMany(MediaFolder, {
    foreignKey: "createdBy",
    as: "createdMediaFolders",
  });
  
  MediaFolder.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(MediaFolder, {
    foreignKey: "updatedBy",
    as: "updatedMediaFolders",
  });
  
  MediaFolder.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });
  
  User.hasMany(MediaAsset, {
    foreignKey: "uploadedBy",
    as: "uploadedMediaAssets",
  });
  
  MediaAsset.belongsTo(User, {
    foreignKey: "uploadedBy",
    as: "uploadedByUser",
  });
  
  User.hasMany(MediaAsset, {
    foreignKey: "createdBy",
    as: "createdMediaAssets",
  });
  
  MediaAsset.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(MediaAsset, {
    foreignKey: "updatedBy",
    as: "updatedMediaAssets",
  });
  
  MediaAsset.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });
  
  User.hasMany(MediaAssetVariant, {
    foreignKey: "createdBy",
    as: "createdMediaAssetVariants",
  });
  
  MediaAssetVariant.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(MediaAssetVariant, {
    foreignKey: "updatedBy",
    as: "updatedMediaAssetVariants",
  });
  
  MediaAssetVariant.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });
  
  User.hasMany(MediaAssetUsage, {
    foreignKey: "createdBy",
    as: "createdMediaAssetUsageRecords",
  });
  
  MediaAssetUsage.belongsTo(User, {
    foreignKey: "createdBy",
    as: "createdByUser",
  });
  
  User.hasMany(MediaAssetUsage, {
    foreignKey: "updatedBy",
    as: "updatedMediaAssetUsageRecords",
  });
  
  MediaAssetUsage.belongsTo(User, {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  });

  /*
 * Navigation menu associations
 */

Company.hasMany(
  NavigationMenu,
  {
    foreignKey: "companyId",
    as: "navigationMenus",
  }
);

NavigationMenu.belongsTo(
  Company,
  {
    foreignKey: "companyId",
    as: "company",
  }
);

NavigationMenu.hasMany(
  NavigationItem,
  {
    foreignKey:
      "navigationMenuId",

    as: "items",

    onDelete:
      "CASCADE",
  }
);

NavigationItem.belongsTo(
  NavigationMenu,
  {
    foreignKey:
      "navigationMenuId",

    as: "menu",
  }
);

Company.hasMany(
  NavigationItem,
  {
    foreignKey: "companyId",
    as: "navigationItems",
  }
);

NavigationItem.belongsTo(
  Company,
  {
    foreignKey: "companyId",
    as: "company",
  }
);

/*
 * Self-referencing navigation hierarchy
 */

NavigationItem.hasMany(
  NavigationItem,
  {
    foreignKey: "parentId",
    as: "children",

    onDelete:
      "CASCADE",
  }
);

NavigationItem.belongsTo(
  NavigationItem,
  {
    foreignKey: "parentId",
    as: "parent",
  }
);

/*
 * Optional DAM image for menu item
 */

MediaAsset.hasMany(
  NavigationItem,
  {
    foreignKey:
      "mediaAssetId",

    as: "navigationItems",

    onDelete:
      "SET NULL",
  }
);

NavigationItem.belongsTo(
  MediaAsset,
  {
    foreignKey:
      "mediaAssetId",

    as: "mediaAsset",
  }
);

/*
 * Navigation menu auditing
 */

User.hasMany(
  NavigationMenu,
  {
    foreignKey: "createdBy",
    as: "createdNavigationMenus",
  }
);

NavigationMenu.belongsTo(
  User,
  {
    foreignKey: "createdBy",
    as: "createdByUser",
  }
);

User.hasMany(
  NavigationMenu,
  {
    foreignKey: "updatedBy",
    as: "updatedNavigationMenus",
  }
);

NavigationMenu.belongsTo(
  User,
  {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  }
);

/*
 * Navigation item auditing
 */

User.hasMany(
  NavigationItem,
  {
    foreignKey: "createdBy",
    as: "createdNavigationItems",
  }
);

NavigationItem.belongsTo(
  User,
  {
    foreignKey: "createdBy",
    as: "createdByUser",
  }
);

User.hasMany(
  NavigationItem,
  {
    foreignKey: "updatedBy",
    as: "updatedNavigationItems",
  }
);

NavigationItem.belongsTo(
  User,
  {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  }
);

/*
|--------------------------------------------------------------------------
| Category Associations
|--------------------------------------------------------------------------
*/

/*
 * Company ownership
 */
Company.hasMany(Category, {
  foreignKey: "companyId",
  as: "categories",
});

Category.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

/*
 * Category hierarchy
 */
Category.hasMany(Category, {
  foreignKey: "parentCategoryId",
  as: "children",
  onDelete: "RESTRICT",
});

Category.belongsTo(Category, {
  foreignKey: "parentCategoryId",
  as: "parent",
});

/*
 * Thumbnail asset
 */
MediaAsset.hasMany(Category, {
  foreignKey: "thumbnailAssetId",
  as: "thumbnailCategories",
  onDelete: "SET NULL",
});

Category.belongsTo(MediaAsset, {
  foreignKey: "thumbnailAssetId",
  as: "thumbnailAsset",
});

/*
 * Primary category image
 */
MediaAsset.hasMany(Category, {
  foreignKey: "imageAssetId",
  as: "imageCategories",
  onDelete: "SET NULL",
});

Category.belongsTo(MediaAsset, {
  foreignKey: "imageAssetId",
  as: "imageAsset",
});

/*
 * Category banner
 */
MediaAsset.hasMany(Category, {
  foreignKey: "bannerAssetId",
  as: "bannerCategories",
  onDelete: "SET NULL",
});

Category.belongsTo(MediaAsset, {
  foreignKey: "bannerAssetId",
  as: "bannerAsset",
});

/*
 * Optional CMS landing page
 */
CmsPage.hasMany(Category, {
  foreignKey: "landingPageId",
  as: "linkedCategories",
  onDelete: "SET NULL",
});

Category.belongsTo(CmsPage, {
  foreignKey: "landingPageId",
  as: "landingPage",
});

/*
 * Created-by auditing
 */
User.hasMany(Category, {
  foreignKey: "createdBy",
  as: "createdCategories",
});

Category.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

/*
 * Updated-by auditing
 */
User.hasMany(Category, {
  foreignKey: "updatedBy",
  as: "updatedCategories",
});

Category.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

/*
|--------------------------------------------------------------------------
| Brand Associations
|--------------------------------------------------------------------------
*/

/*
 * Company ownership
 */

Company.hasMany(Brand, {
  foreignKey: "companyId",
  as: "brands",
});

Brand.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

/*
 * Brand logo
 */

MediaAsset.hasMany(Brand, {
  foreignKey: "logoAssetId",
  as: "logoBrands",
  onDelete: "SET NULL",
});

Brand.belongsTo(MediaAsset, {
  foreignKey: "logoAssetId",
  as: "logoAsset",
});

/*
 * Brand banner
 */

MediaAsset.hasMany(Brand, {
  foreignKey: "bannerAssetId",
  as: "bannerBrands",
  onDelete: "SET NULL",
});

Brand.belongsTo(MediaAsset, {
  foreignKey: "bannerAssetId",
  as: "bannerAsset",
});

/*
 * Created-by auditing
 */

User.hasMany(Brand, {
  foreignKey: "createdBy",
  as: "createdBrands",
});

Brand.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

/*
 * Updated-by auditing
 */

User.hasMany(Brand, {
  foreignKey: "updatedBy",
  as: "updatedBrands",
});

Brand.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

/*
|--------------------------------------------------------------------------
| Attribute Associations
|--------------------------------------------------------------------------
*/

/*
 * Company ownership
 */

Company.hasMany(Attribute, {
  foreignKey: "companyId",
  as: "attributes",
});

Attribute.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

Company.hasMany(AttributeOption, {
  foreignKey: "companyId",
  as: "attributeOptions",
});

AttributeOption.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

Company.hasMany(CategoryAttribute, {
  foreignKey: "companyId",
  as: "categoryAttributes",
});

CategoryAttribute.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

/*
 * Attribute options
 */

Attribute.hasMany(AttributeOption, {
  foreignKey: "attributeId",
  as: "options",
  onDelete: "CASCADE",
});

AttributeOption.belongsTo(Attribute, {
  foreignKey: "attributeId",
  as: "attribute",
});

/*
 * Category assignments
 */

Attribute.hasMany(CategoryAttribute, {
  foreignKey: "attributeId",
  as: "categoryAssignments",
  onDelete: "CASCADE",
});

CategoryAttribute.belongsTo(Attribute, {
  foreignKey: "attributeId",
  as: "attribute",
});

Category.hasMany(CategoryAttribute, {
  foreignKey: "categoryId",
  as: "attributeAssignments",
  onDelete: "CASCADE",
});

CategoryAttribute.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

/*
 * Many-to-many convenience associations
 */

Attribute.belongsToMany(Category, {
  through: CategoryAttribute,
  foreignKey: "attributeId",
  otherKey: "categoryId",
  as: "categories",
});

Category.belongsToMany(Attribute, {
  through: CategoryAttribute,
  foreignKey: "categoryId",
  otherKey: "attributeId",
  as: "attributes",
});

/*
 * Attribute auditing
 */

User.hasMany(Attribute, {
  foreignKey: "createdBy",
  as: "createdAttributes",
});

Attribute.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(Attribute, {
  foreignKey: "updatedBy",
  as: "updatedAttributes",
});

Attribute.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

/*
 * Attribute option auditing
 */

User.hasMany(AttributeOption, {
  foreignKey: "createdBy",
  as: "createdAttributeOptions",
});

AttributeOption.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(AttributeOption, {
  foreignKey: "updatedBy",
  as: "updatedAttributeOptions",
});

AttributeOption.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

/*
 * Category attribute auditing
 */

User.hasMany(CategoryAttribute, {
  foreignKey: "createdBy",
  as: "createdCategoryAttributes",
});

CategoryAttribute.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(CategoryAttribute, {
  foreignKey: "updatedBy",
  as: "updatedCategoryAttributes",
});

CategoryAttribute.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

Company.hasMany(Product, {
  foreignKey: "companyId",
  as: "products",
});
Product.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

Brand.hasMany(Product, {
  foreignKey: "brandId",
  as: "products",
});
Product.belongsTo(Brand, {
  foreignKey: "brandId",
  as: "brand",
});

Category.hasMany(Product, {
  foreignKey: "primaryCategoryId",
  as: "primaryProducts",
});
Product.belongsTo(Category, {
  foreignKey: "primaryCategoryId",
  as: "primaryCategory",
});

Product.hasMany(ProductCategory, {
  foreignKey: "productId",
  as: "categoryAssignments",
  onDelete: "CASCADE",
});
ProductCategory.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
Category.hasMany(ProductCategory, {
  foreignKey: "categoryId",
  as: "productAssignments",
  onDelete: "CASCADE",
});
ProductCategory.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

Product.belongsToMany(Category, {
  through: ProductCategory,
  foreignKey: "productId",
  otherKey: "categoryId",
  as: "categories",
});
Category.belongsToMany(Product, {
  through: ProductCategory,
  foreignKey: "categoryId",
  otherKey: "productId",
  as: "products",
});

Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images",
  onDelete: "CASCADE",
});
ProductImage.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
MediaAsset.hasMany(ProductImage, {
  foreignKey: "mediaAssetId",
  as: "productUsages",
});
ProductImage.belongsTo(MediaAsset, {
  foreignKey: "mediaAssetId",
  as: "mediaAsset",
});

Product.hasMany(ProductChannel, {
  foreignKey: "productId",
  as: "channels",
  onDelete: "CASCADE",
});
ProductChannel.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

Product.hasMany(ProductAttributeValue, {
  foreignKey: "productId",
  as: "attributeValues",
  onDelete: "CASCADE",
});
ProductAttributeValue.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
Attribute.hasMany(ProductAttributeValue, {
  foreignKey: "attributeId",
  as: "productValues",
});
ProductAttributeValue.belongsTo(Attribute, {
  foreignKey: "attributeId",
  as: "attribute",
});
AttributeOption.hasMany(ProductAttributeValue, {
  foreignKey: "optionId",
  as: "productValues",
});
ProductAttributeValue.belongsTo(AttributeOption, {
  foreignKey: "optionId",
  as: "option",
});

Product.hasMany(ProductVariant, {
  foreignKey: "productId",
  as: "variants",
  onDelete: "CASCADE",
});
ProductVariant.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

ProductVariant.hasMany(ProductVariantAttributeValue, {
  foreignKey: "productVariantId",
  as: "attributeValues",
  onDelete: "CASCADE",
});
ProductVariantAttributeValue.belongsTo(ProductVariant, {
  foreignKey: "productVariantId",
  as: "variant",
});
Attribute.hasMany(ProductVariantAttributeValue, {
  foreignKey: "attributeId",
  as: "variantValues",
});
ProductVariantAttributeValue.belongsTo(Attribute, {
  foreignKey: "attributeId",
  as: "attribute",
});
AttributeOption.hasMany(ProductVariantAttributeValue, {
  foreignKey: "optionId",
  as: "variantValues",
});
ProductVariantAttributeValue.belongsTo(AttributeOption, {
  foreignKey: "optionId",
  as: "option",
});

ProductVariant.hasMany(ProductVariantChannel, {
  foreignKey: "productVariantId",
  as: "channels",
  onDelete: "CASCADE",
});
ProductVariantChannel.belongsTo(ProductVariant, {
  foreignKey: "productVariantId",
  as: "variant",
});

ProductVariant.hasMany(ProductImage, {
  foreignKey: "variantId",
  as: "images",
  onDelete: "CASCADE",
});
ProductImage.belongsTo(ProductVariant, {
  foreignKey: "variantId",
  as: "variant",
});

User.hasMany(Product, {
  foreignKey: "createdBy",
  as: "createdProducts",
});
Product.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});
User.hasMany(Product, {
  foreignKey: "updatedBy",
  as: "updatedProducts",
});
Product.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

User.hasMany(ProductVariant, {
  foreignKey: "createdBy",
  as: "createdProductVariants",
});
ProductVariant.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});
User.hasMany(ProductVariant, {
  foreignKey: "updatedBy",
  as: "updatedProductVariants",
});
ProductVariant.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});
/*
|--------------------------------------------------------------------------
| Pricing Associations
|--------------------------------------------------------------------------
*/

/*
 * Company ownership
 */

Company.hasMany(PriceList, {
  foreignKey: "companyId",
  as: "priceLists",
});

PriceList.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

Company.hasMany(
  ProductVariantPrice,
  {
    foreignKey: "companyId",
    as: "productVariantPrices",
  }
);

ProductVariantPrice.belongsTo(
  Company,
  {
    foreignKey: "companyId",
    as: "company",
  }
);

Company.hasMany(
  PriceAuditLog,
  {
    foreignKey: "companyId",
    as: "priceAuditLogs",
  }
);

PriceAuditLog.belongsTo(
  Company,
  {
    foreignKey: "companyId",
    as: "company",
  }
);

/*
 * Price list prices
 */

PriceList.hasMany(
  ProductVariantPrice,
  {
    foreignKey: "priceListId",
    as: "variantPrices",
    onDelete: "RESTRICT",
  }
);

ProductVariantPrice.belongsTo(
  PriceList,
  {
    foreignKey: "priceListId",
    as: "priceList",
  }
);

/*
 * Variant prices
 */

ProductVariant.hasMany(
  ProductVariantPrice,
  {
    foreignKey:
      "productVariantId",
    as: "prices",
    onDelete: "CASCADE",
  }
);

ProductVariantPrice.belongsTo(
  ProductVariant,
  {
    foreignKey:
      "productVariantId",
    as: "variant",
  }
);

/*
 * Audit log relationships
 */

PriceList.hasMany(
  PriceAuditLog,
  {
    foreignKey: "priceListId",
    as: "auditLogs",
    onDelete: "SET NULL",
  }
);

PriceAuditLog.belongsTo(
  PriceList,
  {
    foreignKey: "priceListId",
    as: "priceList",
  }
);

ProductVariant.hasMany(
  PriceAuditLog,
  {
    foreignKey:
      "productVariantId",
    as: "priceAuditLogs",
    onDelete: "SET NULL",
  }
);

PriceAuditLog.belongsTo(
  ProductVariant,
  {
    foreignKey:
      "productVariantId",
    as: "variant",
  }
);

ProductVariantPrice.hasMany(
  PriceAuditLog,
  {
    foreignKey:
      "productVariantPriceId",
    as: "auditLogs",
    onDelete: "SET NULL",
  }
);

PriceAuditLog.belongsTo(
  ProductVariantPrice,
  {
    foreignKey:
      "productVariantPriceId",
    as: "variantPrice",
  }
);

/*
 * Price list auditing
 */

User.hasMany(PriceList, {
  foreignKey: "createdBy",
  as: "createdPriceLists",
});

PriceList.belongsTo(User, {
  foreignKey: "createdBy",
  as: "createdByUser",
});

User.hasMany(PriceList, {
  foreignKey: "updatedBy",
  as: "updatedPriceLists",
});

PriceList.belongsTo(User, {
  foreignKey: "updatedBy",
  as: "updatedByUser",
});

/*
 * Variant price auditing
 */

User.hasMany(
  ProductVariantPrice,
  {
    foreignKey: "createdBy",
    as: "createdVariantPrices",
  }
);

ProductVariantPrice.belongsTo(
  User,
  {
    foreignKey: "createdBy",
    as: "createdByUser",
  }
);

User.hasMany(
  ProductVariantPrice,
  {
    foreignKey: "updatedBy",
    as: "updatedVariantPrices",
  }
);

ProductVariantPrice.belongsTo(
  User,
  {
    foreignKey: "updatedBy",
    as: "updatedByUser",
  }
);

/*
 * Price audit user
 */

User.hasMany(
  PriceAuditLog,
  {
    foreignKey: "changedBy",
    as: "priceChanges",
  }
);

PriceAuditLog.belongsTo(
  User,
  {
    foreignKey: "changedBy",
    as: "changedByUser",
  }
);

/*
|--------------------------------------------------------------------------
| Collection Associations
|--------------------------------------------------------------------------
*/

/*
 * Company ownership
 */

Company.hasMany(
  Collection,
  {
    foreignKey:
      "companyId",

    as:
      "collections",
  }
);

Collection.belongsTo(
  Company,
  {
    foreignKey:
      "companyId",

    as:
      "company",
  }
);

/*
 * Collection product assignments
 */

Collection.hasMany(
  ProductCollection,
  {
    foreignKey:
      "collectionId",

    as:
      "productAssignments",

    onDelete:
      "CASCADE",
  }
);

ProductCollection.belongsTo(
  Collection,
  {
    foreignKey:
      "collectionId",

    as:
      "collection",
  }
);

Product.hasMany(
  ProductCollection,
  {
    foreignKey:
      "productId",

    as:
      "collectionAssignments",

    onDelete:
      "CASCADE",
  }
);

ProductCollection.belongsTo(
  Product,
  {
    foreignKey:
      "productId",

    as:
      "product",
  }
);

/*
 * Many-to-many convenience associations
 */

Collection.belongsToMany(
  Product,
  {
    through:
      ProductCollection,

    foreignKey:
      "collectionId",

    otherKey:
      "productId",

    as:
      "products",
  }
);

Product.belongsToMany(
  Collection,
  {
    through:
      ProductCollection,

    foreignKey:
      "productId",

    otherKey:
      "collectionId",

    as:
      "collections",
  }
);

/*
 * Thumbnail asset
 */

MediaAsset.hasMany(
  Collection,
  {
    foreignKey:
      "thumbnailAssetId",

    as:
      "thumbnailCollections",

    onDelete:
      "SET NULL",
  }
);

Collection.belongsTo(
  MediaAsset,
  {
    foreignKey:
      "thumbnailAssetId",

    as:
      "thumbnailAsset",
  }
);

/*
 * Desktop banner asset
 */

MediaAsset.hasMany(
  Collection,
  {
    foreignKey:
      "bannerAssetId",

    as:
      "bannerCollections",

    onDelete:
      "SET NULL",
  }
);

Collection.belongsTo(
  MediaAsset,
  {
    foreignKey:
      "bannerAssetId",

    as:
      "bannerAsset",
  }
);

/*
 * Mobile banner asset
 */

MediaAsset.hasMany(
  Collection,
  {
    foreignKey:
      "mobileBannerAssetId",

    as:
      "mobileBannerCollections",

    onDelete:
      "SET NULL",
  }
);

Collection.belongsTo(
  MediaAsset,
  {
    foreignKey:
      "mobileBannerAssetId",

    as:
      "mobileBannerAsset",
  }
);

/*
 * Optional CMS landing page
 */

CmsPage.hasMany(
  Collection,
  {
    foreignKey:
      "landingPageId",

    as:
      "linkedCollections",

    onDelete:
      "SET NULL",
  }
);

Collection.belongsTo(
  CmsPage,
  {
    foreignKey:
      "landingPageId",

    as:
      "landingPage",
  }
);

/*
 * Created-by auditing
 */

User.hasMany(
  Collection,
  {
    foreignKey:
      "createdBy",

    as:
      "createdCollections",
  }
);

Collection.belongsTo(
  User,
  {
    foreignKey:
      "createdBy",

    as:
      "createdByUser",
  }
);

/*
 * Updated-by auditing
 */

User.hasMany(
  Collection,
  {
    foreignKey:
      "updatedBy",

    as:
      "updatedCollections",
  }
);

Collection.belongsTo(
  User,
  {
    foreignKey:
      "updatedBy",

    as:
      "updatedByUser",
  }
);

/*
 * Product collection auditing
 */

User.hasMany(
  ProductCollection,
  {
    foreignKey:
      "createdBy",

    as:
      "createdProductCollections",
  }
);

ProductCollection.belongsTo(
  User,
  {
    foreignKey:
      "createdBy",

    as:
      "createdByUser",
  }
);

User.hasMany(
  ProductCollection,
  {
    foreignKey:
      "updatedBy",

    as:
      "updatedProductCollections",
  }
);

ProductCollection.belongsTo(
  User,
  {
    foreignKey:
      "updatedBy",

    as:
      "updatedByUser",
  }
);

/*
 * Company ownership of product assignments
 */

Company.hasMany(
  ProductCollection,
  {
    foreignKey:
      "companyId",

    as:
      "productCollections",
  }
);

ProductCollection.belongsTo(
  Company,
  {
    foreignKey:
      "companyId",

    as:
      "company",
  }
);






/* Customer Identity Associations */
Company.hasMany(Customer, { foreignKey: "companyId", as: "customers" });
Customer.belongsTo(Company, { foreignKey: "companyId", as: "company" });
Customer.hasMany(CustomerRefreshToken, { foreignKey: "customerId", as: "refreshTokens", onDelete: "CASCADE" });
CustomerRefreshToken.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(CustomerVerificationToken, { foreignKey: "customerId", as: "verificationTokens", onDelete: "CASCADE" });
CustomerVerificationToken.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });
Customer.hasMany(CustomerPasswordResetToken, { foreignKey: "customerId", as: "passwordResetTokens", onDelete: "CASCADE" });
CustomerPasswordResetToken.belongsTo(Customer, { foreignKey: "customerId", as: "customer" });


Customer.hasMany(CustomerAddress, {
  foreignKey: "customerId",
  as: "addresses",
  onDelete: "CASCADE",
});

CustomerAddress.belongsTo(Customer, {
  foreignKey: "customerId",
  as: "customer",
});

Company.hasMany(CustomerAddress, {
  foreignKey: "companyId",
  as: "customerAddresses",
});

CustomerAddress.belongsTo(Company, {
  foreignKey: "companyId",
  as: "company",
});

/*
|--------------------------------------------------------------------------
| Customer Notification Associations
|--------------------------------------------------------------------------
*/

Customer.hasMany(
  Notification,
  {
    foreignKey:
      "customerId",

    as:
      "notifications",

    onDelete:
      "CASCADE",
  }
);

Notification.belongsTo(
  Customer,
  {
    foreignKey:
      "customerId",

    as:
      "customer",
  }
);

Company.hasMany(
  Notification,
  {
    foreignKey:
      "companyId",

    as:
      "customerNotifications",
  }
);

Notification.belongsTo(
  Company,
  {
    foreignKey:
      "companyId",

    as:
      "company",
  }
);

module.exports = db;