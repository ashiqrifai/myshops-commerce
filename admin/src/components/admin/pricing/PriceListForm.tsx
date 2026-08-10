"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarRange,
  CircleDollarSign,
  FileText,
  Settings2,
} from "lucide-react";

import {
  DateField,
  FormActions,
  FormCard,
  FormSection,
  NumberField,
  SelectField,
  SwitchField,
  TextareaField,
  TextField,
} from "@/components/admin/forms";

import {
  CHANNEL_OPTIONS,
  CURRENCY_OPTIONS,
  DEFAULT_PRICE_LIST_FORM,
  PRICE_LIST_TYPES,
} from "@/constants/pricing";

import type {
  PriceListFormValues,
  PriceListType,
} from "@/types/priceList";

export type PriceListFormMode =
  | "create"
  | "edit";

export interface PriceListFormState {
  code: string;
  name: string;
  description: string;
  priceListType: PriceListType;
  channelCode: string;
  currencyCode: string;
  priority: number;
  validFrom: string;
  validUntil: string;
  isDefault: boolean;
  isActive: boolean;
  isTaxInclusive: boolean;
}

export interface PriceListFormErrors {
  code?: string;
  name?: string;
  priceListType?: string;
  channelCode?: string;
  currencyCode?: string;
  priority?: string;
  validFrom?: string;
  validUntil?: string;
}

interface PriceListFormProps {
  mode: PriceListFormMode;

  initialValues?: Partial<
    PriceListFormValues
  >;

  isSaving?: boolean;
  isLoading?: boolean;

  submitLabel?: string;

  onSubmit: (
    values: PriceListFormValues
  ) => void | Promise<void>;

  onCancel: () => void;
}

