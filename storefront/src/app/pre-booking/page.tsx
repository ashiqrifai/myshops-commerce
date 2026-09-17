import type {
    Metadata,
  } from "next";
  
  import Link from "next/link";
  
  import {
    CalendarDays,
    ChevronRight,
    PackageSearch,
    ShoppingBag,
  } from "lucide-react";
  
  import StorefrontFooter from "@/components/storefront/StorefrontFooter";
  import StorefrontHeader from "@/components/storefront/StorefrontHeader";
  import StorefrontShell from "@/components/storefront/StorefrontShell";
  
  import {
    getPublicPreBookingCampaigns,
  } from "@/lib/storefront/public-pre-booking-api";
  
  import {
    getStorefrontPage,
  } from "@/lib/storefront/storefront-api";
  
  import {
    splitGlobalStorefrontSections,
  } from "@/lib/storefront/storefront-sections";
  
  /*
  |--------------------------------------------------------------------------
  | Metadata
  |--------------------------------------------------------------------------
  */
  
  export const metadata:
    Metadata = {
      title:
        "Pre-Booking | MyShops",
  
      description:
        "Discover active and upcoming pre-booking campaigns at MyShops UAE.",
  
      alternates: {
        canonical:
          "/pre-booking",
      },
    };
  
  /*
  |--------------------------------------------------------------------------
  | Date
  |--------------------------------------------------------------------------
  */
  
  const formatDate = (
    value:
      | string
      | null
      | undefined
  ) => {
    if (!value) {
      return null;
    }
  
    const date =
      new Date(
        value
      );
  
    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return null;
    }
  
    return new Intl.DateTimeFormat(
      "en-AE",
      {
        day:
          "numeric",
  
        month:
          "short",
  
        year:
          "numeric",
      }
    ).format(
      date
    );
  };
  
  /*
  |--------------------------------------------------------------------------
  | Booking Status Label
  |--------------------------------------------------------------------------
  */
  
  const getStatusLabel = (
    status:
      string
  ) => {
    switch (
      String(
        status ||
          ""
      )
        .trim()
        .toUpperCase()
    ) {
      case "ACTIVE":
        return "Booking Open";
  
      case "UPCOMING":
        return "Coming Soon";
  
      case "PAUSED":
        return "Temporarily Paused";
  
      case "CLOSED":
        return "Booking Closed";
  
      default:
        return "Pre-Booking";
    }
  };
  
  /*
  |--------------------------------------------------------------------------
  | Page
  |--------------------------------------------------------------------------
  */
  
  export default async function PreBookingPage() {
    const [
      storefront,
      campaignData,
    ] =
      await Promise.all([
        getStorefrontPage({
          slug:
            "/",
  
          channel:
            "WEBSITE",
        }),
  
        getPublicPreBookingCampaigns({
          channel:
            "WEBSITE",
        }),
      ]);
  
    const globalSections =
      splitGlobalStorefrontSections(
        storefront.page
          .sections
      );
  
    const campaigns =
      Array.isArray(
        campaignData.campaigns
      )
        ? campaignData.campaigns
        : [];
  
    return (
      <StorefrontShell
        storefront={
          storefront
        }
      >
        <StorefrontHeader
          storefront={
            storefront
          }
          announcementSection={
            globalSections
              .announcementSection
          }
          headerSection={
            globalSections
              .headerSection
          }
          navigationSection={
            globalSections
              .navigationSection
          }
        />
  
        <main className="flex-1 bg-storefront-background">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8">
            {/*
            |--------------------------------------------------------------------------
            | Breadcrumb
            |--------------------------------------------------------------------------
            */}
  
            <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-storefront-muted">
              <Link
                href="/"
                className="hover:text-storefront-primary"
              >
                Home
              </Link>
  
              <ChevronRight
                size={14}
                className="mx-1"
              />
  
              <span className="font-bold text-storefront-text">
                Pre-Booking
              </span>
            </nav>
  
            {/*
            |--------------------------------------------------------------------------
            | Hero
            |--------------------------------------------------------------------------
            */}
  
            <section className="overflow-hidden rounded-[22px] bg-slate-950 px-6 py-10 text-white sm:px-8 lg:px-10 lg:py-12">
              <div className="max-w-3xl">
                <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.14em]">
                  MyShops Pre-Booking
                </span>
  
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  Be among the first
                </h1>
  
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/75 sm:text-base">
                  Discover the latest
                  launches available for
                  pre-booking at MyShops.
                  Reserve eligible products
                  before general
                  availability.
                </p>
  
                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/85">
                    <ShoppingBag
                      size={15}
                    />
  
                    {
                      campaigns.length
                    }{" "}
                    active{" "}
                    {campaigns.length ===
                    1
                      ? "campaign"
                      : "campaigns"}
                  </span>
                </div>
              </div>
            </section>
  
            {/*
            |--------------------------------------------------------------------------
            | Campaigns
            |--------------------------------------------------------------------------
            */}
  
            <section className="py-8">
              <div className="mb-5">
                <h2 className="text-2xl font-black text-storefront-text">
                  Pre-Booking Campaigns
                </h2>
  
                <p className="mt-1 text-sm text-storefront-muted">
                  Explore products
                  currently available for
                  pre-booking.
                </p>
              </div>
  
              {campaigns.length ===
              0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-storefront-border bg-white p-8 text-center">
                  <PackageSearch
                    size={38}
                    className="text-slate-400"
                  />
  
                  <h3 className="mt-4 text-lg font-black text-storefront-text">
                    No active pre-booking campaigns
                  </h3>
  
                  <p className="mt-2 max-w-md text-sm leading-6 text-storefront-muted">
                    There are currently no
                    products available for
                    pre-booking. Please
                    check back soon for new
                    launches.
                  </p>
  
                  <Link
                    href="/products"
                    className="mt-6 inline-flex h-11 items-center justify-center rounded-storefront-button bg-storefront-primary px-6 text-sm font-bold text-white transition hover:opacity-90"
                  >
                    Browse Products
                  </Link>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {campaigns.map(
                    (
                      campaign
                    ) => {
                      const startsAt =
                        formatDate(
                          campaign
                            .bookingStartAt
                        );
  
                      const closesAt =
                        formatDate(
                          campaign
                            .bookingEndAt
                        );
  
                      const campaignUrl =
                        campaign
                          .campaignUrl ||
                        `/pre-booking/${campaign.slug}`;
  
                      const statusLabel =
                        getStatusLabel(
                          campaign
                            .bookingStatus
                        );
  
                      const isActive =
                        campaign
                          .bookingStatus ===
                        "ACTIVE";
  
                      return (
                        <article
                          key={
                            campaign.id
                          }
                          className="group flex min-h-[310px] min-w-0 flex-col overflow-hidden rounded-[22px] border border-storefront-border bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        >
                          {/*
                          |--------------------------------------------------------------------------
                          | Campaign Header
                          |--------------------------------------------------------------------------
                          */}
  
                          <div className="bg-slate-950 px-6 py-6 text-white">
                            <div className="flex items-start justify-between gap-4">
                              <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em]">
                                Pre-Booking
                              </span>
  
                              <span
                                className={[
                                  "inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wide",
  
                                  isActive
                                    ? "bg-emerald-500 text-white"
                                    : "bg-white/10 text-white",
                                ].join(
                                  " "
                                )}
                              >
                                {
                                  statusLabel
                                }
                              </span>
                            </div>
  
                            <h3 className="mt-5 text-2xl font-black tracking-tight">
                              {
                                campaign.name
                              }
                            </h3>
                          </div>
  
                          {/*
                          |--------------------------------------------------------------------------
                          | Campaign Content
                          |--------------------------------------------------------------------------
                          */}
  
                          <div className="flex flex-1 flex-col p-6">
                            {campaign.description ? (
                              <p className="line-clamp-3 text-sm leading-6 text-storefront-muted">
                                {
                                  campaign.description
                                }
                              </p>
                            ) : (
                              <p className="text-sm leading-6 text-storefront-muted">
                                Explore products
                                available in this
                                pre-booking
                                campaign.
                              </p>
                            )}
  
                            <div className="mt-5 space-y-2 text-xs text-storefront-muted">
                              {startsAt ? (
                                <div className="flex items-center gap-2">
                                  <CalendarDays
                                    size={
                                      15
                                    }
                                    className="shrink-0"
                                  />
  
                                  <span>
                                    Opens{" "}
                                    {
                                      startsAt
                                    }
                                  </span>
                                </div>
                              ) : null}
  
                              {closesAt ? (
                                <div className="flex items-center gap-2">
                                  <CalendarDays
                                    size={
                                      15
                                    }
                                    className="shrink-0"
                                  />
  
                                  <span>
                                    Closes{" "}
                                    {
                                      closesAt
                                    }
                                  </span>
                                </div>
                              ) : null}
                            </div>
  
                            <div className="mt-auto pt-6">
                              <div className="mb-4 flex items-center justify-between gap-3">
                                <span className="text-xs font-semibold text-storefront-muted">
                                  {
                                    campaign.productCount
                                  }{" "}
                                  {campaign.productCount ===
                                  1
                                    ? "product"
                                    : "products"}
                                </span>
  
                                {campaign
                                  .paymentMethods
                                  .card ? (
                                  <span className="text-[10px] font-bold uppercase tracking-wide text-storefront-muted">
                                    Card payment available
                                  </span>
                                ) : null}
                              </div>
  
                              <Link
                                href={
                                  campaignUrl
                                }
                                className="flex h-11 w-full items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-bold text-white transition hover:opacity-90"
                              >
                                View Pre-Booking
  
                                <ChevronRight
                                  size={
                                    16
                                  }
                                />
                              </Link>
                            </div>
                          </div>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          </div>
        </main>
  
        <StorefrontFooter
          storefront={
            storefront
          }
        />
      </StorefrontShell>
    );
  }