"use client";

import { useState, useMemo } from "react";
import type { Property } from "../types";
import StatusBadge from "../StatusBadge";
import ApprovePropertyButton from "../ApprovePropertyButton";
import RejectPropertyButton from "../RejectPropertyButton";
import DeletePropertyAdminButton from "../DeletePropertyAdminButton";

interface PropertyModerationProps {
  properties: Property[];
}

export default function PropertyModeration({ properties }: PropertyModerationProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return properties.filter((property) => {
      const matchesSearch = !search || property.title?.toLowerCase().includes(search.toLowerCase()) || property.location?.toLowerCase().includes(search.toLowerCase()) || property.city?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || property.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [properties, search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-[var(--brand-text)]">Property Moderation</h2>
            <p className="text-sm text-[var(--brand-muted)]">{properties.length} total properties</p>
          </div>
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
        <div className="space-y-3">
          {filtered.map((property) => (
            <div key={property.id} className="card overflow-hidden">
              <div className="p-5">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[var(--brand-text)]">{property.title}</p>
                      <StatusBadge status={property.status} />
                    </div>
                    <p className="text-sm text-[var(--brand-muted)]">
                      ₹{property.rent}/month · {property.location}, {property.city}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <ApprovePropertyButton propertyId={property.id} />
                    <RejectPropertyButton propertyId={property.id} />
                    <DeletePropertyAdminButton propertyId={property.id} propertyTitle={property.title || undefined} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-orange-50 text-3xl text-[var(--brand-primary)]">🏠</div>
          <h3 className="mt-4 text-xl font-extrabold text-[var(--brand-text)]">No properties found</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--brand-muted)]">
            {search || statusFilter !== "all" ? "Try adjusting your search or filters." : "No properties in the system."}
          </p>
        </div>
      )}
    </div>
  );
}
