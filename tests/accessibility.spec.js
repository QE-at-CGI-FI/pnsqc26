// @ts-check
const { test, expect } = require('@playwright/test');

// Zooming in narrows the CSS viewport: 1280px at 400% zoom is 320px (WCAG 1.4.10 Reflow)
const ZOOM_WIDTHS = [1280, 1100, 900, 768, 640, 600, 500, 400, 320];

const FEATURED_TEXT = [
    '.featured-label',
    '.featured-name',
    '.featured-description',
    '.featured-price',
    '.featured-quantity',
    '.btn-featured',
    '.featured-limit'
];

function overlaps(a, b) {
    return a.x < b.x + b.width && b.x < a.x + a.width &&
        a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe('Accessibility', () => {
    test.beforeEach(async ({ page }) => {
        // Fonts are decoration; keep tests independent of the network
        await page.route(/fonts\.(googleapis|gstatic)\.com/, route => route.abort());
    });

    for (const width of ZOOM_WIDTHS) {
        test(`Potion of the Week text does not overlap its image at ${width}px wide`, async ({ page }) => {
            await page.setViewportSize({ width, height: 900 });
            await page.goto('/');

            const image = await page.locator('.featured-image').boundingBox();
            for (const selector of FEATURED_TEXT) {
                const text = await page.locator(selector).boundingBox();
                expect(overlaps(text, image), `${selector} overlaps the image`).toBe(false);
            }
        });
    }

    test.describe('base potion', () => {
        test.beforeEach(async ({ page }) => {
            await page.goto('/');
        });

        test('each potion is a radio button named after it', async ({ page }) => {
            for (const name of BASE_POTIONS) {
                await expect(page.getByRole('radio', { name })).toHaveCount(1);
            }
        });

        test('can be chosen with the keyboard', async ({ page }) => {
            const healing = page.getByRole('radio', { name: 'Healing Draught' });
            await healing.focus();

            await page.keyboard.press('Space');
            await expect(healing).toBeChecked();
            await expect(page.locator('#summary-potion .item-name')).toHaveText('Healing Draught');

            await page.keyboard.press('ArrowRight');
            await expect(page.getByRole('radio', { name: 'Elixir of Strength' })).toBeChecked();
            await expect(page.locator('#summary-potion .item-name')).toHaveText('Elixir of Strength');
        });

        test('the focused potion card is visibly marked', async ({ page }) => {
            // Keep the pointer away so hover styling doesn't count as focus styling
            await page.mouse.move(0, 0);
            const look = card => card.evaluate(el => {
                const style = getComputedStyle(el);
                return [style.outlineStyle, style.outlineColor, style.borderColor, style.boxShadow].join(' | ');
            });
            const healingCard = page.locator('.potion-card').filter({ hasText: 'Healing Draught' }).locator('.card-content');
            const unfocused = await look(healingCard);

            // Focus without selecting, as Tab does
            await page.getByRole('radio', { name: 'Healing Draught' }).focus();

            expect(await look(healingCard), 'card looks the same with and without focus').not.toBe(unfocused);
        });
    });
});

const BASE_POTIONS = ['Healing Draught', 'Elixir of Strength', 'Potion of Wisdom', 'Invisibility Brew'];
