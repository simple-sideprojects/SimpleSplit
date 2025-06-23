import { isCompiledStatic } from '$lib/shared/app/controller';

export const prerender = isCompiledStatic();
export const trailingSlash = 'always';
