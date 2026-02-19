import { useState, useMemo } from "react";

type Product = {
  id: string;
  name: string;
  subtitle: string | null;
  basePrice: number;
  addonPrice?: number;
  includesCore: boolean;
  dependsOnCore: boolean;
};
type SelectionState = {
  selected: Set<string>;
  order: string[];
};

const PRODUCTS: Product[] = [
  {
    id: "core",
    name: "Core",
    subtitle: null,
    basePrice: 185,
    includesCore: true,
    dependsOnCore: false,
  },
  {
    id: "stock",
    name: "Stock",
    subtitle: "core inc.",
    basePrice: 370,
    addonPrice: 185,
    includesCore: true,
    dependsOnCore: false,
  },
  {
    id: "maps",
    name: "Maps",
    subtitle: "core inc.",
    basePrice: 250,
    addonPrice: 65,
    includesCore: true,
    dependsOnCore: false,
  },
  {
    id: "gantt",
    name: "Gantt",
    subtitle: "core inc.",
    basePrice: 222,
    addonPrice: 37,
    includesCore: true,
    dependsOnCore: false,
  },
];
const CORE_ID = "core";
const CORE_PRICE = PRODUCTS.find((product) => product.id === CORE_ID)?.basePrice ?? 0;
const PRODUCT_BY_ID = new Map(PRODUCTS.map((product) => [product.id, product]));

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// v1: Core only greys when NOT manually selected (shows "Required" lock when manually selected + others)
// v2: Core always greys whenever any other package is selected, regardless of click order
type SelectorVariant = "v1" | "v2";

