// 1. Raw API types
export interface RawDebt {
	debtId: number;
	dsCode: number;
	dsName: string;
	dbtrIBAN: string;
	partida: string;
	debtKindId: number;
	payOrder: number;
	budgetYear: number;
	instNumber: number;
	debtKindName: string;
	description: string;
	residual: number;
	interest: number;
	dueDate: string;
}

export interface getDebtsApiResponse {
	output: {
		idn: string;
		name: string;
		currency: string;
		debts: {
			debt: RawDebt[];
		};
	};
}

// 2. Target types
export interface Money {
	amount: number;
	currency: string;
}

export interface AmountDue {
	totalAmount: number;
	amount: number;
	interest: number;
	currency: string;
}

export interface Category {
	debtKindId: number;
	debtKindName: string;
	totalAmount: Money;
}

export interface DebtByPayOrder extends RawDebt {
	amountDue: AmountDue;
}

export interface DebtsByYear {
	budgetYear: number;
	debtsByPayOrder: DebtByPayOrder[];
}

export interface Group {
	partida: string;
	dsName: string;
	description: string;
	dsCode: number;
	categories: Category[];
	debtsByYear: DebtsByYear[];
}

export interface MappedDebts {
	idn: string;
	name: string;
	currency: string;
	groups: Group[];
}

export interface GroupKeyData {
	partida: string;
	dsName: string;
	description: string;
	dsCode: number;
}
