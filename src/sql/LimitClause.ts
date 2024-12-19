import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { IQuery, QuerySegment } from '../types';

export class LimitClause extends Query implements IQuery {
	private readonly state;
	constructor(state: { limit?: number; offset?: number }) {
		super();
		this.state = state;
	}

	public getSegments(): QuerySegment[] {
		const { limit, offset } = this.state;

		const query = new QueryBuilder({ join: ' ' });

		if (limit) {
			query.raw('LIMIT').value(limit);
		}

		if (offset) {
			query.raw('OFFSET').value(offset);
		}

		return query.getSegments();
	}
}
