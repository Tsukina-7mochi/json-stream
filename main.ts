import { TokenizerStream } from './src/tokenizerStream.ts';
import { parserStream, type TreeValueToken } from './src/parserStream.ts';
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

await (await Deno.open(Deno.args[0])).readable
  .pipeThrough(new TextDecoderStream())
  // .pipeThrough(splitToCharactersStream())
  .pipeThrough(new TokenizerStream())
  .pipeThrough(parserStream())
  .pipeThrough(new SelectorStream(Deno.args[1]))
  .pipeTo(consoleLogWriter());
