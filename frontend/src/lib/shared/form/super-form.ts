import { page } from '$app/state';
import { createCustomRequestForFormAction, isCompiledStatic } from '$lib/shared/app/controller';
import { superForm as realSuperForm } from 'sveltekit-superforms/client';

export function superForm<T extends Record<string, unknown>>(
	...params: Parameters<typeof realSuperForm<T>>
) {
	const options = params.length > 0 ? params[1] : {};
	return realSuperForm<T>(params[0], {
		...options,
		onSubmit: (event) => {
			//Add the groupId to the data if it is a group dashboard page
			if (!event.formData.has('groupId') && event.action.pathname.includes('/groups/dashboard')) {
				const groupId = page.url.searchParams.get('groupId');
				if (groupId) {
					event.formData.set('groupId', groupId);
				}
			}
			if (isCompiledStatic()) {
				event.customRequest(createCustomRequestForFormAction);
			}
			if (options?.onSubmit !== undefined) {
				options.onSubmit(event);
			}
		}
	});
}
