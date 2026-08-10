"use client";

import {
  LoaderCircle,
  Save,
} from "lucide-react";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import type {
  CustomerAddress,
  CustomerAddressFieldError,
  CustomerAddressInput,
  CustomerAddressType,
  CustomerAddressEmirate,
} from "@/types/customerAddress";

const ADDRESS_TYPES:
  Array<{
    value:
      CustomerAddressType;
    label:
      string;
  }> = [
    {
      value:
        "HOME",
      label:
        "Home",
    },
    {
      value:
        "OFFICE",
      label:
        "Office",
    },
    {
      value:
        "APARTMENT",
      label:
        "Apartment",
    },
    {
      value:
        "VILLA",
      label:
        "Villa",
    },
    {
      value:
        "WAREHOUSE",
      label:
        "Warehouse",
    },
    {
      value:
        "HOTEL",
      label:
        "Hotel",
    },
    {
      value:
        "GIFT",
      label:
        "Gift recipient",
    },
    {
      value:
        "OTHER",
      label:
        "Other",
    },
  ];

const EMIRATES:
  Array<{
    value:
      CustomerAddressEmirate;
    label:
      string;
  }> = [
    {
      value:
        "ABU_DHABI",
      label:
        "Abu Dhabi",
    },
    {
      value:
        "DUBAI",
      label:
        "Dubai",
    },
    {
      value:
        "SHARJAH",
      label:
        "Sharjah",
    },
    {
      value:
        "AJMAN",
      label:
        "Ajman",
    },
    {
      value:
        "UMM_AL_QUWAIN",
      label:
        "Umm Al Quwain",
    },
    {
      value:
        "RAS_AL_KHAIMAH",
      label:
        "Ras Al Khaimah",
    },
    {
      value:
        "FUJAIRAH",
      label:
        "Fujairah",
    },
  ];

const fromAddress =
  (
    address:
      CustomerAddress |
      null
  ): CustomerAddressInput => {
    if (
      !address
    ) {
      return {
        addressType:
          "HOME",

        label:
          "Home",

        firstName:
          "",

        lastName:
          "",

        companyName:
          "",

        mobile:
          "",

        email:
          "",

        countryCode:
          "AE",

        country:
          "United Arab Emirates",

        emirate:
          "DUBAI",

        city:
          "Dubai",

        area:
          "",

        street:
          "",

        building:
          "",

        floor:
          "",

        apartment:
          "",

        villaNumber:
          "",

        landmark:
          "",

        postalCode:
          "",

        latitude:
          null,

        longitude:
          null,

        deliveryInstructions:
          "",

        isDefaultShipping:
          false,

        isDefaultBilling:
          false,
      };
    }

    return {
      addressType:
        address.addressType,

      label:
        address.label,

      firstName:
        address.recipient
          .firstName,

      lastName:
        address.recipient
          .lastName ||
        "",

      companyName:
        address.recipient
          .companyName ||
        "",

      mobile:
        address.recipient
          .mobile,

      email:
        address.recipient
          .email ||
        "",

      countryCode:
        address.location
          .countryCode,

      country:
        address.location
          .country,

      emirate:
        address.location
          .emirate,

      city:
        address.location
          .city ||
        "",

      area:
        address.location
          .area,

      street:
        address.location
          .street,

      building:
        address.location
          .building,

      floor:
        address.location
          .floor ||
        "",

      apartment:
        address.location
          .apartment ||
        "",

      villaNumber:
        address.location
          .villaNumber ||
        "",

      landmark:
        address.location
          .landmark ||
        "",

      postalCode:
        address.location
          .postalCode ||
        "",

      latitude:
        address.location
          .latitude,

      longitude:
        address.location
          .longitude,

      deliveryInstructions:
        address
          .deliveryInstructions ||
        "",

      isDefaultShipping:
        address
          .isDefaultShipping,

      isDefaultBilling:
        address
          .isDefaultBilling,
    };
  };

