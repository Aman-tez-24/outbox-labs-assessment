import "./dashboard.css";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-4">
      <p className="text-xs text-neutral-400">
        Page {page} of {totalPages}
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
