import type { Token } from './json.ts';

const transformOptions = function () {
  let chunk: string = '';

  const numberRegexp = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+\-]?\d+)?/;
  const canBeNumber = (text: string) => numberRegexp.test(text);

  const transform = function (
    currentChunk: string,
    controller: TransformStreamDefaultController<Token>,
  ) {
    chunk = chunk + currentChunk;

    while (true) {
      chunk = chunk.trimStart();

      if (chunk.length === 0) {
        break;
      } else if (chunk[0] === '[') {
        controller.enqueue({ kind: 'begin-array' });
        chunk = chunk.slice(1);
      } else if (chunk[0] === ']') {
        controller.enqueue({ kind: 'end-array' });
        chunk = chunk.slice(1);
      } else if (chunk[0] === '{') {
        controller.enqueue({ kind: 'begin-object' });
        chunk = chunk.slice(1);
      } else if (chunk[0] === '}') {
        controller.enqueue({ kind: 'end-object' });
        chunk = chunk.slice(1);
      } else if (chunk[0] === ':') {
        controller.enqueue({ kind: 'name-separator' });
        chunk = chunk.slice(1);
      } else if (chunk[0] === ',') {
        controller.enqueue({ kind: 'value-separator' });
        chunk = chunk.slice(1);
      } else if (chunk.startsWith('null')) {
        controller.enqueue({ kind: 'null-literal' });
        chunk = chunk.slice(4);
      } else if (chunk.startsWith('true')) {
        controller.enqueue({ kind: 'boolean-literal', value: true });
        chunk = chunk.slice(4);
      } else if (chunk.startsWith('false')) {
        controller.enqueue({ kind: 'boolean-literal', value: false });
        chunk = chunk.slice(5);
      } else if (chunk[0] === '"') {
        const endIndex = chunk.indexOf('"', 1);
        if (endIndex > 0) {
          controller.enqueue({
            kind: 'string-literal',
            value: chunk.slice(1, endIndex),
          });
          chunk = chunk.slice(endIndex + 1);
        } else {
          // string literal does not ends in this chunk
          break;
        }
      } else if (canBeNumber(chunk)) {
        const value = chunk.match(numberRegexp)?.[0]!;
        if (value.length === chunk.length) {
          // number literal does not ends in this chunk
          break;
        }
        chunk = chunk.slice(value.length);
      } else {
        throw Error(`Undefined character ${chunk}`);
      }
    }
  };
  const flush = function () {
    if (chunk.length > 0) {
      throw Error('Undefined EOF');
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
