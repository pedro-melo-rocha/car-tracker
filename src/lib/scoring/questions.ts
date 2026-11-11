import type { ScamFlag } from './suspicion';

/**
 * What to ask or check before calling, one line per red flag.
 * Shown under each flag in the car panel's "Before you call" block.
 */
export const FLAG_QUESTIONS: Record<ScamFlag['id'], string> = {
	'low-km-per-year': 'Ask for the IPO inspection reports and service book to confirm the km.',
	'recent-cheap': 'Ask why it is this cheap for its age, and whether it has had any accident.',
	'unicorn-combo': 'Low km, low price and a recent year rarely come together. See it in person before anything else.',
	'big-engine-cheap': 'Ask what was repaired recently and why it is being sold.',
	'below-market-estimate': 'Ask why the price is below similar cars. Check for accident or flood damage.',
	'below-peer-median': 'Ask why it is cheaper than the others on your list.',
	'new-account': 'New seller account. Insist on seeing the car and the papers in person.',
	'new-account-cheap': 'New account and a low price. Never pay before seeing the car and the papers.',
	'imported-low-km': 'Ask for the import papers and the km recorded when it was registered here.',
	'scam-wording': 'Never pay a deposit or shipping up front. Walk away if they insist.',
	'pressure-wording': 'Don’t let urgency rush you. See it before agreeing to any deposit.',
	'few-photos': 'Ask for photos of the engine bay, interior, odometer and tyres.',
	'missing-key-data': 'Ask for the km and the year of first registration before going.'
};
