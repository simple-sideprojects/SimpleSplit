import adapterStatic from '@sveltejs/adapter-static';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const adapter = process.env.ADAPTER === 'node' ? adapterNode : adapterStatic;
const adapterConfig = process.env.ADAPTER === 'node'
		? {
				out: 'build-node'
		  }
		: {
				fallback: 'index.html',
				pages: 'build-static',
				assets: 'build-static'
		  };

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(adapterConfig)/*true ? adapterStatic({
            // default options are shown. On some platforms
            // these options are set automatically — see below
            pages: 'build',
            assets: 'build',
            precompress: false,
            strict: true,
            handleHttpError: 'warn',
            fallback: 'index.html'
        }) : adapterNode()*/
	}
};

export default config;
