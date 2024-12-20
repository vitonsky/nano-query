import { SQLCompiler } from '../compilers/SQLCompiler';
import { QueryBuilder } from '../QueryBuilder';
import { SelectStatement } from './SelectStatement';

const compiler = new SQLCompiler();

test('Trivial select', () => {
	expect(
		compiler.toSQL(
			new SelectStatement()
				.from('foo')
				.select('x', 'y', 'z')
				.where(new QueryBuilder().raw('bar=').value(100))
				.limit(50)
				.offset(200),
		),
	).toEqual({
		sql: 'SELECT x,y,z FROM foo WHERE bar=? LIMIT ? OFFSET ?',
		bindings: [100, 50, 200],
	});
});

test('Parameters in constructor', () => {
	expect(
		compiler.toSQL(
			new SelectStatement('x', 'y').from('foo f', 'LEFT JOIN bar b').select('z'),
		),
	).toEqual({
		sql: 'SELECT x,y,z FROM foo f LEFT JOIN bar b',
		bindings: [],
	});
});

test('Aliases in select', () => {
	expect(
		compiler.toSQL(
			new SelectStatement()
				.from('foo AS f')
				.select(
					'x AS alias',
					new QueryBuilder({ join: ' ' }).value(123).raw('AS value'),
				)
				.where(new QueryBuilder().raw('bar=').value(100)),
		),
	).toEqual({
		sql: 'SELECT x AS alias,? AS value FROM foo AS f WHERE bar=?',
		bindings: [123, 100],
	});
});
