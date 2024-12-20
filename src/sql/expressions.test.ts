import { SQLCompiler } from '../compilers/SQLCompiler';
import { PreparedValue } from '../core/PreparedValue';
import { QueryBuilder } from '../QueryBuilder';
import { ConditionClause } from './ConditionClause';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

const compiler = new SQLCompiler();

describe('Group expressions', () => {
	test('Empty group expression yields empty query', () => {
		expect(compiler.toSQL(new GroupExpression())).toEqual({
			sql: '',
			bindings: [],
		});
	});

	test('Nested group expression yields correct query', () => {
		expect(
			compiler.toSQL(
				new GroupExpression(
					new GroupExpression(new PreparedValue(1)),
					' OR ',
					new GroupExpression(new PreparedValue(2)),
				),
			),
		).toEqual({
			sql: '((?) OR (?))',
			bindings: [1, 2],
		});
	});
});

describe('Set expression', () => {
	test('Set with literals', () => {
		expect(compiler.toSQL(new SetExpression('foo', 'bar', 'baz'))).toEqual({
			sql: 'foo,bar,baz',
			bindings: [],
		});
	});

	test('Nested sets', () => {
		expect(
			compiler.toSQL(new SetExpression('foo', new SetExpression('bar', 'baz'))),
		).toEqual({
			sql: 'foo,(bar,baz)',
			bindings: [],
		});
	});

	test('Set with parenthesis', () => {
		expect(
			compiler.toSQL(new SetExpression('foo', 'bar', 'baz').withParenthesis()),
		).toEqual({
			sql: '(foo,bar,baz)',
			bindings: [],
		});
	});
});

describe('Limit expression', () => {
	test('Limit', () => {
		expect(compiler.toSQL(new LimitClause({ limit: 10 }))).toEqual({
			sql: 'LIMIT ?',
			bindings: [10],
		});
	});
	test('Offset', () => {
		expect(compiler.toSQL(new LimitClause({ offset: 20 }))).toEqual({
			sql: 'OFFSET ?',
			bindings: [20],
		});
	});
	test('Limit and offset', () => {
		expect(compiler.toSQL(new LimitClause({ limit: 10, offset: 20 }))).toEqual({
			sql: 'LIMIT ? OFFSET ?',
			bindings: [10, 20],
		});
	});
});

describe('Condition expression', () => {
	test('Empty condition generates empty query', () => {
		const query = new ConditionClause();

		expect(compiler.toSQL(query)).toEqual({
			sql: '',
			bindings: [],
		});
		expect(query.size()).toBe(0);
	});

	test('Single condition yields just a literal', () => {
		expect(
			compiler.toSQL(new ConditionClause().and('x > ', new PreparedValue(0))),
		).toEqual({
			sql: 'x > ?',
			bindings: [0],
		});

		expect(
			compiler.toSQL(new ConditionClause().or('x > ', new PreparedValue(0))),
		).toEqual({
			sql: 'x > ?',
			bindings: [0],
		});
	});

	test('Trivial condition expression yields sql expression', () => {
		expect(
			compiler.toSQL(
				new ConditionClause()
					.and('x > ', new PreparedValue(0))
					.or('y < ', new PreparedValue(1)),
			),
		).toEqual({
			sql: 'x > ? OR y < ?',
			bindings: [0, 1],
		});
	});

	test('Complex condition expression consider a grouping', () => {
		const query = new QueryBuilder({ join: null }).raw(
			'SELECT * FROM foo WHERE ',
			new ConditionClause()
				.and('x > ', new PreparedValue(0))
				.or(
					new GroupExpression(
						new ConditionClause()
							.and('y=', new PreparedValue(1))
							.and('z=', new PreparedValue(2)),
					),
				),
		);

		expect(compiler.toSQL(query)).toEqual({
			sql: 'SELECT * FROM foo WHERE x > ? OR (y=? AND z=?)',
			bindings: [0, 1, 2],
		});
	});
});

describe('Where clause', () => {
	test('Where clause may be filled after join', () => {
		const where = new WhereClause();
		const query = new QueryBuilder({ join: null }).raw('SELECT * FROM foo ', where);

		// Fill where after build a query object
		where
			.and('x > ', new PreparedValue(0))
			.or(
				new GroupExpression(
					new ConditionClause()
						.and('y=', new PreparedValue(1))
						.and('z=', new PreparedValue(2)),
				),
			);

		expect(compiler.toSQL(query)).toEqual({
			sql: 'SELECT * FROM foo WHERE x > ? OR (y=? AND z=?)',
			bindings: [0, 1, 2],
		});
	});

	test('Empty where clause generates empty query', () => {
		expect(compiler.toSQL(new WhereClause())).toEqual({
			sql: '',
			bindings: [],
		});
	});
});
