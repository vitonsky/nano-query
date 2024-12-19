import { ConditionClause } from './ConditionClause';
import { Query } from './core/Query';
import { IQuery, QuerySegment, RawQueryParameter } from './types';
import { QueryConstructor } from './utils/QueryConstructor';

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

	public exportQuery(): QuerySegment[] {
		if (this.condition.size() === 0) return [];

		return new QueryConstructor({ join: ' ' })
			.raw('WHERE', this.condition)
			.exportQuery();
	}
}
