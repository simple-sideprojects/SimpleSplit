import { browser } from '$app/environment';
import type { TransactionRead } from '$lib/client';
import { createPersistentStore } from '../app/persistentStore';

export interface TransactionList {
    [key: string]: TransactionRead;
}

function createTransactionsStore() {
    const initialValue: TransactionList = {};
    const store = createPersistentStore<TransactionList>("transactions", initialValue);

    return {
        subscribe: store.subscribe,
        set: store.set,
        update: store.update,
        getTransactions: () => store.get(),
        setTransactions: (transactions: TransactionRead[]) => store.update(() => (transactions.reduce((acc: TransactionList, transaction) => {
            if(transaction.id) {
                acc[transaction.id] = transaction;
            }
            return acc;
            }, {} as TransactionList)
        )),
        updateTransaction: (transaction: TransactionRead) => store.update((state) => {
            if(!transaction.id) return state;
            return {
                ...state,
                [transaction.id]: transaction
            };
        }),
        removeTransaction: (id: string) => store.update((state) => {
            const newState = { ...state };
            if(id in newState) {
                delete newState[id];
            }
            return newState;
        }),
        getTransaction: (id: string) => store.get()[id],
        getTransactionsByGroupId: (groupId: string) => {
            const transactions = Object.values(store.get());
            return transactions.filter(transaction => transaction.group_id === groupId);
        },
        clear: () => store.clear()
    };
}

export const transactionsStore = createTransactionsStore();

/**
 * Speichert Transaktionen im persistenten Cache
 */
export function cacheTransactions(transactions: TransactionRead[]): void {
    if (!browser) return;
    transactionsStore.setTransactions(transactions);
}
