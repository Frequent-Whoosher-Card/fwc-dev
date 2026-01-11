'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  getPurchases, 
  activateCard, 
  swapCard, 
  cancelPurchase,
  getPendingActivations,
  PurchaseListItem 
} from '@/lib/services/purchase.service'
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search,
  Repeat,
  Ban,
  Plus,
  AlertCircle
} from 'lucide-react'
import { PurchaseFlowGuide } from './components/PurchaseFlowGuide'

type ActivationStatus = 'PENDING' | 'ACTIVATED' | 'CANCELLED'

interface Purchase extends PurchaseListItem {
  activationStatus: ActivationStatus
  activatedAt?: string | null
  physicalCardSerialNumber?: string | null
  card: {
    id: string
    serialNumber: string
    assignedSerialNumber?: string | null
    status: string
    cardProduct: {
      id: string
      category: {
        id: string
        categoryCode: string
        categoryName: string
      }
      type: {
        id: string
        typeCode: string
        typeName: string
      }
      price: string
    }
  }
}

export default function PurchasesPage() {
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showPendingOnly, setShowPendingOnly] = useState(false)

  // Modal states
  const [activateModal, setActivateModal] = useState<{ open: boolean; purchase: Purchase | null }>({
    open: false,
    purchase: null
  })
  const [swapModal, setSwapModal] = useState<{ open: boolean; purchase: Purchase | null }>({
    open: false,
    purchase: null
  })
  const [cancelModal, setCancelModal] = useState<{ open: boolean; purchase: Purchase | null }>({
    open: false,
    purchase: null
  })

  // Form states
  const [physicalSerialNumber, setPhysicalSerialNumber] = useState('')
  const [correctSerialNumber, setCorrectSerialNumber] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const fetchPurchases = async () => {
    try {
      setLoading(true)
      let response
      
      if (showPendingOnly) {
        response = await getPendingActivations()
      } else {
        response = await getPurchases({
          page,
          limit: 10,
          search: searchQuery || undefined
        })
      }

      if (response.success) {
        if (showPendingOnly) {
          setPurchases(response.data)
          setTotalPages(1)
          setPendingCount(response.data.length)
        } else {
          setPurchases(response.data.items)
          setTotalPages(response.data.pagination.totalPages)
          // Count pending from items
          const pending = response.data.items.filter((p: Purchase) => p.activationStatus === 'PENDING')
          setPendingCount(pending.length)
        }
      }
    } catch (error) {
      toast.error('Gagal memuat data purchases')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPurchases()
  }, [page, showPendingOnly])

  const handleSearch = () => {
    setPage(1)
    fetchPurchases()
  }

  const handleActivate = async () => {
    if (!activateModal.purchase || !physicalSerialNumber.trim()) {
      toast.error('Serial number kartu fisik harus diisi')
      return
    }

    try {
      setSubmitting(true)
      const response = await activateCard(
        activateModal.purchase.id,
        physicalSerialNumber.trim()
      )

      if (response.success) {
        toast.success('Kartu berhasil diaktivasi!')
        setActivateModal({ open: false, purchase: null })
        setPhysicalSerialNumber('')
        fetchPurchases()
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal mengaktivasi kartu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSwap = async () => {
    if (!swapModal.purchase || !correctSerialNumber.trim()) {
      toast.error('Serial number kartu pengganti harus diisi')
      return
    }

    try {
      setSubmitting(true)
      const response = await swapCard(
        swapModal.purchase.id,
        correctSerialNumber.trim(),
        reason.trim() || undefined
      )

      if (response.success) {
        toast.success('Kartu berhasil ditukar!')
        setSwapModal({ open: false, purchase: null })
        setCorrectSerialNumber('')
        setReason('')
        fetchPurchases()
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal menukar kartu')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelModal.purchase) return

    try {
      setSubmitting(true)
      const response = await cancelPurchase(
        cancelModal.purchase.id,
        reason.trim() || undefined
      )

      if (response.success) {
        toast.success('Purchase berhasil dibatalkan!')
        setCancelModal({ open: false, purchase: null })
        setReason('')
        fetchPurchases()
      }
    } catch (error: any) {
      toast.error(error.message || 'Gagal membatalkan purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: ActivationStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )
      case 'ACTIVATED':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Activated
          </Badge>
        )
      case 'CANCELLED':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
            <XCircle className="w-3 h-3 mr-1" />
            Cancelled
          </Badge>
        )
    }
  }

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(Number(value))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Transaksi Purchase</h1>
          <p className="text-muted-foreground">
            Daftar transaksi pembelian kartu dengan two-step activation
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/petugas/transaksi/create')}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Purchase
        </Button>
      </div>

      {/* Alert for pending purchases */}
      {pendingCount > 0 && !showPendingOnly && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-amber-900">
              {pendingCount} Purchase Menunggu Aktivasi
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Ada purchase yang perlu diaktivasi. Klik tombol di bawah untuk melihat dan aktivasi.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="default"
                onClick={() => {
                  setShowPendingOnly(true)
                  setPage(1)
                }}
              >
                Lihat Pending
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowGuide(!showGuide)}
              >
                {showGuide ? 'Sembunyikan' : 'Lihat'} Panduan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Flow Guide */}
      {showGuide && <PurchaseFlowGuide />}

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search">Cari</Label>
          <div className="flex gap-2">
            <Input
              id="search"
              placeholder="Cari EDC Ref, Serial Number, Nama Member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Cari
            </Button>
          </div>
        </div>
        <Button
          variant={showPendingOnly ? 'default' : 'outline'}
          onClick={() => {
            setShowPendingOnly(!showPendingOnly)
            setPage(1)
          }}
        >
          <Clock className="w-4 h-4 mr-2" />
          {showPendingOnly ? 'Semua' : 'Pending Aktivasi'}
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>EDC Reference</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Kategori/Tipe</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : purchases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {showPendingOnly ? 'Tidak ada purchase yang menunggu aktivasi' : 'Tidak ada data purchase'}
                </TableCell>
              </TableRow>
            ) : (
              purchases.map((purchase) => (
                <TableRow key={purchase.id}>
                  <TableCell className="font-medium">
                    {purchase.edcReferenceNumber}
                  </TableCell>
                  <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{purchase.member?.name || '-'}</div>
                      <div className="text-sm text-muted-foreground">
                        {purchase.member?.identityNumber || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {purchase.card.assignedSerialNumber || purchase.card.serialNumber}
                    </div>
                    {purchase.physicalCardSerialNumber && (
                      <div className="text-xs text-muted-foreground">
                        Fisik: {purchase.physicalCardSerialNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {purchase.card.cardProduct.category.categoryName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {purchase.card.cardProduct.type.typeName}
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(purchase.price)}</TableCell>
                  <TableCell>{getStatusBadge(purchase.activationStatus)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {purchase.activationStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => {
                              setActivateModal({ open: true, purchase })
                              setPhysicalSerialNumber(purchase.card.assignedSerialNumber || purchase.card.serialNumber)
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aktivasi
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSwapModal({ open: true, purchase })}
                          >
                            <Repeat className="w-4 h-4 mr-1" />
                            Tukar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setCancelModal({ open: true, purchase })}
                          >
                            <Ban className="w-4 h-4 mr-1" />
                            Batal
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!showPendingOnly && totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="py-2 px-4">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Activate Modal */}
      <Dialog open={activateModal.open} onOpenChange={(open) => {
        setActivateModal({ open, purchase: null })
        setPhysicalSerialNumber('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aktivasi Kartu</DialogTitle>
            <DialogDescription>
              Scan atau input serial number kartu fisik yang diberikan ke customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Kartu yang di-assign:</Label>
              <p className="text-lg font-mono font-bold">
                {activateModal.purchase?.card.assignedSerialNumber || activateModal.purchase?.card.serialNumber}
              </p>
            </div>
            <div>
              <Label htmlFor="physicalSerial">Serial Number Kartu Fisik *</Label>
              <Input
                id="physicalSerial"
                placeholder="Scan atau ketik serial number"
                value={physicalSerialNumber}
                onChange={(e) => setPhysicalSerialNumber(e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground mt-1">
                Serial number harus sama dengan kartu yang di-assign
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActivateModal({ open: false, purchase: null })
                setPhysicalSerialNumber('')
              }}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleActivate} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Aktivasi Kartu'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Swap Card Modal */}
      <Dialog open={swapModal.open} onOpenChange={(open) => {
        setSwapModal({ open, purchase: null })
        setCorrectSerialNumber('')
        setReason('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tukar Kartu</DialogTitle>
            <DialogDescription>
              Ganti dengan kartu yang benar sebelum aktivasi
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Kartu saat ini:</Label>
              <p className="text-lg font-mono">
                {swapModal.purchase?.card.assignedSerialNumber || swapModal.purchase?.card.serialNumber}
              </p>
            </div>
            <div>
              <Label htmlFor="correctSerial">Serial Number Kartu Pengganti *</Label>
              <Input
                id="correctSerial"
                placeholder="Scan atau ketik serial number yang benar"
                value={correctSerialNumber}
                onChange={(e) => setCorrectSerialNumber(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="swapReason">Alasan (Opsional)</Label>
              <Textarea
                id="swapReason"
                placeholder="Contoh: Salah ambil kartu"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSwapModal({ open: false, purchase: null })
                setCorrectSerialNumber('')
                setReason('')
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

      {/* Cancel Purchase Modal */}
      <Dialog open={cancelModal.open} onOpenChange={(open) => {
        setCancelModal({ open, purchase: null })
        setReason('')
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Batalkan Purchase</DialogTitle>
            <DialogDescription>
              Purchase akan dibatalkan dan kartu dikembalikan ke status tersedia
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Perhatian:</strong> Purchase yang sudah dibatalkan tidak dapat diaktivasi kembali.
              </p>
            </div>
            <div>
              <Label htmlFor="cancelReason">Alasan Pembatalan (Opsional)</Label>
              <Textarea
                id="cancelReason"
                placeholder="Contoh: Customer membatalkan transaksi"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelModal({ open: false, purchase: null })
                setReason('')
              }}
              disabled={submitting}
            >
              Tidak Jadi
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={submitting}>
              {submitting ? 'Memproses...' : 'Ya, Batalkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
