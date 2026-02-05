"use client";

import type { Dispatch, SetStateAction } from "react";
import type { CreateMemberFormState } from "./types";

interface IdentityFieldProps {
  programType: "FWC" | "VOUCHER";
  form: CreateMemberFormState;
  setForm: Dispatch<SetStateAction<CreateMemberFormState>>;
  identityType: "NIK" | "PASSPORT";
  setIdentityType: Dispatch<SetStateAction<"NIK" | "PASSPORT">>;
  fieldError?: { nik?: string };
  setFieldError: Dispatch<
    SetStateAction<{ nik?: string; edcReferenceNumber?: string }>
  >;
  checking?: { nik?: boolean };
  checkUniqueField: (field: "nik" | "edcReferenceNumber", value: string) => void;
  Field: (props: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
  }) => JSX.Element;
}

export function IdentityField({
  programType,
  form,
  setForm,
  identityType,
  setIdentityType,
  fieldError = {},
  setFieldError,
  checking = {},
  checkUniqueField,
  Field,
}: IdentityFieldProps) {
  return (
    <Field label="NIK / Passport" required>
      <div
        className={`relative flex items-stretch overflow-hidden rounded-md border ${
          fieldError.nik ? "border-red-500" : "border-gray-300"
        }`}
      >
        <div className="flex shrink-0">
          <button
            type="button"
            onClick={() => {
              setIdentityType("NIK");
              setForm((prev) => ({
                ...prev,
                nik: prev.nik.replace(/\D/g, "").slice(0, 16),
              }));
              setFieldError((p) => ({ ...p, nik: undefined }));
            }}
            className={`h-10 min-h-[2.5rem] px-4 text-sm font-medium leading-none transition-colors border-0 ${
              identityType === "NIK"
                ? "bg-[#8B1538] text-white"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            NIK
          </button>
          <button
            type="button"
            onClick={() => {
              setIdentityType("PASSPORT");
              setForm((prev) => ({
                ...prev,
                nik: prev.nik
                  .replace(/[^A-Za-z0-9]/g, "")
                  .toUpperCase()
                  .slice(0, 9),
              }));
              setFieldError((p) => ({ ...p, nik: undefined }));
            }}
            className={`h-10 min-h-[2.5rem] px-4 text-sm font-medium leading-none transition-colors border-0 border-l border-gray-300 ${
              identityType === "PASSPORT"
                ? "bg-[#8B1538] text-white border-l-[#8B1538]"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            Passport
          </button>
        </div>
        <div className="flex h-10 min-h-[2.5rem] items-center border-l border-gray-300 bg-gray-100 px-2 text-gray-400 shrink-0">
          |
        </div>
        {programType === "FWC" && (
          <>
            <div className="flex h-10 min-h-[2.5rem] items-center border-l border-gray-300 bg-gray-100 px-3 text-sm text-gray-600 min-w-[50px] justify-center font-medium shrink-0">
              FW
            </div>
            <div className="flex h-10 min-h-[2.5rem] items-center border-l border-gray-300 bg-gray-100 px-2 text-gray-400 shrink-0">
              |
            </div>
          </>
        )}
        <input
          name="nik"
          value={form.nik}
          onChange={(e) => {
            const raw = e.target.value;
            const filtered =
              identityType === "NIK"
                ? raw.replace(/\D/g, "").slice(0, 16)
                : raw
                    .replace(/[^A-Za-z0-9]/g, "")
                    .toUpperCase()
                    .slice(0, 9);
            setForm((prev) => ({ ...prev, nik: filtered }));
            setFieldError((p) => ({ ...p, nik: undefined }));
          }}
          onBlur={() => {
            const shouldCheck =
              identityType === "NIK"
                ? form.nik.length === 16
                : form.nik.length >= 6;
            if (shouldCheck) {
              const valueToCheck =
                programType === "FWC" ? "FW" + form.nik : form.nik;
              checkUniqueField("nik", valueToCheck);
            }
          }}
          placeholder={
            identityType === "NIK"
              ? "Masukan 16 digit angka"
              : "Masukan 9 karakter (huruf/angka)"
          }
          className="h-10 min-h-[2.5rem] min-w-0 flex-1 border-0 bg-white px-3 text-sm focus:outline-none focus:ring-0"
          required
        />
        {fieldError.nik && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-red-600 whitespace-nowrap">
            {fieldError.nik}
          </span>
        )}
        {!fieldError.nik && checking.nik && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            Checking...
          </span>
        )}
      </div>
    </Field>
  );
}
