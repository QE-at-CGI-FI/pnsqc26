// @ts-check
const { test, expect } = require('@playwright/test');

const SALE_PRICE = 34;
const ORIGINAL_PRICE = 40;
const BREWING_FEE = 3;
const OWL_POST = 5;
const FEATURED_LIMIT = 7;

/** Reads a "123.45 gold" amount as a number. */
async function gold(locator) {
    const text = await locator.textContent();
    return parseFloat(text);
}

test.describe('Potion of the Week', () => {
    test.beforeEach(async ({ page }) => {
        // Fonts are decoration; keep tests independent of the network
        await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
        await page.goto('/');
    });

    test('shows the featured potion with its name, description and image', async ({ page }) => {
        const featured = page.locator('.featured-potion');

        await expect(featured.locator('.featured-label')).toHaveText('✨ Potion of the Week');
        await expect(featured.getByRole('heading', { name: 'Elixir of Eternal Focus' })).toBeVisible();
        await expect(featured.locator('.featured-description')).toContainText('Enhances concentration');

        const image = featured.getByRole('img', { name: 'Elixir of Eternal Focus' });
        await expect(image).toBeVisible();
        expect(await image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    });

    test('shows original and sale price, and the discount badge matches them', async ({ page }) => {
        const featured = page.locator('.featured-potion');
        const original = await gold(featured.locator('.original-price'));
        const sale = await gold(featured.locator('.sale-price'));

        expect(original).toBe(ORIGINAL_PRICE);
        expect(sale).toBe(SALE_PRICE);

        const badge = await featured.locator('.discount-badge').textContent();
        const advertisedPercent = parseInt(badge);
        expect(Math.round((1 - sale / original) * 100)).toBe(advertisedPercent);
    });

    test('adding it to an empty order charges the sale price', async ({ page }) => {
        await page.getByRole('button', { name: 'Add to Order' }).click();

        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(SALE_PRICE);
        expect(await gold(page.locator('#summary-total .total-price'))).toBe(SALE_PRICE + BREWING_FEE + OWL_POST);
    });

    test('is added on top of a crafted potion', async ({ page }) => {
        await page.locator('label').filter({ hasText: 'Healing Draught' }).click();
        const before = await gold(page.locator('#summary-subtotal .item-price'));

        await page.getByRole('button', { name: 'Add to Order' }).click();

        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(before + SALE_PRICE);
    });

    test('price is not affected by size, potency or quantity of the crafted potion', async ({ page }) => {
        await page.locator('label').filter({ hasText: 'Healing Draught' }).click();
        await page.locator('label').filter({ hasText: 'Bottle' }).click();
        await page.locator('label').filter({ hasText: 'Maximum' }).click();
        await page.locator('#quantity').fill('3');
        const before = await gold(page.locator('#summary-subtotal .item-price'));

        await page.getByRole('button', { name: 'Add to Order' }).click();

        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(before + SALE_PRICE);
    });

    test('is not listed in the summary until it is added', async ({ page }) => {
        await expect(page.locator('#summary-featured')).toBeHidden();
    });

    test('adding several shows them as one summary line with count and price', async ({ page }) => {
        const button = page.locator('.btn-featured');
        const line = page.locator('#summary-featured');

        for (let count = 1; count <= 3; count++) {
            await button.click();
            await expect(line).toBeVisible();
            await expect(line.locator('.item-name')).toHaveText(`Elixir of Eternal Focus × ${count}`);
            expect(await gold(line.locator('.item-price'))).toBe(count * SALE_PRICE);
        }

        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(3 * SALE_PRICE);
        expect(await gold(page.locator('#summary-total .total-price'))).toBe(3 * SALE_PRICE + BREWING_FEE + OWL_POST);
    });

    test(`at most ${FEATURED_LIMIT} can be added to an order`, async ({ page }) => {
        const button = page.locator('.btn-featured');
        const line = page.locator('#summary-featured');

        await expect(page.locator('.featured-limit')).toHaveText(`Limit ${FEATURED_LIMIT} per order`);

        for (let count = 1; count <= FEATURED_LIMIT; count++) {
            await button.click();
        }

        await expect(button).toBeDisabled();
        await expect(button).toHaveText(`Limit reached (${FEATURED_LIMIT})`);

        // Even a forced click past the limit must not add another one
        await button.click({ force: true });
        await page.evaluate(() => addFeaturedToOrder());

        await expect(line.locator('.item-name')).toHaveText(`Elixir of Eternal Focus × ${FEATURED_LIMIT}`);
        expect(await gold(line.locator('.item-price'))).toBe(FEATURED_LIMIT * SALE_PRICE);
        expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(FEATURED_LIMIT * SALE_PRICE);
    });

    test.describe('quantity box', () => {
        test('starts at 0 with nothing in the summary', async ({ page }) => {
            await expect(page.locator('#featured-quantity')).toHaveValue('0');
            await expect(page.locator('#featured-decrease')).toBeDisabled();
            await expect(page.locator('#summary-featured')).toBeHidden();
        });

        test('+ and − change the quantity and the summary cost', async ({ page }) => {
            const increase = page.getByRole('button', { name: 'Add one Elixir of Eternal Focus' });
            const decrease = page.getByRole('button', { name: 'Remove one Elixir of Eternal Focus' });
            const line = page.locator('#summary-featured');

            await increase.click();
            await increase.click();
            await increase.click();
            await expect(page.locator('#featured-quantity')).toHaveValue('3');
            await expect(line.locator('.item-name')).toHaveText('Elixir of Eternal Focus × 3');
            expect(await gold(line.locator('.item-price'))).toBe(3 * SALE_PRICE);
            expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(3 * SALE_PRICE);

            await decrease.click();
            await expect(page.locator('#featured-quantity')).toHaveValue('2');
            expect(await gold(line.locator('.item-price'))).toBe(2 * SALE_PRICE);

            await decrease.click();
            await decrease.click();
            await expect(page.locator('#featured-quantity')).toHaveValue('0');
            await expect(decrease).toBeDisabled();
            await expect(line).toBeHidden();
            expect(await gold(page.locator('#summary-subtotal .item-price'))).toBe(0);
        });

        test(`+ stops at ${FEATURED_LIMIT}`, async ({ page }) => {
            const increase = page.getByRole('button', { name: 'Add one Elixir of Eternal Focus' });

            for (let i = 0; i < FEATURED_LIMIT; i++) {
                await increase.click();
            }

            await expect(page.locator('#featured-quantity')).toHaveValue(String(FEATURED_LIMIT));
            await expect(increase).toBeDisabled();
            await expect(page.locator('.btn-featured')).toBeDisabled();
            expect(await gold(page.locator('#summary-featured .item-price'))).toBe(FEATURED_LIMIT * SALE_PRICE);
        });

        test('typing a quantity updates the summary cost', async ({ page }) => {
            const input = page.locator('#featured-quantity');

            await input.fill('5');

            await expect(page.locator('#summary-featured .item-name')).toHaveText('Elixir of Eternal Focus × 5');
            expect(await gold(page.locator('#summary-featured .item-price'))).toBe(5 * SALE_PRICE);
            expect(await gold(page.locator('#summary-total .total-price'))).toBe(5 * SALE_PRICE + BREWING_FEE + OWL_POST);
        });

        test(`typing more than ${FEATURED_LIMIT} is capped at ${FEATURED_LIMIT}`, async ({ page }) => {
            const input = page.locator('#featured-quantity');

            await input.fill('50');

            await expect(input).toHaveValue(String(FEATURED_LIMIT));
            expect(await gold(page.locator('#summary-featured .item-price'))).toBe(FEATURED_LIMIT * SALE_PRICE);
        });

        test('rejects negative and non-whole numbers', async ({ page }) => {
            const input = page.locator('#featured-quantity');

            // Minus sign is blocked, so only the digit lands
            await input.click();
            await input.press('ControlOrMeta+a');
            await input.pressSequentially('-3');
            await input.blur();
            await expect(input).toHaveValue('3');

            // Decimal point is blocked too
            await input.click();
            await input.press('ControlOrMeta+a');
            await input.pressSequentially('.e');
            await input.blur();
            await expect(input).toHaveValue('0');
            await expect(page.locator('#summary-featured')).toBeHidden();
        });

        test('Add to Order increases the quantity box by one', async ({ page }) => {
            await page.getByRole('button', { name: 'Add to Order' }).click();
            await expect(page.locator('#featured-quantity')).toHaveValue('1');

            await page.locator('.btn-featured').click();
            await expect(page.locator('#featured-quantity')).toHaveValue('2');
            await expect(page.locator('#summary-featured .item-name')).toHaveText('Elixir of Eternal Focus × 2');
        });
    });

    test('button confirms each add and stays available below the limit', async ({ page }) => {
        const button = page.locator('.btn-featured');

        await button.click();
        await expect(button).toHaveText(`✓ Added! (1/${FEATURED_LIMIT})`);
        await expect(button).toBeEnabled();

        await expect(button).toHaveText('Add to Order', { timeout: 5000 });
    });
});
