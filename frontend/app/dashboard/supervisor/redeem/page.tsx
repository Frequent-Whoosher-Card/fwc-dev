'use client';

import { useEffect, useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem, RedeemFilterParams } from '@/lib/services/redeem/redeemService';
import { useRedeemPermission } from '@/lib/hooks/useRedeemPermission';
import { UserContext } from '@/app/dashboard/supervisor/dashboard-layout';
import CreateRedeemModal from '@/components/redeem/CreateRedeemModal';
import RedeemTable from '@/components/redeem/RedeemTable';
import RedeemFilters from '@/components/redeem/RedeemFilters';
import RedeemDetailModal from '@/components/redeem/RedeemDetailModal';
import LastRedeemDocModal from '@/components/redeem/LastRedeemDocModal';
import DeleteRedeemDialog from '@/components/redeem/DeleteRedeemDialog';
import ExportRedeemModal from '@/components/redeem/ExportRedeemModal';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getStations } from '@/lib/services/station.service';
import { getCardCategories, getCardTypes } from '@/lib/services/cardcategory';

interface User {
  id: string;
  fullName: string;
  role: 'superadmin' | 'admin' | 'supervisor' | 'petugas';
}

interface Station {
  id: string;
  name: string;
  city?: string;
}


export default function SupervisorRedeemPage() {
  // State for data
  const [redeems, setRedeems] = useState<RedeemItem[]>([]);
  const userCtx = useContext(UserContext);
  const currentRole = userCtx?.role;
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [cardTypes, setCardTypes] = useState<string[]>([]);
  const [isLoadingRedeems, setIsLoadingRedeems] = useState(false);

  // Filter state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [cardType, setCardType] = useState('');
  const [redeemType, setRedeemType] = useState('');
  const [stationId, setStationId] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
  });

  // State for modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedRedeem, setSelectedRedeem] = useState<RedeemItem | null>(null);

  // Get permission hook dari role context
  const permission = useRedeemPermission(currentRole);
  const { canDelete, canExport, canCreate } = permission;

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Load initial data
  useEffect(() => {
    loadStations();
    loadCategories();
    loadCardTypes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch redeems ketika filter atau page berubah
  useEffect(() => {
    loadRedeems({
      page: currentPage,
      limit: 50,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return end.toISOString();
      })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      redeemType: redeemType ? (redeemType as 'SINGLE' | 'ROUNDTRIP') : undefined,
      stationId: stationId || undefined,
      search: search || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, category, cardType, redeemType, stationId, search, currentPage]);

  const loadRedeems = async (filters: RedeemFilterParams) => {
    setIsLoadingRedeems(true);
    try {
      const response = await redeemService.listRedeems(filters);
      const items = response.data || [];
      const paginationData = response.pagination || { page: 1, limit: 50, total: 0 };
      setRedeems(items);
      setPagination({
        page: paginationData.page || 1,
        limit: paginationData.limit || 50,
        total: paginationData.total || 0,
      });
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengambil data redeem');
      setRedeems([]);
      setPagination({ page: 1, limit: 50, total: 0 });
    } finally {
      setIsLoadingRedeems(false);
    }
  };

  const loadStations = async () => {
    try {
      const res = await getStations();
      setStations(res?.data || []);
    } catch (error) {
      setStations([]);
    }
  };


  const loadCategories = async () => {
    try {
      const res = await getCardCategories();
      const data = res?.data;
      let categoryNames: string[] = [];
      if (Array.isArray(data)) {
        categoryNames = data.map((cat: any) => cat.name || cat.categoryName || cat.category).filter(Boolean);
      } else if (data && typeof data === 'object') {
        const items = data.items || data.categories || [];
        if (Array.isArray(items)) {
          categoryNames = items.map((cat: any) => cat.name || cat.categoryName || cat.category).filter(Boolean);
        }
      }
      setCategories([...new Set(categoryNames)]);
    } catch (error) {
      setCategories([]);
    }
  };

  const loadCardTypes = async () => {
    try {
      const res = await getCardTypes();
      const data = res?.data;
      let types: string[] = [];
      if (Array.isArray(data)) {
        types = data.map((t: any) => t.typeName || t.name).filter(Boolean);
      } else if (data && typeof data === 'object') {
        const items = data.items || data.types || [];
        if (Array.isArray(items)) {
          types = items.map((t: any) => t.typeName || t.name).filter(Boolean);
        }
      }
      setCardTypes([...new Set(types)]);
    } catch (error) {
      setCardTypes([]);
    }
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setCardType('');
    setRedeemType('');
    setStationId('');
    setSearch('');
    setCurrentPage(1);
  };

  const handleViewDetail = (item: RedeemItem) => {
    setSelectedRedeem(item);
    setDetailModalOpen(true);
  };

  const handleUploadDoc = (item: RedeemItem) => {
    setSelectedRedeem(item);
    setUploadDocModalOpen(true);
  };

  const handleDelete = (item: RedeemItem) => {
    setSelectedRedeem(item);
    setDeleteDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setCurrentPage(1);
  };

  const handleDeleteSuccess = () => {
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Toolbar/Header - Responsive */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h1 className="text-lg sm:text-xl font-semibold">Redeem Kuota</h1>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-64 lg:w-80 xl:w-96 rounded-md border px-3 text-sm"
              />
              <div className="flex gap-2">
                {canCreate && (
                  <button
                    onClick={() => setCreateModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm text-white hover:bg-[#73122E] transition whitespace-nowrap"
                  >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Tambah Redeem</span>
                    <span className="sm:hidden">Tambah</span>
                  </button>
                )}
                {canExport && (
                  <button
                    onClick={() => setExportModalOpen(true)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Export Report</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-6">
            <RedeemFilters
              startDate={startDate}
              endDate={endDate}
              category={category}
              cardType={cardType}
              redeemType={redeemType}
              stationId={stationId}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
              onCategoryChange={setCategory}
              onCardTypeChange={setCardType}
              onRedeemTypeChange={setRedeemType}
              onStationIdChange={setStationId}
              onReset={handleResetFilters}
              categories={categories}
              cardTypes={cardTypes}
              stations={stations}
              isLoading={isLoadingRedeems}
            />
          </div>

          {/* Table */}
          <div className="mb-4">
            <RedeemTable
              data={redeems}
              onUploadLastDoc={handleUploadDoc}
              onDelete={handleDelete}
              canDelete={canDelete}
              isLoading={isLoadingRedeems}
            />
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-md border text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md border text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateRedeemModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      <RedeemDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        data={selectedRedeem}
      />

      <LastRedeemDocModal
        isOpen={uploadDocModalOpen}
        onClose={() => setUploadDocModalOpen(false)}
        data={selectedRedeem}
        onSuccess={handleCreateSuccess}
      />

      <DeleteRedeemDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        data={selectedRedeem}
        onSuccess={handleDeleteSuccess}
      />

      {/* Export Modal */}
      <ExportRedeemModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />
    </div>
  );
}
