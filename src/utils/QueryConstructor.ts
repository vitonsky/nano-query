import { PreparedValue } from '../core/PreparedValue';
import { RawQuery } from '../core/RawQuery';
import { RawSegment } from '../core/RawSegment';
import { IQuery, QuerySegment, RawQueryParameter } from '../types';

export const isEmptySegment = (segment: QuerySegment): boolean => {
	if (segment instanceof PreparedValue) return false;

	if (segment instanceof RawSegment) {
		const value = segment.getValue();
		return value === '' || value === null;
	}

	if (segment instanceof RawQuery) {
		return segment.size() === 0;
	}

	return false;
};

export type QueryConstructorOptions = {
	join?: string | null;
};

export class QueryConstructor extends RawQuery implements IQuery {
	private readonly options;
	constructor({ join = null }: QueryConstructorOptions = {}) {
		super();

		this.options = { join };
	}

	public value = (value: string | number | null) => {
		return this.raw(new PreparedValue(value));
	};

	public raw(...queries: RawQueryParameter[]) {
		this.push(...queries);
		return this;
	}

	public exportQuery() {
		const { join } = this.options;

		const preparedQuery: QuerySegment[] = [];
		this.query.forEach((segment) => {
			if (isEmptySegment(segment)) return;

			// Add divider between segments
			if (preparedQuery.length > 0 && join !== null) {
				preparedQuery.push(new RawSegment(join));
			}

			preparedQuery.push(segment);
		});

		return preparedQuery;
	}
}
