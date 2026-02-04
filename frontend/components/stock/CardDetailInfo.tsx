import {
  Tag,
  Database,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Clock,
  Hash,
  StickyNote,
  Image as ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface CardDetailInfoProps {
  card: any;
}

export default function CardDetailInfo({ card }: CardDetailInfoProps) {
  if (!card) return null;

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const InfoItem = ({
    icon: Icon,
    label,
    value,
    isMono = false,
    isBold = false,
    className = "",
  }: {
    icon: any;
    label: string;
    value: React.ReactNode;
    isMono?: boolean;
    isBold?: boolean;
    className?: string;
  }) => (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="flex items-start gap-2">
        <Icon size={16} className="text-gray-400 mt-0.5" />
        <div
          className={`${
            isMono ? "font-mono" : ""
          } ${isBold ? "font-bold" : "font-medium"} text-gray-700 break-all`}
        >
          {value}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#8D1231]" />
          <h3 className="font-semibold text-gray-700">
            Detail Informasi Kartu
          </h3>
        </div>
        {/* <span className="text-xs text-gray-400 font-mono">{card.id}</span> */}
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
        {/* Basic Info */}
        <InfoItem
          icon={Tag}
          label="Serial Number"
          value={card.serialNumber}
          isMono
          isBold
          className="text-[#8D1231]"
        />

        {/* <InfoItem
          icon={Database}
          label="Tipe Program"
          value={card.cardProduct?.programType || "-"}
        /> */}

        <InfoItem
          icon={CreditCard}
          label="Produk (Category / Type)"
          value={`${card.cardProduct?.category?.categoryName || "-"} / ${
            card.cardProduct?.type?.typeName || "-"
          }`}
        />

        <InfoItem
          icon={Hash}
          label="Harga Produk"
          value={formatCurrency(card.cardProduct?.price || 0)}
        />

        <InfoItem
          icon={Hash}
          label="Quota Ticket"
          value={`${card.quotaTicket || 0} Tiket`}
        />

        {/* Station Info */}
        <InfoItem
          icon={MapPin}
          label="Stasiun Saat Ini"
          value={card.station?.stationName || "Office"}
          className="text-blue-600"
        />

        {card.previousStation && (
          <InfoItem
            icon={MapPin}
            label="Stasiun Sebelumnya"
            value={card.previousStation.stationName}
            className="text-gray-500"
          />
        )}

        {/* Dates */}
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 pt-4 border-t border-dashed">
          <InfoItem
            icon={Calendar}
            label="Tanggal Pembelian"
            value={formatDate(card.purchaseDate)}
          />

          <InfoItem
            icon={Calendar}
            label="Tanggal Expired"
            value={formatDate(card.expiredDate)}
          />

          <InfoItem
            icon={Clock}
            label="Dibuat Pada"
            value={formatDate(card.createdAt)}
          />

          <InfoItem
            icon={Clock}
            label="Diperbarui Pada"
            value={formatDate(card.updatedAt)}
          />
        </div>

        {/* File / Barcode */}
        {/* {(card.fileObject || card.barcodePath) && (
          <div className="md:col-span-2 pt-4 border-t border-dashed space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              File Barcode
            </p>
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
              <ImageIcon size={24} className="text-gray-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {card.fileObject?.originalName || "Barcode File"}
                </p>
                <p className="text-xs text-gray-400 font-mono truncate">
                  {card.fileObject?.relativePath || card.barcodePath}
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Notes */}
        {card.notes && (
          <div className="md:col-span-2 pt-4 border-t border-dashed">
            <InfoItem icon={StickyNote} label="Catatan" value={card.notes} />
          </div>
        )}
      </div>
    </div>
  );
}
