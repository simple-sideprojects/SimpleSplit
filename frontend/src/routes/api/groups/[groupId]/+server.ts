import { readGroupGroupsGroupIdGet } from '$lib/client';
import { json } from '@sveltejs/kit';

export const GET = async ({ params }) => {
	const { data } = await readGroupGroupsGroupIdGet({
		path: { group_id: params.groupId }
	});

	if (!data) {
		return json({ error: 'Group not found' }, { status: 404 });
	}

	return json(data);
};
