"use client";

import {
  closestCorners,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import NavigationPromotionCard from "./NavigationPromotionCard";

import {
    getNavigationAssetImageUrl,
  } from "./navigationMedia";

import {
  CSS,
} from "@dnd-kit/utilities";

import {
  ChevronDown,
  ChevronRight,
  EyeOff,
  FolderTree,
  GripVertical,
  ImageIcon,
  LayoutGrid,
  Link2,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";

import {
  useMemo,
  useState,
  useEffect,
} from "react";

import type {
  NavigationItem,
} from "@/types/navigation";

export interface NavigationDesignerLayoutItem {
  id: string;
  columnNumber: number;
}

interface NavigationDesignerPanelProps {
  selectedItem:
    NavigationItem | null;

  selectedItemId:
    string | null;

  maxColumns: number;

  isSavingLayout?: boolean;

  onAddChild: (
    item: NavigationItem,
    columnNumber?: number
  ) => void;

  onEdit: (
    item: NavigationItem
  ) => void;

  onSelectItem: (
    item: NavigationItem
  ) => void;

  onLayoutChange: (
    parentItemId: string,
    layout:
      NavigationDesignerLayoutItem[]
  ) => Promise<void>;
}

export default function NavigationDesignerPanel({
  selectedItem,
  selectedItemId,
  maxColumns,
  isSavingLayout = false,
  onAddChild,
  onEdit,
  onSelectItem,
  onLayoutChange,
}: NavigationDesignerPanelProps) {
  const [
    activeDesignerItem,
    setActiveDesignerItem,
  ] =
    useState<NavigationItem | null>(
      null
    );

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint: {
            distance: 6,
          },
        }
      )
    );

  const safeMaxColumns =
    Math.max(
      Number(
        maxColumns || 1
      ),
      1
    );

  const children =
    selectedItem?.children ||
    [];

  const regularItems =
    useMemo(
      () =>
        children.filter(
          (item) =>
            item.itemType !==
            "PROMOTION"
        ),
      [
        children,
      ]
    );

  const promotionItems =
    useMemo(
      () =>
        children.filter(
          (item) =>
            item.itemType ===
            "PROMOTION"
        ),
      [
        children,
      ]
    );

    const highestUsedColumn =
    useMemo(
      () => {
        if (
          regularItems.length ===
          0
        ) {
          return 1;
        }
  
        return Math.min(
          Math.max(
            ...regularItems.map(
              (
                item
              ) =>
                Number(
                  item.columnNumber ||
                    1
                )
            ),
            1
          ),
          safeMaxColumns
        );
      },
      [
        regularItems,
        safeMaxColumns,
      ]
    );
  
  const [
    visibleColumnCount,
    setVisibleColumnCount,
  ] = useState(
    highestUsedColumn
  );
  
  useEffect(() => {
    setVisibleColumnCount(
      highestUsedColumn
    );
  }, [
    selectedItem?.id,
    highestUsedColumn,
  ]);
  
  const columns =
    useMemo(
      () =>
        Array.from(
          {
            length:
              Math.min(
                Math.max(
                  visibleColumnCount,
                  1
                ),
                safeMaxColumns
              ),
          },
          (
            _value,
            index
          ) =>
            index + 1
        ),
      [
        visibleColumnCount,
        safeMaxColumns,
      ]
    );
  
  const canAddColumn =
    visibleColumnCount <
    safeMaxColumns;
  
  const handleAddColumn =
    () => {
      setVisibleColumnCount(
        (
          current
        ) =>
          Math.min(
            current + 1,
            safeMaxColumns
          )
      );
    };

    const isContainer =
    Boolean(
      selectedItem &&
        (
          [
            "MEGA_MENU",
            "DROPDOWN",
            "HEADING",
          ].includes(
            selectedItem.itemType
          ) ||
          (
            selectedItem.children?.length ||
            0
          ) > 0
        )
    );

      const handleDragStart = (
        event: DragStartEvent
      ) => {
        const itemId =
          parseDesignerItemId(
            String(
              event.active.id
            )
          );
      
        if (!itemId) {
          return;
        }
      
        const draggedItem =
          regularItems.find(
            (item) =>
              item.id ===
              itemId
          ) ||
          null;
      
        /*
         * Do not select the dragged child here.
         *
         * Selecting it changes the designer from the parent mega-menu
         * to the child item and unmounts the column drag-and-drop area.
         */
        setActiveDesignerItem(
          draggedItem
        );
      };

  const handleDragCancel =
    () => {
      setActiveDesignerItem(
        null
      );
    };

  const handleDragEnd =
    async (
      event: DragEndEvent
    ) => {
      const draggedItem =
        activeDesignerItem;

      setActiveDesignerItem(
        null
      );

      if (
        !draggedItem ||
        !selectedItem ||
        !event.over
      ) {
        return;
      }

      const overId =
        String(
          event.over.id
        );

      const destination =
        resolveDestination({
          overId,
          regularItems,
        });

      if (!destination) {
        return;
      }

      const layout =
        buildUpdatedLayout({
          regularItems,
          draggedItemId:
            draggedItem.id,
          targetColumn:
            destination.columnNumber,
          targetItemId:
            destination.targetItemId,
        });

      if (
        !hasLayoutChanged(
          regularItems,
          layout
        )
      ) {
        return;
      }

      await onLayoutChange(
        selectedItem.id,
        layout
      );
    };

  if (!selectedItem) {
    return (
      <div className="flex h-full min-h-[720px] flex-col">
        <DesignerHeader />

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="max-w-sm text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f1f2f3]">
              <LayoutGrid
                size={28}
              />
            </div>

            <h3 className="mt-5 text-base font-semibold">
              Select a navigation item
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#6d7175]">
              Select a dropdown or mega-menu from the navigation tree to
              organize its visual layout.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[720px] flex-col bg-[#fafafa]">
      <DesignerHeader
        isSavingLayout={
          isSavingLayout
        }
      />

      <div className="border-b border-[#e1e3e5] bg-white px-5 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-semibold">
                {
                  selectedItem.label
                }
              </h3>

              <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-semibold text-[#005bd3]">
                {formatItemType(
                  selectedItem.itemType
                )}
              </span>

              {!selectedItem.isActive && (
                <span className="flex items-center gap-1 rounded-full bg-[#fbeae5] px-2 py-0.5 text-[10px] font-medium text-[#a23b2a]">
                  <EyeOff
                    size={11}
                  />

                  Inactive
                </span>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#6d7175]">
              {selectedItem.description ||
                (
                  isContainer
                    ? "Drag child items between columns to design this mega menu."
                    : "This navigation item links directly to its destination."
                )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
  {isContainer && (
    <button
      type="button"
      onClick={
        handleAddColumn
      }
      disabled={
        !canAddColumn
      }
      className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
      title={
        canAddColumn
          ? "Add another mega-menu column"
          : `Maximum ${safeMaxColumns} columns reached`
      }
    >
      <LayoutGrid
        size={14}
      />

      Add column
    </button>
  )}

  <button
    type="button"
    onClick={() =>
      onEdit(
        selectedItem
      )
    }
              className="flex h-9 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-3 text-sm font-medium"
            >
              <Pencil
                size={14}
              />

              Edit
            </button>

            <button
              type="button"
              onClick={() =>
                onAddChild(
                  selectedItem,
                  1
                )
              }
              className="flex h-9 items-center gap-2 rounded-lg bg-[#303030] px-3 text-sm font-semibold text-white"
            >
              <Plus
                size={14}
              />

              Add child
            </button>
          </div>
        </div>
      </div>

      {!isContainer &&
      children.length ===
        0 ? (
        <StandardItemState
          selectedItem={
            selectedItem
          }
          onEdit={
            onEdit
          }
        />
      ) : (
        <DndContext
          sensors={
            sensors
          }
          collisionDetection={
            closestCorners
          }
          onDragStart={
            handleDragStart
          }
          onDragCancel={
            handleDragCancel
          }
          onDragEnd={
            handleDragEnd
          }
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div
              className="grid gap-4"
              style={{
                gridTemplateColumns:
  `repeat(${Math.min(
    visibleColumnCount,
    4
  )}, minmax(190px, 1fr))`,
              }}
            >
              {columns.map(
                (
                  columnNumber
                ) => {
                  const columnItems =
                    regularItems.filter(
                      (item) =>
                        Number(
                          item.columnNumber ||
                            1
                        ) ===
                        columnNumber
                    );

                  return (
                    <NavigationDesignColumn
                      key={
                        columnNumber
                      }
                      columnNumber={
                        columnNumber
                      }
                      items={
                        columnItems
                      }
                      parentItem={
                        selectedItem
                      }
                      selectedItemId={
                        selectedItemId
                      }
                      disabled={
                        isSavingLayout
                      }
                      onAddChild={
                        onAddChild
                      }
                      onEdit={
                        onEdit
                      }
                      onSelectItem={
                        onSelectItem
                      }
                    />
                  );
                }
              )}
            </div>

            <PromotionArea
              parentItem={
                selectedItem
              }
              items={
                promotionItems
              }
              selectedItemId={
                selectedItemId
              }
              onAddChild={
                onAddChild
              }
              onEdit={
                onEdit
              }
              onSelectItem={
                onSelectItem
              }
            />
          </div>

          <DragOverlay>
            {activeDesignerItem ? (
              <DesignerDragOverlay
                item={
                  activeDesignerItem
                }
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

function DesignerHeader({
  isSavingLayout = false,
}: {
  isSavingLayout?:
    boolean;
}) {
  return (
    <header className="border-b border-[#e1e3e5] bg-white px-5 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <LayoutGrid
              size={17}
              className="text-[#5c5f62]"
            />

            <h2 className="text-sm font-semibold">
              Mega-menu designer
            </h2>
          </div>

          <p className="mt-1 text-xs leading-5 text-[#6d7175]">
            Drag items between columns. Changes are saved automatically.
          </p>
        </div>

        <div
          className={[
            "flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium",
            isSavingLayout
              ? "bg-[#fff5ea] text-[#8a4b08]"
              : "bg-[#e3f1df] text-[#1f6f1f]",
          ].join(
            " "
          )}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              isSavingLayout
                ? "animate-pulse bg-[#b98900]"
                : "bg-[#1f6f1f]",
            ].join(
              " "
            )}
          />

          {isSavingLayout
            ? "Saving..."
            : "Auto saved"}
        </div>
      </div>
    </header>
  );
}

interface NavigationDesignColumnProps {
  columnNumber: number;

  items:
    NavigationItem[];

  parentItem:
    NavigationItem;

  selectedItemId:
    string | null;

  disabled:
    boolean;

  onAddChild: (
    item: NavigationItem,
    columnNumber?: number
  ) => void;

  onEdit: (
    item: NavigationItem
  ) => void;

  onSelectItem: (
    item: NavigationItem
  ) => void;
}

function NavigationDesignColumn({
  columnNumber,
  items,
  parentItem,
  selectedItemId,
  disabled,
  onAddChild,
  onEdit,
  onSelectItem,
}: NavigationDesignColumnProps) {
  const {
    setNodeRef,
    isOver,
  } = useDroppable({
    id:
      getDesignerColumnId(
        columnNumber
      ),

    data: {
      type:
        "DESIGNER_COLUMN",

      columnNumber,
    },

    disabled,
  });

  return (
    <section
      ref={
        setNodeRef
      }
      className={[
        "min-w-0 rounded-2xl border bg-white shadow-sm transition",
        isOver
          ? "border-[#005bd3] ring-2 ring-[#005bd3]/15"
          : "border-[#e1e3e5]",
      ].join(
        " "
      )}
    >
      <header className="flex items-center justify-between border-b border-[#e1e3e5] px-4 py-3">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#5c5f62]">
            Column{" "}
            {columnNumber}
          </h4>

          <p className="mt-0.5 text-[11px] text-[#8c9196]">
            {items.length}{" "}
            item
            {items.length ===
            1
              ? ""
              : "s"}
          </p>
        </div>

        <button
          type="button"
          disabled={
            disabled
          }
          onClick={() =>
            onAddChild(
              parentItem,
              columnNumber
            )
          }
          className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-[#f1f2f3] disabled:opacity-50"
          title={`Add item to column ${columnNumber}`}
        >
          <Plus
            size={15}
          />
        </button>
      </header>

      <SortableContext
        items={items.map(
          (item) =>
            getDesignerItemId(
              item.id
            )
        )}
        strategy={
          verticalListSortingStrategy
        }
      >
        <div className="min-h-[260px] space-y-3 p-3">
          {items.length ===
          0 ? (
            <div
              className={[
                "flex min-h-[230px] items-center justify-center rounded-xl border border-dashed p-4 transition",
                isOver
                  ? "border-[#005bd3] bg-[#eef4ff]"
                  : "border-[#dfe3e8] bg-[#fafafa]",
              ].join(
                " "
              )}
            >
              <div className="text-center">
                <Plus
                  size={19}
                  className="mx-auto text-[#8c9196]"
                />

                <p className="mt-2 text-xs font-medium text-[#6d7175]">
                  Empty column
                </p>

                <p className="mt-1 text-[11px] text-[#8c9196]">
                  Drop an item here
                </p>
              </div>
            </div>
          ) : (
            items.map(
              (item) => (
                <NavigationDesignerCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  columnNumber={
                    columnNumber
                  }
                  selected={
                    selectedItemId ===
                      item.id ||
                    containsNavigationItem(
                      item,
                      selectedItemId
                    )
                  }
                  selectedItemId={
                    selectedItemId
                  }
                  disabled={
                    disabled
                  }
                  onAddChild={
                    onAddChild
                  }
                  onEdit={
                    onEdit
                  }
                  onSelect={
                    onSelectItem
                  }
                />
              )
            )
          )}
        </div>
      </SortableContext>
    </section>
  );
}

interface NavigationDesignerCardProps {
  item:
    NavigationItem;

  columnNumber:
    number;

  selected:
    boolean;

  selectedItemId:
    string | null;

  disabled:
    boolean;

  onAddChild: (
    item: NavigationItem,
    columnNumber?: number
  ) => void;

  onSelect: (
    item: NavigationItem
  ) => void;

  onEdit: (
    item: NavigationItem
  ) => void;
}

function NavigationDesignerCard({
  item,
  columnNumber,
  selected,
  selectedItemId,
  disabled,
  onAddChild,
  onSelect,
  onEdit,
}: NavigationDesignerCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id:
      getDesignerItemId(
        item.id
      ),

    data: {
      type:
        "DESIGNER_ITEM",

      itemId:
        item.id,

      columnNumber,
    },

    disabled,
  });

  const style = {
    transform:
      CSS.Transform.toString(
        transform
      ),

    transition,

    opacity:
      isDragging
        ? 0.25
        : 1,
  };

  const isHeading =
    item.itemType ===
    "HEADING";

  const headingChildren =
    item.children || [];

  const [
    isHeadingExpanded,
    setIsHeadingExpanded,
  ] = useState(
    true
  );

  useEffect(() => {
    if (
      isHeading &&
      selectedItemId &&
      containsNavigationItem(
        item,
        selectedItemId
      )
    ) {
      setIsHeadingExpanded(
        true
      );
    }
  }, [
    isHeading,
    item,
    selectedItemId,
  ]);

  if (isHeading) {
    return (
      <div
        ref={
          setNodeRef
        }
        style={
          style
        }
        className={[
          "group overflow-hidden rounded-xl border bg-white text-left transition-all duration-200",

          selected
            ? "border-[#005bd3] ring-2 ring-[#005bd3]/15"
            : "border-[#dfe3e8] hover:border-[#8c9196]",

          isDragging
            ? "shadow-xl"
            : "shadow-sm hover:shadow-md",
        ].join(
          " "
        )}
      >
        <div
          className={[
            "flex items-center gap-2 border-b px-2.5 py-2.5 transition",

            selected
              ? "border-[#b7d3f8] bg-[#eef4ff]"
              : "border-[#e1e3e5] bg-[#f6f6f7]",
          ].join(
            " "
          )}
        >
          <button
            type="button"
            {...attributes}
            {...listeners}
            disabled={
              disabled
            }
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            className="flex h-8 w-7 shrink-0 touch-none cursor-grab select-none items-center justify-center rounded-lg text-[#8c9196] transition hover:bg-white active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
            title="Drag heading group"
          >
            <GripVertical
              size={15}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              onSelect(
                item
              )
            }
            onDoubleClick={() =>
              onEdit(
                item
              )
            }
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="h-5 w-1 shrink-0 rounded-full bg-[#303030]" />

            <span className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-[0.08em] text-[#303030]">
              {item.label}
            </span>

            <span className="shrink-0 rounded-full border border-[#dfe3e8] bg-white px-2 py-0.5 text-[9px] font-semibold text-[#6d7175]">
              {headingChildren.length}{" "}
              {headingChildren.length ===
              1
                ? "link"
                : "links"}
            </span>

            {!item.isActive && (
              <EyeOff
                size={12}
                className="shrink-0 text-[#a23b2a]"
              />
            )}
          </button>

          <button
            type="button"
            onClick={() =>
              onAddChild(
                item,
                columnNumber
              )
            }
            disabled={
              disabled
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5c5f62] transition hover:bg-white disabled:opacity-50"
            title={`Add link under ${item.label}`}
          >
            <Plus
              size={14}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              onEdit(
                item
              )
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5c5f62] opacity-0 transition hover:bg-white group-hover:opacity-100"
            title="Edit heading"
          >
            <Pencil
              size={13}
            />
          </button>

          <button
            type="button"
            onClick={() =>
              setIsHeadingExpanded(
                (current) =>
                  !current
              )
            }
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#5c5f62] transition hover:bg-white"
            title={
              isHeadingExpanded
                ? "Collapse heading group"
                : "Expand heading group"
            }
            aria-expanded={
              isHeadingExpanded
            }
          >
            {isHeadingExpanded ? (
              <ChevronDown
                size={15}
              />
            ) : (
              <ChevronRight
                size={15}
              />
            )}
          </button>
        </div>

        {isHeadingExpanded && (
          <div className="p-2.5">
            {headingChildren.length ===
            0 ? (
              <button
                type="button"
                onClick={() =>
                  onAddChild(
                    item,
                    columnNumber
                  )
                }
                className="flex min-h-20 w-full flex-col items-center justify-center rounded-lg border border-dashed border-[#dfe3e8] bg-[#fafafa] px-3 text-center transition hover:border-[#8c9196] hover:bg-[#f6f6f7]"
              >
                <Link2
                  size={18}
                  className="text-[#8c9196]"
                />

                <span className="mt-2 text-xs font-medium text-[#6d7175]">
                  No links added
                </span>

                <span className="mt-1 text-[10px] text-[#8c9196]">
                  Add the first link under this heading
                </span>
              </button>
            ) : (
              <div className="space-y-1">
                {headingChildren.map(
                  (child) => (
                    <HeadingChildRow
                      key={
                        child.id
                      }
                      item={
                        child
                      }
                      selected={
                        selectedItemId ===
                          child.id ||
                        containsNavigationItem(
                          child,
                          selectedItemId
                        )
                      }
                      onSelect={
                        onSelect
                      }
                      onEdit={
                        onEdit
                      }
                    />
                  )
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() =>
                onAddChild(
                  item,
                  columnNumber
                )
              }
              disabled={
                disabled
              }
              className="mt-2.5 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#babfc3] bg-white text-xs font-semibold text-[#5c5f62] transition hover:border-[#8c9196] hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus
                size={13}
              />

              Add link
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={
        setNodeRef
      }
      style={
        style
      }
      className={[
        "group flex items-start gap-2 rounded-xl border p-2.5 text-left transition",

        selected
          ? "border-[#005bd3] bg-[#eef4ff] ring-2 ring-[#005bd3]/15"
          : "border-[#e1e3e5] bg-white",

        isDragging
          ? "shadow-xl"
          : selected
            ? ""
            : "hover:border-[#8c9196] hover:bg-[#fafafa]",
      ].join(
        " "
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={
          disabled
        }
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="flex h-8 w-7 shrink-0 touch-none cursor-grab select-none items-center justify-center rounded-lg text-[#8c9196] hover:bg-[#f1f2f3] active:cursor-grabbing disabled:cursor-default disabled:opacity-50"
        title="Drag item"
      >
        <GripVertical
          size={15}
        />
      </button>

      <button
        type="button"
        onClick={() =>
          onSelect(
            item
          )
        }
        onDoubleClick={() =>
          onEdit(
            item
          )
        }
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-semibold">
            {item.label}
          </p>

          {item.badgeText && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white"
              style={{
                backgroundColor:
                  item.badgeColor ||
                  "#303030",
              }}
            >
              {item.badgeText}
            </span>
          )}

          {!item.isActive && (
            <EyeOff
              size={12}
              className="text-[#a23b2a]"
            />
          )}
        </div>

        <p className="mt-1 truncate text-[11px] text-[#6d7175]">
          {formatItemType(
            item.itemType
          )}
        </p>

        {item.description && (
          <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#8c9196]">
            {item.description}
          </p>
        )}
      </button>

      <button
        type="button"
        onClick={() =>
          onEdit(
            item
          )
        }
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-0 transition hover:bg-[#f1f2f3] group-hover:opacity-100"
        title="Edit item"
      >
        <Pencil
          size={13}
        />
      </button>
    </div>
  );
}

interface HeadingChildRowProps {
  item: NavigationItem;
  selected: boolean;
  onSelect: (
    item: NavigationItem
  ) => void;
  onEdit: (
    item: NavigationItem
  ) => void;
}

function HeadingChildRow({
  item,
  selected,
  onSelect,
  onEdit,
}: HeadingChildRowProps) {
  return (
    <div
      className={[
        "group/child flex items-center gap-2 rounded-lg border px-2 py-1.5 transition",

        selected
          ? "border-[#b7d3f8] bg-[#eef4ff]"
          : "border-transparent hover:border-[#e1e3e5] hover:bg-[#fafafa]",
      ].join(
        " "
      )}
    >
      <span className="ml-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8c9196]" />

      <button
        type="button"
        onClick={() =>
          onSelect(
            item
          )
        }
        onDoubleClick={() =>
          onEdit(
            item
          )
        }
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-medium text-[#303030]">
            {item.label}
          </span>

          {item.badgeText && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[8px] font-semibold text-white"
              style={{
                backgroundColor:
                  item.badgeColor ||
                  "#303030",
              }}
            >
              {item.badgeText}
            </span>
          )}

          {!item.isActive && (
            <EyeOff
              size={11}
              className="shrink-0 text-[#a23b2a]"
            />
          )}
        </div>

        {(item.children?.length ||
          0) > 0 && (
          <p className="mt-0.5 text-[10px] text-[#8c9196]">
            {item.children?.length} nested item
            {item.children?.length ===
            1
              ? ""
              : "s"}
          </p>
        )}
      </button>

      <button
        type="button"
        onClick={() =>
          onEdit(
            item
          )
        }
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md opacity-0 transition hover:bg-[#f1f2f3] group-hover/child:opacity-100"
        title="Edit link"
      >
        <Pencil
          size={12}
        />
      </button>
    </div>
  );
}

function StandardItemState({
  selectedItem,
  onEdit,
}: {
  selectedItem:
    NavigationItem;

  onEdit: (
    item: NavigationItem
  ) => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="max-w-sm rounded-2xl border border-dashed border-[#c9cccf] bg-white p-8 text-center">
        <FolderTree
          size={30}
          className="mx-auto text-[#8c9196]"
        />

        <h3 className="mt-4 text-sm font-semibold">
          Standard navigation item
        </h3>

        <p className="mt-2 text-xs leading-5 text-[#6d7175]">
          This item links directly to a destination. You can edit its URL,
          media, visibility and targeting rules.
        </p>

        <button
          type="button"
          onClick={() =>
            onEdit(
              selectedItem
            )
          }
          className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
        >
          <Pencil
            size={14}
          />

          Edit item
        </button>
      </div>
    </div>
  );
}

function PromotionArea({
    parentItem,
    items,
    selectedItemId,
    onAddChild,
    onEdit,
    onSelectItem,
  }: {
    parentItem:
      NavigationItem;
  
    items:
      NavigationItem[];

    selectedItemId:
      string | null;
  
    onAddChild: (
      item:
        NavigationItem,
      columnNumber?:
        number
    ) => void;
  
    onEdit: (
      item:
        NavigationItem
    ) => void;
  
    onSelectItem: (
      item:
        NavigationItem
    ) => void;
  }) {
    return (
      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles
              size={16}
              className="text-[#8a4b08]"
            />
  
            <h4 className="text-sm font-semibold">
              Promotion area
            </h4>
  
            <span className="rounded-full bg-[#fff5ea] px-2 py-0.5 text-[10px] font-medium text-[#8a4b08]">
              {items.length}
            </span>
          </div>
  
          {items.length >
            0 && (
            <button
              type="button"
              onClick={() =>
                onAddChild(
                  parentItem,
                  1
                )
              }
              className="flex h-8 items-center gap-1.5 rounded-lg border border-[#d6b36a] bg-white px-3 text-xs font-semibold text-[#7a4b00] transition hover:bg-[#fffaf0]"
            >
              <Plus
                size={13}
              />
  
              Add promotion
            </button>
          )}
        </div>
  
        {items.length ===
        0 ? (
          <button
            type="button"
            onClick={() =>
              onAddChild(
                parentItem,
                1
              )
            }
            className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#d6b36a] bg-[#fffaf0] p-6 text-center transition hover:bg-[#fff6df]"
          >
            <ImageIcon
              size={28}
              className="text-[#8a6116]"
            />
  
            <span className="mt-3 text-sm font-semibold text-[#7a4b00]">
              Add promotion card
            </span>
  
            <span className="mt-1 max-w-sm text-xs leading-5 text-[#8a6116]">
              Create a promotion item and attach an image from the DAM.
            </span>
          </button>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map(
              (
                item
              ) => {
                const imageUrl =
                  getNavigationAssetImageUrl(
                    item.mediaAsset
                  );
  
                return (
                  <div
                    key={
                      item.id
                    }
                    className="group relative"
                  >
                    <NavigationPromotionCard
                      item={
                        item
                      }
                      imageUrl={
                        imageUrl
                      }
                      className={
                        selectedItemId ===
                        item.id
                          ? "ring-2 ring-[#005bd3] ring-offset-2"
                          : ""
                      }
                      compact
                      interactive
                      onClick={() =>
                        onSelectItem(
                          item
                        )
                      }
                    />
  
                    <button
                      type="button"
                      onClick={(
                        event
                      ) => {
                        event.preventDefault();
                        event.stopPropagation();
  
                        onEdit(
                          item
                        );
                      }}
                      className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-[#303030] opacity-0 shadow-md transition hover:bg-white group-hover:opacity-100"
                      title="Edit promotion"
                      aria-label={`Edit ${item.label}`}
                    >
                      <Pencil
                        size={13}
                      />
                    </button>
  
                    {!item.isActive && (
                      <div className="absolute left-3 top-3 z-20 flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 shadow-sm">
                        <EyeOff
                          size={11}
                        />
  
                        Inactive
                      </div>
                    )}
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
    );
  }

function DesignerDragOverlay({
  item,
}: {
  item:
    NavigationItem;
}) {
  return (
    <div className="flex min-w-[220px] items-center gap-3 rounded-xl border border-[#babfc3] bg-white px-3 py-3 shadow-2xl">
      <GripVertical
        size={16}
        className="text-[#8c9196]"
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {item.label}
        </p>

        <p className="mt-0.5 text-[11px] text-[#6d7175]">
          Column{" "}
          {item.columnNumber ||
            1}
        </p>
      </div>
    </div>
  );
}

function getDesignerItemId(
  itemId: string
): string {
  return `designer-item:${itemId}`;
}

function getDesignerColumnId(
  columnNumber:
    number
): string {
  return `designer-column:${columnNumber}`;
}

function parseDesignerItemId(
  value: string
): string | null {
  const prefix =
    "designer-item:";

  if (
    !value.startsWith(
      prefix
    )
  ) {
    return null;
  }

  return (
    value.slice(
      prefix.length
    ) ||
    null
  );
}

function parseDesignerColumnId(
  value: string
): number | null {
  const prefix =
    "designer-column:";

  if (
    !value.startsWith(
      prefix
    )
  ) {
    return null;
  }

  const columnNumber =
    Number(
      value.slice(
        prefix.length
      )
    );

  return Number.isFinite(
    columnNumber
  )
    ? columnNumber
    : null;
}

function resolveDestination({
  overId,
  regularItems,
}: {
  overId: string;

  regularItems:
    NavigationItem[];
}): {
  columnNumber:
    number;

  targetItemId:
    string | null;
} | null {
  const directColumn =
    parseDesignerColumnId(
      overId
    );

  if (directColumn) {
    return {
      columnNumber:
        directColumn,

      targetItemId:
        null,
    };
  }

  const targetItemId =
    parseDesignerItemId(
      overId
    );

  if (!targetItemId) {
    return null;
  }

  const targetItem =
    regularItems.find(
      (item) =>
        item.id ===
        targetItemId
    );

  if (!targetItem) {
    return null;
  }

  return {
    columnNumber:
      Number(
        targetItem.columnNumber ||
          1
      ),

    targetItemId:
      targetItem.id,
  };
}

function buildUpdatedLayout({
  regularItems,
  draggedItemId,
  targetColumn,
  targetItemId,
}: {
  regularItems:
    NavigationItem[];

  draggedItemId:
    string;

  targetColumn:
    number;

  targetItemId:
    string | null;
}): NavigationDesignerLayoutItem[] {
  const draggedItem =
    regularItems.find(
      (item) =>
        item.id ===
        draggedItemId
    );

  if (!draggedItem) {
    return regularItems.map(
      (item) => ({
        id:
          item.id,

        columnNumber:
          Number(
            item.columnNumber ||
              1
          ),
      })
    );
  }

  const sourceColumn =
    Number(
      draggedItem.columnNumber ||
        1
    );

  const sourceColumnItems =
    regularItems.filter(
      (item) =>
        Number(
          item.columnNumber ||
            1
        ) ===
        sourceColumn
    );

  const sourceIndex =
    sourceColumnItems.findIndex(
      (item) =>
        item.id ===
        draggedItemId
    );

  const targetColumnItemsBeforeRemoval =
    regularItems.filter(
      (item) =>
        Number(
          item.columnNumber ||
            1
        ) ===
        targetColumn
    );

  const originalTargetIndex =
    targetItemId
      ? targetColumnItemsBeforeRemoval.findIndex(
          (item) =>
            item.id ===
            targetItemId
        )
      : -1;

  const columnMap =
    new Map<
      number,
      NavigationItem[]
    >();

  for (
    const item of
    regularItems
  ) {
    if (
      item.id ===
      draggedItemId
    ) {
      continue;
    }

    const columnNumber =
      Number(
        item.columnNumber ||
          1
      );

    const currentItems =
      columnMap.get(
        columnNumber
      ) ||
      [];

    currentItems.push(
      item
    );

    columnMap.set(
      columnNumber,
      currentItems
    );
  }

  const targetItems =
    columnMap.get(
      targetColumn
    ) ||
    [];

  let insertIndex =
    targetItems.length;

  if (
    targetItemId
  ) {
    const targetIndexAfterRemoval =
      targetItems.findIndex(
        (item) =>
          item.id ===
          targetItemId
      );

    if (
      targetIndexAfterRemoval >=
      0
    ) {
      insertIndex =
        targetIndexAfterRemoval;

      if (
        sourceColumn ===
          targetColumn &&
        sourceIndex <
          originalTargetIndex
      ) {
        insertIndex =
          targetIndexAfterRemoval +
          1;
      }
    }
  }

  targetItems.splice(
    Math.max(
      0,
      Math.min(
        insertIndex,
        targetItems.length
      )
    ),
    0,
    {
      ...draggedItem,

      columnNumber:
        targetColumn,
    }
  );

  columnMap.set(
    targetColumn,
    targetItems
  );

  const allColumns =
    Array.from(
      new Set([
        ...regularItems.map(
          (item) =>
            Number(
              item.columnNumber ||
                1
            )
        ),

        targetColumn,
      ])
    ).sort(
      (
        first,
        second
      ) =>
        first -
        second
    );

  return allColumns.flatMap(
    (columnNumber) =>
      (
        columnMap.get(
          columnNumber
        ) ||
        []
      ).map(
        (item) => ({
          id:
            item.id,

          columnNumber,
        })
      )
  );
}

function hasLayoutChanged(
  currentItems:
    NavigationItem[],
  nextLayout:
    NavigationDesignerLayoutItem[]
): boolean {
  if (
    currentItems.length !==
    nextLayout.length
  ) {
    return true;
  }

  return currentItems.some(
    (
      item,
      index
    ) =>
      item.id !==
        nextLayout[index]
          ?.id ||
      Number(
        item.columnNumber ||
          1
      ) !==
        nextLayout[index]
          ?.columnNumber
  );
}

function containsNavigationItem(
  item: NavigationItem,
  selectedItemId: string | null
): boolean {
  if (!selectedItemId) {
    return false;
  }

  return (
    item.children || []
  ).some(
    (child) =>
      child.id ===
        selectedItemId ||
      containsNavigationItem(
        child,
        selectedItemId
      )
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