export interface ITransaction {
	id: number;
	from: string;
	to: string[];
	amount: number;
	description: string;
	date: string;
}

export interface UpdateTransactionBody {
	description: string;
	amount: number;
}
