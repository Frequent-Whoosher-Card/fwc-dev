'use client';

import { useEffect, useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem, RedeemFilterParams, ProductType } from '@/lib/services/redeem/redeemService';
import { useRedeemPermission } from '@/lib/hooks/useRedeemPermission';
import { UserContext } from '@/app/dashboard/admin/dashboard-layout';
import CreateRedeemModal from '@/components/redeem/CreateRedeemModal';
import RedeemTable from '@/components/redeem/RedeemTable';
import RedeemFilters from '@/components/redeem/RedeemFilters';
import RedeemDetailModal from '@/components/redeem/RedeemDetailModal';
import LastRedeemDocModal from '@/components/redeem/LastRedeemDocModal';
import DeleteRedeemDialog from '@/components/redeem/DeleteRedeemDialog';
import ExportRedeemModal from '@/components/redeem/ExportRedeemModal';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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


export default function AdminRedeemPage() {
  // State
  const [product, setProduct] = useState<'FWC' | 'VOUCHER' | ''>('');
  const [redeems, setRedeems] = useState<RedeemItem[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cardTypes, setCardTypes] = useState<any[]>([]);
  const [isLoadingRedeems, setIsLoadingRedeems] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [category, setCategory] = useState('');
  const [cardType, setCardType] = useState('');
  const [stationId, setStationId] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedRedeem, setSelectedRedeem] = useState<RedeemItem | null>(null);
  const isProductSelected = product === 'FWC' || product === 'VOUCHER';

  // Get permission hook dari role context
  const userCtx = useContext(UserContext);
  const currentRole = userCtx?.role;
  const permission = useRedeemPermission(currentRole);
  const { canDelete, canExport, canCreate } = permission;

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  useEffect(() => {
    loadStations();
  }, []);

  useEffect(() => {
    if (product) {
      loadOptionsFromProducts(product);
    } else {
      setCategories([]);
      setCardTypes([]);
    }
  }, [product]);

  useEffect(() => {
    if (isProductSelected) {
      loadRedeems({
        page: currentPage,
        limit: 10,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        category: category || undefined,
        cardType: cardType || undefined,
        stationId: stationId || undefined,
        search: search || undefined,
        product,
      });
    }
  }, [startDate, endDate, category, cardType, stationId, search, currentPage, product]);

  const loadRedeems = async (filters: RedeemFilterParams) => {
    setIsLoadingRedeems(true);
    try {
      const response = await redeemService.listRedeems(filters);
      const items = response.data || [];
      const paginationData = response.pagination || { page: 1, limit: 10, total: 0 };
      setRedeems(items);
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

  const loadStations = async () => {
    try {
      const res = await getStations();
      setStations(res?.data || []);
    } catch (error) {
      setStations([]);
    }
  };

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

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setCategory('');
    setCardType('');
    setStationId('');
    setSearch('');
    setCurrentPage(1);
  };

  // Responsive header and filter layout
  return (
    <div className="min-h-screen space-y-6 p-2 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="rounded-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
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
                <div className="flex flex-col gap-2 w-full sm:flex-row sm:gap-3 sm:w-auto">
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
              )}
            </div>
          </div>
          {isProductSelected && (
            <>
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
                  stations={stations}
                  isLoading={isLoadingRedeems}
                  product={product as 'FWC' | 'VOUCHER'}
                  disabled={!isProductSelected}
                />
              </div>
              <div className="mb-4 overflow-x-auto rounded-lg border bg-white">
                <RedeemTable
                  data={redeems}
                  onUploadLastDoc={item => {
                    setSelectedRedeem(item);
                    setUploadDocModalOpen(true);
                  }}
                  onDelete={item => {
                    setSelectedRedeem(item);
                    setDeleteDialogOpen(true);
                  }}
                  canDelete={canDelete}
                  isLoading={isLoadingRedeems}
                  noDataMessage={isProductSelected ? undefined : 'Pilih produk terlebih dulu'}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, pagination.page - 3), pagination.page + 2)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setCurrentPage(p);
                      }}
                      className={`px-3 py-1 ${p === pagination.page ? 'font-semibold underline' : ''}`}
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
                onSuccess={() => loadRedeems({
                  page: 1,
                  limit: 10,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  category: category || undefined,
                  cardType: cardType || undefined,
                  stationId: stationId || undefined,
                  search: search || undefined,
                  product,
                })}
                initialProduct={product as 'FWC' | 'VOUCHER' | undefined}
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
                onSuccess={() => loadRedeems({
                  page: 1,
                  limit: 50,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  category: category || undefined,
                  cardType: cardType || undefined,
                  stationId: stationId || undefined,
                  search: search || undefined,
                  product,
                })}
              />
              <DeleteRedeemDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                data={selectedRedeem}
                onSuccess={() => loadRedeems({
                  page: currentPage,
                  limit: 50,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  category: category || undefined,
                  cardType: cardType || undefined,
                  stationId: stationId || undefined,
                  search: search || undefined,
                  product,
                })}
              />
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
                isSuperadmin={false}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
