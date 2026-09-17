import type{Metadata}from"next";
import Link from"next/link";
import{ChevronRight}from"lucide-react";
import{notFound}from"next/navigation";
import StorefrontFooter from"@/components/storefront/StorefrontFooter";
import StorefrontHeader from"@/components/storefront/StorefrontHeader";
import StorefrontShell from"@/components/storefront/StorefrontShell";
import PreBookingCheckoutClient from"@/components/storefront/pre-booking/PreBookingCheckoutClient";
import{getPreBookingCheckoutSession}from"@/lib/storefront/public-pre-booking-checkout-api";
import{getStorefrontPage}from"@/lib/storefront/storefront-api";
import{splitGlobalStorefrontSections}from"@/lib/storefront/storefront-sections";
export const metadata:Metadata={title:"Pre-Booking Checkout | MyShops",robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{publicToken:string}>}){
 const{publicToken}=await params;let session;try{session=await getPreBookingCheckoutSession(publicToken);}catch{notFound();}
 const storefront=await getStorefrontPage({slug:"/",channel:"WEBSITE"});
 const g=splitGlobalStorefrontSections(storefront.page.sections);
 return <StorefrontShell storefront={storefront}>
  <StorefrontHeader storefront={storefront} announcementSection={g.announcementSection} headerSection={g.headerSection} navigationSection={g.navigationSection}/>
  <main className="flex-1 bg-storefront-background"><div className="mx-auto w-full max-w-[1120px] px-4 py-6 sm:px-6 lg:px-8">
   <nav className="mb-6 flex items-center gap-1 text-xs text-storefront-muted"><Link href="/">Home</Link><ChevronRight size={14}/><Link href={`/pre-booking/${session.campaign.slug}`}>{session.campaign.name}</Link><ChevronRight size={14}/><b>Checkout</b></nav>
   <PreBookingCheckoutClient session={session}/>
  </div></main>
  <StorefrontFooter storefront={storefront}/>
 </StorefrontShell>;
}
