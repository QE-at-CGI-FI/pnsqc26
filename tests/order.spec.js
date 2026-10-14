// @ts-check
const { test, expect } = require('@playwright/test');

async function fillDeliveryDetails(page) {
    await page.locator('#customer-name').fill('Gandalf the Grey');
    await page.locator('#castle-name').fill('Orthanc');
    await page.locator('#kingdom').fill('Isengard');
}

test.describe('Placing an order', () => {
    test.beforeEach(async ({ page }) => {
        // Fonts are decoration; keep tests independent of the network
        await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
        await page.goto('/');
    });

    test('is confirmed when the order has a potion', async ({ page }) => {
        await page.locator('.potion-card').filter({ hasText: 'Healing Draught' }).click();
        await fillDeliveryDetails(page);

        await page.locator('.btn-brew').click();

        await expect(page.locator('#confirmation-modal')).toHaveClass(/active/);
    });

    test('is not confirmed when the order has no potion', async ({ page }) => {
        await fillDeliveryDetails(page);

        await page.locator('.btn-brew').click();

        await expect(page.locator('#confirmation-modal')).not.toHaveClass(/active/);
    });
});
