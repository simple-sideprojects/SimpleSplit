import { persist, createLocalStorage } from "@macfja/svelte-persistent-store"
import { writable } from "svelte/store"
import { browser } from '$app/environment';
import type { Group } from '$lib/client';

export interface GroupList {
    [key: string]: Group;
 }

function createGroupsStore() {
	const { subscribe, update, set } = persist(writable<GroupList>({}), createLocalStorage(), "groups");

	let data: GroupList = {};
	subscribe((value) => {
		data = value;
	});

	return {
		subscribe,
		update,
		set,
		getGroups: () => data,
        setGroups: (groups: Group[]) => update(() => (groups.reduce((acc: GroupList, group) => {
            if(group.id) {
                acc[group.id] = group;
            }
            return acc;
            }, {} as GroupList)
        )),
        updateGroup: (group: Group) => update((state) => {
            if(!group.id) return state;
            return {
                ...state,
                [group.id]: group
            };
        }),
        removeGroup: (id: string) => update((state) => {
            const newState = { ...state };
            if(id in newState) {
                delete newState[id];
            }
            return newState;
        }),
        getGroup: (id: string) => data[id]
	};
}

export const groupsStore = createGroupsStore();

export function cacheGroups(groups: Group[]): void {
    if (!browser) return;
    groupsStore.setGroups(groups);
}
