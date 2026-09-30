"use client";

import Link from "next/link";
import {
  CheckCircle2,
  LayoutTemplate,
  MonitorCog,
  Plus,
  RefreshCw,
  Store,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  useCreateKioskProfileMutation,
  useGetKioskProfilesQuery,
} from "@/store/api/kioskProfilesApi";
import { useGetInventoryLocationsQuery } from "@/store/api/inventoryLocationApi";
import { useGetCmsPagesQuery } from "@/store/api/cmsPagesApi";

type FormState = {
  name: string;
  code: string;
  inventoryLocationId: string;
  description: string;
  isDefault: boolean;
  cmsPageId: string;
};

const emptyForm: FormState = {
  name: "",
  code: "",
  inventoryLocationId: "",
  description: "",
  isDefault: false,
  cmsPageId: "",
};

function message(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = (
      error as {
        data?: {
          error?: { message?: string };
          message?: string;
        };
      }
    ).data;

    return data?.error?.message || data?.message || fallback;
  }

  return fallback;
}

export default function KioskManagementPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);

  const {
    data: profilesResponse,
    isLoading: profilesLoading,
    isFetching,
    refetch,
  } = useGetKioskProfilesQuery();

  const {
    data: locationsResponse,
    isLoading: locationsLoading,
  } = useGetInventoryLocationsQuery({
    isActive: true,
    pageSize: 100,
  });

  const {
    data: pagesResponse,
    isLoading: pagesLoading,
  } = useGetCmsPagesQuery({
    channel: "KIOSK",
    status: "PUBLISHED",
    isActive: true,
    pageSize: 100,
  });

  const [createProfile, { isLoading: isCreating }] =
    useCreateKioskProfileMutation();

  const profiles = profilesResponse?.data || [];
  const locations = locationsResponse?.data || [];

  const kioskPages = useMemo(
    () =>
      (pagesResponse?.data || []).filter(
        (page) => page.channel === "KIOSK" || page.channel === "BOTH"
      ),
    [pagesResponse]
  );

  const selectLocation = (id: string) => {
    const location = locations.find((item) => item.id === id);

    setForm((current) => ({
      ...current,
      inventoryLocationId: id,
      name: current.name || (location ? `${location.name} Kiosk` : ""),
      code:
        current.code ||
        (location?.code ? `${location.code}_KIOSK` : ""),
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setShowCreate(false);
  };

  const create = async () => {
    if (!form.name.trim()) {
      toast.error("Kiosk profile name is required.");
      return;
    }

    if (!form.code.trim()) {
      toast.error("Kiosk profile code is required.");
      return;
    }

    if (!form.inventoryLocationId) {
      toast.error("Select an inventory location.");
      return;
    }

    if (!form.cmsPageId) {
      toast.error("Select a kiosk CMS template.");
      return;
    }

    try {
      await createProfile({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        inventoryLocationId: form.inventoryLocationId,
        sourceCmsPageId: form.cmsPageId,
        description: form.description.trim() || null,
        isDefault: form.isDefault,
        settings: {},
      }).unwrap();

      toast.success(
        "Kiosk profile and dedicated CMS home created successfully."
      );

      resetForm();
      await refetch();
    } catch (error) {
      toast.error(
        message(error, "Unable to create kiosk profile.")
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <MonitorCog className="h-7 w-7" />
            <h1 className="text-2xl font-semibold">
              Kiosk Management
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Manage store-specific kiosk profiles, CMS pages and devices.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>

          <Link
            href="/admin/kiosk/devices"
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm font-medium"
          >
            <MonitorCog className="h-4 w-4" />
            Manage Devices
          </Link>

          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" />
            Add Kiosk Profile
          </button>
        </div>
      </div>

      {showCreate && (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">
            New Kiosk Profile
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a store-specific configuration and dedicated CMS
            homepage for a MyShops kiosk.
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <Field label="Store / Inventory Location">
              <select
                value={form.inventoryLocationId}
                onChange={(event) =>
                  selectLocation(event.target.value)
                }
                disabled={locationsLoading}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                <option value="">Select location</option>

                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                    {location.code ? ` (${location.code})` : ""}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Profile Name">
              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
                placeholder="Deira City Centre Kiosk"
              />
            </Field>

            <Field label="Profile Code">
              <input
                value={form.code}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                className="w-full rounded-lg border px-3 py-2.5 font-mono text-sm"
                placeholder="DXB_DEIRA_CC_KIOSK"
              />
            </Field>

            <Field label="Template CMS Page">
              <select
                value={form.cmsPageId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cmsPageId: event.target.value,
                  }))
                }
                disabled={pagesLoading}
                className="w-full rounded-lg border px-3 py-2.5 text-sm"
              >
                <option value="">Select template</option>

                {kioskPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.name} — {page.code}
                  </option>
                ))}
              </select>

              <p className="mt-1 text-xs text-slate-500">
                The selected page is used only as a template. A
                separate CMS home page will be created for this store
                automatically.
              </p>
            </Field>

            <div className="md:col-span-2">
              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                />
              </Field>
            </div>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    isDefault: event.target.checked,
                  }))
                }
              />

              <span className="text-sm">
                Use as default kiosk profile
              </span>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={resetForm}
              disabled={isCreating}
              className="rounded-lg border px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={create}
              disabled={isCreating}
              className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
            >
              {isCreating ? "Creating..." : "Create Profile"}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border bg-white shadow-sm">
        {profilesLoading ? (
          <div className="p-8 text-sm text-slate-500">
            Loading kiosk profiles...
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <MonitorCog className="mb-4 h-10 w-10 text-slate-400" />

            <h2 className="text-lg font-semibold">
              No kiosk profiles yet
            </h2>

            <p className="mt-2 max-w-lg text-sm text-slate-500">
              Create your first store kiosk profile. A dedicated CMS
              home page will be generated automatically from the
              selected template.
            </p>

            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white"
            >
              <Plus className="h-4 w-4" />
              Add Kiosk Profile
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {profiles.map((profile) => {
              const home = profile.pages?.find(
                (page) => page.pageType === "HOME"
              )?.cmsPage;

              return (
                <div key={profile.id} className="p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100">
                          <Store className="h-5 w-5" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-semibold">
                              {profile.name}
                            </h2>

                            {profile.isDefault && (
                              <Badge>Default</Badge>
                            )}

                            {profile.isActive ? (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-red-700">
                                <XCircle className="h-3.5 w-3.5" />
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="mt-1 font-mono text-xs text-slate-500">
                            {profile.code}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-3">
                        <Info
                          label="Store"
                          value={
                            profile.inventoryLocation?.name ||
                            "Not assigned"
                          }
                          sub={profile.inventoryLocation?.code}
                        />

                        <Info
                          label="Dedicated Home CMS"
                          value={home?.name || "Not assigned"}
                          sub={home?.code}
                        />

                        <Info
                          label="Devices"
                          value={String(
                            profile.devices?.length || 0
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {home && (
                        <Link
                          href={`/cms/pages/${home.id}/sections`}
                          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium"
                        >
                          <LayoutTemplate className="h-4 w-4" />
                          Manage Sections
                        </Link>
                      )}

                      <Link
                        href="/cms/pages"
                        className="rounded-lg border px-3 py-2 text-sm font-medium"
                      >
                        CMS Pages
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">
        {label}
      </label>

      {children}
    </div>
  );
}

function Info({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">
        {value}
      </p>

      {sub && (
        <p className="mt-1 text-xs text-slate-500">
          {sub}
        </p>
      )}
    </div>
  );
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}
