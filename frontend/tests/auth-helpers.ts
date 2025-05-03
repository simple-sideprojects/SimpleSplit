import type { Page } from '@playwright/test';

/**
 * Helper functions for authentication testing
 */
export const authHelpers = {
	/**
	 * Register a new test user
	 * @param page Playwright page
	 * @param email User's email
	 * @param password User's password
	 * @param username Optional username
	 */
	async registerUser(
		page: Page,
		email: string = `test${Date.now()}@example.com`,
		password: string = 'Password123!',
		username: string = 'testuser'
	) {
		// Setup mock for successful registration
		await page.route('**/api/auth/register', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					user: {
						id: '123',
						email,
						username
					}
				})
			});
		});

		// Navigate to register page
		await page.goto('/auth/register');

		// Fill form
		await page.getByLabel('Username').fill(username);
		await page.getByLabel('Email Address').fill(email);
		await page.getByLabel('Password').fill(password);

		// Submit form
		await page.getByRole('button', { name: 'Register' }).click();

		// Wait for submission to complete
		await page.getByRole('button', { name: 'Register' }).waitFor({ state: 'visible' });

		return { email, password, username };
	},

	/**
	 * Login a user
	 * @param page Playwright page
	 * @param email User's email
	 * @param password User's password
	 */
	async loginUser(
		page: Page,
		email: string = 'user@example.com',
		password: string = 'Password123!'
	) {
		// Setup mock for successful login
		await page.route('**/api/auth/login', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					user: {
						id: '123',
						email,
						username: 'testuser'
					}
				})
			});
		});

		// Navigate to login page
		await page.goto('/auth/login');

		// Fill form
		await page.getByLabel('Email Address').fill(email);
		await page.getByLabel('Password').fill(password);

		// Submit form
		await page.getByRole('button', { name: 'Sign in' }).click();

		// Wait for submission to complete
		await page.getByRole('button', { name: 'Sign in' }).waitFor({ state: 'visible' });
	},

	/**
	 * Setup API mocks for authentication
	 * @param page Playwright page
	 */
	async setupAuthMocks(page: Page) {
		// Mock successful registration
		await page.route('**/api/auth/register', async (route) => {
			const requestBody = JSON.parse((await route.request().postData()) || '{}');

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					user: {
						id: '123',
						email: requestBody.email,
						username: requestBody.username || 'defaultuser'
					}
				})
			});
		});

		// Mock successful login
		await page.route('**/api/auth/login', async (route) => {
			const requestBody = JSON.parse((await route.request().postData()) || '{}');

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					success: true,
					user: {
						id: '123',
						email: requestBody.email,
						username: 'testuser'
					}
				})
			});
		});

		// Mock authentication check endpoint
		await page.route('**/api/auth/me', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({
					authenticated: true,
					user: {
						id: '123',
						email: 'user@example.com',
						username: 'testuser'
					}
				})
			});
		});
	},

	/**
	 * Setup auth state in browser
	 * @param page Playwright page
	 */
	async setupAuthState(page: Page) {
		// This would depend on how your application manages auth state
		// For example, setting auth token in localStorage
		await page.evaluate(() => {
			localStorage.setItem('authToken', 'mock-auth-token');
		});
	}
};
