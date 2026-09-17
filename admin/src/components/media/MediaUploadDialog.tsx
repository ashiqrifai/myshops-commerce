"use client";

import {
  FileImage,
  FileText,
  LoaderCircle,
  Trash2,
  UploadCloud,
  Video,
  X,
} from "lucide-react";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
} from "react";

import type {
  MediaAssetClassification,
  MediaFolderTreeNode,
} from "@/types/media";

interface MediaUploadDialogProps {
  isOpen: boolean;

  selectedFolderId:
    | string
    | null;

  folders:
    MediaFolderTreeNode[];

  isUploading:
    boolean;

  onClose: () => void;

  onUpload: (
    formData: FormData
  ) => Promise<void>;
}

interface FlatFolder {
  id: string;
  name: string;
  label: string;
}

const MAXIMUM_FILES = 200;

const classifications: Array<{
  value:
    MediaAssetClassification;

  label:
    string;
}> = [
  {
    value: "PRODUCT",
    label: "Product",
  },
  {
    value: "CATEGORY",
    label: "Category",
  },
  {
    value: "BRAND",
    label: "Brand",
  },
  {
    value: "CMS",
    label: "CMS",
  },
  {
    value: "MARKETING",
    label: "Marketing",
  },
  {
    value: "PROMOTION",
    label: "Promotion",
  },
  {
    value: "AI",
    label: "AI",
  },
  {
    value: "DOWNLOAD",
    label: "Download",
  },
  {
    value: "LEGAL",
    label: "Legal",
  },
  {
    value: "BLOG",
    label: "Blog",
  },
  {
    value: "STORE",
    label: "Store",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const flattenFolders = (
  folders:
    MediaFolderTreeNode[],

  level = 0
): FlatFolder[] => {
  return folders.flatMap(
    (folder) => [
      {
        id:
          folder.id,

        name:
          folder.name,

        label:
          `${"— ".repeat(
            level
          )}${folder.name}`,
      },

      ...flattenFolders(
        folder.children ||
          [],

        level + 1
      ),
    ]
  );
};

const getGeneratedTitle = (
  fileName: string
) => {
  return fileName
    .replace(
      /\.[^/.]+$/,
      ""
    )
    .replace(
      /[-_]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      (value) =>
        value.toUpperCase()
    );
};

const formatFileSize = (
  bytes: number
) => {
  if (
    bytes <
    1024
  ) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
};

const getFileType = (
  file: File
) => {
  if (
    file.type.startsWith(
      "image/"
    )
  ) {
    return "IMAGE";
  }

  if (
    file.type.startsWith(
      "video/"
    )
  ) {
    return "VIDEO";
  }

  return "DOCUMENT";
};

const FileTypeIcon = ({
  file,
}: {
  file: File;
}) => {
  const fileType =
    getFileType(file);

  if (
    fileType ===
    "VIDEO"
  ) {
    return (
      <Video
        size={18}
        className="text-[#5c5f62]"
      />
    );
  }

  if (
    fileType ===
    "DOCUMENT"
  ) {
    return (
      <FileText
        size={18}
        className="text-[#5c5f62]"
      />
    );
  }

  return (
    <FileImage
      size={18}
      className="text-[#5c5f62]"
    />
  );
};

export default function MediaUploadDialog({
  isOpen,
  selectedFolderId,
  folders,
  isUploading,
  onClose,
  onUpload,
}: MediaUploadDialogProps) {
  const [
    files,
    setFiles,
  ] =
    useState<File[]>([]);

  const [
    folderId,
    setFolderId,
  ] =
    useState(
      selectedFolderId ||
        ""
    );

  const [
    classification,
    setClassification,
  ] =
    useState<MediaAssetClassification>(
      "OTHER"
    );

  const [
    title,
    setTitle,
  ] =
    useState("");

  const [
    altText,
    setAltText,
  ] =
    useState("");

  const [
    caption,
    setCaption,
  ] =
    useState("");

  const [
    description,
    setDescription,
  ] =
    useState("");

  const [
    isPublic,
    setIsPublic,
  ] =
    useState(true);

  const [
    fileSelectionError,
    setFileSelectionError,
  ] =
    useState<
      string | null
    >(null);

  const flatFolders =
    useMemo(
      () =>
        flattenFolders(
          folders
        ),

      [folders]
    );

  const totalFileSize =
    useMemo(
      () =>
        files.reduce(
          (
            total,
            file
          ) =>
            total +
            file.size,

          0
        ),

      [files]
    );

  const resetForm =
    () => {
      setFiles([]);

      setFolderId(
        selectedFolderId ||
          ""
      );

      setClassification(
        "OTHER"
      );

      setTitle("");
      setAltText("");
      setCaption("");
      setDescription("");
      setIsPublic(true);

      setFileSelectionError(
        null
      );
    };

  const handleClose =
    () => {
      if (
        isUploading
      ) {
        return;
      }

      resetForm();

      onClose();
    };

  const handleFileChange = (
    event:
      ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files ||
          []
      );

    event.target.value =
      "";

    if (
      !selectedFiles.length
    ) {
      return;
    }

    if (
      selectedFiles.length >
      MAXIMUM_FILES
    ) {
      setFileSelectionError(
        `You can upload a maximum of ${MAXIMUM_FILES} files at a time.`
      );
    } else {
      setFileSelectionError(
        null
      );
    }

    const limitedFiles =
      selectedFiles.slice(
        0,
        MAXIMUM_FILES
      );

    setFiles(
      limitedFiles
    );

    if (
      limitedFiles.length ===
        1 &&
      !title.trim()
    ) {
      setTitle(
        getGeneratedTitle(
          limitedFiles[0]
            .name
        )
      );
    }

    if (
      limitedFiles.length >
      1
    ) {
      setTitle("");
      setAltText("");
    }
  };

  const removeFile = (
    indexToRemove:
      number
  ) => {
    if (
      isUploading
    ) {
      return;
    }

    setFiles(
      (
        currentFiles
      ) =>
        currentFiles.filter(
          (
            _file,
            index
          ) =>
            index !==
            indexToRemove
        )
    );
  };

  const clearFiles =
    () => {
      if (
        isUploading
      ) {
        return;
      }

      setFiles([]);
      setTitle("");
      setAltText("");

      setFileSelectionError(
        null
      );
    };

  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (
        !files.length ||
        isUploading
      ) {
        return;
      }

      const formData =
        new FormData();

      files.forEach(
        (file) => {
          formData.append(
            "files",
            file
          );
        }
      );

      if (
        folderId
      ) {
        formData.append(
          "folderId",
          folderId
        );
      }

      formData.append(
        "classification",
        classification
      );

      /*
       * Manually entered title and alt
       * text only apply to single-file
       * uploads.
       *
       * For multiple files, the backend
       * creates each title from its
       * original filename.
       */
      if (
        files.length ===
        1
      ) {
        formData.append(
          "title",
          title.trim()
        );

        formData.append(
          "altText",
          altText.trim()
        );
      }

      formData.append(
        "caption",
        caption.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "isPublic",
        String(
          isPublic
        )
      );

      await onUpload(
        formData
      );

      resetForm();
    };

  if (
    !isOpen
  ) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 px-4 py-6">
      <form
        onSubmit={
          handleSubmit
        }
        className="flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#202223]">
              Upload media
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Upload up to{" "}
              {
                MAXIMUM_FILES
              }{" "}
              images, videos or PDF
              files to the shared
              digital asset library.
            </p>
          </div>

          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isUploading
            }
            aria-label="Close upload dialog"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#202223] hover:bg-[#f1f2f3] disabled:opacity-50"
          >
            <X
              size={19}
            />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#babfc3] bg-[#fafafa] px-6 text-center transition hover:border-[#458fff] hover:bg-[#f6f6f7]">
            <input
              type="file"
              multiple
              disabled={
                isUploading
              }
              accept={[
                "image/jpeg",
                "image/png",
                "image/webp",
                "image/avif",
                "image/gif",
                "video/mp4",
                "video/webm",
                "video/quicktime",
                "application/pdf",
              ].join(",")}
              onChange={
                handleFileChange
              }
              className="hidden"
            />

            <UploadCloud
              size={40}
              className="text-[#8c9196]"
            />

            <p className="mt-4 text-sm font-semibold text-[#202223]">
              {files.length
                ? "Choose different files"
                : "Choose files"}
            </p>

            <p className="mt-1 text-xs text-[#6d7175]">
              JPEG, PNG, WebP,
              AVIF, GIF, MP4,
              WebM, MOV or PDF
            </p>

            <p className="mt-2 text-xs font-medium text-[#2c6ecb]">
              Select up to{" "}
              {
                MAXIMUM_FILES
              }{" "}
              files
            </p>
          </label>

          {fileSelectionError ? (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
              {
                fileSelectionError
              }
            </div>
          ) : null}

          {files.length ? (
            <div className="mt-5 rounded-xl border border-[#e1e3e5] bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e3e5] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#202223]">
                    {
                      files.length
                    }{" "}
                    {files.length ===
                    1
                      ? "file selected"
                      : "files selected"}
                  </p>

                  <p className="mt-0.5 text-xs text-[#6d7175]">
                    Total size:{" "}
                    {formatFileSize(
                      totalFileSize
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    clearFiles
                  }
                  disabled={
                    isUploading
                  }
                  className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>

              <div className="max-h-64 divide-y divide-[#e1e3e5] overflow-y-auto">
                {files.map(
                  (
                    file,
                    index
                  ) => (
                    <div
                      key={`${file.name}-${file.lastModified}-${index}`}
                      className="flex items-center gap-3 px-4 py-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f1f2f3]">
                        <FileTypeIcon
                          file={
                            file
                          }
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-[#202223]">
                          {
                            file.name
                          }
                        </p>

                        <p className="mt-0.5 text-xs text-[#6d7175]">
                          {formatFileSize(
                            file.size
                          )}
                          {" • "}
                          {getFileType(
                            file
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removeFile(
                            index
                          )
                        }
                        disabled={
                          isUploading
                        }
                        aria-label={`Remove ${file.name}`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2
                          size={
                            16
                          }
                        />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#202223]">
                Folder
              </label>

              <select
                value={
                  folderId
                }
                onChange={(
                  event
                ) =>
                  setFolderId(
                    event.target
                      .value
                  )
                }
                disabled={
                  isUploading
                }
                className="admin-input"
              >
                <option value="">
                  No folder
                </option>

                {flatFolders.map(
                  (
                    folder
                  ) => (
                    <option
                      key={
                        folder.id
                      }
                      value={
                        folder.id
                      }
                    >
                      {
                        folder.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#202223]">
                Classification
              </label>

              <select
                value={
                  classification
                }
                onChange={(
                  event
                ) =>
                  setClassification(
                    event.target
                      .value as MediaAssetClassification
                  )
                }
                disabled={
                  isUploading
                }
                className="admin-input"
              >
                {classifications.map(
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
            </div>

            {files.length <=
            1 ? (
              <>
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#202223]">
                    Title
                  </label>

                  <input
                    value={
                      title
                    }
                    onChange={(
                      event
                    ) =>
                      setTitle(
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      isUploading
                    }
                    className="admin-input"
                    placeholder="Homepage Hero"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[#202223]">
                    Alternative text
                  </label>

                  <input
                    value={
                      altText
                    }
                    onChange={(
                      event
                    ) =>
                      setAltText(
                        event
                          .target
                          .value
                      )
                    }
                    disabled={
                      isUploading
                    }
                    className="admin-input"
                    placeholder="Describe the image for accessibility and SEO"
                  />
                </div>
              </>
            ) : (
              <div className="md:col-span-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                <p className="text-sm font-semibold text-blue-900">
                  Multiple-file upload
                </p>

                <p className="mt-1 text-xs leading-5 text-blue-800">
                  Each media title will
                  be generated from its
                  filename. You can edit
                  individual titles and
                  alternative text after
                  the upload completes.
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#202223]">
                Caption
              </label>

              <input
                value={
                  caption
                }
                onChange={(
                  event
                ) =>
                  setCaption(
                    event.target
                      .value
                  )
                }
                disabled={
                  isUploading
                }
                className="admin-input"
                placeholder={
                  files.length >
                  1
                    ? "Optional shared caption"
                    : "Optional caption"
                }
              />

              {files.length >
              1 ? (
                <p className="mt-1 text-xs text-[#6d7175]">
                  This caption will be
                  applied to every
                  selected file.
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-[#202223]">
                Description
              </label>

              <textarea
                value={
                  description
                }
                onChange={(
                  event
                ) =>
                  setDescription(
                    event.target
                      .value
                  )
                }
                disabled={
                  isUploading
                }
                className="admin-input min-h-[90px] resize-y"
                placeholder={
                  files.length >
                  1
                    ? "Optional shared description"
                    : "Optional media description"
                }
              />

              {files.length >
              1 ? (
                <p className="mt-1 text-xs text-[#6d7175]">
                  This description will
                  be applied to every
                  selected file.
                </p>
              ) : null}
            </div>

            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() =>
                  setIsPublic(
                    (
                      current
                    ) =>
                      !current
                  )
                }
                disabled={
                  isUploading
                }
                className="flex w-full items-center justify-between rounded-xl border border-[#e1e3e5] p-4 text-left disabled:opacity-50"
              >
                <div>
                  <p className="text-sm font-medium text-[#202223]">
                    Public asset
                  </p>

                  <p className="mt-1 text-xs text-[#6d7175]">
                    Public assets may
                    be loaded by the
                    website and Android
                    kiosk.
                  </p>
                </div>

                <div
                  className={[
                    "relative h-6 w-11 shrink-0 rounded-full transition",

                    isPublic
                      ? "bg-[#303030]"
                      : "bg-[#c9cccf]",
                  ].join(
                    " "
                  )}
                >
                  <span
                    className={[
                      "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",

                      isPublic
                        ? "left-[22px]"
                        : "left-0.5",
                    ].join(
                      " "
                    )}
                  />
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#e1e3e5] bg-[#fafafa] px-6 py-4 sm:flex-row">
          <button
            type="button"
            onClick={
              handleClose
            }
            disabled={
              isUploading
            }
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium text-[#202223] hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              !files.length ||
              isUploading
            }
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <UploadCloud
                size={16}
              />
            )}

            {isUploading
              ? `Uploading ${files.length} ${
                  files.length ===
                  1
                    ? "file"
                    : "files"
                }...`
              : files.length >
                  1
                ? `Upload ${files.length} files`
                : "Upload asset"}
          </button>
        </div>
      </form>
    </div>
  );
}