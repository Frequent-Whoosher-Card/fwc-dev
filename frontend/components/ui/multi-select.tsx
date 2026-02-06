"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  id: string;
  name: string;
  code: string;
}

interface MultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  options: Option[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder,
  className = "",
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter((v) => v !== code));
    } else {
      onChange([...value, code]);
    }
  };

  const getDisplayValue = () => {
    if (value.length === 0) return placeholder;
    if (value.length === options.length) return "Semua Filter";
    if (value.length > 2) return `${value.length} Filter Terpilih`;

    return value
      .map((v) => options.find((opt) => opt.code === v)?.name || v)
      .join(", ");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-[#8D1231] bg-[#8D1231] px-3 py-1.5 text-sm text-white transition-all hover:bg-[#a6153a] focus:ring-1 focus:ring-[#8D1231] focus:border-[#8D1231] disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "ring-1 ring-[#8D1231] border-[#8D1231]" : ""
        }`}
      >
        <span
          className={`truncate font-normal ${value.length === 0 ? "text-red-100" : "text-white"}`}
        >
          {getDisplayValue()}
        </span>
        <ChevronDown
          size={16}
          className={`text-white transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {shouldRender && (
        <div
          className={`absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 ${
            isOpen
              ? "animate-in fade-in zoom-in slide-in-from-top-2 duration-100"
              : "animate-out fade-out zoom-out slide-out-to-top-2 duration-100 fill-mode-forwards"
          }`}
        >
          {options.map((option) => {
            const isSelected = value.includes(option.code);
            return (
              <div
                key={option.id}
                onClick={() => handleSelect(option.code)}
                className={`cursor-pointer px-3 py-1.5 text-sm transition-colors flex items-center gap-2 ${
                  isSelected
                    ? "bg-[#8D1231]/5 text-[#8D1231] font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors ${isSelected ? "bg-[#8D1231] border-[#8D1231]" : "border-gray-300 bg-white"}`}
                >
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
                <span className="truncate">{option.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
