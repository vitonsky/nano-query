import { IQuery, QueryParameter, QuerySegment, RawQueryParameter } from '../types';
import { PreparedValue } from './PreparedValue';
import { RawSegment } from './RawSegment';

export const filterOutEmptySegments = (segments: RawQueryParameter[]) =>
	segments.filter((segment) => segment !== undefined) as QueryParameter[];

export class Query implements IQuery {
	protected readonly segments: QuerySegment[] = [];
	constructor(...segments: RawQueryParameter[]) {
		if (segments) {
			this.addSegment(...segments);
		}
	}

	/**
	 * Returns query segments number
	 */
	public size() {
		return this.getSegments().length;
	}

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used while compile SQL
	 */
	public getSegments() {
		return this.segments;
	}

	/**
	 * Compile query to SQL string and bindings
	 */
	public toSQL() {
		let sql = '';
		const bindings: Array<string | number | null> = [];
		for (const segment of this.getSegments()) {
			if (segment instanceof Query) {
				const data = segment.toSQL();
				sql += data.sql;
				bindings.push(...data.bindings);
				continue;
			}

			if (segment instanceof PreparedValue) {
				sql += '?';
				bindings.push(segment.getValue());
				continue;
			}

			sql += segment.getValue();
		}

		return { sql, bindings };
	}

	protected addSegment(...segments: RawQueryParameter[]) {
		this.segments.push(
			...filterOutEmptySegments(segments).map((segment) => {
				switch (typeof segment) {
					case 'string':
					case 'number':
						return new RawSegment(segment);

					default:
						return segment === null ? new RawSegment(null) : segment;
				}
			}),
		);
	}
}
