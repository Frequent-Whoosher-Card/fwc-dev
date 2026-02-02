"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMembers, deleteMember } from "@/lib/services/membership.service";
import MembershipToolbar from "./components/MembershipToolbar";
import MembershipFilter from "./components/MembershipFilter";
import MembershipTable from "./components/MembershipTable";
import ConfirmDeleteModal from "./components/ui/ConfirmDeleteModal";
import SuccessModal from "./components/ui/SuccessModal";
import toast from "react-hot-toast";

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
  const LIMIT = 10;

  const basePath = `/dashboard/${role}`;

  /* =====================
     FILTER STATE
  ===================== */
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
    if (startDateRef.current) startDateRef.current.value = "";
    if (endDateRef.current) endDateRef.current.value = "";
    setPagination((p) => ({ ...p, page: 1 }));
  };

  /* =====================
     FETCH DATA
  ===================== */
  const fetchMembers = async (page: number) => {
    try {
      setLoading(true);

      const res = await getMembers({
        page,
        limit: LIMIT,
        search: debouncedSearch || undefined,
        gender: gender !== "all" ? gender : undefined,
        employeeTypeId: employeeTypeId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        hasNippKai: cardCategory === "NIPKAI" ? true : undefined,
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
  }, [debouncedSearch, cardCategory, gender, employeeTypeId, startDate, endDate]);

  useEffect(() => {
    fetchMembers(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, searchParams.get("refresh")]);

  /* =====================
     HANDLERS
  ===================== */
  const handleView = (id: string) => {
    router.push(`${basePath}/membership/view/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`${basePath}/membership/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;

    try {
      await deleteMember(selectedMember.id);
      setShowDeleteModal(false);
      setSelectedMember(null);
      setShowSuccessModal(true);
      fetchMembers(pagination.page);
    } catch (err: any) {
      toast.error(err?.message || "Tidak dapat menghapus member");
    }
  };

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-6">
      <MembershipToolbar
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      />

      <MembershipFilter
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
