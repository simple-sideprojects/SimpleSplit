import { PUBLIC_ADAPTER } from '$env/static/public';

export function isCompiledStatic() {
	return PUBLIC_ADAPTER === 'static';
}
