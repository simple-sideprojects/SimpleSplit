// Source: https://gist.github.com/Maxiviper117/95a31750b74510bbb413d2e4ae20b4e8
import type { Handle } from '@sveltejs/kit';
import { json, text } from '@sveltejs/kit';

/**
 * CSRF protection middleware for SvelteKit.
 *
 * @param allowedPaths - Paths that bypass CSRF protection.
 * @param allowedOrigins - Trusted origins that can submit cross-origin forms.
 * @returns SvelteKit handle function.
 */
export function csrf(allowedPaths: string[], allowedOrigins: string[] = []): Handle {
	return async ({ event, resolve }) => {
		const { request, url } = event;
		const requestOrigin = request.headers.get('origin');
		const isSameOrigin = requestOrigin === url.origin;
		const isAllowedOrigin = allowedOrigins.includes(requestOrigin ?? '');

		// Block form submissions that don't match CSRF rules
		const forbidden =
			isFormContentType(request) &&
			['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) &&
			!isSameOrigin && // Not from same origin
			!isAllowedOrigin && // Not in allowed origins
			!allowedPaths.includes(url.pathname); // Path is not explicitly allowed

		if (forbidden) {
			const message = `Cross-site ${request.method} form submissions are forbidden for origin ${requestOrigin}`;
			if (request.headers.get('accept') === 'application/json') {
				return json({ message }, { status: 403 });
			}
			return text(message, { status: 403 });
		}

		return resolve(event);
	};
}

/**
 * Check if request content type matches given types.
 */
function isContentType(request: Request, ...types: string[]) {
	const type = request.headers.get('content-type')?.split(';', 1)[0].trim() ?? '';
	return types.includes(type.toLowerCase());
}

/**
 * Determines if a request is a form submission.
 */
function isFormContentType(request: Request) {
	return isContentType(
		request,
		'application/x-www-form-urlencoded',
		'multipart/form-data',
		'text/plain'
	);
}
