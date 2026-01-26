"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

// Define possible status values (same as backend enum)
const STATUS_OPTIONS = [
  "ON_REQUEST",
  "IN_OFFICE",
  "IN_TRANSIT",
  "IN_STATION",
  "LOST",
  "DAMAGED",
  "SOLD_ACTIVE",
  "SOLD_INACTIVE",
];

export default function EditCardPage() {
  const router = useRouter();
  const params = useParams(); // expects { id: string }
  const id =
    typeof params === "object" && params !== null ? (params as any).id : "";

  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("IN_STATION");
  const [note, setNote] = useState<string>("");

  // Fetch card details on mount
  useEffect(() => {
    if (!id) return;
    const fetchCard = async () => {
      try {
        const res = await axiosInstance.get(`/cards/${id}`);
        const card = res.data?.data;
        setStatus(card?.status ?? "IN_STATION");
        setNote(card?.notes ?? "");
      } catch (err) {
        toast.error("Failed to load card data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await axiosInstance.patch(`/cards/${id}`, { status, notes: note });
      toast.success("Card updated successfully");
      // Return to the list view
      router.push("/dashboard/superadmin/stock/fwc/all");
    } catch (err) {
      toast.error("Failed to update card");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading card...</div>;
  }

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-4">Edit Card</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full border rounded px-3 py-2"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Note</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-[#8D1231] text-white rounded hover:bg-[#a6153a] transition"
        >
          Save
        </button>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
