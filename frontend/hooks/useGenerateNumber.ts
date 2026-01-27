import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import CardGenerateService, {
  CardProduct,
  GenerateHistoryItem,
  Pagination,
} from "@/lib/services/card.generate";

export interface SerialItem {
  serial: string;
  barcodeUrl?: string;
}

export interface BatchData {
  id: string;
  date: string;
  productLabel: string;
  start: string;
  end: string;
  serials: SerialItem[];
  documentUrl?: string | null;
}

interface UseGenerateNumberProps {
  programType?: string;
  limit?: number;
}

export function useGenerateNumber({
  programType,
  limit = 10,
}: UseGenerateNumberProps = {}) {
  const [products, setProducts] = useState<CardProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<CardProduct | null>(
    null,
  );

  const [startNumber, setStartNumber] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState<GenerateHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [batch, setBatch] = useState<BatchData | null>(null);
  const [loadingBatch, setLoadingBatch] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const data = await CardGenerateService.getProducts(programType);
      setProducts(data);
    } catch {
      toast.error("Gagal mengambil card product");
    }
  }, [programType]);

  const fetchHistory = useCallback(
    async (currentPage = 1) => {
      try {
        setLoadingHistory(true);
        const data = await CardGenerateService.getHistory({
          page: currentPage,
          limit,
          programType,
        });

        const items: GenerateHistoryItem[] = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
            ? data
            : [];
        setHistory(items);

        if (data?.pagination) {
          setPagination(data.pagination);
        } else {
          setPagination({
            page: currentPage,
            limit,
            total: items.length,
            totalPages:
              items.length > limit ? Math.ceil(items.length / limit) : 1,
          });
        }
        setPage(currentPage);
      } catch {
        toast.error("Gagal mengambil history generate");
        setHistory([]);
        setPagination(null);
      } finally {
        setLoadingHistory(false);
      }
    },
    [programType, limit],
  );

  const fetchHistoryDetail = useCallback(async (id: string) => {
    try {
      setLoadingBatch(true);
      const data = await CardGenerateService.getHistoryDetail(id);

      if (!data || !data.movement) {
        throw new Error("Invalid response");
      }

      const movement = data.movement;
      const cards = data.cards || [];

      const serials: SerialItem[] = movement.serialNumbers.map(
        (serial: string) => {
          const card = cards.find((c: any) => c.serialNumber === serial);
          return {
            serial,
            barcodeUrl: card?.barcodeUrl,
          };
        },
      );

      setBatch({
        id: movement.id,
        date: new Date(movement.movementAt)
          .toLocaleDateString("id-ID")
          .replace(/\//g, "-"),
        productLabel: `${movement.category.name} - ${movement.type.name}`,
        start: movement.serialNumbers[0],
        end: movement.serialNumbers[movement.serialNumbers.length - 1],
        serials,
        documentUrl: movement.document?.url,
      });
    } catch {
      toast.error("Gagal mengambil data generate");
      setBatch(null);
    } finally {
      setLoadingBatch(false);
    }
  }, []);

  const handleExportZip = async (currentBatch: BatchData | null) => {
    if (!currentBatch) {
      toast.error("Data tidak ditemukan");
      return;
    }

    try {
      const { blob, filename } = await CardGenerateService.downloadZip(
        currentBatch.id,
      );
      saveAs(blob, filename);
      toast.success("Export ZIP berhasil");
    } catch (error) {
      console.error("Export ZIP error:", error);
      toast.error("Gagal mendownload ZIP");
    }
  };

  const handleUploadDocument = async (file: File, batchId: string) => {
    try {
      setLoadingUpload(true);
      await CardGenerateService.uploadDocument({
        batchId,
        file,
      });
      toast.success("Upload dokumen berhasil");
      await fetchHistoryDetail(batchId); // Refresh details
    } catch (error) {
      console.error("Upload document error:", error);
      toast.error("Gagal mengupload dokumen");
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleViewDocument = async (batchId: string) => {
    try {
      const { blob } = await CardGenerateService.viewDocument(batchId);
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, "_blank");
      if (!newWindow) {
        toast.error("Pop-up diblokir. Izinkan pop-up untuk melihat dokumen.");
      }
      // Cleanup? Usually tough for opened windows. URL.revokeObjectURL(url) should ideally happen later.
      // But keeping it alive for the window session is fine for now.
    } catch (error) {
      console.error("View document error:", error);
      toast.error("Gagal membuka dokumen (Mungkin file tidak ditemukan)");
    }
  };

  const fetchNextSerial = useCallback(async (productId: string) => {
    try {
      const nextSerial = await CardGenerateService.getNextSerial(productId);
      if (typeof nextSerial === "string") {
        setStartNumber(nextSerial);
      }
    } catch {
      toast.error("Gagal mengambil next serial number");
    }
  }, []);

  const handleSelectProduct = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((x) => x.id === id) || null;
    setSelectedProduct(p);
    if (p) {
      fetchNextSerial(p.id);
      if (programType === "VOUCHER" && p.maxQuantity) {
        setQuantity(String(p.maxQuantity));
      } else {
        setQuantity("");
      }
    } else {
      setStartNumber("");
      setQuantity("");
    }
  };

  const handleGenerate = async () => {
    const startSerial5 = startNumber ? startNumber.slice(-5) : "";
    const qtyNumber = Number(quantity);
    const calculatedEndSerial =
      /^\d{5}$/.test(startSerial5) && qtyNumber > 0
        ? String(Number(startSerial5) + qtyNumber - 1).padStart(5, "0")
        : "";

    if (!selectedProduct || qtyNumber <= 0) {
      toast.error("Data tidak valid");
      return;
    }

    setLoading(true);
    try {
      await CardGenerateService.generate({
        cardProductId: selectedProduct.id,
        startSerial: startSerial5,
        endSerial: calculatedEndSerial,
        programType,
        quantity: qtyNumber,
      });

      toast.success("Generate serial berhasil");
      fetchHistory(1);
      fetchNextSerial(selectedProduct.id);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.error?.message ||
          err?.response?.data?.message ||
          "Terjadi kesalahan",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const startSerial5 = startNumber ? startNumber.slice(-5) : "";
  const qtyNumber = Number(quantity);
  const calculatedEndSerial =
    /^\d{5}$/.test(startSerial5) && qtyNumber > 0
      ? String(Number(startSerial5) + qtyNumber - 1).padStart(5, "0")
      : "";

  return {
    products,
    selectedProductId,
    selectedProduct,
    startNumber,
    quantity,
    setQuantity,
    loading,
    history,
    loadingHistory,
    page,
    pagination,
    calculatedEndSerial,
    batch,
    loadingBatch,
    handleSelectProduct,
    handleGenerate,
    fetchHistory,
    fetchHistoryDetail,
    handleExportZip,
    handleUploadDocument,
    handleViewDocument,
    loadingUpload,
  };
}
