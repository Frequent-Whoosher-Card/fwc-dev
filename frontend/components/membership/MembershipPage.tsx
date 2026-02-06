"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMembers, deleteMember } from "@/lib/services/membership.service";
import MembershipToolbar from "./components/MembershipToolbar";
import MembershipFilter from "./components/MembershipFilter";
import MembershipTable from "./components/MembershipTable";
import DeletedMemberTable, {
  type DeletedMemberItem,
} from "./components/DeletedMemberTable";
import ConfirmDeleteModal from "./components/ui/ConfirmDeleteModal";
import SuccessModal from "./components/ui/SuccessModal";
import toast from "react-hot-toast";
import { useProductTypes } from "@/hooks/useProductTypes";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import ProductTypeSelector from "@/components/ProductTypeSelector";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { initPDFReport } from "@/lib/utils/pdf-export";
import { useAuthClient } from "@/hooks/useAuthClient";

/* ======================
   TYPES
====================== */
interface Membership {
  id: string;
  membership_date: string;
  name?: string | null;
  nip?: string | null;
  nik?: string | null;
  nationality?: string | null;
  gender?: "Laki - Laki" | "Perempuan" | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  company_name?: string | null;
  operator_name?: string | null;
  updated_at?: string | null;
  employee_type_name?: string | null;
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

interface MembershipPageProps {
  role: "superadmin" | "admin" | "supervisor" | "petugas";
}

/* ======================
   HELPERS
====================== */
const formatDate = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export default function MembershipPage({ role }: MembershipPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useAuthClient(); // Corrected: returns the user object directly
  const LIMIT = 10;

  const basePath = `/dashboard/${role}`;

  /* =====================
     FILTER STATE
  ===================== */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  // New States
  const [productTypeId, setProductTypeId] = useState("");

  const [cardCategory, setCardCategory] = useState<"all" | "NIPKAI">("all");
  const [gender, setGender] = useState<"all" | "L" | "P">("all");
  const [employeeTypeId, setEmployeeTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const startDateRef = useRef<HTMLInputElement>(null);
  const endDateRef = useRef<HTMLInputElement>(null);

  /* =====================
     DATA STATE
  ===================== */
  const [data, setData] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: LIMIT,
    totalPages: 1,
    total: 0,
  });

  /* =====================
     MODAL STATE
  ===================== */
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<{
    id: string;
    name?: string | null;
    nik?: string | null;
  } | null>(null);

  /* Riwayat Penghapusan (deleted members) */
  const [deletedMembers, setDeletedMembers] = useState<DeletedMemberItem[]>([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedPagination, setDeletedPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  /* =====================
     DEBOUNCE SEARCH
  ===================== */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  /* =====================
     RESET FILTER
  ===================== */
  const resetFilter = () => {
    setCardCategory("all");
    setGender("all");
    setEmployeeTypeId("");
    setStartDate("");
    setEndDate("");
    // setProgramType("FWC"); // Optional: reset program type or keep it? user usually wants to stay in same context
    setProductTypeId(""); // Reset product type selection
    if (startDateRef.current) startDateRef.current.value = "";
    if (endDateRef.current) endDateRef.current.value = "";
    setPagination((p) => ({ ...p, page: 1 }));
  };

  /* =====================
     FETCH DATA
  ===================== */
  const { productTypes, loading: productTypesLoading } = useProductTypes();

  const fetchMembers = async (page: number) => {
    // START: Empty page rule
    if (!productTypeId) {
      setData([]);
      setPagination({
        page: 1,
        limit: LIMIT,
        totalPages: 1,
        total: 0,
      });
      setLoading(false);
      return;
    }
    // END: Empty page rule

    try {
      setLoading(true);

      // Calculate programType from selected productTypeId if needed,
      // or rely on backend to filter by productTypeId alone.
      // User likely wants to filter by productTypeId.
      // If we need to send programType, we can find it:
      const selectedProduct = productTypes.find((p) => p.id === productTypeId);
      const programTypeParam = selectedProduct?.programType;

      const res = await getMembers({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        gender: gender !== "all" ? gender : undefined,
        employeeTypeId: employeeTypeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasNippKai: cardCategory === "NIPKAI" ? true : undefined,
        // programType: programTypeParam,
        productTypeId: productTypeId || undefined,
      });

      const mapped: Membership[] = res.data.items.map((item: any) => ({
        id: item.id,
        membership_date: formatDate(item.createdAt),
        name: item.name,
        nip: item.nippKai ?? null,
        nik: item.identityNumber,
        nationality: item.nationality,
        gender: item.gender,
        email: item.email,
        phone: item.phone,
        address: item.alamat,
        company_name: item.companyName ?? null,
        operator_name: item.updatedByName ?? item.createdByName,
        updated_at: formatDate(item.updatedAt),
        employee_type_name: item.employeeType?.name ?? null,
      }));

      setData(mapped);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data membership");
    } finally {
      setLoading(false);
    }
  };

  /** Load riwayat penghapusan (deleted members) */
  const loadDeletedMembers = async () => {
    setIsLoadingDeleted(true);
    try {
      const res = await getMembers({
        page: deletedPage,
        limit: 10,
        search: debouncedSearch || undefined,
        gender: gender !== "all" ? gender : undefined,
        employeeTypeId: employeeTypeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasNippKai: cardCategory === "NIPKAI" ? true : undefined,
        isDeleted: true,
      });
      if (res?.data?.items) {
        setDeletedMembers((res.data.items as DeletedMemberItem[]) || []);
        setDeletedPagination(
          res.data.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 1,
          },
        );
      } else {
        setDeletedMembers([]);
        setDeletedPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
      }
    } catch {
      setDeletedMembers([]);
      setDeletedPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
    } finally {
      setIsLoadingDeleted(false);
    }
  };

  /* =====================
     EFFECTS
  ===================== */
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination((p) => ({ ...p, page: 1 }));
    } else {
      fetchMembers(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    cardCategory,
    gender,
    employeeTypeId,
    startDate,
    endDate,
    productTypeId,
  ]);

