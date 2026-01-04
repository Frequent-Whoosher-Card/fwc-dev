# Frontend Purchase Form Flow - Dengan Member Inline

Dokumentasi ini menjelaskan flow form purchase yang mendukung daftar member langsung di form purchase (inline).

## 📋 Overview

Setiap transaksi purchase **WAJIB** memiliki member. Form purchase mendukung:
1. **Pilih member yang sudah ada** (dropdown/search)
2. **Daftar member baru** langsung di form purchase (inline)

## 🎯 Flow Form Purchase

### **Step 1: Pilih atau Daftar Member**

#### **Opsi A: Pilih Member yang Sudah Ada**

```
┌─────────────────────────────────────────┐
│ [🔍 Search Member] atau [Dropdown ▼]    │
│                                          │
│ Search by:                               │
│ - Name                                   │
│ - Identity Number (NIK)                  │
│ - Email                                  │
│ - Phone                                  │
└─────────────────────────────────────────┘

Setelah pilih member → Auto-fill:
├─ Customer Name: [Read-only, auto-filled]
├─ NIP/NIPP KAI: [Read-only, auto-filled]
└─ NIK: [Read-only, auto-filled]
```

**API untuk Search Member:**
```http
GET /members?search={query}&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "Rama Wijaya",
        "identityNumber": "3201010101010001",
        "nippKai": "NIPP123",
        "email": "rama@example.com",
        "phone": "081234567890",
        ...
      }
    ],
    "pagination": {...}
  }
}
```

#### **Opsi B: Daftar Member Baru (Inline)**

```
┌─────────────────────────────────────────┐
│ [✓] Pilih Member yang Ada               │
│ [ ] Daftar Member Baru                  │
│                                          │
│ ┌─────────────────────────────────────┐ │
│ │ Customer Name: [Input Text]         │ │
│ │ NIP: [Input Text]                   │ │
│ │ NIK: [Input Text]                    │ │
│ │ Email: [Input Text] (optional)       │ │
│ │ Phone: [Input Text] (optional)       │ │
│ │ Gender: [Dropdown] (optional)        │ │
│ │ Alamat: [Textarea] (optional)        │ │
│ │ Notes: [Textarea] (optional)         │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**API untuk Daftar Member:**
```http
POST /members
Content-Type: application/json

{
  "name": "Rama Wijaya",
  "identityNumber": "3201010101010001",
  "nippKai": "NIPP123",
  "email": "rama@example.com",
  "phone": "081234567890",
  "gender": "L",
  "alamat": "Jl. Sudirman No. 123",
  "notes": "Member baru"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Member created successfully",
  "data": {
    "id": "new-member-uuid",
    "name": "Rama Wijaya",
    "identityNumber": "3201010101010001",
    ...
  }
}
```

**Setelah daftar member baru:**
- Auto-select member yang baru dibuat
- Auto-fill Customer Name, NIP, NIK (read-only)
- Lanjut ke Step 2

---

### **Step 2: Pilih Kartu**

```
┌─────────────────────────────────────────┐
│ [🔍 Search Card] atau [Dropdown ▼]      │
│                                          │
│ Search by:                               │
│ - Serial Number                          │
│ - Card Category & Type                   │
└─────────────────────────────────────────┘

