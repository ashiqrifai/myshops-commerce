"use client";

import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Images,
} from "lucide-react";

import { useState } from "react";

import type {
  MediaFolderTreeNode,
} from "@/types/media";

interface MediaFolderTreeProps {
  folders: MediaFolderTreeNode[];
  selectedFolderId: string | null;
  onSelectFolder: (
    folderId: string | null
  ) => void;
}

interface FolderNodeProps {
  folder: MediaFolderTreeNode;
  level: number;
  selectedFolderId: string | null;
  onSelectFolder: (
    folderId: string
  ) => void;
}

function FolderNode({
  folder,
  level,
  selectedFolderId,
  onSelectFolder,
}: FolderNodeProps) {
  const [expanded, setExpanded] =
    useState(level < 1);

  const hasChildren =
    Array.isArray(folder.children) &&
    folder.children.length > 0;

  const selected =
    selectedFolderId === folder.id;

  return (
    <div>
      <div
        className={[
          "group flex items-center rounded-lg transition",
          selected
            ? "bg-[#ebebeb]"
            : "hover:bg-[#f6f6f7]",
        ].join(" ")}
        style={{
          paddingLeft: `${level * 14}px`,
        }}
      >
        <button
          type="button"
          onClick={() =>
            setExpanded(
              (current) => !current
            )
          }
          disabled={!hasChildren}
          className="flex h-9 w-7 shrink-0 items-center justify-center text-[#6d7175] disabled:opacity-30"
          aria-label={
            expanded
              ? "Collapse folder"
              : "Expand folder"
          }
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown size={15} />
            ) : (
              <ChevronRight size={15} />
            )
          ) : (
            <span className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            onSelectFolder(folder.id)
          }
          className="flex min-w-0 flex-1 items-center gap-2 py-2 pr-2 text-left"
        >
          {selected || expanded ? (
            <FolderOpen
              size={17}
              className="shrink-0 text-[#6d7175]"
            />
          ) : (
            <Folder
              size={17}
              className="shrink-0 text-[#6d7175]"
            />
          )}

          <span className="min-w-0 flex-1 truncate text-sm">
            {folder.name}
          </span>

          {folder.assetCount !== undefined && (
            <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] text-[#6d7175]">
              {Number(folder.assetCount)}
            </span>
          )}
        </button>
      </div>

      {expanded && hasChildren && (
        <div>
          {folder.children.map(
            (childFolder) => (
              <FolderNode
                key={childFolder.id}
                folder={childFolder}
                level={level + 1}
                selectedFolderId={
                  selectedFolderId
                }
                onSelectFolder={
                  onSelectFolder
                }
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

export default function MediaFolderTree({
  folders,
  selectedFolderId,
  onSelectFolder,
}: MediaFolderTreeProps) {
  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() =>
          onSelectFolder(null)
        }
        className={[
          "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition",
          selectedFolderId === null
            ? "bg-[#ebebeb]"
            : "hover:bg-[#f6f6f7]",
        ].join(" ")}
      >
        <Images
          size={17}
          className="text-[#6d7175]"
        />

        <span className="text-sm font-medium">
          All assets
        </span>
      </button>

      <div className="pt-1">
        {folders.map((folder) => (
          <FolderNode
            key={folder.id}
            folder={folder}
            level={0}
            selectedFolderId={
              selectedFolderId
            }
            onSelectFolder={
              onSelectFolder
            }
          />
        ))}
      </div>
    </div>
  );
}