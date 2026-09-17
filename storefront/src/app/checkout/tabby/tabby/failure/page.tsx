import { Suspense } from "react";
import TabbyFailureClient from "./TabbyFailureClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
      <TabbyFailureClient />
    </Suspense>
  );
}
