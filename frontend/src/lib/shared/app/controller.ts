import { authStore, clientSideLogout } from "$lib/shared/stores/auth.store";
import { type SubmitFunction } from "@sveltejs/kit";
import { building } from "$app/environment";
import { goto } from "$app/navigation";
import { PUBLIC_ADAPTER, PUBLIC_FRONTEND_URL } from '$env/static/public';
import { page } from '$app/state';
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
        
        let pathname = input.action.pathname;
        //Add a trailing slash to the pathname if it doesn't have one
        if (!pathname.endsWith('/')){
            pathname += '/';
        }

        const url = new URL(authStore.getAuthData().frontend_url + pathname + input.action.search);

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

function beforeDataLoad(protectedRoute = true){
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
}

export async function triggerAction(action: string, data?: Record<string, any>, pathname?: string){
    let pathname_ = pathname ?? page.url.pathname;
    //Add a trailing slash to the pathname if it doesn't have one
    if (!pathname_.endsWith('/')){
        pathname_ += '/';
    }

    const actionUrl = `${authStore.getAuthData().frontend_url}${pathname_}?/${action}`;

    const formData = new URLSearchParams();

    //Add passed data to the form data
    if (data) {
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value);
        });
    }

    //Add the groupId to the data if it is a group dashboard page
    console.log(formData.has('groupId'), pathname_.includes('/groups/dashboard'));
    if(!formData.has('groupId') && pathname_.includes('/groups/dashboard')){
        const groupId = page.url.searchParams.get('groupId');
        if(groupId){
            formData.append('groupId', groupId);
        }
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
    
    const responseText = await response.text();
    const responseData = deserialize(responseText);
    
    //Handle redirects
    if(responseData.type === 'redirect'){
        if(responseData.location === '/auth/login'){
            await clientSideLogout();
        }
        await goto(responseData.location);
        return null;
    }

    if(responseData.type !== 'success'){
        return null;
    }

    //Deserialize the response data
    return responseData.data;
}

export async function onLayoutLoad(pathname: string, requestData = true, protectedRoute = true, data?: Record<string, any>): Promise<any>{
    beforeDataLoad(protectedRoute);

    //Request data normally in the +page.server.ts load function
    if(requestData){
        // Construct the action URL
        return await triggerAction('data_layout', data, pathname);
    }
    return null;
}

export async function onPageLoad(requestData = true, protectedRoute = true, data?: Record<string, any>): Promise<any>{
    beforeDataLoad(protectedRoute);

    //Request data normally in the +page.server.ts load function
    if(requestData){
        // Construct the action URL
        return await triggerAction('data', data);
    }
    return null;
}
