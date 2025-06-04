import type { Group as BasicGroup, TransactionRead } from '$lib/client';
import type { Balance } from '$lib/interfaces/balance';
import { createPersistentStore } from '../app/persistentStore';

export interface Group extends BasicGroup{
	balances: Balance[]|undefined;
	transactions: TransactionRead[]|undefined;
}

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
		setGroupBalances: (id: string, balances: Balance[]) => store.update((state) => {
			if(!state[id]) return state;
			return {
				...state,
				[id]: { ...state[id], balances: balances.reduce((acc, balance) => {
					if(balance.username) {
						acc[balance.username] = balance;
					}
					return acc;
				}, {} as Balance[]) }
			};
		}),
		setGroupTransactions: (id: string, transactions: TransactionRead[]) => store.update((state) => {
			if(!state[id]) return state;
			return {
				...state,
				[id]: { ...state[id], transactions: transactions.reduce((acc, transaction) => {
					if(transaction.id) {
						acc[transaction.id] = transaction;
					}
					return acc;
				}, {} as TransactionRead[]) }
			};
		}),
		removeGroup: (id: string) => store.update((state) => {
			const newState = { ...state };
			if(id in newState) {
				delete newState[id];
			}
			return newState;
		}),
		getGroup: (id: string) => store.get()[id],
		clear: () => store.clear
	};
}

export const groupsStore = createGroupsStore();
