"use client";

import { useState, useEffect } from "react";
import { getSwapHistory } from "@/lib/services/purchase.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface SwapHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
}

interface SwapLog {
  id: string;
  oldSerialNumber: string;
  newSerialNumber: string;
  swapReason: string;
  swapType: string;
  createdAt: string;
  oldCard: {
    serialNumber: string;
    cardProduct: {
      category: {
        categoryName: string;
      };
      type: {
        typeName: string;
      };
    };
  };
  newCard: {
    serialNumber: string;
    cardProduct: {
      category: {
        categoryName: string;
      };
      type: {
        typeName: string;
      };
    };
  };
  creator: {
    fullName: string;
    username: string;
  };
}

export function SwapHistoryModal({
  open,
  onOpenChange,
  purchaseId,
}: SwapHistoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [swapLogs, setSwapLogs] = useState<SwapLog[]>([]);

  useEffect(() => {
    if (open) {
      loadSwapHistory();
    }
  }, [open, purchaseId]);

  const loadSwapHistory = async () => {
    setIsLoading(true);
    try {
      const response = await getSwapHistory(purchaseId);
      if (response.success) {
        setSwapLogs(response.data);
      }
    } catch (error) {
      console.error("Failed to load swap history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSwapTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      TACTICAL: "default",
      CORRECTION: "secondary",
      CROSS_STATION: "destructive",
    };
    return (
      <Badge variant={variants[type] || "default"}>
        {type}
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Riwayat Swap Card
          </DialogTitle>
          <DialogDescription>
            Histori semua swap yang dilakukan pada transaksi ini
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : swapLogs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Belum ada riwayat swap untuk transaksi ini</p>
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Dari</TableHead>
                  <TableHead>Ke</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {swapLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.createdAt), "dd MMM yyyy HH:mm", {
                        locale: localeId,
                      })}
                    </TableCell>
                    <TableCell>{getSwapTypeBadge(log.swapType)}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-sm">
                          {log.oldCard.serialNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.oldCard.cardProduct.category.categoryName} -{" "}
                          {log.oldCard.cardProduct.type.typeName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-mono text-sm">
                          {log.newCard.serialNumber}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.newCard.cardProduct.category.categoryName} -{" "}
                          {log.newCard.cardProduct.type.typeName}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-sm truncate" title={log.swapReason}>
                        {log.swapReason}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div>{log.creator.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        @{log.creator.username}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
