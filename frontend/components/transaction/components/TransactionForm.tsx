"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createPurchase, getPurchaseById } from "@/lib/services/purchase.service";
import { getMembers } from "@/lib/services/membership.service";
import { getCards } from "@/lib/services/card.service";

/* ======================
   TYPES
====================== */
interface Props {
  mode: "create" | "edit";
  id?: string;
}

interface Member {
  id: string;
  name: string;
  identityNumber: string;
}

interface Card {
  id: string;
  serialNumber: string;
}

/* ======================
   COMPONENT
====================== */
export default function TransactionForm({ mode, id }: Props) {
  const router = useRouter();

  /* ======================
     FORM STATE
  ====================== */
  const [memberId, setMemberId] = useState("");
  const [cardId, setCardId] = useState("");
  const [edcReferenceNumber, setEdcReferenceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expiredDate, setExpiredDate] = useState(""); // ✅ WAJIB
  const [shiftDate, setShiftDate] = useState("");
  const [notes, setNotes] = useState("");

  const [members, setMembers] = useState<Member[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  /* ======================
     INIT LOOKUP
  ====================== */
  useEffect(() => {
    getMembers({ limit: 50 }).then((res) => {
      if (res.success) setMembers(res.data.items);
    });

    getCards({ status: "AVAILABLE", limit: 50 }).then((res) => {
      if (res.success) setCards(res.data.items);
    });
  }, []);

  /* ======================
     EDIT MODE LOAD
  ====================== */
  useEffect(() => {
    if (mode === "edit" && id) {
      setLoading(true);

      getPurchaseById(id).then((res) => {
        if (res.success) {
          const p = res.data;

          setMemberId(p.member?.id ?? "");
          setCardId(p.card?.id ?? "");
          setEdcReferenceNumber(p.edcReferenceNumber ?? "");
          setPurchaseDate(p.purchaseDate?.slice(0, 10) ?? "");
          setExpiredDate(p.card?.expiredDate?.slice(0, 10) ?? ""); // 🔥
          setShiftDate(p.shiftDate?.slice(0, 10) ?? "");
          setNotes(p.notes ?? "");
        }
        setLoading(false);
      });
    }
  }, [mode, id]);

  /* ======================
     SUBMIT
  ====================== */
  const handleSubmit = async () => {
    if (
      !memberId ||
      !cardId ||
      !purchaseDate ||
      !expiredDate ||
      !edcReferenceNumber
    ) {
      alert("Lengkapi field wajib");
      return;
    }

    setLoading(true);

    try {
      if (mode === "create") {
        const res = await createPurchase({
          memberId,
          cardId,
          edcReferenceNumber,
          purchasedDate: purchaseDate,
          expiredDate, // ✅ WAJIB
          shiftDate: shiftDate || undefined,
          notes,
        });

        if (res.success) {
          alert("Transaksi berhasil dibuat");
          router.push("/dashboard/superadmin/transaksi");
        }
      }

      // PATCH edit bisa ditambah nanti
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan transaksi");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     RENDER
  ====================== */
  return (
    <div className="max-w-3xl rounded-md border bg-white p-6 space-y-4">
      <h2 className="text-lg font-semibold">
        {mode === "create" ? "Add Transaction" : "Edit Transaction"}
      </h2>

      {/* MEMBER */}
      <div>
        <label className="text-sm text-gray-600">Member</label>
        <select
          value={memberId}
          onChange={(e) => setMemberId(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          disabled={loading}
        >
          <option value="">Pilih Member</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — {m.identityNumber}
            </option>
          ))}
        </select>
      </div>

      {/* CARD */}
      <div>
        <label className="text-sm text-gray-600">Card</label>
        <select
          value={cardId}
          onChange={(e) => setCardId(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
          disabled={loading || mode === "edit"}
        >
          <option value="">Pilih Card</option>
          {cards.map((c) => (
            <option key={c.id} value={c.id}>
              {c.serialNumber}
            </option>
          ))}
        </select>
        {mode === "edit" && (
          <p className="mt-1 text-xs text-gray-400">
            Card tidak bisa diubah saat edit
          </p>
        )}
      </div>

      {/* EDC */}
      <div>
        <label className="text-sm text-gray-600">EDC Reference</label>
        <input
          value={edcReferenceNumber}
          onChange={(e) => setEdcReferenceNumber(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* PURCHASE DATE */}
      <div>
        <label className="text-sm text-gray-600">Purchase Date</label>
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* EXPIRED DATE */}
      <div>
        <label className="text-sm text-gray-600">Expired Date</label>
        <input
          type="date"
          value={expiredDate}
          onChange={(e) => setExpiredDate(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* SHIFT DATE */}
      <div>
        <label className="text-sm text-gray-600">Shift Date (optional)</label>
        <input
          type="date"
          value={shiftDate}
          onChange={(e) => setShiftDate(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* NOTES */}
      <div>
        <label className="text-sm text-gray-600">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="mt-1 w-full rounded border px-3 py-2 text-sm"
        />
      </div>

      {/* ACTION */}
      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={() => router.back()}
          className="rounded border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="rounded bg-[#8D1231] px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
