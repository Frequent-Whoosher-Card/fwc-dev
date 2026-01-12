"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  CreditCard,
  ShoppingCart,
  UserCheck,
} from "lucide-react";

export function PurchaseFlowGuide() {
  const steps = [
    {
      number: 1,
      title: "Create Purchase",
      description: "Pilih member dan kartu, input EDC reference",
      icon: ShoppingCart,
      status: "completed",
      detail: "Purchase dibuat dengan status PENDING, kartu berstatus ASSIGNED",
    },
    {
      number: 2,
      title: "Scan Serial Kartu Fisik",
      description:
        "Scan atau input serial number kartu yang diberikan ke customer",
      icon: CreditCard,
      status: "current",
      detail: "Validasi serial fisik harus sama dengan kartu yang di-assign",
    },
    {
      number: 3,
      title: "Aktivasi Berhasil",
      description: "Kartu aktif dan siap digunakan customer",
      icon: CheckCircle2,
      status: "pending",
      detail: "Status purchase: ACTIVATED, kartu: SOLD_ACTIVE",
    },
  ];

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Langkah Selanjutnya: Aktivasi Kartu
        </CardTitle>
        <CardDescription>
          Two-Step Activation Process - Purchase sudah dibuat, sekarang perlu
          aktivasi
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map((step, index) => (
          <div key={step.number} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === "completed"
                    ? "bg-green-500 text-white"
                    : step.status === "current"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {step.status === "completed" ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              {index < steps.length - 1 && (
                <div className="w-0.5 h-12 bg-gray-300 my-1" />
              )}
            </div>
            <div className="flex-1 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold">{step.title}</h4>
                {step.status === "completed" && (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-300"
                  >
                    Selesai
                  </Badge>
                )}
                {step.status === "current" && (
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-300"
                  >
                    Sedang Proses
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
              <p className="text-xs text-muted-foreground mt-1 italic">
                {step.detail}
              </p>
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 bg-white rounded-lg border border-blue-200">
          <h5 className="font-semibold text-sm mb-2">📋 Cara Aktivasi:</h5>
          <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
            <li>
              Klik tombol <strong>"Pending Aktivasi"</strong> untuk melihat
              purchase yang perlu diaktivasi
            </li>
            <li>
              Atau lihat purchase dengan badge status{" "}
              <Badge variant="outline" className="text-xs">
                PENDING
              </Badge>
            </li>
            <li>
              Klik tombol <strong>"Aktivasi"</strong> pada purchase yang baru
              dibuat
            </li>
            <li>
              Scan atau ketik serial number kartu fisik yang diberikan ke
              customer
            </li>
            <li>Sistem akan validasi dan mengaktifkan kartu</li>
          </ol>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h5 className="font-semibold text-sm mb-2 text-amber-800">
            ⚠️ Penting:
          </h5>
          <ul className="text-sm space-y-1 list-disc list-inside text-amber-700">
            <li>
              Serial number fisik <strong>harus sama</strong> dengan kartu yang
              di-assign
            </li>
            <li>
              Jika salah kartu, gunakan tombol <strong>"Tukar"</strong> untuk
              mengganti
            </li>
            <li>
              Purchase yang belum diaktivasi tidak bisa digunakan customer
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
