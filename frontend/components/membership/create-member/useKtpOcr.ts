"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { Dispatch, SetStateAction } from "react";
import type { CreateMemberFormState } from "./types";

interface UseKtpOcrProps {
  setForm: Dispatch<SetStateAction<CreateMemberFormState>>;
  setIdentityType: Dispatch<SetStateAction<"NIK" | "PASSPORT">>;
}

export function useKtpOcr({ setForm, setIdentityType }: UseKtpOcrProps) {
  const [isExtractingOCR, setIsExtractingOCR] = useState(false);

  const handleExtractOCR = async (sessionId: string) => {
    setIsExtractingOCR(true);
    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) {
        throw new Error("Session expired. Silakan login kembali.");
      }

      const formData = new FormData();
      formData.append("session_id", sessionId);

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const response = await fetch(`${API_BASE_URL}/members/ocr-extract`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error?.message || result.error || "Gagal mengekstrak data KTP"
        );
      }

      if (result.data) {
        const data = result.data;

        let nikValue = data.identityNumber || "";
        if (nikValue && nikValue.startsWith("FW")) {
          nikValue = nikValue.substring(2);
        }
        const isNumeric = /^\d+$/.test(nikValue);
        if (nikValue.length === 16 && isNumeric) {
          setIdentityType("NIK");
          nikValue = nikValue.slice(0, 16);
        } else {
          setIdentityType("PASSPORT");
          nikValue = nikValue.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 9);
        }
        setForm((prev) => ({
          ...prev,
          nik: nikValue,
          name: data.name || prev.name,
          gender:
            data.gender === "Laki-laki" || data.gender === "L"
              ? "L"
              : data.gender === "Perempuan" || data.gender === "P"
                ? "P"
                : prev.gender,
          address: data.alamat || prev.address,
        }));

        toast.success("Data KTP berhasil diekstrak!");
      } else {
        toast.error("Gagal mengekstrak data KTP. Silakan isi manual.");
      }
    } catch (error: any) {
      console.error("OCR Error:", error);
      toast.error(
        error.message || "Gagal mengekstrak data KTP. Silakan isi manual."
      );
    } finally {
      setIsExtractingOCR(false);
    }
  };

  return {
    isExtractingOCR,
    handleExtractOCR,
  };
}
