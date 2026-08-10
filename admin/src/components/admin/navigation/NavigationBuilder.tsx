"use client";

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import {
  GripVertical,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  toast,
} from "sonner";

import NavigationDesignerPanel, {
  type NavigationDesignerLayoutItem,
} from "./NavigationDesignerPanel";

import NavigationDropZone from "./NavigationDropZone";
import NavigationItemModal from "./NavigationItemModal";
import NavigationPreviewPanel from "./NavigationPreviewPanel";
import NavigationTreeItem from "./NavigationTreeItem";
import NavigationTreePanel from "./NavigationTreePanel";
import NavigationWorkspace from "./NavigationWorkspace";

import InspectorHost from "@/components/admin/studio/inspector/InspectorHost";
import type {
  PromotionInspectorDraft,
} from "@/components/admin/studio/inspector/PromotionInspector";

import {
  useCreateNavigationItemMutation,
  useDeleteNavigationItemMutation,
  useReorderNavigationItemsMutation,
  useUpdateNavigationItemMutation,
} from "@/store/api/navigationApi";

import type {
  NavigationItem,
  NavigationItemFormValues,
  NavigationMenu,
  ReorderNavigationItem,
} from "@/types/navigation";

interface NavigationBuilderProps {
  menu:
    NavigationMenu;
}

interface RemovedTreeResult {
  tree:
    NavigationItem[];

  removed:
    NavigationItem | null;
}

type DropMode =
  | "BEFORE"
  | "INSIDE"
  | "AFTER"
  | "ROOT_END";

interface ParsedDropTarget {
  mode:
    DropMode;

  targetItemId:
    string | null;
}

