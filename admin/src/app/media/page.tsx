"use client";

import {
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Grid2X2,
  Images,
  List,
  LoaderCircle,
  Plus,
  RefreshCcw,
  Search,
  UploadCloud,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import AdminShell from "@/components/admin/AdminShell";
import CreateMediaFolderDialog from "@/components/media/CreateMediaFolderDialog";
import MediaAssetCard from "@/components/media/MediaAssetCard";
import MediaAssetDrawer from "@/components/media/MediaAssetDrawer";
import MediaFolderTree from "@/components/media/MediaFolderTree";
import MediaUploadDialog from "@/components/media/MediaUploadDialog";

import {
  useArchiveMediaAssetMutation,
  useCreateMediaFolderMutation,
  useGetMediaAssetByIdQuery,
  useGetMediaAssetsQuery,
  useGetMediaAssetUsageQuery,
  useGetMediaFolderTreeQuery,
  useReprocessMediaAssetMutation,
  useRestoreMediaAssetMutation,
  useUpdateMediaAssetMutation,
  useUploadMediaAssetMutation,
} from "@/store/api/mediaApi";

import { useAppSelector } from "@/store/hooks";

import type {
  CreateMediaFolderBody,
  MediaAsset,
  MediaAssetClassification,
  MediaAssetType,
} from "@/types/media";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5080/api/v1"
).replace(/\/api\/v1\/?$/, "");

const getApiErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  const apiError = error as {
    data?: {
      error?: {
        message?: string;
        details?: Array<{
          message?: string;
        }>;
      };
    };
  };

  return (
    apiError.data?.error?.details?.[0]
      ?.message ||
    apiError.data?.error?.message ||
    fallback
  );
};

