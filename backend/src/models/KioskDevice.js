const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const KioskDevice = sequelize.define("KioskDevice", {
  id:{type:DataTypes.UUID,defaultValue:DataTypes.UUIDV4,primaryKey:true},
  companyId:{type:DataTypes.UUID,allowNull:false},
  kioskProfileId:{type:DataTypes.UUID,allowNull:false},
  deviceCode:{type:DataTypes.STRING(120),allowNull:false},
  deviceName:{type:DataTypes.STRING(180),allowNull:false},
  activationTokenHash:{type:DataTypes.STRING(255),allowNull:true},
  deviceTokenHash:{type:DataTypes.STRING(255),allowNull:true},
  activatedAt:{type:DataTypes.DATE,allowNull:true},
  status:{type:DataTypes.ENUM("PENDING","ACTIVE","DISABLED"),allowNull:false,defaultValue:"PENDING"},
  appVersion:{type:DataTypes.STRING(50),allowNull:true},
  lastSeenAt:{type:DataTypes.DATE,allowNull:true},
  settings:{type:DataTypes.JSONB,allowNull:false,defaultValue:{}},
  isActive:{type:DataTypes.BOOLEAN,allowNull:false,defaultValue:true},
  createdBy:{type:DataTypes.UUID,allowNull:true},
  updatedBy:{type:DataTypes.UUID,allowNull:true},
},{tableName:"kiosk_devices",timestamps:true,indexes:[
  {unique:true,fields:["companyId","deviceCode"],name:"kiosk_devices_company_device_code_unique"},
  {fields:["companyId","kioskProfileId"]},{fields:["companyId","status","isActive"]},{fields:["lastSeenAt"]},
]});
module.exports=KioskDevice;
