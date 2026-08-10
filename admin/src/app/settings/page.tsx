"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Building2,
  Check,
  ChevronRight,
  Contact,
  Globe2,
  LoaderCircle,
  MonitorSmartphone,
  Paintbrush,
  RefreshCcw,
  Save,
  Settings2,
  ShoppingCart,
} from "lucide-react";

import { useRouter } from "next/navigation";

import { toast } from "sonner";

import AdminShell from "@/components/admin/AdminShell";
import SettingField from "@/components/settings/SettingField";

import {
  useBulkUpdateSettingsMutation,
  useGetSettingsQuery,
} from "@/store/api/settingsApi";

import { useAppSelector } from "@/store/hooks";

import type {
  SystemSetting,
} from "@/types/settings";

const groupConfiguration = [
  {
    key: "company",
    label: "Company",
    description:
      "Company identity and branding.",
    icon: Building2,
  },
  {
    key: "theme",
    label: "Theme",
    description:
      "Colours, fonts, cards and buttons.",
    icon: Paintbrush,
  },
  {
    key: "website",
    label: "Website",
    description:
      "Customer-facing website features.",
    icon: Globe2,
  },
  {
    key: "kiosk",
    label: "Kiosk",
    description:
      "Android kiosk behaviour and features.",
    icon: MonitorSmartphone,
  },
  {
    key: "commerce",
    label: "Commerce",
    description:
      "Currency, tax and stock rules.",
    icon: ShoppingCart,
  },
  {
    key: "contact",
    label: "Contact",
    description:
      "Support and contact information.",
    icon: Contact,
  },
];

const resolveValue = (
  setting: SystemSetting
): unknown => {
  return setting.value !== null &&
    setting.value !== undefined
    ? setting.value
    : setting.defaultValue;
};

const getApiErrorMessage = (
  error: unknown,
  fallbackMessage: string
): string => {
  const apiError = error as {
    data?: {
      error?: {
        message?: string;
        details?: Array<{
          field?: string;
          message?: string;
        }>;
      };
    };
  };

  return (
    apiError.data?.error?.details?.[0]
      ?.message ||
    apiError.data?.error?.message ||
    fallbackMessage
  );
};

