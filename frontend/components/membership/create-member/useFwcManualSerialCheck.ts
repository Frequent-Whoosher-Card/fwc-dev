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
  setSerialNumber: (serial: string) => void;
  handleCardSelect: (card: { id: string; serialNumber: string }) => void;
}

export function useFwcManualSerialCheck({
  programType,
  inputMode,
  serialNumber,
  setCardId,
  setPrice,
  setSerialNumber,
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
  const lastCheckedSerialRef = useRef<string>("");

  useEffect(() => {
    if (programType !== "FWC" || inputMode !== "manual") {
      setManualSerialResult(null);
      setManualSerialMessage("");
      lastCheckedSerialRef.current = "";
      return;
    }

    const sn = serialNumber.trim();
    if (!sn) {
      setCardId("");
      setPrice(0);
      setManualFwcPrice(0);
      setManualSerialResult(null);
      setManualSerialMessage("");
      lastCheckedSerialRef.current = "";
      return;
    }

    // Skip if this serial was already checked (to prevent infinite loop)
    if (lastCheckedSerialRef.current === sn) {
      return;
    }

    if (manualSerialDebounceRef.current) {
      clearTimeout(manualSerialDebounceRef.current);
    }

    manualSerialDebounceRef.current = setTimeout(async () => {
      // Mark this serial as being checked BEFORE making the request
      lastCheckedSerialRef.current = sn;
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
          lastCheckedSerialRef.current = sn;
          return;
        }
        if (data.status === "Stasiun") {
          // Set card ID directly
          setCardId(data.id);
          // Only update serialNumber if it's different from what user typed
          // Update ref FIRST to prevent re-fetch when setSerialNumber triggers useEffect
          const apiSerial = data.serialNumber.trim();
          if (apiSerial !== sn) {
            // Mark the API serial as checked BEFORE updating state to prevent loop
            lastCheckedSerialRef.current = apiSerial;
            setSerialNumber(apiSerial);
          } else {
            // If serials match, just mark current as checked
            lastCheckedSerialRef.current = sn;
          }
          const rawPrice = data.cardProduct?.price;
          const cardPrice =
            rawPrice != null && rawPrice !== "" ? Number(rawPrice) : 0;
          setPrice(cardPrice);
          setManualFwcPrice(cardPrice);
          setManualSerialResult("available");
          setManualSerialMessage("Kartu tersedia untuk dibeli");
          // Call handleCardSelect after state updates (non-blocking)
          setTimeout(() => {
            if (typeof handleCardSelect === "function") {
              handleCardSelect({
                id: data.id,
                serialNumber: data.serialNumber,
              });
            }
          }, 0);
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
        lastCheckedSerialRef.current = sn;
      } finally {
        setManualSerialChecking(false);
      }
    }, 400);

    return () => {
      if (manualSerialDebounceRef.current) {
        clearTimeout(manualSerialDebounceRef.current);
      }
    };
  }, [programType, inputMode, serialNumber, setCardId, setPrice, setSerialNumber]);

  return {
    manualSerialChecking,
    manualSerialResult,
    manualSerialMessage,
    manualFwcPrice,
  };
}
