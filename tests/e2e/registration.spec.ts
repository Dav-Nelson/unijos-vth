import { test, expect } from '@playwright/test'; test('registration flow', async ({ page }) => { await page.goto('/patients/new'); await expect(page).toHaveTitle(/Registration/); });