  useEffect(() => {
    fetchMembers(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchParams.get("refresh")]);

  /* Reset deleted page when filters change */
  useEffect(() => {
    setDeletedPage(1);
  }, [
    debouncedSearch,
    cardCategory,
    gender,
    employeeTypeId,
    startDate,
    endDate,
  ]);

  /* Load riwayat penghapusan when page or filters change */
  useEffect(() => {
    loadDeletedMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    deletedPage,
    debouncedSearch,
    cardCategory,
    gender,
    employeeTypeId,
    startDate,
    endDate,
  ]);

  /* =====================
     HANDLERS
  ===================== */
  const handleView = (id: string) => {
    router.push(`${basePath}/membership/view/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`${basePath}/membership/edit/${id}`);
  };

  const handleDelete = async (notes: string) => {
    if (!selectedMember) return;

    try {
      await deleteMember(selectedMember.id, notes);
      setShowDeleteModal(false);
      setSelectedMember(null);
      setShowSuccessModal(true);
      fetchMembers(pagination.page);
      loadDeletedMembers();
    } catch (err: any) {
      toast.error(err?.message || "Tidak dapat menghapus member");
    }
  };

  const handleExportPDF = async () => {
    try {
      // 1. Siapkan Filter Text untuk Header PDF
      const filtersArr = [];
      if (startDate || endDate) {
        const start = startDate
          ? startDate.split("-").reverse().join("-")
          : "...";
        const end = endDate ? endDate.split("-").reverse().join("-") : "...";
        filtersArr.push(`Periode: ${start} s/d ${end}`);
      }
      if (cardCategory !== "all") {
        filtersArr.push(
          `Kategori: ${cardCategory === "NIPKAI" ? "NIP KAI" : cardCategory}`,
        );
      }
      if (gender !== "all") {
        filtersArr.push(
          `Gender: ${gender === "L" ? "Laki-laki" : "Perempuan"}`,
        );
      }
      const selectedProduct = productTypes.find((p) => p.id === productTypeId);
      if (selectedProduct) {
        filtersArr.push(
          `Produk: ${selectedProduct.description || selectedProduct.programId}`,
        );
      }

      // 2. Init Report (Landscape, Kop Surat, dll dari utility)
      // Gunakan "Membership Data" sebagai judul default
      const { doc, startY } = await initPDFReport({
        title: "Laporan Data Membership",
        filters: filtersArr,
        userName: user?.name || "Admin", // Bisa ambil dari context/auth jika ada
      });

      // 3. Fetch SEMUA data (unpaginated / limit besar)
      // Kita perlu parameter yang sama dengan fetchMembers tapi limit besar
      // Reuse logic params
      const programTypeParam = selectedProduct?.programType;

      const res = await getMembers({
        page: 1,
        limit: 100000, // Ambil semua
        search: debouncedSearch || undefined,
        gender: gender !== "all" ? gender : undefined,
        employeeTypeId: employeeTypeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasNippKai: cardCategory === "NIPKAI" ? true : undefined,
        programType: programTypeParam,
        productTypeId: productTypeId || undefined,
      });

      const allItems = res.data.items || [];

      if (allItems.length === 0) {
        toast.error("Tidak ada data untuk diexport");
        return;
      }

      // 4. Mapping Data ke Array Rows
      const tableRows = allItems.map((item: any, index: number) => {
        return [
          formatDate(item.createdAt),
          item.name || "-",
          item.nippKai || "-",
          item.identityNumber || "-",
          item.nationality || "-",
          item.gender || "-",
          item.employeeType?.name || "-",
          item.email || "-",
          item.phone || "-",
          item.alamat || "-",
          item.companyName || "-",
          formatDate(item.updatedAt),
        ];
      });

      // 5. Generate Table using autoTable
      autoTable(doc, {
        startY: startY,
        margin: { left: 10, right: 10 },
        head: [
          [
            "Membership Date",
            "Full Name",
            "NIP",
            "Identity Number",
            "Nationality",
            "Gender",
            "Tipe Karyawan",
            "Email",
            "Phone",
            "Address",
            "Perusahaan",
            "Last Updated",
          ],
        ],
        body: tableRows,
        styles: {
          font: "helvetica",
          fontSize: 8, // Slightly reduced from 9 to fit 12 columns better, but still readable
          cellPadding: 3,
          halign: "center",
          valign: "middle",
          overflow: "linebreak", // Ensure text wraps instead of cutting off
        },
        headStyles: {
          fillColor: [141, 18, 49], // #8D1231 (KCIC Red)
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          0: { cellWidth: 26 }, // Membership Date (Increased to fix wrapping)
          1: { cellWidth: 28 }, // Full Name
          2: { cellWidth: 18 }, // NIP
          3: { cellWidth: 22 }, // Identity Number
          4: { cellWidth: 23 }, // Nationality
          5: { cellWidth: 18 }, // Gender
          6: { cellWidth: 20 }, // Tipe Karyawan
          7: { cellWidth: 26 }, // Email
          8: { cellWidth: 20 }, // Phone
          9: { cellWidth: 30 }, // Address
          10: { cellWidth: 25 }, // Perusahaan
          11: { cellWidth: 20 }, // Last Updated
        },
        didDrawPage: (data) => {
          // Add Page Number at the bottom
          const str = "Page " + data.pageNumber;

          doc.setFontSize(8);
          doc.setFont("helvetica", "normal");
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height
            ? pageSize.height
            : pageSize.getHeight();
          doc.text(str, data.settings.margin.left, pageHeight - 10);
        },
      });

      // 6. Save
      doc.save(`laporan-membership-${new Date().getTime()}.pdf`);
      toast.success("PDF berhasil didownload");
    } catch (err: any) {
      console.error("Export PDF Error:", err);
      toast.error("Gagal export PDF");
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      <MembershipToolbar>
        <div className="w-full sm:w-[300px]">
          <ProductTypeSelector
            value={productTypeId}
            onChange={(val) => {
              setProductTypeId(val);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            placeholder="Pilih Tipe Produk"
            className="w-full border-[#8D1231] text-[#8D1231] placeholder:text-[#8D1231]/50 focus:ring-[#8D1231]"
          />
        </div>
      </MembershipToolbar>

      {productTypeId && (
        <>
          <MembershipFilter
            search={search}
            onSearchChange={(v) => {
              setSearch(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            cardCategory={cardCategory}
            gender={gender}
            employeeTypeId={employeeTypeId}
            startDate={startDate}
            endDate={endDate}
            startDateRef={startDateRef}
            endDateRef={endDateRef}
            onCardCategoryChange={(v) => {
              setCardCategory(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onGenderChange={(v) => {
              setGender(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onEmployeeTypeChange={(v) => {
              setEmployeeTypeId(v);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onReset={resetFilter}
            actions={
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={loading || !productTypeId}
                className="h-9 gap-2 border-[#8D1231] text-[#8D1231] hover:bg-[#8D1231] hover:text-white"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </Button>
            }
          />

          <MembershipTable
            data={data}
            loading={loading}
            pagination={pagination}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={(member) => {
              setSelectedMember(member);
              setShowDeleteModal(true);
            }}
          />

          {/* Riwayat Penghapusan - sama seperti di Transaksi & Redeem */}
          <DeletedMemberTable
            data={deletedMembers}
            isLoading={isLoadingDeleted}
            noDataMessage="Tidak ada data yang dihapus"
            currentPage={deletedPagination.page}
            totalPages={deletedPagination.totalPages ?? 1}
            totalCount={deletedPagination.total ?? 0}
            onPageChange={setDeletedPage}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={showDeleteModal}
        memberName={selectedMember?.name || "-"}
        memberNik={selectedMember?.nik || "-"}
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setSelectedMember(null);
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
