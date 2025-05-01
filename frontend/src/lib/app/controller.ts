import { authStore } from "$lib/shared/stores/auth.store";
import { redirect } from "@sveltejs/kit";
import { browser, building } from "$app/environment";
import { goto } from "$app/navigation";

export function isCompiledStatic() {
	return process.env.ADAPTER === 'static';
}

export function onPageLoad(requestData = true, protectedRoute = true){
    if (building){
        return;
    }
    console.log('onPageLoad', protectedRoute, authStore.getAuthData().authenticated);
    
    // Schutz für geschützte Routen
    if (protectedRoute && !authStore.getAuthData().authenticated){
        console.log('redirect...');
        goto('/auth/login');
        return;
    }
    
    // Weiterleitung von Auth-Seiten wenn bereits angemeldet
    if(!protectedRoute && authStore.getAuthData().authenticated){
        console.log('redirect...');
        goto('/');
        return;
    }
    
    if(requestData){
        //TODO request data action
    }
}