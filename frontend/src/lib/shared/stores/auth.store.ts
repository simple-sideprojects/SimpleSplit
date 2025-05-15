import { persist, createLocalStorage } from "@macfja/svelte-persistent-store"
import { writable } from "svelte/store"
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

export type User = {
    username: string,
    email: string
};

type AuthStoreType = {
    authenticated: boolean,
    token: string | null,
    user: User|null
};

function createAuthStore() {
	const { subscribe, update, set } = persist(writable<AuthStoreType>({
        authenticated: false,
        token: null,
        user: null
    }), createLocalStorage(), "auth");

	let authData: AuthStoreType = {
        authenticated: false,
        token: null,
        user: null
    };
	subscribe((value) => {
		authData = value;
	});

	return {
		subscribe,
		update,
		set,
		getAuthData: () => authData,
        getUser: () => authData.user,
        setUser: (user: User|null) => update((state) => ({
            ...state,
            user: user
        }))
	};
}

export const authStore = createAuthStore();

// Authentifizierungsfunktionen
export function clientSideLogin(token: string): void {
    if (!browser) return;
    authStore.update(() => ({
        authenticated: true,
        token: token,
        user: null
    }));
}

export async function clientSideLogout(): Promise<void> {
    if (!browser) return;
    authStore.update(() => ({
        authenticated: false,
        token: null,
        user: null
    }));
    await goto('/auth/login');
}
