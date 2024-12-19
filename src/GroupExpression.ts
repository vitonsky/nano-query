import { Query } from './core/Query';
import { IQuery } from './types';

export class GroupExpression extends Query implements IQuery {
	public getSegments() {
		const segments = super.getSegments();

		if (segments.length === 0) return [];

		return [new Query('('), ...segments, new Query(')')];
	}
}
