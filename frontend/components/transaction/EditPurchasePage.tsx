"use client";

import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import toast from "react-hot-toast";
import SuccessModal from "../../app/dashboard/superadmin/membership/components/ui/SuccessModal";
import ConfirmModal from "@/components/ConfirmModal";
import { useCardSelection } from "@/hooks/useCardSelection";
import { useCategories } from "@/hooks/useCategories";

/* ======================
   STYLE
====================== */
const base =
  "h-10 w-full rounded-md border border-gray-300 px-3 text-sm text-gray-700 focus:border-gray-400 focus:outline-none";

/* ======================
   HELPERS
====================== */
const formatDate = (iso?: string | null) =>
  iso ? iso.slice(0, 10) : "Tidak tersedia";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

/* ======================
   UI HELPERS
====================== */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        {description && (
          <p className="mt-1 text-xs text-gray-500">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

/* ======================
   TYPES
====================== */
type Role = "superadmin" | "admin" | "supervisor" | "petugas";

interface EditPurchasePageProps {
  role: Role;
}

/* ======================
   PAGE
====================== */
export default function EditPurchasePage({ role }: EditPurchasePageProps) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  /* ======================
     STATE
  ====================== */
  const [loading, setLoading] = useState(true);

  // customer (editable)
  const [customerName, setCustomerName] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [nip, setNip] = useState("");
  const [memberType, setMemberType] = useState("");

  // card (dropdown)
  const [cardProducts, setCardProducts] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  const [categoryId, setCategoryId] = useState<string>();
  const [typeId, setTypeId] = useState<string>();
  const [cardId, setCardId] = useState<string>();

  const [categoryName, setCategoryName] = useState("");
  const [typeName, setTypeName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");

  // editable - operators and stations
  const [operators, setOperators] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [operatorId, setOperatorId] = useState<string>("");
  const [stationId, setStationId] = useState<string>("");
  const [memberId, setMemberId] = useState<string>("");

  // otomatis
  const [price, setPrice] = useState(0);
  const [purchaseDate, setPurchaseDate] = useState("");
  const [shiftDate, setShiftDate] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [stationName, setStationName] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  // editable transaksi
  const [edcRef, setEdcRef] = useState("");
  const [note, setNote] = useState("");

  // modal confirmation
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);

  // card mismatch correction
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionNote, setCorrectionNote] = useState("");

  // Input mode selection
  const [wrongCardInputMode, setWrongCardInputMode] = useState<
    "" | "manual" | "recommendation"
  >("");
  const [correctCardInputMode, setCorrectCardInputMode] = useState<
    "" | "manual" | "recommendation"
  >("");

  // Station selection for card mismatch
  const [wrongCardStationId, setWrongCardStationId] = useState("");
  const [correctCardStationId, setCorrectCardStationId] = useState("");

  // Wrong card selection states
  const [wrongCardCategory, setWrongCardCategory] = useState("");
  const [wrongCardCategoryId, setWrongCardCategoryId] = useState("");
  const [wrongCardCategoryCode, setWrongCardCategoryCode] = useState("");
  const [wrongCardTypeId, setWrongCardTypeId] = useState("");
  const [wrongCardTypeCode, setWrongCardTypeCode] = useState("");
  const [wrongCardTypes, setWrongCardTypes] = useState<any[]>([]);
  const [wrongCardProducts, setWrongCardProducts] = useState<any[]>([]);
  const [wrongCardSerial, setWrongCardSerial] = useState("");
  const [wrongCardId, setWrongCardId] = useState("");
  const [wrongCardSearchResults, setWrongCardSearchResults] = useState<any[]>(
    [],
  );
  const [isSearchingWrongCard, setIsSearchingWrongCard] = useState(false);

  // Correct card selection states
  const [correctCardCategory, setCorrectCardCategory] = useState("");
  const [correctCardCategoryId, setCorrectCardCategoryId] = useState("");
  const [correctCardCategoryCode, setCorrectCardCategoryCode] = useState("");
  const [correctCardTypeId, setCorrectCardTypeId] = useState("");
  const [correctCardTypeCode, setCorrectCardTypeCode] = useState("");
  const [correctCardTypes, setCorrectCardTypes] = useState<any[]>([]);
  const [correctCardProducts, setCorrectCardProducts] = useState<any[]>([]);
  const [correctCardSerial, setCorrectCardSerial] = useState("");
  const [correctCardId, setCorrectCardId] = useState("");
  const [correctCardSearchResults, setCorrectCardSearchResults] = useState<
    any[]
  >([]);
  const [isSearchingCorrectCard, setIsSearchingCorrectCard] = useState(false);

  // Categories for card selection
  const { categories } = useCategories();

  // Store purchase data for bulk purchase items display
  const [purchaseData, setPurchaseData] = useState<any>(null);

  /* ======================
     INIT LOAD
  ====================== */
  useEffect(() => {
    async function init() {
      try {
        const [trx, ops, sts] = await Promise.all([
          axios.get(`/purchases/${id}`),
          axios.get("/users"),
          axios.get("/station"),
        ]);

        const p = trx.data?.data;
        if (!p) throw new Error("Data tidak ditemukan");

        // customer
        setCustomerName(p.member?.name ?? "");
        setIdentityNumber(p.member?.identityNumber ?? "");
        setMemberType(p.member?.type ?? "");
        setNip(p.member?.nippKai ?? "");
        setMemberId(p.memberId ?? "");

        // card (handle both FWC and VOUCHER bulk purchase)
        const isBulkPurchase =
          p.programType === "VOUCHER" &&
          p.bulkPurchaseItems &&
          p.bulkPurchaseItems.length > 0;

        if (isBulkPurchase) {
          // For bulk purchase, show first item's category/type
          const firstItem = p.bulkPurchaseItems[0];
          setCategoryName(
            firstItem?.card?.cardProduct?.category?.categoryName ?? ""
          );
          setTypeName(firstItem?.card?.cardProduct?.type?.typeName ?? "");
          setSerialNumber(
            `${p.bulkPurchaseItems.length} vouchers (bulk purchase)`
          );
        } else {
          // For single card purchase
          setCategoryName(p.card?.cardProduct?.category?.categoryName ?? "");
          setTypeName(p.card?.cardProduct?.type?.typeName ?? "");
          setSerialNumber(p.card?.serialNumber ?? "");
        }

        // editable - operator and station
        setOperatorId(p.operatorId ?? "");
        setOperatorName(p.operator?.fullName ?? "");
        setStationId(p.stationId ?? "");
        setStationName(p.station?.stationName ?? "");
        setOperators(ops.data?.data?.items ?? []);
        setStations(sts.data?.data?.items ?? []);

        // otomatis
        setPrice(p.price ?? 0);
        setPurchaseDate(formatDate(p.purchaseDate));
        setShiftDate(p.shiftDate ? formatDate(p.shiftDate) : "");
        setUpdatedBy(p.updatedByName ?? p.operator?.fullName ?? "");
        setUpdatedAt(p.updatedAt ? formatDate(p.updatedAt) : "");

        // editable
        setEdcRef(p.edcReferenceNumber ?? "");
        setNote(p.notes ?? "");

        // Store purchase data for bulk purchase items display
        setPurchaseData(p);
      } catch {
        alert("Gagal memuat data transaksi");
      } finally {
        setLoading(false);
      }
    }

    if (id) init();
  }, [id]);

  /* ======================
     CATEGORY CHANGE
  ====================== */
  async function onCategoryChange(id?: string) {
    setCategoryId(id);
    setTypeId(undefined);
    setCardId(undefined);
    setTypes([]);
    setCards([]);
    setPrice(0);

    if (!id) return;

    const selected = categories.find((c) => c.id === id);
    setCategoryName(selected?.label ?? "");

    // Load card products untuk mendapatkan price
    const [typesRes, productsRes] = await Promise.all([
      axios.get("/card/types", { params: { categoryId: id } }),
      axios.get("/card/product", { params: { categoryId: id } }),
    ]);

    setTypes(typesRes.data?.data ?? []);
    setCardProducts(productsRes.data?.data ?? []);
  }

  /* ======================
     TYPE CHANGE
  ====================== */
  async function onTypeChange(id?: string) {
    setTypeId(id);
    setCardId(undefined);
    setCards([]);

    const t = types.find((x) => x.id === id);
    setTypeName(t?.typeName ?? "");

    if (!id) {
      setPrice(0);
      return;
    }

    // Set price dari cardProduct yang sesuai dengan categoryId DAN typeId
    const matchedProduct = cardProducts.find(
      (product: any) =>
        product.categoryId === categoryId && product.type?.id === id,
    );
    if (matchedProduct) {
      setPrice(Number(matchedProduct.price) || 0);
    }

    // Load cards dengan filter categoryId DAN typeId
    const res = await axios.get("/cards", {
      params: {
        categoryId: categoryId,
        typeId: id,
        status: "IN_STATION",
      },
    });
    setCards(res.data?.data?.items ?? []);
  }

  /* ======================
     WRONG CARD HANDLERS
  ====================== */
  async function handleWrongCardCategoryChange(categoryValue: string) {
    setWrongCardCategory(categoryValue);
    setWrongCardTypeId("");
    setWrongCardTypeCode("");
    setWrongCardTypes([]);
    setWrongCardProducts([]);
    setWrongCardSerial("");
    setWrongCardId("");
    setWrongCardSearchResults([]);

    if (!categoryValue) {
      setWrongCardCategoryCode("");
      setWrongCardCategoryId("");
      return;
    }

    try {
      const categoryData = categories.find((c) => c.value === categoryValue);
      if (!categoryData) {
        console.error("Category not found for value:", categoryValue);
        return;
      }

      setWrongCardCategoryId(categoryData.id);

      // Load ALL products for this category (same as useCardSelection)
      const response = await axios.get("/card/product");
      const allProducts = response.data?.data || [];

      // Filter products by categoryId
      const products = allProducts.filter(
        (product: any) => product.categoryId === categoryData.id,
      );

      // Store products for later use
      setWrongCardProducts(products);

      // Extract unique card types from products
      const uniqueTypes = products.reduce((acc: any[], product: any) => {
        if (product.type && !acc.find((t) => t.id === product.type.id)) {
          acc.push(product.type);
        }
        return acc;
      }, []);

      setWrongCardTypes(uniqueTypes);
    } catch (error) {
      console.error("Error loading wrong card types:", error);
    }
  }

  async function handleWrongCardTypeChange(typeId: string) {
    setWrongCardTypeId(typeId);
    setWrongCardId("");
    setWrongCardSearchResults([]);

    if (!typeId) {
      setWrongCardTypeCode("");
      setWrongCardSerial("");
      return;
    }

    try {
      // Use cached products instead of fetching again (same as useCardSelection)
      const matchedProduct = wrongCardProducts.find(
        (product: any) => product.type?.id === typeId,
      );

      console.log("======= WRONG CARD DEBUG =======");
      console.log("Selected Category:", wrongCardCategory);
      console.log("Category ID:", wrongCardCategoryId);
      console.log("Selected Type ID:", typeId);
      console.log("Cached Products Count:", wrongCardProducts.length);
      console.log(
        "Matched Product Category:",
        matchedProduct?.category?.categoryName,
      );
      console.log("Matched Product Type:", matchedProduct?.type?.typeName);
      console.log(
        "Serial Template from Product:",
        matchedProduct?.serialTemplate,
      );
      console.log("===============================");

      // Use serialTemplate from card product (already formatted as 4 digits)
      const serialTemplate = matchedProduct?.serialTemplate || "";
      setWrongCardSerial(serialTemplate);
    } catch (error) {
      console.error("Error loading wrong card product:", error);
    }
  }

  async function handleWrongCardSearch(query: string) {
    setWrongCardSerial(query);
    setWrongCardId("");

    if (!query || query.length < 6) {
      setWrongCardSearchResults([]);
      return;
    }

    if (!wrongCardStationId || !wrongCardCategory || !wrongCardTypeId) {
      setWrongCardSearchResults([]);
      return;
    }

    try {
      setIsSearchingWrongCard(true);

      const categoryData = categories.find(
        (c) => c.value === wrongCardCategory,
      );
      if (!categoryData) return;

      const res = await axios.get("/cards", {
        params: {
          search: query,
          stationId: wrongCardStationId,
          categoryId: categoryData.id,
          typeId: wrongCardTypeId,
          status: "IN_STATION",
          limit: 100,
        },
      });

      const results = res.data?.data?.items || [];
      // Sort results by serial number in ascending order
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber),
      );
      setWrongCardSearchResults(sortedResults);
    } catch (error) {
      console.error("Error searching wrong cards:", error);
      setWrongCardSearchResults([]);
    } finally {
      setIsSearchingWrongCard(false);
    }
  }

  /* ======================
     CORRECT CARD HANDLERS
  ====================== */
  async function handleCorrectCardCategoryChange(categoryValue: string) {
    setCorrectCardCategory(categoryValue);
    setCorrectCardTypeId("");
    setCorrectCardTypeCode("");
    setCorrectCardTypes([]);
    setCorrectCardProducts([]);
    setCorrectCardSerial("");
    setCorrectCardId("");
    setCorrectCardSearchResults([]);

    if (!categoryValue) {
      setCorrectCardCategoryCode("");
      setCorrectCardCategoryId("");
      return;
    }

    try {
      const categoryData = categories.find((c) => c.value === categoryValue);
      if (!categoryData) {
        console.error("Category not found for value:", categoryValue);
        return;
      }

      setCorrectCardCategoryId(categoryData.id);

      // Load ALL products for this category (same as useCardSelection)
      const response = await axios.get("/card/product");
      const allProducts = response.data?.data || [];

      // Filter products by categoryId
      const products = allProducts.filter(
        (product: any) => product.categoryId === categoryData.id,
      );

      // Store products for later use
      setCorrectCardProducts(products);

      // Extract unique card types from products
      const uniqueTypes = products.reduce((acc: any[], product: any) => {
        if (product.type && !acc.find((t) => t.id === product.type.id)) {
          acc.push(product.type);
        }
        return acc;
      }, []);

      setCorrectCardTypes(uniqueTypes);
    } catch (error) {
      console.error("Error loading correct card types:", error);
    }
  }

  async function handleCorrectCardTypeChange(typeId: string) {
    setCorrectCardTypeId(typeId);
    setCorrectCardId("");
    setCorrectCardSearchResults([]);

    if (!typeId) {
      setCorrectCardTypeCode("");
      setCorrectCardSerial("");
      return;
    }

    try {
      // Use cached products instead of fetching again (same as useCardSelection)
      const matchedProduct = correctCardProducts.find(
        (product: any) => product.type?.id === typeId,
      );

      console.log("======= CORRECT CARD DEBUG =======");
      console.log("Selected Category:", correctCardCategory);
      console.log("Category ID:", correctCardCategoryId);
      console.log("Selected Type ID:", typeId);
      console.log("Cached Products Count:", correctCardProducts.length);
      console.log(
        "Matched Product Category:",
        matchedProduct?.category?.categoryName,
      );
      console.log("Matched Product Type:", matchedProduct?.type?.typeName);
      console.log(
        "Serial Template from Product:",
        matchedProduct?.serialTemplate,
      );
      console.log("===================================");

      // Use serialTemplate from card product (already formatted as 4 digits)
      const serialTemplate = matchedProduct?.serialTemplate || "";
      setCorrectCardSerial(serialTemplate);
    } catch (error) {
      console.error("Error loading correct card product:", error);
    }
  }

  async function handleCorrectCardSearch(query: string) {
    setCorrectCardSerial(query);
    setCorrectCardId("");

    if (!query || query.length < 6) {
      setCorrectCardSearchResults([]);
      return;
    }

    if (!correctCardStationId || !correctCardCategory || !correctCardTypeId) {
      setCorrectCardSearchResults([]);
      return;
    }

    try {
      setIsSearchingCorrectCard(true);

      const categoryData = categories.find(
        (c) => c.value === correctCardCategory,
      );
      if (!categoryData) return;

      const res = await axios.get("/cards", {
        params: {
          search: query,
          stationId: correctCardStationId,
          categoryId: categoryData.id,
          typeId: correctCardTypeId,
          status: "IN_STATION",
          limit: 100,
        },
      });

      const results = res.data?.data?.items || [];
      // Sort results by serial number in ascending order
      const sortedResults = results.sort((a: any, b: any) =>
        a.serialNumber.localeCompare(b.serialNumber),
      );
      setCorrectCardSearchResults(sortedResults);
    } catch (error) {
      console.error("Error searching correct cards:", error);
      setCorrectCardSearchResults([]);
    } finally {
      setIsSearchingCorrectCard(false);
    }
  }

  /* ======================
     CARD CORRECTION
  ====================== */
  async function handleCorrectCard() {
    if (!wrongCardSerial || !correctCardSerial) {
      toast.error("Harap isi Wrong Card Serial dan Correct Card Serial");
      return;
    }

    if (!correctionNote.trim()) {
      toast.error("Harap isi alasan koreksi kartu");
      return;
    }

    // Show confirmation modal
    setShowCorrectionModal(true);
  }

  async function executeCardCorrection() {
    setIsCorrecting(true);

    try {
      // Use cardId from the state
      if (!wrongCardId || !correctCardId) {
        toast.error("Card ID tidak ditemukan");
        setShowCorrectionModal(false);
        setIsCorrecting(false);
        return;
      }

      // Call correction endpoint
      await axios.patch(`/purchases/${id}/correct-card-mismatch`, {
        wrongCardId: wrongCardId,
        correctCardId: correctCardId,
        notes: correctionNote,
      });

      toast.success("Koreksi kartu berhasil!");
      router.push(`/dashboard/${role}/transaksi`);
    } catch (error: any) {
      const msg =
        error.response?.data?.error?.message || "Gagal melakukan koreksi kartu";
      toast.error(msg);
    } finally {
      setShowCorrectionModal(false);
      setIsCorrecting(false);
    }
  }

  /* ======================
     SUBMIT
  ====================== */
  function openConfirmDialog(e: React.FormEvent) {
    e.preventDefault();
    setShowConfirm(true);
  }

  async function handleConfirmSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updateData: any = {};

      if (memberId) updateData.memberId = memberId;
      if (operatorId) updateData.operatorId = operatorId;
      if (stationId) updateData.stationId = stationId;
      if (edcRef) updateData.edcReferenceNumber = edcRef;
      if (price) updateData.price = price;
      if (note) updateData.notes = note;
      if (shiftDate) {
        // Convert YYYY-MM-DD to ISO datetime
        const date = new Date(shiftDate);
        updateData.shiftDate = date.toISOString();
      }

      await axios.patch(`/purchases/${id}`, updateData);

      router.back();
    } catch (error: any) {
      const message =
        error.response?.data?.error?.message || "Gagal memperbarui transaksi";
      alert(message);
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    openConfirmDialog(e);
  }

  if (loading) return <div className="p-6">Memuat data…</div>;

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded p-1 hover:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-semibold">Edit Transaksi</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-lg border bg-gray-50 p-6"
      >
        <SectionCard
          title="Data Customer"
          description="Informasi identitas pemegang kartu"
        >
          <Field label="Nama Customer">
            <input
              value={customerName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="Identity Number">
            <input
              value={identityNumber}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="NIP (Khusus KAI)">
            <input
              value={nip}
              disabled
              placeholder={
                memberType === "KAI"
                  ? "Masukkan NIP KAI"
                  : "Tidak berlaku (Non-KAI)"
              }
              className={`${base} bg-gray-100 ${
                memberType !== "KAI" ? "italic" : ""
              }`}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Data Kartu"
          description="Kategori, tipe, dan kartu yang digunakan"
        >
          <Field label="Card Category">
            <input
              value={categoryName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="Card Type">
            <input
              value={typeName}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="Serial Number">
            <input
              value={serialNumber}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>

          <Field label="FW Price (Otomatis)">
            <input
              value={rupiah(price)}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
        </SectionCard>

        {/* Bulk Purchase Items Section */}
        {purchaseData &&
          purchaseData.programType === "VOUCHER" &&
          purchaseData.bulkPurchaseItems &&
          purchaseData.bulkPurchaseItems.length > 0 && (
            <SectionCard
              title="Voucher Items (Bulk Purchase)"
              description={`Total ${purchaseData.bulkPurchaseItems.length} vouchers dalam transaksi ini`}
            >
              <div className="col-span-2">
                <div className="space-y-3">
                  {purchaseData.bulkPurchaseItems.map(
                    (item: any, index: number) => (
                      <div
                        key={item.id}
                        className="border rounded-lg p-4 bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-gray-500">
                                #{index + 1}
                              </span>
                              <span className="text-sm font-mono font-semibold">
                                {item.card?.serialNumber ?? "-"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500">Category:</span>
                                <span className="ml-2 font-medium">
                                  {
                                    item.card?.cardProduct?.category
                                      ?.categoryName
                                  }
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Type:</span>
                                <span className="ml-2 font-medium">
                                  {item.card?.cardProduct?.type?.typeName}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Status:</span>
                                <span className="ml-2 font-medium">
                                  {item.card?.status ?? "-"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Price:</span>
                                <span className="ml-2 font-semibold text-[#8D1231]">
                                  {rupiah(item.price)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </SectionCard>
          )}

        <SectionCard title="Informasi Transaksi">
          <Field label="Purchase Date">
            <input
              value={purchaseDate}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
          <Field label="Shift Date">
            <input
              type="date"
              value={shiftDate}
              disabled
              className={`${base} bg-gray-100`}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Operasional">
          <Field label="Operator">
            <select
              value={operatorId}
              onChange={(e) => setOperatorId(e.target.value)}
              className={base}
            >
              <option value="">{operatorName || "Pilih Operator"}</option>
              {operators.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Stasiun">
            <select
              value={stationId}
              onChange={(e) => setStationId(e.target.value)}
              className={base}
            >
              <option value="">{stationName || "Pilih Stasiun"}</option>
              {stations.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.stationName}
                </option>
              ))}
            </select>
          </Field>
        </SectionCard>

        <SectionCard
          title="Informasi Pembaruan"
          description="Data yang dapat diperbarui pada transaksi ini"
        >
          {/* ROW 1 */}
          <Field label="No. Reference EDC">
            <input
              value={edcRef}
              onChange={(e) => setEdcRef(e.target.value)}
              className={base}
            />
          </Field>

          {updatedAt && (
            <>
              <Field label="Terakhir Diperbarui Oleh">
                <input
                  value={updatedBy}
                  disabled
                  className={`${base} bg-gray-100`}
                />
              </Field>

              {/* ROW 2 */}
              <Field label="Terakhir Diperbarui Pada">
                <input
                  value={updatedAt}
                  disabled
                  className={`${base} bg-gray-100`}
                />
              </Field>
            </>
          )}

          {/* ROW 3 - FULL WIDTH */}
          <div className="md:col-span-2">
            <Field label="Noted">
              <textarea
                value={note}
                disabled
                className="min-h-[96px] w-full rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                placeholder="Tambahkan catatan jika diperlukan"
              />
            </Field>
          </div>
        </SectionCard>

        {/* CARD MISMATCH CORRECTION - Only show if no note exists */}
        {!note && (
          <SectionCard
            title="Koreksi Kartu (Card Mismatch)"
            description="Gunakan jika petugas salah memberikan kartu ke customer"
          >
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="showCorrection"
                  checked={showCorrection}
                  onChange={(e) => {
                    setShowCorrection(e.target.checked);
                    if (!e.target.checked) {
                      setWrongCardInputMode("");
                      setCorrectCardInputMode("");
                      setWrongCardSerial("");
                      setCorrectCardSerial("");
                      setWrongCardId("");
                      setCorrectCardId("");
                    }
                  }}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="showCorrection"
                  className="text-sm font-medium text-gray-700"
                >
                  Aktifkan Koreksi Kartu
                </label>
              </div>
            </div>

            {showCorrection && (
              <>
                {/* Wrong Card Selection */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">
                    Wrong Card (yang salah dikasih)
                  </h4>
                </div>

                <Field label="Mode Input Serial Number">
                  <select
                    className={base}
                    value={wrongCardInputMode}
                    onChange={(e) => {
                      const mode = e.target.value as
                        | ""
                        | "manual"
                        | "recommendation";
                      setWrongCardInputMode(mode);
                      // Reset states when mode changes
                      setWrongCardSerial("");
                      setWrongCardId("");
                      setWrongCardSearchResults([]);
                      if (mode === "manual") {
                        setWrongCardStationId("");
                        setWrongCardCategory("");
                        setWrongCardTypeId("");
                      }
                    }}
                  >
                    <option value="">Pilih Mode Input</option>
                    <option value="manual">Input Manual / Scan Barcode</option>
                    <option value="recommendation">Rekomendasi</option>
                  </select>
                </Field>

                {wrongCardInputMode === "manual" && (
                  <Field label="Serial Number">
                    <input
                      value={wrongCardSerial}
                      onChange={(e) => {
                        setWrongCardSerial(e.target.value);
                        setWrongCardId("");
                      }}
                      placeholder="Masukkan atau scan serial number..."
                      className={base}
                    />
                  </Field>
                )}

                {wrongCardInputMode === "recommendation" && (
                  <>
                    <Field label="Stasiun">
                      <select
                        className={base}
                        value={wrongCardStationId}
                        onChange={(e) => setWrongCardStationId(e.target.value)}
                      >
                        <option value="">Pilih Stasiun</option>
                        {stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.stationName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Card Category">
                      <select
                        className={base}
                        value={wrongCardCategory}
                        onChange={(e) =>
                          handleWrongCardCategoryChange(e.target.value)
                        }
                        disabled={!wrongCardStationId}
                      >
                        <option value="">Pilih Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Card Type">
                      <select
                        className={base}
                        value={wrongCardTypeId}
                        onChange={(e) =>
                          handleWrongCardTypeChange(e.target.value)
                        }
                        disabled={!wrongCardCategory}
                      >
                        <option value="">Pilih Type</option>
                        {wrongCardTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.typeName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Serial Number">
                      <div className="relative">
                        <input
                          value={wrongCardSerial}
                          onChange={(e) =>
                            handleWrongCardSearch(e.target.value)
                          }
                          placeholder="Masukkan 2 digit tahun kartu dibuat + nomor (min 6 karakter)..."
                          className={base}
                          disabled={!wrongCardTypeId}
                        />
                        {isSearchingWrongCard && (
                          <Loader2
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                          />
                        )}
                        {wrongCardSearchResults.length > 0 && (
                          <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-300 bg-white absolute z-10 left-0 right-0">
                            {wrongCardSearchResults.map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => {
                                  setWrongCardSerial(card.serialNumber);
                                  setWrongCardId(card.id);
                                  setWrongCardSearchResults([]);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center"
                              >
                                <span className="font-medium">
                                  {card.serialNumber}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {card.station?.stationName || "-"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </Field>
                  </>
                )}

                {/* Correct Card Selection */}
                <div className="md:col-span-2">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 mt-4">
                    Correct Card (yang benar seharusnya)
                  </h4>
                </div>

                <Field label="Mode Input Serial Number">
                  <select
                    className={base}
                    value={correctCardInputMode}
                    onChange={(e) => {
                      const mode = e.target.value as
                        | ""
                        | "manual"
                        | "recommendation";
                      setCorrectCardInputMode(mode);
                      // Reset states when mode changes
                      setCorrectCardSerial("");
                      setCorrectCardId("");
                      setCorrectCardSearchResults([]);
                      if (mode === "manual") {
                        setCorrectCardStationId("");
                        setCorrectCardCategory("");
                        setCorrectCardTypeId("");
                      }
                    }}
                  >
                    <option value="">Pilih Mode Input</option>
                    <option value="manual">Input Manual / Scan Barcode</option>
                    <option value="recommendation">Rekomendasi</option>
                  </select>
                </Field>

                {correctCardInputMode === "manual" && (
                  <Field label="Serial Number">
                    <input
                      value={correctCardSerial}
                      onChange={(e) => {
                        setCorrectCardSerial(e.target.value);
                        setCorrectCardId("");
                      }}
                      placeholder="Masukkan atau scan serial number..."
                      className={base}
                    />
                  </Field>
                )}

                {correctCardInputMode === "recommendation" && (
                  <>
                    <Field label="Stasiun">
                      <select
                        className={base}
                        value={correctCardStationId}
                        onChange={(e) =>
                          setCorrectCardStationId(e.target.value)
                        }
                      >
                        <option value="">Pilih Stasiun</option>
                        {stations.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.stationName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Card Category">
                      <select
                        className={base}
                        value={correctCardCategory}
                        onChange={(e) =>
                          handleCorrectCardCategoryChange(e.target.value)
                        }
                        disabled={!correctCardStationId}
                      >
                        <option value="">Pilih Category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Card Type">
                      <select
                        className={base}
                        value={correctCardTypeId}
                        onChange={(e) =>
                          handleCorrectCardTypeChange(e.target.value)
                        }
                        disabled={!correctCardCategory}
                      >
                        <option value="">Pilih Type</option>
                        {correctCardTypes.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.typeName}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field label="Serial Number">
                      <div className="relative">
                        <input
                          value={correctCardSerial}
                          onChange={(e) =>
                            handleCorrectCardSearch(e.target.value)
                          }
                          placeholder="Masukkan 2 digit tahun kartu dibuat + nomor (min 6 karakter)..."
                          className={base}
                          disabled={!correctCardTypeId}
                        />
                        {isSearchingCorrectCard && (
                          <Loader2
                            size={16}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                          />
                        )}
                        {correctCardSearchResults.length > 0 && (
                          <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-gray-300 bg-white absolute z-10 left-0 right-0">
                            {correctCardSearchResults.map((card) => (
                              <button
                                key={card.id}
                                type="button"
                                onClick={() => {
                                  setCorrectCardSerial(card.serialNumber);
                                  setCorrectCardId(card.id);
                                  setCorrectCardSearchResults([]);
                                }}
                                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex justify-between items-center"
                              >
                                <span className="font-medium">
                                  {card.serialNumber}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {card.station?.stationName || "-"}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </Field>
                  </>
                )}

                <div className="md:col-span-2">
                  <Field label="Alasan Koreksi">
                    <textarea
                      value={correctionNote}
                      onChange={(e) => setCorrectionNote(e.target.value)}
                      className="min-h-[80px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none"
                      placeholder="Jelaskan alasan koreksi kartu"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Perhatian:</strong> Koreksi kartu akan:
                    </p>
                    <ul className="text-xs text-yellow-700 mt-1 ml-4 list-disc">
                      <li>Card lama ({serialNumber}) return ke IN_STATION</li>
                      <li>
                        Wrong card (yang salah dikasih) jadi status DELETED
                        (permanent)
                      </li>
                      <li>Correct card (yang benar) jadi SOLD_ACTIVE</li>
                      <li>Price transaksi tetap (tidak berubah)</li>
                    </ul>
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleCorrectCard}
                    className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white hover:bg-orange-700"
                  >
                    Lakukan Koreksi Kartu
                  </button>
                </div>
              </>
            )}
          </SectionCard>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-md bg-[#8B1538] px-8 py-2 text-sm font-medium text-white hover:bg-[#73122E] disabled:opacity-50"
          >
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      <SuccessModal
        open={showConfirm}
        title="Edit Transaction Data"
        message="Please review the transaction data before saving"
        data={{
          // Customer
          "Customer Name": customerName || "-",
          "Identity Number": identityNumber || "-",
          NIP: nip || "-",

          // Card Info
          "Card Category": categoryName || "-",
          "Card Type": typeName || "-",
          "Serial Number": serialNumber || "-",

          // Transaction
          "Purchase Date": formatDate(purchaseDate),
          "Shift Date": formatDate(shiftDate),
          Price: rupiah(price),
          "No. Reference EDC": edcRef || "-",

          // Operational
          Operator: operatorName || "-",
          Station: stationName || "-",
          Notes: note || "-",
        }}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
      />

      <ConfirmModal
        open={showCorrectionModal}
        title="Konfirmasi Koreksi Kartu"
        description={`Apakah Anda yakin ingin melakukan koreksi kartu?

Wrong Card: ${wrongCardSerial}
Correct Card: ${correctCardSerial}
Alasan: ${correctionNote}

Perhatian:
• Card lama (${serialNumber}) return ke IN_STATION
• Wrong card akan DELETED (permanent)
• Correct card jadi SOLD_ACTIVE`}
        confirmText="Ya, Lakukan Koreksi"
        cancelText="Batal"
        loading={isCorrecting}
        onConfirm={executeCardCorrection}
        onCancel={() => setShowCorrectionModal(false)}
      />
    </div>
  );
}
