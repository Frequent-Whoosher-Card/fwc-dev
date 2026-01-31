import { create } from "zustand";
import { persist } from "zustand/middleware";

type Language = "id" | "en";

interface TranslationDict {
  [key: string]: {
    id: string;
    en: string;
  };
}

const translations: TranslationDict = {
  // Sidebar Items
  dashboard: { id: "Dashboard", en: "Dashboard" },
  redeem_kuota: { id: "Redeem Kuota", en: "Redeem Quota" },
  stock: { id: "Stok", en: "Stock" },
  stock_in: { id: "Stok Masuk", en: "Stock In" },
  stock_out: { id: "Stok Keluar", en: "Stock Out" },
  stock_all: { id: "Semua Stok", en: "All Stock" },
  generate_number: { id: "Generate Nomor", en: "Generate Number" },
  create_new_product: { id: "Buat Produk Baru", en: "Create New Product" },
  inbox: { id: "Kotak Masuk", en: "Inbox" },
  membership: { id: "Danggotaan", en: "Membership" },
  member_list: { id: "Daftar Member", en: "Member List" },
  manage_diskon: { id: "Kelola Diskon", en: "Manage Discount" },
  transaksi: { id: "Transaksi", en: "Transaction" },
  user: { id: "Pengguna", en: "User" },
  employee_type: { id: "Tipe Karyawan", en: "Employee Type" },
  logout: { id: "Keluar", en: "Logout" },
  account: { id: "Akun", en: "Account" },
  change_password: { id: "Ubah Password", en: "Change Password" },

  // Header
  app_title: { id: "Whoosher Pass", en: "Whoosher Pass" },

  // Common Actions
  add: { id: "Tambah", en: "Add" },
  export: { id: "Ekspor", en: "Export" },
  filter: { id: "Saring", en: "Filter" },
  search: { id: "Cari...", en: "Search..." },
  view_detail: { id: "Lihat Detail", en: "View Detail" },
  delete: { id: "Hapus", en: "Delete" },
  edit: { id: "Ubah", en: "Edit" },
  hapus: { id: "Hapus", en: "Delete" },

  // Table Headers
  no: { id: "No", en: "No" },
  serial_number: { id: "Nomor Seri", en: "Serial Number" },
  category: { id: "Kategori", en: "Category" },
  type: { id: "Tipe", en: "Type" },
  status: { id: "Status", en: "Status" },
  date: { id: "Tanggal", en: "Date" },
  action: { id: "Aksi", en: "Action" },
  stasiun: { id: "Stasiun", en: "Station" },
  card_category: { id: "Kategori Kartu", en: "Card Category" },
  card_type: { id: "Tipe Kartu", en: "Card Type" },
  card_aktif: { id: "Kartu Aktif", en: "Card Active" },
  card_expired: { id: "Kartu Kadaluwarsa", en: "Card Expired" },
  nik: { id: "NIK", en: "NIK" },
  nama: { id: "Nama", en: "Name" },
  identity_number: { id: "Nomor Identitas", en: "Identity Number" },
  quantity: { id: "Jumlah", en: "Quantity" },
  price: { id: "Harga", en: "Price" },
  total_quota: { id: "Total Kuota", en: "Total Quota" },
  description: { id: "Deskripsi", en: "Description" },
  upload_date: { id: "Tanggal Unggah", en: "Upload Date" },

  // More Buttons
  download_zip: { id: "Unduh ZIP", en: "Download ZIP" },
  upload_document: { id: "Unggah Dokumen", en: "Upload Document" },
  export_zip: { id: "Ekspor ZIP", en: "Export ZIP" },
  tambah: { id: "Tambah", en: "Add" },
  simpan: { id: "Simpan", en: "Save" },
  batal: { id: "Batal", en: "Cancel" },

  // Generate Number
  choose_product: { id: "Pilih Produk:", en: "Choose Product:" },
  select_card_product: {
    id: "-- Pilih Produk Kartu --",
    en: "-- Select Card Product --",
  },
  next_serial_number: {
    id: "Nomor Seri Berikutnya:",
    en: "Next Serial Number:",
  },
  quantity_label: { id: "Jumlah:", en: "Quantity:" },
  placeholder_qty_voucher: {
    id: "Jumlah generate",
    en: "Quantity to generate",
  },
  placeholder_qty_card: { id: "Jumlah kartu", en: "Card quantity" },
  last_serial: { id: "Serial terakhir:", en: "Last serial:" },
  generate_btn: { id: "Generate", en: "Generate" },
  generating: { id: "Sedang memproses...", en: "Generating..." },
  total_data: { id: "Total Data", en: "Total Data" },
  loading: { id: "Memuat...", en: "Loading..." },
  no_data: { id: "Belum ada data", en: "No data available" },
  discount: { id: "Diskon", en: "Discount" },
  created_by: { id: "Dibuat Oleh", en: "Created By" },
  yes: { id: "Ya", en: "Yes" },
  no_val: { id: "Tidak", en: "No" },
  detail_serial: {
    id: "Detail Nomor Seri + Barcode",
    en: "Serial Number + Barcode Details",
  },
  back: { id: "Kembali", en: "Back" },
  view_document: { id: "Lihat Dokumen", en: "View Document" },
  barcode: { id: "Barcode", en: "Barcode" },
  barcode_unavailable: {
    id: "Barcode tidak tersedia",
    en: "Barcode unavailable",
  },
  not_found: { id: "Data tidak ditemukan", en: "Data not found" },
  range: { id: "Rentang:", en: "Range:" },
  total: { id: "Total:", en: "Total:" },

  // Stock Out
  stock_out_title: {
    id: "Stok Keluar (Admin → Stasiun)",
    en: "Stock Out (Admin → Station)",
  },
  batch: { id: "Batch", en: "Batch" },
  nota_dinas: { id: "Nota Dinas", en: "Internal Note" },
  bast: { id: "BAST", en: "Transfer Report" },
  note: { id: "Catatan", en: "Note" },
  no_stock_out_data: {
    id: "Tidak ada data stok keluar",
    en: "No stock out data found",
  },
};

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: keyof typeof translations) => string;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: "id",
      setLang: (lang) => set({ lang }),
      t: (key) => {
        const entry = translations[key];
        if (!entry) return key as string;
        return entry[get().lang];
      },
    }),
    {
      name: "language-storage",
    },
  ),
);