export default function PriceListForm({
  mode,
  initialValues,
  isSaving = false,
  isLoading = false,
  submitLabel,
  onSubmit,
  onCancel,
}: PriceListFormProps) {
  const resolvedInitialValues =
    useMemo(
      () =>
        buildInitialFormState(
          initialValues
        ),
      [initialValues]
    );

  const [
    formValues,
    setFormValues,
  ] =
    useState<PriceListFormState>(
      resolvedInitialValues
    );

  const [
    errors,
    setErrors,
  ] =
    useState<PriceListFormErrors>(
      {}
    );

  const [
    submitError,
    setSubmitError,
  ] = useState<
    string | null
  >(null);

  useEffect(() => {
    setFormValues(
      resolvedInitialValues
    );

    setErrors({});
    setSubmitError(null);
  }, [resolvedInitialValues]);

  const isDisabled =
    isSaving ||
    isLoading;

  const updateField = <
    TKey extends keyof PriceListFormState
  >(
    key: TKey,
    value: PriceListFormState[TKey]
  ) => {
    setFormValues(
      (current) => ({
        ...current,
        [key]: value,
      })
    );

    if (
      key in errors
    ) {
      setErrors(
        (current) => ({
          ...current,
          [key]: undefined,
        })
      );
    }

    setSubmitError(null);
  };

  const handleSubmit =
    async () => {
      const validationErrors =
        validatePriceListForm(
          formValues
        );

      setErrors(
        validationErrors
      );

      if (
        Object.keys(
          validationErrors
        ).length > 0
      ) {
        setSubmitError(
          "Please correct the highlighted fields before saving."
        );

        focusFirstInvalidField(
          validationErrors
        );

        return;
      }

      setSubmitError(null);

      const payload =
        buildSubmitPayload(
          formValues
        );

      await onSubmit(
        payload
      );
    };

  return (
    <form
      className="space-y-5"
      onSubmit={(
        event
      ) => {
        event.preventDefault();

        void handleSubmit();
      }}
    >
      {submitError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {submitError}
        </div>
      )}

      <FormCard
        title="General Information"
        description="Enter the identifying details for this price list."
      >
        <FormSection
          columns={2}
          icon={
            <FileText
              size={18}
            />
          }
        >
          <TextField
            id="price-list-code"
            name="code"
            label="Code"
            required
            disabled={
              isDisabled
            }
            value={
              formValues.code
            }
            error={
              errors.code
            }
            placeholder="RETAIL-AED"
            autoComplete="off"
            maxLength={50}
            helpText="Use a short, unique code such as RETAIL-AED."
            onChange={(
              event
            ) =>
              updateField(
                "code",
                normalizeCode(
                  event.target
                    .value
                )
              )
            }
          />

          <TextField
            id="price-list-name"
            name="name"
            label="Name"
            required
            disabled={
              isDisabled
            }
            value={
              formValues.name
            }
            error={
              errors.name
            }
            placeholder="UAE Retail Price List"
            maxLength={150}
            onChange={(
              event
            ) =>
              updateField(
                "name",
                event.target
                  .value
              )
            }
          />

          <TextareaField
            id="price-list-description"
            name="description"
            label="Description"
            disabled={
              isDisabled
            }
            value={
              formValues.description
            }
            placeholder="Describe when and where this price list should be used."
            rows={4}
            maxLength={500}
            showCharacterCount
            className="md:col-span-2"
            helpText="This description is visible to administrators."
            onChange={(
              event
            ) =>
              updateField(
                "description",
                event.target
                  .value
              )
            }
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Pricing Configuration"
        description="Configure how this price list is selected by the pricing engine."
      >
        <FormSection
          columns={2}
          icon={
            <CircleDollarSign
              size={18}
            />
          }
        >
          <SelectField
            id="price-list-type"
            name="priceListType"
            label="Price List Type"
            required
            disabled={
              isDisabled
            }
            value={
              formValues.priceListType
            }
            error={
              errors.priceListType
            }
            options={
              PRICE_LIST_TYPES
            }
            onChange={(
              event
            ) =>
              updateField(
                "priceListType",
                event.target
                  .value as PriceListType
              )
            }
          />

          <SelectField
            id="price-list-channel"
            name="channelCode"
            label="Sales Channel"
            required
            disabled={
              isDisabled
            }
            value={
              formValues.channelCode
            }
            error={
              errors.channelCode
            }
            options={
              CHANNEL_OPTIONS
            }
            onChange={(
              event
            ) =>
              updateField(
                "channelCode",
                event.target
                  .value
              )
            }
          />

          <SelectField
            id="price-list-currency"
            name="currencyCode"
            label="Currency"
            required
            disabled={
              isDisabled
            }
            value={
              formValues.currencyCode
            }
            error={
              errors.currencyCode
            }
            options={
              CURRENCY_OPTIONS
            }
            onChange={(
              event
            ) =>
              updateField(
                "currencyCode",
                event.target
                  .value
              )
            }
          />

          <NumberField
            id="price-list-priority"
            name="priority"
            label="Priority"
            required
            disabled={
              isDisabled
            }
            value={
              formValues.priority
            }
            error={
              errors.priority
            }
            min={1}
            step={1}
            showStepControls
            helpText="Lower numbers are evaluated first."
            onValueChange={(
              value
            ) =>
              updateField(
                "priority",
                value ?? 1
              )
            }
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Validity Period"
        description="Leave both dates empty when the price list should remain valid indefinitely."
      >
        <FormSection
          columns={2}
          icon={
            <CalendarRange
              size={18}
            />
          }
        >
          <DateField
            id="price-list-valid-from"
            name="validFrom"
            type="datetime-local"
            label="Valid From"
            disabled={
              isDisabled
            }
            value={
              formValues.validFrom
            }
            error={
              errors.validFrom
            }
            onChange={(
              event
            ) =>
              updateField(
                "validFrom",
                event.target
                  .value
              )
            }
          />

          <DateField
            id="price-list-valid-until"
            name="validUntil"
            type="datetime-local"
            label="Valid Until"
            disabled={
              isDisabled
            }
            value={
              formValues.validUntil
            }
            error={
              errors.validUntil
            }
            min={
              formValues.validFrom ||
              undefined
            }
            onChange={(
              event
            ) =>
              updateField(
                "validUntil",
                event.target
                  .value
              )
            }
          />
        </FormSection>
      </FormCard>

      <FormCard
        title="Settings"
        description="Control availability, tax treatment, and default pricing behavior."
      >
        <FormSection
          columns={1}
          icon={
            <Settings2
              size={18}
            />
          }
          contentClassName="gap-5"
        >
          <SwitchField
            id="price-list-active"
            name="isActive"
            label="Status"
            switchLabel={
              formValues.isActive
                ? "Active"
                : "Inactive"
            }
            disabled={
              isDisabled ||
              (
                mode ===
                  "edit" &&
                formValues.isDefault &&
                formValues.isActive
              )
            }
            checked={
              formValues.isActive
            }
            helpText={
              formValues.isDefault
                ? "The current default price list must remain active."
                : "Inactive price lists are ignored by the pricing engine."
            }
            onChange={(
              event
            ) =>
              updateField(
                "isActive",
                event.target
                  .checked
              )
            }
          />

          <SwitchField
            id="price-list-default"
            name="isDefault"
            label="Default Price List"
            switchLabel="Use as the fallback price list"
            disabled={
              isDisabled
            }
            checked={
              formValues.isDefault
            }
            helpText="The default list is used when no more specific price list matches."
            onChange={(
              event
            ) => {
              const checked =
                event.target
                  .checked;

              setFormValues(
                (current) => ({
                  ...current,
                  isDefault:
                    checked,
                  isActive:
                    checked
                      ? true
                      : current.isActive,
                })
              );
            }}
          />

          <SwitchField
            id="price-list-tax-inclusive"
            name="isTaxInclusive"
            label="Tax Treatment"
            switchLabel="Prices include tax"
            disabled={
              isDisabled
            }
            checked={
              formValues.isTaxInclusive
            }
            helpText={
              formValues.isTaxInclusive
                ? "Stored prices already include applicable tax."
                : "Applicable tax is added to the stored price."
            }
            onChange={(
              event
            ) =>
              updateField(
                "isTaxInclusive",
                event.target
                  .checked
              )
            }
          />
        </FormSection>
      </FormCard>

      <FormActions
        onSave={() =>
          void handleSubmit()
        }
        onCancel={
          onCancel
        }
        saveLabel={
          submitLabel ||
          (
            mode ===
              "create"
              ? "Create Price List"
              : "Save Changes"
          )
        }
        savingLabel={
          mode ===
          "create"
            ? "Creating..."
            : "Saving..."
        }
        isSaving={
          isSaving
        }
        saveDisabled={
          isLoading
        }
        cancelDisabled={
          isLoading
        }
        sticky
      />
    </form>
  );
}

