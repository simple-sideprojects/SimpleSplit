import type { Balance } from '$lib/client/types.gen.js';
import { createPersistentStore } from '../app/persistentStore';

export interface BalanceList {
	[key: string]: Balance;
}

function createBalancesStore() {
	const initialValue: BalanceList = {};
	const store = createPersistentStore<BalanceList>('balances', initialValue);

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getBalances: () => store.get(),
		setBalances: (balances: Balance[]) =>
			store.update(() =>
				balances.reduce((acc: BalanceList, balance) => {
					if (balance.user_id) {
						acc[balance.user_id] = balance;
					}
					return acc;
				}, {} as BalanceList)
			),
		setBalance: (balance: Balance) =>
			store.update((state) => {
				if (!balance.user_id) return state;
				return {
					...state,
					[balance.user_id]: balance
				};
			}),
		updateBalance: (balance: Balance) =>
			store.update((state) => {
				if (!balance.user_id) return state;
				return {
					...state,
					[balance.user_id]: balance
				};
			}),
		removeBalance: (user_id: string) =>
			store.update((state) => {
				const newState = { ...state };
				if (user_id in newState) {
					delete newState[user_id];
				}
				return newState;
			}),
		getBalance: (user_id: string) => store.get()[user_id],
		clear: () => store.clear
	};
}

export const balancesStore = createBalancesStore();
