'use client';

import { useEffect, useState, useContext } from 'react';
import toast from 'react-hot-toast';
import { redeemService, RedeemItem, RedeemFilterParams } from '@/lib/services/redeem/redeemService';
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
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50 });
  // ...existing code...
  const isProductSelected = product === 'FWC' || product === 'VOUCHER';

  // ...existing code...

  // Get permission hook dari role context
  const userCtx = useContext(UserContext);
  const currentRole = userCtx?.role;
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
      stationId: stationId || undefined,
      search: search || undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, category, cardType, stationId, search, currentPage]);

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
      setCategories(res?.data || []);
    } catch (error) {
      setCategories([]);
    }
  };

  const loadCardTypes = async () => {
    try {
      const res = await getCardTypes();
      setCardTypes(res?.data || []);
    } catch (error) {
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


}
