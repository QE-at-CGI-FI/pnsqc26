// Bombadil specification for The Enchanted Brew Shop.
// Each exported property is named after its slug in scratchbook/property-catalog.md.
// Prices follow the catalog's "label model": what the shopper is charged must follow from the
// visible labels (potion price, size "Nx price", potency "+N% price", ingredient "+N gold",
// delivery "N gold", sale price, brewing fee).
import { always, eventually, next, now } from "@antithesishq/bombadil";
import { actions, extract, registerCustomAction, weighted } from "@antithesishq/bombadil/browser";
import {
    shop,
    gold,
    labelGold,
    sizeMultiplier,
    potencyMultiplier,
    summaryQuantity,
    featuredCount,
    close,
    type ShopState,
} from "./shop-state.ts";

// Default properties (uncaught exceptions, console errors, HTTP errors) and actions
// (clicks, typing, scrolling, back/forward/reload)
export * from "@antithesishq/bombadil/browser/defaults";

// Holds in every state where the page is rendered by app.js; vacuously true before that
function whenHydrated(check: (s: ShopState) => boolean) {
    return always(() => {
        const s = shop.current;
        return !s || !s.hydrated || check(s);
    });
}

const ESTIMATES: Record<string, string[]> = {
    owl: ["3-5 days"],
    dragon: ["Tomorrow", "Next day"],
};

// ---------------------------------------------------------------------------
// Category 1: load-time timing and DOM ↔ summary consistency
// ---------------------------------------------------------------------------

// no-uncaught-script-errors: covered by the default `noUncaughtExceptions` property.
// early-interaction-not-lost: not expressible here; Bombadil acts only once the page has loaded.
//   It needs Antithesis network latency (see scratchbook/deployment-topology.md).
// restored-form-state-reflected: covered by summaryReflectsDomSelection, since the default
//   actions include reload, back and forward.

export const pageBecomesInteractive = eventually(() => shop.current?.hydrated ?? false).within(5, "seconds");

export const summaryReflectsDomSelection = whenHydrated((s) => {
    const potionShown = s.potion ? s.potion.name : "No potion selected";
    const quantityAgrees = s.quantityFocused || s.quantityField === String(summaryQuantity(s));
    return (
        s.summary.potionName === potionShown &&
        s.size !== null && s.summary.sizeName.startsWith(`Size: ${s.size.name}`) &&
        s.potency !== null && s.summary.potencyName.startsWith(`Potency: ${s.potency.name}`) &&
        s.delivery !== null && s.summary.deliveryName === `Delivery: ${s.delivery.name}` &&
        quantityAgrees
    );
});

// When the confirmation opens, its estimate matches the delivery chosen in the state before submit
export const deliveryEstimateMatchesSelection = always(() => {
    const before = shop.current;
    if (!before || before.modal.open || !before.delivery) return true;
    const expected = ESTIMATES[before.delivery.value] ?? [];
    return next(() => {
        const after = shop.current;
        return !after || !after.modal.open || expected.includes(after.modal.estimate);
    });
});

// ---------------------------------------------------------------------------
// Category 2: price model correctness
// ---------------------------------------------------------------------------

function labelModelTotal(s: ShopState): number {
    const potion = s.potion
        ? labelGold(s.potion.price) *
          sizeMultiplier(s.size?.detail ?? "") *
          potencyMultiplier(s.potency?.detail ?? "") *
          summaryQuantity(s)
        : 0;
    const ingredients = s.ingredients.reduce((sum, i) => sum + labelGold(i.price), 0);
    const featured = featuredCount(s) * gold(s.salePrice);
    const delivery = labelGold(s.delivery?.detail ?? "");
    return potion + ingredients + featured + delivery + labelGold(s.summary.brewingFee);
}

export const displayedTotalMatchesPriceModel = whenHydrated((s) =>
    close(gold(s.summary.total), labelModelTotal(s)),
);

export const sizeMultiplierMatchesLabel = whenHydrated((s) => {
    // Summary says e.g. "Size: Flask (1.5x)"; the option says "150ml · 1.5x price"
    const match = /\((\d+(?:\.\d+)?)x\)$/.exec(s.summary.sizeName);
    return s.size !== null && match !== null && parseFloat(match[1]) === sizeMultiplier(s.size.detail);
});

export const ingredientChargeMatchesLabel = whenHydrated((s) =>
    close(labelGold(s.summary.ingredientsPrice), s.ingredients.reduce((sum, i) => sum + labelGold(i.price), 0)),
);

export const featuredChargeMatchesSalePrice = whenHydrated((s) =>
    s.summary.featuredHidden || close(gold(s.summary.featuredPrice), featuredCount(s) * gold(s.salePrice)),
);

export const totalIncludesDelivery = whenHydrated((s) =>
    s.delivery !== null &&
    labelGold(s.summary.deliveryPrice) === labelGold(s.delivery.detail) &&
    close(gold(s.summary.total), gold(s.summary.subtotal) + labelGold(s.summary.deliveryPrice) + labelGold(s.summary.brewingFee)),
);

export const summaryLineItemsAccountForTotal = whenHydrated((s) => {
    const shown = s.summary.lineAmounts.map(labelGold).filter((amount) => !isNaN(amount));
    return close(shown.reduce((sum, amount) => sum + amount, 0), gold(s.summary.subtotal));
});

export const moneyRoundingConsistent = whenHydrated((s) =>
    [s.summary.subtotal, s.summary.total].every((amount) => /^\d+\.\d{2} gold$/.test(amount)),
);