export default function MediaLibraryPage() {
  const router = useRouter();

  const { accessToken, initialized } =
    useAppSelector(
      (state) => state.auth
    );

  const [
    selectedFolderId,
    setSelectedFolderId,
  ] = useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [assetType, setAssetType] =
    useState<MediaAssetType | "">("");

  const [
    classification,
    setClassification,
  ] = useState<
    MediaAssetClassification | ""
  >("");

  const [
    assetStatusFilter,
    setAssetStatusFilter,
  ] = useState<
    "ACTIVE" | "ARCHIVED"
  >("ACTIVE");

  const [layout, setLayout] =
    useState<"GRID" | "LIST">(
      "GRID"
    );

  const [page, setPage] =
    useState(1);

  const pageSize = 24;

  const [
    uploadOpen,
    setUploadOpen,
  ] = useState(false);

  const [
    createFolderOpen,
    setCreateFolderOpen,
  ] = useState(false);

  const [
    selectedAssetId,
    setSelectedAssetId,
  ] = useState<string | null>(
    null
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

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setDebouncedSearch(
          search.trim()
        );

        setPage(1);
      }, 350);

    return () =>
      window.clearTimeout(timer);
  }, [search]);

  const {
    data: folderResponse,
    isLoading: isLoadingFolders,
    refetch: refetchFolders,
  } = useGetMediaFolderTreeQuery(
    undefined,
    {
      skip: !accessToken,
    }
  );

  const {
    data: assetResponse,
    isLoading: isLoadingAssets,
    isFetching: isFetchingAssets,
    error: assetsError,
    refetch: refetchAssets,
  } = useGetMediaAssetsQuery(
    {
      page,
      pageSize,

      folderId:
        selectedFolderId ||
        undefined,

      search:
        debouncedSearch ||
        undefined,

      assetType:
        assetType || undefined,

      classification:
        classification ||
        undefined,

      isActive:
        assetStatusFilter ===
        "ACTIVE",

      status:
        assetStatusFilter ===
        "ARCHIVED"
          ? "ARCHIVED"
          : undefined,

      sortBy: "createdAt",
      sortDirection: "DESC",
    },
    {
      skip: !accessToken,
    }
  );

  const {
    data: selectedAssetResponse,
    isLoading:
      isLoadingSelectedAsset,
  } =
    useGetMediaAssetByIdQuery(
      selectedAssetId || "",
      {
        skip:
          !accessToken ||
          !selectedAssetId,
      }
    );

  const {
    data: usageResponse,
    isLoading: isLoadingUsage,
    refetch: refetchUsage,
  } =
    useGetMediaAssetUsageQuery(
      selectedAssetId || "",
      {
        skip:
          !accessToken ||
          !selectedAssetId,
      }
    );

  const [
    createFolder,
    { isLoading: isCreatingFolder },
  ] =
    useCreateMediaFolderMutation();

  const [
    uploadAsset,
    { isLoading: isUploading },
  ] =
    useUploadMediaAssetMutation();

  const [
    updateAsset,
    { isLoading: isSavingAsset },
  ] =
    useUpdateMediaAssetMutation();

  const [
    archiveAsset,
    { isLoading: isArchiving },
  ] =
    useArchiveMediaAssetMutation();

  const [
    restoreAsset,
    { isLoading: isRestoring },
  ] =
    useRestoreMediaAssetMutation();

  const [
    reprocessAsset,
    { isLoading: isReprocessing },
  ] =
    useReprocessMediaAssetMutation();

  const folders = useMemo(
    () =>
      folderResponse?.data || [],
    [folderResponse?.data]
  );

  const assets =
    assetResponse?.data || [];

  const selectedAsset =
    selectedAssetId
      ? selectedAssetResponse
          ?.data ?? null
      : null;

  const usageRecords =
    usageResponse?.data || [];

  const selectedFolderName =
    useMemo(() => {
      if (!selectedFolderId) {
        return "All assets";
      }

      const findFolder = (
        folderList: typeof folders
      ): string | null => {
        for (const folder of folderList) {
          if (
            folder.id ===
            selectedFolderId
          ) {
            return folder.name;
          }

          const childName =
            findFolder(
              folder.children || []
            );

          if (childName) {
            return childName;
          }
        }

        return null;
      };

      return (
        findFolder(folders) ||
        "Media"
      );
    }, [
      folders,
      selectedFolderId,
    ]);

  const handleFolderChange = (
    folderId: string | null
  ) => {
    setSelectedFolderId(folderId);
    setSelectedAssetId(null);
    setPage(1);
  };

  const handleAssetSelect = (
    asset: MediaAsset
  ) => {
    setSelectedAssetId(asset.id);
  };

  const handleCreateFolder = async (
    body: CreateMediaFolderBody
  ) => {
    try {
      const response =
        await createFolder(
          body
        ).unwrap();

      toast.success(
        response.message ||
          "Media folder created successfully."
      );

      setCreateFolderOpen(false);

      await refetchFolders();

      if (response.data?.id) {
        setSelectedFolderId(
          response.data.id
        );

        setPage(1);
      }
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to create media folder."
        )
      );
    }
  };

  const handleUpload = async (
    formData: FormData
  ) => {
    try {
      const response =
        await uploadAsset(
          formData
        ).unwrap();

      if (
        response.meta?.duplicate
      ) {
        toast.message(
          "This file already exists. The existing asset was returned."
        );
      } else {
        toast.success(
          response.message ||
            "Media uploaded successfully."
        );
      }

      setUploadOpen(false);

      await Promise.all([
        refetchAssets(),
        refetchFolders(),
      ]);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to upload media."
        )
      );
    }
  };

  const handleSaveAsset = async (
    assetId: string,
    body: {
      title?: string | null;
      altText?: string | null;
      caption?: string | null;
      description?: string | null;
      classification?: MediaAssetClassification;
      isPublic?: boolean;
    }
  ) => {
    try {
      const response =
        await updateAsset({
          id: assetId,
          body,
        }).unwrap();

      toast.success(
        response.message ||
          "Media asset updated successfully."
      );

      await refetchAssets();
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to update media asset."
        )
      );
    }
  };

  const handleArchiveAsset = async (
    assetId: string
  ) => {
    try {
      const response =
        await archiveAsset(
          assetId
        ).unwrap();

      toast.success(
        response.message ||
          "Media asset archived successfully."
      );

      setSelectedAssetId(null);

      await Promise.all([
        refetchAssets(),
        refetchFolders(),
      ]);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to archive media asset."
        )
      );

      await refetchUsage();
    }
  };

  const handleRestoreAsset = async (
    assetId: string
  ) => {
    try {
      const response =
        await restoreAsset(
          assetId
        ).unwrap();

      toast.success(
        response.message ||
          "Media asset restored successfully."
      );

      setSelectedAssetId(null);

      await Promise.all([
        refetchAssets(),
        refetchFolders(),
      ]);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to restore media asset."
        )
      );
    }
  };

  const handleReprocessAsset = async (
    assetId: string
  ) => {
    try {
      const response =
        await reprocessAsset(
          assetId
        ).unwrap();

      toast.success(
        response.message ||
          "Media asset processed successfully."
      );

      await Promise.all([
        refetchAssets(),
        refetchUsage(),
      ]);
    } catch (error: unknown) {
      toast.error(
        getApiErrorMessage(
          error,
          "Unable to regenerate media variants."
        )
      );
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refetchAssets(),
      refetchFolders(),
    ]);

    toast.success(
      "Media library refreshed."
    );
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
      <div className="flex min-h-[calc(100vh-64px)]">
        <aside className="hidden w-[260px] shrink-0 border-r border-[#e1e3e5] bg-white lg:block">
          <div className="sticky top-0 max-h-screen overflow-y-auto p-4">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8c9196]">
                Digital assets
              </p>

              <h2 className="mt-1 text-base font-semibold">
                Folders
              </h2>
            </div>

            {isLoadingFolders ? (
              <div className="flex justify-center py-8">
                <LoaderCircle
                  size={19}
                  className="animate-spin"
                />
              </div>
            ) : (
              <MediaFolderTree
                folders={folders}
                selectedFolderId={
                  selectedFolderId
                }
                onSelectFolder={
                  handleFolderChange
                }
              />
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1500px] px-5 py-7 lg:px-8">
            <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm text-[#6d7175]">
                  Digital Asset Management
                </p>

                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {selectedFolderName}
                </h1>

                <p className="mt-1 text-sm text-[#6d7175]">
                  Manage reusable images,
                  documents and optimized media
                  variants.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={
                    isFetchingAssets
                  }
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:opacity-50"
                >
                  <RefreshCcw
                    size={16}
                    className={
                      isFetchingAssets
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Refresh
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCreateFolderOpen(true)
                  }
                  disabled={
                    isCreatingFolder
                  }
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium shadow-sm hover:bg-[#f6f6f7] disabled:opacity-50"
                >
                  <FolderPlus size={17} />
                  New folder
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setUploadOpen(true)
                  }
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
                >
                  <UploadCloud size={17} />
                  Upload media
                </button>
              </div>
            </div>

            <section className="admin-card mb-5 p-4">
              <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_165px_175px_165px_auto]">
                <div className="relative">
                  <Search
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c9196]"
                  />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                    className="admin-input pl-10"
                    placeholder="Search media assets"
                  />
                </div>

                <select
                  value={assetType}
                  onChange={(event) => {
                    setAssetType(
                      event.target
                        .value as
                        | MediaAssetType
                        | ""
                    );

                    setPage(1);
                  }}
                  className="admin-input"
                >
                  <option value="">
                    All file types
                  </option>

                  <option value="IMAGE">
                    Images
                  </option>

                  <option value="PDF">
                    PDF documents
                  </option>
                </select>

                <select
                  value={classification}
                  onChange={(event) => {
                    setClassification(
                      event.target
                        .value as
                        | MediaAssetClassification
                        | ""
                    );

                    setPage(1);
                  }}
                  className="admin-input"
                >
                  <option value="">
                    All classifications
                  </option>

                  <option value="PRODUCT">
                    Product
                  </option>

                  <option value="CMS">
                    CMS
                  </option>

                  <option value="MARKETING">
                    Marketing
                  </option>

                  <option value="BRAND">
                    Brand
                  </option>

                  <option value="CATEGORY">
                    Category
                  </option>

                  <option value="PROMOTION">
                    Promotion
                  </option>

                  <option value="DOWNLOAD">
                    Download
                  </option>

                  <option value="OTHER">
                    Other
                  </option>
                </select>

                <select
                  value={
                    assetStatusFilter
                  }
                  onChange={(event) => {
                    setAssetStatusFilter(
                      event.target
                        .value as
                        | "ACTIVE"
                        | "ARCHIVED"
                    );

                    setSelectedAssetId(
                      null
                    );

                    setPage(1);
                  }}
                  className="admin-input"
                >
                  <option value="ACTIVE">
                    Active assets
                  </option>

                  <option value="ARCHIVED">
                    Archived assets
                  </option>
                </select>

                <div className="flex items-center justify-end gap-1 rounded-lg border border-[#babfc3] bg-white p-1">
                  <button
                    type="button"
                    onClick={() =>
                      setLayout("GRID")
                    }
                    className={[
                      "flex h-8 w-9 items-center justify-center rounded-md",
                      layout === "GRID"
                        ? "bg-[#ebebeb]"
                        : "hover:bg-[#f6f6f7]",
                    ].join(" ")}
                    aria-label="Grid view"
                  >
                    <Grid2X2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setLayout("LIST")
                    }
                    className={[
                      "flex h-8 w-9 items-center justify-center rounded-md",
                      layout === "LIST"
                        ? "bg-[#ebebeb]"
                        : "hover:bg-[#f6f6f7]",
                    ].join(" ")}
                    aria-label="List view"
                  >
                    <List size={16} />
                  </button>
                </div>
              </div>
            </section>

            {isLoadingAssets && (
              <div className="admin-card flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                  <LoaderCircle className="mx-auto animate-spin" />

                  <p className="mt-3 text-sm text-[#6d7175]">
                    Loading media assets...
                  </p>
                </div>
              </div>
            )}

            {!isLoadingAssets &&
              assetsError && (
                <div className="admin-card p-10 text-center">
                  <p className="font-semibold text-red-700">
                    Unable to load media assets.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      refetchAssets()
                    }
                    className="mt-5 rounded-lg bg-[#303030] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Try again
                  </button>
                </div>
              )}

            {!isLoadingAssets &&
              !assetsError &&
              assets.length === 0 && (
                <div className="admin-card p-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f1f2f3]">
                    <Images size={26} />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold">
                    No media assets found
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6d7175]">
                    Upload the first asset or
                    adjust your folder, search
                    and filter selections.
                  </p>

                  {assetStatusFilter ===
                    "ACTIVE" && (
                    <button
                      type="button"
                      onClick={() =>
                        setUploadOpen(true)
                      }
                      className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
                    >
                      <Plus size={17} />
                      Upload media
                    </button>
                  )}
                </div>
              )}

            {!isLoadingAssets &&
              !assetsError &&
              assets.length > 0 && (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-[#6d7175]">
                      {
                        assetResponse
                          ?.pagination
                          .totalItems
                      }{" "}
                      asset
                      {assetResponse
                        ?.pagination
                        .totalItems === 1
                        ? ""
                        : "s"}
                    </p>

                    {isFetchingAssets && (
                      <div className="flex items-center gap-2 text-xs text-[#6d7175]">
                        <LoaderCircle
                          size={14}
                          className="animate-spin"
                        />
                        Updating
                      </div>
                    )}
                  </div>

                  {layout === "GRID" ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                      {assets.map(
                        (asset) => (
                          <MediaAssetCard
                            key={asset.id}
                            asset={asset}
                            selected={
                              selectedAssetId ===
                              asset.id
                            }
                            apiBaseUrl={
                              API_BASE_URL
                            }
                            onSelect={
                              handleAssetSelect
                            }
                          />
                        )
                      )}
                    </div>
                  ) : (
                    <div className="admin-card overflow-hidden">
                      <div className="divide-y divide-[#e1e3e5]">
                        {assets.map(
                          (asset) => (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() =>
                                handleAssetSelect(
                                  asset
                                )
                              }
                              className="grid w-full grid-cols-[minmax(0,1fr)_110px_130px_120px] items-center gap-4 px-5 py-4 text-left hover:bg-[#f6f6f7]"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                  {asset.title ||
                                    asset.originalFileName}
                                </p>

                                <p className="mt-1 truncate text-xs text-[#6d7175]">
                                  {
                                    asset.originalFileName
                                  }
                                </p>
                              </div>

                              <p className="text-xs font-medium">
                                {
                                  asset.assetType
                                }
                              </p>

                              <p className="text-xs text-[#6d7175]">
                                {
                                  asset.classification
                                }
                              </p>

                              <p className="text-xs text-[#6d7175]">
                                {asset.width &&
                                asset.height
                                  ? `${asset.width} × ${asset.height}`
                                  : asset.extension.toUpperCase()}
                              </p>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-sm text-[#6d7175]">
                      Page{" "}
                      {
                        assetResponse
                          ?.pagination.page
                      }{" "}
                      of{" "}
                      {Math.max(
                        assetResponse
                          ?.pagination
                          .totalPages || 1,
                        1
                      )}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={
                          page <= 1 ||
                          isFetchingAssets
                        }
                        onClick={() =>
                          setPage(
                            (current) =>
                              Math.max(
                                current - 1,
                                1
                              )
                          )
                        }
                        className="flex h-9 items-center gap-1 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium disabled:opacity-50"
                      >
                        <ChevronLeft
                          size={16}
                        />
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={
                          page >=
                            (assetResponse
                              ?.pagination
                              .totalPages ||
                              1) ||
                          isFetchingAssets
                        }
                        onClick={() =>
                          setPage(
                            (current) =>
                              current + 1
                          )
                        }
                        className="flex h-9 items-center gap-1 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium disabled:opacity-50"
                      >
                        Next
                        <ChevronRight
                          size={16}
                        />
                      </button>
                    </div>
                  </div>
                </>
              )}
          </div>
        </main>
      </div>

      {createFolderOpen && (
        <CreateMediaFolderDialog
          key={
            selectedFolderId ||
            "root-folder"
          }
          isOpen
          folders={folders}
          selectedFolderId={
            selectedFolderId
          }
          isCreating={
            isCreatingFolder
          }
          onClose={() =>
            setCreateFolderOpen(false)
          }
          onCreate={
            handleCreateFolder
          }
        />
      )}

      {uploadOpen && (
        <MediaUploadDialog
          key={
            selectedFolderId ||
            "all-assets"
          }
          isOpen
          selectedFolderId={
            selectedFolderId
          }
          folders={folders}
          isUploading={isUploading}
          onClose={() =>
            setUploadOpen(false)
          }
          onUpload={handleUpload}
        />
      )}

      {selectedAssetId && (
        <MediaAssetDrawer
          asset={selectedAsset}
          usageRecords={usageRecords}
          apiBaseUrl={API_BASE_URL}
          isLoading={
            isLoadingSelectedAsset
          }
          isLoadingUsage={
            isLoadingUsage
          }
          isSaving={isSavingAsset}
          isArchiving={isArchiving}
          isRestoring={isRestoring}
          isReprocessing={
            isReprocessing
          }
          onClose={() =>
            setSelectedAssetId(null)
          }
          onSave={handleSaveAsset}
          onArchive={
            handleArchiveAsset
          }
          onRestore={
            handleRestoreAsset
          }
          onReprocess={
            handleReprocessAsset
          }
        />
      )}
    </AdminShell>
  );
}