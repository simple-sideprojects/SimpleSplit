import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapter = process.env.ADAPTER === 'static' ? adapterStatic : adapterNode;
const adapterConfig = process.env.ADAPTER === 'static'
		? {
			fallback: 'index.html',
			pages: 'build-static',
			assets: 'build-static'
	    }
		: {
			out: 'build-node'
	    };

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(adapterConfig),
		csrf: {
            checkOrigin: false, // Disable built-in CSRF origin check
        }
	}
};

export default config;
