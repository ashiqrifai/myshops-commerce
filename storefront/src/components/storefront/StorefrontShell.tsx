import type {
  ReactNode,
} from "react";

import type {
  StorefrontData,
} from "@/types/storefront";

import {
  buildStorefrontThemeVariables,
} from "@/lib/storefront/storefront-theme";

import StorefrontAiAssistant from "@/components/storefront/ai/StorefrontAiAssistant";

interface StorefrontShellProps {
  storefront:
    StorefrontData;

  children:
    ReactNode;
}

export default function StorefrontShell({
  storefront,
  children,
}: StorefrontShellProps) {
  const themeVariables =
    buildStorefrontThemeVariables(
      storefront.settings
        .theme
    );

  const aiEnabled =
    storefront.settings
      .website
      ?.aiAssistantEnabled !==
    false;

  return (
    <div
      style={
        themeVariables
      }
      className="storefront-root flex min-h-screen flex-col"
    >
      {children}

      {aiEnabled ? (
        <StorefrontAiAssistant
          storefront={
            storefront
          }
        />
      ) : null}
    </div>
  );
}
