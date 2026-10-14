// @ts-check
const { test, expect } = require('@playwright/test');

const BREWING_FEE = 3;
const OWL_POST = 5;

const BASE_POTIONS = [
    'Healing Draught',
    'Elixir of Strength',
    'Potion of Wisdom',
    'Invisibility Brew'
];

const BASE_PRICES = {
    'Healing Draught': 25,
    'Elixir of Strength': 30,
    'Potion of Wisdom': 35,
    'Invisibility Brew': 45
};
const SIZE_MULTIPLIERS = { Vial: 1, Flask: 1.5, Bottle: 2 };
const POTENCY_MULTIPLIERS = { Standard: 1, Enhanced: 1.25, Maximum: 1.75 };

/** Reads a "123.45 gold" amount as a number. */
async function gold(locator) {
    const text = await locator.textContent();
    return parseFloat(text);
}

test.describe('Base potion', () => {
    test.beforeEach(async ({ page }) => {
        // Fonts are decoration; keep tests independent of the network
        await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
        await page.goto('/');
    });

    test('lists exactly the base potions these tests cover', async ({ page }) => {
        await expect(page.locator('.potion-card .potion-name')).toHaveText(BASE_POTIONS);
    });

    for (const name of BASE_POTIONS) {
        test(`clicking ${name} adds the price shown on its card to the cart`, async ({ page }) => {
            const card = page.locator('.potion-card').filter({ hasText: name });
            const shownPrice = await gold(card.locator('.potion-price'));

            await card.click();

            // Default size (Vial 1x), potency (Standard), quantity (1) and delivery (Owl Post)
            const potionLine = page.locator('#summary-potion');
            await expect(potionLine.locator('.item-name')).toHaveText(name);
            expect(await gold(potionLine.locator('.item-price'))).toBe(shownPrice);
            expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(shownPrice);
            expect(await gold(page.locator('#summary-total .total-price'))).toBe(shownPrice + BREWING_FEE + OWL_POST);
        });
    }

    test.describe('price with size and potency', () => {
        for (const [potion, price] of Object.entries(BASE_PRICES)) {
            for (const [size, sizeMultiplier] of Object.entries(SIZE_MULTIPLIERS)) {
                for (const [potency, potencyMultiplier] of Object.entries(POTENCY_MULTIPLIERS)) {
                    test(`${potion}, ${size}, ${potency}`, async ({ page }) => {
                        await choose(page, potion);
                        await page.locator('.size-option').filter({ hasText: size }).click();
                        await page.locator('.potency-option').filter({ hasText: potency }).click();

                        const expected = price * sizeMultiplier * potencyMultiplier;
                        await expect(page.locator('#summary-subtotal .item-price')).toHaveText(goldText(expected));
                        await expect(page.locator('#summary-total .total-price')).toHaveText(goldText(expected + BREWING_FEE + OWL_POST));
                    });
                }
            }
        }
    });

    test('quantity multiplies the potion price', async ({ page }) => {
        await choose(page, 'Invisibility Brew');
        await page.locator('#quantity').fill('3');

        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(3 * 45);
    });

    test('fractional prices are rounded to the nearest copper', async ({ page }) => {
        // 25 × 1.5 × 1.25 = 46.875
        await choose(page, 'Healing Draught');
        await page.locator('.size-option').filter({ hasText: 'Flask' }).click();
        await page.locator('.potency-option').filter({ hasText: 'Enhanced' }).click();

        await expect(page.locator('#summary-subtotal .item-price')).toHaveText('46.88 gold');
        await expect(page.locator('#summary-total .total-price')).toHaveText('54.88 gold');
    });

    test('nothing is selected when the page loads', async ({ page }) => {
        await expect(page.locator('input[name="base-potion"]:checked')).toHaveCount(0);
        await expect(page.locator('#summary-potion .item-name')).toHaveText('No potion selected');
        await expect(page.locator('#summary-potion .item-price')).toHaveText('-');
        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(0);
    });

    test('choosing another potion replaces the first one', async ({ page }) => {
        await choose(page, 'Healing Draught');
        await choose(page, 'Potion of Wisdom');

        await expect(page.locator('#summary-potion .item-name')).toHaveText('Potion of Wisdom');
        expect(await gold(page.locator('#summary-potion .item-price'))).toBe(35);
        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(35);
    });

    test('only one potion is selected and highlighted at a time', async ({ page }) => {
        const cards = page.locator('.potion-card');

        for (const name of BASE_POTIONS) {
            await choose(page, name);

            await expect(page.locator('input[name="base-potion"]:checked')).toHaveCount(1);
            for (const other of BASE_POTIONS) {
                const card = cards.filter({ hasText: other }).locator('.card-content');
                const highlighted = await card.evaluate(el => getComputedStyle(el).backgroundImage !== 'none');
                expect(highlighted, `${other} highlighted while ${name} is selected`).toBe(other === name);
            }
        }
    });

    test('switching potion keeps the other choices', async ({ page }) => {
        await choose(page, 'Healing Draught');
        await page.locator('.size-option').filter({ hasText: 'Bottle' }).click();
        await page.locator('.potency-option').filter({ hasText: 'Maximum' }).click();
        await page.locator('.ingredient-option').filter({ hasText: 'Moonstone' }).click();
        await page.locator('#quantity').fill('2');

        await choose(page, 'Elixir of Strength');

        await expect(page.locator('input[name="size"][value="bottle"]')).toBeChecked();
        await expect(page.locator('input[name="potency"][value="maximum"]')).toBeChecked();
        await expect(page.locator('input[name="ingredient"][value="moonstone"]')).toBeChecked();
        await expect(page.locator('#quantity')).toHaveValue('2');
        // 30 × 2 × 1.75 × 2 + 8
        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(218);
    });

    test('every potion card has the same shape', async ({ page }) => {
        const radii = await page.locator('.potion-card .card-content')
            .evaluateAll(cards => cards.map(card => getComputedStyle(card).borderRadius));

        expect(new Set(radii).size, `card corner radii: ${radii.join(', ')}`).toBe(1);
    });

    test.describe('after navigation the summary matches the selected card', () => {
        test('reload', async ({ page }) => {
            await choose(page, 'Potion of Wisdom');

            await page.reload();

            await expectSummaryMatchesCheckedCard(page);
        });

        test('back from another page', async ({ page }) => {
            await choose(page, 'Potion of Wisdom');

            await page.goto('about:blank');
            await page.goBack();

            await expectSummaryMatchesCheckedCard(page);
        });
    });
});

async function choose(page, potion) {
    await page.locator('.potion-card').filter({ hasText: potion }).click();
}

/** 46.875 → "46.88 gold" */
function goldText(amount) {
    return (Math.round(amount * 100) / 100).toFixed(2) + ' gold';
}

async function expectSummaryMatchesCheckedCard(page) {
    const checked = page.locator('.potion-card:has(input:checked) .potion-name');
    const expected = await checked.count() ? await checked.textContent() : 'No potion selected';
    await expect(page.locator('#summary-potion .item-name')).toHaveText(expected);
}
