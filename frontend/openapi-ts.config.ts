import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: '../backend/openapi.json',
	output: 'src/lib/client',
	plugins: [
		{
			name: '@hey-api/client-fetch',
			runtimeConfigPath: './src/lib/api-client-config.ts'
		},
		'@tanstack/svelte-query',
		'zod'
	]
});
