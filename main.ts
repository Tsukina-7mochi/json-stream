import { TokenizerStream } from './src/tokenizerStream.ts';

const splitToCharactersStream = () => {
  return new TransformStream({
    transform(chunk, controller) {
      for (const c of [...chunk]) {
        controller.enqueue(c);
      }
    },
  });
};

Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  // .pipeThrough(splitToCharactersStream())
  .pipeThrough(new TokenizerStream())
  .pipeTo(
    new WritableStream({
      write(token) {
        console.log(token);
      },
    }),
  );
