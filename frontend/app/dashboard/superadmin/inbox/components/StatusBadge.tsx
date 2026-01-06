export default function StatusBadge({
  status,
}: {
  status: string;
}) {
  if (!status) return null;

  switch (status) {
    case 'ACCEPTED':
      return (
        <span
          className="
            inline-flex
            w-fit
            items-center
            rounded-full
            bg-green-100
            px-3 py-1
            text-xs
            font-medium
            text-green-700
          "
        >
          Accepted
        </span>
      );

    case 'CARD_MISSING':
      return (
        <span
          className="
            inline-flex
            w-fit
            items-center
            rounded-full
            bg-yellow-100
            px-3 py-1
            text-xs
            font-medium
            text-yellow-700
          "
        >
          Card Missing
        </span>
      );

    case 'CARD_DAMAGED':
      return (
        <span
          className="
            inline-flex
            w-fit
            items-center
            rounded-full
            bg-red-100
            px-3 py-1
            text-xs
            font-medium
            text-red-700
          "
        >
          Card Damaged
        </span>
      );

    default:
      return null;
  }
}
