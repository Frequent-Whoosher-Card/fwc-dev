# Analisis Penggunaan Field Duplikat di Card

## Field yang Akan Dihapus dari Card
1. `categoryId` → ambil dari `card.cardProduct.categoryId`
2. `typeId` → ambil dari `card.cardProduct.typeId`
3. `totalQuota` → ambil dari `card.cardProduct.totalQuota`
4. `masaBerlaku` → ambil dari `card.cardProduct.masaBerlaku`
5. `fwPrice` → ambil dari `card.cardProduct.price`

---

## File-File yang Perlu Diubah

### 1. **backend/src/modules/metrics/service.ts**
**Penggunaan:**
- `totalQuota` digunakan di:
  - `getQuotaTicketIssued()` - line 66: `_sum: { totalQuota: true }`
  - `getRedeem()` - line 86: `_sum: { totalQuota: true }`

**Perubahan yang diperlukan:**
- Ubah aggregate query untuk ambil `totalQuota` dari `card.cardProduct.totalQuota`
- Perlu include `cardProduct` relation dan gunakan nested aggregate atau query terpisah

**Impact:** HIGH - Core metrics functionality

---

### 2. **backend/src/modules/sales/service.ts**
**Penggunaan:**
- `category` dan `type` digunakan di:
  - `getDailySales()` - line 65-81: include `category` dan `type` langsung dari Card
  - line 99-100: `card.category.categoryCode` dan `card.type.typeCode`

**Perubahan yang diperlukan:**
- Ubah include dari `card.category` dan `card.type` 
- Menjadi `card.cardProduct.category` dan `card.cardProduct.type`
- Update akses: `card.category` → `card.cardProduct.category`
- Update akses: `card.type` → `card.cardProduct.type`

**Impact:** HIGH - Core sales functionality

---

### 3. **backend/src/scripts/importExcel.ts**
**Penggunaan:**
- Field duplikat di-assign saat create Card - line 880-896:
  - `categoryId: categoryId` (line 886)
  - `typeId: typeId` (line 887)
  - `totalQuota: totalQuota` (line 889)
  - `fwPrice: fwPrice` (line 890)
  - `masaBerlaku: masaBerlaku` (line 892)

**Perubahan yang diperlukan:**
- Hapus assignment `categoryId`, `typeId`, `totalQuota`, `fwPrice`, `masaBerlaku`
- Hanya set `cardProductId: cardProductId` (line 885 sudah ada)
- Pastikan CardProduct sudah dibuat sebelum create Card (sudah dilakukan di line 871)

**Impact:** HIGH - Import script functionality

---

### 4. **backend/prisma/schema.prisma**
**Penggunaan:**
- Model Card memiliki field duplikat:
  - `categoryId` (line 147)
  - `typeId` (line 148)
  - `totalQuota` (line 150)
  - `fwPrice` (line 151)
  - `masaBerlaku` (line 153)
- Relation langsung ke Category dan Type:
  - `category` relation (line 164)
  - `type` relation (line 166)

**Perubahan yang diperlukan:**
- Hapus field: `categoryId`, `typeId`, `totalQuota`, `fwPrice`, `masaBerlaku`
- Hapus relation: `category` dan `type`
- Keep relation: `cardProduct` (line 163)

**Impact:** HIGH - Database schema change

---

### 5. **File-file yang TIDAK perlu diubah (CardProduct related)**
- `backend/src/modules/cards/product/service.ts` - OK, ini untuk CardProduct
- `backend/src/modules/cards/product/model.ts` - OK, ini untuk CardProduct
- `backend/src/modules/cards/product/index.ts` - OK, ini untuk CardProduct
- `backend/src/modules/stock/in/service.ts` - OK, ini untuk CardInventory (bukan Card)
- `backend/src/modules/stock/in/model.ts` - OK, ini untuk CardInventory
- `backend/src/modules/stock/in/index.ts` - OK, ini untuk CardInventory
- `backend/src/scripts/addRandomQuotaTicket.ts` - OK, ini untuk Excel manipulation

---

## Summary

### File yang PERLU diubah (3 file):
1. ✅ `backend/src/modules/metrics/service.ts` - Update query untuk ambil totalQuota dari cardProduct
2. ✅ `backend/src/modules/sales/service.ts` - Update include dan akses category/type via cardProduct
3. ✅ `backend/src/scripts/importExcel.ts` - Hapus assignment field duplikat saat create Card

### File yang PERLU diubah (Schema):
4. ✅ `backend/prisma/schema.prisma` - Hapus field duplikat dari model Card

### Migration:
5. ✅ Buat migration SQL untuk DROP COLUMN di database

---

## Dampak Perubahan

### Query yang akan berubah:
1. **MetricsService.getQuotaTicketIssued()**
   - Sebelum: `db.card.aggregate({ _sum: { totalQuota: true } })`
   - Sesudah: Perlu query dengan include cardProduct atau nested aggregate

2. **MetricsService.getRedeem()**
   - Sebelum: `db.card.aggregate({ _sum: { totalQuota: true } })`
   - Sesudah: Perlu query dengan include cardProduct atau nested aggregate

3. **SalesService.getDailySales()**
   - Sebelum: `include: { category: {...}, type: {...} }`
   - Sesudah: `include: { cardProduct: { include: { category: {...}, type: {...} } } }`
   - Akses: `card.category` → `card.cardProduct.category`
   - Akses: `card.type` → `card.cardProduct.type`

4. **importExcel.ts - create Card**
   - Sebelum: Set semua field (categoryId, typeId, totalQuota, fwPrice, masaBerlaku)
   - Sesudah: Hanya set cardProductId

---

## Catatan Penting

1. **Foreign Key Constraints**: Pastikan hapus foreign key constraints untuk category_id dan type_id di Card sebelum DROP COLUMN
2. **Data Migration**: Tidak perlu data migration karena data sudah ada di CardProduct
3. **Backward Compatibility**: Perubahan ini breaking change, perlu update semua query yang akses field tersebut
4. **Testing**: Perlu test semua endpoint yang menggunakan Card untuk memastikan tidak ada breaking changes

