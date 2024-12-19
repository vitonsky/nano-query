import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { RawSegment } from '../core/RawSegment';
import { IQuery, QuerySegment, RawQueryParameter } from '../types';

export const isEmptySegment = (segment: QuerySegment): boolean => {
	if (segment instanceof PreparedValue) return false;

	if (segment instanceof RawSegment) {
		const value = segment.getValue();
		return value === '' || value === null;
	}

	if (segment instanceof Query) {
		return segment.size() === 0;
	}

	return false;
};

export type QueryConstructorOptions = {
	join?: string | null;
};

export class QueryConstructor extends Query implements IQuery {
	private readonly options;
	constructor({ join = null }: QueryConstructorOptions = {}) {
		super();

		this.options = { join };
	}

	public value = (value: string | number | null) => {
		return this.raw(new PreparedValue(value));
	};

	public raw(...segments: RawQueryParameter[]) {
		this.addSegment(...segments);
		return this;
	}

	public getSegments() {
		const { join } = this.options;

		const preparedQuery: QuerySegment[] = [];
		this.segments.forEach((segment) => {
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
