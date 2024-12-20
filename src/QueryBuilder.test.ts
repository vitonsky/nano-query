import { SQLCompiler } from './compilers/SQLCompiler';
import { PreparedValue } from './core/PreparedValue';
import { QueryBuilder } from './QueryBuilder';

const compiler = new SQLCompiler();

test('Add segments one by one with query builder', () => {
	expect(
		compiler.toSQL(
			new QueryBuilder({ join: null })
				.raw('SELECT * FROM foo WHERE foo=')
				.value(1)
				.raw(' LIMIT 2'),
		),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo=? LIMIT 2',
		bindings: [1],
	});
});

test('Nested query builder compiles well', () => {
	expect(
		compiler.toSQL(
			new QueryBuilder({ join: null }).raw(
				'SELECT * FROM foo WHERE foo IN ',
				new QueryBuilder({ join: null })
					.raw('(SELECT id FROM bar WHERE x > ')
					.value(100)
					.raw(')'),
			),
		),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo IN (SELECT id FROM bar WHERE x > ?)',
		bindings: [100],
	});
});

test('Builder respects a join option', () => {
	expect(
		compiler.toSQL(
			new QueryBuilder({ join: ' ' }).raw(
				'SELECT * FROM foo WHERE foo IN',
				new QueryBuilder({ join: null }).raw(
					'(SELECT id FROM bar WHERE x > ',
					new PreparedValue(100),
					')',
				),
			),
		),
	).toEqual({
		sql: 'SELECT * FROM foo WHERE foo IN (SELECT id FROM bar WHERE x > ?)',
		bindings: [100],
	});
});
