"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GiftVoucherPromotionForm from "@/components/admin/gift-voucher-promotions/GiftVoucherPromotionForm";
import { useCreateGiftVoucherPromotionMutation } from "@/store/api/giftVoucherPromotionApi";

export default function NewGiftVoucherPromotionPage() {
  const router = useRouter();
  const [createPromotion, { isLoading }] = useCreateGiftVoucherPromotionMutation();
  return <GiftVoucherPromotionForm title="New Gift Voucher Promotion" subtitle="Create the voucher, funding rules, validity and product assignments." isSaving={isLoading} onCancel={() => router.push("/admin/gift-voucher-promotions")} onSubmit={async (values) => {
    try { await createPromotion(values).unwrap(); toast.success("Gift voucher promotion created successfully."); router.push("/admin/gift-voucher-promotions"); router.refresh(); }
    catch (error) { const e = error as { data?: { error?: { message?: string }; message?: string } }; toast.error(e.data?.error?.message || e.data?.message || "Unable to create promotion."); throw error; }
  }} />;
}
