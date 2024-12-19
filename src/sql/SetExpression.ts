import { Query } from '../core/Query';
import { IQuery, QuerySegment } from '../types';
import { QueryConstructor } from '../utils/QueryConstructor';
import { GroupExpression } from './GroupExpression';

export class SetExpression extends Query implements IQuery {
	public withParenthesis() {
		return new GroupExpression(this);
	}

	public getSegments(): QuerySegment[] {
		const query = new QueryConstructor();

		super.getSegments().forEach((item, index) => {
			const preparedItem =
				item instanceof SetExpression ? item.withParenthesis() : item;
			query.raw(index > 0 ? ',' : undefined, preparedItem);
		});

		return query.getSegments();
	}
}
