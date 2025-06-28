import type { Balance } from '$lib/client/types.gen.js';
import { createPersistentStore } from '../app/persistentStore';

function createBalancesStore() {
	const initialValue: Balance = {} as Balance;
	const store = createPersistentStore<Balance>('balances', initialValue);

	return {
		subscribe: store.subscribe,
		set: store.set,
		update: store.update,
		getBalances: () => store.get(),
		setBalance: (balance: Balance) => store.set(balance),
		updateBalance: (balance: Balance) => store.update(() => balance),
		removeBalance: () => store.clear(),
		getBalance: () => store.get(),
		clear: () => store.clear
	};
}

export const balancesStore = createBalancesStore();
