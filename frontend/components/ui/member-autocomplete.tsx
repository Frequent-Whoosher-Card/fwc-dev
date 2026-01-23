"use client";

import { useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { Member } from "@/hooks/useMemberSearch";

interface MemberAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectMember: (member: Member) => void;
  members: Member[];
  loading: boolean;
  placeholder?: string;
  selectedMember: Member | null;
  onClear: () => void;
  className?: string;
}

export function MemberAutocomplete({
  value,
  onChange,
  onSelectMember,
  members,
  loading,
  placeholder = "Cari NIK/NIPP...",
  selectedMember,
  onClear,
  className = "",
}: MemberAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show dropdown when typing and have results
  useEffect(() => {
    if (value.length >= 3 && members.length > 0) {
      setIsOpen(true);
    }
  }, [value, members]);

  const handleSelect = (member: Member) => {
    onSelectMember(member);
    setIsOpen(false);
  };

  const handleClear = () => {
    onClear();
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          value={selectedMember ? selectedMember.identityNumber : value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (members.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className={`h-10 w-full rounded-md border border-gray-300 px-3 pl-10 pr-10 text-sm text-gray-700 focus:border-gray-400 focus:outline-none ${className}`}
          disabled={!!selectedMember}
          maxLength={20}
        />
        {selectedMember && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        )}
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          </div>
        )}
      </div>

      {/* Selected Member Info */}
      {selectedMember && (
        <div className="mt-2 rounded-md border border-green-200 bg-green-50 p-3">
          <div className="text-sm space-y-1">
            <div className="font-semibold text-green-900">
              {selectedMember.name || "Nama belum diisi"}
            </div>
            <div className="text-green-700">
              NIK/NIPP: {selectedMember.identityNumber}
            </div>
            {selectedMember.phone && (
              <div className="text-green-700">Phone: {selectedMember.phone}</div>
            )}
            {selectedMember.email && (
              <div className="text-green-700">Email: {selectedMember.email}</div>
            )}
            {selectedMember.nippKai && (
              <div className="text-green-700">
                NIPP KAI: {selectedMember.nippKai}
              </div>
            )}
            {selectedMember.gender && (
              <div className="text-green-700">
                Gender: {selectedMember.gender === "L" ? "Laki-laki" : "Perempuan"}
              </div>
            )}
            {selectedMember.alamat && (
              <div className="text-green-700">Alamat: {selectedMember.alamat}</div>
            )}
            {selectedMember.nationality && (
              <div className="text-green-700">
                Nationality: {selectedMember.nationality}
              </div>
            )}
            {selectedMember.companyName && (
              <div className="text-green-700">
                Company: {selectedMember.companyName}
              </div>
            )}
            {selectedMember.notes && (
              <div className="text-green-600 text-xs">
                Notes: {selectedMember.notes}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedMember && members.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {members.map((member) => (
            <button
              key={member.id}
              type="button"
              onClick={() => handleSelect(member)}
              className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-gray-50 last:border-b-0"
            >
              <div className="text-sm font-semibold text-gray-900">
                {member.name || "Nama belum diisi"}
              </div>
              <div className="text-xs text-gray-600 mt-0.5">
                NIK/NIPP: {member.identityNumber}
              </div>
              {member.phone && (
                <div className="text-xs text-gray-600">Phone: {member.phone}</div>
              )}
              {member.email && (
                <div className="text-xs text-gray-600">Email: {member.email}</div>
              )}
              {member.companyName && (
                <div className="text-xs text-gray-500">
                  Company: {member.companyName}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !selectedMember && value.length >= 3 && !loading && members.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-4 text-center text-sm text-gray-500 shadow-lg">
          Member tidak ditemukan. Pastikan member sudah terdaftar.
        </div>
      )}

      {/* Hint */}
      {!selectedMember && value.length < 3 && value.length > 0 && (
        <div className="mt-1 text-xs text-gray-500">
          Ketik minimal 3 karakter untuk mencari
        </div>
      )}
    </div>
  );
}
