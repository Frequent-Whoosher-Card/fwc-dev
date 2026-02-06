"use client";

import Select from "react-select";
import { Mail, MapPin } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { CreateMemberFormState } from "./types";
import { baseInputClass as base } from "./constants";
import { MemberFormField } from "./MemberFormField";
import { reactSelectStyles } from "./selectStyles";

interface CountryOption {
  value: string;
  label: string;
  phone: string | number;
}

interface CityOption {
  value: string;
  label: string;
}

interface MemberContactSectionProps {
  programType: "FWC" | "VOUCHER";
  form: CreateMemberFormState;
  setForm: Dispatch<SetStateAction<CreateMemberFormState>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  countryOptions: CountryOption[];
  cityOptions: CityOption[];
  loadingCities: boolean;
}

export function MemberContactSection({
  programType,
  form,
  setForm,
  handleChange,
  countryOptions,
  cityOptions,
  loadingCities,
}: MemberContactSectionProps) {
  return (
    <>
      <MemberFormField label="Nationality" required>
        <div id="field-nationality">
          <Select
          options={countryOptions}
          placeholder="Pilih negara"
          value={countryOptions.find((c) => c.value === form.nationality) ?? null}
          onChange={(option: CountryOption | null) => {
            if (!option) return;
            setForm((prev) => ({
              ...prev,
              nationality: option.value,
              phone: "",
              ...(option.value !== "ID" ? { cityId: "" } : {}),
            }));
          }}
          styles={reactSelectStyles}
        />
        </div>
      </MemberFormField>

      <MemberFormField label="Phone Number" required>
        <div className="flex">
          <div className="flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-100 px-3 text-sm text-gray-600 min-w-[60px] justify-center">
            {form.nationality
              ? `+${countryOptions.find((c) => c.value === form.nationality)?.phone}`
              : "+"}
          </div>
          <div className="flex items-center border-y border-gray-300 bg-gray-100 px-2 text-gray-400">
            |
          </div>
          <input
            id="field-phone"
            value={form.phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "");
              setForm((prev) => ({ ...prev, phone: val }));
            }}
            placeholder="Masukkan nomor telepon"
            className="h-10 w-full rounded-r-md border border-l-0 border-gray-300 px-3 text-sm focus:outline-none focus:border-gray-400"
            disabled={!form.nationality}
            maxLength={15}
            required
          />
        </div>
      </MemberFormField>

      <MemberFormField label="Email Address" required>
        <div className="relative md:col-span-2">
          <Mail
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="email"
            name="email"
            id="field-email"
            value={form.email}
            onChange={handleChange}
            placeholder="Masukkan alamat email"
            className={`${base} pl-10`}
            required
          />
        </div>
      </MemberFormField>

      <MemberFormField label="Alamat" required>
        <div className="relative md:col-span-2">
          <MapPin
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            name="address"
            id="field-address"
            value={form.address}
            onChange={handleChange}
            placeholder="Masukkan alamat lengkap"
            className={`${base} pl-10`}
            required
          />
        </div>
      </MemberFormField>

      {form.nationality === "ID" && (
        <MemberFormField label="Kota / Kabupaten">
          <div id="field-cityId">
            <Select
            options={cityOptions}
            placeholder={
              loadingCities ? "Loading..." : "Cari kota/kabupaten..."
            }
            value={cityOptions.find((c) => c.value === form.cityId) ?? null}
            onChange={(option: CityOption | null) => {
              setForm((prev) => ({
                ...prev,
                cityId: option?.value ?? "",
              }));
            }}
            isClearable
            isSearchable
            isDisabled={loadingCities}
            noOptionsMessage={() => "Tidak ada hasil"}
            styles={reactSelectStyles}
          />
        </div>
      </MemberFormField>
      )}

      {programType === "VOUCHER" && (
        <MemberFormField label="Perusahaan">
          <input
            id="field-companyName"
            name="companyName"
            value={form.companyName}
            onChange={handleChange}
            placeholder="Masukkan nama perusahaan (opsional)"
            className={base}
          />
        </MemberFormField>
      )}
    </>
  );
}
