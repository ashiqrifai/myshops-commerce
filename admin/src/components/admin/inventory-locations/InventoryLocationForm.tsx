"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  LoaderCircle,
  Save,
} from "lucide-react";

import type {
  InventoryLocation,
  InventoryLocationFormValues,
  InventoryLocationType,
} from "@/types/inventoryLocation";

interface Props {
  location?:
    InventoryLocation |
    null;

  submitting:
    boolean;

  submitLabel?:
    string;

  onSubmit:
    (
      values:
        InventoryLocationFormValues
    ) => Promise<void>;
}

const textValue =
  (
    value:
      string |
      null |
      undefined
  ) =>
    value ||
    "";

const numberValue =
  (
    value:
      number |
      string |
      null |
      undefined
  ) => {
    if (
      value ===
        null ||
      value ===
        undefined ||
      value ===
        ""
    ) {
      return "";
    }

    return String(
      value
    );
  };

export default function InventoryLocationForm({
  location,
  submitting,
  submitLabel =
    "Save location",
  onSubmit,
}: Props) {
  const [
    values,
    setValues,
  ] =
    useState<
      InventoryLocationFormValues
    >({
      name:
        "",

      code:
        "",

      locationType:
        "STORE",

      countryCode:
        "AE",

      country:
        "United Arab Emirates",

      emirate:
        "",

      city:
        "",

      area:
        "",

      addressLine1:
        "",

      addressLine2:
        "",

      landmark:
        "",

      latitude:
        null,

      longitude:
        null,

      phone:
        "",

      email:
        "",

      isDeliveryEnabled:
        true,

      isPickupEnabled:
        false,

      pickupLeadTimeMinutes:
        60,

      pickupInstructions:
        "",

      isActive:
        true,

      sortOrder:
        0,
    });

  const [
    latitudeText,
    setLatitudeText,
  ] =
    useState(
      ""
    );

  const [
    longitudeText,
    setLongitudeText,
  ] =
    useState(
      ""
    );

  useEffect(
    () => {
      if (
        !location
      ) {
        return;
      }

      setValues({
        name:
          location.name,

        code:
          location.code,

        locationType:
          location.locationType,

        countryCode:
          location.countryCode,

        country:
          location.country,

        emirate:
          textValue(
            location.emirate
          ),

        city:
          textValue(
            location.city
          ),

        area:
          textValue(
            location.area
          ),

        addressLine1:
          textValue(
            location.addressLine1
          ),

        addressLine2:
          textValue(
            location.addressLine2
          ),

        landmark:
          textValue(
            location.landmark
          ),

        latitude:
          location.latitude ===
            null
            ? null
            : Number(
                location.latitude
              ),

        longitude:
          location.longitude ===
            null
            ? null
            : Number(
                location.longitude
              ),

        phone:
          textValue(
            location.phone
          ),

        email:
          textValue(
            location.email
          ),

        isDeliveryEnabled:
          location.isDeliveryEnabled,

        isPickupEnabled:
          location.isPickupEnabled,

        pickupLeadTimeMinutes:
          location.pickupLeadTimeMinutes,

        pickupInstructions:
          textValue(
            location.pickupInstructions
          ),

        isActive:
          location.isActive,

        sortOrder:
          location.sortOrder,
      });

      setLatitudeText(
        numberValue(
          location.latitude
        )
      );

      setLongitudeText(
        numberValue(
          location.longitude
        )
      );
    },
    [
      location,
    ]
  );

  const update =
    <
      K extends
        keyof InventoryLocationFormValues,
    >(
      key:
        K,
      value:
        InventoryLocationFormValues[K]
    ) => {
      setValues(
        (
          current
        ) => ({
          ...current,

          [key]:
            value,
        })
      );
    };

  const handleSubmit =
    async (
      event:
        React.FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      await onSubmit({
        ...values,

        name:
          values.name
            .trim(),

        code:
          values.code
            ?.trim() ||
          undefined,

        countryCode:
          values.countryCode
            ?.trim()
            .toUpperCase() ||
          "AE",

        country:
          values.country
            ?.trim() ||
          "United Arab Emirates",

        emirate:
          values.emirate
            ?.trim() ||
          undefined,

        city:
          values.city
            ?.trim() ||
          undefined,

        area:
          values.area
            ?.trim() ||
          undefined,

        addressLine1:
          values.addressLine1
            ?.trim() ||
          undefined,

        addressLine2:
          values.addressLine2
            ?.trim() ||
          undefined,

        landmark:
          values.landmark
            ?.trim() ||
          undefined,

        latitude:
          latitudeText.trim()
            ? Number(
                latitudeText
              )
            : null,

        longitude:
          longitudeText.trim()
            ? Number(
                longitudeText
              )
            : null,

        phone:
          values.phone
            ?.trim() ||
          undefined,

        email:
          values.email
            ?.trim() ||
          undefined,

        pickupLeadTimeMinutes:
          Number(
            values.pickupLeadTimeMinutes ||
            0
          ),

        pickupInstructions:
          values.pickupInstructions
            ?.trim() ||
          undefined,

        sortOrder:
          Number(
            values.sortOrder ||
            0
          ),
      });
    };

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#202223]">
          Location details
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Configure a hub, store, or warehouse used for fulfillment and pickup.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field
            label="Location name"
            required
          >
            <input
              value={
                values.name
              }
              onChange={(
                event
              ) =>
                update(
                  "name",
                  event.target
                    .value
                )
              }
              required
              className="admin-input"
              placeholder="e.g. Dubai Hub"
            />
          </Field>

          <Field
            label="Location code"
            hint="Leave blank to generate from the location name."
          >
            <input
              value={
                values.code ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "code",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="e.g. DXB_HUB"
            />
          </Field>

          <Field
            label="Location type"
            required
          >
            <select
              value={
                values.locationType
              }
              onChange={(
                event
              ) =>
                update(
                  "locationType",
                  event.target
                    .value as
                    InventoryLocationType
                )
              }
              className="admin-input"
            >
              <option value="HUB">
                Hub
              </option>

              <option value="STORE">
                Store
              </option>

              <option value="WAREHOUSE">
                Warehouse
              </option>
            </select>
          </Field>

          <Field label="Sort order">
            <input
              type="number"
              min={
                0
              }
              value={
                values.sortOrder ??
                0
              }
              onChange={(
                event
              ) =>
                update(
                  "sortOrder",
                  Number(
                    event.target
                      .value ||
                    0
                  )
                )
              }
              className="admin-input"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#202223]">
          Address
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <Field label="Country code">
            <input
              value={
                values.countryCode ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "countryCode",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="AE"
            />
          </Field>

          <Field label="Country">
            <input
              value={
                values.country ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "country",
                  event.target
                    .value
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Emirate">
            <input
              value={
                values.emirate ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "emirate",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="Dubai"
            />
          </Field>

          <Field label="City">
            <input
              value={
                values.city ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "city",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="Dubai"
            />
          </Field>

          <Field label="Area">
            <input
              value={
                values.area ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "area",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="Deira"
            />
          </Field>

          <Field label="Landmark">
            <input
              value={
                values.landmark ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "landmark",
                  event.target
                    .value
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Address line 1">
            <input
              value={
                values.addressLine1 ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "addressLine1",
                  event.target
                    .value
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Address line 2">
            <input
              value={
                values.addressLine2 ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "addressLine2",
                  event.target
                    .value
                )
              }
              className="admin-input"
            />
          </Field>

          <Field label="Latitude">
            <input
              type="number"
              step="0.0000001"
              value={
                latitudeText
              }
              onChange={(
                event
              ) =>
                setLatitudeText(
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="25.204849"
            />
          </Field>

          <Field label="Longitude">
            <input
              type="number"
              step="0.0000001"
              value={
                longitudeText
              }
              onChange={(
                event
              ) =>
                setLongitudeText(
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="55.270783"
            />
          </Field>

          <Field label="Phone">
            <input
              value={
                values.phone ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "phone",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="+971..."
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={
                values.email ||
                ""
              }
              onChange={(
                event
              ) =>
                update(
                  "email",
                  event.target
                    .value
                )
              }
              className="admin-input"
              placeholder="location@myshops.ae"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-base font-semibold text-[#202223]">
          Fulfillment settings
        </h2>

        <p className="mt-1 text-sm text-[#6d7175]">
          Delivery locations can fulfill customer orders. Pickup locations can be shown to customers when stock is available there.
        </p>

        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <ToggleField
            title="Delivery enabled"
            description="This location can fulfill customer delivery orders."
            checked={
              values.isDeliveryEnabled !==
              false
            }
            onChange={(
              checked
            ) =>
              update(
                "isDeliveryEnabled",
                checked
              )
            }
          />

          <ToggleField
            title="Store pickup enabled"
            description="Customers may collect eligible products from this location."
            checked={
              values.isPickupEnabled ===
              true
            }
            onChange={(
              checked
            ) =>
              update(
                "isPickupEnabled",
                checked
              )
            }
          />

          {values.isPickupEnabled ? (
            <>
              <Field label="Pickup lead time (minutes)">
                <input
                  type="number"
                  min={
                    0
                  }
                  max={
                    10080
                  }
                  value={
                    values.pickupLeadTimeMinutes ??
                    60
                  }
                  onChange={(
                    event
                  ) =>
                    update(
                      "pickupLeadTimeMinutes",
                      Number(
                        event.target
                          .value ||
                        0
                      )
                    )
                  }
                  className="admin-input"
                />
              </Field>

              <div />
            </>
          ) : null}
        </div>

        {values.isPickupEnabled ? (
          <div className="mt-5">
            <Field label="Pickup instructions">
              <textarea
                value={
                  values.pickupInstructions ||
                  ""
                }
                onChange={(
                  event
                ) =>
                  update(
                    "pickupInstructions",
                    event.target
                      .value
                  )
                }
                className="admin-input min-h-28 resize-y py-3"
                placeholder="Bring order confirmation and Emirates ID..."
              />
            </Field>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm sm:p-6">
        <ToggleField
          title="Active location"
          description="Inactive locations will not be used by the fulfillment resolver."
          checked={
            values.isActive !==
            false
          }
          onChange={(
            checked
          ) =>
            update(
              "isActive",
              checked
            )
          }
        />
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={
            submitting ||
            !values.name
              .trim()
          }
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <LoaderCircle
              size={
                17
              }
              className="animate-spin"
            />
          ) : (
            <Save
              size={
                17
              }
            />
          )}

          {
            submitLabel
          }
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label:
    string;

  hint?:
    string;

  required?:
    boolean;

  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-[#202223]">
        {
          label
        }

        {required ? (
          <span className="text-red-600">
            {" "}
            *
          </span>
        ) : null}
      </span>

      {hint ? (
        <span className="mt-1 block text-xs text-[#6d7175]">
          {
            hint
          }
        </span>
      ) : null}

      <div className="mt-2">
        {
          children
        }
      </div>
    </label>
  );
}

function ToggleField({
  title,
  description,
  checked,
  onChange,
}: {
  title:
    string;

  description:
    string;

  checked:
    boolean;

  onChange:
    (
      checked:
        boolean
    ) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#e1e3e5] bg-[#fafbfb] p-4">
      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={(
          event
        ) =>
          onChange(
            event.target
              .checked
          )
        }
        className="mt-1"
      />

      <span>
        <span className="block text-sm font-semibold text-[#202223]">
          {
            title
          }
        </span>

        <span className="mt-1 block text-xs leading-5 text-[#6d7175]">
          {
            description
          }
        </span>
      </span>
    </label>
  );
}
