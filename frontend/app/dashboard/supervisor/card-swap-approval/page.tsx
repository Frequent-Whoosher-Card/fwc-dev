"use client";

import { useState, useEffect } from "react";
import { CardSwapService, SwapRequest } from "@/lib/services/card-swap.service";

export default function CardSwapApprovalPage() {
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "all">("pending");

  useEffect(() => {
    loadSwapRequests();
  }, [activeTab]);

  const loadSwapRequests = async () => {
    try {
      setLoading(true);
      const params =
        activeTab === "pending"
          ? { status: "PENDING_APPROVAL", page: 1, limit: 50 }
          : { page: 1, limit: 50 };

      const response = await CardSwapService.getSwapRequests(params);
      setSwapRequests(response.data.items || []);
    } catch (error) {
      console.error("Error loading swap requests:", error);
      alert("Gagal memuat data swap request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSwap) return;

    try {
      setLoading(true);
      await CardSwapService.approveSwapRequest(
        selectedSwap.id,
        approvalNotes || undefined
      );
      alert("Swap request berhasil disetujui");
      setShowApproveModal(false);
      setSelectedSwap(null);
      setApprovalNotes("");
      loadSwapRequests();
    } catch (error: any) {
      console.error("Error approving swap:", error);
      alert(
        error.response?.data?.error?.message || "Gagal menyetujui swap request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedSwap || !rejectionReason) {
      alert("Alasan penolakan harus diisi");
      return;
    }

    try {
      setLoading(true);
      await CardSwapService.rejectSwapRequest(selectedSwap.id, rejectionReason);
      alert("Swap request berhasil ditolak");
      setShowRejectModal(false);
      setSelectedSwap(null);
      setRejectionReason("");
      loadSwapRequests();
    } catch (error: any) {
      console.error("Error rejecting swap:", error);
      alert(
        error.response?.data?.error?.message || "Gagal menolak swap request"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      PENDING_APPROVAL: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return badges[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Persetujuan Card Swap</h2>
        <p className="text-gray-600">
          Review dan setujui pengajuan penukaran kartu
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "pending"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Menunggu Persetujuan
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600 font-semibold"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Semua Request
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                EDC Reference
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dari → Ke
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Produk Diharapkan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Alasan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : swapRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Tidak ada swap request
                </td>
              </tr>
            ) : (
              swapRequests.map((swap) => (
                <tr key={swap.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {swap.purchase.edcReferenceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {swap.purchase.member?.name || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <span>{swap.sourceStation.stationCode}</span>
                      <span>→</span>
                      <span className="font-semibold">
                        {swap.targetStation.stationCode}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {swap.expectedProduct.category.categoryName} -{" "}
                    {swap.expectedProduct.type.typeName}
                  </td>
                  <td
                    className="px-6 py-4 text-sm max-w-xs truncate"
                    title={swap.reason}
                  >
                    {swap.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        swap.status
                      )}`}
                    >
                      {swap.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {swap.status === "PENDING_APPROVAL" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSwap(swap);
                            setShowApproveModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Setujui
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSwap(swap);
                            setShowRejectModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedSwap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Setujui Swap Request</h3>

            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">EDC Reference:</span>
                <span className="font-semibold">
                  {selectedSwap.purchase.edcReferenceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Serial Number:</span>
                <span className="font-semibold">
                  {selectedSwap.purchase.card.serialNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route:</span>
                <span className="font-semibold">
                  {selectedSwap.sourceStation.stationCode} →{" "}
                  {selectedSwap.targetStation.stationCode}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Produk:</span>
                <span className="font-semibold">
                  {selectedSwap.expectedProduct.category.categoryName} -{" "}
                  {selectedSwap.expectedProduct.type.typeName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Alasan:</span>
                <p className="font-semibold mt-1">{selectedSwap.reason}</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catatan Persetujuan (Opsional)
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Tambahkan catatan jika diperlukan"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setSelectedSwap(null);
                  setApprovalNotes("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleApprove}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Memproses..." : "Setujui"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedSwap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Tolak Swap Request</h3>

            <div className="space-y-3 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">EDC Reference:</span>
                <span className="font-semibold">
                  {selectedSwap.purchase.edcReferenceNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Serial Number:</span>
                <span className="font-semibold">
                  {selectedSwap.purchase.card.serialNumber}
                </span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alasan Penolakan *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Jelaskan alasan penolakan..."
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedSwap(null);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={loading || !rejectionReason}
              >
                {loading ? "Memproses..." : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
