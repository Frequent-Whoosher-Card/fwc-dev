"use client";

import { useState, useEffect } from "react";
import { CardSwapService, SwapRequest } from "@/lib/services/card-swap.service";
import axios from "@/lib/axios";

interface Station {
  id: string;
  stationCode: string;
  stationName: string;
}

interface CardProduct {
  id: string;
  category: { categoryName: string };
  type: { typeName: string };
}

interface PurchaseData {
  id: string;
  edcReferenceNumber: string;
  purchaseDate: string;
  price: number;
  card: {
    id: string;
    serialNumber: string;
    status: string;
    cardProduct: {
      category: { categoryName: string };
      type: { typeName: string };
    };
  };
  member: {
    name: string;
    identityNumber: string;
  } | null;
  station: {
    stationCode: string;
    stationName: string;
  };
}

export default function CardSwapPage() {
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stations, setStations] = useState<Station[]>([]);
  const [products, setProducts] = useState<CardProduct[]>([]);

  // Form state
  const [serialNumber, setSerialNumber] = useState("");
  const [targetStationId, setTargetStationId] = useState("");
  const [expectedProductId, setExpectedProductId] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseId, setPurchaseId] = useState("");
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);

  useEffect(() => {
    loadSwapRequests();
    loadStations();
    loadProducts();
  }, []);

  const loadSwapRequests = async () => {
    try {
      setLoading(true);
      const response = await CardSwapService.getSwapRequests({
        page: 1,
        limit: 50,
      });
      setSwapRequests(response.data.items || []);
    } catch (error) {
      console.error("Error loading swap requests:", error);
      alert("Gagal memuat data swap request");
    } finally {
      setLoading(false);
    }
  };

  const loadStations = async () => {
    try {
      const response = await axios.get("/station");
      setStations(response.data.data?.items || []);
    } catch (error) {
      console.error("Error loading stations:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get("/card/product");
      // Backend returns { success: true, data: [...] } directly
      setProducts(Array.isArray(response.data.data) ? response.data.data : []);
    } catch (error) {
      console.error("Error loading products:", error);
    }
  };

  const searchPurchase = async () => {
    if (!serialNumber) {
      alert("Masukkan serial number kartu");
      return;
    }

    try {
      const response = await axios.get(
        `/purchases/serial/${encodeURIComponent(serialNumber)}`
      );
      const purchase = response.data.data;

      if (purchase) {
        setPurchaseId(purchase.id);
        setPurchaseData(purchase);
      } else {
        alert("Purchase tidak ditemukan");
        setPurchaseData(null);
      }
    } catch (error: any) {
      console.error("Error searching purchase:", error);
      alert(error.response?.data?.error?.message || "Gagal mencari purchase");
      setPurchaseData(null);
    }
  };

  const handleCreateSwap = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!purchaseId || !targetStationId || !expectedProductId || !reason) {
      alert("Mohon lengkapi semua field yang required");
      return;
    }

    try {
      setLoading(true);
      await CardSwapService.createSwapRequest({
        purchaseId,
        targetStationId,
        expectedProductId,
        reason,
        notes: notes || undefined,
      });

      alert("Swap request berhasil dibuat");
      setShowCreateModal(false);
      resetForm();
      loadSwapRequests();
    } catch (error: any) {
      console.error("Error creating swap request:", error);
      alert(
        error.response?.data?.error?.message || "Gagal membuat swap request"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSwap = async (id: string) => {
    if (!confirm("Yakin ingin membatalkan swap request ini?")) return;

    try {
      await CardSwapService.cancelSwapRequest(id);
      alert("Swap request berhasil dibatalkan");
      loadSwapRequests();
    } catch (error: any) {
      console.error("Error canceling swap:", error);
      alert(
        error.response?.data?.error?.message || "Gagal membatalkan swap request"
      );
    }
  };

  const resetForm = () => {
    setSerialNumber("");
    setTargetStationId("");
    setExpectedProductId("");
    setReason("");
    setNotes("");
    setPurchaseId("");
    setPurchaseData(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Card Swap Request</h2>
          <p className="text-gray-600">
            Pengajuan penukaran kartu antar stasiun
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Buat Request Baru
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
                Serial Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Dari → Ke
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Produk Diharapkan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tanggal
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
                  Belum ada swap request
                </td>
              </tr>
            ) : (
              swapRequests.map((swap) => (
                <tr key={swap.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {swap.purchase.edcReferenceNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {swap.purchase.card.serialNumber}
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
                    {swap.expectedProduct?.category?.categoryName || "N/A"} -{" "}
                    {swap.expectedProduct?.type?.typeName || "N/A"}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(swap.requestedAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {swap.status === "PENDING_APPROVAL" && (
                      <button
                        onClick={() => handleCancelSwap(swap.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Batalkan
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Buat Swap Request Baru</h3>

            <form onSubmit={handleCreateSwap} className="space-y-4">
              {/* Search Purchase */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari Purchase (Serial Number Kartu)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Masukkan serial number kartu (misal: 01122600003)"
                  />
                  <button
                    type="button"
                    onClick={searchPurchase}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                  >
                    Cari
                  </button>
                </div>
                {purchaseData && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <p className="font-semibold text-green-800 mb-2">
                      ✓ Purchase ditemukan
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-gray-700">
                      <div>
                        <span className="text-gray-500">Serial Number:</span>
                        <p className="font-medium">
                          {purchaseData.card.serialNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Produk Saat Ini:</span>
                        <p className="font-medium">
                          {purchaseData.card.cardProduct.category.categoryName}{" "}
                          - {purchaseData.card.cardProduct.type.typeName}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Member:</span>
                        <p className="font-medium">
                          {purchaseData.member?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Stasiun Asal:</span>
                        <p className="font-medium">
                          {purchaseData.station.stationName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Target Station */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stasiun Tujuan *
                </label>
                <select
                  value={targetStationId}
                  onChange={(e) => setTargetStationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Pilih stasiun</option>
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.stationCode} - {station.stationName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Expected Product */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Produk yang Diharapkan *
                </label>
                <select
                  value={expectedProductId}
                  onChange={(e) => setExpectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Pilih produk</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.category.categoryName} - {product.type.typeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alasan Swap *
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Misal: Salah memberikan kartu Jaka Gold, seharusnya Jaban Gold"
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan Tambahan
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Catatan opsional"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading || !purchaseId}
                >
                  {loading ? "Memproses..." : "Buat Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
