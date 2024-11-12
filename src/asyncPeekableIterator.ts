export class AsyncPeekableIterator<T> implements AsyncIterator<T> {
  private iter: AsyncIterator<T>;
  nextValue: IteratorResult<T> | null = null;

  constructor(iter: AsyncIterator<T>) {
    this.iter = iter;
  }

  async next(): Promise<IteratorResult<T>> {
    if (this.nextValue !== null) {
      const nextValue = this.nextValue;
      this.nextValue = null;
      return nextValue;
    }
    return await this.iter.next();
  }

  async nextIf(
    condition: (value: T) => boolean,
  ): Promise<IteratorResult<T> | null> {
    const next = await this.peek();
    if (next.done) return null;

    if (!condition(next.value)) return null;

    return await this.next();
  }

  async peek(): Promise<IteratorResult<T>> {
    if (this.nextValue === null) {
      this.nextValue = await this.iter.next();
    }
    return this.nextValue;
  }
}
