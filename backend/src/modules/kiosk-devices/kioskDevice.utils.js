const crypto=require("crypto");
const hashToken=(token)=>crypto.createHash("sha256").update(String(token)).digest("hex");
const randomToken=(bytes)=>crypto.randomBytes(bytes).toString("base64url");
module.exports={hashToken,createActivationCode:()=>randomToken(24),createDeviceToken:()=>randomToken(48)};
