'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem, RedeemFilterParams } from '@/lib/services/redeem/redeemService';
import { useRedeemPermission } from '@/lib/hooks/useRedeemPermission';
import CreateRedeemModal from '@/components/redeem/CreateRedeemModal';
import RedeemTable from '@/components/redeem/RedeemTable';
import RedeemFilters from '@/components/redeem/RedeemFilters';
import RedeemDetailModal from '@/components/redeem/RedeemDetailModal';
import LastRedeemDocModal from '@/components/redeem/LastRedeemDocModal';
import DeleteRedeemDialog from '@/components/redeem/DeleteRedeemDialog';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Search } from 'lucide-react';
import React from 'react';
import ExportRedeemModal from '@/components/redeem/ExportRedeemModal';
import { getStations } from '@/lib/services/station.service';
import { getCardCategories, getCardTypes } from '@/lib/services/cardcategory';

export default function PetugasRedeemPage() {
// ...existing code...

  useEffect(() => {
    loadStations();
    loadCardTypes();
  }, []);

// ...existing code...
  // State
  const [product, setProduct] = useState<'FWC' | 'VOUCHER' | ''>('');
  const [redeems, setRedeems] = useState<RedeemItem[]>([]);
  const [stations, setStations] = useState<any[]>([]);
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
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [uploadDocModalOpen, setUploadDocModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedRedeem, setSelectedRedeem] = useState<RedeemItem | null>(null);
  const isProductSelected = product === 'FWC' || product === 'VOUCHER';

  // Permission
  const permission = useRedeemPermission('petugas');
  const { canDelete, canExport, canCreate } = permission;

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Load stations
  const loadStations = async () => {
    try {
      const res = await getStations();
      setStations(res?.data || []);
    } catch (error) {
      setStations([]);
    }
  };

  // Load card types
  const loadCardTypes = async () => {
    try {
      const res = await getCardTypes();
      setCardTypes(res?.data || []);
    } catch (error) {
      setCardTypes([]);
    }
  };

  // Load redeems
  const loadRedeems = async (filters: RedeemFilterParams) => {
    setIsLoadingRedeems(true);
    try {
      const payload = { ...filters };
      if (product === 'FWC' || product === 'VOUCHER') {
        payload.product = product;
      }
      const response = await redeemService.listRedeems(payload);
      setRedeems(response.data || []);
      setPagination(response.pagination || { total: 0, page: 1, limit: 50 });
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengambil data redeem');
      setRedeems([]);
      setPagination({ total: 0, page: 1, limit: 50 });
    } finally {
      setIsLoadingRedeems(false);
    }
  };

  useEffect(() => {
    loadStations();
    loadCardTypes();
  }, []);

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
                      setCurrentPage(1);
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
                  onReset={() => {
                    setStartDate('');
                    setEndDate('');
                    setCategory('');
                    setCardType('');
                    setStationId('');
                    setSearch('');
                    setCurrentPage(1);
                  }}
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
                />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-600">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2 disabled:opacity-40"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-2 disabled:opacity-40"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <CreateRedeemModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={() => {
                  loadRedeems({ page: 1, limit: 50 });
                  setCurrentPage(1);
                }}
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
                onSuccess={() => {
                  loadRedeems({ page: 1, limit: 50 });
                  setCurrentPage(1);
                }}
              />
              <DeleteRedeemDialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                data={selectedRedeem}
                onSuccess={() => {
                  loadRedeems({ page: currentPage, limit: 50 });
                }}
              />
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

interface Station {
  id: string;
  name: string;
  city?: string;
}

