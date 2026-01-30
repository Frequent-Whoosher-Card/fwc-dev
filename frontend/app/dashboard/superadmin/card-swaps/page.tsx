"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardSwapsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Card Swap Requests</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Permintaan Penukaran Kartu</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-500">Modul ini sedang dalam pengembangan.</p>
                </CardContent>
            </Card>
        </div>
    );
}
