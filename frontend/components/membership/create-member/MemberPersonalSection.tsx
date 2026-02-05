"use client";

import { ChevronDown, Calendar } from "lucide-react";
import type { RefObject, Dispatch, SetStateAction } from "react";
import type { CreateMemberFormState } from "./types";
import type { EmployeeType } from "@/lib/services/employee-type.service";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { IdentityField } from "./IdentityField";

interface MemberPersonalSectionProps {
  programType: "FWC" | "VOUCHER";
  form: CreateMemberFormState;
  setForm: Dispatch<SetStateAction<CreateMemberFormState>>;
  fieldError: { nik?: string; edcReferenceNumber?: string };
  setFieldError: Dispatch<
    SetStateAction<{ nik?: string; edcReferenceNumber?: string }>
  >;
  checking: { nik?: boolean; edcReferenceNumber?: boolean };
  identityType: "NIK" | "PASSPORT";
  setIdentityType: Dispatch<SetStateAction<"NIK" | "PASSPORT">>;
  checkUniqueField: (field: "nik" | "edcReferenceNumber", value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  employeeTypes: EmployeeType[];
  loadingEmployeeTypes: boolean;
  isKAIProduct: boolean;
  nippKaiRef: RefObject<HTMLInputElement | null>;
  birthDateInputRef: RefObject<HTMLInputElement | null>;
  onlyNumber: (e: React.FormEvent<HTMLInputElement>) => void;
}

export function MemberPersonalSection({
  programType,
  form,
  setForm,
  fieldError,
  setFieldError,
  checking,
  identityType,
  setIdentityType,
  checkUniqueField,
  handleChange,
  employeeTypes,
  loadingEmployeeTypes,
  isKAIProduct,
  nippKaiRef,
  birthDateInputRef,
  onlyNumber,
}: MemberPersonalSectionProps) {
  return (
    <>
      <div className="md:col-span-2">
        <MemberFormField label="Membership Name" required>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Masukkan nama member"
            className={base}
            required
          />
        </MemberFormField>
      </div>

      <IdentityField
        programType={programType}
        form={form}
        setForm={setForm}
        identityType={identityType}
        setIdentityType={setIdentityType}
        fieldError={fieldError}
        setFieldError={setFieldError}
        checking={checking}
        checkUniqueField={checkUniqueField}
        Field={MemberFormField}
      />

      <MemberFormField label="Gender" required>
        <div className="relative">
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={`${base} appearance-none pr-10`}
            required
          >
            <option value="">Pilih gender</option>
            <option value="L">Laki - Laki</option>
            <option value="P">Perempuan</option>
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </MemberFormField>

      <MemberFormField label="Tanggal Lahir" required>
        <div
          className="relative cursor-pointer"
          onClick={() => {
            const el = birthDateInputRef.current;
            if (el && typeof el.showPicker === "function") {
              el.showPicker();
            } else {
              el?.focus();
            }
          }}
        >
          <Calendar
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            ref={birthDateInputRef}
            type="date"
            name="birthDate"
            value={form.birthDate}
            onChange={handleChange}
            className={`${base} pr-10 cursor-pointer`}
            required
          />
        </div>
      </MemberFormField>

      <MemberFormField label="Employee Type" required>
        <div className="relative">
          <select
            name="employeeTypeId"
            value={form.employeeTypeId}
            onChange={handleChange}
            className={`${base} appearance-none pr-10`}
            required
            disabled={loadingEmployeeTypes}
          >
            <option value="">
              {loadingEmployeeTypes ? "Loading..." : "Pilih Tipe Pegawai"}
            </option>
            {employeeTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
      </MemberFormField>

      {form.employeeTypeId &&
        employeeTypes.find((t) => t.id === form.employeeTypeId)?.code !==
          "UMUM" && (
          <MemberFormField label="NIP / NIPP KAI" required={isKAIProduct}>
            <input
              ref={nippKaiRef}
              name="nippKai"
              value={form.nippKai}
              onChange={handleChange}
              onInput={onlyNumber}
              placeholder="Nomor Induk Pegawai (KAI)"
              className={base}
              maxLength={5}
            />
          </MemberFormField>
        )}
    </>
  );
}
