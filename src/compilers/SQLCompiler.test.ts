import { PreparedValue } from '../core/PreparedValue';
import { Query } from '../core/Query';
import { RawSegment } from '../core/RawSegment';
import { SQLCompiler } from './SQLCompiler';

test('Compiler can process linear queries', () => {
	const compiler = new SQLCompiler();

	expect(
		compiler.compile(
			new Query(
				new RawSegment('SELECT *'),
				new RawSegment(' '),
				new RawSegment('FROM foo'),
				new RawSegment(' '),
				new RawSegment('WHERE x='),
				new PreparedValue(1),
				new RawSegment(' '),
				new RawSegment('LIMIT'),
				new RawSegment(' '),
				new PreparedValue(2),
				new RawSegment(' '),
				new RawSegment('OFFSET'),
				new RawSegment(' '),
				new PreparedValue(3),
			),
		),
	).toEqual({
		command: 'SELECT * FROM foo WHERE x=? LIMIT ? OFFSET ?',
		bindings: [1, 2, 3],
	});
});

test('Compiler can process nested queries', () => {
	const compiler = new SQLCompiler();

	expect(
		compiler.compile(
			new Query(
				new RawSegment('SELECT *'),
				new RawSegment(' '),
				new RawSegment('FROM foo'),
				new RawSegment(' '),
				new RawSegment('WHERE x='),
				new PreparedValue(1),
				new RawSegment(' AND '),
				new Query(
					new RawSegment('('),
					new RawSegment('SELECT y FROM bar WHERE n='),
					new PreparedValue('foo'),
					new RawSegment(' OR '),
					new Query(new RawSegment('n2='), new PreparedValue('bar')),
					new RawSegment(')'),
				),
				new RawSegment(' '),
				new RawSegment('LIMIT'),
				new RawSegment(' '),
				new PreparedValue(2),
				new RawSegment(' '),
				new RawSegment('OFFSET'),
				new RawSegment(' '),
				new PreparedValue(3),
			),
		),
	).toEqual({
		command:
			'SELECT * FROM foo WHERE x=? AND (SELECT y FROM bar WHERE n=? OR n2=?) LIMIT ? OFFSET ?',
		bindings: [1, 'foo', 'bar', 2, 3],
	});
});
