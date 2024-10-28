import { TokenizerStream } from './src/tokenizerStream.ts';

Deno.stdin.readable
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TokenizerStream())
  .pipeTo(
    new WritableStream({
      write(token) {
        console.log(token);
      },
    }),
  );