function ProductSelector({ variant }: { variant: SelectorVariant }) {
  const [selectionState, setSelectionState] = useState<SelectionState>({
    selected: new Set(),
    order: [],
  });
  const selected = selectionState.selected;
  const selectionOrder = selectionState.order;

  const coreIsCovered = useMemo(() => {
    return (
      selected.has(CORE_ID) ||
      PRODUCTS.some((p) => p.id !== CORE_ID && p.includesCore && selected.has(p.id))
    );
  }, [selected]);

  const hasOtherIncludeCoreSelected = useMemo(() =>
    PRODUCTS.some((p) => p.id !== CORE_ID && p.includesCore && selected.has(p.id)),
    [selected]
  );

  const coreBundleOwnerId = useMemo(() => {
    for (const productId of selectionOrder) {
      if (!selected.has(productId)) continue;
      const product = PRODUCT_BY_ID.get(productId);
      if (product && product.includesCore) return product.id;
    }
    return PRODUCTS.find((product) => product.includesCore && selected.has(product.id))?.id ?? null;
  }, [selected, selectionOrder]);

  function getSelectedPrice(product: Product) {
    if (!selected.has(product.id)) return null;
    if (product.id === CORE_ID) return product.basePrice;
    if (product.includesCore) {
      if (product.id === coreBundleOwnerId) return product.basePrice;
      return product.addonPrice ?? Math.max(product.basePrice - CORE_PRICE, 0);
    }
    return product.basePrice;
  }

  function getEffectivePrice(product: Product) {
    if (product.id === CORE_ID) {
      return coreIsCovered && !selected.has(CORE_ID) ? null : product.basePrice;
    }
    const selectedPrice = getSelectedPrice(product);
    if (selectedPrice !== null) return selectedPrice;
    if (product.includesCore && coreIsCovered) {
      return product.addonPrice ?? Math.max(product.basePrice - CORE_PRICE, 0);
    }
    return product.basePrice;
  }

  function toggle(id: string) {
    setSelectionState((prev) => {
      const nextSelected = new Set(prev.selected);
      const nextOrder = prev.order.filter((productId) => productId !== id);
      const hasOtherSelected = PRODUCTS.some(
        (product) => product.id !== CORE_ID && nextSelected.has(product.id)
      );

      if (nextSelected.has(id)) {
        if (id === CORE_ID && hasOtherSelected) return prev;
        nextSelected.delete(id);
      } else {
        if (id === CORE_ID && hasOtherSelected) return prev;
        nextSelected.add(id);
        nextOrder.push(id);
      }
      return { selected: nextSelected, order: nextOrder };
    });
  }

  const totalPrice = useMemo(() => {
    let total = 0;
    for (const p of PRODUCTS) {
      const price = getSelectedPrice(p);
      if (price !== null) total += price;
    }
    return total;
  }, [selected, coreBundleOwnerId]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap gap-5 justify-center mb-10">
        {PRODUCTS.map((product) => {
          const isSelected = selected.has(product.id);

          // v1: Core greys only when NOT manually selected but covered by another
          // v2: Core greys whenever any other "core inc." package is selected
          const isCoreGreyed =
            product.id === CORE_ID && (
              variant === "v1"
                ? coreIsCovered && !selected.has(CORE_ID)
                : hasOtherIncludeCoreSelected
            );

          // v1 only: Core was manually selected but locked in by other selections
          const isCoreLockedIn =
            variant === "v1" &&
            product.id === CORE_ID &&
            selected.has(CORE_ID) &&
            hasOtherIncludeCoreSelected;

          const effectivePrice = getEffectivePrice(product);
          const isDiscounted =
            product.id !== CORE_ID &&
            effectivePrice !== null &&
            effectivePrice < product.basePrice;
          const active = isSelected || (product.id === CORE_ID && coreIsCovered && !isCoreGreyed);

          return (
            <button
              key={product.id}
              onClick={() => toggle(product.id)}
              disabled={isCoreGreyed || isCoreLockedIn}
              title={isCoreLockedIn ? "Core is required while other packages are selected" : undefined}
              className={`
                relative w-40 rounded-2xl border-2 p-5 text-left transition-all duration-200
                ${isCoreGreyed
                  ? "border-gray-200 bg-white opacity-25 cursor-not-allowed"
                  : isCoreLockedIn
                    ? "border-blue-400 bg-blue-50 shadow-md cursor-not-allowed"
                    : active
                      ? "border-blue-600 bg-blue-100 shadow-lg cursor-pointer"
                      : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-pointer"}
              `}
            >
              {/* Diagonal stripes on Core when greyed */}
              {isCoreGreyed && (
                <div
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, #d1d5db 0, #d1d5db 1px, transparent 0, transparent 50%)",
                    backgroundSize: "10px 10px",
                    opacity: 0.8,
                  }}
                />
              )}

              <div className="relative z-10">
                <div className="text-xs text-gray-400 font-medium mb-0.5 h-4">
                  {product.subtitle || ""}
                </div>
                <div className="text-lg font-bold text-gray-800 mb-4">{product.name}</div>

                <div className="mb-4">
                  {product.id === CORE_ID && isCoreGreyed ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold line-through text-gray-400">${product.basePrice}</span>
                      <span className="text-sm text-green-600 font-semibold">Included</span>
                    </div>
                  ) : isDiscounted ? (
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base line-through text-gray-400">${product.basePrice}</span>
                      <span className="text-xl font-bold text-blue-600">${effectivePrice}</span>
                    </div>
                  ) : (
                    <span className={`text-xl font-bold ${active ? "text-blue-600" : "text-gray-800"}`}>
                      ${effectivePrice}
                    </span>
                  )}
                </div>

                {/* Checkbox / Lock */}
                <div className="flex items-center gap-2">
                  <div
                    className={`
                      w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors
                      ${active
                        ? "border-blue-500 bg-blue-500 text-white"
                        : "border-gray-300 text-transparent"}
                    `}
                  >
                    <CheckIcon />
                  </div>
                  {isCoreLockedIn && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-blue-500">
                      <LockIcon />
                      Required
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Total */}
      <div className="bg-white border border-gray-200 rounded-2xl px-8 py-4 shadow-sm flex items-center gap-6">
        <span className="text-gray-500 text-sm font-medium">Total</span>
        <span className="text-3xl font-bold text-gray-800">${totalPrice}</span>
        {selected.size > 0 && (
          <button
            onClick={() => setSelectionState({ selected: new Set(), order: [] })}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-2"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-16 px-8 font-sans gap-20">
      <div className="flex flex-col items-center gap-8 w-full">
        <h2 className="text-xl font-bold text-gray-800">Product Select 1</h2>
        <p className="text-sm text-gray-500 -mt-4 text-center max-w-sm">
          Clicking Core first, then Stock keeps Core highlighted with a lock — it's required but was your explicit choice. This context will be deleted for the main test.
        </p>
        <ProductSelector variant="v1" />
      </div>

      <div className="w-full max-w-2xl border-t border-gray-200" />

      <div className="flex flex-col items-center gap-8 w-full">
        <h2 className="text-xl font-bold text-gray-800">Product Select 2</h2>
        <p className="text-sm text-gray-500 -mt-4 text-center max-w-sm">
          Core always greys out with stripes the moment any other package is selected — regardless of whether you clicked Core first. This context will be deleted for the main test.
        </p>
        <ProductSelector variant="v2" />
      </div>
    </div>
  );
}
