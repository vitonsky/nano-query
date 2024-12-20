import { SQLCompiler } from '../compilers/SQLCompiler';
import { PreparedValue } from '../core/PreparedValue';
import { QueryBuilder } from '../QueryBuilder';
// import { qb } from './builder';
import { ConditionClause } from './ConditionClause';
import { ConfigurableSQLBuilder } from './ConfigurableSQLBuilder';
import { GroupExpression } from './GroupExpression';
import { LimitClause } from './LimitClause';
import { SelectStatement } from './SelectStatement';
import { SetExpression } from './SetExpression';
import { WhereClause } from './WhereClause';

const compiler = new SQLCompiler();
const qb = new ConfigurableSQLBuilder(compiler);

describe('Primitives', () => {
	test('Query constructor able to add segments one by one', () => {
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

	test('Query constructors may be nested', () => {
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

	test('Query constructors may be nested with no introduce a variables', () => {
		const query = new QueryBuilder({ join: null }).raw(
			'SELECT * FROM foo WHERE foo IN ',
			new QueryBuilder({ join: null }).raw(
				'(SELECT id FROM bar WHERE x > ',
				new PreparedValue(100),
				')',
			),
		);

		expect(compiler.toSQL(query)).toEqual({
			sql: 'SELECT * FROM foo WHERE foo IN (SELECT id FROM bar WHERE x > ?)',
			bindings: [100],
		});
	});
});

describe('Basic clauses', () => {
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
			const query = new QueryBuilder({ join: null }).raw(
				'SELECT * FROM foo ',
				where,
			);

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
});

describe('Statements', () => {
	describe('Select', () => {
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
					new SelectStatement('x', 'y')
						.from('foo f', 'LEFT JOIN bar b')
						.select('z'),
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
	});
});

describe('Query builder', () => {
	test('Complex query building', () => {
		const query = (sources: (string | number)[]) =>
			qb.line(
				qb.raw('SELECT * FROM notes'),
				qb.where(
					qb
						.condition(qb.raw('workspace_id=').value('fake-uuid'))
						.and(
							sources.length === 0
								? undefined
								: qb
										.line('id IN')
										.raw(
											qb.group(
												qb
													.line(
														'SELECT target FROM attachedTags',
													)
													.raw(
														qb.where(
															qb
																.line('source IN')
																.raw(
																	qb
																		.values(sources)
																		.withParenthesis(),
																),
														),
													),
											),
										),
						),
				),
				qb.limit(20),
				qb.offset(10),
			);

		expect(qb.toSQL(query(['foo', 'bar', 123]))).toEqual({
			sql: 'SELECT * FROM notes WHERE workspace_id=? AND id IN (SELECT target FROM attachedTags WHERE source IN (?,?,?)) LIMIT ? OFFSET ?',
			bindings: ['fake-uuid', 'foo', 'bar', 123, 20, 10],
		});

		expect(qb.toSQL(query([]))).toEqual({
			sql: 'SELECT * FROM notes WHERE workspace_id=? LIMIT ? OFFSET ?',
			bindings: ['fake-uuid', 20, 10],
		});
	});

	test('Empty blocks yields nothing', () => {
		expect(
			qb.toSQL(
				qb.line(
					qb.raw('SELECT * FROM notes'),
					qb.where(undefined),
					qb.limit(20),
					qb.offset(10),
				),
			),
		).toEqual({
			sql: 'SELECT * FROM notes LIMIT ? OFFSET ?',
			bindings: [20, 10],
		});

		expect(
			qb.toSQL(
				qb.line(
					qb.raw(undefined, null),
					qb.condition(undefined),
					qb.group(undefined),
					qb.where(undefined),
					qb.limit(undefined),
					qb.offset(undefined),
				),
			),
		).toEqual({
			sql: '',
			bindings: [],
		});
	});
});
