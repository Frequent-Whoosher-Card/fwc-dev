"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotedPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Catatan</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Fitur Catatan</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        Halaman ini menampilkan log catatan penerimaan kartu. (Placeholder untuk Superadmin)
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
