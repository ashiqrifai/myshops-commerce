export default function AddressSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({
        length:
          4,
      }).map(
        (
          _,
          index
        ) => (
          <div
            key={
              index
            }
            className="animate-pulse rounded-[20px] border border-storefront bg-storefront-surface p-5"
          >
            <div className="h-10 w-10 rounded-xl bg-storefront-secondary" />

            <div className="mt-4 h-5 w-32 rounded bg-storefront-secondary" />

            <div className="mt-3 h-4 w-48 rounded bg-storefront-secondary" />

            <div className="mt-2 h-4 w-56 rounded bg-storefront-secondary" />

            <div className="mt-6 flex gap-2">
              <div className="h-9 w-20 rounded-lg bg-storefront-secondary" />
              <div className="h-9 w-20 rounded-lg bg-storefront-secondary" />
            </div>
          </div>
        )
      )}
    </div>
  );
}
