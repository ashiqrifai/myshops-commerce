"use client";
import{useEffect}from"react";
import{finalizePreBookingOrder}from"@/lib/storefront/public-pre-booking-order-api";
export default function PreBookingPendingPaymentRecovery(){useEffect(()=>{let cancelled=false;const run=async()=>{const id=localStorage.getItem("myshops_pending_prebooking_order_id");if(!id)return;try{const r=await finalizePreBookingOrder(id);if(!cancelled&&r?.completed){localStorage.removeItem("myshops_pending_prebooking_order_id");localStorage.removeItem("myshops_pending_prebooking_token");}}catch(e){console.warn("Pre-booking payment recovery:",e);}};void run();const timer=setInterval(()=>void run(),5000);return()=>{cancelled=true;clearInterval(timer);};},[]);return null;}
