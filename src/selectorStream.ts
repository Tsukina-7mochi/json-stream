import type { WalkValue } from './parser.ts';

type Path = (string | number)[];

const parseSelector = function (text: string): Path {
  // matches:
  // 1: `.key` -> key
  // 2: `["key"]` -> key
  // 3: `[num]` -> num
  const selectorRegExp = /(?:\.([\w*]+)|\["((?:\"|[^"])*)"\]|\[(\d+)\])/yg;
  const matches = [...text.matchAll(selectorRegExp)];

  if (!matches.length) throw Error(`"${text}" is not a valid selector`);

  const lastMatch = matches[matches.length - 1];
  if (lastMatch.index + lastMatch[0].length !== text.length) {
    throw Error(`"${text}" is not a valid selector`);
  }

  const path = matches.map((match) => {
    return match[1] ?? match[2] ?? parseInt(match[3]);
  });
  return path;
};

const pathMatch = function (path: Path, filterPath: Path): boolean {
  const length = Math.max(path.length, filterPath.length);
  for (let i = 0; i < length; i++) {
    if (filterPath[i] === '*') continue;
    if (filterPath[i] === '**') return true;
    if (path[i] !== filterPath[i]) return false;
  }

  return true;
};

const transformOptions = (selector: string) => {
  const filterPath = parseSelector(selector);
  const transform = (
    value: WalkValue,
    controller: TransformStreamDefaultController<WalkValue>,
  ) => {
    if (pathMatch(value.path, filterPath)) {
      controller.enqueue(value);
    }
  };

  return { transform };
};

export class SelectorStream extends TransformStream<WalkValue, WalkValue> {
  constructor(selector: string) {
    super({ ...transformOptions(selector) });
  }
}