export default function SettingsPage() {
  const router = useRouter();

  const {
    accessToken,
    initialized,
  } = useAppSelector(
    (state) => state.auth
  );

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetSettingsQuery(undefined, {
    skip: !accessToken,
  });

  const [
    bulkUpdate,
    { isLoading: isSaving },
  ] = useBulkUpdateSettingsMutation();

  const [
    activeGroup,
    setActiveGroup,
  ] = useState("company");

  /*
   * This object stores only values changed by the
   * administrator. Values loaded from the API are
   * not copied into local state.
   */
  const [
    editedValues,
    setEditedValues,
  ] = useState<Record<string, unknown>>(
    {}
  );

  useEffect(() => {
    if (
      initialized &&
      !accessToken
    ) {
      router.replace("/login");
    }
  }, [
    accessToken,
    initialized,
    router,
  ]);

  const groupedSettings = useMemo(() => {
    const settings = data?.data || [];

    return settings.reduce<
      Record<string, SystemSetting[]>
    >((result, setting) => {
      if (!result[setting.group]) {
        result[setting.group] = [];
      }

      result[setting.group].push(
        setting
      );

      return result;
    }, {});
  }, [data]);

  const changedSettings = useMemo(() => {
    return (data?.data || []).filter(
      (setting) => {
        const hasEditedValue =
          Object.prototype.hasOwnProperty.call(
            editedValues,
            setting.id
          );

        if (!hasEditedValue) {
          return false;
        }

        const editedValue =
          editedValues[setting.id];

        const originalValue =
          resolveValue(setting);

        return (
          JSON.stringify(editedValue) !==
          JSON.stringify(originalValue)
        );
      }
    );
  }, [
    data,
    editedValues,
  ]);

  const activeSettings =
    groupedSettings[activeGroup] || [];

  const getCurrentValue = (
    setting: SystemSetting
  ): unknown => {
    const hasEditedValue =
      Object.prototype.hasOwnProperty.call(
        editedValues,
        setting.id
      );

    if (hasEditedValue) {
      return editedValues[setting.id];
    }

    return resolveValue(setting);
  };

  const handleValueChange = (
    settingId: string,
    value: unknown
  ) => {
    setEditedValues((current) => ({
      ...current,
      [settingId]: value,
    }));
  };

  const handleReset = () => {
    setEditedValues({});

    toast.message(
      "Unsaved changes were discarded."
    );
  };

  const handleRefresh = async () => {
    try {
      setEditedValues({});

      await refetch();

      toast.success(
        "Settings refreshed successfully."
      );
    } catch {
      toast.error(
        "Unable to refresh settings."
      );
    }
  };

  const handleSave = async () => {
    if (
      changedSettings.length === 0
    ) {
      toast.message(
        "There are no changes to save."
      );

      return;
    }

    try {
      await bulkUpdate({
        settings: changedSettings.map(
          (setting) => ({
            id: setting.id,
            value:
              editedValues[setting.id],
          })
        ),
      }).unwrap();

      /*
       * Clear local edits before refetching so
       * values returned by the API become the
       * new source of truth.
       */
      setEditedValues({});

      await refetch();

      toast.success(
        "Settings saved successfully."
      );
    } catch (saveError: unknown) {
      toast.error(
        getApiErrorMessage(
          saveError,
          "Unable to save settings."
        )
      );
    }
  };

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoaderCircle className="animate-spin" />
      </div>
    );
  }

  if (!accessToken) {
    return null;
  }

  return (
    <AdminShell>
      <div className="mx-auto max-w-[1200px] px-5 py-7 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm text-[#6d7175]">
              <span>Settings</span>

              <ChevronRight size={14} />

              <span className="capitalize">
                {activeGroup}
              </span>
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Settings
            </h1>

            <p className="mt-1 text-sm text-[#6d7175]">
              Manage the shared configuration
              for the website and Android kiosk.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={
                isFetching ||
                isSaving
              }
              className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCcw
                size={16}
                className={
                  isFetching
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={
                changedSettings.length ===
                  0 ||
                isSaving
              }
              className="h-9 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Discard
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={
                changedSettings.length ===
                  0 ||
                isSaving
              }
              className="flex h-9 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Save size={16} />
              )}

              {isSaving
                ? "Saving..."
                : "Save"}
            </button>
          </div>
        </div>

        {changedSettings.length > 0 && (
          <div className="mb-5 flex items-center justify-between rounded-xl border border-[#f4d35e] bg-[#fff8db] px-4 py-3">
            <div>
              <p className="text-sm font-medium">
                Unsaved changes
              </p>

              <p className="text-xs text-[#6d7175]">
                {changedSettings.length}{" "}
                setting
                {changedSettings.length === 1
                  ? ""
                  : "s"}{" "}
                changed.
              </p>
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f4d35e]/30">
              <Settings2 size={17} />
            </div>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="admin-card h-fit p-2">
            {groupConfiguration.map(
              (group) => {
                const Icon = group.icon;

                const active =
                  activeGroup === group.key;

                const count =
                  groupedSettings[
                    group.key
                  ]?.length || 0;

                return (
                  <button
                    key={group.key}
                    type="button"
                    onClick={() =>
                      setActiveGroup(
                        group.key
                      )
                    }
                    className={[
                      "flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition",
                      active
                        ? "bg-[#ebebeb]"
                        : "hover:bg-[#f6f6f7]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        active
                          ? "bg-white shadow-sm"
                          : "bg-[#f1f2f3]",
                      ].join(" ")}
                    >
                      <Icon size={17} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                          {group.label}
                        </p>

                        <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-[#6d7175]">
                          {count}
                        </span>
                      </div>

                      <p className="mt-0.5 text-xs leading-4 text-[#6d7175]">
                        {group.description}
                      </p>
                    </div>
                  </button>
                );
              }
            )}
          </aside>

          <section className="space-y-5">
            {isLoading && (
              <div className="admin-card flex min-h-[300px] items-center justify-center">
                <div className="text-center">
                  <LoaderCircle className="mx-auto animate-spin" />

                  <p className="mt-3 text-sm text-[#6d7175]">
                    Loading settings...
                  </p>
                </div>
              </div>
            )}

            {error && !isLoading && (
              <div className="admin-card p-6">
                <p className="font-medium text-red-700">
                  Unable to load settings.
                </p>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Check that the backend is
                  running and your login has not
                  expired.
                </p>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="mt-4 rounded-lg bg-[#303030] px-4 py-2 text-sm font-medium text-white"
                >
                  Try again
                </button>
              </div>
            )}

            {!isLoading &&
              !error &&
              activeSettings.length === 0 && (
                <div className="admin-card p-8 text-center">
                  <Settings2 className="mx-auto text-[#8c9196]" />

                  <p className="mt-3 font-medium">
                    No settings found
                  </p>

                  <p className="mt-1 text-sm text-[#6d7175]">
                    There are no active settings
                    in this group.
                  </p>
                </div>
              )}

            {!isLoading &&
              !error &&
              activeSettings.length > 0 && (
                <div className="admin-card overflow-hidden">
                  <div className="border-b border-[#e1e3e5] px-6 py-5">
                    <h2 className="text-base font-semibold capitalize">
                      {activeGroup} settings
                    </h2>

                    <p className="mt-1 text-sm text-[#6d7175]">
                      {
                        groupConfiguration.find(
                          (item) =>
                            item.key ===
                            activeGroup
                        )?.description
                      }
                    </p>
                  </div>

                  <div className="divide-y divide-[#e1e3e5]">
                    {activeSettings.map(
                      (setting) => {
                        const changed =
                          changedSettings.some(
                            (item) =>
                              item.id ===
                              setting.id
                          );

                        return (
                          <div
                            key={setting.id}
                            className="grid gap-4 px-6 py-5 md:grid-cols-[minmax(0,1fr)_minmax(250px,380px)] md:items-center"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">
                                  {setting.label}
                                </label>

                                {setting.isRequired && (
                                  <span className="text-red-600">
                                    *
                                  </span>
                                )}

                                {changed && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f1df] px-2 py-0.5 text-[10px] font-medium text-[#276749]">
                                    <Check
                                      size={10}
                                    />

                                    Changed
                                  </span>
                                )}
                              </div>

                              {setting.description && (
                                <p className="mt-1 text-sm text-[#6d7175]">
                                  {
                                    setting.description
                                  }
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-md bg-[#f1f2f3] px-2 py-1 text-[10px] font-medium text-[#6d7175]">
                                  {
                                    setting.channel
                                  }
                                </span>

                                <span className="rounded-md bg-[#f1f2f3] px-2 py-1 text-[10px] font-medium text-[#6d7175]">
                                  {setting.group}.
                                  {setting.key}
                                </span>
                              </div>
                            </div>

                            <div>
                              <SettingField
                                setting={setting}
                                value={getCurrentValue(
                                  setting
                                )}
                                onChange={(value) =>
                                  handleValueChange(
                                    setting.id,
                                    value
                                  )
                                }
                              />
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}