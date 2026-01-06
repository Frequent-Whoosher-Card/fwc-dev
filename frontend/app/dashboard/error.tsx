"use client";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md rounded-xl bg-white p-6 text-center shadow-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          !
        </div>
        <h1 className="text-lg font-semibold text-gray-900">
          Terjadi kesalahan di dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          {error.message || "Silakan coba lagi beberapa saat lagi."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-[var(--kcic)] px-4 text-sm font-semibold text-white hover:opacity-90"
        >
          Coba lagi
        </button>
      </div>
    </div>
  );
}



