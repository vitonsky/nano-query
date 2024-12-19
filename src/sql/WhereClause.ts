import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { IQuery, QuerySegment, RawQueryParameter } from '../types';
import { ConditionClause } from './ConditionClause';

export class WhereClause extends Query implements IQuery {
	protected readonly condition = new ConditionClause();
	constructor() {
		super();
	}

	public size() {
		return this.condition.size();
	}

	public and(...query: RawQueryParameter[]) {
		this.condition.and(...query);

		return this;
	}

	public or(...query: RawQueryParameter[]) {
		this.condition.or(...query);

		return this;
	}

	public getSegments(): QuerySegment[] {
		if (this.condition.size() === 0) return [];

		return new QueryBuilder({ join: ' ' }).raw('WHERE', this.condition).getSegments();
	}
}
