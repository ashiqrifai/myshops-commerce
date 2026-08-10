"use client";

import {
  FolderTree,
} from "lucide-react";

import StudioInspector from "./StudioInspector";
import HeadingInspector from "./HeadingInspector";
import NavigationInspector from "./NavigationInspector";
import PromotionInspector, {
  type PromotionInspectorDraft,
} from "./PromotionInspector";

import type {
  NavigationItem,
} from "@/types/navigation";

interface InspectorHostProps {
  selectedItem:
    NavigationItem | null;

  onEdit: (
    item: NavigationItem
  ) => void;

  onSavePromotion: (
    item: NavigationItem,
    draft: PromotionInspectorDraft
  ) => Promise<void> | void;

  isSavingPromotion?: boolean;
  onClose?: () => void;
}

export default function InspectorHost({
  selectedItem,
  onEdit,
  onSavePromotion,
  isSavingPromotion = false,
  onClose,
}: InspectorHostProps) {
  if (!selectedItem) {
    return (
      <StudioInspector
        title="Inspector"
        subtitle="Select an item in the tree, designer or preview."
        onClose={
          onClose
        }
      >
        <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-[#c9cccf] bg-white p-8 text-center">
          <div>
            <FolderTree
              size={28}
              className="mx-auto text-[#8c9196]"
            />

            <p className="mt-4 text-sm font-semibold">
              Nothing selected
            </p>

            <p className="mt-2 text-xs leading-5 text-[#6d7175]">
              Choose a navigation item to inspect and edit its settings.
            </p>
          </div>
        </div>
      </StudioInspector>
    );
  }

  if (
    selectedItem.itemType ===
    "PROMOTION"
  ) {
    return (
      <PromotionInspector
        item={
          selectedItem
        }
        onEdit={
          onEdit
        }
        onSave={
          onSavePromotion
        }
        isSaving={
          isSavingPromotion
        }
        onClose={
          onClose
        }
      />
    );
  }

  if (
    selectedItem.itemType ===
    "HEADING"
  ) {
    return (
      <HeadingInspector
        item={
          selectedItem
        }
        onEdit={
          onEdit
        }
        onClose={
          onClose
        }
      />
    );
  }

  return (
    <NavigationInspector
      item={
        selectedItem
      }
      onEdit={
        onEdit
      }
      onClose={
        onClose
      }
    />
  );
}