export default function NavigationBuilder({
  menu,
}: NavigationBuilderProps) {
  const [
    localItems,
    setLocalItems,
  ] = useState<
    NavigationItem[]
  >(
    menu.items ||
      []
  );

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState<
    string | null
  >(
    menu.items?.[0]?.id ||
      null
  );

  const [
    activeItem,
    setActiveItem,
  ] = useState<
    NavigationItem | null
  >(
    null
  );

  const [
    editingItem,
    setEditingItem,
  ] = useState<
    NavigationItem | null
  >(
    null
  );

  const [
    parentItem,
    setParentItem,
  ] = useState<
    NavigationItem | null
  >(
    null
  );

  const [
    createColumnNumber,
    setCreateColumnNumber,
  ] = useState<
    number | null
  >(
    null
  );

  const [
    isItemModalOpen,
    setIsItemModalOpen,
  ] = useState(
    false
  );

  const [
    createItem,
    {
      isLoading:
        isCreating,
    },
  ] =
    useCreateNavigationItemMutation();

  const [
    updateItem,
    {
      isLoading:
        isUpdating,
    },
  ] =
    useUpdateNavigationItemMutation();

  const [
    deleteItem,
    {
      isLoading:
        isDeleting,
    },
  ] =
    useDeleteNavigationItemMutation();

  const [
    reorderItems,
    {
      isLoading:
        isReordering,
    },
  ] =
    useReorderNavigationItemsMutation();

  useEffect(() => {
    const nextItems =
      menu.items ||
      [];

    setLocalItems(
      nextItems
    );

    setSelectedItemId(
      (current) => {
        if (
          current &&
          findItemById(
            nextItems,
            current
          )
        ) {
          return current;
        }

        return (
          nextItems[0]?.id ||
          null
        );
      }
    );
  }, [
    menu.items,
  ]);

  const sensors =
    useSensors(
      useSensor(
        PointerSensor,
        {
          activationConstraint:
            {
              distance:
                6,
            },
        }
      ),

      useSensor(
        KeyboardSensor,
        {
          coordinateGetter:
            sortableKeyboardCoordinates,
        }
      )
    );

  const sortableIds =
    useMemo(
      () =>
        flattenItems(
          localItems
        ).map(
          (item) =>
            item.id
        ),
      [
        localItems,
      ]
    );

  const selectedItem =
    useMemo(
      () =>
        selectedItemId
          ? findItemById(
              localItems,
              selectedItemId
            )
          : null,
      [
        localItems,
        selectedItemId,
      ]
    );
  
    const designerRootItem =
  useMemo(
    () =>
      getDesignerRootItem(
        localItems,
        selectedItemId
      ),
    [
      localItems,
      selectedItemId,
    ]
  );

  const totalItemCount =
    useMemo(
      () =>
        flattenItems(
          localItems
        ).length,
      [
        localItems,
      ]
    );

  const maxColumns =
    Math.max(
      Number(
        menu.settings
          ?.maxColumns ||
          4
      ),
      1
    );

  const closeModal =
    () => {
      setIsItemModalOpen(
        false
      );

      setEditingItem(
        null
      );

      setParentItem(
        null
      );

      setCreateColumnNumber(
        null
      );
    };

  const openCreateRoot =
    () => {
      setEditingItem(
        null
      );

      setParentItem(
        null
      );

      setCreateColumnNumber(
        null
      );

      setIsItemModalOpen(
        true
      );
    };

  const openCreateChild = (
    item:
      NavigationItem,
    columnNumber?:
      number
  ) => {
    setSelectedItemId(
      item.id
    );

    setEditingItem(
      null
    );

    setParentItem(
      item
    );

    setCreateColumnNumber(
      columnNumber ||
        null
    );

    setIsItemModalOpen(
      true
    );
  };

  const openEdit = (
    item:
      NavigationItem
  ) => {
    setSelectedItemId(
      item.id
    );

    setParentItem(
      null
    );

    setCreateColumnNumber(
      null
    );

    setEditingItem(
      item
    );

    setIsItemModalOpen(
      true
    );
  };

  const handleSelectItem = (
    item:
      NavigationItem
  ) => {
    setSelectedItemId(
      item.id
    );
  };

  const handleSubmit =
    async (
      values:
        NavigationItemFormValues
    ) => {
      const preparedValues:
        NavigationItemFormValues =
        !editingItem &&
        createColumnNumber
          ? {
              ...values,

              columnNumber:
                createColumnNumber,
            }
          : values;

      try {
        if (editingItem) {
          const response =
            await updateItem({
              menuId:
                menu.id,

              itemId:
                editingItem.id,

              body:
                preparedValues,
            }).unwrap();

          if (
            response?.data
              ?.items
          ) {
            setLocalItems(
              response.data
                .items
            );
          }

          setSelectedItemId(
            editingItem.id
          );

          toast.success(
            "Navigation item updated."
          );
        } else {
          const response =
            await createItem({
              menuId:
                menu.id,

              body:
                preparedValues,
            }).unwrap();

          if (
            response?.data
              ?.items
          ) {
            setLocalItems(
              response.data
                .items
            );

            const createdItem =
              findCreatedNavigationItem(
                response.data
                  .items,
                preparedValues
              );

            if (
              createdItem
            ) {
              setSelectedItemId(
                createdItem.id
              );
            }
          }

          toast.success(
            "Navigation item created."
          );
        }

        closeModal();
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to save the navigation item."
          )
        );
      }
    };

    const handlePromotionInspectorSave =
  async (
    item:
      NavigationItem,
    draft:
      PromotionInspectorDraft
  ) => {
    try {
      const response =
        await updateItem({
          menuId:
            menu.id,

          itemId:
            item.id,

          body: {
            label:
              item.label,

            itemType:
              item.itemType,

            parentId:
              item.parentId,

            referenceId:
              item.referenceId,

            url:
              draft.ctaUrl ||
              item.url ||
              null,

            columnNumber:
              item.columnNumber ||
              1,

            displayOrder:
              item.displayOrder,

            isActive:
              item.isActive,

            mediaAssetId:
              item.mediaAssetId ||
              null,

            settings: {
              ...(item.settings ||
                {}),

                promotion: {
                  eyebrow:
                    draft.eyebrow,
                
                  title:
                    draft.title,
                
                  subtitle:
                    draft.subtitle,
                
                  description:
                    draft.description,
                
                  ctaText:
                    draft.ctaText,
                
                  ctaUrl:
                    draft.ctaUrl,
                
                  textAlign:
                    draft.textAlign,
                
                  overlay:
                    draft.overlay,
                
                  textColor:
                    draft.textColor ||
                    null,
                
                  backgroundColor:
                    draft.backgroundColor ||
                    null,
                },
            },
          },
        }).unwrap();

      if (
        response?.data
          ?.items
      ) {
        setLocalItems(
          response.data.items
        );
      }

      setSelectedItemId(
        item.id
      );

      toast.success(
        "Promotion updated."
      );
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          "Unable to update the promotion."
        )
      );

      throw error;
    }
  };

  const handleDelete =
    async (
      item:
        NavigationItem
    ) => {
      const nestedCount =
        flattenItems(
          item.children ||
            []
        ).length;

      const message =
        nestedCount >
        0
          ? `Delete "${item.label}" and its ${nestedCount} nested item${
              nestedCount ===
              1
                ? ""
                : "s"
            }?`
          : `Delete "${item.label}"?`;

      if (
        !window.confirm(
          message
        )
      ) {
        return;
      }

      try {
        const response =
          await deleteItem({
            menuId:
              menu.id,

            itemId:
              item.id,
          }).unwrap();

        const deletedSelectedItem =
          selectedItemId ===
            item.id ||
          (
            selectedItemId
              ? containsItem(
                  item,
                  selectedItemId
                )
              : false
          );

        if (
          response?.data
            ?.items
        ) {
          setLocalItems(
            response.data
              .items
          );

          if (
            deletedSelectedItem
          ) {
            setSelectedItemId(
              response.data
                .items?.[0]
                ?.id ||
                null
            );
          }
        } else {
          const nextTree =
            removeItemFromTree(
              localItems,
              item.id
            ).tree;

          setLocalItems(
            nextTree
          );

          if (
            deletedSelectedItem
          ) {
            setSelectedItemId(
              nextTree[0]?.id ||
                null
            );
          }
        }

        toast.success(
          "Navigation item deleted."
        );
      } catch (error) {
        toast.error(
          getErrorMessage(
            error,
            "Unable to delete the navigation item."
          )
        );
      }
    };

  const handleDragStart = (
    event:
      DragStartEvent
  ) => {
    const itemId =
      String(
        event.active.id
      );

    const draggedItem =
      findItemById(
        localItems,
        itemId
      );

    setActiveItem(
      draggedItem
    );

    if (
      draggedItem
    ) {
      setSelectedItemId(
        draggedItem.id
      );
    }
  };

  const handleDragCancel =
    () => {
      setActiveItem(
        null
      );
    };

  const handleDragEnd =
    async (
      event:
        DragEndEvent
    ) => {
      const draggedItem =
        activeItem;

      setActiveItem(
        null
      );

      const {
        active,
        over,
      } = event;

      if (
        !draggedItem ||
        !over
      ) {
        return;
      }

      const activeId =
        String(
          active.id
        );

      const overId =
        String(
          over.id
        );

      const dropTarget =
        parseDropTarget(
          overId
        );

      if (
        !dropTarget
      ) {
        return;
      }

      if (
        dropTarget.targetItemId ===
        activeId
      ) {
        return;
      }

      const targetItem =
        dropTarget.targetItemId
          ? findItemById(
              localItems,
              dropTarget.targetItemId
            )
          : null;

      if (
        targetItem &&
        containsItem(
          draggedItem,
          targetItem.id
        )
      ) {
        toast.error(
          "A parent item cannot be moved inside one of its own children."
        );

        return;
      }

      const previousTree =
        localItems;

      const {
        tree:
          treeWithoutDraggedItem,

        removed,
      } =
        removeItemFromTree(
          localItems,
          activeId
        );

      if (
        !removed
      ) {
        return;
      }

      let updatedTree:
        NavigationItem[];

      if (
        dropTarget.mode ===
        "ROOT_END"
      ) {
        updatedTree = [
          ...treeWithoutDraggedItem,

          updateParentRecursively(
            removed,
            null,
            0
          ),
        ];
      } else {
        if (
          !targetItem ||
          !dropTarget.targetItemId
        ) {
          return;
        }

        if (
          dropTarget.mode ===
          "INSIDE"
        ) {
          updatedTree =
            insertInsideItem(
              treeWithoutDraggedItem,
              dropTarget.targetItemId,
              removed
            );
        } else {
          updatedTree =
            insertBesideItem(
              treeWithoutDraggedItem,
              dropTarget.targetItemId,
              removed,
              dropTarget.mode
            );
        }
      }

      updatedTree =
        normalizeTree(
          updatedTree
        );

      setLocalItems(
        updatedTree
      );

      setSelectedItemId(
        activeId
      );

      try {
        const response =
          await reorderItems({
            menuId:
              menu.id,

            items:
              buildReorderPayload(
                updatedTree
              ),
          }).unwrap();

        if (
          response?.data
            ?.items
        ) {
          setLocalItems(
            response.data
              .items
          );
        }

        toast.success(
          "Navigation hierarchy updated."
        );
      } catch (error) {
        setLocalItems(
          previousTree
        );

        toast.error(
          getErrorMessage(
            error,
            "Unable to update the navigation hierarchy."
          )
        );
      }
    };

  const handleDesignerLayoutChange =
    async (
      parentItemId:
        string,

      layout:
        NavigationDesignerLayoutItem[]
    ) => {
      const previousTree =
        localItems;

      const updatedTree =
        applyDesignerLayout({
          tree:
            localItems,

          parentItemId,

          layout,
        });

      setLocalItems(
        updatedTree
      );

      try {
        const response =
          await reorderItems({
            menuId:
              menu.id,

            items:
              buildReorderPayload(
                updatedTree
              ),
          }).unwrap();

        if (
          response?.data
            ?.items
        ) {
          setLocalItems(
            response.data
              .items
          );
        }

        toast.success(
          "Mega-menu layout saved."
        );
      } catch (error) {
        setLocalItems(
          previousTree
        );

        toast.error(
          getErrorMessage(
            error,
            "Unable to save the mega-menu layout."
          )
        );

        throw error;
      }
    };

  const isDraggingAnyItem =
    Boolean(
      activeItem
    );

  const navigationCollisionDetection = (
    args:
      Parameters<
        typeof pointerWithin
      >[0]
  ) => {
    const pointerCollisions =
      pointerWithin(
        args
      );

    if (
      pointerCollisions.length >
      0
    ) {
      return pointerCollisions;
    }

    return closestCenter(
      args
    );
  };

  const treeContent =
    localItems.length ===
    0
      ? null
      : (
          <DndContext
            sensors={
              sensors
            }
            collisionDetection={
              navigationCollisionDetection
            }
            measuring={{
              droppable: {
                strategy:
                  MeasuringStrategy.Always,
              },
            }}
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
            <SortableContext
              items={
                sortableIds
              }
              strategy={
                verticalListSortingStrategy
              }
            >
              <div>
                {localItems.map(
                  (
                    item
                  ) => (
                    <NavigationTreeItem
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                      level={
                        0
                      }
                      isDraggingAnyItem={
                        isDraggingAnyItem
                      }
                      activeItemId={
                        activeItem?.id ||
                        null
                      }
                      selectedItemId={
                        selectedItemId
                      }
                      onSelect={
                        handleSelectItem
                      }
                      onAddChild={
                        openCreateChild
                      }
                      onEdit={
                        openEdit
                      }
                      onDelete={
                        handleDelete
                      }
                    />
                  )
                )}
              </div>
            </SortableContext>

            <NavigationDropZone
              id="root-end"
              mode="ROOT_END"
              visible={
                isDraggingAnyItem
              }
              label="Drop here to move the item to the root level"
            />

            <DragOverlay>
              {activeItem ? (
                <NavigationDragOverlay
                  item={
                    activeItem
                  }
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        );

  const treeFooter =
    isDeleting ||
    isReordering
      ? (
          <div className="flex items-center justify-center gap-2 border-t border-[#e1e3e5] bg-[#fafafa] px-5 py-3 text-xs text-[#6d7175]">
            <LoaderCircle
              size={
                14
              }
              className="animate-spin"
            />

            Updating navigation...
          </div>
        )
      : null;

  return (
    <>
      <NavigationWorkspace
        treePanel={
          <NavigationTreePanel
            itemCount={
              totalItemCount
            }
            isEmpty={
              localItems.length ===
              0
            }
            footer={
              treeFooter
            }
            onAddRoot={
              openCreateRoot
            }
          >
            {treeContent}
          </NavigationTreePanel>
        }
        designerPanel={
          <NavigationDesignerPanel
            selectedItem={
              designerRootItem
            }
            selectedItemId={
              selectedItemId
            }
            maxColumns={
              maxColumns
            }
            isSavingLayout={
              isReordering
            }
            onAddChild={
              openCreateChild
            }
            onEdit={
              openEdit
            }
            onSelectItem={
              handleSelectItem
            }
            onLayoutChange={
              handleDesignerLayoutChange
            }
          />
        }
        previewPanel={
          <NavigationPreviewPanel
            menu={
              menu
            }
            items={
              localItems
            }
            selectedItem={
              selectedItem
            }
            onSelectItem={
              handleSelectItem
            }
          />
        }
        inspectorPanel={
          <InspectorHost
          selectedItem={
            selectedItem
          }
          onEdit={
            openEdit
          }
          onSavePromotion={
            handlePromotionInspectorSave
          }
          isSavingPromotion={
            isUpdating
          }
        />
        }
      />

      <NavigationItemModal
        isOpen={
          isItemModalOpen
        }
        item={
          editingItem
        }
        parentItem={
          parentItem
        }
        maxColumns={
          maxColumns
        }
        isSaving={
          isCreating ||
          isUpdating
        }
        onClose={
          closeModal
        }
        onSubmit={
          handleSubmit
        }
      />
    </>
  );
}

function NavigationDragOverlay({
  item,
}: {
  item:
    NavigationItem;
}) {
  return (
    <div className="flex min-w-[280px] items-center gap-3 rounded-xl border border-[#babfc3] bg-white px-4 py-3 shadow-2xl">
      <GripVertical
        size={
          18
        }
        className="text-[#8c9196]"
      />

      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {item.label}
        </p>

        <p className="mt-0.5 text-xs text-[#6d7175]">
          {formatItemType(
            item.itemType
          )}
        </p>
      </div>
    </div>
  );
}

function parseDropTarget(
  id:
    string
): ParsedDropTarget | null {
  if (
    id ===
    "root-end"
  ) {
    return {
      mode:
        "ROOT_END",

      targetItemId:
        null,
    };
  }

  const separatorIndex =
    id.indexOf(
      ":"
    );

  if (
    separatorIndex <
    0
  ) {
    return null;
  }

  const prefix =
    id.slice(
      0,
      separatorIndex
    );

  const targetItemId =
    id.slice(
      separatorIndex +
        1
    );

  if (
    !targetItemId
  ) {
    return null;
  }

  if (
    prefix ===
    "before"
  ) {
    return {
      mode:
        "BEFORE",

      targetItemId,
    };
  }

  if (
    prefix ===
    "inside"
  ) {
    return {
      mode:
        "INSIDE",

      targetItemId,
    };
  }

  if (
    prefix ===
    "after"
  ) {
    return {
      mode:
        "AFTER",

      targetItemId,
    };
  }

  return null;
}

function removeItemFromTree(
  items:
    NavigationItem[],
  itemId:
    string
): RemovedTreeResult {
  let removed:
    NavigationItem | null =
    null;

  const tree =
    items.flatMap(
      (
        item
      ) => {
        if (
          item.id ===
          itemId
        ) {
          removed =
            item;

          return [];
        }

        const childResult =
          removeItemFromTree(
            item.children ||
              [],
            itemId
          );

        if (
          childResult.removed &&
          !removed
        ) {
          removed =
            childResult.removed;
        }

        return [
          {
            ...item,

            children:
              childResult.tree,
          },
        ];
      }
    );

  return {
    tree,
    removed,
  };
}

function insertInsideItem(
  items:
    NavigationItem[],
  targetItemId:
    string,
  draggedItem:
    NavigationItem
): NavigationItem[] {
  return items.map(
    (
      item
    ) => {
      if (
        item.id ===
        targetItemId
      ) {
        const childDepth =
          item.depth +
          1;

        return {
          ...item,

          children: [
            ...(item.children ||
              []),

            updateParentRecursively(
              draggedItem,
              item.id,
              childDepth
            ),
          ],
        };
      }

      return {
        ...item,

        children:
          insertInsideItem(
            item.children ||
              [],
            targetItemId,
            draggedItem
          ),
      };
    }
  );
}

function insertBesideItem(
  items:
    NavigationItem[],
  targetItemId:
    string,
  draggedItem:
    NavigationItem,
  mode:
    | "BEFORE"
    | "AFTER"
): NavigationItem[] {
  const targetIndex =
    items.findIndex(
      (
        item
      ) =>
        item.id ===
        targetItemId
    );

  if (
    targetIndex >=
    0
  ) {
    const targetItem =
      items[
        targetIndex
      ];

    const preparedDraggedItem =
      updateParentRecursively(
        draggedItem,
        targetItem.parentId,
        targetItem.depth
      );

    const nextItems = [
      ...items,
    ];

    nextItems.splice(
      mode ===
      "BEFORE"
        ? targetIndex
        : targetIndex +
            1,
      0,
      preparedDraggedItem
    );

    return nextItems;
  }

  return items.map(
    (
      item
    ) => ({
      ...item,

      children:
        insertBesideItem(
          item.children ||
            [],
          targetItemId,
          draggedItem,
          mode
        ),
    })
  );
}

function updateParentRecursively(
  item:
    NavigationItem,
  parentId:
    string | null,
  depth:
    number
): NavigationItem {
  return {
    ...item,

    parentId,

    depth,

    children:
      (
        item.children ||
        []
      ).map(
        (
          child
        ) =>
          updateParentRecursively(
            child,
            item.id,
            depth +
              1
          )
      ),
  };
}

function normalizeTree(
  items:
    NavigationItem[],
  parentId:
    string | null =
      null,
  depth =
    0
): NavigationItem[] {
  return items.map(
    (
      item,
      index
    ) => ({
      ...item,

      parentId,

      depth,

      displayOrder:
        (index +
          1) *
        10,

      children:
        normalizeTree(
          item.children ||
            [],
          item.id,
          depth +
            1
        ),
    })
  );
}

function applyDesignerLayout({
  tree,
  parentItemId,
  layout,
}: {
  tree:
    NavigationItem[];

  parentItemId:
    string;

  layout:
    NavigationDesignerLayoutItem[];
}): NavigationItem[] {
  const layoutMap =
    new Map(
      layout.map(
        (
          layoutItem,
          index
        ) => [
          layoutItem.id,
          {
            columnNumber:
              layoutItem.columnNumber,

            index,
          },
        ]
      )
    );

  const updateItems = (
    items:
      NavigationItem[]
  ): NavigationItem[] =>
    items.map(
      (
        item
      ) => {
        if (
          item.id ===
          parentItemId
        ) {
          const currentChildren =
            item.children ||
            [];

          const regularItems =
            currentChildren.filter(
              (
                child
              ) =>
                child.itemType !==
                "PROMOTION"
            );

          const promotionItems =
            currentChildren.filter(
              (
                child
              ) =>
                child.itemType ===
                "PROMOTION"
            );

          const regularItemMap =
            new Map(
              regularItems.map(
                (
                  child
                ) => [
                  child.id,
                  child,
                ]
              )
            );

          const orderedRegularItems:
            NavigationItem[] =
            [];

          for (
            const layoutItem of
            layout
          ) {
            const child =
              regularItemMap.get(
                layoutItem.id
              );

            if (
              !child
            ) {
              continue;
            }

            orderedRegularItems.push({
              ...child,

              columnNumber:
                layoutItem.columnNumber,
            });

            regularItemMap.delete(
              layoutItem.id
            );
          }

          const missingRegularItems =
            Array.from(
              regularItemMap.values()
            );

          return {
            ...item,

            children: [
              ...orderedRegularItems,
              ...missingRegularItems,
              ...promotionItems,
            ],
          };
        }

        return {
          ...item,

          children:
            updateItems(
              item.children ||
                []
            ),
        };
      }
    );

  void layoutMap;

  return normalizeTree(
    updateItems(
      tree
    )
  );
}

function buildReorderPayload(
  tree:
    NavigationItem[]
): ReorderNavigationItem[] {
  const result:
    ReorderNavigationItem[] =
    [];

  const walk = (
    items:
      NavigationItem[],
    parentId:
      string | null
  ) => {
    items.forEach(
      (
        item,
        index
      ) => {
        result.push({
          id:
            item.id,

          parentId,

          displayOrder:
            (index +
              1) *
            10,

          columnNumber:
            item.columnNumber ||
            1,
        });

        walk(
          item.children ||
            [],
          item.id
        );
      }
    );
  };

  walk(
    tree,
    null
  );

  return result;
}

function findItemById(
  items:
    NavigationItem[],
  itemId:
    string
): NavigationItem | null {
  for (
    const item of
    items
  ) {
    if (
      item.id ===
      itemId
    ) {
      return item;
    }

    const foundChild =
      findItemById(
        item.children ||
          [],
        itemId
      );

    if (
      foundChild
    ) {
      return foundChild;
    }
  }

  return null;
}

function flattenItems(
  items:
    NavigationItem[]
): NavigationItem[] {
  return items.flatMap(
    (
      item
    ) => [
      item,

      ...flattenItems(
        item.children ||
          []
      ),
    ]
  );
}

function containsItem(
  parentItem:
    NavigationItem,
  childItemId:
    string
): boolean {
  if (
    !childItemId
  ) {
    return false;
  }

  return (
    parentItem.children ||
    []
  ).some(
    (
      child
    ) =>
      child.id ===
        childItemId ||
      containsItem(
        child,
        childItemId
      )
  );
}

function findCreatedNavigationItem(
  items:
    NavigationItem[],
  values:
    NavigationItemFormValues
): NavigationItem | null {
  const candidates =
    flattenItems(
      items
    ).filter(
      (
        item
      ) =>
        item.label ===
          values.label &&
        item.parentId ===
          values.parentId &&
        item.itemType ===
          values.itemType &&
        Number(
          item.columnNumber ||
            1
        ) ===
          Number(
            values.columnNumber ||
              1
          )
    );

  if (
    candidates.length ===
    0
  ) {
    return findNewestNavigationItem(
      items
    );
  }

  return [
    ...candidates,
  ].sort(
    (
      first,
      second
    ) =>
      new Date(
        second.createdAt
      ).getTime() -
      new Date(
        first.createdAt
      ).getTime()
  )[0];
}

function findNewestNavigationItem(
  items:
    NavigationItem[]
): NavigationItem | null {
  const flattened =
    flattenItems(
      items
    );

  if (
    flattened.length ===
    0
  ) {
    return null;
  }

  return [
    ...flattened,
  ].sort(
    (
      first,
      second
    ) =>
      new Date(
        second.createdAt
      ).getTime() -
      new Date(
        first.createdAt
      ).getTime()
  )[0];
}

function formatItemType(
  value:
    string
): string {
  return value
    .replaceAll(
      "_",
      " "
    )
    .toLowerCase()
    .replace(
      /\b\w/g,
      (
        character
      ) =>
        character.toUpperCase()
    );
}

function getErrorMessage(
  error:
    unknown,
  fallback:
    string
): string {
  if (
    typeof error ===
      "object" &&
    error !==
      null &&
    "data" in
      error
  ) {
    const data = (
      error as {
        data?: {
          message?:
            string;

          error?: {
            message?:
              string;
          };
        };
      }
    ).data;

    return (
      data?.message ||
      data?.error
        ?.message ||
      fallback
    );
  }

  if (
    error instanceof
    Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
}



function getDesignerRootItem(
  items:
    NavigationItem[],
  selectedItemId:
    string | null
): NavigationItem | null {
  if (!selectedItemId) {
    return (
      items[0] ||
      null
    );
  }

  for (
    const rootItem of
    items
  ) {
    if (
      rootItem.id ===
      selectedItemId
    ) {
      return rootItem;
    }

    if (
      containsItem(
        rootItem,
        selectedItemId
      )
    ) {
      return rootItem;
    }
  }

  return (
    items[0] ||
    null
  );
}