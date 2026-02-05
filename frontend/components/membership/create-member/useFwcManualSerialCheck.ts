"use client";

import { useState, useEffect, useRef } from "react";
import axios from "@/lib/axios";
import type { ManualSerialResult } from "./types";

interface UseFwcManualSerialCheckProps {
  programType: "FWC" | "VOUCHER";
  inputMode: "" | "manual" | "recommendation" | "range";
  serialNumber: string;
  setCardId: (id: string) => void;
  setPrice: (price: number) => void;
  handleCardSelect: (card: { id: string; serialNumber: string }) => void;
}

export function useFwcManualSerialCheck({
  programType,
  inputMode,
  serialNumber,
  setCardId,
  setPrice,
  handleCardSelect,
}: UseFwcManualSerialCheckProps) {
  const [manualSerialChecking, setManualSerialChecking] = useState(false);
  const [manualSerialResult, setManualSerialResult] =
    useState<ManualSerialResult>(null);
  const [manualSerialMessage, setManualSerialMessage] = useState("");
  const [manualFwcPrice, setManualFwcPrice] = useState<number>(0);
  const manualSerialDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    if (programType !== "FWC" || inputMode !== "manual") {
      setManualSerialResult(null);
      setManualSerialMessage("");
      return;
    }

    const sn = serialNumber.trim();
    if (!sn) {
      setCardId("");
      setPrice(0);
      setManualFwcPrice(0);
      setManualSerialResult(null);
      setManualSerialMessage("");
      return;
    }

    if (manualSerialDebounceRef.current) {
      clearTimeout(manualSerialDebounceRef.current);
    }

    manualSerialDebounceRef.current = setTimeout(async () => {
      setManualSerialResult(null);
      setManualSerialMessage("");
      setManualSerialChecking(true);
      try {
        const response = await axios.get(
          `/cards/serial/${encodeURIComponent(sn)}`
        );
        const data = response.data?.data;
        if (!data) {
          setCardId("");
          setPrice(0);
          setManualFwcPrice(0);
          setManualSerialResult("not_found");
          setManualSerialMessage("Serial number tidak ditemukan");
          return;
        }
        if (data.status === "Stasiun") {
          handleCardSelect({
            id: data.id,
            serialNumber: data.serialNumber,
          });
          const rawPrice = data.cardProduct?.price;
          const cardPrice =
            rawPrice != null && rawPrice !== "" ? Number(rawPrice) : 0;
          setPrice(cardPrice);
          setManualFwcPrice(cardPrice);
          setManualSerialResult("available");
          setManualSerialMessage("Kartu tersedia untuk dibeli");
        } else {
          setCardId("");
          setPrice(0);
          setManualFwcPrice(0);
          setManualSerialResult("unavailable");
          setManualSerialMessage(
            `Kartu tidak tersedia (status: ${data.status || "unknown"})`
          );
        }
      } catch (err: any) {
        setCardId("");
        setPrice(0);
        setManualFwcPrice(0);
        setManualSerialResult("not_found");
        setManualSerialMessage(
          err?.response?.data?.error?.message ||
            "Serial number tidak ditemukan"
        );
      } finally {
        setManualSerialChecking(false);
      }
    }, 400);

    return () => {
      if (manualSerialDebounceRef.current) {
        clearTimeout(manualSerialDebounceRef.current);
      }
    };
  }, [programType, inputMode, serialNumber, setCardId, setPrice, handleCardSelect]);

  return {
    manualSerialChecking,
    manualSerialResult,
    manualSerialMessage,
    manualFwcPrice,
  };
}
