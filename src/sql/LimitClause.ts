import { Query } from '../core/Query';
import { IQuery, QuerySegment } from '../types';
import { QueryConstructor } from '../utils/QueryConstructor';

export class LimitClause extends Query implements IQuery {
	private readonly state;
	constructor(state: { limit?: number; offset?: number }) {
		super();
		this.state = state;
	}

	public getSegments(): QuerySegment[] {
		const { limit, offset } = this.state;

		const query = new QueryConstructor({ join: ' ' });

		if (limit) {
			query.raw('LIMIT').value(limit);
		}

		if (offset) {
			query.raw('OFFSET').value(offset);
		}

		return query.getSegments();
	}
}
