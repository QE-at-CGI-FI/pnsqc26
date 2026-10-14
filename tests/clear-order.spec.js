// @ts-check
const { test, expect } = require('@playwright/test');

/** Reads a "123.45 gold" amount as a number. */
async function gold(locator) {
    const text = await locator.textContent();
    return parseFloat(text);
}

test.describe('Clear order', () => {
    test.beforeEach(async ({ page }) => {
        // Fonts are decoration; keep tests independent of the network
        await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
        await page.goto('/');
    });

    test('is disabled until the order is changed', async ({ page }) => {
        const clearButton = page.getByRole('button', { name: 'Clear Order' });
        await expect(clearButton).toBeDisabled();

        await page.locator('label').filter({ hasText: 'Healing Draught' }).click();

        await expect(clearButton).toBeEnabled();
    });

    test('is enabled by adding the Potion of the Week', async ({ page }) => {
        await page.getByRole('button', { name: 'Add to Order' }).click();

        await expect(page.getByRole('button', { name: 'Clear Order' })).toBeEnabled();
    });

    test('leaves no potion selected and becomes disabled again', async ({ page }) => {
        const clearButton = page.getByRole('button', { name: 'Clear Order' });
        await page.locator('label').filter({ hasText: 'Healing Draught' }).click();

        await clearButton.click();

        await expect(page.locator('input[name="base-potion"]:checked')).toHaveCount(0);
        await expect(page.locator('#summary-potion .item-name')).toHaveText('No potion selected');
        await expect(clearButton).toBeDisabled();
    });

    test('resets every choice and the summary to the page defaults', async ({ page }) => {
        const summary = page.locator('.order-summary');
        const defaultSummary = await summary.innerText();

        // Change everything that affects the price
        await page.locator('label').filter({ hasText: 'Invisibility Brew' }).click();
        await page.locator('label').filter({ hasText: 'Bottle' }).click();
        await page.locator('label').filter({ hasText: 'Maximum' }).click();
        await page.locator('label').filter({ hasText: 'Dragon Scale' }).click();
        await page.locator('label').filter({ hasText: 'Phoenix Feather' }).click();
        await page.locator('#quantity').fill('5');
        await page.locator('label').filter({ hasText: 'Dragon Express' }).click();
        await page.locator('#featured-quantity').fill('2');
        await page.getByRole('button', { name: 'Add to Order' }).click();
        await expect(summary).not.toHaveText(defaultSummary);

        await page.getByRole('button', { name: 'Clear Order' }).click();

        await expect(page.locator('input[name="base-potion"]:checked')).toHaveCount(0);
        await expect(page.locator('input[name="size"][value="vial"]')).toBeChecked();
        await expect(page.locator('input[name="potency"][value="standard"]')).toBeChecked();
        await expect(page.locator('input[name="ingredient"]:checked')).toHaveCount(0);
        await expect(page.locator('#quantity')).toHaveValue('1');
        await expect(page.locator('input[name="delivery"][value="owl"]')).toBeChecked();
        await expect(page.locator('#summary-featured')).toBeHidden();

        expect(await summary.innerText()).toBe(defaultSummary);
        expect(await gold(page.locator('#summary-total .total-price'))).toBe(8);
    });

    test('lets the Potion of the Week be added again after reaching the limit', async ({ page }) => {
        const featuredButton = page.locator('.btn-featured');
        await page.locator('#featured-quantity').fill('7');
        await featuredButton.click();
        await expect(featuredButton).toBeDisabled();

        await page.getByRole('button', { name: 'Clear Order' }).click();

        await expect(page.locator('#featured-quantity')).toHaveValue('1');
        await expect(featuredButton).toBeEnabled();
        await expect(featuredButton).toHaveText('Add to Order');
        await featuredButton.click();
        await expect(page.locator('#summary-featured .item-name')).toHaveText('Elixir of Eternal Focus × 1');
    });

    test('keeps the delivery address the customer has typed', async ({ page }) => {
        await page.locator('#customer-name').fill('Maaret Pyhäjärvi');
        await page.locator('#kingdom').fill('The Northern Reaches');
        await page.locator('label').filter({ hasText: 'Healing Draught' }).click();

        await page.getByRole('button', { name: 'Clear Order' }).click();

        await expect(page.locator('#customer-name')).toHaveValue('Maaret Pyhäjärvi');
        await expect(page.locator('#kingdom')).toHaveValue('The Northern Reaches');
    });
});
