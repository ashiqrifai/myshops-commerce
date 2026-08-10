// backend/src/modules/notifications/notification.constants.js

const NOTIFICATION_CHANNELS = [
    "IN_APP",
    "EMAIL",
    "SMS",
    "WHATSAPP",
    "PUSH",
  ];
  
  const NOTIFICATION_TYPES = {
    WELCOME:
      "WELCOME",
  
    ORDER_PLACED:
      "ORDER_PLACED",
  
    ORDER_CONFIRMED:
      "ORDER_CONFIRMED",
  
    ORDER_CANCELLED:
      "ORDER_CANCELLED",
  
    PAYMENT_SUCCESS:
      "PAYMENT_SUCCESS",
  
    PAYMENT_FAILED:
      "PAYMENT_FAILED",
  
    ORDER_PROCESSING:
      "ORDER_PROCESSING",
  
    ORDER_SHIPPED:
      "ORDER_SHIPPED",
  
    ORDER_OUT_FOR_DELIVERY:
      "ORDER_OUT_FOR_DELIVERY",
  
    ORDER_DELIVERED:
      "ORDER_DELIVERED",
  
    REFUND_INITIATED:
      "REFUND_INITIATED",
  
    REFUND_COMPLETED:
      "REFUND_COMPLETED",
  
    PRICE_DROP:
      "PRICE_DROP",
  
    BACK_IN_STOCK:
      "BACK_IN_STOCK",
  
    PROMOTION:
      "PROMOTION",
  
    SYSTEM:
      "SYSTEM",
  };
  
  const NOTIFICATION_ENTITY_TYPES = {
    ORDER:
      "ORDER",
  
    PAYMENT:
      "PAYMENT",
  
    REFUND:
      "REFUND",
  
    PRODUCT:
      "PRODUCT",
  
    CUSTOMER:
      "CUSTOMER",
  
    PROMOTION:
      "PROMOTION",
  };
  
  const EMAIL_STATUSES = [
    "NOT_REQUIRED",
    "PENDING",
    "SENT",
    "FAILED",
  ];
  
  module.exports = {
    NOTIFICATION_CHANNELS,
    NOTIFICATION_TYPES,
    NOTIFICATION_ENTITY_TYPES,
    EMAIL_STATUSES,
  };