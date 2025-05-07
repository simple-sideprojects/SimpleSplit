import { authStore, clientSideLogout } from "$lib/shared/stores/auth.store";
import { redirect, type SubmitFunction } from "@sveltejs/kit";
import { browser, building } from "$app/environment";
import { goto } from "$app/navigation";
import { PUBLIC_ADAPTER, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { page } from '$app/state';
import { languageTag } from "$lib/paraglide/runtime";
import { deserialize } from '$app/forms';

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

        xhr.withCredentials = true;
        xhr.setRequestHeader('x-sveltekit-action', 'true');
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', 'application/json');
        
        const data: Record<string, string> = Object.fromEntries(
            input.formData.entries()
        ) as Record<string, string>;

        xhr.send(new URLSearchParams(data).toString());
    });
}

export async function onPageLoad(requestData = true, protectedRoute = true, data?: Record<string, any>): Promise<any>{
    if (building || !isCompiledStatic()){
        return null;
    }
    
    // Schutz für geschützte Routen
    if (protectedRoute && !authStore.getAuthData().authenticated){
        goto('/auth/login');
        return null;
    }
    
    // Weiterleitung von Auth-Seiten wenn bereits angemeldet
    if(!protectedRoute && authStore.getAuthData().authenticated){
        goto('/');
        return null;
    }
    
    //Request data normally in the +page.server.ts load function
    if(requestData){
        // Construct the action URL
        const actionUrl = `${PUBLIC_FRONTEND_URL}${page.url.pathname}?/data`;
        const formData = new URLSearchParams();

        //Add passed data to the form data
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }

        //Send the form data to the action URL
        const response = await fetch(actionUrl, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'content-type': 'application/x-www-form-urlencoded',
                'x-sveltekit-action': 'true'
            },
            credentials: 'include',
            body: formData.toString()
        });

        if(!response.ok){
            return null;
        }
        
        const responseData = await response.json();
        
        //Handle redirects
        if(responseData.type === 'redirect'){
            if(responseData.location === '/auth/login'){
                clientSideLogout();
            }
            goto(responseData.location);
            return null;
        }

        if(responseData.type !== 'success'){
            return null;
        }

        //Deserialize the response data
        return deserialize(responseData.data);
    }
    return null;
}
