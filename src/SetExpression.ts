import { Query } from './core/Query';
import { GroupExpression } from './GroupExpression';
import { IQuery, QuerySegment } from './types';
import { QueryConstructor } from './utils/QueryConstructor';

export class SetExpression extends Query implements IQuery {
	public withParenthesis() {
		return new GroupExpression(this);
	}

	public exportQuery(): QuerySegment[] {
		const query = new QueryConstructor();

		super.exportQuery().forEach((item, index) => {
			const preparedItem =
				item instanceof SetExpression ? item.withParenthesis() : item;
			query.raw(index > 0 ? ',' : undefined, preparedItem);
		});

		return query.exportQuery();
	}
}
