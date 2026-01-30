"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface Option {
  id: string;
  name: string;
  code: string;
}

interface ThemedSelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  className?: string;
  disabled?: boolean;
}

export function ThemedSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  disabled = false,
}: ThemedSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.code === value);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 100); // match duration-100
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
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full sm:w-auto min-w-[140px] ${className}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-[#8D1231] bg-[#8D1231] px-3 py-2 text-sm text-white transition-all hover:bg-[#a6153a] focus:ring-1 focus:ring-[#8D1231] disabled:opacity-50 disabled:cursor-not-allowed ${
          isOpen ? "ring-1 ring-[#8D1231]" : ""
        }`}
      >
        <span
          className={`truncate font-medium ${!selectedOption ? "text-red-100" : "text-white"}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
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
          className={`absolute left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#8D1231] bg-[#8D1231] py-1 shadow-lg ring-1 ring-black ring-opacity-5 ${
            isOpen
              ? "animate-in fade-in zoom-in slide-in-from-top-2 duration-100"
              : "animate-out fade-out zoom-out slide-out-to-top-2 duration-100 fill-mode-forwards"
          }`}
        >
          <div
            onClick={() => handleSelect("all")}
            className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-[#a6153a] flex items-center ${
              value === "all"
                ? "bg-[#7a0f2a] text-white font-bold"
                : "text-red-100"
            }`}
          >
            {placeholder}
          </div>
          {options.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelect(option.code)}
              className={`cursor-pointer px-3 py-2 text-sm transition-colors hover:bg-[#a6153a] flex items-center ${
                value === option.code
                  ? "bg-[#7a0f2a] text-white font-bold"
                  : "text-red-100"
              }`}
            >
              <span className="truncate">{option.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
