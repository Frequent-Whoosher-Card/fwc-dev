'use client';

export default function GenerateNumberLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="space-y-6 py-6">
            {children}
        </div>
    );
}
