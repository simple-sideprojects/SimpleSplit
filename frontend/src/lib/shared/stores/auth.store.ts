import { persist, createLocalStorage } from "@macfja/svelte-persistent-store"
import { writable } from "svelte/store"
import { browser } from '$app/environment';
import { goto } from '$app/navigation';

function createAuthStore() {
	const { subscribe, update, set } = persist(writable<{authenticated: boolean, token: string | null}>({
        authenticated: false,
        token: null
    }), createLocalStorage(), "auth");

	let authData: {
        authenticated: boolean,
        token: string | null
    } = {
        authenticated: false,
        token: null
    };
	subscribe((value) => {
		authData = value;
	});

	return {
		subscribe,
		update,
		set,
		getAuthData: () => authData
	};
}

export const authStore = createAuthStore();

// Authentifizierungsfunktionen
export function clientSideLogin(token: string): void {
    if (!browser) return;
    authStore.update(() => ({
        authenticated: true,
        token: token
    }));
}

export function clientSideLogout(): void {
    if (!browser) return;
    authStore.update(() => ({
        authenticated: false,
        token: null
    }));
    goto('/auth/login');
}

// Auth-Check Funktion
export function checkAuth(): boolean {
    if (!browser) return false;
    const isAuth = !!token;
    authStore.update(() => ({
        authenticated: isAuth,
        token: isAuth ? token : null
    }));
    return isAuth;
} 