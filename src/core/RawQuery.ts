import { IQuery, QueryParameter, QuerySegment, RawQueryParameter } from '../types';
import { PreparedValue } from './PreparedValue';
import { RawSegment } from './RawSegment';

export const filterOutEmptySegments = (segments: RawQueryParameter[]) =>
	segments.filter((segment) => segment !== undefined) as QueryParameter[];

export class RawQuery implements IQuery {
	protected readonly query: QuerySegment[] = [];
	constructor(...query: RawQueryParameter[]) {
		if (query) {
			this.push(...query);
		}
	}

	/**
	 * Returns query segments number
	 */
	public size() {
		return this.exportQuery().length;
	}

	/**
	 * Returns final query that may be preprocessed
	 * Returned query will be used while compile SQL
	 */
	public exportQuery() {
		return this.query;
	}

	/**
	 * Compile query to SQL string and bindings
	 */
	public toSQL() {
		let sql = '';
		const bindings: Array<string | number | null> = [];
		for (const segment of this.exportQuery()) {
			if (segment instanceof RawQuery) {
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

	protected push(...queries: RawQueryParameter[]) {
		this.query.push(
			...filterOutEmptySegments(queries).map((segment) => {
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
