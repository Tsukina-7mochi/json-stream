import type { Token } from './json.ts';

const numberRegexp = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+\-]?\d+)?/;
const partialRevNumberRegexp = /^(\d+[+\-]?[eE])?(\d+\.)?((\d*[1-9])|0)-?$/;

const parseChunk = function (chunk: string): [Token | null, string] {
  if (chunk.length === 0) return [null, chunk];

  if (chunk[0] === '[') {
    return [{ kind: 'begin-array' }, chunk.slice(1)];
  }
  if (chunk[0] === ']') {
    return [{ kind: 'end-array' }, chunk.slice(1)];
  }
  if (chunk[0] === '{') {
    return [{ kind: 'begin-object' }, chunk.slice(1)];
  }
  if (chunk[0] === '}') {
    return [{ kind: 'end-object' }, chunk.slice(1)];
  }
  if (chunk[0] === ':') {
    return [{ kind: 'name-separator' }, chunk.slice(1)];
  }
  if (chunk[0] === ',') {
    return [{ kind: 'value-separator' }, chunk.slice(1)];
  }

  if (chunk.startsWith('null')) {
    return [{ kind: 'null-literal' }, chunk.slice(4)];
  }
  if ('null'.startsWith(chunk)) {
    return [null, chunk];
  }

  if (chunk.startsWith('true')) {
    return [{ kind: 'boolean-literal', value: true }, chunk.slice(4)];
  }
  if ('true'.startsWith(chunk)) {
    return [null, chunk];
  }

  if (chunk.startsWith('false')) {
    return [{ kind: 'boolean-literal', value: false }, chunk.slice(5)];
  }
  if ('false'.startsWith(chunk)) {
    return [null, chunk];
  }

  if (chunk[0] === '"') {
    const endIndex = chunk.slice(1).match(/(?<!\\)"/)?.index;
    if (typeof endIndex === 'number') {
      return [
        { kind: 'string-literal', value: chunk.slice(1, endIndex + 1) },
        chunk.slice(endIndex + 2),
      ];
    } else {
      return [null, chunk];
    }
  }

  if (partialRevNumberRegexp.test([...chunk].reverse().join())) {
    return [null, chunk];
  }
  const numberMatch = chunk.match(numberRegexp);
  if (numberMatch?.[0]) {
    return [{
      kind: 'number-literal',
      value: Number(numberMatch[0]),
    }, chunk.slice(numberMatch[0].length)];
  }

  throw Error(`Unexpected chunk: ${chunk}`);
};

const transformOptions = function () {
  let chunk: string = '';

  const transform = function (
    currentChunk: string,
    controller: TransformStreamDefaultController<Token>,
  ) {
    chunk = chunk + currentChunk;

    while (true) {
      chunk = chunk.trimStart();

      const [token, newChunk] = parseChunk(chunk);
      chunk = newChunk;

      if (token) {
        controller.enqueue(token);
      } else {
        break;
      }
    }
  };
  const flush = function (controller: TransformStreamDefaultController) {
    transform('', controller);
    if (chunk.length > 0) {
      throw Error('Unexpected EOF');
    }
  };

  return { transform, flush };
};

export class TokenizerStream extends TransformStream<string, Token> {
  constructor() {
    super({
      ...transformOptions(),
    });
  }
}
