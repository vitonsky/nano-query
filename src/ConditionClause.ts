import { filterOutEmptySegments, RawQuery } from './core/RawQuery';
import { IQuery, QuerySegment, RawQueryParameter } from './types';
import { QueryConstructor } from './utils/QueryConstructor';

export class ConditionClause extends RawQuery implements IQuery {
	protected readonly clauses: Array<{
		clause: QuerySegment;
		join: 'AND' | 'OR';
	}> = [];
	constructor() {
		super();
	}

	public and(...query: RawQueryParameter[]) {
		const filteredQuery = filterOutEmptySegments(query);
		if (filteredQuery.length > 0) {
			this.clauses.push({
				join: 'AND',
				clause: new RawQuery(...filteredQuery),
			});
		}

		return this;
	}

	public or(...query: RawQueryParameter[]) {
		const filteredQuery = filterOutEmptySegments(query);
		if (filteredQuery.length > 0) {
			this.clauses.push({
				join: 'OR',
				clause: new RawQuery(...filteredQuery),
			});
		}

		return this;
	}

	public exportQuery(): QuerySegment[] {
		const query = new QueryConstructor({ join: ' ' });

		if (this.clauses.length > 0) {
			this.clauses.forEach((clause, index) => {
				query.raw(index > 0 ? clause.join : undefined, clause.clause);
			});
		}

		return query.exportQuery();
	}

	public size() {
		return this.clauses.length;
	}
}
