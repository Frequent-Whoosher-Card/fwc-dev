"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ReconciliationPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Rekonsiliasi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Fitur Rekonsiliasi</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Halaman ini sedang dalam pengembangan. Fitur rekonsiliasi data sistem vs Excel akan segera tersedia di sini.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
