import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const store = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
	Preferences: {
		get: vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null })),
		set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
			store.set(key, value);
		}),
		remove: vi.fn(async ({ key }: { key: string }) => {
			store.delete(key);
		})
	}
}));

describe('authStorage', () => {
	beforeEach(() => {
		store.clear();
	});

	it('returns null when no token is set', async () => {
		const { authStorage } = await import('./storage');
		expect(await authStorage.getToken()).toBeNull();
	});

	it('round-trips a token via setToken/getToken', async () => {
		const { authStorage } = await import('./storage');
		await authStorage.setToken('abc.def.ghi');
		expect(await authStorage.getToken()).toBe('abc.def.ghi');
	});

	it('clearToken removes the value', async () => {
		const { authStorage } = await import('./storage');
		await authStorage.setToken('abc.def.ghi');
		await authStorage.clearToken();
		expect(await authStorage.getToken()).toBeNull();
	});
});
