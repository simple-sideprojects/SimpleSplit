import { dev } from '$app/environment';
import { installAuthInterceptor } from '$lib/shared/auth/interceptor';

installAuthInterceptor();

if (dev) {
	const { worker } = await import('./mocks/browser');

	await worker.start({
		onUnhandledRequest(request, print) {
			// Do not warn on unhandled internal Svelte requests.
			// Those are not meant to be mocked.
			if (request.url.includes('svelte')) {
				return;
			}

			print.warning();
		}
	});
}
