  // const [redeemType, setRedeemType] = useState('');
  // setRedeemType('');
  // redeemType removed
  // redeemType removed
'use client';

import { useEffect, useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem, RedeemFilterParams } from '@/lib/services/redeem/redeemService';
import { useRedeemPermission } from '@/lib/hooks/useRedeemPermission';
import { UserContext } from '@/app/dashboard/superadmin/dashboard/dashboard-layout';
import CreateRedeemModal from '@/components/redeem/CreateRedeemModal';
import RedeemTable from '@/components/redeem/RedeemTable';
import RedeemFilters from '@/components/redeem/RedeemFilters';
import RedeemDetailModal from '@/components/redeem/RedeemDetailModal';
import LastRedeemDocModal from '@/components/redeem/LastRedeemDocModal';
import DeleteRedeemDialog from '@/components/redeem/DeleteRedeemDialog';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
// Search input for toolbar
import React from 'react';
import ExportRedeemModal from '@/components/redeem/ExportRedeemModal';
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

export default function RedeemPage() {
  // Load stations for dropdown
  const loadStations = async () => {
    try {
      const res = await getStations();
      const data = res?.data || [];
      // Map to { id, name, city }
      const mapped = data.map((s: any) => ({
        id: s.id,
        name: s.stationName || s.name,
        city: s.city || '',
      }));
      setStations(mapped);
    } catch (error) {
      setStations([]);
    }
  };

  // State for data
  const [product, setProduct] = useState<'FWC' | 'VOUCHER' | ''>('');
  const [redeems, setRedeems] = useState<RedeemItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [isLoadingRedeems, setIsLoadingRedeems] = useState(false);
  // Filter state
  // Helper to get today in YYYY-MM-DD
  const getToday = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  };
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [category, setCategory] = useState('');
  const [cardType, setCardType] = useState('');
  const [stationId, setStationId] = useState('');
  const [search, setSearch] = useState('');
  // State for filters
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
  // Helper: apakah produk sudah dipilih
  const isProductSelected = product === 'FWC' || product === 'VOUCHER';

  // Load data on first mount and whenever product, startDate, or endDate changes
  useEffect(() => {
    if (isProductSelected && startDate && endDate) {
      loadRedeems({
        page: 1,
        limit: 50,
        startDate: new Date(startDate).toISOString(),
        endDate: (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })(),
        category: category || undefined,
        cardType: cardType || undefined,
        stationId: stationId || undefined,
        search: search || undefined,
        ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, startDate, endDate]);

  const loadCategories = async () => {
    try {
      const res = await getCardCategories();
      setCategories(res?.data || []);
    } catch (error) {
      setCategories([]);
    }
  };

  const loadRedeems = async (filters: RedeemFilterParams) => {
    setIsLoadingRedeems(true);
    const mergedFilters = {
      ...filters,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    };
    try {
      const response = await redeemService.listRedeems(mergedFilters);
      const items = response.data || [];
      const paginationData = response.pagination || { page: 1, limit: 50, total: 0 };
      setRedeems(Array.isArray(items) ? items : []);
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

  // Trigger loadRedeems setiap filter berubah
  useEffect(() => {
    if (!isProductSelected) return;
    loadRedeems({
      page: 1,
      limit: 50,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
    setCurrentPage(1);
  }, [startDate, endDate, category, cardType, stationId, search, product]);
  // Ambil role user dari context yang sudah di-provide oleh dashboard-layout
  const userCtx = useContext(UserContext);
  const currentRole = userCtx?.role;

  // Get permission hook dari role context
  const permission = useRedeemPermission(currentRole);
  const { canDelete, canExport, canCreate } = permission;

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Load initial data and redeem data when product is selected
  useEffect(() => {
    if (product === 'FWC' || product === 'VOUCHER') {
      loadStations();
      loadCategories();
      loadCardTypes();
      loadRedeems({ page: 1, limit: 50 });
    }
  }, [product]);

  const loadCardTypes = async () => {
    try {
      const res = await getCardTypes();
      const data = res?.data;
      
      // Extract types from the response
      let types: string[] = [];
      if (Array.isArray(data)) {
        types = data.map((t: any) => t.typeName || t.name).filter(Boolean);
      } else if (data && typeof data === 'object') {
        const items = data.items || data.types || [];
        if (Array.isArray(items)) {
          types = items.map((t: any) => t.typeName || t.name).filter(Boolean);
        }
      }
      setCardTypes([...new Set(types)]); // Remove duplicates
    } catch (error) {
      console.error('Failed to load card types:', error);
      setCardTypes([]);
    }
  };


  const handleToolbarSearch = (value: string) => {
    setSearch(value);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setCardType('');
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
    loadRedeems({
      page: 1,
      limit: 50,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
    setCurrentPage(1);
  };

  const handleDeleteSuccess = () => {
    loadRedeems({
      page: currentPage,
      limit: 50,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
  };

  // Pagination numbers
  const pageNumbers = Array.from(
    { length: totalPages },
    (_, i) => i + 1
  ).slice(Math.max(0, pagination.page - 3), pagination.page + 2);

  return (
    <div className="min-h-screen space-y-6 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
          {/* Responsive Header: Title always on top, controls below, shrink buttons if needed */}
          <div className="flex flex-col gap-2 mb-6 w-full">
            <h1 className="text-lg sm:text-xl font-semibold flex-shrink-0 mb-1">Redeem Kuota</h1>
            <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:gap-3 sm:w-auto">
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">Pilih Jenis Produk:</span>
              <select
                value={product}
                onChange={e => {
                  const val = e.target.value as 'FWC' | 'VOUCHER' | '';
                  setProduct(val);
                  setStartDate('');
                  setEndDate('');
                  setCategory('');
                  setCardType('');
                  setStationId('');
                  setSearch('');
                  setCurrentPage(1);
                  setRedeems([]);
                  setPagination({ total: 0, page: 1, limit: 50 });
                }}
                className="h-9 w-full sm:w-44 rounded-md border px-3 text-sm font-semibold text-[#8D1231] bg-red-50 border-[#8D1231] focus:outline-none focus:ring-2 focus:ring-[#8D1231]"
              >
                <option value="">Pilih Produk</option>
                <option value="FWC">FWC</option>
                <option value="VOUCHER">VOUCHER</option>
              </select>
              {isProductSelected && (
                <div className="flex flex-col gap-2 w-full sm:flex-row sm:gap-3 sm:items-center sm:w-auto">
                  <div className="flex flex-row gap-2 w-full sm:w-auto">
                    {canCreate && (
                      <button
                        onClick={() => setCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-md bg-[#8D1231] px-2 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-[#73122E] transition whitespace-nowrap w-full sm:w-auto min-w-0"
                        style={{ minWidth: 0 }}
                      >
                        <Plus size={14} className="sm:hidden" />
                        <span className="hidden sm:inline">Tambah Redeem</span>
                        <span className="sm:hidden">Tambah</span>
                      </button>
                    )}
                    {canExport && (
                      <button
                        onClick={() => setExportModalOpen(true)}
                        className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-2 sm:px-4 py-2 text-xs sm:text-sm text-white hover:bg-blue-700 whitespace-nowrap w-full sm:w-auto min-w-0"
                        style={{ minWidth: 0 }}
                      >
                        <span className="hidden sm:inline">Export Report</span>
                        <span className="sm:hidden">Export</span>
                      </button>
                    )}
                  </div>
                  {/* Search Field */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      handleToolbarSearch(search);
                    }}
                    className="flex flex-row items-center gap-2 w-full sm:w-auto"
                  >
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Cari serial/NIK/nama pelanggan"
                      className="h-9 w-full sm:w-56 rounded-md border px-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#8D1231] border-gray-300"
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center rounded-md bg-gray-200 hover:bg-gray-300 px-2 py-2 text-gray-700"
                      aria-label="Cari"
                    >
                      <Search size={16} />
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Semua komponen terkait hanya muncul jika produk dipilih */}
          {isProductSelected && (
            <>
              {/* Filters - Responsive */}
              <div className="mb-6">
                <RedeemFilters
                  startDate={startDate}
                  endDate={endDate}
                  category={category}
                  cardType={cardType}
                  stationId={stationId}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                  onCategoryChange={setCategory}
                  onCardTypeChange={setCardType}
                  onStationIdChange={setStationId}
                  onReset={handleResetFilters}
                  categories={categories}
                  cardTypes={cardTypes}
                  categoryValueKey="categoryName"
                  cardTypeValueKey="typeName"
                  stations={stations}
                  isLoading={isLoadingRedeems}
                  product={product as 'FWC' | 'VOUCHER'}
                  disabled={!isProductSelected}
                />
              </div>

              {/* Table */}
              <div className="mb-4 overflow-x-auto rounded-lg border bg-white">
                <RedeemTable
                  data={redeems}
                  onUploadLastDoc={handleUploadDoc}
                  onDelete={handleDelete}
                  canDelete={canDelete}
                  isLoading={isLoadingRedeems}
                  noDataMessage={isProductSelected ? undefined : 'Pilih produk terlebih dulu'}
                />
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <button
                  disabled={pagination.page === 1}
                  onClick={() => {
                    if (pagination.page > 1) {
                      setCurrentPage(pagination.page - 1);
                    }
                  }}
                  className="px-2 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>

                {pageNumbers.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setCurrentPage(p);
                    }}
                    className={`px-3 py-1 ${
                      p === pagination.page ? 'font-semibold underline' : ''
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  disabled={pagination.page === totalPages}
                  onClick={() => {
                    if (pagination.page < totalPages) {
                      setCurrentPage(pagination.page + 1);
                    }
                  }}
                  className="px-2 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>

              {/* Modals */}
              <CreateRedeemModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleCreateSuccess}
                product={product as 'FWC' | 'VOUCHER'}
              />

              <RedeemDetailModal
                isOpen={detailModalOpen}
                onClose={() => setDetailModalOpen(false)}
                data={selectedRedeem}
                product={product as 'FWC' | 'VOUCHER'}
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
                product={product as 'FWC' | 'VOUCHER'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}