export default function AddressForm({
  address,
  submitting,
  serverErrors,
  onSubmit,
}: {
  address:
    CustomerAddress |
    null;
  submitting: boolean;
  serverErrors:
    CustomerAddressFieldError[];
  onSubmit:
    (
      input:
        CustomerAddressInput
    ) =>
      Promise<void>;
}) {
  const [
    form,
    setForm,
  ] =
    useState<
      CustomerAddressInput
    >(
      () =>
        fromAddress(
          address
        )
    );

  const [
    clientErrors,
    setClientErrors,
  ] =
    useState<
      Record<
        string,
        string
      >
    >(
      {}
    );

  const errors =
    useMemo(
      () => {
        const merged = {
          ...clientErrors,
        };

        serverErrors.forEach(
          (
            error
          ) => {
            if (
              !merged[
                error.field
              ]
            ) {
              merged[
                error.field
              ] =
                error.message;
            }
          }
        );

        return merged;
      },
      [
        clientErrors,
        serverErrors,
      ]
    );

  const update =
    (
      field:
        keyof CustomerAddressInput,
      value:
        CustomerAddressInput[
          keyof CustomerAddressInput
        ]
    ) => {
      setForm(
        (
          current
        ) => ({
          ...current,

          [
            field
          ]:
            value,
        })
      );

      setClientErrors(
        (
          current
        ) => {
          const next = {
            ...current,
          };

          delete next[
            field
          ];

          return next;
        }
      );
    };

  const validate =
    () => {
      const next:
        Record<
          string,
          string
        > = {};

      if (
        !form.label.trim()
      ) {
        next.label =
          "Please enter an address label.";
      }

      if (
        !form.firstName.trim()
      ) {
        next.firstName =
          "Please enter the recipient's first name.";
      }

      if (
        !/^\+?[0-9\s\-()]{7,20}$/.test(
          form.mobile.trim()
        )
      ) {
        next.mobile =
          "Please enter a valid mobile number.";
      }

      if (
        form.email &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email
        )
      ) {
        next.email =
          "Please enter a valid email address.";
      }

      if (
        !form.area.trim()
      ) {
        next.area =
          "Please enter the area or neighbourhood.";
      }

      if (
        !form.street.trim()
      ) {
        next.street =
          "Please enter the street name.";
      }

      if (
        !form.building.trim()
      ) {
        next.building =
          "Please enter the building or villa name.";
      }

      setClientErrors(
        next
      );

      return (
        Object.keys(
          next
        ).length ===
        0
      );
    };

  const submit =
    async (
      event:
        FormEvent<
          HTMLFormElement
        >
    ) => {
      event.preventDefault();

      if (
        !validate()
      ) {
        return;
      }

      await onSubmit(
        form
      );
    };

  return (
    <form
      onSubmit={
        submit
      }
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Address type"
          error={
            errors.addressType
          }
        >
          <select
            value={
              form.addressType
            }
            onChange={(
              event
            ) =>
              update(
                "addressType",
                event.target
                  .value as
                  CustomerAddressType
              )
            }
            className="address-input"
          >
            {ADDRESS_TYPES.map(
              (
                item
              ) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {
                    item.label
                  }
                </option>
              )
            )}
          </select>
        </Field>

        <Field
          label="Address label"
          error={
            errors.label
          }
        >
          <input
            value={
              form.label
            }
            onChange={(
              event
            ) =>
              update(
                "label",
                event.target
                  .value
              )
            }
            className="address-input"
            placeholder="Home, Office, Parents..."
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="First name"
          error={
            errors.firstName
          }
        >
          <input
            value={
              form.firstName
            }
            onChange={(
              event
            ) =>
              update(
                "firstName",
                event.target
                  .value
              )
            }
            className="address-input"
          />
        </Field>

        <Field
          label="Last name"
          error={
            errors.lastName
          }
        >
          <input
            value={
              form.lastName ||
              ""
            }
            onChange={(
              event
            ) =>
              update(
                "lastName",
                event.target
                  .value
              )
            }
            className="address-input"
          />
        </Field>
      </div>

      <Field
        label="Company name"
        error={
          errors.companyName
        }
      >
        <input
          value={
            form.companyName ||
            ""
          }
          onChange={(
            event
          ) =>
            update(
              "companyName",
              event.target
                .value
            )
          }
          className="address-input"
          placeholder="Optional"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Mobile number"
          error={
            errors.mobile
          }
        >
          <input
            value={
              form.mobile
            }
            onChange={(
              event
            ) =>
              update(
                "mobile",
                event.target
                  .value
              )
            }
            className="address-input"
            placeholder="+971 50 000 0000"
          />
        </Field>

        <Field
          label="Email"
          error={
            errors.email
          }
        >
          <input
            type="email"
            value={
              form.email ||
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
            className="address-input"
            placeholder="Optional"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Country"
          error={
            errors.country
          }
        >
          <input
            value={
              form.country
            }
            readOnly
            className="address-input bg-storefront-secondary"
          />
        </Field>

        <Field
          label="Emirate"
          error={
            errors.emirate
          }
        >
          <select
            value={
              form.emirate
            }
            onChange={(
              event
            ) =>
              update(
                "emirate",
                event.target
                  .value as
                  CustomerAddressEmirate
              )
            }
            className="address-input"
          >
            {EMIRATES.map(
              (
                item
              ) => (
                <option
                  key={
                    item.value
                  }
                  value={
                    item.value
                  }
                >
                  {
                    item.label
                  }
                </option>
              )
            )}
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="City"
          error={
            errors.city
          }
        >
          <input
            value={
              form.city ||
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
            className="address-input"
          />
        </Field>

        <Field
          label="Area"
          error={
            errors.area
          }
        >
          <input
            value={
              form.area
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
            className="address-input"
            placeholder="Dubai Marina"
          />
        </Field>
      </div>

      <Field
        label="Street"
        error={
          errors.street
        }
      >
        <input
          value={
            form.street
          }
          onChange={(
            event
          ) =>
            update(
              "street",
              event.target
                .value
            )
          }
          className="address-input"
        />
      </Field>

      <Field
        label="Building or villa name"
        error={
          errors.building
        }
      >
        <input
          value={
            form.building
          }
          onChange={(
            event
          ) =>
            update(
              "building",
              event.target
                .value
            )
          }
          className="address-input"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Floor"
          error={
            errors.floor
          }
        >
          <input
            value={
              form.floor ||
              ""
            }
            onChange={(
              event
            ) =>
              update(
                "floor",
                event.target
                  .value
              )
            }
            className="address-input"
          />
        </Field>

        <Field
          label="Apartment"
          error={
            errors.apartment
          }
        >
          <input
            value={
              form.apartment ||
              ""
            }
            onChange={(
              event
            ) =>
              update(
                "apartment",
                event.target
                  .value
              )
            }
            className="address-input"
          />
        </Field>

        <Field
          label="Villa number"
          error={
            errors.villaNumber
          }
        >
          <input
            value={
              form.villaNumber ||
              ""
            }
            onChange={(
              event
            ) =>
              update(
                "villaNumber",
                event.target
                  .value
              )
            }
            className="address-input"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Landmark"
          error={
            errors.landmark
          }
        >
          <input
            value={
              form.landmark ||
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
            className="address-input"
          />
        </Field>

        <Field
          label="Postal code"
          error={
            errors.postalCode
          }
        >
          <input
            value={
              form.postalCode ||
              ""
            }
            onChange={(
              event
            ) =>
              update(
                "postalCode",
                event.target
                  .value
              )
            }
            className="address-input"
          />
        </Field>
      </div>

      <Field
        label="Delivery instructions"
        error={
          errors.deliveryInstructions
        }
      >
        <textarea
          value={
            form.deliveryInstructions ||
            ""
          }
          onChange={(
            event
          ) =>
            update(
              "deliveryInstructions",
              event.target
                .value
            )
          }
          rows={
            3
          }
          className="address-input min-h-24 py-3"
          placeholder="Call before delivery, leave with reception..."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-storefront p-4">
          <input
            type="checkbox"
            checked={
              form.isDefaultShipping
            }
            onChange={(
              event
            ) =>
              update(
                "isDefaultShipping",
                event.target
                  .checked
              )
            }
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-black text-storefront-text">
              Default shipping
            </span>

            <span className="mt-1 block text-xs leading-5 text-storefront-muted">
              Use this address automatically for deliveries.
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-storefront p-4">
          <input
            type="checkbox"
            checked={
              form.isDefaultBilling
            }
            onChange={(
              event
            ) =>
              update(
                "isDefaultBilling",
                event.target
                  .checked
              )
            }
            className="mt-1"
          />

          <span>
            <span className="block text-sm font-black text-storefront-text">
              Default billing
            </span>

            <span className="mt-1 block text-xs leading-5 text-storefront-muted">
              Use this address automatically for invoices.
            </span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={
          submitting
        }
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-storefront-button bg-storefront-primary px-5 text-sm font-black text-white disabled:opacity-60"
      >
        {submitting ? (
          <LoaderCircle
            size={
              18
            }
            className="animate-spin"
          />
        ) : (
          <Save
            size={
              18
            }
          />
        )}

        {submitting
          ? "Saving..."
          : address
            ? "Update address"
            : "Save address"}
      </button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?:
    string;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-black text-storefront-text">
        {
          label
        }
      </label>

      {
        children
      }

      {error ? (
        <p className="mt-1.5 text-xs font-bold text-red-600">
          {
            error
          }
        </p>
      ) : null}
    </div>
  );
}
