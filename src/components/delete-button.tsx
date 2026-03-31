"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteButton({
  entityType,
  entityId,
  entityName,
  apiPath,
  className,
}: {
  entityType: string;
  entityId: string;
  entityName: string;
  apiPath: string;
  className?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(apiPath, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entityId }),
    });
    if (res.ok) {
      router.refresh();
    }
    setDeleting(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className={`flex items-center gap-2 ${className || ""}`}>
        <span className="text-xs text-red-600">
          Delete {entityType} &quot;{entityName}&quot;?
        </span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs px-2 py-1 border border-gray-300 text-gray-600 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className={`text-xs text-red-500 hover:text-red-700 px-2 py-1 ${className || ""}`}
    >
      Delete
    </button>
  );
}
