"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import stockService from "@/lib/services/stock.service";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useContext } from "react";
import { UserContext } from "@/app/dashboard/superadmin/dashboard/dashboard-layout";
import StockSopCard from "./StockSopCard";

interface TransferCardViewProps {
  programType: "FWC" | "VOUCHER";
}

interface Option {
  value: string;
  label: string;
}

export default function TransferCardView({
  programType,
}: TransferCardViewProps) {
  const router = useRouter();
  const userContext = useContext(UserContext);
  const role = userContext?.role || "superadmin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Master Data
  const [stations, setStations] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [types, setTypes] = useState<Option[]>([]);
  const [cards, setCards] = useState<Option[]>([]);

  // Form State
  const [fromStation, setFromStation] = useState<Option | null>(null);
  const [toStation, setToStation] = useState<Option | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Option | null>(null);
  const [selectedType, setSelectedType] = useState<Option | null>(null);
  const [selectedCards, setSelectedCards] = useState<readonly Option[]>([]);
  const [note, setNote] = useState("");

  const sopItems = [
    "Pastikan kartu yang akan ditransfer dalam kondisi baik.",
    "Stasiun Asal dan Tujuan tidak boleh sama.",
    "Transfer hanya dapat dilakukan untuk kartu yang saat ini berada di stasiun asal (status IN_STATION).",
    "Gunakan fitur ini untuk memindahkan stok antar stasiun jika terjadi kekurangan/kelebihan stok.",
  ];

  const [loadingCards, setLoadingCards] = useState(false);

  // Initial Data Fetch (Stations, Categories, Types)
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setLoading(true);
        const [stationsRes, categoriesRes, typesRes] = await Promise.all([
          stockService.getStations(),
          stockService.getCategories(programType),
          stockService.getTypes(programType),
        ]);

        setStations(
          stationsRes.map((s: any) => ({
            value: s.id,
            label: s.stationName,
          })),
        );

        setCategories(
          categoriesRes.map((c: any) => ({
            value: c.id,
            label: c.categoryName,
          })),
        );

        setTypes(
          typesRes.map((t: any) => ({
            value: t.id,
            label: t.typeName,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch master data", error);
        toast.error("Gagal memuat data master");
      } finally {
        setLoading(false);
      }
    };

    fetchMasterData();
  }, [programType]);

  // Fetch Cards based on Category, Type, and Station
  useEffect(() => {
    const fetchFilteredCards = async () => {
      if (!selectedCategory || !selectedType || !fromStation) {
        setCards([]);
        setSelectedCards([]);
        return;
      }

      try {
        setLoadingCards(true);
        // Using common cards endpoint with filters
        const res = await axiosInstance.get("/cards", {
          params: {
            categoryId: selectedCategory.value,
            typeId: selectedType.value,
            stationId: fromStation.value,
            status: "IN_STATION", // Only transfer cards currently in office
            programType,
            limit: 1000,
          },
        });

        const cardOptions = (res.data?.data?.items || []).map((c: any) => ({
          value: c.id,
          label: `${c.serialNumber}`,
        }));

        setCards(cardOptions);
      } catch (error) {
        console.error("Failed to fetch cards", error);
        toast.error("Gagal memuat data kartu");
      } finally {
        setLoadingCards(false);
      }
    };

    fetchFilteredCards();
  }, [selectedCategory, selectedType, fromStation, programType]);

  const handleTransfer = async () => {
    if (
      !fromStation ||
      !toStation ||
      !selectedCategory ||
      !selectedType ||
      selectedCards.length === 0
    ) {
      toast.error("Mohon lengkapi semua data");
      return;
    }

    if (fromStation.value === toStation.value) {
      toast.error("Stasiun asal dan tujuan tidak boleh sama");
      return;
    }

    try {
      setSaving(true);
      await stockService.createTransfer({
        stationId: fromStation.value,
        toStationId: toStation.value,
        categoryId: selectedCategory.value,
        typeId: selectedType.value,
        cardIds: selectedCards.map((c) => c.value),
        note,
      });

      toast.success("Transfer kartu berhasil dibuat");
      router.push(`/dashboard/${role}/stock/${programType.toLowerCase()}/out`);
    } catch (error: any) {
      console.error("Transfer failed", error);
      toast.error(error?.response?.data?.message || "Gagal membuat transfer");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 border rounded-md hover:bg-gray-100 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl font-semibold">
          Transfer Kartu ({programType})
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* From Station */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Dari Stasiun <span className="text-red-500">*</span>
              </label>
              <Select
                options={stations}
                value={fromStation}
                onChange={(val) => {
                  setFromStation(val);
                  setCards([]);
                  setSelectedCards([]);
                }}
                placeholder="Pilih Stasiun Asal"
                className="text-sm"
                isClearable
              />
            </div>

            {/* To Station */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Ke Stasiun <span className="text-red-500">*</span>
              </label>
              <Select
                options={stations}
                value={toStation}
                onChange={setToStation}
                placeholder="Pilih Stasiun Tujuan"
                className="text-sm"
                isClearable
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Kategori Kartu <span className="text-red-500">*</span>
              </label>
              <Select
                options={categories}
                value={selectedCategory}
                onChange={(val) => {
                  setSelectedCategory(val);
                  setCards([]);
                  setSelectedCards([]);
                }}
                placeholder="Pilih Kategori"
                className="text-sm"
                isClearable
              />
            </div>

            {/* Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Tipe Kartu <span className="text-red-500">*</span>
              </label>
              <Select
                options={types}
                value={selectedType}
                onChange={(val) => {
                  setSelectedType(val);
                  setCards([]);
                  setSelectedCards([]);
                }}
                placeholder="Pilih Tipe"
                className="text-sm"
                isClearable
              />
            </div>
          </div>

          {/* Card Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Pilih Kartu ({selectedCards.length} dipilih){" "}
              <span className="text-red-500">*</span>
            </label>
            <Select
              isMulti
              options={cards}
              value={selectedCards}
              onChange={(newValue) => setSelectedCards(newValue || [])}
              isLoading={loadingCards}
              placeholder={
                !fromStation || !selectedCategory || !selectedType
                  ? "Lengkapi data di atas terlebih dahulu"
                  : "Cari Serial Number Kartu..."
              }
              isDisabled={!fromStation || !selectedCategory || !selectedType}
              isClearable
              className="text-sm"
              closeMenuOnSelect={false}
            />
            {fromStation &&
              selectedCategory &&
              selectedType &&
              cards.length === 0 &&
              !loadingCards && (
                <p className="text-xs text-orange-600">
                  Tidak ada kartu yang tersedia di stasiun ini untuk kategori &
                  tipe terpilih.
                </p>
              )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Catatan</label>
            <textarea
              className="w-full rounded-lg border px-4 py-2 text-sm focus:ring-1 focus:ring-[#8D1231] outline-none"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="Tambahkan catatan transfer..."
            />
          </div>

          {/* Transfer Button */}
          <div className="pt-4">
            <button
              onClick={handleTransfer}
              disabled={saving || loadingCards}
              className="w-full bg-[#8D1231] text-white py-2.5 rounded-lg font-medium hover:bg-[#a6153a] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Memproses..." : "Buat Transfer"}
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <StockSopCard items={sopItems} title="SOP Transfer Kartu" />
        </div>
      </div>
    </div>
  );
}
