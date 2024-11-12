import { TokenizerStream } from './src/tokenizerStream.ts';
import { parse, type TreeValueToken } from './src/parser.ts';
import { asyncIteratorToTransformStream } from './src/asyncIteratorToTransformStream.ts';
import { SelectorStream } from './src/selectorStream.ts';

const splitToCharactersStream = () => {
  return new TransformStream({
    transform(chunk, controller) {
      for (const c of [...chunk]) {
        controller.enqueue(c);
      }
    },
  });
};

const consoleLogWriter = () => {
  return new WritableStream<TreeValueToken>({
    write(value) {
      console.log(`.${value.path.join('.')}`, value.token);
    },
  });
};

await Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(splitToCharactersStream())
  .pipeThrough(new TokenizerStream())
  .pipeThrough(asyncIteratorToTransformStream(parse))
  .pipeThrough(new SelectorStream('.fmt.*'))
  .pipeTo(consoleLogWriter());
