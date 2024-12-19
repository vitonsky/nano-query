import { Query } from '../core/Query';
import { QueryBuilder } from '../QueryBuilder';
import { IQuery, QueryParameter, QuerySegment, RawQueryParameter } from '../types';
import { LimitClause } from './LimitClause';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

export type SelectStatementOptions = QueryParameter[];

export class SelectStatement extends Query implements IQuery {
	private readonly _select: QueryParameter[];
	private readonly _from: QueryParameter[];
	private readonly _limit: { limit?: number; offset?: number };
	private readonly _where;

	constructor(...select: SelectStatementOptions) {
		super();

		this._select = select;
		this._from = [];
		this._limit = {};

		this._where = new WhereClause();
	}

	public select(...params: QueryParameter[]) {
		this._select.push(...params);
		return this;
	}

	public from(...params: QueryParameter[]) {
		this._from.push(...params);
		return this;
	}

	public offset(offset?: number) {
		this._limit.offset = offset;
		return this;
	}

	public limit(limit?: number) {
		this._limit.limit = limit;
		return this;
	}

	public where(param: RawQueryParameter, condition: 'and' | 'or' = 'and') {
		this._where[condition](param);
		return this;
	}

	public getSegments(): QuerySegment[] {
		const query = new QueryBuilder({ join: ' ' });

		query.raw('SELECT');

		if (this._select.length > 0) {
			query.raw(new SetExpression(...this._select));
		} else {
			query.raw('*');
		}

		if (this._from.length === 0) throw TypeError('Not set FROM clause');
		query.raw('FROM', ...this._from);

		query.raw(this._where);

		query.raw(new LimitClause(this._limit));

		return query.getSegments();
	}
}
