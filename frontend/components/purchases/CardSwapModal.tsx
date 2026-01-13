"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  swapCardPostPurchase,
  SwapCardPayload,
  SwapWarning,
} from "@/lib/services/purchase.service";
import { AlertTriangle, Info, Loader2 } from "lucide-react";

interface CardSwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
  currentSerialNumber: string;
  onSuccess?: () => void;
}

export function CardSwapModal({
  open,
  onOpenChange,
  purchaseId,
  currentSerialNumber,
  onSuccess,
}: CardSwapModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [warnings, setWarnings] = useState<SwapWarning[]>([]);

  const [formData, setFormData] = useState<SwapCardPayload>({
    newSerialNumber: "",
    swapReason: "",
    swapType: "TACTICAL",
    adjustInventory: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setWarnings([]);

    try {
      const response = await swapCardPostPurchase(purchaseId, formData);

      if (response.success) {
        // Show warnings if any
        if (response.data.warnings && response.data.warnings.length > 0) {
          setWarnings(response.data.warnings);
        }

        toast.success("Card berhasil di-swap!", {
          description: `${currentSerialNumber} → ${formData.newSerialNumber}`,
        });

        // Reset form
        setFormData({
          newSerialNumber: "",
          swapReason: "",
          swapType: "TACTICAL",
          adjustInventory: false,
        });

        onSuccess?.();
        
        // Close modal after showing warnings (if any)
        if (!response.data.warnings || response.data.warnings.length === 0) {
          onOpenChange(false);
        }
      }
    } catch (error: any) {
      toast.error("Gagal swap card", {
        description: error.message || "Terjadi kesalahan",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setWarnings([]);
    setFormData({
      newSerialNumber: "",
      swapReason: "",
      swapType: "TACTICAL",
      adjustInventory: false,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Swap Card - Post Purchase</DialogTitle>
          <DialogDescription>
            Ganti kartu pada transaksi yang sudah terjadi. Untuk koreksi data atau
            swap antar stasiun.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Current Serial Number */}
            <div className="space-y-2">
              <Label>Serial Number Saat Ini</Label>
              <Input value={currentSerialNumber} disabled />
            </div>

            {/* New Serial Number */}
            <div className="space-y-2">
              <Label htmlFor="newSerialNumber">
                Serial Number Baru <span className="text-red-500">*</span>
              </Label>
              <Input
                id="newSerialNumber"
                placeholder="Masukkan serial number kartu baru"
                value={formData.newSerialNumber}
                onChange={(e) =>
                  setFormData({ ...formData, newSerialNumber: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </div>

            {/* Swap Type */}
            <div className="space-y-2">
              <Label htmlFor="swapType">
                Tipe Swap <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.swapType}
                onValueChange={(value: any) =>
                  setFormData({ ...formData, swapType: value })
                }
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TACTICAL">
                    TACTICAL - Input taktis (volume tinggi)
                  </SelectItem>
                  <SelectItem value="CORRECTION">
                    CORRECTION - Koreksi kesalahan input
                  </SelectItem>
                  <SelectItem value="CROSS_STATION">
                    CROSS_STATION - Swap antar stasiun
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Swap Reason */}
            <div className="space-y-2">
              <Label htmlFor="swapReason">
                Alasan Swap <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="swapReason"
                placeholder="Jelaskan alasan swap kartu..."
                value={formData.swapReason}
                onChange={(e) =>
                  setFormData({ ...formData, swapReason: e.target.value })
                }
                required
                disabled={isLoading}
                rows={3}
              />
            </div>

            {/* Adjust Inventory */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="adjustInventory"
                checked={formData.adjustInventory}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    adjustInventory: checked as boolean,
                  })
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="adjustInventory"
                className="text-sm font-normal cursor-pointer"
              >
                Adjust inventory (opsional)
              </Label>
            </div>

            {/* Warnings Display */}
            {warnings.length > 0 && (
              <div className="space-y-2 pt-2">
                <Label>Warnings:</Label>
                {warnings.map((warning, index) => (
                  <Alert
                    key={index}
                    variant={warning.severity === "warning" ? "destructive" : "default"}
                  >
                    {warning.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      <strong>{warning.field}:</strong> {warning.message}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Info Box */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Catatan:</strong> Sistem menggunakan soft validation. Swap
                akan tetap dilakukan meskipun ada warnings. Pastikan data sudah
                benar sebelum submit.
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {warnings.length > 0 ? "Tutup" : "Swap Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
