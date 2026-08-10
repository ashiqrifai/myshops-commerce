"use client";

import {
  Building2,
  Gift,
  Home,
  Hotel,
  MapPin,
  Pencil,
  Trash2,
  Warehouse,
} from "lucide-react";

import type {
  CustomerAddress,
} from "@/types/customerAddress";

const getIcon =
  (
    type:
      CustomerAddress["addressType"]
  ) => {
    if (
      type ===
      "HOME" ||
      type ===
      "APARTMENT" ||
      type ===
      "VILLA"
    ) {
      return Home;
    }

    if (
      type ===
      "OFFICE"
    ) {
      return Building2;
    }

    if (
      type ===
      "WAREHOUSE"
    ) {
      return Warehouse;
    }

    if (
      type ===
      "HOTEL"
    ) {
      return Hotel;
    }

    if (
      type ===
      "GIFT"
    ) {
      return Gift;
    }

    return MapPin;
  };

export default function AddressCard({
  address,
  busy,
  onEdit,
  onDelete,
  onSetDefaultShipping,
  onSetDefaultBilling,
}: {
  address:
    CustomerAddress;
  busy: boolean;
  onEdit:
    () => void;
  onDelete:
    () => void;
  onSetDefaultShipping:
    () => void;
  onSetDefaultBilling:
    () => void;
}) {
  const Icon =
    getIcon(
      address.addressType
    );

  const location =
    address.location;

  return (
    <article className="rounded-[20px] border border-storefront bg-storefront-surface p-5 transition hover:border-storefront-primary/50 hover:shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-storefront-secondary text-storefront-primary">
            <Icon
              size={
                21
              }
            />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-lg font-black text-storefront-text">
              {
                address.label
              }
            </h2>

            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-storefront-muted">
              {
                address.addressType
              }
            </p>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onEdit
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-storefront-secondary disabled:opacity-50"
            aria-label={`Edit ${address.label}`}
          >
            <Pencil
              size={
                16
              }
            />
          </button>

          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onDelete
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
            aria-label={`Delete ${address.label}`}
          >
            <Trash2
              size={
                16
              }
            />
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {address.isDefaultShipping ? (
          <span className="rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-black text-green-800">
            Default shipping
          </span>
        ) : null}

        {address.isDefaultBilling ? (
          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-black text-blue-800">
            Default billing
          </span>
        ) : null}
      </div>

      <div className="mt-4 text-sm leading-6 text-storefront-muted">
        <p className="font-black text-storefront-text">
          {
            address.recipient.fullName
          }
        </p>

        <p>
          {
            address.recipient.mobile
          }
        </p>

        <p className="mt-2">
          {
            location.building
          }

          {location.floor
            ? `, Floor ${location.floor}`
            : ""}

          {location.apartment
            ? `, Apt ${location.apartment}`
            : ""}

          {location.villaNumber
            ? `, Villa ${location.villaNumber}`
            : ""}
        </p>

        <p>
          {
            location.street
          },{" "}
          {
            location.area
          }
        </p>

        <p>
          {
            location.city ||
            location.emirateDisplayName
          },{" "}
          {
            location.emirateDisplayName
          }
        </p>

        {location.landmark ? (
          <p className="mt-1">
            Landmark:{" "}
            {
              location.landmark
            }
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-storefront pt-4">
        {!address.isDefaultShipping ? (
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onSetDefaultShipping
            }
            className="rounded-lg border border-storefront px-3 py-2 text-xs font-black text-storefront-text hover:border-storefront-primary hover:text-storefront-primary disabled:opacity-50"
          >
            Set as shipping
          </button>
        ) : null}

        {!address.isDefaultBilling ? (
          <button
            type="button"
            disabled={
              busy
            }
            onClick={
              onSetDefaultBilling
            }
            className="rounded-lg border border-storefront px-3 py-2 text-xs font-black text-storefront-text hover:border-storefront-primary hover:text-storefront-primary disabled:opacity-50"
          >
            Set as billing
          </button>
        ) : null}
      </div>
    </article>
  );
}
