import { PreparedValue } from '../core/PreparedValue';
import { QueryBindings, RawQueryParameter } from '../types';
import { QueryConstructor } from '../utils/QueryConstructor';
import { ConditionClause } from './ConditionClause';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SelectStatement, SelectStatementOptions } from './SelectStatement';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

/**
 * SQL query builder
 */
export const qb = {
	raw: (...segments: RawQueryParameter[]) => new QueryConstructor().raw(...segments),
	line: (...segments: RawQueryParameter[]) =>
		new QueryConstructor({ join: ' ' }).raw(...segments),
	group: (...segments: RawQueryParameter[]) => new GroupExpression(...segments),
	set: (segments: RawQueryParameter[]) => new SetExpression(...segments),
	values: (values: Array<QueryBindings> | Record<string, QueryBindings>) => {
		if (Array.isArray(values)) {
			return new SetExpression(...values.map((value) => new PreparedValue(value)));
		}

		return new SetExpression(
			...Object.entries(values).map(([key, value]) =>
				new QueryConstructor().raw(key, '=').value(value),
			),
		);
	},
	where: (...segments: RawQueryParameter[]) => new WhereClause().and(...segments),
	condition: (...segments: RawQueryParameter[]) =>
		new ConditionClause().and(...segments),
	limit: (limit?: number) => new LimitClause({ limit }),
	offset: (offset?: number) => new LimitClause({ offset }),
	select: (...params: SelectStatementOptions) => new SelectStatement(...params),
};
