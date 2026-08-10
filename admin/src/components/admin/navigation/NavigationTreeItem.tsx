"use client";

import {
  CSS,
} from "@dnd-kit/utilities";

import {
  useSortable,
} from "@dnd-kit/sortable";

import {
  ChevronDown,
  ChevronRight,
  EyeOff,
  GripVertical,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useState,
} from "react";

import NavigationDropZone from "./NavigationDropZone";

import type {
  NavigationItem,
} from "@/types/navigation";

interface NavigationTreeItemProps {
  item: NavigationItem;

  level: number;

  isDraggingAnyItem: boolean;

  activeItemId:
    string | null;

  selectedItemId:
    string | null;

  onSelect: (
    item: NavigationItem
  ) => void;

  onAddChild: (
    item: NavigationItem
  ) => void;

  onEdit: (
    item: NavigationItem
  ) => void;

  onDelete: (
    item: NavigationItem
  ) => void;
}

export default function NavigationTreeItem({
  item,
  level,
  isDraggingAnyItem,
  activeItemId,
  selectedItemId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
}: NavigationTreeItemProps) {
  const [
    expanded,
    setExpanded,
  ] = useState(true);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,

    data: {
      type:
        "NAVIGATION_ITEM",

      itemId:
        item.id,

      parentId:
        item.parentId,

      level,
    },
  });

  const children =
    item.children || [];

  const hasChildren =
    children.length > 0;

  const isActiveDragItem =
    activeItemId ===
    item.id;

  const isSelected =
    selectedItemId ===
    item.id;

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),

    transition,

    opacity:
      isDragging
        ? 0.35
        : 1,
  };

  return (
    <div>
      <NavigationDropZone
        id={`before:${item.id}`}
        mode="BEFORE"
        level={level}
        visible={
          isDraggingAnyItem &&
          !isActiveDragItem
        }
      />

      <div
        ref={setNodeRef}
        style={style}
        className={[
          "relative",
          isDragging
            ? "z-20"
            : "",
        ].join(" ")}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() =>
            onSelect(
              item
            )
          }
          onKeyDown={(
            event
          ) => {
            if (
              event.key ===
                "Enter" ||
              event.key ===
                " "
            ) {
              event.preventDefault();

              onSelect(
                item
              );
            }
          }}
          className={[
            "group flex min-h-[62px] cursor-pointer items-center gap-1.5 border-b border-[#e1e3e5] py-2.5 pr-2 transition",
            isSelected
              ? "bg-[#eef4ff]"
              : "bg-white hover:bg-[#fafafa]",
            isDragging
              ? "shadow-xl"
              : "",
          ].join(" ")}
          style={{
            paddingLeft:
              6 +
              level * 18,
          }}
        >
          <button
            type="button"
            {...attributes}
            {...listeners}
            onClick={(
              event
            ) =>
              event.stopPropagation()
            }
            className="flex h-9 w-7 shrink-0 touch-none cursor-grab items-center justify-center rounded-lg text-[#8c9196] hover:bg-[#f1f2f3] active:cursor-grabbing"
            title="Drag navigation item"
          >
            <GripVertical
              size={16}
            />
          </button>

          <button
            type="button"
            disabled={
              !hasChildren
            }
            onClick={(
              event
            ) => {
              event.stopPropagation();

              setExpanded(
                (current) =>
                  !current
              );
            }}
            className="flex h-8 w-7 shrink-0 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-20"
            title={
              expanded
                ? "Collapse"
                : "Expand"
            }
          >
            {expanded ? (
              <ChevronDown
                size={14}
              />
            ) : (
              <ChevronRight
                size={14}
              />
            )}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <p className="truncate text-xs font-semibold text-[#202223]">
                {item.label}
              </p>

              {item.mediaAssetId && (
                <ImageIcon
                  size={12}
                  className="shrink-0 text-[#6d7175]"
                />
              )}

              {!item.isActive && (
                <EyeOff
                  size={12}
                  className="shrink-0 text-[#a23b2a]"
                />
              )}
            </div>

            <div className="mt-1 flex min-w-0 items-center gap-1.5">
              <span className="truncate rounded-full bg-[#f1f2f3] px-1.5 py-0.5 text-[9px] font-medium text-[#5c5f62]">
                {formatItemType(
                  item.itemType
                )}
              </span>

              <span className="shrink-0 rounded-full bg-[#eef4ff] px-1.5 py-0.5 text-[9px] font-medium text-[#005bd3]">
                C
                {item.columnNumber ||
                  1}
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 opacity-100 xl:opacity-0 xl:transition xl:group-hover:opacity-100">
            <button
              type="button"
              onClick={(
                event
              ) => {
                event.stopPropagation();

                onAddChild(
                  item
                );
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white"
              title="Add child item"
            >
              <Plus
                size={13}
              />
            </button>

            <button
              type="button"
              onClick={(
                event
              ) => {
                event.stopPropagation();

                onEdit(
                  item
                );
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-white"
              title="Edit item"
            >
              <Pencil
                size={12}
              />
            </button>

            <button
              type="button"
              onClick={(
                event
              ) => {
                event.stopPropagation();

                onDelete(
                  item
                );
              }}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-red-700 hover:bg-red-50"
              title="Delete item"
            >
              <Trash2
                size={12}
              />
            </button>
          </div>
        </div>

        <NavigationDropZone
          id={`inside:${item.id}`}
          mode="INSIDE"
          level={level}
          label={`Drop inside ${item.label}`}
          visible={
            isDraggingAnyItem &&
            !isActiveDragItem
          }
        />

        {expanded &&
          hasChildren && (
            <div>
              {children.map(
                (child) => (
                  <NavigationTreeItem
                    key={
                      child.id
                    }
                    item={
                      child
                    }
                    level={
                      level + 1
                    }
                    isDraggingAnyItem={
                      isDraggingAnyItem
                    }
                    activeItemId={
                      activeItemId
                    }
                    selectedItemId={
                      selectedItemId
                    }
                    onSelect={
                      onSelect
                    }
                    onAddChild={
                      onAddChild
                    }
                    onEdit={
                      onEdit
                    }
                    onDelete={
                      onDelete
                    }
                  />
                )
              )}
            </div>
          )}
      </div>

      <NavigationDropZone
        id={`after:${item.id}`}
        mode="AFTER"
        level={level}
        visible={
          isDraggingAnyItem &&
          !isActiveDragItem
        }
      />
    </div>
  );
}

function formatItemType(
  value: string
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase()
    );
}