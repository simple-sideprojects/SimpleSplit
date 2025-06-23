import { authStore, clientSideLogout } from '$lib/shared/stores/auth.store';
import { type ActionResult, type SubmitFunction } from '@sveltejs/kit';
import { building } from '$app/environment';
import { goto } from '$app/navigation';
import { PUBLIC_ADAPTER } from '$env/static/public';
import { page } from '$app/state';
import { deserialize } from '$app/forms';
import { Network } from '@capacitor/network';

export function isCompiledStatic() {
	return PUBLIC_ADAPTER === 'static';
}

export function createCustomRequestForFormAction(input: Parameters<SubmitFunction>[0]) {
	return new Promise<Response | XMLHttpRequest>((resolve) => {
		const action = input.action.searchParams.keys().next().value as string;
		const data: Record<string, string> = Object.fromEntries(input.formData.entries()) as Record<
			string,
			string
		>;

		console.log(action, data);
		triggerActionRaw(action, data, input.action.pathname).then((response) => {
			resolve(response);
		});

		/*const xhr = new XMLHttpRequest();

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

        xhr.send(new URLSearchParams(data).toString());*/
	});
}

function beforeDataLoad(protectedRoute = true) {
	if (building || !isCompiledStatic()) {
		return null;
	}

	// Schutz für geschützte Routen
	if (protectedRoute && !authStore.getAuthData().authenticated) {
		goto('/auth/login');
		return null;
	}

	// Weiterleitung von Auth-Seiten wenn bereits angemeldet
	if (!protectedRoute && authStore.getAuthData().authenticated) {
		goto('/');
		return null;
	}
}

function triggerActionRaw(
	action: string,
	data?: Record<string, any>,
	pathname?: string
): Promise<Response> {
	return new Promise<Response>((resolve) => {
		let pathname_ = pathname ?? page.url.pathname;
		//Add a trailing slash to the pathname if it doesn't have one
		if (!pathname_.endsWith('/')) {
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
		if (!formData.has('groupId') && pathname_.includes('/groups/dashboard')) {
			const groupId = page.url.searchParams.get('groupId');
			if (groupId) {
				formData.append('groupId', groupId);
			}
		}

		//Check if the device is offline
		Network.getStatus()
			.then((status) => {
				if (!status.connected) {
					resolve(
						new Response(
							JSON.stringify({
								type: 'error',
								error: 'No internet connection'
							} as ActionResult),
							{
								status: 500
							}
						)
					);
					return;
				}

				const request = fetch(actionUrl, {
					method: 'POST',
					headers: {
						accept: 'application/json',
						'content-type': 'application/x-www-form-urlencoded',
						'x-sveltekit-action': 'true'
					},
					credentials: 'include',
					body: formData.toString()
				});

				//Send the form data to the action URL
				resolve(request);
			})
			.catch(() => {
				resolve(
					new Response(
						JSON.stringify({
							type: 'error',
							error: 'Failed to determine network status'
						} as ActionResult),
						{
							status: 500
						}
					)
				);
			});
	});
}

export async function triggerAction(
	action: string,
	data?: Record<string, any>,
	pathname?: string
): Promise<ActionResult<any, any>> {
	const response = await triggerActionRaw(action, data, pathname);

	if (!response.ok) {
		return {
			type: 'error',
			error: 'Failed to trigger action'
		} as ActionResult;
	}

	const responseText = await response.text();
	const responseData = deserialize(responseText);

	//Handle redirects
	if (responseData.type === 'redirect') {
		if (responseData.location === '/auth/login') {
			await clientSideLogout();
		}
		await goto(responseData.location);
		return responseData;
	}

	//Deserialize the response data
	return responseData;
}

export async function onLayoutLoad(
	pathname: string,
	protectedRoute = true,
	data?: Record<string, any>
): Promise<ActionResult<any, any>> {
	beforeDataLoad(protectedRoute);

	//Request data normally in the +page.server.ts load function
	return await triggerAction('data_layout', data, pathname);
}

export async function onPageLoad(
	protectedRoute = true,
	data?: Record<string, any>
): Promise<ActionResult<any, any>> {
	beforeDataLoad(protectedRoute);

	//Request data normally in the +page.server.ts load function
	return await triggerAction('data', data);
}
