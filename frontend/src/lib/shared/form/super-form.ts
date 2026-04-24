import { superForm as realSuperForm } from 'sveltekit-superforms/client';
import type { FormOptions, SuperValidated } from 'sveltekit-superforms';

type Schema = Record<string, unknown>;

/**
 * SuperForms wrapper: defaults to SPA mode so forms don't round-trip through
 * `?/action` endpoints that no longer exist. Callers provide `onUpdate` or
 * `onUpdated` to run the actual mutation (typically a TanStack Query mutation
 * calling the generated SDK), and invalidate affected query keys there.
 *
 * Pass `options.SPA = false` if you explicitly want SvelteKit actions (still
 * used by the few legacy routes not yet migrated).
 */
export function superForm<T extends Schema, M = string>(
	form: SuperValidated<T, M>,
	options: FormOptions<T, M> = {}
) {
	return realSuperForm<T, M>(form, {
		SPA: true,
		resetForm: false,
		...options
	});
}
