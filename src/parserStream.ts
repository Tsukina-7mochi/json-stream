import type { Token } from './json.ts';
import { AsyncPeekableIterator } from './asyncPeekableIterator.ts';
import { asyncIteratorToTransformStream } from './asyncIteratorToTransformStream.ts';

type Path = (string | number)[];
export type TreeValueToken = {
  path: Path;
  token: Token;
};

const expect = async function <K extends Token['kind']>(
  iter: AsyncPeekableIterator<Token>,
  tokenKind: K,
): Promise<Token & { kind: K }> {
  const next = await iter.next();
  if (next.done) throw Error('Unexpected EOF.');

  const token = next.value;
  if (token.kind !== tokenKind) {
    throw Error(`Unexpected token ${token.kind}: expected ${tokenKind}.`);
  }
  return token as Token & { kind: K };
};

const parseArray = async function* (
  path: Path,
  iter: AsyncPeekableIterator<Token>,
) {
  const beginArrayToken = await expect(iter, 'begin-array');
  yield { path, token: beginArrayToken };

  if (await iter.nextIf((v) => v.kind === 'end-array')) {
    return;
  }
  yield* parseValue([...path, 0], iter);

  let index = 1;
  while (true) {
    if (await iter.nextIf((v) => v.kind === 'end-array')) break;

    await expect(iter, 'value-separator');
    yield* parseValue([...path, 0], iter);

    index += 1;
  }
};

const parseObject = async function* (
  path: Path,
  iter: AsyncPeekableIterator<Token>,
): AsyncGenerator<TreeValueToken> {
  const beginObjectToken = await expect(iter, 'begin-object');
  yield { path, token: beginObjectToken };

  if (await iter.nextIf((v) => v.kind === 'end-object')) {
    return;
  }

  const propKey = await expect(iter, 'string-literal');
  await expect(iter, 'name-separator');
  yield* parseValue([...path, propKey.value], iter);

  while (true) {
    if (await iter.nextIf((v) => v.kind === 'end-object')) break;

    await expect(iter, 'value-separator');

    const propKey = await expect(iter, 'string-literal');
    await expect(iter, 'name-separator');
    yield* parseValue([...path, propKey.value], iter);
  }
};

const parseValue = async function* (
  path: Path,
  iter: AsyncPeekableIterator<Token>,
): AsyncGenerator<TreeValueToken> {
  const next = await iter.peek();
  if (next.done) throw Error('Unexpected EOF.');
  const nextToken = next.value;

  if (
    nextToken.kind === 'null-literal' || nextToken.kind === 'boolean-literal' ||
    nextToken.kind === 'string-literal' || nextToken.kind === 'number-literal'
  ) {
    iter.next();
    yield {
      path,
      token: nextToken,
    };
  } else if (nextToken.kind === 'begin-array') {
    yield* parseArray(path, iter);
  } else if (nextToken.kind === 'begin-object') {
    yield* parseObject(path, iter);
  }
};

export const parse = async function* (iter: AsyncIterator<Token>) {
  yield* parseValue([], new AsyncPeekableIterator(iter));
};

export const parserStream = () => {
  return asyncIteratorToTransformStream(parse);
};
