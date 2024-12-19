import { PreparedValue } from './core/PreparedValue';
import { RawQuery } from './core/RawQuery';
import { RawValue } from './core/RawValue';

export type PrimitiveValue = string | number | null;

export interface Value<T> {
	getValue: () => T;
}

export type QueryBindings = PrimitiveValue;
export type QuerySegment = RawValue | RawQuery | PreparedValue;
export type QueryParameter = QuerySegment | QueryBindings;

export type RawQueryParameter = QueryParameter | undefined;

export interface IQuery {
	/**
	 * Returns query segments number
	 */
	size(): number;

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used to compile SQL
	 */
	exportQuery(): QuerySegment[];

	/**
	 * Compile query to SQL string and bindings
	 */
	toSQL(): { sql: string; bindings: QueryBindings[] };
}
