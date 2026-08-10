  "use client";

  import Link from "next/link";

  import {
    useParams,
  } from "next/navigation";

  import {
    ArrowLeft,
    ChevronRight,
    ExternalLink,
    LoaderCircle,
    Pencil,
  } from "lucide-react";

  import NavigationBuilder from "@/components/admin/navigation/NavigationBuilder";

  import {
    useGetNavigationMenuByIdQuery,
  } from "@/store/api/navigationApi";

  export default function NavigationBuilderPage() {
    const params =
      useParams<{
        id: string;
      }>();

    const menuId =
      params.id;

    const {
      data,
      isLoading,
      isFetching,
      isError,
      refetch,
    } =
      useGetNavigationMenuByIdQuery(
        menuId,
        {
          skip:
            !menuId,
        }
      );

    const menu =
      data?.data;

    if (isLoading) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7]">
          <div className="text-center">
            <LoaderCircle className="mx-auto animate-spin" />

            <p className="mt-3 text-sm text-[#6d7175]">
              Loading navigation
              builder...
            </p>
          </div>
        </main>
      );
    }

    if (
      isError ||
      !menu
    ) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-[#f6f6f7] p-6">
          <div className="rounded-2xl border border-[#e1e3e5] bg-white p-8 text-center">
            <h1 className="text-lg font-semibold">
              Navigation menu not
              found
            </h1>

            <Link
              href="/admin/cms/navigation"
              className="mt-5 inline-flex h-10 items-center rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
            >
              Return to navigation
            </Link>
          </div>
        </main>
      );
    }

    return (
      <main className="min-h-screen bg-[#f6f6f7]">
        <div className="mx-auto w-full max-w-[1500px] px-5 py-6 md:px-8">
          <header>
            <Link
              href="/admin/cms/navigation"
              className="inline-flex items-center gap-2 text-sm font-medium text-[#6d7175] hover:text-[#303030]"
            >
              <ArrowLeft
                size={16}
              />

              Navigation menus
            </Link>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#6d7175]">
              <span>CMS</span>

              <ChevronRight
                size={14}
              />

              <span>
                Navigation
              </span>

              <ChevronRight
                size={14}
              />

              <span>
                {menu.name}
              </span>
            </div>

            <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {menu.name}
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
                    {menu.channel}
                  </span>

                  <span className="rounded-full bg-[#f1f2f3] px-2.5 py-1 text-xs font-medium">
                    {menu.menuType}
                  </span>

                  <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 font-mono text-xs text-[#005bd3]">
                    {menu.code}
                  </span>

                  <span
                    className={[
                      "rounded-full px-2.5 py-1 text-xs font-medium",
                      menu.isActive
                        ? "bg-[#e3f1df] text-[#1f6f1f]"
                        : "bg-[#fbeae5] text-[#a23b2a]",
                    ].join(" ")}
                  >
                    {menu.isActive
                      ? "Active"
                      : "Inactive"}
                  </span>
                </div>

                {menu.description && (
                  <p className="mt-3 max-w-3xl text-sm text-[#6d7175]">
                    {
                      menu.description
                    }
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    refetch()
                  }
                  disabled={
                    isFetching
                  }
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium disabled:opacity-50"
                >
                  {isFetching && (
                    <LoaderCircle
                      size={15}
                      className="animate-spin"
                    />
                  )}

                  Refresh
                </button>

                <Link
                  href={`/admin/cms/navigation/${menu.id}/edit`}
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium"
                >
                  <Pencil
                    size={15}
                  />

                  Edit settings
                </Link>

                <a
                  href={`http://localhost:5080/api/v1/public/navigation/${menu.code}?companyCode=MYSHOPS&channel=${menu.channel === "BOTH" ? "WEBSITE" : menu.channel}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white"
                >
                  <ExternalLink
                    size={15}
                  />

                  Preview JSON
                </a>
              </div>
            </div>
          </header>

          <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
            <NavigationBuilder
              menu={
                menu
              }
            />

            <aside className="space-y-4">
              <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5">
                <h2 className="text-sm font-semibold">
                  Menu summary
                </h2>

                <dl className="mt-4 space-y-3 text-sm">
                  <SummaryRow
                    label="Top-level items"
                    value={String(
                      menu.items
                        ?.length ||
                        0
                    )}
                  />

                  <SummaryRow
                    label="Maximum columns"
                    value={String(
                      menu.settings
                        ?.maxColumns ||
                        4
                    )}
                  />

                  <SummaryRow
                    label="Desktop enabled"
                    value={
                      menu.settings
                        ?.desktopEnabled ===
                      false
                        ? "No"
                        : "Yes"
                    }
                  />

                  <SummaryRow
                    label="Mobile enabled"
                    value={
                      menu.settings
                        ?.mobileEnabled ===
                      false
                        ? "No"
                        : "Yes"
                    }
                  />
                </dl>
              </section>

              <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5">
                <h2 className="text-sm font-semibold">
                  CMS usage
                </h2>

                <p className="mt-2 text-sm text-[#6d7175]">
                  CMS Navigation sections
                  can select this menu by
                  storing its menu ID.
                </p>

                <div className="mt-4 rounded-lg bg-[#f6f6f7] p-3">
                  <p className="text-xs text-[#6d7175]">
                    Menu ID
                  </p>

                  <p className="mt-1 break-all font-mono text-xs">
                    {menu.id}
                  </p>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>
    );
  }

  interface SummaryRowProps {
    label: string;
    value: string;
  }

  function SummaryRow({
    label,
    value,
  }: SummaryRowProps) {
    return (
      <div className="flex items-center justify-between gap-4">
        <dt className="text-[#6d7175]">
          {label}
        </dt>

        <dd className="font-medium">
          {value}
        </dd>
      </div>
    );
  }