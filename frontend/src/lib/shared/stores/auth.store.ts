import { persist, createLocalStorage } from "@macfja/svelte-persistent-store"
import { writable } from "svelte/store"
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { PUBLIC_FRONTEND_URL } from "$env/static/public";

export type User = {
    username: string,
    email: string
};

type AuthStoreType = {
    authenticated: boolean,
    token: string | null,
    user: User|null,
    frontend_url: string
};

function createAuthStore() {
	const { subscribe, update, set } = persist(writable<AuthStoreType>({
        authenticated: false,
        token: null,
        user: null,
        frontend_url: PUBLIC_FRONTEND_URL
    }), createLocalStorage(), "auth");

	let authData: AuthStoreType = {
        authenticated: false,
        token: null,
        user: null,
        frontend_url: PUBLIC_FRONTEND_URL
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
    authStore.update((state) => ({
        authenticated: true,
        token: token,
        user: null,
        frontend_url: state.frontend_url
    }));
}

export async function clientSideLogout(): Promise<void> {
    if (!browser) return;
    authStore.update((state) => ({
        authenticated: false,
        token: null,
        user: null,
        frontend_url: state.frontend_url
    }));
    await goto('/auth/login');
}
