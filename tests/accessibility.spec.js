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
});
