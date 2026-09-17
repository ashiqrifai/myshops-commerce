import { Suspense } from "react";
import TabbyCancelClient from "./TabbyCancelClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="py-24 text-center">Loading…</div>}>
      <TabbyCancelClient />
    </Suspense>
  );
}
