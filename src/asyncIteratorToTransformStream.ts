export const asyncIteratorToTransformStream = function <In, Out>(
  transformer: (iter: AsyncIterator<In>) => AsyncIterable<Out>,
): TransformStream<In, Out> {
  const inputBufferStream = new TransformStream<In, In>();
  const inputWriter = inputBufferStream.writable.getWriter();

  const queue: Out[] = [];
  let endPromiseResolve: (() => void) | undefined;
  const endPromise = new Promise<void>((resolve) => {
    endPromiseResolve = resolve;
  });

  (async () => {
    for await (const out of transformer(inputBufferStream.readable.values())) {
      queue.push(out);
    }
    endPromiseResolve!();
  })();

  const transform = async (
    input: In,
    controller: TransformStreamDefaultController,
  ) => {
    while (queue.length > 0) {
      controller.enqueue(queue.shift());
    }

    await inputWriter.write(input);
  };
  const flush = async (controller: TransformStreamDefaultController) => {
    while (queue.length > 0) {
      controller.enqueue(queue.shift());
    }

    inputWriter.close();
    await endPromise;
  };

  return new TransformStream({
    transform,
    flush,
  });
};
