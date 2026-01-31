"use client";

import Button from "../components/Button";
import Table from "../components/Table";
import Pagination from "../components/Pagination";
import { useLanguage } from "@/hooks/useLanguage";

export default function PetugasPage() {
  const { t } = useLanguage();
  const columns = [
    t("no"),
    t("nik"),
    t("card_category"),
    t("card_type"),
    t("card_aktif"),
    t("card_expired"),
    t("stasiun"),
    t("action"),
  ];

  const rows = [
    [
      1,
      "3174xxxxxxxx",
      "Gold",
      "Personal",
      "Aktif",
      "12-12-2026",
      "Halim",
      <button key="1" className="text-blue-600 text-sm">
        {t("view_detail")}
      </button>,
    ],
    [
      2,
      "3175xxxxxxxx",
      "Silver",
      "Corporate",
      "Aktif",
      "08-05-2026",
      "Karawang",
      <button key="2" className="text-blue-600 text-sm">
        {t("view_detail")}
      </button>,
    ],
  ];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h2 className="text-lg font-semibold">
          {t("member_list")} {t("app_title")}
        </h2>
        <p className="text-xs text-gray-500">
          last update 12 December 2025 09.30 AM
        </p>
      </div>

      {/* ACTION BAR */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="primary">{t("tambah")}</Button>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={t("search")}
            className="h-9 px-3 text-sm border rounded-md"
          />
          <Button variant="secondary">{t("filter")}</Button>
          <Button variant="secondary">{t("export")}</Button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border rounded-md overflow-hidden">
        <Table columns={columns} data={rows} />
      </div>

      {/* PAGINATION */}
      <Pagination />
    </div>
  );
}
