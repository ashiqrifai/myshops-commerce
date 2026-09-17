import { Suspense } from "react";
import TabbySuccessClient from "./TabbySuccessClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
      <TabbySuccessClient />
    </Suspense>
  );
}
