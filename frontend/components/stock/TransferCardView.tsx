"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import toast from "react-hot-toast";
import axiosInstance from "@/lib/axios";
import { ArrowLeft } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Option[]>([]);
  const [stations, setStations] = useState<Option[]>([]);

  const [selectedCards, setSelectedCards] = useState<readonly Option[]>([]);
  const [fromStation, setFromStation] = useState<Option | null>(null);
  const [toStation, setToStation] = useState<Option | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        setLoading(true);
        // Fetch All Cards (this might be heavy, but user requested "data semua kartu")
        // In real world, this should be server-side searched or paginated
        const cardsRes = await axiosInstance.get("/cards", {
          params: { limit: 1000, programType }, // Limit 1000 for now to prevent crash
        });

        // Fetch Stations
        const stationsRes = await axiosInstance.get("/station", {
          params: { limit: 100 },
        });

        const cardOptions = (cardsRes.data?.data?.items || []).map(
          (c: any) => ({
            value: c.id,
            label: `${c.serialNumber} - ${c.status}`,
          }),
        );

        const stationOptions = (stationsRes.data?.data?.items || []).map(
          (s: any) => ({
            value: s.id,
            label: s.stationName,
          }),
        );

        setCards(cardOptions);
        setStations(stationOptions);
      } catch (error) {
        console.error("Failed to fetch resources", error);
        toast.error("Gagal memuat data kartu/stasiun");
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [programType]);

  const handleTransfer = () => {
    if (selectedCards.length === 0 || !fromStation || !toStation) {
      toast.error("Mohon lengkapi semua data");
      return;
    }
    toast.success("Coming soon");
  };

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

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl border shadow-sm space-y-6">
        {/* Card Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Pilih Kartu ({selectedCards.length} dipilih)
          </label>
          <Select
            isMulti
            options={cards}
            value={selectedCards}
            onChange={(newValue) => setSelectedCards(newValue || [])}
            isLoading={loading}
            placeholder="Cari Serial Number..."
            isClearable
            className="text-sm"
            closeMenuOnSelect={false}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Station */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Dari Stasiun
            </label>
            <Select
              options={stations}
              value={fromStation}
              onChange={setFromStation}
              isLoading={loading}
              placeholder="Pilih Stasiun Asal"
              className="text-sm"
            />
          </div>

          {/* To Station */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Ke Stasiun
            </label>
            <Select
              options={stations}
              value={toStation}
              onChange={setToStation}
              isLoading={loading}
              placeholder="Pilih Stasiun Tujuan"
              className="text-sm"
            />
          </div>
        </div>

        {/* Transfer Button */}
        <div className="pt-4">
          <button
            onClick={handleTransfer}
            disabled={loading}
            className="w-full bg-[#8D1231] text-white py-2.5 rounded-lg font-medium hover:bg-[#a6153a] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
