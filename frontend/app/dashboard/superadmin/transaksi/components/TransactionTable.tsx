'use client';

import { useEffect, useState } from 'react';
import { 
  getPurchases, 
  activateCard, 
  swapCard, 
  cancelPurchase 
} from '@/lib/services/purchase.service';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Repeat,
  Ban
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type ActivationStatus = 'PENDING' | 'ACTIVATED' | 'CANCELLED';

interface Purchase {
  id: string;
  purchaseDate: string;
  price: number;
  edcReferenceNumber: string;
  activationStatus: ActivationStatus;
  activatedAt?: string | null;
  physicalCardSerialNumber?: string | null;
  card: {
    id: string;
    serialNumber: string;
    assignedSerialNumber?: string | null;
    status: string;
    expiredDate: string | null;
    quotaTicket: number;
    cardProduct: {
      id: string;
      totalQuota: number;
      masaBerlaku: number;
      category: {
        id: string;
        categoryName: string;
      };
      type: {
        id: string;
        typeName: string;
      };
    };
  };
  member: {
    id: string;
    name: string;
    identityNumber: string;
  } | null;
  operator: {
    id: string;
    fullName: string;
  };
  station: {
    id: string;
    stationName: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalPages: number;
  total: number;
}

const formatDate = (iso?: string | null) => {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export default function TransactionTable() {
  const [data, setData] = useState<Purchase[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    totalPages: 1,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [activateModal, setActivateModal] = useState<{ open: boolean; purchase: Purchase | null }>({
    open: false,
    purchase: null
  });
  const [swapModal, setSwapModal] = useState<{ open: boolean; purchase: Purchase | null }>({
    open: false,
    purchase: null
  });
  const [cancelModal, setCancelModal] = useState<{ open: boolean; purchase: Purchase | null }>({
    open: false,
    purchase: null
  });

  // Form states
  const [physicalSerialNumber, setPhysicalSerialNumber] = useState('');
  const [correctSerialNumber, setCorrectSerialNumber] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPurchases = async (page: number = 1) => {
    try {
      setLoading(true);
      const res = await getPurchases({ page, limit: 10 });
      
      if (res.success && res.data) {
        setData(res.data.items || []);
        setPagination(res.data.pagination || pagination);
      }
    } catch (err) {
      console.error('Error fetching purchases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases(pagination.page);
  }, [pagination.page]);

  const handleActivate = async () => {
    if (!activateModal.purchase || !physicalSerialNumber.trim()) {
      toast.error('Serial number kartu fisik harus diisi');
      return;
    }

    try {
      setSubmitting(true);
      const response = await activateCard(
        activateModal.purchase.id,
        physicalSerialNumber.trim()
      );

      if (response.success) {
        toast.success('Kartu berhasil diaktivasi!');
        setActivateModal({ open: false, purchase: null });
        setPhysicalSerialNumber('');
        fetchPurchases(pagination.page);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengaktivasi kartu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwap = async () => {
    if (!swapModal.purchase || !correctSerialNumber.trim()) {
      toast.error('Serial number kartu pengganti harus diisi');
      return;
    }

    try {
      setSubmitting(true);
      const response = await swapCard(
        swapModal.purchase.id,
        correctSerialNumber.trim(),
        reason.trim() || undefined
      );

      if (response.success) {
        toast.success('Kartu berhasil ditukar!');
        setSwapModal({ open: false, purchase: null });
        setCorrectSerialNumber('');
        setReason('');
        fetchPurchases(pagination.page);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menukar kartu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelModal.purchase) return;

    try {
      setSubmitting(true);
      const response = await cancelPurchase(
        cancelModal.purchase.id,
        reason.trim() || undefined
      );

      if (response.success) {
        toast.success('Purchase berhasil dibatalkan!');
        setCancelModal({ open: false, purchase: null });
        setReason('');
        fetchPurchases(pagination.page);
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal membatalkan purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: ActivationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'ACTIVATED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-100 text-green-700">
            <CheckCircle2 className="w-3 h-3" />
            Activated
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
    }
  };

  const pageNumbers = Array.from(
    { length: pagination.totalPages },
    (_, i) => i + 1
  ).slice(
    Math.max(0, pagination.page - 3),
    pagination.page + 2
  );

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
              <th className="px-3 py-2 text-left whitespace-nowrap">Purchase Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Masa Berlaku</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Expired Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Status Card</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Activation Status</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Card Category</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Card Type</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Total Quota</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Remaining Quota</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Serial Number</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">No. Reference EDC</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">FWC Price</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Shift Date</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Operator Name</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Stasiun</th>
              <th className="px-3 py-2 text-left whitespace-nowrap">Aksi</th>
          </tr>
        </thead>

        <tbody>
            {loading ? (
              <tr>
                <td colSpan={16} className="px-3 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
          <tr>
                <td colSpan={16} className="px-3 py-6 text-center text-gray-400">
              No data
            </td>
          </tr>
            ) : (
              data.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.purchaseDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.card.cardProduct.masaBerlaku} hari
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.card.expiredDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        item.card.status === 'SOLD_ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : item.card.status === 'ASSIGNED'
                          ? 'bg-blue-100 text-blue-700'
                          : item.card.status === 'EXPIRED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {item.card.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {getStatusBadge(item.activationStatus)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.card.cardProduct.category.categoryName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.card.cardProduct.type.typeName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.card.cardProduct.totalQuota}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.card.quotaTicket}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    <div>{item.card.assignedSerialNumber || item.card.serialNumber}</div>
                    {item.physicalCardSerialNumber && (
                      <div className="text-xs text-gray-500">
                        Physical: {item.physicalCardSerialNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-mono">
                    {item.edcReferenceNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {formatDate(item.purchaseDate)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.operator.fullName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.station.stationName}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {item.activationStatus === 'PENDING' ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => setActivateModal({ open: true, purchase: item })}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Aktivasi"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSwapModal({ open: true, purchase: item })}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Tukar Kartu"
                        >
                          <Repeat className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCancelModal({ open: true, purchase: item })}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Batalkan"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
        </tbody>
      </table>
      </div>

      {/* PAGINATION */}
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          <button
            disabled={pagination.page === 1}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                page: p.page - 1,
              }))
            }
            className="px-2 disabled:opacity-40"
          >
            <ChevronLeft size={18} />
          </button>

          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() =>
                setPagination((pg) => ({
                  ...pg,
                  page: p,
                }))
              }
              className={`px-3 py-1 ${
                p === pagination.page
                  ? 'font-semibold underline'
                  : ''
              }`}
            >
              {p}
            </button>
          ))}

          <button
            disabled={pagination.page === pagination.totalPages}
            onClick={() =>
              setPagination((p) => ({
                ...p,
                page: p.page + 1,
              }))
            }
            className="px-2 disabled:opacity-40"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Activation Modal */}
      <Dialog open={activateModal.open} onOpenChange={(open) => {
        setActivateModal({ open, purchase: open ? activateModal.purchase : null });
        if (!open) setPhysicalSerialNumber('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktivasi Kartu</DialogTitle>
            <DialogDescription>
              Masukkan serial number dari kartu fisik untuk mengaktivasi
            </DialogDescription>
          </DialogHeader>
          {activateModal.purchase && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg text-sm space-y-1">
                <div><strong>Member:</strong> {activateModal.purchase.member?.name}</div>
                <div><strong>Assigned Serial:</strong> {activateModal.purchase.card.assignedSerialNumber}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="physicalSerial">Physical Serial Number</Label>
                <Input
                  id="physicalSerial"
                  value={physicalSerialNumber}
                  onChange={(e) => setPhysicalSerialNumber(e.target.value)}
                  placeholder="Scan atau input serial kartu fisik"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  Serial number harus sama dengan assigned serial
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActivateModal({ open: false, purchase: null });
                setPhysicalSerialNumber('');
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleActivate} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Aktivasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap Modal */}
      <Dialog open={swapModal.open} onOpenChange={(open) => {
        setSwapModal({ open, purchase: open ? swapModal.purchase : null });
        if (!open) {
          setCorrectSerialNumber('');
          setReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tukar Kartu</DialogTitle>
            <DialogDescription>
              Tukar dengan kartu yang benar sebelum aktivasi
            </DialogDescription>
          </DialogHeader>
          {swapModal.purchase && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-lg text-sm space-y-1">
                <div><strong>Member:</strong> {swapModal.purchase.member?.name}</div>
                <div><strong>Serial Sekarang:</strong> {swapModal.purchase.card.assignedSerialNumber}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="correctSerial">Serial Number Pengganti</Label>
                <Input
                  id="correctSerial"
                  value={correctSerialNumber}
                  onChange={(e) => setCorrectSerialNumber(e.target.value)}
                  placeholder="Serial number kartu yang benar"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="swapReason">Alasan (Opsional)</Label>
                <Textarea
                  id="swapReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Kenapa perlu ditukar?"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSwapModal({ open: false, purchase: null });
                setCorrectSerialNumber('');
                setReason('');
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSwap} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Tukar Kartu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => {
        setCancelModal({ open, purchase: open ? cancelModal.purchase : null });
        if (!open) setReason('');
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Purchase</DialogTitle>
            <DialogDescription>
              Kartu akan dikembalikan ke inventory
            </DialogDescription>
          </DialogHeader>
          {cancelModal.purchase && (
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-lg text-sm space-y-1">
                <div><strong>Member:</strong> {cancelModal.purchase.member?.name}</div>
                <div><strong>Serial:</strong> {cancelModal.purchase.card.assignedSerialNumber}</div>
                <div><strong>EDC Ref:</strong> {cancelModal.purchase.edcReferenceNumber}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cancelReason">Alasan Pembatalan (Opsional)</Label>
                <Textarea
                  id="cancelReason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Kenapa purchase dibatalkan?"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelModal({ open: false, purchase: null });
                setReason('');
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={submitting}
            >
              {submitting ? 'Memproses...' : 'Batalkan Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
