import type{StorefrontData,StorefrontSection}from"@/types/storefront";
import AnnouncementBar from"./header/AnnouncementBar";
import MainHeader from"./header/MainHeader";
import MainNavigation from"./header/MainNavigation";
import AddedToCartDrawer from"./cart/AddedToCartDrawer";
import TabbyPendingOrderRecovery from"./tabby/TabbyPendingOrderRecovery";
import PreBookingPendingPaymentRecovery from"./pre-booking/PreBookingPendingPaymentRecovery";
interface StorefrontHeaderProps{storefront:StorefrontData;announcementSection?:StorefrontSection|null;headerSection?:StorefrontSection|null;navigationSection?:StorefrontSection|null;}
export default function StorefrontHeader({storefront,announcementSection,headerSection,navigationSection}:StorefrontHeaderProps){
 return <><TabbyPendingOrderRecovery/><PreBookingPendingPaymentRecovery/><AnnouncementBar storefront={storefront} section={announcementSection}/><MainHeader storefront={storefront} section={headerSection} navigationSection={navigationSection}/><MainNavigation section={navigationSection} theme={storefront.settings.theme}/><AddedToCartDrawer/></>;
}
