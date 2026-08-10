"use client";

import Link from "next/link";

import {
  CirclePlus,
  FolderTree,
  RefreshCw,
} from "lucide-react";

interface CategoryHeaderProps {
  totalCategories: number;
  rootCategories: number;
  activeCategories: number;
  inactiveCategories: number;

  isRefreshing?: boolean;

  onRefresh:
    () => void;
}

export default function CategoryHeader({
  totalCategories,
  rootCategories,
  activeCategories,
  inactiveCategories,
  isRefreshing = false,
  onRefresh,
}: CategoryHeaderProps) {
  return (
    <>
      <header>
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm text-[#6d7175]">
              Catalogue
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#202223]">
              Categories
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#6d7175]">
              Manage the category
              hierarchy used by the
              website, kiosk,
              navigation menus and
              product catalogue.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={
                onRefresh
              }
              disabled={
                isRefreshing
              }
              className="flex h-10 items-center gap-2 rounded-lg border border-[#babfc3] bg-white px-4 text-sm font-medium text-[#202223] shadow-sm hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  isRefreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

            <Link
              href="/admin/categories/new"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#303030] px-4 text-sm font-semibold text-white shadow-sm hover:bg-[#1a1a1a]"
            >
              <CirclePlus
                size={16}
              />

              Add category
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total categories"
          value={
            totalCategories
          }
          icon={
            <FolderTree
              size={18}
            />
          }
        />

        <SummaryCard
          label="Root categories"
          value={
            rootCategories
          }
        />

        <SummaryCard
          label="Active"
          value={
            activeCategories
          }
          valueClassName="text-[#1f6f1f]"
        />

        <SummaryCard
          label="Inactive"
          value={
            inactiveCategories
          }
          valueClassName="text-[#a23b2a]"
        />
      </section>
    </>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;

  icon?:
    React.ReactNode;

  valueClassName?:
    string;
}

function SummaryCard({
  label,
  value,
  icon,
  valueClassName = "",
}: SummaryCardProps) {
  return (
    <section className="rounded-2xl border border-[#e1e3e5] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-[#6d7175]">
          {label}
        </p>

        {icon && (
          <div className="text-[#6d7175]">
            {icon}
          </div>
        )}
      </div>

      <p
        className={[
          "mt-3 text-2xl font-semibold tracking-tight",
          valueClassName,
        ].join(" ")}
      >
        {value}
      </p>
    </section>
  );
}