function buildInitialFormState(
  initialValues?: Partial<
    PriceListFormValues
  >
): PriceListFormState {
  return {
    code:
      initialValues?.code ??
      DEFAULT_PRICE_LIST_FORM.code,

    name:
      initialValues?.name ??
      DEFAULT_PRICE_LIST_FORM.name,

    description:
      initialValues?.description ??
      DEFAULT_PRICE_LIST_FORM.description,

    priceListType:
      initialValues?.priceListType ??
      DEFAULT_PRICE_LIST_FORM.priceListType,

    channelCode:
      initialValues?.channelCode ??
      DEFAULT_PRICE_LIST_FORM.channelCode,

    currencyCode:
      initialValues?.currencyCode ??
      DEFAULT_PRICE_LIST_FORM.currencyCode,

    priority:
      initialValues?.priority ??
      DEFAULT_PRICE_LIST_FORM.priority,

    validFrom:
      toDateTimeLocalValue(
        initialValues?.validFrom ??
          DEFAULT_PRICE_LIST_FORM.validFrom
      ),

    validUntil:
      toDateTimeLocalValue(
        initialValues?.validUntil ??
          DEFAULT_PRICE_LIST_FORM.validUntil
      ),

    isDefault:
      initialValues?.isDefault ??
      DEFAULT_PRICE_LIST_FORM.isDefault,

    isActive:
      initialValues?.isActive ??
      DEFAULT_PRICE_LIST_FORM.isActive,

    isTaxInclusive:
      initialValues?.isTaxInclusive ??
      DEFAULT_PRICE_LIST_FORM.isTaxInclusive,
  };
}