// ingredients-scale-with-quantity: not encoded; needs a human decision on whether ingredients
// are per potion or per order. The label model above follows the current behavior (per order).

// ---------------------------------------------------------------------------
// Category 3: input boundaries
// ---------------------------------------------------------------------------

export const totalIsFiniteNonnegative = whenHydrated((s) => {
    const total = gold(s.summary.total);
    return isFinite(total) && total >= labelGold(s.summary.brewingFee);
});

export const quantityWithinBounds = whenHydrated((s) => {
    const quantity = summaryQuantity(s);
    return Number.isInteger(quantity) && quantity >= 1 && quantity <= 99;
});

// ---------------------------------------------------------------------------
// Category 4: order submission
// ---------------------------------------------------------------------------

// A confirmation only opens if the state before it had a potion or a Potion of the Week in the order
export const orderRequiresItems = always(() => {
    const before = shop.current;
    if (!before || before.modal.open) return true;
    const hasItems = before.potion !== null || featuredCount(before) > 0;
    return next(() => hasItems || !(shop.current?.modal.open ?? false));
});

// order-numbers-unique: not encoded; 1-in-90 000 collisions are only explorable under
//   Antithesis-controlled randomness.
// post-order-builder-state-coherent: not encoded; needs a human decision on what the builder
//   should look like after an order.

// ---------------------------------------------------------------------------
// Category 5: timers
// ---------------------------------------------------------------------------

const lastAction = extract((state) => state.lastAction);

function clickedFeaturedButton(): boolean {
    const action = lastAction.current;
    return (
        typeof action === "object" && action !== null && "Click" in action &&
        action.Click.fingerprint.tag === "button" &&
        (action.Click.fingerprint.textContent ?? "").startsWith("Add to Order")
    );
}

// Clicking an enabled "Add to Order" always changes what is in the order
export const featuredButtonStateTruthful = always(() => {
    const before = shop.current;
    if (!before || !before.hydrated || before.featuredButton.disabled || before.featuredButton.text !== "Add to Order") {
        return true;
    }
    const countBefore = featuredCount(before);
    return next(() => {
        const after = shop.current;
        return !clickedFeaturedButton() || !after || featuredCount(after) > countBefore;
    });
});

// ---------------------------------------------------------------------------
// Category 6: reachability anchors (fail if never reached during the run)
// ---------------------------------------------------------------------------

const modalOpen = () => shop.current?.modal.open ?? false;

export const reachedConfirmedDragonOrder = eventually(
    () => modalOpen() && shop.current?.modal.estimate === "Tomorrow",
);

export const reachedFeaturedWithBasePotion = eventually(() => {
    const s = shop.current;
    return !!s && s.potion !== null && featuredCount(s) > 0;
});

export const reachedSecondOrderInSession = eventually(
    now(modalOpen).and(eventually(now(() => !modalOpen()).and(eventually(modalOpen)))),
);

export const reachedEmptyQuantityField = eventually(() => shop.current?.quantityField === "");

// referenced-assets-load: every same-origin resource the page loaded succeeded.
// /favicon.ico is the browser's own request; the page doesn't reference it.
const failedAssets = extract((state) =>
    state.window.performance
        .getEntriesByType("resource")
        .filter((entry) => entry.name.startsWith(state.window.location.origin))
        .filter((entry) => new URL(entry.name).pathname !== "/favicon.ico")
        .filter((entry) => {
            const status = (entry as PerformanceResourceTiming).responseStatus;
            return status !== undefined && status >= 400;
        })
        .map((entry) => entry.name),
);

export const referencedAssetsLoad = always(() => failedAssets.current.length === 0);

// ---------------------------------------------------------------------------
// Actions on top of the defaults
// ---------------------------------------------------------------------------

// Random typing rarely produces a deliverable address, so offer valid details to reach the confirmation
const fillDeliveryDetails = registerCustomAction(
    "fillDeliveryDetails",
    async (document, _window, name: string, castle: string, kingdom: string) => {
        const values: Record<string, string> = { "customer-name": name, "castle-name": castle, kingdom };
        for (const [id, value] of Object.entries(values)) {
            const field = document.querySelector<HTMLInputElement>(`#${id}`);
            if (!field) throw new Error(`#${id} not found`);
            field.value = value;
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("blur"));
        }
    },
);

const deliveryDetailsMissing = extract((state) =>
    ["customer-name", "castle-name", "kingdom"].some((id) => {
        const field = state.document.querySelector<HTMLInputElement>(`#${id}`);
        return !!field && (field.value === "" || field.getAttribute("aria-invalid") === "true");
    }),
);

export const deliveryDetails = actions(() =>
    deliveryDetailsMissing.current && !modalOpen()
        ? [
              fillDeliveryDetails("Gandalf the Grey", "Orthanc", "Isengard"),
              fillDeliveryDetails("Hermione Granger", "Hogwarts Castle", "Scotland"),
          ]
        : [],
);

// Quantity boxes: besides the digits the defaults type, try what shoppers fumble in
const activeQuantityBox = extract((state) => {
    const active = state.document.activeElement;
    return !!active && (active.id === "quantity" || active.id === "featured-quantity");
});

export const quantityEdgeInputs = actions(() =>
    activeQuantityBox.current
        ? weighted([
              [3, { PressKey: { code: 8 } }],
              [2, { TypeText: { text: { Regexp: "-?[0-9]{1,3}" }, delayMillis: [1, 5] } }],
              [1, { TypeText: { text: { Regexp: "[0-9]?[.e][0-9]?" }, delayMillis: [1, 5] } }],
          ]).generate()
        : [],
);
