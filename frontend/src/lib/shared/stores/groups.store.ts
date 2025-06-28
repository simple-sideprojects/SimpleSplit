import type { Balance, Group, GroupExpandedResponse, TransactionRead } from '$lib/client';
import { createPersistentStore } from '../app/persistentStore';

export interface GroupList {
	[key: string]: Group | GroupExpandedResponse;
}

function createGroupsStore() {
	const initialValue: GroupList = {};
	const store = createPersistentStore<GroupList>('groups', initialValue);

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getGroups: () => store.get(),
		setGroups: (groups: (Group | GroupExpandedResponse)[]) =>
			store.update(() =>
				groups.reduce((acc: GroupList, group) => {
					if (group.id) {
						acc[group.id] = group;
					}
					return acc;
				}, {} as GroupList)
			),
		updateGroup: (group: Group | GroupExpandedResponse) =>
			store.update((state) => {
				if (!group.id) return state;
				return {
					...state,
					[group.id]: group
				};
			}),
		setGroupBalance: (id: string, balance: Balance) =>
			store.update((state) => {
				if (!state[id]) return state;
				return {
					...state,
					[id]: {
						...state[id],
						balance: balance
					}
				};
			}),
		setGroupTransactions: (id: string, transactions: TransactionRead[]) =>
			store.update((state) => {
				if (!state[id]) return state;
				return {
					...state,
					[id]: {
						...state[id],
						transactions: transactions
					}
				};
			}),
		removeGroup: (id: string) =>
			store.update((state) => {
				const newState = { ...state };
				if (id in newState) {
					delete newState[id];
				}
				return newState;
			}),
		getGroup: (id: string) => store.get()[id],
		clear: () => store.clear
	};
}

export const groupsStore = createGroupsStore();
