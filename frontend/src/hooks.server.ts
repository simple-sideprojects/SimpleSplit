import { dev } from '$app/environment';
import { i18n } from '$lib/i18n';
import type { Handle } from '@sveltejs/kit';
const handleParaglide: Handle = i18n.handle();
export const handle: Handle = handleParaglide;

if (dev) {
	const { server } = await import('./mocks/server');

	server.listen();
}
