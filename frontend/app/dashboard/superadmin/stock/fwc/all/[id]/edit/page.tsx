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
  const [card, setCard] = useState<any>(null);
  const [status, setStatus] = useState<string>("IN_STATION");
  const [note, setNote] = useState<string>("");

  // Fetch card details on mount
  useEffect(() => {
    if (!id) return;
    const fetchCard = async () => {
      try {
        const res = await axiosInstance.get(`/cards/${id}`);
        const cardData = res.data?.data;
        setCard(cardData);
        setStatus(cardData?.status ?? "IN_STATION");
        setNote(cardData?.notes ?? "");
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
      // Return to the list view (FWC)
      router.push("/dashboard/superadmin/stock/fwc/all");
    } catch (err) {
      toast.error("Failed to update card");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading card...</div>;
  }

  if (!card) {
    return (
      <div className="p-6 text-red-500">Card not found or failed to load.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 border rounded-md hover:bg-gray-100"
        >
          ←
        </button>
        <h2 className="text-2xl font-semibold">Edit FWC Card</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* READ ONLY DETAILS */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="font-medium text-gray-700 border-b pb-2">
            Card Details
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-gray-500 text-xs">
                Serial Number
              </label>
              <div className="font-mono font-medium">{card.serialNumber}</div>
            </div>
            <div>
              <label className="block text-gray-500 text-xs">
                Program Type
              </label>
              <div className="font-medium">
                {card.cardProduct?.programType || "FWC"}
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-xs">Category</label>
              <div className="font-medium">
                {card.cardProduct?.category?.categoryName || "-"}
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-xs">Type</label>
              <div className="font-medium">
                {card.cardProduct?.type?.typeName || "-"}
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-xs">
                Origin Station
              </label>
              <div className="font-medium">
                {card.previousStation?.stationName || "-"}
              </div>
            </div>
            <div>
              <label className="block text-gray-500 text-xs">
                Current Station
              </label>
              <div className="font-medium">
                {card.station?.stationName || "-"}
              </div>
            </div>
          </div>
        </div>

        {/* EDITABLE FORM */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4 h-fit">
          <h3 className="font-medium text-gray-700 border-b pb-2">
            Update Status
          </h3>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-gray-50"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Current Status: {card.status}
            </p>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="w-full border rounded px-3 py-2"
              placeholder="Add notes here..."
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-[#8D1231] text-white rounded-lg hover:bg-[#a6153a] transition w-full"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
