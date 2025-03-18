export interface Group {
	id: number;
	name: string;
	members: string[];
	created_at: string;
}

export interface CreateGroupRequest {
	name: string;
}

export interface GroupBalance {
	username: string;
	balance: number;
}

export interface GroupTransaction {
	id: number;
	from: string;
	to: string[];
	amount: number;
	description: string;
	date: string;
}
