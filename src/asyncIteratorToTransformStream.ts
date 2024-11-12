export const asyncIteratorToTransformStream = function <I, O>(
  transformer: (iter: AsyncIterator<I>) => AsyncIterable<O>,
): TransformStream<I, O> {
  const inputBufferStream = new TransformStream<I, I>();
  const inputWriter = inputBufferStream.writable.getWriter();

  let controller: TransformStreamDefaultController<O> | null = null;
  const queue: O[] = [];
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
    input: I,
    newController: TransformStreamDefaultController,
  ) => {
    controller = newController;
    while (queue.length > 0) {
      controller.enqueue(queue.shift());
    }

    await inputWriter.write(input);
  };
  const flush = async (newController: TransformStreamDefaultController) => {
    controller = newController;
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
