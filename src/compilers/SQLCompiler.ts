import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { QueryBindings } from '../types';

export interface CommandWithBindings<T> {
	command: string;
	bindings: T[];
}

export interface Compiler<T> {
	compile: (query: Query) => T;
}

export class SQLCompiler implements Compiler<CommandWithBindings<QueryBindings>> {
	/**
	 * Compile query to SQL string and bindings
	 */
	public compile(query: Query) {
		let command = '';
		const bindings: Array<string | number | null> = [];
		for (const segment of query.getSegments()) {
			if (segment instanceof Query) {
				const data = this.compile(segment);
				command += data.command;
				bindings.push(...data.bindings);
				continue;
			}

			if (segment instanceof PreparedValue) {
				command += '?';
				bindings.push(segment.getValue());
				continue;
			}

			command += segment.getValue();
		}

		return { command, bindings };
	}
}
