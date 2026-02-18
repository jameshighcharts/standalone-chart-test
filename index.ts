import { useState, useMemo } from "react";

const PRODUCTS = [
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

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function App() {
  const [selected, setSelected] = useState(new Set());

  // Core is covered if "core" is selected OR any "core inc." product is selected
  const coreIsCovered = useMemo(() => {
    return (
      selected.has("core") ||
      PRODUCTS.some((p) => p.id !== "core" && p.includesCore && selected.has(p.id))
    );
  }, [selected]);

  function getEffectivePrice(product) {
    if (product.id === "core") {
      return coreIsCovered && !selected.has("core") ? null : product.basePrice;
    }
    if (product.includesCore && coreIsCovered && !selected.has(product.id)) {
      return product.addonPrice ?? product.basePrice;
    }
    if (product.includesCore && coreIsCovered && selected.has(product.id)) {
      return product.addonPrice ?? product.basePrice;
    }
    return product.basePrice;
  }

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        // If deselecting a core-inc product and no other core source remains, 
        // core itself also gets deselected if it was auto-implied
      } else {
        next.add(id);
      }
      return next;
    });
  }

  const totalPrice = useMemo(() => {
    let total = 0;
    const coreAlreadyCounted = PRODUCTS.some(
      (p) => p.id !== "core" && p.includesCore && selected.has(p.id)
    );
    for (const p of PRODUCTS) {
      if (!selected.has(p.id)) continue;
      if (p.id === "core" && coreAlreadyCounted) continue; // core is bundled
      if (p.includesCore && p.id !== "core") {
        // If core is covered by another "core inc." product already counted
        const otherCoreSource = PRODUCTS.some(
          (q) => q.id !== p.id && q.id !== "core" && q.includesCore && selected.has(q.id)
        ) || selected.has("core");
        total += otherCoreSource ? (p.addonPrice ?? p.basePrice) : p.basePrice;
      } else {
        total += p.basePrice;
      }
    }
    return total;
  }, [selected]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Highcharts License</h1>
      <p className="text-gray-500 text-sm mb-10">Select the products you need. Bundles are applied automatically.</p>

      <div className="flex flex-wrap gap-5 justify-center mb-10">
        {PRODUCTS.map((product) => {
          const isSelected = selected.has(product.id);
          const isAutoSelected = product.id === "core" && coreIsCovered && !selected.has("core");
          const effectivePrice = getEffectivePrice(product);
          const isDiscounted =
            product.id !== "core" &&
            product.includesCore &&
            coreIsCovered &&
            product.basePrice !== (product.addonPrice ?? product.basePrice);
          const active = isSelected || isAutoSelected;

          return (
            <button
              key={product.id}
              onClick={() => toggle(product.id)}
              className={`
                relative w-40 rounded-2xl border-2 p-5 text-left transition-all duration-200 cursor-pointer
                ${active
                  ? "border-blue-500 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm"}
              `}
            >
              {/* Diagonal stripes overlay when active */}
              {active && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-10 pointer-events-none"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(-45deg, #3b82f6 0, #3b82f6 1px, transparent 0, transparent 50%)",
                    backgroundSize: "8px 8px",
                  }}
                />
              )}

              <div className="relative z-10">
                <div className="text-xs text-gray-400 font-medium mb-0.5 h-4">
                  {product.subtitle || ""}
                </div>
                <div className="text-lg font-bold text-gray-800 mb-4">{product.name}</div>

                <div className="mb-4">
                  {product.id === "core" && isAutoSelected ? (
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

                {/* Checkbox */}
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
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-400 hover:text-red-400 transition-colors ml-2"
          >
            Clear
          </button>
        )}
      </div>

      {coreIsCovered && (
        <p className="mt-4 text-xs text-green-600 font-medium">
          ✓ Core is included — add-on pricing applied to Maps & Gantt
        </p>
      )}
    </div>
  );
}
