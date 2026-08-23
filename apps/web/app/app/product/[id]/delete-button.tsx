"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/lib/products";

export function DeleteProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!confirming) {
    return (
      <button type="button" className="linkish danger" onClick={() => setConfirming(true)}>
        Remove this product
      </button>
    );
  }

  return (
    <div className="confirm-row">
      <span>Remove {`"`}this product{`"`} and everything we watch for it?</span>
      <button
        type="button"
        className="linkish danger"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          await deleteProduct(productId);
          router.push("/app");
          router.refresh();
        }}
      >
        {busy ? "Removing…" : "Yes, remove"}
      </button>
      <button type="button" className="linkish" onClick={() => setConfirming(false)} disabled={busy}>
        Cancel
      </button>
    </div>
  );
}
