"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import { cardFWCService } from "@/lib/services/card.fwc.service";
import { cardVoucherService } from "@/lib/services/card.voucher.service";

import EditCardProductForm from "@/components/createnewcard/EditCardProductForm";
import EditCardProductVoucherForm from "@/components/createnewcard/EditCardProductVoucherForm";

import { useCategoriesVoucher } from "@/hooks/useCategoriesVoucher";
import { useTypesVoucher } from "@/hooks/useTypesVoucher";

import { CardProduct, CategoryOption, TypeOption } from "@/types/card";

export default function EditCardPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const typeParam = searchParams.get("type");
  const programType = typeParam === "VOUCHER" ? "VOUCHER" : "FWC";

  // State for FWC
  const [fwcProduct, setFwcProduct] = useState<CardProduct | null>(null);
  const [fwcCategories, setFwcCategories] = useState<CategoryOption[]>([]);
  const [fwcTypes, setFwcTypes] = useState<TypeOption[]>([]);

  // State for Voucher (using hooks for cats/types as per original)
  const { data: voucherCategories, loading: loadingVoucherCats } =
    useCategoriesVoucher();
  const { data: voucherTypes, loading: loadingVoucherTypes } =
    useTypesVoucher();
  const [voucherProduct, setVoucherProduct] = useState<CardProduct | null>(
    null,
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (programType === "VOUCHER") {
          const productRes = await cardVoucherService.getProductById(id);
          setVoucherProduct(productRes);
        } else {
          const [productRes, categoriesRes, typesRes] = await Promise.all([
            cardFWCService.getProductById(id),
            cardFWCService.getCategories(),
            cardFWCService.getTypes(),
          ]);
          setFwcProduct(productRes);
          setFwcCategories(categoriesRes);
          setFwcTypes(typesRes);
        }
      } catch (err) {
        toast.error("Gagal mengambil data product");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id, programType]);

  if (loading) return <div className="p-6">Loading...</div>;

  if (programType === "VOUCHER") {
    if (loadingVoucherCats || loadingVoucherTypes)
      return <div className="p-6">Loading Voucher Options...</div>;
    if (!voucherProduct)
      return <div className="p-6 text-red-500">Voucher tidak ditemukan</div>;

    return (
      <div className="px-6 space-y-6 max-w-xl">
        <h2 className="text-lg font-semibold text-gray-800">Edit Voucher</h2>
        <EditCardProductVoucherForm
          product={voucherProduct}
          categories={voucherCategories}
          types={voucherTypes}
          onSuccess={() => router.back()}
        />
      </div>
    );
  }

  // FWC Default
  if (!fwcProduct)
    return <div className="p-6 text-red-500">Product tidak ditemukan</div>;

  return (
    <div className="px-6 space-y-6 max-w-xl">
      <h2 className="text-lg font-semibold text-gray-800">Edit Card FWC</h2>
      <EditCardProductForm
        product={fwcProduct}
        categories={fwcCategories}
        types={fwcTypes}
        onSuccess={() => router.back()}
      />
    </div>
  );
}
