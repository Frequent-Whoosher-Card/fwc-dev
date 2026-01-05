'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { API_BASE_URL } from '@/lib/apiConfig'
import { CalendarIcon, DollarSignIcon, SearchIcon } from 'lucide-react'
import { toast } from 'sonner'

// Types
interface Member {
  id: string
  name: string
  identityNumber: string
  nippKai: string | null
  email: string | null
  phone: string | null
}

interface Card {
  id: string
  serialNumber: string
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
    masaBerlaku: number
  }
}

interface CardCategory {
  id: string
  categoryCode: string
  categoryName: string
}

interface CardType {
  id: string
  typeCode: string
  typeName: string
}

export default function CreatePurchasePage() {
  const router = useRouter()
  
  // Member state
  const [memberMode, setMemberMode] = useState<'select' | 'create'>('select')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([])
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isSearchingMember, setIsSearchingMember] = useState(false)
  
  // New member form
  const [newMember, setNewMember] = useState({
    name: '',
    identityNumber: '',
    nippKai: '',
    email: '',
    phone: '',
    gender: '',
    alamat: '',
    notes: ''
  })
  const [isCreatingMember, setIsCreatingMember] = useState(false)
  
  // Card state
  const [cardSearchQuery, setCardSearchQuery] = useState('')
  const [cardSearchResults, setCardSearchResults] = useState<Card[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [isSearchingCard, setIsSearchingCard] = useState(false)
  
  // Card categories and types
  const [cardCategories, setCardCategories] = useState<CardCategory[]>([])
  const [cardTypes, setCardTypes] = useState<CardType[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [selectedTypeId, setSelectedTypeId] = useState<string>('')
  
  // Transaction form
  const [edcReferenceNumber, setEdcReferenceNumber] = useState('')
  const [price, setPrice] = useState<string>('')
  const [notes, setNotes] = useState('')
  
  // Auto-calculated fields
  const [expiredDate, setExpiredDate] = useState<string>('')
  const [purchasedDate, setPurchasedDate] = useState<string>('')
  const [station, setStation] = useState<string>('')
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load card categories and types on mount
  useEffect(() => {
    const loadCardCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/card-categories`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setCardCategories(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load card categories:', error)
      }
    }

    const loadCardTypes = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/card-types`, {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          setCardTypes(data.data || [])
        }
      } catch (error) {
        console.error('Failed to load card types:', error)
      }
    }

    loadCardCategories()
    loadCardTypes()
    
    // Set purchased date to today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    setPurchasedDate(today.toISOString().split('T')[0])
  }, [])

  // Search members with debounce
  useEffect(() => {
    if (memberSearchQuery.trim().length < 2) {
      setMemberSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingMember(true)
      try {
        const response = await fetch(
          `${API_BASE_URL}/members?search=${encodeURIComponent(memberSearchQuery)}&limit=10`,
          { credentials: 'include' }
        )
        if (response.ok) {
          const data = await response.json()
          setMemberSearchResults(data.data?.items || [])
        }
      } catch (error) {
        console.error('Failed to search members:', error)
      } finally {
        setIsSearchingMember(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [memberSearchQuery])

  // Search cards with debounce
  useEffect(() => {
    if (cardSearchQuery.trim().length < 2 && !selectedCategoryId && !selectedTypeId) {
      setCardSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsSearchingCard(true)
      try {
        const params = new URLSearchParams()
        if (cardSearchQuery.trim()) {
          params.append('search', cardSearchQuery.trim())
        }
        if (selectedCategoryId) {
          params.append('categoryId', selectedCategoryId)
        }
        if (selectedTypeId) {
          params.append('typeId', selectedTypeId)
        }
        params.append('status', 'IN_STATION')
        params.append('limit', '10')

        const response = await fetch(
          `${API_BASE_URL}/cards?${params.toString()}`,
          { credentials: 'include' }
        )
        if (response.ok) {
          const data = await response.json()
          setCardSearchResults(data.data?.items || [])
        }
      } catch (error) {
        console.error('Failed to search cards:', error)
      } finally {
        setIsSearchingCard(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [cardSearchQuery, selectedCategoryId, selectedTypeId])

  // Handle member selection
  const handleSelectMember = async (memberId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/members/${memberId}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const member = data.data
        setSelectedMemberId(memberId)
        setSelectedMember(member)
        setMemberSearchQuery('')
        setMemberSearchResults([])
      }
    } catch (error) {
      console.error('Failed to fetch member:', error)
      toast.error('Gagal memuat data member')
    }
  }

  // Handle create new member
  const handleCreateMember = async () => {
    if (!newMember.name || !newMember.identityNumber) {
      toast.error('Nama dan NIK wajib diisi')
      return
    }

    setIsCreatingMember(true)
    try {
      const response = await fetch(`${API_BASE_URL}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: newMember.name,
          identityNumber: newMember.identityNumber,
          nippKai: newMember.nippKai || undefined,
          email: newMember.email || undefined,
          phone: newMember.phone || undefined,
          gender: newMember.gender || undefined,
          alamat: newMember.alamat || undefined,
          notes: newMember.notes || undefined
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newMemberData = data.data
        setSelectedMemberId(newMemberData.id)
        setSelectedMember(newMemberData)
        setMemberMode('select')
        toast.success('Member berhasil didaftarkan')
        
        // Reset form
        setNewMember({
          name: '',
          identityNumber: '',
          nippKai: '',
          email: '',
          phone: '',
          gender: '',
          alamat: '',
          notes: ''
        })
      } else {
        const error = await response.json()
        toast.error(error.error?.message || 'Gagal mendaftarkan member')
      }
    } catch (error) {
      console.error('Failed to create member:', error)
      toast.error('Gagal mendaftarkan member')
    } finally {
      setIsCreatingMember(false)
    }
  }

  // Handle card selection
  const handleSelectCard = async (cardId: string) => {
    try {
      // TODO: Endpoint GET /cards/:id dengan include cardProduct perlu dibuat
      // Untuk sementara, menggunakan endpoint yang mungkin sudah ada
      const response = await fetch(`${API_BASE_URL}/cards/${cardId}?include=cardProduct`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        const card = data.data
        setSelectedCardId(cardId)
        setSelectedCard(card)
        setCardSearchQuery('')
        setCardSearchResults([])
        
        // Set default price
        if (card.cardProduct?.price) {
          setPrice(parseFloat(card.cardProduct.price).toString())
        }
        
        // Calculate expired date
        if (card.cardProduct?.masaBerlaku) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const expired = new Date(today)
          expired.setDate(expired.getDate() + card.cardProduct.masaBerlaku)
          setExpiredDate(expired.toISOString().split('T')[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch card:', error)
      toast.error('Gagal memuat data kartu')
    }
  }

  // Handle submit purchase
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!selectedMemberId) {
      toast.error('Member harus dipilih atau didaftarkan')
      return
    }

    if (!selectedCardId) {
      toast.error('Kartu harus dipilih')
      return
    }

    if (!edcReferenceNumber.trim()) {
      toast.error('No. Reference EDC wajib diisi')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_BASE_URL}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cardId: selectedCardId,
          memberId: selectedMemberId,
          edcReferenceNumber: edcReferenceNumber.trim(),
          price: price ? parseFloat(price) : undefined,
          notes: notes || undefined
        })
      })

      if (response.ok) {
        toast.success('Transaksi berhasil dibuat')
        router.push('/dashboard/petugas/transaksi')
      } else {
        const error = await response.json()
        toast.error(error.error?.message || 'Gagal membuat transaksi')
      }
    } catch (error) {
      console.error('Failed to create purchase:', error)
      toast.error('Gagal membuat transaksi')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Purchased</h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Member Section */}
          <div className="space-y-4">
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="memberMode"
                  checked={memberMode === 'select'}
                  onChange={() => setMemberMode('select')}
                  className="w-4 h-4"
                />
                <span>Pilih Member yang Ada</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="memberMode"
                  checked={memberMode === 'create'}
                  onChange={() => setMemberMode('create')}
                  className="w-4 h-4"
                />
                <span>Daftar Member Baru</span>
              </label>
            </div>

            {memberMode === 'select' ? (
              <div className="space-y-4">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Cari member (nama, NIK, email, phone)..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                {isSearchingMember && (
                  <p className="text-sm text-gray-500">Mencari...</p>
                )}
                
                {memberSearchResults.length > 0 && (
                  <div className="border rounded-md max-h-48 overflow-y-auto">
                    {memberSearchResults.map((member) => (
                      <div
                        key={member.id}
                        onClick={() => handleSelectMember(member.id)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">
                          NIK: {member.identityNumber}
                          {member.phone && ` | Phone: ${member.phone}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedMember && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700 font-medium">Member terpilih: {selectedMember.name}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4 border p-4 rounded-md">
                <div>
                  <Label>Customer Name *</Label>
                  <Input
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                    placeholder="Customer Name"
                    required
                  />
                </div>
                <div>
                  <Label>NIP</Label>
                  <Input
                    value={newMember.nippKai}
                    onChange={(e) => setNewMember({ ...newMember, nippKai: e.target.value })}
                    placeholder="NIP"
                  />
                </div>
                <div>
                  <Label>NIK *</Label>
                  <Input
                    value={newMember.identityNumber}
                    onChange={(e) => setNewMember({ ...newMember, identityNumber: e.target.value })}
                    placeholder="NIK"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={newMember.email}
                      onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                      placeholder="Email"
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={newMember.phone}
                      onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                      placeholder="Phone"
                    />
                  </div>
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={newMember.gender}
                    onValueChange={(value) => setNewMember({ ...newMember, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Laki-laki</SelectItem>
                      <SelectItem value="P">Perempuan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Alamat</Label>
                  <Input
                    value={newMember.alamat}
                    onChange={(e) => setNewMember({ ...newMember, alamat: e.target.value })}
                    placeholder="Alamat"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleCreateMember}
                  disabled={isCreatingMember}
                  className="w-full"
                >
                  {isCreatingMember ? 'Mendaftarkan...' : 'Daftar Member'}
                </Button>
              </div>
            )}

            {/* Display selected member info (read-only) */}
            {selectedMember && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div>
                  <Label>Customer Name</Label>
                  <Input value={selectedMember.name} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>NIP</Label>
                  <Input value={selectedMember.nippKai || ''} readOnly className="bg-gray-50" />
                </div>
                <div>
                  <Label>NIK</Label>
                  <Input value={selectedMember.identityNumber} readOnly className="bg-gray-50" />
                </div>
              </div>
            )}
          </div>

          {/* Card Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Card Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Card Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.categoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Card Type</Label>
                <Select
                  value={selectedTypeId}
                  onValueChange={setSelectedTypeId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Card Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cardTypes
                      .filter((type) => !selectedCategoryId || true) // Filter by category if needed
                      .map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.typeName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Serial Number</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Cari kartu (serial number)..."
                  value={cardSearchQuery}
                  onChange={(e) => setCardSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {isSearchingCard && (
                <p className="text-sm text-gray-500 mt-2">Mencari...</p>
              )}
              
              {cardSearchResults.length > 0 && (
                <div className="border rounded-md max-h-48 overflow-y-auto mt-2">
                  {cardSearchResults.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleSelectCard(card.id)}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                    >
                      <div className="font-medium">{card.serialNumber}</div>
                      <div className="text-sm text-gray-500">
                        {card.cardProduct?.category?.categoryName} - {card.cardProduct?.type?.typeName}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedCard && (
                <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-700 font-medium">
                    Kartu terpilih: {selectedCard.serialNumber}
                  </p>
                </div>
              )}
            </div>

            {/* Display selected card info (read-only) */}
            {selectedCard && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label>Card Category</Label>
                  <Input
                    value={selectedCard.cardProduct?.category?.categoryName || ''}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label>Card Type</Label>
                  <Input
                    value={selectedCard.cardProduct?.type?.typeName || ''}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Serial Number</Label>
                  <Input
                    value={selectedCard.serialNumber}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Transaction Section */}
          <div className="space-y-4 border-t pt-6">
            <div>
              <Label>No. Reference EDC *</Label>
              <Input
                value={edcReferenceNumber}
                onChange={(e) => setEdcReferenceNumber(e.target.value)}
                placeholder="No. Reference EDC"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expired Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    type="date"
                    value={expiredDate}
                    readOnly
                    className="bg-gray-50 pr-10"
                  />
                </div>
              </div>
              <div>
                <Label>FWC Price</Label>
                <div className="relative">
                  <DollarSignIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="FWC Price"
                    min="0"
                    step="0.01"
                    className="pr-10"
                  />
                </div>
                {selectedCard && (
                  <p className="text-xs text-gray-500 mt-1">
                    Default: Rp {parseFloat(selectedCard.cardProduct?.price || '0').toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchased Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  <Input
                    type="date"
                    value={purchasedDate}
                    readOnly
                    className="bg-gray-50 pr-10"
                  />
                </div>
              </div>
              <div>
                <Label>Stasiun</Label>
                <Input
                  value={station || 'Otomatis dari akun Anda'}
                  readOnly
                  className="bg-gray-50"
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes (optional)"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting || !selectedMemberId || !selectedCardId || !edcReferenceNumber.trim()}
              className="bg-red-700 hover:bg-red-800 text-white px-8"
            >
              {isSubmitting ? 'Menyimpan...' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