function validatePriceListForm(
  values: PriceListFormState
): PriceListFormErrors {
  const errors: PriceListFormErrors =
    {};

  if (
    !values.code.trim()
  ) {
    errors.code =
      "Price list code is required.";
  } else if (
    values.code.trim().length <
    2
  ) {
    errors.code =
      "Code must contain at least 2 characters.";
  }

  if (
    !values.name.trim()
  ) {
    errors.name =
      "Price list name is required.";
  }

  if (
    !values.priceListType
  ) {
    errors.priceListType =
      "Price list type is required.";
  }

  if (
    !values.channelCode
  ) {
    errors.channelCode =
      "Sales channel is required.";
  }

  if (
    !values.currencyCode
  ) {
    errors.currencyCode =
      "Currency is required.";
  }

  if (
    !Number.isInteger(
      values.priority
    ) ||
    values.priority < 1
  ) {
    errors.priority =
      "Priority must be a whole number greater than zero.";
  }

  const validFromTime =
    parseDateValue(
      values.validFrom
    );

  const validUntilTime =
    parseDateValue(
      values.validUntil
    );

  if (
    values.validFrom &&
    validFromTime === null
  ) {
    errors.validFrom =
      "Enter a valid start date.";
  }

  if (
    values.validUntil &&
    validUntilTime === null
  ) {
    errors.validUntil =
      "Enter a valid end date.";
  }

  if (
    validFromTime !== null &&
    validUntilTime !== null &&
    validUntilTime <
      validFromTime
  ) {
    errors.validUntil =
      "Valid Until must be later than Valid From.";
  }

  return errors;
}

function buildSubmitPayload(
  values: PriceListFormState
): PriceListFormValues {
  return {
    code:
      values.code
        .trim()
        .toUpperCase(),

    name:
      values.name.trim(),

    description:
      values.description.trim() ||
      null,

    priceListType:
      values.priceListType,

    channelCode:
      values.channelCode,

    currencyCode:
      values.currencyCode,

    priority:
      values.priority,

    validFrom:
      toApiDateTime(
        values.validFrom
      ),

    validUntil:
      toApiDateTime(
        values.validUntil
      ),

    isDefault:
      values.isDefault,

    isActive:
      values.isDefault
        ? true
        : values.isActive,

    isTaxInclusive:
      values.isTaxInclusive,
  };
}

function normalizeCode(
  value: string
) {
  return value
    .toUpperCase()
    .replace(
      /\s+/g,
      "-"
    )
    .replace(
      /[^A-Z0-9_-]/g,
      ""
    );
}

function parseDateValue(
  value: string
) {
  if (!value) {
    return null;
  }

  const time =
    new Date(
      value
    ).getTime();

  return Number.isFinite(
    time
  )
    ? time
    : null;
}

function toApiDateTime(
  value: string
) {
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

  return date.toISOString();
}

function toDateTimeLocalValue(
  value:
    | string
    | null
    | undefined
) {
  if (!value) {
    return "";
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
    return "";
  }

  const offset =
    date.getTimezoneOffset();

  const localDate =
    new Date(
      date.getTime() -
        offset *
          60_000
    );

  return localDate
    .toISOString()
    .slice(
      0,
      16
    );
}

function focusFirstInvalidField(
  errors: PriceListFormErrors
) {
  const fieldMap: Array<
    [
      keyof PriceListFormErrors,
      string,
    ]
  > = [
    [
      "code",
      "price-list-code",
    ],
    [
      "name",
      "price-list-name",
    ],
    [
      "priceListType",
      "price-list-type",
    ],
    [
      "channelCode",
      "price-list-channel",
    ],
    [
      "currencyCode",
      "price-list-currency",
    ],
    [
      "priority",
      "price-list-priority",
    ],
    [
      "validFrom",
      "price-list-valid-from",
    ],
    [
      "validUntil",
      "price-list-valid-until",
    ],
  ];

  const firstInvalidField =
    fieldMap.find(
      ([key]) =>
        Boolean(
          errors[key]
        )
    );

  if (
    !firstInvalidField
  ) {
    return;
  }

  window.setTimeout(
    () => {
      document
        .getElementById(
          firstInvalidField[1]
        )
        ?.focus();
    },
    0
  );
}