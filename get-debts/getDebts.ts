import input from './input.json';
import { prettyLog, saveJson } from './util';
import {
	RawDebt,
	getDebtsApiResponse,
	Category,
	DebtsByYear,
	Group,
	MappedDebts,
	GroupKeyData,
} from './dto';

/**
 * mapgetDebtsResponse
 * @param {getDebtsApiResponse} response
 * @returns {MappedDebts}
 */
export function mapgetDebtsResponse(
	response: getDebtsApiResponse
): MappedDebts {
	const {
		idn,
		name,
		currency,
		debts: { debt: rawDebts },
	} = response.output;

	// --- Level 1: group by (partida, dsCode, dsName, description) ---
	const groupMap = new Map<
		string,
		{ meta: GroupKeyData; debts: RawDebt[] }
	>();

	for (const d of rawDebts) {
		const key = d.partida;
		const meta: GroupKeyData = {
			partida: d.partida,
			dsName: d.dsName,
			description: d.description,
			dsCode: d.dsCode,
		};

		const existing = groupMap.get(key);
		if (existing) {
			existing.debts.push(d);
		} else {
			groupMap.set(key, { meta, debts: [d] });
		}
	}

	const groups: Group[] = [];

	for (const { meta, debts } of groupMap.values()) {
		// --- Level 2: categories by debtKindId ---
		const categoryMap = new Map<
			number,
			{ debtKindId: number; debtKindName: string; total: number }
		>();

		for (const d of debts) {
			const totalForDebt = d.residual + d.interest; // adjust if you want only residual etc.
			const existingCat = categoryMap.get(d.debtKindId);

			if (existingCat) {
				existingCat.total += totalForDebt;
			} else {
				categoryMap.set(d.debtKindId, {
					debtKindId: d.debtKindId,
					debtKindName: d.debtKindName,
					total: totalForDebt,
				});
			}
		}

		const categories: Category[] = Array.from(categoryMap.values()).map(
			(c) => ({
				debtKindId: c.debtKindId,
				debtKindName: c.debtKindName,
				totalAmount: {
					amount: c.total,
					currency,
				},
			})
		);

		// --- Level 3: debtsByYear (group by budgetYear, sort by payOrder) ---
		const yearMap = new Map<number, RawDebt[]>();

		for (const d of debts) {
			const arr = yearMap.get(d.budgetYear);
			if (arr) {
				arr.push(d);
			} else {
				yearMap.set(d.budgetYear, [d]);
			}
		}

		const debtsByYear: DebtsByYear[] = Array.from(yearMap.entries())
			.sort(([yearA], [yearB]) => yearA - yearB)
			.map(([year, yearDebts]) => ({
				budgetYear: year,
				debtsByPayOrder: yearDebts
					.slice()
					.sort((a, b) => a.payOrder - b.payOrder)
					.map((d) => ({
						...d,
						amountDue: {
							totalAmount: d.residual + d.interest,
							amount: d.residual,
							interest: d.interest,
							currency,
						},
					})),
			}));

		groups.push({
			...meta,
			categories,
			debtsByYear,
		});
	}

	return {
		idn,
		name,
		currency,
		groups,
	};
}

saveJson('./output.json', mapgetDebtsResponse(input as getDebtsApiResponse));
