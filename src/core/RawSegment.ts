import { PrimitiveValue, Value } from '../types';

export class RawSegment implements Value<PrimitiveValue> {
	protected readonly value;
	constructor(value: string | number | null) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}
