// Source: https://gist.github.com/Maxiviper117/95a31750b74510bbb413d2e4ae20b4e8
import { isRedirect, type Handle } from '@sveltejs/kit';

/**
 * CSRF protection middleware for SvelteKit.
 *
 * @param allowedPaths - Paths that bypass CSRF protection.
 * @param allowedOrigins - Trusted origins that can submit cross-origin forms.
 * @returns SvelteKit handle function.
 */
export function cors(allowedOrigins: string[] = []): Handle {
    return async ({ event, resolve }) => {
        const { request, url } = event;
        const requestOrigin = request.headers.get('origin');
        if(requestOrigin === null) {
            return resolve(event);
        }

        const isSameOrigin = requestOrigin === url.origin;
        const isAllowedOrigin = allowedOrigins.includes(requestOrigin);
        
        if (isSameOrigin || isAllowedOrigin) {
            if(request.method === 'OPTIONS'){
                return new Response(null, {
                    headers: {
                        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
                        'Access-Control-Allow-Origin': requestOrigin,
                        'Access-Control-Allow-Credentials': 'true',
                        'Access-Control-Allow-Headers': 'x-sveltekit-action'
                    }
                });
            }
            return Promise.resolve(resolve(event)).then((response) => {
                response.headers.set('Access-Control-Allow-Origin', requestOrigin);
                response.headers.set('Access-Control-Allow-Credentials', 'true');
                return response;
            }).catch((error) => {
                if(!isRedirect(error))
                    throw error;
                return new Response(JSON.stringify({
                    type: "redirect",
                    status: error.status,
                    location: error.location
                }), {
                    status: 200,
                    headers: {
                        'Access-Control-Allow-Origin': requestOrigin,
                        'Access-Control-Allow-Credentials': 'true',
                        'Content-Type': 'application/json',
                    }
                });
            });
        }

        return resolve(event);
    };
}