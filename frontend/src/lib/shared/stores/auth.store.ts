import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { PUBLIC_FRONTEND_URL } from "$env/static/public";
import { createPersistentStore } from '../app/persistentStore';

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
    const initialValue: AuthStoreType = {
        authenticated: false,
        token: null,
        user: null,
        frontend_url: PUBLIC_FRONTEND_URL
    };
    
    const store = createPersistentStore<AuthStoreType>("auth", initialValue);
    
    return {
        subscribe: store.subscribe,
        set: store.set,
        update: store.update,
        getAuthData: () => store.get(),
        getUser: () => store.get().user,
        setUser: (user: User|null) => store.update((state) => ({
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
