# Alur Aplikasi FWC System - Dari Awal Hingga Akhir

## Daftar Isi
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Alur Pelanggan (Customer Flow)](#alur-pelanggan-customer-flow)
4. [Alur Operator (Operator Flow)](#alur-operator-operator-flow)
5. [Alur Admin (Admin Flow)](#alur-admin-admin-flow)
6. [Alur Sistem (System Flow)](#alur-sistem-system-flow)
7. [Business Process Flow](#business-process-flow)
8. [Use Cases](#use-cases)

---

## Overview

Sistem FWC (Frequent Whoosher Card) adalah sistem manajemen penjualan kartu frequent traveler untuk jalur kereta cepat Jakarta-Bandung. Sistem ini mengelola seluruh siklus hidup kartu dari pembelian hingga penggunaan dan kadaluarsa.

## User Roles

1. **Customer/Pelanggan** - Membeli dan menggunakan kartu FWC
2. **Operator** - Memproses penjualan kartu di stasiun
3. **Admin** - Mengelola master data, inventory, dan laporan
4. **System** - Proses otomatis (expiry, inventory update, dll)

---

## Alur Pelanggan (Customer Flow)

### 1. Flowchart Pembelian Kartu

```mermaid
flowchart TD
    Start([Pelanggan Datang ke Stasiun]) --> CheckInfo{Perlu Informasi?}
    CheckInfo -->|Ya| ViewInfo[Lihat Informasi Kartu<br/>Kategori, Tipe, Harga]
    ViewInfo --> CheckInfo
    CheckInfo -->|Tidak| ProvideData[Berikan Data Diri<br/>Nama, NIK, Email, Phone]
    ProvideData --> SelectCard[Pilih Kategori & Tipe Kartu<br/>Gold/Silver/KAI<br/>JaBan/JaKa/KaBan]
    SelectCard --> CheckStock{Stok Tersedia?}
    CheckStock -->|Tidak| NoStock[Kartu Tidak Tersedia]
    NoStock --> End1([Selesai])
    CheckStock -->|Ya| Payment[Pembayaran<br/>via EDC]
    Payment --> PaymentSuccess{Pembayaran<br/>Berhasil?}
    PaymentSuccess -->|Tidak| PaymentFailed[Pembayaran Gagal]
    PaymentFailed --> End1
    PaymentSuccess -->|Ya| CreateCard[Operator Membuat Kartu]
    CreateCard --> ReceiveCard[Terima Kartu FWC<br/>+ Serial Number]
    ReceiveCard --> ActivateCard[Kartu Aktif<br/>Status: Aktif]
    ActivateCard --> UseCard[Gunakan Kartu<br/>untuk Perjalanan]
    UseCard --> CheckQuota{Quota<br/>Masih Ada?}
    CheckQuota -->|Ya| UseCard
    CheckQuota -->|Tidak| CardExpired[Kartu Habis]
    CardExpired --> CheckExpiry{Tanggal<br/>Kadaluarsa?}
    CheckExpiry -->|Belum| TopUp{Top Up?}
    TopUp -->|Ya| Payment
    TopUp -->|Tidak| End1
    CheckExpiry -->|Sudah| CardExpired2[Kartu Kadaluarsa<br/>Status: Non Aktif]
    CardExpired2 --> End1
```

### 2. Flowchart Penggunaan Kartu

```mermaid
flowchart TD
    Start([Pelanggan Ingin Naik Kereta]) --> CheckCard{Memiliki<br/>Kartu FWC?}
    CheckCard -->|Tidak| BuyCard[Beli Kartu Baru]
    BuyCard --> Start
    CheckCard -->|Ya| ScanCard[Scan Kartu di Gate]
    ScanCard --> ValidateCard{Validasi Kartu<br/>Status & Expiry}
    ValidateCard -->|Tidak Valid| InvalidCard[Kartu Tidak Valid<br/>Tidak Bisa Digunakan]
    InvalidCard --> End1([Selesai])
    ValidateCard -->|Valid| CheckQuota{Quota<br/>Tersedia?}
    CheckQuota -->|Tidak| NoQuota[Quota Habis<br/>Top Up atau Beli Baru]
    NoQuota --> End1
    CheckQuota -->|Ya| DeductQuota[Kurangi Quota<br/>-1]
    DeductQuota --> LogUsage[Log Penggunaan<br/>card_usage_logs]
    LogUsage --> UpdateCard[Update Sisa Quota<br/>pada Kartu]
    UpdateCard --> OpenGate[Buka Gate<br/>Akses Diterima]
    OpenGate --> BoardTrain[Naik Kereta]
    BoardTrain --> End1
```

---

## Alur Operator (Operator Flow)

### 1. Flowchart Proses Penjualan

```mermaid
flowchart TD
    Start([Operator Login ke Sistem]) --> Login{Login<br/>Berhasil?}
    Login -->|Tidak| LoginFailed[Login Gagal]
    LoginFailed --> End1([Selesai])
    Login -->|Ya| Dashboard[Dashboard Operator]
    Dashboard --> SelectAction{Pilih Aksi}
    SelectAction -->|Jual Kartu| NewSale[Menu Jual Kartu Baru]
    SelectAction -->|Cek Kartu| CheckCard[Menu Cek Status Kartu]
    SelectAction -->|Laporan| Report[Menu Laporan Harian]
    
    NewSale --> InputCustomer[Input Data Pelanggan<br/>Nama, NIK, Email, Phone]
    InputCustomer --> ValidateCustomer{Data<br/>Valid?}
    ValidateCustomer -->|Tidak| InvalidData[Data Tidak Valid]
    InvalidData --> InputCustomer
    ValidateCustomer -->|Ya| SelectCategory[Pilih Kategori Kartu<br/>Gold/Silver/KAI]
    SelectCategory --> SelectType[Pilih Tipe Kartu<br/>JaBan/JaKa/KaBan]
    SelectType --> CheckInventory{Inventory<br/>Tersedia?}
    CheckInventory -->|Tidak| NoInventory[Stok Habis]
    NoInventory --> End1
    CheckInventory -->|Ya| GenerateSerial[Generate Serial Number<br/>Kartu]
    GenerateSerial --> InputPrice[Input Harga Kartu<br/>FW Price]
    InputPrice --> ProcessPayment[Proses Pembayaran<br/>via EDC]
    ProcessPayment --> GetEDCRef[Ambil NO Reference EDC]
    GetEDCRef --> PaymentSuccess{Pembayaran<br/>Berhasil?}
    PaymentSuccess -->|Tidak| PaymentFailed[Pembayaran Gagal]
    PaymentFailed --> End1
    PaymentSuccess -->|Ya| CreateCustomer[Create/Update Customer<br/>di Database]
    CreateCustomer --> CreateCard[Create Card Record<br/>Status: Aktif]
    CreateCard --> CalculateExpiry[Hitung Expired Date<br/>Purchase Date + Masa Berlaku]
    CalculateExpiry --> SaveTransaction[Simpan Transaction<br/>dengan Operator & Station]
    SaveTransaction --> UpdateInventory[Update Inventory<br/>Card Terjual +1]
    UpdateInventory --> PrintReceipt[Cetak Struk/Receipt]
    PrintReceipt --> HandOverCard[Serahkan Kartu<br/>ke Pelanggan]
    HandOverCard --> End1
    
    CheckCard --> InputSerial[Input Serial Number]
    InputSerial --> QueryCard[Query Card dari Database]
    QueryCard --> DisplayInfo[Tampilkan Info Kartu<br/>Status, Quota, Expiry]
    DisplayInfo --> End1
    
    Report --> GenerateReport[Generate Laporan Harian]
    GenerateReport --> DisplayReport[Tampilkan Laporan<br/>Total Penjualan, Revenue]
    DisplayReport --> End1
```

### 2. Flowchart Validasi dan Update Kartu

```mermaid
flowchart TD
    Start([Operator Validasi Kartu]) --> InputSerial[Input Serial Number]
    InputSerial --> QueryCard[Query Card dari Database]
    QueryCard --> CardFound{Kartu<br/>Ditemukan?}
    CardFound -->|Tidak| NotFound[Kartu Tidak Ditemukan]
    NotFound --> End1([Selesai])
    CardFound -->|Ya| CheckStatus{Cek Status<br/>Kartu}
    CheckStatus -->|Non Aktif| InactiveCard[Kartu Non Aktif<br/>Tidak Bisa Digunakan]
    InactiveCard --> CheckExpiry{Tanggal<br/>Kadaluarsa?}
    CheckExpiry -->|Belum| Reactivate{Reaktivasi?}
    Reactivate -->|Ya| UpdateStatus[Update Status<br/>ke Aktif]
    UpdateStatus --> End1
    Reactivate -->|Tidak| End1
    CheckExpiry -->|Sudah| ExpiredCard[Kartu Kadaluarsa<br/>Perlu Perpanjangan]
    ExpiredCard --> End1
    CheckStatus -->|Aktif| CheckQuota{Cek Quota}
    CheckQuota -->|Habis| NoQuota[Quota Habis<br/>Top Up Diperlukan]
    NoQuota --> End1
    CheckQuota -->|Masih Ada| DisplayInfo[Tampilkan Info<br/>Quota: X/Total]
    DisplayInfo --> UpdateQuota{Update<br/>Quota?}
    UpdateQuota -->|Ya| DeductQuota[Kurangi Quota]
    DeductQuota --> LogUsage[Log Penggunaan]
    LogUsage --> UpdateCard[Update Card Record]
    UpdateCard --> End1
    UpdateQuota -->|Tidak| End1
```

---

## Alur Admin (Admin Flow)

### 1. Flowchart Manajemen Master Data

```mermaid
flowchart TD
    Start([Admin Login]) --> Login{Login<br/>Berhasil?}
    Login -->|Tidak| LoginFailed[Login Gagal]
    LoginFailed --> End1([Selesai])
    Login -->|Ya| AdminDashboard[Dashboard Admin]
    AdminDashboard --> SelectModule{Pilih Modul}
    
    SelectModule -->|Master Data| MasterData[Modul Master Data]
    SelectModule -->|Inventory| Inventory[Modul Inventory]
    SelectModule -->|Laporan| Reports[Modul Laporan]
    SelectModule -->|User Management| UserMgmt[Modul User Management]
    
    MasterData --> SelectMaster{Pilih Master}
    SelectMaster -->|Card Categories| ManageCategories[Kelola Kategori<br/>Tambah/Edit/Hapus]
    SelectMaster -->|Card Types| ManageTypes[Kelola Tipe Kartu<br/>Tambah/Edit/Hapus]
    SelectMaster -->|Stations| ManageStations[Kelola Stasiun<br/>Tambah/Edit/Hapus]
    SelectMaster -->|Operators| ManageOperators[Kelola Operator<br/>Tambah/Edit/Deactivate]
    
    ManageCategories --> SaveCategory{Simpan?}
    SaveCategory -->|Ya| ValidateCategory{Validasi Data}
    ValidateCategory -->|Valid| SaveToDB[Simpan ke Database]
    ValidateCategory -->|Tidak Valid| ShowError[Tampilkan Error]
    ShowError --> ManageCategories
    SaveToDB --> Success[Berhasil Disimpan]
    Success --> End1
    SaveCategory -->|Tidak| SelectMaster
    
    Inventory --> ViewInventory[Lihat Inventory<br/>per Kategori & Tipe]
    ViewInventory --> UpdateInventory{Update<br/>Inventory?}
    UpdateInventory -->|Ya| InputStock[Input Stok Baru]
    InputStock --> SaveInventory[Simpan Inventory]
    SaveInventory --> RefreshInventory[Refresh Inventory]
    RefreshInventory --> ViewInventory
    UpdateInventory -->|Tidak| ViewInventory
    
    Reports --> SelectReport{Pilih Laporan}
    SelectReport -->|Penjualan Harian| DailySales[Laporan Penjualan Harian]
    SelectReport -->|Penjualan Bulanan| MonthlySales[Laporan Penjualan Bulanan]
    SelectReport -->|Inventory Report| InvReport[Laporan Inventory]
    SelectReport -->|Operator Performance| OpPerf[Laporan Performa Operator]
    
    DailySales --> GenerateReport[Generate Laporan]
    GenerateReport --> ExportReport{Export?}
    ExportReport -->|PDF| ExportPDF[Export ke PDF]
    ExportReport -->|Excel| ExportExcel[Export ke Excel]
    ExportPDF --> End1
    ExportExcel --> End1
    
    UserMgmt --> ManageUsers[Kelola User<br/>Operator & Admin]
    ManageUsers --> AddUser[Tambah User Baru]
    AddUser --> SetRole[Set Role & Permission]
    SetRole --> SaveUser[Simpan User]
    SaveUser --> End1
```

### 2. Flowchart Manajemen Inventory

```mermaid
flowchart TD
    Start([Admin - Manajemen Inventory]) --> ViewCurrent[Lihat Inventory Saat Ini<br/>per Kategori & Tipe]
    ViewCurrent --> SelectAction{Pilih Aksi}
    
    SelectAction -->|Tambah Stok| AddStock[Menu Tambah Stok]
    SelectAction -->|Kurangi Stok| ReduceStock[Menu Kurangi Stok]
    SelectAction -->|Update Manual| ManualUpdate[Update Manual]
    SelectAction -->|Sync dari Cards| SyncInventory[Sync dari Data Cards]
    
    AddStock --> SelectCategory[Pilih Kategori]
    SelectCategory --> SelectType[Pilih Tipe]
    SelectType --> InputQty[Input Jumlah<br/>Kartu Beredar]
    InputQty --> ValidateQty{Validasi<br/>Jumlah}
    ValidateQty -->|Tidak Valid| ShowError[Tampilkan Error]
    ShowError --> InputQty
    ValidateQty -->|Valid| UpdateDB[Update Database<br/>card_inventory]
    UpdateDB --> Success[Stok Berhasil Ditambah]
    Success --> RefreshView[Refresh View Inventory]
    RefreshView --> ViewCurrent
    
    ReduceStock --> SelectCategory2[Pilih Kategori]
    SelectCategory2 --> SelectType2[Pilih Tipe]
    SelectType2 --> InputQty2[Input Jumlah<br/>untuk Dikurangi]
    InputQty2 --> CheckAvailable{Cek Stok<br/>Tersedia?}
    CheckAvailable -->|Tidak Cukup| InsufficientStock[Stok Tidak Cukup]
    InsufficientStock --> ViewCurrent
    CheckAvailable -->|Cukup| UpdateDB2[Update Database<br/>Kurangi Stok]
    UpdateDB2 --> Success2[Stok Berhasil Dikurangi]
    Success2 --> RefreshView
    
    ManualUpdate --> SelectCategory3[Pilih Kategori]
    SelectCategory3 --> SelectType3[Pilih Tipe]
    SelectType3 --> InputAll[Input Semua Data<br/>Beredar, Terjual Aktif,<br/>Terjual Non Aktif,<br/>Belum Terjual]
    InputAll --> ValidateAll{Validasi<br/>Data}
    ValidateAll -->|Tidak Valid| ShowError2[Tampilkan Error]
    ShowError2 --> InputAll
    ValidateAll -->|Valid| UpdateDB3[Update Database]
    UpdateDB3 --> Success3[Data Berhasil Diupdate]
    Success3 --> RefreshView
    
    SyncInventory --> ConfirmSync{Konfirmasi<br/>Sync?}
    ConfirmSync -->|Tidak| ViewCurrent
    ConfirmSync -->|Ya| RunSync[Jalankan Stored Procedure<br/>sp_update_card_inventory]
    RunSync --> CalculateFromCards[Hitung dari Data Cards<br/>per Kategori & Tipe]
    CalculateFromCards --> UpdateInventory[Update Inventory Table]
    UpdateInventory --> SyncSuccess[Sync Berhasil]
    SyncSuccess --> RefreshView
```

---

## Alur Sistem (System Flow)

### 1. Flowchart Sistem Secara Keseluruhan

```mermaid
flowchart TD
    Start([Sistem FWC Dimulai]) --> InitSystem[Inisialisasi Sistem<br/>Load Master Data]
    InitSystem --> SystemReady[Sistem Siap]
    
    SystemReady --> EventLoop{Event Loop<br/>Tunggu Event}
    
    EventLoop -->|Penjualan Baru| NewSaleEvent[Event: Penjualan Baru]
    EventLoop -->|Penggunaan Kartu| CardUsageEvent[Event: Penggunaan Kartu]
    EventLoop -->|Expiry Check| ExpiryCheckEvent[Event: Cek Kadaluarsa]
    EventLoop -->|Inventory Update| InventoryUpdateEvent[Event: Update Inventory]
    
    NewSaleEvent --> ValidateSale[Validasi Data Penjualan]
    ValidateSale --> CreateRecords[Create Customer & Card Records]
    CreateRecords --> CreateTransaction[Create Transaction Record]
    CreateTransaction --> TriggerInventory[Trigger: Update Inventory]
    TriggerInventory --> EventLoop
    
    CardUsageEvent --> ValidateCard[Validasi Kartu]
    ValidateCard --> CheckQuota{Cek Quota}
    CheckQuota -->|Tersedia| DeductQuota[Kurangi Quota]
    DeductQuota --> LogUsage[Log Penggunaan]
    LogUsage --> UpdateCardStatus[Update Status Kartu]
    UpdateCardStatus --> EventLoop
    CheckQuota -->|Habis| MarkInactive[Mark Kartu Non Aktif<br/>jika Quota = 0]
    MarkInactive --> EventLoop
    
    ExpiryCheckEvent --> QueryExpiredCards[Query Kartu yang<br/>Mendekati/Kadaluarsa]
    QueryExpiredCards --> UpdateExpiredStatus[Update Status<br/>Non Aktif untuk<br/>Kartu Kadaluarsa]
    UpdateExpiredStatus --> SendNotification{Kirim<br/>Notifikasi?}
    SendNotification -->|Ya| NotifyCustomer[Notifikasi ke Customer<br/>Email/SMS]
    NotifyCustomer --> EventLoop
    SendNotification -->|Tidak| EventLoop
    
    InventoryUpdateEvent --> CalculateInventory[Hitung Inventory<br/>dari Data Cards]
    CalculateInventory --> UpdateInventoryTable[Update Inventory Table]
    UpdateInventoryTable --> EventLoop
```

### 2. Flowchart Database Operations

```mermaid
flowchart TD
    Start([Request dari Aplikasi]) --> IdentifyOperation{Identifikasi<br/>Operation}
    
    IdentifyOperation -->|Create| CreateOp[Create Operation]
    IdentifyOperation -->|Read| ReadOp[Read Operation]
    IdentifyOperation -->|Update| UpdateOp[Update Operation]
    IdentifyOperation -->|Delete| DeleteOp[Delete Operation]
    
    CreateOp --> ValidateData{Validasi Data}
    ValidateData -->|Tidak Valid| ReturnError[Return Error]
    ReturnError --> End1([Selesai])
    ValidateData -->|Valid| CheckConstraints{Cek Constraints<br/>FK, Unique, dll}
    CheckConstraints -->|Violated| ReturnError
    CheckConstraints -->|OK| InsertDB[Insert ke Database]
    InsertDB --> TriggerAfterInsert[Trigger: After Insert]
    TriggerAfterInsert --> UpdateInventory[Update Inventory<br/>jika Card]
    UpdateInventory --> ReturnSuccess[Return Success]
    ReturnSuccess --> End1
    
    ReadOp --> BuildQuery[Build SQL Query]
    BuildQuery --> ExecuteQuery[Execute Query]
    ExecuteQuery --> ReturnData[Return Data]
    ReturnData --> End1
    
    UpdateOp --> ValidateData2{Validasi Data}
    ValidateData2 -->|Tidak Valid| ReturnError
    ValidateData2 -->|Valid| CheckExists{Record<br/>Exists?}
    CheckExists -->|Tidak| ReturnError
    CheckExists -->|Ya| UpdateDB[Update Database]
    UpdateDB --> TriggerAfterUpdate[Trigger: After Update]
    TriggerAfterUpdate --> UpdateInventory2[Update Inventory<br/>jika Status Changed]
    UpdateInventory2 --> ReturnSuccess
    ReturnSuccess --> End1
    
    DeleteOp --> CheckExists2{Record<br/>Exists?}
    CheckExists2 -->|Tidak| ReturnError
    CheckExists2 -->|Ya| CheckDependencies{Cek Dependencies<br/>FK Constraints}
    CheckDependencies -->|Violated| ReturnError
    CheckDependencies -->|OK| DeleteDB[Delete dari Database]
    DeleteDB --> TriggerAfterDelete[Trigger: After Delete]
    TriggerAfterDelete --> UpdateInventory3[Update Inventory]
    UpdateInventory3 --> ReturnSuccess
    ReturnSuccess --> End1
```

---

## Business Process Flow

### 1. End-to-End Business Process

```mermaid
flowchart TD
    Start([Proses Bisnis FWC<br/>Dari Awal Hingga Akhir]) --> Phase1[FASE 1: SETUP & PREPARATION]
    
    Phase1 --> SetupMaster[Setup Master Data<br/>Categories, Types, Stations, Operators]
    SetupMaster --> SetupInventory[Setup Inventory<br/>Kartu Beredar per Kategori & Tipe]
    SetupInventory --> Phase2[FASE 2: SALES PROCESS]
    
    Phase2 --> CustomerArrives[Pelanggan Datang ke Stasiun]
    CustomerArrives --> OperatorGreets[Operator Melayani]
    OperatorGreets --> CustomerSelects[Pelanggan Pilih Kartu<br/>Kategori & Tipe]
    CustomerSelects --> CheckAvailability{Cek Ketersediaan<br/>Stok}
    CheckAvailability -->|Tidak Tersedia| InformCustomer[Informasi ke Pelanggan<br/>Stok Habis]
    InformCustomer --> CustomerArrives
    CheckAvailability -->|Tersedia| InputCustomerData[Input Data Pelanggan]
    InputCustomerData --> ProcessPayment[Proses Pembayaran<br/>via EDC]
    ProcessPayment --> PaymentResult{Hasil<br/>Pembayaran}
    PaymentResult -->|Gagal| RetryPayment{Coba Lagi?}
    RetryPayment -->|Ya| ProcessPayment
    RetryPayment -->|Tidak| End1([Selesai])
    PaymentResult -->|Berhasil| CreateCardRecord[Create Card Record<br/>di Database]
    CreateCardRecord --> GenerateSerial[Generate Serial Number]
    GenerateSerial --> ActivateCard[Aktifkan Kartu<br/>Status: Aktif]
    ActivateCard --> CreateTransaction[Create Transaction Record]
    CreateTransaction --> UpdateInventory[Update Inventory<br/>Terjual +1]
    UpdateInventory --> HandOverCard[Serahkan Kartu<br/>ke Pelanggan]
    HandOverCard --> Phase3[FASE 3: CARD USAGE]
    
    Phase3 --> CustomerUsesCard[Pelanggan Gunakan Kartu<br/>untuk Naik Kereta]
    CustomerUsesCard --> ScanAtGate[Scan Kartu di Gate]
    ScanAtGate --> ValidateCard{Validasi Kartu<br/>Status & Expiry}
    ValidateCard -->|Tidak Valid| RejectAccess[Akses Ditolak]
    RejectAccess --> InformCustomer2[Informasi ke Pelanggan<br/>Kartu Tidak Valid]
    InformCustomer2 --> End1
    ValidateCard -->|Valid| CheckQuota{Cek Quota}
    CheckQuota -->|Habis| NoQuotaLeft[Quota Habis]
    NoQuotaLeft --> TopUpOption{Top Up?}
    TopUpOption -->|Ya| ProcessPayment
    TopUpOption -->|Tidak| End1
    CheckQuota -->|Masih Ada| DeductQuota[Kurangi Quota -1]
    DeductQuota --> LogUsage[Log Penggunaan]
    LogUsage --> AllowAccess[Izinkan Akses<br/>Buka Gate]
    AllowAccess --> BoardTrain[Naik Kereta]
    BoardTrain --> CheckRemainingQuota{Quota<br/>Tersisa?}
    CheckRemainingQuota -->|Masih Ada| CustomerUsesCard
    CheckRemainingQuota -->|Habis| MarkInactive[Mark Kartu Non Aktif<br/>Status: Non Aktif]
    MarkInactive --> Phase4[FASE 4: MAINTENANCE]
    
    Phase4 --> DailyExpiryCheck[Cek Kadaluarsa Harian<br/>Scheduled Job]
    DailyExpiryCheck --> FindExpiredCards[Cari Kartu yang<br/>Kadaluarsa]
    FindExpiredCards --> UpdateExpiredStatus[Update Status<br/>Non Aktif]
    UpdateExpiredStatus --> SendNotifications{Kirim<br/>Notifikasi?}
    SendNotifications -->|Ya| NotifyCustomers[Notifikasi ke Pelanggan<br/>Email/SMS]
    NotifyCustomers --> DailyInventorySync[Sync Inventory Harian]
    SendNotifications -->|Tidak| DailyInventorySync
    DailyInventorySync --> UpdateInventoryStats[Update Statistik Inventory<br/>dari Data Cards]
    UpdateInventoryStats --> GenerateReports[Generate Laporan Harian<br/>untuk Admin]
    GenerateReports --> Phase5[FASE 5: REPORTING & ANALYTICS]
    
    Phase5 --> ViewReports[Admin Lihat Laporan<br/>Penjualan, Inventory, dll]
    ViewReports --> AnalyzeData[Analisis Data<br/>Trend, Performance]
    AnalyzeData --> MakeDecisions[Keputusan Bisnis<br/>Restock, Promo, dll]
    MakeDecisions --> End1
```

### 2. Card Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Created: Pelanggan Beli Kartu
    
    Created --> Active: Aktivasi Kartu<br/>Status: Aktif
    
    Active --> InUse: Digunakan<br/>Quota -1
    
    InUse --> Active: Masih Ada Quota
    
    InUse --> QuotaExhausted: Quota Habis
    
    QuotaExhausted --> Inactive: Status: Non Aktif<br/>Quota = 0
    
    Active --> Expired: Tanggal Kadaluarsa
    
    Expired --> Inactive: Status: Non Aktif<br/>Expired
    
    Inactive --> Active: Top Up /<br/>Perpanjangan<br/>(Jika Masih Valid)
    
    Inactive --> [*]: Kartu Tidak<br/>Bisa Digunakan Lagi
```

---

## Use Cases

### Use Case 1: Penjualan Kartu Baru

**Actor:** Operator, Customer  
**Precondition:** Operator sudah login, Inventory tersedia

**Main Flow:**
1. Customer datang ke stasiun
2. Operator membuka form penjualan
3. Input data customer (nama, NIK, email, phone)
4. Pilih kategori dan tipe kartu
5. Sistem cek inventory
6. Generate serial number
7. Input harga dan proses pembayaran via EDC
8. Sistem create customer record (jika baru)
9. Sistem create card record dengan status Aktif
10. Sistem hitung expired date
11. Sistem create transaction record
12. Sistem update inventory
13. Cetak receipt dan serahkan kartu ke customer

**Alternative Flow:**
- Jika inventory tidak tersedia: Informasi ke customer, proses selesai
- Jika pembayaran gagal: Retry atau batalkan transaksi

### Use Case 2: Penggunaan Kartu

**Actor:** Customer, System (Gate System)  
**Precondition:** Customer memiliki kartu FWC yang valid

**Main Flow:**
1. Customer scan kartu di gate
2. Sistem validasi kartu (status, expiry)
3. Sistem cek quota tersedia
4. Jika valid dan quota ada: Kurangi quota -1
5. Log penggunaan ke card_usage_logs
6. Update sisa quota pada card
7. Buka gate, izinkan akses

**Alternative Flow:**
- Jika kartu tidak valid: Tolak akses, tampilkan pesan error
- Jika quota habis: Tolak akses, sarankan top up

### Use Case 3: Cek Status Kartu

**Actor:** Customer, Operator  
**Precondition:** Customer memiliki serial number kartu

**Main Flow:**
1. Input serial number
2. Sistem query card dari database
3. Tampilkan informasi:
   - Status kartu (Aktif/Non Aktif)
   - Quota tersisa / Total quota
   - Tanggal kadaluarsa
   - Tanggal pembelian
   - Kategori dan tipe kartu

### Use Case 4: Update Inventory

**Actor:** Admin, System (Scheduled Job)  
**Precondition:** Admin sudah login atau scheduled job berjalan

**Main Flow:**
1. Admin pilih menu inventory atau scheduled job berjalan
2. Sistem query semua cards per kategori dan tipe
3. Hitung:
   - Card beredar: Total cards
   - Card terjual aktif: Cards dengan status Aktif
   - Card terjual non aktif: Cards dengan status Non Aktif
   - Card belum terjual: (Card beredar - Total terjual)
4. Update card_inventory table
5. Tampilkan hasil update

### Use Case 5: Generate Laporan

**Actor:** Admin, Operator  
**Precondition:** User sudah login dengan permission yang sesuai

**Main Flow:**
1. Pilih jenis laporan (Harian, Bulanan, dll)
2. Pilih parameter (Tanggal, Kategori, Tipe, Operator, dll)
3. Sistem query data sesuai parameter
4. Generate laporan dengan data:
   - Total penjualan
   - Total revenue
   - Breakdown per kategori/tipe
   - Breakdown per operator
   - Inventory status
5. Tampilkan laporan
6. Export (opsional): PDF atau Excel

---

## Sequence Diagram: Penjualan Kartu

```mermaid
sequenceDiagram
    participant C as Customer
    participant O as Operator
    participant S as System
    participant DB as Database
    participant EDC as EDC Payment
    
    C->>O: Minta beli kartu FWC
    O->>S: Buka form penjualan
    S->>O: Tampilkan form
    O->>C: Tanya data diri
    C->>O: Berikan data (Nama, NIK, Email, Phone)
    O->>S: Input data customer
    O->>S: Pilih kategori & tipe
    S->>DB: Cek inventory
    DB-->>S: Inventory tersedia
    S->>O: Konfirmasi stok tersedia
    O->>S: Proses pembayaran
    S->>EDC: Request pembayaran
    EDC-->>S: Payment processing
    EDC-->>S: Payment success + EDC Reference
    S->>DB: Create/Update customer
    DB-->>S: Customer ID
    S->>DB: Generate serial number
    S->>DB: Create card record
    DB-->>S: Card ID
    S->>DB: Calculate expired date
    S->>DB: Create transaction record
    DB-->>S: Transaction ID
    S->>DB: Update inventory (trigger)
    DB-->>S: Inventory updated
    S->>O: Transaksi berhasil
    O->>C: Serahkan kartu + receipt
```

---

## Sequence Diagram: Penggunaan Kartu

```mermaid
sequenceDiagram
    participant C as Customer
    participant G as Gate System
    participant S as System
    participant DB as Database
    
    C->>G: Scan kartu di gate
    G->>S: Request validation
    S->>DB: Query card by serial number
    DB-->>S: Card data
    S->>S: Validate card (status, expiry)
    alt Kartu Valid
        S->>S: Cek quota tersedia
        alt Quota Tersedia
            S->>DB: Deduct quota (-1)
            S->>DB: Log usage
            DB-->>S: Updated
            S->>G: Allow access
            G->>C: Buka gate
        else Quota Habis
            S->>G: Reject access
            G->>C: Tampilkan: Quota habis
        end
    else Kartu Tidak Valid
        S->>G: Reject access
        G->>C: Tampilkan: Kartu tidak valid
    end
```

---

## Kesimpulan

Alur aplikasi FWC System mencakup:

1. **Setup & Preparation** - Inisialisasi master data dan inventory
2. **Sales Process** - Proses penjualan kartu dari customer datang hingga kartu diserahkan
3. **Card Usage** - Penggunaan kartu untuk naik kereta dengan validasi dan tracking quota
4. **Maintenance** - Proses harian seperti cek kadaluarsa, sync inventory, dan notifikasi
5. **Reporting & Analytics** - Laporan dan analisis data untuk keputusan bisnis

Sistem dirancang untuk mengelola seluruh lifecycle kartu FWC dari pembelian hingga kadaluarsa dengan tracking yang lengkap dan otomatisasi proses-proses penting.