Setelah pilih cardId → Auto-fill:
├─ Serial Number: [Read-only, auto-filled]
├─ Card Category: [Read-only, auto-filled]
├─ Card Type: [Read-only, auto-filled]
└─ FWC Price: [Editable, default dari product]
```

**API untuk Search Card:**
```http
GET /cards?status=IN_STATION&search={serialNumber}
```

**Note:** Perlu endpoint untuk search card yang available untuk purchase (status = IN_STATION)

---

### **Step 3: Input Data Transaksi**

```
┌─────────────────────────────────────────┐
│ No. Reference EDC: [Input Text] *        │
│                                          │
│ FWC Price: [Input Number]                │
│ (Default: dari cardProduct.price)        │
│ (Bisa di-edit untuk diskon/promo)        │
│                                          │
│ Notes: [Textarea] (optional)            │
└─────────────────────────────────────────┘
```

---

### **Step 4: Display Auto-filled Fields (Read-only)**

```
┌─────────────────────────────────────────┐
│ Expired Date: [Read-only]                │
│ (Auto-calculated: purchaseDate +         │
│  masaBerlaku dari product)              │
│                                          │
│ Purchased Date: [Read-only]              │
│ (Auto-set: hari ini 00:00:00)           │
│                                          │
│ Stasiun: [Read-only]                     │
│ (Auto: dari user.stationId)              │
└─────────────────────────────────────────┘
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│ FORM PURCHASE                             │
├─────────────────────────────────────────┤
│                                           │
│ STEP 1: MEMBER                           │
│ ┌─────────────────────────────────────┐ │
│ │ [ ] Pilih Member                    │ │
│ │   └─ Search/Dropdown                 │ │
│ │   └─ Setelah pilih → Auto-fill:      │ │
│ │      • Customer Name (read-only)     │ │
│ │      • NIP (read-only)               │ │
│ │      • NIK (read-only)               │ │
│ │                                      │ │
│ │ [ ] Daftar Member Baru               │ │
│ │   └─ Form inline                     │ │
│ │   └─ Setelah submit → Auto-select    │ │
│ │      & Auto-fill (read-only)         │ │
│ └─────────────────────────────────────┘ │
│                                           │
│ STEP 2: KARTU                            │
│ ┌─────────────────────────────────────┐ │
│ │ Search/Dropdown Card                 │ │
│ │ Setelah pilih → Auto-fill:           │ │
│ │   • Serial Number (read-only)        │ │
│ │   • Card Category (read-only)        │ │
│ │   • Card Type (read-only)             │ │
│ │   • FWC Price (editable)             │ │
│ └─────────────────────────────────────┘ │
│                                           │
│ STEP 3: TRANSAKSI                         │
│ ┌─────────────────────────────────────┐ │
│ │ No. Reference EDC: [input] *         │ │
│ │ FWC Price: [input, optional]        │ │
│ │ Notes: [textarea, optional]         │ │
│ └─────────────────────────────────────┘ │
│                                           │
│ STEP 4: AUTO-FILLED (Read-only)          │
│ ┌─────────────────────────────────────┐ │
│ │ Expired Date: [auto-calculated]     │ │
│ │ Purchased Date: [auto-set]          │ │
│ │ Stasiun: [auto dari user]           │ │
│ └─────────────────────────────────────┘ │
│                                           │
│ [Save Button]                             │
└─────────────────────────────────────────┘
```

---

## 📡 API Endpoints yang Dibutuhkan

### **1. Search Member (Sudah Ada)**
```http
GET /members?search={query}&limit=10
```
- Search by: name, identityNumber, email, phone
- Response: list members dengan pagination

### **2. Create Member (Sudah Ada)**
```http
POST /members
```
- Body: name, identityNumber, nippKai, email, phone, gender, alamat, notes
- Response: member yang baru dibuat

### **3. Get Member by ID (Untuk Validasi)**
```http
GET /members/:id
```
- Response: detail member

### **4. Search Available Cards (Perlu Dibuat)**
```http
GET /cards?status=IN_STATION&search={serialNumber}&categoryId={uuid}&typeId={uuid}
```
- Filter: status = IN_STATION (hanya kartu yang bisa dibeli)
- Search: by serialNumber
- Filter: by categoryId, typeId (optional)

### **5. Get Card by ID (Untuk Detail)**
```http
GET /cards/:id?include=cardProduct
```
- Response: detail card dengan cardProduct (untuk ambil price, masaBerlaku, dll)

### **6. Create Purchase (Sudah Ada)**
```http
POST /purchases
```
- Body: cardId, memberId (required), edcReferenceNumber, price (optional), notes (optional)
- Response: purchase yang baru dibuat

---

## 💻 Frontend Implementation Guide

### **State Management**

```typescript
interface PurchaseFormState {
  // Member Section
  memberMode: 'select' | 'create'; // 'select' atau 'create'
  selectedMemberId: string | null;
  memberSearchQuery: string;
  memberSearchResults: Member[];
  
  // Member Create Form (jika mode = 'create')
  newMember: {
    name: string;
    identityNumber: string;
    nippKai: string;
    email: string;
    phone: string;
    gender: string;
    alamat: string;
    notes: string;
  };
  
  // Member Display (read-only setelah pilih/daftar)
  memberDisplay: {
    name: string;
    nippKai: string;
    identityNumber: string;
  } | null;
  
  // Card Section
  selectedCardId: string | null;
  cardSearchQuery: string;
  cardSearchResults: Card[];
  
  // Card Display (read-only setelah pilih)
  cardDisplay: {
    serialNumber: string;
    category: string;
    type: string;
    defaultPrice: number;
  } | null;
  
  // Transaction Section
  edcReferenceNumber: string;
  price: number | null; // null = use default
  notes: string;
  
  // Auto-filled (read-only)
  expiredDate: string | null;
  purchasedDate: string;
  station: string;
}
```

### **Flow Logic**

```typescript
// 1. User pilih mode member
if (memberMode === 'select') {
  // Search member
  const results = await searchMembers(query);
  // User pilih dari results
  // → Set selectedMemberId
  // → Fetch member detail
  // → Set memberDisplay (read-only)
}

if (memberMode === 'create') {
  // User isi form member baru
  // Submit create member
  // → Get new memberId
  // → Set selectedMemberId
  // → Set memberDisplay (read-only)
  // → Switch mode ke 'select' (optional)
}

