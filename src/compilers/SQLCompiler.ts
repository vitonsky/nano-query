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

export type SQLCompilerConfig = {
	getPlaceholder: (valueIndex: number) => string;
};

export class SQLCompiler implements Compiler<CommandWithBindings<QueryBindings>> {
	private readonly config: SQLCompilerConfig;
	constructor(options?: Partial<SQLCompilerConfig>) {
		this.config = {
			getPlaceholder: options?.getPlaceholder ?? (() => '?'),
		};
	}
	/**
	 * Compile query to SQL string and bindings
	 */
	public compile(query: Query) {
		const sharedState = {
			valueIndex: 0,
		};
		const processQuery = (query: Query): CommandWithBindings<QueryBindings> => {
			let command = '';
			const bindings: Array<string | number | null> = [];
			for (const segment of query.getSegments()) {
				if (segment instanceof Query) {
					const data = processQuery(segment);
					command += data.command;
					bindings.push(...data.bindings);
					continue;
				}

				if (segment instanceof PreparedValue) {
					const placeholder = this.config.getPlaceholder(
						sharedState.valueIndex,
					);
					sharedState.valueIndex++;

					command += placeholder;
					bindings.push(segment.getValue());
					continue;
				}

				command += segment.getValue();
			}

			return { command, bindings };
		};

		return processQuery(query);
	}
}
