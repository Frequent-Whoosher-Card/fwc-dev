import clsx from 'clsx';

interface StatusBadgeProps {
  status?: string | null;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  /* =========================
     REQUEST
  ========================= */
  ON_REQUEST: {
    label: 'Sedang Diajukan',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  'Sedang Diajukan': {
    label: 'Sedang Diajukan',
    className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },

  /* =========================
     OFFICE
  ========================= */
  IN_OFFICE: {
    label: 'Di Kantor',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  'Di Kantor': {
    label: 'Di Kantor',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  Office: {
    label: 'Di Kantor',
    className: 'bg-blue-100 text-blue-800 border-blue-300',
  },

  /* =========================
     TRANSIT
  ========================= */
  IN_TRANSIT: {
    label: 'Dalam Pengiriman',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  'Dalam Pengiriman': {
    label: 'Dalam Pengiriman',
    className: 'bg-purple-100 text-purple-800 border-purple-300',
  },

  /* =========================
     STATION
  ========================= */
  IN_STATION: {
    label: 'Di Stasiun',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  Stasiun: {
    label: 'Di Stasiun',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  'Di Stasiun': {
    label: 'Di Stasiun',
    className: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },

  /* =========================
     PROBLEM
  ========================= */
  LOST: {
    label: 'Hilang',
    className: 'bg-red-100 text-red-800 border-red-300',
  },
  Hilang: {
    label: 'Hilang',
    className: 'bg-red-100 text-red-800 border-red-300',
  },

  DAMAGED: {
    label: 'Rusak',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  Rusak: {
    label: 'Rusak',
    className: 'bg-orange-100 text-orange-800 border-orange-300',
  },

  /* =========================
     SOLD / ACTIVE
  ========================= */
  SOLD_ACTIVE: {
    label: 'Aktif',
    className: 'bg-green-100 text-green-800 border-green-300',
  },
  Aktif: {
    label: 'Aktif',
    className: 'bg-green-100 text-green-800 border-green-300',
  },

  /* =========================
     SOLD / NON ACTIVE
  ========================= */
  SOLD_INACTIVE: {
    label: 'Non-Aktif',
    className: 'bg-gray-200 text-gray-700 border-gray-400',
  },
  'Non-Aktif': {
    label: 'Non-Aktif',
    className: 'bg-gray-200 text-gray-700 border-gray-400',
  },
  'Tidak Aktif': {
    label: 'Non-Aktif',
    className: 'bg-gray-200 text-gray-700 border-gray-400',
  },

  /* =========================
     SYSTEM
  ========================= */
  BLOCKED: {
    label: 'Diblokir',
    className: 'bg-red-200 text-red-900 border-red-400',
  },
  Diblokir: {
    label: 'Diblokir',
    className: 'bg-red-200 text-red-900 border-red-400',
  },

  DELETED: {
    label: 'Dihapus',
    className: 'bg-black text-white border-black',
  },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null;

  const config = STATUS_MAP[status] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-800 border-gray-300',
  };

  return <span className={clsx('inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap', config.className)}>{config.label}</span>;
}
