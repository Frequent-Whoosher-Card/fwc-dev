"use client";

import { useState, useEffect } from "react";
import { CardSwapService, SwapRequest } from "@/lib/services/card-swap.service";
import axios from "@/lib/axios";

interface Card {
  id: string;
  serialNumber: string;
  status: string;
}

export default function CardSwapExecutePage() {
  const [approvedSwaps, setApprovedSwaps] = useState<SwapRequest[]>([]);
  const [availableCards, setAvailableCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSwap, setSelectedSwap] = useState<SwapRequest | null>(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [userStationId, setUserStationId] = useState("");

  useEffect(() => {
    loadUserStation();
  }, []);

  useEffect(() => {
    if (userStationId) {
      loadApprovedSwaps();
    }
  }, [userStationId]);

  const loadUserStation = async () => {
    try {
      // Get current user to know their station
      const response = await axios.get("/auth/me");
      const user = response.data.data;
      if (user.stationId) {
        setUserStationId(user.stationId);
      }
    } catch (error) {
      console.error("Error loading user station:", error);
    }
  };

  const loadApprovedSwaps = async () => {
    try {
      setLoading(true);
      const response = await CardSwapService.getSwapRequests({
        status: "APPROVED",
        targetStationId: userStationId,
        page: 1,
        limit: 50,
      });
      setApprovedSwaps(response.data.items || []);
    } catch (error) {
      console.error("Error loading approved swaps:", error);
      alert("Gagal memuat data swap yang disetujui");
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableCards = async (productId: string) => {
    try {
      // Load cards with IN_STATION status for the expected product
      const response = await axios.get("/cards", {
        params: {
          cardProductId: productId,
          status: "IN_STATION",
          stationId: userStationId,
          limit: 100,
        },
      });
      setAvailableCards(response.data.data || []);
    } catch (error) {
      console.error("Error loading available cards:", error);
      alert("Gagal memuat kartu yang tersedia");
    }
  };

  const handleOpenExecuteModal = async (swap: SwapRequest) => {
    setSelectedSwap(swap);
    await loadAvailableCards(swap.expectedProductId);
    setShowExecuteModal(true);
  };

  const handleExecuteSwap = async () => {
    if (!selectedSwap || !selectedCardId) {
      alert("Pilih kartu pengganti");
      return;
    }

    if (
      !confirm(
        "Yakin ingin mengeksekusi swap ini? Tindakan ini tidak dapat dibatalkan."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await CardSwapService.executeSwap(selectedSwap.id, selectedCardId);
      alert("Swap berhasil dieksekusi! Kartu telah diganti.");
      setShowExecuteModal(false);
      setSelectedSwap(null);
      setSelectedCardId("");
      loadApprovedSwaps();
    } catch (error: any) {
      console.error("Error executing swap:", error);
      alert(error.response?.data?.error?.message || "Gagal mengeksekusi swap");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Eksekusi Card Swap</h2>
        <p className="text-gray-600">
          Lakukan penukaran kartu yang telah disetujui
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Petunjuk Eksekusi Swap:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Pilih swap request yang sudah APPROVED</li>
              <li>Pilih kartu pengganti dari stok yang tersedia</li>
              <li>
                Sistem akan otomatis memproses: kembalikan kartu lama, update
                purchase, dan aktivasi kartu baru
              </li>
              <li>Serahkan kartu baru kepada member</li>
            </ul>
          </div>
        </div>
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
                Kartu Asli
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Produk Diharapkan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Alasan
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Disetujui
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
            ) : approvedSwaps.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  Tidak ada swap yang menunggu eksekusi
                </td>
              </tr>
            ) : (
              approvedSwaps.map((swap) => (
                <tr key={swap.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {swap.purchase.edcReferenceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <div className="font-medium">
                        {swap.purchase.member?.name || "N/A"}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {swap.purchase.member?.identityNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <div>
                      <div className="font-medium">
                        {swap.purchase.card.serialNumber}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {swap.purchase.card.cardProduct.category.categoryName} -{" "}
                        {swap.purchase.card.cardProduct.type.typeName}
                      </div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {swap.approvedAt
                      ? new Date(swap.approvedAt).toLocaleDateString("id-ID")
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleOpenExecuteModal(swap)}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                    >
                      Eksekusi
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Execute Modal */}
      {showExecuteModal && selectedSwap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              Eksekusi Swap: {selectedSwap.purchase.edcReferenceNumber}
            </h3>

            {/* Swap Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Member:</span>
                <span className="font-semibold">
                  {selectedSwap.purchase.member?.name || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Kartu Saat Ini:</span>
                <span className="font-semibold">
                  {selectedSwap.purchase.card.serialNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Produk Diharapkan:</span>
                <span className="font-semibold">
                  {selectedSwap.expectedProduct.category.categoryName} -{" "}
                  {selectedSwap.expectedProduct.type.typeName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stasiun Asal:</span>
                <span className="font-semibold">
                  {selectedSwap.sourceStation.stationName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Alasan Swap:</span>
                <p className="font-semibold mt-1">{selectedSwap.reason}</p>
              </div>
            </div>

            {/* Card Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Kartu Pengganti *
              </label>

              {availableCards.length === 0 ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                  <p className="font-semibold">⚠️ Tidak ada kartu tersedia</p>
                  <p className="mt-1">
                    Tidak ada kartu dengan status IN_STATION untuk produk yang
                    diharapkan.
                  </p>
                </div>
              ) : (
                <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                  {availableCards.map((card) => (
                    <label
                      key={card.id}
                      className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <input
                        type="radio"
                        name="replacementCard"
                        value={card.id}
                        checked={selectedCardId === card.id}
                        onChange={(e) => setSelectedCardId(e.target.value)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{card.serialNumber}</div>
                        <div className="text-xs text-gray-500">
                          Status: {card.status}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-2">
                Total tersedia: {availableCards.length} kartu
              </p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 font-semibold">
                ⚠️ Perhatian: Tindakan ini akan:
              </p>
              <ul className="text-sm text-yellow-800 list-disc list-inside mt-2 space-y-1">
                <li>
                  Mengembalikan kartu asli ke stasiun asal dengan status
                  IN_STATION
                </li>
                <li>Mengupdate purchase dengan kartu pengganti yang dipilih</li>
                <li>Mengaktifkan kartu pengganti (status SOLD_ACTIVE)</li>
                <li>Membuat audit trail di history</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowExecuteModal(false);
                  setSelectedSwap(null);
                  setSelectedCardId("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleExecuteSwap}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={
                  loading || !selectedCardId || availableCards.length === 0
                }
              >
                {loading ? "Memproses..." : "Eksekusi Swap"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
