// Reads everything the properties need from the page, using only what a shopper can see:
// checked controls, their visible labels, the order summary and the confirmation modal.
// Amounts are kept as raw text here and parsed by the properties, so formatting bugs stay visible.
import { extract } from "@antithesishq/bombadil/browser";

export type Choice = { value: string; name: string; detail: string };

export type ShopState = {
    hydrated: boolean;
    potion: (Choice & { price: string }) | null;
    size: Choice | null;
    potency: Choice | null;
    ingredients: { value: string; price: string }[];
    delivery: Choice | null;
    quantityField: string;
    quantityFocused: boolean;
    salePrice: string;
    featuredButton: { text: string; disabled: boolean };
    summary: {
        potionName: string;
        lineAmounts: string[];
        sizeName: string;
        potencyName: string;
        ingredientsPrice: string;
        quantityName: string;
        featuredHidden: boolean;
        featuredName: string;
        featuredPrice: string;
        subtotal: string;
        deliveryName: string;
        deliveryPrice: string;
        brewingFee: string;
        total: string;
    };
    modal: { open: boolean; orderNumber: string; estimate: string };
};

export const shop = extract((state): ShopState | null => {
    const document = state.document;
    if (!document.querySelector("#summary-total")) return null;

    const text = (selector: string, root: ParentNode = document) =>
        root.querySelector(selector)?.textContent?.trim() ?? "";

    const checked = (name: string, nameSelector: string, detailSelector: string) => {
        const input = document.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`);
        const label = input?.closest("label");
        if (!input || !label) return null;
        return { value: input.value, name: text(nameSelector, label), detail: text(detailSelector, label) };
    };

    const potion = checked("base-potion", ".potion-name", ".potion-price");
    const quantity = document.querySelector<HTMLInputElement>("#quantity");
    const featuredButton = document.querySelector<HTMLButtonElement>(".btn-featured");
    const total = text("#summary-total .total-price");

    return {
        // The static HTML says "8 gold"; app.js always renders two decimals
        hydrated: /\.\d{2} gold$/.test(total),
        potion: potion && { ...potion, price: potion.detail },
        size: checked("size", ".size-name", ".size-detail"),
        potency: checked("potency", ".potency-name", ".potency-detail"),
        ingredients: Array.from(
            document.querySelectorAll<HTMLInputElement>('input[name="ingredient"]:checked'),
        ).map((input) => ({
            value: input.value,
            price: text(".ingredient-price", input.closest("label") ?? document),
        })),
        delivery: checked("delivery", ".delivery-name", ".delivery-detail"),
        quantityField: quantity?.value ?? "",
        quantityFocused: document.activeElement === quantity,
        salePrice: text(".featured-potion .sale-price"),
        featuredButton: {
            text: featuredButton?.textContent?.trim() ?? "",
            disabled: featuredButton?.disabled ?? true,
        },
        summary: {
            potionName: text("#summary-potion .item-name"),
            // Amount column of every visible line above the subtotal
            lineAmounts: Array.from(
                document.querySelectorAll<HTMLElement>(
                    "#summary-potion, #summary-size, #summary-potency, #summary-ingredients, #summary-quantity, #summary-featured",
                ),
            )
                .filter((line) => !line.hidden)
                .map((line) => text(".item-price", line)),
            sizeName: text("#summary-size .item-name"),
            potencyName: text("#summary-potency .item-name"),
            ingredientsPrice: text("#summary-ingredients .item-price"),
            quantityName: text("#summary-quantity .item-name"),
            featuredHidden: document.querySelector<HTMLElement>("#summary-featured")?.hidden ?? true,
            featuredName: text("#summary-featured .item-name"),
            featuredPrice: text("#summary-featured .item-price"),
            subtotal: text("#summary-subtotal .item-price"),
            deliveryName: text("#summary-delivery .item-name"),
            deliveryPrice: text("#summary-delivery .item-price"),
            brewingFee: text(".brewing-fee .item-price"),
            total,
        },
        modal: {
            open: document.querySelector("#confirmation-modal")?.classList.contains("active") ?? false,
            orderNumber: text("#order-number"),
            estimate: text("#delivery-estimate"),
        },
    };
});

/** "12.50 gold" → 12.5; anything else → NaN */
export function gold(amount: string): number {
    const match = /^(-?\d+(?:\.\d+)?) gold$/.exec(amount);
    return match ? parseFloat(match[1]) : NaN;
}

/** "+15 gold" → 15 */
export function labelGold(label: string): number {
    const match = /(\d+(?:\.\d+)?) gold/.exec(label);
    return match ? parseFloat(match[1]) : NaN;
}

/** Size label "150ml · 1.5x price" → 1.5 */
export function sizeMultiplier(detail: string): number {
    const match = /(\d+(?:\.\d+)?)x price/.exec(detail);
    return match ? parseFloat(match[1]) : NaN;
}

/** Potency label "+25% strength, +25% price" → 1.25; "Regular strength" → 1 */
export function potencyMultiplier(detail: string): number {
    const match = /\+(\d+)% price/.exec(detail);
    return match ? 1 + parseInt(match[1]) / 100 : 1;
}

/** Summary "Quantity: 3" → 3 */
export function summaryQuantity(s: ShopState): number {
    return parseFloat(s.summary.quantityName.replace("Quantity: ", ""));
}

/** Summary "Elixir of Eternal Focus × 2" → 2, or 0 when the line is hidden */
export function featuredCount(s: ShopState): number {
    if (s.summary.featuredHidden) return 0;
    const match = /× (\d+)$/.exec(s.summary.featuredName);
    return match ? parseInt(match[1]) : NaN;
}

export function close(a: number, b: number): boolean {
    return Math.abs(a - b) < 0.005;
}
