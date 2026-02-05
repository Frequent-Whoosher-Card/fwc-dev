"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { countries } from "countries-list";
import toast from "react-hot-toast";
import { apiFetch } from "@/lib/apiConfig";
import axios from "@/lib/axios";
import { getEmployeeTypes, type EmployeeType } from "@/lib/services/employee-type.service";
import { getCities, type CityItem } from "@/lib/services/city.service";
import { getPaymentMethods } from "@/lib/services/payment-method.service";
import { getStationById } from "@/lib/services/station.service";
import {
  getTodayLocalDate,
} from "./constants";
import type { CreateMemberFormState } from "./types";
import type { CardProduct } from "./types";

const initialFormState: CreateMemberFormState = {
  name: "",
  nik: "",
  nippKai: "",
  employeeTypeId: "",
  nationality: "",
  phone: "",
  gender: "",
  birthDate: "",
  email: "",
  address: "",
  cityId: "",
  companyName: "",
  membershipDate: "",
  expiredDate: "",
  purchasedDate: "",
  price: "",
  cardProductId: "",
  station: "",
  shiftDate: "",
  serialNumber: "",
  edcReferenceNumber: "",
  paymentMethodId: "",
};

export function useCreateMemberForm() {
  const lastCheckRef = useRef<{ nik?: string; edcReferenceNumber?: string }>({});

  const [form, setForm] = useState<CreateMemberFormState>(initialFormState);
  const [fieldError, setFieldError] = useState<{
    nik?: string;
    edcReferenceNumber?: string;
  }>({});
  const [checking, setChecking] = useState<{
    nik?: boolean;
    edcReferenceNumber?: boolean;
  }>({});
  const [identityType, setIdentityType] = useState<"NIK" | "PASSPORT">("NIK");
  const [operatorName, setOperatorName] = useState("");
  const [employeeTypes, setEmployeeTypes] = useState<EmployeeType[]>([]);
  const [loadingEmployeeTypes, setLoadingEmployeeTypes] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [cardProducts, setCardProducts] = useState<CardProduct[]>([]);

  const countryOptions = useMemo(
    () =>
      Object.entries(countries).map(([code, c]) => ({
        value: code,
        label: `${c.name} (+${Array.isArray(c.phone) ? c.phone[0] : c.phone})`,
        phone: Array.isArray(c.phone) ? c.phone[0] : c.phone,
      })),
    []
  );

  const cityOptions = useMemo(
    () => cities.map((c) => ({ value: c.id, label: c.name })),
    [cities]
  );

  const getFullPhoneNumber = useCallback(() => {
    if (!form.nationality || !form.phone) return "";
    const country = countryOptions.find((c) => c.value === form.nationality);
    if (!country?.phone) return "";
    const local = form.phone.replace(/^0+/, "");
    return `+${country.phone}${local}`;
  }, [form.nationality, form.phone, countryOptions]);

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const checkUniqueField = useCallback(
    async (field: "nik" | "edcReferenceNumber", value: string) => {
      if (!value) return;
      lastCheckRef.current[field] = value;
      setChecking((p) => ({ ...p, [field]: true }));

      try {
        const url =
          field === "nik"
            ? `/members?identityNumber=${value}`
            : `/purchases?edcReferenceNumber=${value}`;
        const data = await apiFetch(url);
        if (lastCheckRef.current[field] !== value) return;
        const items = data.data?.items || [];
        const isExactMatch = items.some((item: any) => {
          if (field === "nik") return item.identityNumber === value;
          if (field === "edcReferenceNumber")
            return item.edcReferenceNumber === value;
          return false;
        });
        if (isExactMatch) {
          setFieldError((p) => ({
            ...p,
            [field]:
              field === "nik"
                ? "NIK sudah terdaftar"
                : "No. Reference EDC sudah digunakan",
          }));
        } else {
          setFieldError((p) => ({ ...p, [field]: undefined }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (lastCheckRef.current[field] === value) {
          setChecking((p) => ({ ...p, [field]: false }));
        }
      }
    },
    []
  );

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const token = localStorage.getItem("fwc_token");
        const userStr = localStorage.getItem("fwc_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          setOperatorName(user.fullName || user.username || "");

          setLoadingEmployeeTypes(true);
          try {
            const employeeTypesRes = await getEmployeeTypes();
            setEmployeeTypes(employeeTypesRes.data || []);
          } catch (error) {
            console.error("Failed to load employee types:", error);
            toast.error("Gagal memuat tipe pegawai");
          } finally {
            setLoadingEmployeeTypes(false);
          }

          setLoadingCities(true);
          try {
            const cityRes = await getCities();
            setCities(cityRes.data || []);
          } catch (error) {
            console.error("Failed to load cities:", error);
            toast.error("Gagal memuat data kota");
          } finally {
            setLoadingCities(false);
          }

          setLoadingPaymentMethods(true);
          try {
            const paymentMethodData = await getPaymentMethods();
            setPaymentMethods(paymentMethodData.data || []);
          } catch (error) {
            console.error("Failed to load payment methods:", error);
          } finally {
            setLoadingPaymentMethods(false);
          }

          if (user.stationId) {
            try {
              const stationData = await getStationById(user.stationId);
              const stationName = stationData.data?.stationName || "";
              setForm((prev) => ({ ...prev, station: stationName }));
            } catch (error) {
              console.error("Failed to load station data:", error);
            }
          }
        }

        try {
          const productsRes = await axios.get("/card/product");
          const productsData = productsRes.data;
          const sortedProducts = (productsData.data || []).sort(
            (a: CardProduct, b: CardProduct) => {
              const nameA = `${a.category.categoryName} - ${a.type.typeName}`;
              const nameB = `${b.category.categoryName} - ${b.type.typeName}`;
              return nameA.localeCompare(nameB);
            }
          );
          setCardProducts(sortedProducts);
        } catch (error) {
          console.error("Failed to load card products:", error);
        }

        const todayStr = getTodayLocalDate();
        setForm((prev) => ({
          ...prev,
          membershipDate: todayStr,
          purchasedDate: todayStr,
          shiftDate: todayStr,
        }));
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };
    loadInitialData();
  }, []);

  return {
    form,
    setForm,
    fieldError,
    setFieldError,
    checking,
    identityType,
    setIdentityType,
    operatorName,
    employeeTypes,
    loadingEmployeeTypes,
    paymentMethods,
    loadingPaymentMethods,
    cities,
    loadingCities,
    cityOptions,
    countryOptions,
    cardProducts,
    setCardProducts,
    getFullPhoneNumber,
    handleChange,
    checkUniqueField,
  };
}
