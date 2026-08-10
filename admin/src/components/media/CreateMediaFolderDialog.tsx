"use client";

import {
  FolderPlus,
  LoaderCircle,
  X,
} from "lucide-react";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import type {
  CreateMediaFolderBody,
  MediaFolderTreeNode,
} from "@/types/media";

interface CreateMediaFolderDialogProps {
  isOpen: boolean;
  folders: MediaFolderTreeNode[];
  selectedFolderId: string | null;
  isCreating: boolean;
  onClose: () => void;
  onCreate: (
    body: CreateMediaFolderBody
  ) => Promise<void>;
}

interface FlatFolder {
  id: string;
  label: string;
  isSystemFolder: boolean;
}

const flattenFolders = (
  folders: MediaFolderTreeNode[],
  level = 0
): FlatFolder[] => {
  return folders.flatMap((folder) => [
    {
      id: folder.id,
      label: `${"— ".repeat(level)}${folder.name}`,
      isSystemFolder: folder.isSystemFolder,
    },

    ...flattenFolders(
      folder.children || [],
      level + 1
    ),
  ]);
};

const generateFolderCode = (
  name: string
): string => {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export default function CreateMediaFolderDialog({
  isOpen,
  folders,
  selectedFolderId,
  isCreating,
  onClose,
  onCreate,
}: CreateMediaFolderDialogProps) {
  const [name, setName] =
    useState("");

  const [code, setCode] =
    useState("");

  const [
    codeManuallyChanged,
    setCodeManuallyChanged,
  ] = useState(false);

  const [
    parentFolderId,
    setParentFolderId,
  ] = useState(
    selectedFolderId || ""
  );

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    displayOrder,
    setDisplayOrder,
  ] = useState("0");

  const flatFolders = useMemo(
    () => flattenFolders(folders),
    [folders]
  );

  const resetForm = () => {
    setName("");
    setCode("");
    setCodeManuallyChanged(false);
    setParentFolderId(
      selectedFolderId || ""
    );
    setDescription("");
    setDisplayOrder("0");
  };

  const handleClose = () => {
    if (isCreating) {
      return;
    }

    resetForm();
    onClose();
  };

  const handleNameChange = (
    value: string
  ) => {
    setName(value);

    if (!codeManuallyChanged) {
      setCode(
        generateFolderCode(value)
      );
    }
  };

  const handleCodeChange = (
    value: string
  ) => {
    setCodeManuallyChanged(true);

    setCode(
      value
        .toUpperCase()
        .replace(
          /[^A-Z0-9_-]/g,
          ""
        )
    );
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await onCreate({
      name: name.trim(),

      code:
        code.trim() ||
        generateFolderCode(name),

      parentFolderId:
        parentFolderId || null,

      description:
        description.trim() ||
        null,

      displayOrder:
        Number(displayOrder) || 0,

      isActive: true,
    });

    resetForm();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[125] flex items-center justify-center bg-black/45 px-4 py-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#dfe3e8] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#e1e3e5] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">
              Create folder
            </h2>

            <p className="mt-1 text-sm text-[#6d7175]">
              Organize media assets using
              nested folders.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
            aria-label="Close create folder dialog"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label
              htmlFor="media-folder-name"
              className="mb-1.5 block text-sm font-medium"
            >
              Folder name
            </label>

            <input
              id="media-folder-name"
              value={name}
              onChange={(event) =>
                handleNameChange(
                  event.target.value
                )
              }
              className="admin-input"
              placeholder="Apple Product Images"
              autoFocus
              required
              maxLength={150}
            />
          </div>

          <div>
            <label
              htmlFor="media-folder-code"
              className="mb-1.5 block text-sm font-medium"
            >
              Folder code
            </label>

            <input
              id="media-folder-code"
              value={code}
              onChange={(event) =>
                handleCodeChange(
                  event.target.value
                )
              }
              className="admin-input font-mono uppercase"
              placeholder="APPLE_PRODUCT_IMAGES"
              maxLength={120}
              required
            />

            <p className="mt-1 text-xs text-[#6d7175]">
              A unique internal code for
              this company.
            </p>
          </div>

          <div>
            <label
              htmlFor="media-parent-folder"
              className="mb-1.5 block text-sm font-medium"
            >
              Parent folder
            </label>

            <select
              id="media-parent-folder"
              value={parentFolderId}
              onChange={(event) =>
                setParentFolderId(
                  event.target.value
                )
              }
              className="admin-input"
            >
              <option value="">
                Root level
              </option>

              {flatFolders.map(
                (folder) => (
                  <option
                    key={folder.id}
                    value={folder.id}
                  >
                    {folder.label}
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-[#6d7175]">
              The new folder will be placed
              inside the selected parent.
            </p>
          </div>

          <div>
            <label
              htmlFor="media-folder-description"
              className="mb-1.5 block text-sm font-medium"
            >
              Description
            </label>

            <textarea
              id="media-folder-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              className="admin-input min-h-[90px] resize-y"
              placeholder="Describe what media should be stored in this folder."
            />
          </div>

          <div>
            <label
              htmlFor="media-folder-order"
              className="mb-1.5 block text-sm font-medium"
            >
              Display order
            </label>

            <input
              id="media-folder-order"
              type="number"
              value={displayOrder}
              onChange={(event) =>
                setDisplayOrder(
                  event.target.value
                )
              }
              className="admin-input"
              min={0}
              max={100000}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-[#e1e3e5] bg-[#fafafa] px-6 py-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isCreating}
            className="h-10 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium hover:bg-[#f6f6f7] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              !name.trim() ||
              !code.trim() ||
              isCreating
            }
            className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? (
              <LoaderCircle
                size={16}
                className="animate-spin"
              />
            ) : (
              <FolderPlus size={16} />
            )}

            {isCreating
              ? "Creating..."
              : "Create folder"}
          </button>
        </div>
      </form>
    </div>
  );
}