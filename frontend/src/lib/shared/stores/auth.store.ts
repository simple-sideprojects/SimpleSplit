import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { PUBLIC_FRONTEND_URL } from '$env/static/public';
import { authStorage } from '$lib/shared/auth/storage';
import { createPersistentStore } from '../app/persistentStore';
import { balancesStore } from './balances.store';
import { groupsStore } from './groups.store';
import { transactionsStore } from './transactions.store';

export type User = {
	username: string;
	email: string;
};

type AuthStoreType = {
	user: User | null;
	frontend_url: string;
};

function createAuthStore() {
	const initialValue: AuthStoreType = {
		user: null,
		frontend_url: PUBLIC_FRONTEND_URL
	};

	const store = createPersistentStore<AuthStoreType>('auth', initialValue);

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getAuthData: () => store.get(),
		getUser: () => store.get().user,
		setUser: (user: User | null) =>
			store.update((state) => ({
				...state,
				user: user
			}))
	};
}

export const authStore = createAuthStore();

export async function clientSideLogin(token: string, user: User): Promise<void> {
	if (!browser) return;
	await authStorage.setToken(token);
	authStore.update((state) => ({
		...state,
		user: user
	}));
}

export async function clientSideLogout(): Promise<void> {
	if (!browser) return;
	await authStorage.clearToken();
	authStore.update((state) => ({
		...state,
		user: null
	}));
	groupsStore.clear();
	transactionsStore.clear();
	balancesStore.clear();
	await goto('/auth/login');
}
