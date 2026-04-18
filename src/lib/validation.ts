import { z, type ZodError } from 'zod';
import { STATUSES } from './types';

const emptyToUndef = (v: unknown) =>
	v === '' || v === null || typeof v === 'undefined' ? undefined : v;

const optionalInt = (min: number, max: number) =>
	z.preprocess((v) => {
		const s = emptyToUndef(v);
		if (s === undefined) return undefined;
		const n = Number(s);
		return Number.isFinite(n) ? n : s;
	}, z.number().int().min(min).max(max).optional());

const optionalNonNeg = () => optionalInt(0, 10_000_000);

export const carCreateSchema = z
	.object({
		url: z.string().max(2000).optional().or(z.literal('')),
		title: z.string().min(1).max(300),
		make: z.string().max(100).optional().or(z.literal('')),
		model: z.string().max(200).optional().or(z.literal('')),
		year: optionalInt(1950, 2100),
		km: optionalNonNeg(),
		price: optionalNonNeg(),
		fuel: z.string().max(50).optional().or(z.literal('')),
		engine: z.string().max(200).optional().or(z.literal('')),
		power: optionalNonNeg(),
		source: z.string().max(100).optional().or(z.literal('')),
		status: z.enum(STATUSES).optional(),
		location: z.string().max(200).optional().or(z.literal('')),
		notes: z.string().max(5000).optional().or(z.literal(''))
	})
	.strict();

export const carUpdateSchema = carCreateSchema
	.partial()
	.extend({
		priceNote: z.string().max(500).optional(),
		version: z.number().int().nonnegative().optional()
	})
	.strict();

export interface FormattedError {
	field: string;
	message: string;
}

export function formatZodError(err: ZodError): FormattedError[] {
	return err.issues.map((i) => ({
		field: i.path.join('.'),
		message: i.message
	}));
}

export { STATUSES };
