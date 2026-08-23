import Link from "next/link";
import type { SavedProduct } from "@/lib/products";

/**
 * The radar is the home screen (design-system.md §2). Products are dots on an
 * ambient sweep; the list underneath carries the detail. Both are rendered so
 * the page is fully usable with the animation off.
 */
export function RadarBoard({ products }: { products: SavedProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="empty">
        <div className="radar-lg" aria-hidden="true" />
        <p>
          Describe a product once, in plain English. We&apos;ll show what appears to apply
          and watch it from then on.
        </p>
        <Link href="/app/passport/new" className="btn-amber">Start a Product Passport</Link>
      </div>
    );
  }

  // Spread dots evenly around the sweep rather than randomly, so the layout is
  // stable between renders.
  const positioned = products.slice(0, 12).map((p, i, arr) => {
    const angle = (i / arr.length) * Math.PI * 2;
    const radius = 24 + (i % 3) * 9;
    return {
      product: p,
      top: `${50 + Math.sin(angle) * radius}%`,
      left: `${50 + Math.cos(angle) * radius}%`,
    };
  });

  return (
    <div className="board">
      <div className="radar-lg" aria-hidden="true">
        {positioned.map(({ product, top, left }) => (
          <span
            key={product.id}
            className={`dot ${product.passportStatus === "complete" ? "good" : "draft"}`}
            style={{ top, left }}
            title={product.name}
          />
        ))}
      </div>

      <ul className="product-list">
        {products.map((p) => (
          <li key={p.id}>
            <Link href={`/app/product/${p.id}`} className="product-row">
              <span className={`status-dot ${p.passportStatus === "complete" ? "good" : "draft"}`} aria-hidden="true" />
              <span className="product-main">
                <strong>{p.name}</strong>
                <span className="product-meta">
                  {p.htsCode ? <code>{p.htsCode}</code> : <em>code not confirmed</em>}
                  {p.originCountry && <> &middot; made in {p.originCountry}</>}
                  {" "}&middot; {p.watchCount} alert{p.watchCount === 1 ? "" : "s"} on
                </span>
              </span>
              {p.passportStatus === "complete" ? (
                <span className="pill good">All clear</span>
              ) : (
                <span className="pill draft">Finish passport</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
