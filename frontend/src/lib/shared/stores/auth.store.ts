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

// Hilfsfunktion zum Abrufen von Cookies
export function getCookie(name: string): string | null {
    if (!browser) return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
}

// Authentifizierungsfunktionen
export function login(token: string): void {
    if (!browser) return;
    document.cookie = `auth_token=${token}; path=/; max-age=2592000`; // 30 Tage
    authStore.update(() => ({
        authenticated: true,
        token: token
    }));
}

export function logout(): void {
    if (!browser) return;
    document.cookie = 'auth_token=; path=/; max-age=0';
    authStore.update(() => ({
        authenticated: false,
        token: null
    }));
    goto('/auth/login');
}

// Auth-Check Funktion
export function checkAuth(): boolean {
    if (!browser) return false;
    const token = getCookie('auth_token');
    const isAuth = !!token;
    authStore.update(() => ({
        authenticated: isAuth,
        token: isAuth ? token : null
    }));
    return isAuth;
} 