import { RawQuery } from './core/RawQuery';
import { IQuery } from './types';

export class GroupExpression extends RawQuery implements IQuery {
	public exportQuery() {
		const segments = super.exportQuery();

		if (segments.length === 0) return [];

		return [new RawQuery('('), ...segments, new RawQuery(')')];
	}
}
