const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BundlePromotionItem = sequelize.define("BundlePromotionItem", {
  id:{type:DataTypes.UUID,defaultValue:DataTypes.UUIDV4,primaryKey:true},
  companyId:{type:DataTypes.UUID,allowNull:false},
  bundlePromotionId:{type:DataTypes.UUID,allowNull:false},
  itemType:{type:DataTypes.ENUM("PRODUCT","PROTECTION_PLAN","TEXT"),allowNull:false,defaultValue:"PRODUCT"},
  productId:{type:DataTypes.UUID,allowNull:true},
  productVariantId:{type:DataTypes.UUID,allowNull:true},
  protectionSchemeId:{type:DataTypes.UUID,allowNull:true},
  label:{type:DataTypes.STRING(300),allowNull:false},
  description:{type:DataTypes.TEXT,allowNull:true},
  quantity:{type:DataTypes.INTEGER,allowNull:false,defaultValue:1,validate:{min:1,max:100}},
  isIncluded:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:true},
  sortOrder:{type:DataTypes.INTEGER,allowNull:false,defaultValue:0},
  isActive:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:true},
  createdBy:{type:DataTypes.UUID,allowNull:true},
  updatedBy:{type:DataTypes.UUID,allowNull:true},
},{
  tableName:"bundle_promotion_items",
  timestamps:true,
  indexes:[
    {name:"idx_bundle_promotion_item_bundle",fields:["companyId","bundlePromotionId","isActive"]},
    {name:"idx_bundle_promotion_item_product",fields:["companyId","productId"]},
    {name:"idx_bundle_promotion_item_variant",fields:["companyId","productVariantId"]},
    {name:"idx_bundle_promotion_item_protection_scheme",fields:["companyId","protectionSchemeId"]},
  ],
});
module.exports=BundlePromotionItem;
