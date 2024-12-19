export class RawValue {
	protected readonly value;
	constructor(value: string | number | null) {
		this.value = value;
	}

	public getValue = () => {
		return this.value;
	};
}