// 2. User pilih card
// Search available cards
const cards = await searchAvailableCards(query);
// User pilih card
// → Set selectedCardId
// → Fetch card detail with product
// → Set cardDisplay (read-only)
// → Calculate expiredDate (purchaseDate + masaBerlaku)
// → Set defaultPrice (dari cardProduct.price)

// 3. User input transaksi
// → edcReferenceNumber (required)
// → price (optional, default dari cardDisplay.defaultPrice)
// → notes (optional)

// 4. Submit purchase
const purchaseData = {
  cardId: selectedCardId,
  memberId: selectedMemberId, // Required!
  edcReferenceNumber: edcReferenceNumber,
  price: price || undefined, // Optional, akan use default jika undefined
  notes: notes || undefined
};

await createPurchase(purchaseData);
```

### **Validation**

```typescript
// Validasi sebelum submit
const validatePurchase = () => {
  const errors = [];
  
  // Member validation
  if (!selectedMemberId) {
    errors.push("Member harus dipilih atau didaftarkan");
  }
  
  // Card validation
  if (!selectedCardId) {
    errors.push("Kartu harus dipilih");
  }
  
  // EDC Reference Number validation
  if (!edcReferenceNumber || edcReferenceNumber.trim() === '') {
    errors.push("No. Reference EDC wajib diisi");
  }
  
  // Price validation (optional, tapi jika diisi harus >= 0)
  if (price !== null && price < 0) {
    errors.push("Harga tidak boleh negatif");
  }
  
  return errors;
};
```

---

## 🎨 UI/UX Recommendations

### **1. Member Section Toggle**
- Radio button atau Tab untuk switch antara "Pilih Member" dan "Daftar Member Baru"
- Jika pilih "Daftar Member Baru", tampilkan form inline
- Setelah daftar, auto-switch ke mode "Pilih Member" dengan member yang baru terpilih

### **2. Auto-fill Display**
- Field yang auto-filled ditampilkan dengan style berbeda (read-only, disabled, atau dengan icon lock)
- Bisa tambahkan tooltip: "Otomatis dari data member/kartu"

### **3. Search Member**
- Debounce search (500ms) untuk mengurangi API call
- Tampilkan loading state saat search
- Tampilkan "Tidak ditemukan" jika search kosong
- Tampilkan "Daftar Member Baru" di hasil search jika tidak ditemukan

### **4. Search Card**
- Filter hanya kartu dengan status IN_STATION
- Tampilkan serial number, category, type di hasil search
- Tampilkan default price di hasil search

### **5. Price Field**
- Tampilkan default price dari product
- Label: "FWC Price (Default: Rp 150.000)"
- Bisa di-edit untuk diskon/promo
- Validasi: tidak boleh negatif

### **6. Auto-calculated Fields**
- Expired Date: tampilkan dengan format yang jelas
  - "Expired Date: 15 Januari 2025 (365 hari dari purchase date)"
- Purchased Date: tampilkan dengan format yang jelas
  - "Purchased Date: 15 Januari 2024 (Hari ini)"
- Stasiun: tampilkan dengan format yang jelas
  - "Stasiun: Jakarta Pusat (Otomatis dari akun Anda)"

---

## ✅ Checklist Implementation

### **Backend (Sudah Selesai)**
- [x] `memberId` menjadi required di createPurchaseBody
- [x] Validasi memberId wajib ada di service
- [x] Update API documentation

### **Frontend (Perlu Implementasi)**
- [ ] Form purchase dengan toggle member (select/create)
- [ ] Search member dengan debounce
- [ ] Form daftar member inline
- [ ] Auto-fill member data setelah pilih/daftar
- [ ] Search available cards
- [ ] Auto-fill card data setelah pilih
- [ ] Input EDC Reference Number
- [ ] Input Price (optional, dengan default)
- [ ] Display auto-calculated fields (read-only)
- [ ] Validation sebelum submit
- [ ] Submit purchase dengan error handling

---

## 📝 Notes

1. **Member wajib ada**: Setiap transaksi harus punya member, tidak boleh guest purchase
2. **Member inline**: Bisa daftar member baru langsung di form purchase
3. **Auto-fill**: Setelah pilih/daftar member, data otomatis terisi (read-only)
4. **Price default**: Price otomatis dari product, tapi bisa di-override
5. **EDC Reference Number**: User input manual, harus unique
6. **Auto-calculated**: Expired date, purchase date, stasiun otomatis

---

## 🔗 Related Documentation

- [Purchase API Documentation](./ALUR_PEMBELIAN_KARTU.md)
- [Member API Documentation](../src/modules/members/index.ts)
- [Card API Documentation](../src/modules/cards/index.ts)

