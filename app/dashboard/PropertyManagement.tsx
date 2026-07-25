"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Property } from "../types";
import PropertyCard from "../PropertyCard";
import StatusBadge from "../StatusBadge";

interface PropertyManagementProps {
  initialProperties: Property[];
  totalProperties: number;
}

export default function PropertyManagement({ initialProperties, totalProperties }: PropertyManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return initialProperties.filter((p) => {
      const matchesSearch = !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.location?.toLowerCase().includes(search.toLowerCase()) || p.city?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [initialProperties, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Property Management</h2>
            <p className="text-sm text-[var(--brand-muted)]">{totalProperties} total properties</p>
          </div>
          <Link href="/add-property" className="btn-primary">+ Add Property</Link>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input flex-1"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input sm:w-48"
          >
            <option value="all">All Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              actions={
                <div className="flex flex-col gap-1">
                  <span className="absolute right-3 top-3 z-10">
                    <StatusBadge status={property.status} />
                  </span>
                  <Link
                    href={`/edit-property/${property.id}`}
                    className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-200"
                  >
                    Edit
                  </Link>
                </div>
              }
            />
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">🏠</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No properties found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "Add your first property to start receiving leads."}
          </p>
          {!search && statusFilter === "all" && (
            <Link href="/add-property" className="btn-primary mt-5">+ Add Property</Link>
          )}
        </div>
      )}
    </div>
  );
}
