import { browser } from '$app/environment';
import type { Group } from '$lib/client';
import { createPersistentStore } from '../app/persistentStore';

export interface GroupList {
    [key: string]: Group;
}

function createGroupsStore() {
	const initialValue: GroupList = {};
	const store = createPersistentStore<GroupList>("groups", initialValue);

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getGroups: () => store.get(),
		setGroups: (groups: Group[]) => store.update(() => (groups.reduce((acc: GroupList, group) => {
			if(group.id) {
				acc[group.id] = group;
			}
			return acc;
			}, {} as GroupList)
		)),
		updateGroup: (group: Group) => store.update((state) => {
			if(!group.id) return state;
			return {
				...state,
				[group.id]: group
			};
		}),
		removeGroup: (id: string) => store.update((state) => {
			const newState = { ...state };
			if(id in newState) {
				delete newState[id];
			}
			return newState;
		}),
		getGroup: (id: string) => store.get()[id]
	};
}

export const groupsStore = createGroupsStore();

export function cacheGroups(groups: Group[]): void {
    if (!browser) return;
    groupsStore.setGroups(groups);
}
