import { test, expect } from '@playwright/test';

test.describe('Chess Clock', () => {
  test('clock appears when time control is selected', async ({ page }) => {
    await page.goto('/play/ai');
    await page.waitForSelector('nav');
    // Select blitz time control
    await page.getByRole('button', { name: '5+3' }).click();
    // Wait for Stockfish
    await page.waitForFunction(() => {
      const buttons = [...document.querySelectorAll('button')];
      return buttons.some(b => b.textContent.includes('Start Game'));
    }, { timeout: 15000 });
    // Start game
    await page.getByText('Start Game').click();
    await page.waitForSelector('.board-square', { timeout: 5000 });
    // Clock should appear with "White" and "Black" labels
    await expect(page.getByText('White').first()).toBeVisible();
    await expect(page.getByText('Black').first()).toBeVisible();
    // Should show initial time 5:00
    await expect(page.locator('text=5:00').first()).toBeVisible();
  });

  test('clock ticks down during game', async ({ page }) => {
    await page.goto('/play/ai');
    await page.waitForSelector('nav');
    // Select bullet 1+0
    await page.getByRole('button', { name: '1+0' }).click();
    await page.waitForFunction(() => {
      const buttons = [...document.querySelectorAll('button')];
      return buttons.some(b => b.textContent.includes('Start Game'));
    }, { timeout: 15000 });
    await page.getByText('Start Game').click();
    await page.waitForSelector('.board-square', { timeout: 5000 });
    // Initial time should be 1:00
    await expect(page.locator('text=1:00').first()).toBeVisible();
    // Wait 1.5 seconds for clock to tick
    await page.waitForTimeout(1500);
    // Time should have decreased (no longer 1:00)
    const clocks = await page.locator('[role="timer"]').allTextContents();
    const whiteClockText = clocks.find(t => t.includes('White'));
    // White's clock should be ticking (it starts on white's turn)
    // The time should be less than 1:00 now
    expect(whiteClockText).not.toContain('1:00');
  });

  test('no clock when "No Clock" is selected', async ({ page }) => {
    await page.goto('/play/ai');
    await page.waitForSelector('nav');
    // No Clock is default
    await page.waitForFunction(() => {
      const buttons = [...document.querySelectorAll('button')];
      return buttons.some(b => b.textContent.includes('Start Game'));
    }, { timeout: 15000 });
    await page.getByText('Start Game').click();
    await page.waitForSelector('.board-square', { timeout: 5000 });
    // Should NOT have clock timers
    const timers = await page.locator('[role="timer"]').count();
    expect(timers).toBe(0);
  });
});
