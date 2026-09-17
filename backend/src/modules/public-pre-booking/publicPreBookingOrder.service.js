const crypto=require("crypto");
const db=require("../../models");
const AppError=require("../../utils/AppError");
const plain=v=>v&&typeof v.get==="function"?v.get({plain:true}):v;
const money=v=>Math.round((Number(v||0)+Number.EPSILON)*10000)/10000;
const makeNo=()=>`PB-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

async function getCompany(code,transaction){
  const company=await db.Company.findOne({where:{code:String(code||"MYSHOPS").trim().toUpperCase(),isActive:true},transaction});
  if(!company) throw new AppError("Storefront company was not found.",404,"STOREFRONT_COMPANY_NOT_FOUND");
  return company;
}
function allowed(c,m){return m==="CARD"?c.allowCard===true:m==="TABBY"?c.allowTabby===true:m==="TAMARA"?c.allowTamara===true:false;}

exports.createOrder=async({companyCode,publicToken,authenticatedCustomerId=null,customer,shippingAddress,paymentMethod,notes=null})=>
db.sequelize.transaction(async transaction=>{
  const company=await getCompany(companyCode,transaction);
  const session=await db.PreBookingCheckoutSession.findOne({where:{companyId:company.id,publicToken},transaction,lock:transaction.LOCK.UPDATE});
  if(!session) throw new AppError("Pre-booking checkout session was not found.",404,"PRE_BOOKING_CHECKOUT_SESSION_NOT_FOUND");
  const method=String(paymentMethod||"").trim().toUpperCase();

  if(!["CARD","TABBY","TAMARA"].includes(method)){
    throw new AppError("The selected payment method is invalid.",400,"PRE_BOOKING_PAYMENT_METHOD_INVALID");
  }

  const campaign=await db.PreBookingCampaign.findOne({where:{id:session.campaignId,companyId:company.id},transaction});
  if(!campaign) throw new AppError("Pre-booking campaign was not found.",404,"PRE_BOOKING_CAMPAIGN_NOT_FOUND");
  if(!allowed(campaign,method)) throw new AppError("The selected payment method is not enabled for this campaign.",409,"PRE_BOOKING_PAYMENT_METHOD_NOT_ALLOWED");

  /*
  |--------------------------------------------------------------------------
  | Existing Order / Payment Method Switching
  |--------------------------------------------------------------------------
  */
  if(session.orderId){
    const existing=await db.Order.findOne({
      where:{id:session.orderId,companyId:company.id},
      transaction,
      lock:transaction.LOCK.UPDATE
    });

    if(existing){
      const paymentStatus=String(existing.paymentStatus||"").trim().toUpperCase();

      if(["PAID","AUTHORIZED"].includes(paymentStatus)){
        if(String(existing.paymentMethod)!==method){
          throw new AppError(
            "The payment method cannot be changed after payment has been completed.",
            409,
            "PRE_BOOKING_PAYMENT_ALREADY_COMPLETED"
          );
        }
        return {order:plain(existing),publicToken,reused:true};
      }

      if(String(existing.paymentMethod)!==method){
        existing.paymentMethod=method;
        existing.paymentStatus="PENDING";
        await existing.save({transaction});

        const payment=await db.OrderPayment.findOne({
          where:{companyId:company.id,orderId:existing.id},
          order:[["createdAt","DESC"]],
          transaction,
          lock:transaction.LOCK.UPDATE
        });

        const provider=
          method==="CARD"
            ?"NETWORK_INTERNATIONAL"
            :method==="TABBY"
              ?"TABBY"
              :method==="TAMARA"
                ?"TAMARA"
                :null;

        if(payment){
          payment.paymentMethod=method;
          payment.status="PENDING";
          payment.amount=existing.grandTotal;
          payment.currencyCode=existing.currencyCode;
          payment.provider=provider;
          payment.providerReference=null;
          payment.providerPayload=null;
          payment.paidAt=null;
          await payment.save({transaction});
        }else{
          await db.OrderPayment.create({
            companyId:company.id,
            orderId:existing.id,
            paymentMethod:method,
            status:"PENDING",
            amount:existing.grandTotal,
            currencyCode:existing.currencyCode,
            provider,
            providerReference:null,
            providerPayload:null,
            paidAt:null
          },{transaction});
        }

        session.metadata={...(session.metadata||{}),paymentMethod:method};
        await session.save({transaction});
      }else{
        const payment=await db.OrderPayment.findOne({
          where:{companyId:company.id,orderId:existing.id,paymentMethod:method},
          order:[["createdAt","DESC"]],
          transaction,
          lock:transaction.LOCK.UPDATE
        });

        if(!payment){
          await db.OrderPayment.create({
            companyId:company.id,
            orderId:existing.id,
            paymentMethod:method,
            status:"PENDING",
            amount:existing.grandTotal,
            currencyCode:existing.currencyCode,
            provider:method==="CARD"?"NETWORK_INTERNATIONAL":method==="TABBY"?"TABBY":"TAMARA",
            providerReference:null,
            providerPayload:null,
            paidAt:null
          },{transaction});
        }
      }

      return {order:plain(existing),publicToken,reused:true};
    }

    session.orderId=null;
    if(session.status==="PAYMENT_PENDING") session.status="RESERVED";
    await session.save({transaction});
  }

  if(new Date(session.expiresAt).getTime()<=Date.now()) throw new AppError("This pre-booking reservation has expired.",409,"PRE_BOOKING_CHECKOUT_EXPIRED");
  if(!["OPEN","RESERVED"].includes(String(session.status))) throw new AppError("This checkout cannot create an order in its current state.",409,"PRE_BOOKING_CHECKOUT_INVALID_STATE");

  const firstName=String(customer?.firstName||"").trim(), lastName=String(customer?.lastName||"").trim();
  const email=String(customer?.email||"").trim().toLowerCase(), phone=String(customer?.phone||"").trim();
  const addressLine1=String(shippingAddress?.addressLine1||"").trim(), addressLine2=String(shippingAddress?.addressLine2||"").trim();
  const emirate=String(shippingAddress?.emirate||"").trim(), city=String(shippingAddress?.city||"").trim();
  const area=String(shippingAddress?.area||"").trim(), landmark=String(shippingAddress?.landmark||"").trim();
  if(!firstName||!email||!phone) throw new AppError("First name, email and mobile number are required.",400,"PRE_BOOKING_CUSTOMER_DETAILS_REQUIRED");
  if(!addressLine1||!emirate||!city||!area) throw new AppError("Delivery address, emirate, city and area are required.",400,"PRE_BOOKING_ADDRESS_REQUIRED");

  const qty=Number(session.quantity), total=money(session.totalAmount), tax=money(session.taxAmount), unit=money(total/qty);
  let order;
  for(let attempt=0;attempt<5;attempt+=1){
    try{
      order=await db.Order.create({
        companyId:company.id,orderNumber:makeNo(),customerId:authenticatedCustomerId||null,channelCode:"WEBSITE",
        customerFirstName:firstName,customerLastName:lastName||null,customerEmail:email,customerPhone:phone,
        currencyCode:session.currencyCode||"AED",subtotal:total,discountAmount:0,deliveryAmount:0,taxAmount:tax,grandTotal:total,
        couponCode:null,deliveryMethod:"STANDARD",paymentMethod:method,paymentStatus:"PENDING",orderStatus:"PENDING",
        fulfillmentStatus:"UNFULFILLED",notes:[`PRE-BOOKING ${campaign.code}`,`Checkout token: ${publicToken}`,String(notes||"").trim()].filter(Boolean).join("\n"),
        placedAt:new Date()
      },{transaction}); break;
    }catch(e){if(e.name!=="SequelizeUniqueConstraintError"||attempt===4) throw e;}
  }

  await db.OrderItem.create({
    companyId:company.id,orderId:order.id,productId:session.productId,productVariantId:session.productVariantId,
    sku:session.sku,productName:session.productName,variantName:session.variantName,quantity:qty,currencyCode:session.currencyCode||"AED",
    regularUnitPrice:unit,baseSellingUnitPrice:unit,unitPrice:unit,priceDiscountUnit:0,giftVoucherDiscountUnit:0,totalDiscountUnit:0,totalDiscountPercent:0,
    regularLineAmount:total,baseSellingLineAmount:total,priceDiscountAmount:0,giftVoucherDiscountAmount:0,totalDiscountAmount:0,discountAmount:0,
    giftVoucherInternalUnit:0,giftVoucherExternalUnit:0,giftVoucherInternalAmount:0,giftVoucherExternalAmount:0,
    taxPercent:Number(session.metadata?.taxPercent||0),taxAmount:tax,lineSubtotal:total,lineTotal:total,
    priceListId:session.metadata?.priceList?.id||null,productVariantPriceId:session.metadata?.variantPriceId||null,
    selectedDeliveryMethod:"STANDARD",selectedPickupLocationId:null
  },{transaction});

  await db.OrderAddress.create({
    companyId:company.id,orderId:order.id,addressType:"SHIPPING",firstName,lastName:lastName||null,email,mobile:phone,
    countryCode:"AE",country:"United Arab Emirates",emirate,city,area,addressLine1,addressLine2:addressLine2||null,landmark:landmark||null,deliveryInstructions:null
  },{transaction});

  session.customerId=authenticatedCustomerId||null; session.orderId=order.id; session.status="PAYMENT_PENDING";
  session.metadata={...(session.metadata||{}),paymentMethod:method,customer:{firstName,lastName:lastName||null,email,phone},shippingAddress:{addressLine1,addressLine2:addressLine2||null,emirate,city,area,landmark:landmark||null}};
  await session.save({transaction});
  return {order:plain(order),publicToken,reused:false};
});

exports.finalizePaidOrder=async({companyCode,orderId})=>db.sequelize.transaction(async transaction=>{
  const company=await getCompany(companyCode,transaction);
  const session=await db.PreBookingCheckoutSession.findOne({where:{companyId:company.id,orderId},transaction,lock:transaction.LOCK.UPDATE});
  if(!session) return {isPreBooking:false,completed:false};
  if(String(session.status)==="COMPLETED") return {isPreBooking:true,completed:true,status:session.status,publicToken:session.publicToken};

  const order=await db.Order.findOne({where:{id:orderId,companyId:company.id},transaction,lock:transaction.LOCK.UPDATE});
  if(!order) throw new AppError("Order was not found.",404,"ORDER_NOT_FOUND");
  if(!["PAID","AUTHORIZED"].includes(String(order.paymentStatus||"").toUpperCase()))
    return {isPreBooking:true,completed:false,status:session.status,paymentStatus:order.paymentStatus,publicToken:session.publicToken};

  const allocation=await db.PreBookingAllocation.findOne({where:{id:session.allocationId,companyId:company.id},transaction,lock:transaction.LOCK.UPDATE});
  if(!allocation) throw new AppError("Pre-booking allocation was not found.",409,"PRE_BOOKING_ALLOCATION_NOT_FOUND");
  const qty=Number(session.quantity||0), reserved=Number(allocation.reservedQuantity||0);
  if(reserved<qty) throw new AppError("Reserved pre-booking quantity mismatch.",409,"PRE_BOOKING_RESERVED_QUANTITY_MISMATCH");

  allocation.reservedQuantity=reserved-qty; allocation.confirmedQuantity=Number(allocation.confirmedQuantity||0)+qty;
  await allocation.save({transaction});
  session.status="COMPLETED"; await session.save({transaction});
  return {isPreBooking:true,completed:true,status:session.status,publicToken:session.publicToken};
});
