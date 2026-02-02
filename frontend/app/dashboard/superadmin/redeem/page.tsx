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
import DeletedRedeemTable from '@/components/redeem/DeletedRedeemTable';
import { getStations } from '@/lib/services/station.service';
import { apiFetch } from '@/lib/apiConfig';

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
      const data = res?.data?.items || [];
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

  // Deleted Redeems State
  const [deletedRedeems, setDeletedRedeems] = useState<RedeemItem[]>([]);
  const [isLoadingDeleted, setIsLoadingDeleted] = useState(false);
  const [deletedPage, setDeletedPage] = useState(1);
  const [deletedPagination, setDeletedPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

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
  const [searchInput, setSearchInput] = useState('');

  // Debounce search input
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setSearch(searchInput);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // State for filters
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
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
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: category || undefined,
        cardType: cardType || undefined,
        stationId: stationId || undefined,
        search: search || undefined,
        ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, startDate, endDate]);

  const loadOptionsFromProducts = async (currentProduct: 'FWC' | 'VOUCHER') => {
    try {
      const res = await apiFetch(`/card/product?programType=${currentProduct}`);
      const filteredProducts = res?.data || [];

      // Extract unique categories
      const uniqueCategories = Array.from(new Set(filteredProducts.map((p: any) => p.category?.categoryName))).filter(Boolean).sort();

      // Extract unique types
      const uniqueTypes = Array.from(new Set(filteredProducts.map((p: any) => p.type?.typeName))).filter(Boolean).sort();

      setCategories(uniqueCategories);
      setCardTypes(uniqueTypes);
    } catch (error) {
      console.error('Failed to load product options', error);
      setCategories([]);
      setCardTypes([]);
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
      const paginationData = response.pagination || { page: 1, limit: 10, total: 0 };
      setRedeems(Array.isArray(items) ? items : []);
      setPagination({
        page: paginationData.page || 1,
        limit: paginationData.limit || 10,
        total: paginationData.total || 0,
      });
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengambil data redeem');
      setRedeems([]);
      setPagination({ page: 1, limit: 10, total: 0 });
    } finally {
      setIsLoadingRedeems(false);
    }
  };

  const loadDeletedRedeems = async (filters: RedeemFilterParams) => {
    setIsLoadingDeleted(true);
    const mergedFilters = {
      ...filters,
      isDeleted: true,
      limit: 10,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    };
    try {
      const response = await redeemService.listRedeems(mergedFilters);

      const items = response.data || [];
      const paginationData = response.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
      setDeletedRedeems(Array.isArray(items) ? items : []);
      setDeletedPagination({
        page: paginationData.page || 1,
        limit: paginationData.limit || 10,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 1,
      });
    } catch (error) {
      console.error('Failed to load deleted redeems', error);
      setDeletedRedeems([]);
      setDeletedPagination({ page: 1, limit: 10, total: 0, totalPages: 1 });
    } finally {
      setIsLoadingDeleted(false);
    }
  };

  // Trigger loadRedeems setiap filter berubah
  useEffect(() => {
    if (!isProductSelected) return;
    loadRedeems({
      page: 1,
      limit: 10,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
    loadDeletedRedeems({
      page: 1,
      limit: 10,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
    setCurrentPage(1);
  }, [startDate, endDate, category, cardType, stationId, search, product]);

  // Trigger loadDeletedRedeems setiap deletedPage berubah
  useEffect(() => {
    if (!isProductSelected) return;
    loadDeletedRedeems({
      page: deletedPage,
      limit: 10,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
  }, [deletedPage]); // Trigger only on deletedPage change (filters handled by separate effect)

  // Trigger loadRedeems setiap currentPage berubah (pagination)
  useEffect(() => {
    if (!isProductSelected) return;
    loadRedeems({
      page: currentPage,
      limit: 10,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
  }, [currentPage]);
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
      loadOptionsFromProducts(product);
    }
  }, [product]);




  const handleToolbarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setCardType('');
    setStationId('');
    setSearch('');
    setSearchInput('');
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
      limit: 10,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
    setCurrentPage(1);
    // Reload deleted list as well
    loadDeletedRedeems({
      page: 1,
      limit: 10,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
  };

  const handleDeleteSuccess = () => {
    loadRedeems({
      page: currentPage,
      limit: 10,
      startDate: startDate ? new Date(startDate).toISOString() : undefined,
      endDate: endDate ? (() => { const end = new Date(endDate); end.setHours(23, 59, 59, 999); return end.toISOString(); })() : undefined,
      category: category || undefined,
      cardType: cardType || undefined,
      stationId: stationId || undefined,
      search: search || undefined,
      ...(product === 'FWC' || product === 'VOUCHER' ? { product } : {})
    });
    // Reload deleted list to show newly deleted item
    loadDeletedRedeems({
      page: 1,
      limit: 10,
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
    <div className="min-h-screen space-y-6 p-0 sm:p-0 lg:p-0">
      <div className="max-w-7xl mx-auto">
        <div className="p-2 sm:p-3 lg:p-4">
          {/* Responsive Header: Title always on top, controls below, shrink buttons if needed */}
          {/* Responsive Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            {/* Left Group: Title + Product Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
              <h1 className="text-xl font-bold text-gray-900 whitespace-nowrap">Redeem Kuota</h1>

              <div className="flex items-center gap-2 w-full sm:w-auto">

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
                    setSearchInput('');
                    setCurrentPage(1);
                    setRedeems([]);
                    setPagination({ total: 0, page: 1, limit: 10 });
                  }}
                  className="h-10 flex-1 sm:w-48 rounded-md border border-[#8D1231] bg-red-50 px-3 text-sm font-semibold text-[#8D1231] focus:outline-none focus:ring-2 focus:ring-[#8D1231] transition-shadow cursor-pointer"
                >
                  <option value="">Pilih Produk</option>
                  <option value="FWC">FWC</option>
                  <option value="VOUCHER">VOUCHER</option>
                </select>
              </div>
            </div>

            {/* Right Group: Actions + Search */}
            {isProductSelected && (
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="flex gap-2 w-full sm:w-auto">
                  {canCreate && (
                    <button
                      onClick={() => setCreateModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md bg-[#8D1231] px-4 py-2 text-sm font-medium text-white hover:bg-[#73122E] transition-colors shadow-sm whitespace-nowrap"
                    >
                      <Plus size={16} />
                      <span>Tambah</span>
                    </button>
                  )}
                  {canExport && (
                    <button
                      onClick={() => setExportModalOpen(true)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                      <span>Export</span>
                    </button>
                  )}
                </div>

                {/* Search Field */}
                <form
                  onSubmit={handleToolbarSearch}
                  className="flex-1 sm:flex-none flex items-center gap-2 w-full sm:w-auto"
                >
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder="Cari serial/NIK/nama..."
                      className="h-10 w-full rounded-md border border-gray-300 pl-3 pr-10 text-sm focus:border-[#8D1231] focus:outline-none focus:ring-1 focus:ring-[#8D1231] transition-colors"
                    />
                    <button
                      type="submit"
                      className="absolute right-0 top-0 h-full px-3 text-gray-500 hover:text-[#8D1231] transition-colors"
                      aria-label="Cari"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                </form>
              </div>
            )}
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
                  total={pagination.total}
                  product={product as 'FWC' | 'VOUCHER'}
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
                    className={`px-3 py-1 ${p === pagination.page ? 'font-semibold underline' : ''
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

              {/* Deleted Redeem Table */}
              <DeletedRedeemTable
                data={deletedRedeems}
                isLoading={isLoadingDeleted}
                noDataMessage="Tidak ada data redeem yang dihapus"
                currentPage={deletedPagination.page}
                totalPages={deletedPagination.totalPages}
                totalCount={deletedPagination.total}
                onPageChange={setDeletedPage}
                product={product as 'FWC' | 'VOUCHER'}
              />

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
                currentFilters={{
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  category: category || undefined,
                  cardType: cardType || undefined,
                  stationId: stationId || undefined,
                  search: search || undefined,
                }}
                isSuperadmin={true}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}