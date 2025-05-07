import { authStore } from "$lib/shared/stores/auth.store";
import { redirect } from "@sveltejs/kit";
import { browser, building } from "$app/environment";
import { goto } from "$app/navigation";
import { PUBLIC_ADAPTER, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { page } from '$app/state';

export function isCompiledStatic() {
	return PUBLIC_ADAPTER === 'static';
}

export function createCustomRequestForFormAction(input: Parameters<SubmitFunction>[0]){
    return new Promise<XMLHttpRequest>((resolve) => {
        const xhr = new XMLHttpRequest();

        xhr.onload = () => {
            if (xhr.readyState === xhr.DONE) {
                resolve(xhr);
            }
        };

        const url = new URL(PUBLIC_FRONTEND_URL + input.action.pathname + input.action.search);

        xhr.open('POST', url, true);

        xhr.setRequestHeader('x-sveltekit-action', 'true');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', 'application/json');
        
        xhr.send(new URLSearchParams(input.formData).toString());
    });
}

export async function onPageLoad(requestData = true, protectedRoute = true, data?: Record<string, any>){
    if (building || !isCompiledStatic()){
        return;
    }
    
    // Schutz für geschützte Routen
    if (protectedRoute && !authStore.getAuthData().authenticated){
        goto('/auth/login');
        return;
    }
    
    // Weiterleitung von Auth-Seiten wenn bereits angemeldet
    if(!protectedRoute && authStore.getAuthData().authenticated){
        goto('/');
        return;
    }
    
    if(requestData){
        const actionUrl = `${PUBLIC_FRONTEND_URL}${page.url.pathname}?/data`;
        const formData = new URLSearchParams();
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }
        const response = await fetch(actionUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
                'x-sveltekit-action': 'true'
            },
            body: formData.toString()
        });
        return response.json();
    }
    return null;
}