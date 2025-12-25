export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="flex flex-col items-center gap-4">
        <span className="text-sm text-gray-300 tracking-wide">
          Loading
        </span>

        <div className="h-12 w-12 rounded-full border-4 border-gray-600 border-t-[var(--kcic)] animate-spin" />
      </div>
    </div>
  );
}
