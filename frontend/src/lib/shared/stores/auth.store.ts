import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { authStorage } from '$lib/shared/auth/storage';
import { QueryClient } from '@tanstack/svelte-query';
import { writable, type Writable } from 'svelte/store';

export type User = {
	username: string;
	email: string;
};

type AuthStoreType = {
	user: User | null;
};

function createAuthStore(): Writable<AuthStoreType> & {
	getUser: () => User | null;
	setUser: (u: User | null) => void;
} {
	const store = writable<AuthStoreType>({ user: null });
	let current: AuthStoreType = { user: null };
	store.subscribe((v) => (current = v));

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getUser: () => current.user,
		setUser: (user) => store.update((s) => ({ ...s, user }))
	};
}

export const authStore = createAuthStore();

/**
 * Called after a successful login. Persists the token to `authStorage` so
 * subsequent SDK calls carry the Bearer header.
 */
export async function clientSideLogin(token: string, user: User): Promise<void> {
	if (!browser) return;
	await authStorage.setToken(token);
	authStore.setUser(user);
}

/**
 * Clears the token on both transports (cookie via /api/auth/logout, browser
 * via authStorage), resets client-side caches, and navigates to login.
 */
export async function clientSideLogout(queryClient?: QueryClient): Promise<void> {
	if (!browser) return;
	await fetch('/api/auth/logout/', { method: 'POST' }).catch(() => null);
	await authStorage.clearToken();
	authStore.setUser(null);
	queryClient?.clear();
	await goto('/auth/login');
}
