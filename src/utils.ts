import EventEmitter from "node:events";

export const awaitEvent = (emitter: EventEmitter, event: string) => {
  return new Promise((resolve, reject) => {
    const done = event === "error" ? reject : resolve;
    emitter.once(event, done);
  });
};

export function raceTimeout<T>(promise: Promise<T>, timeout: number, onTimeout?: () => void): Promise<T | undefined> {
  let promiseResolve: ((value: T | undefined) => void) | undefined;

  const timer = setTimeout(() => {
    promiseResolve?.(undefined);
    onTimeout?.();
  }, timeout);

  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise<T | undefined>((resolve) => (promiseResolve = resolve)),
  ]);
}

export function sleep(time: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, time));
}

class BailError extends Error {
  constructor(public cause?: Error) {
    super("Bail");
  }
}

export const retry = async <T>(
  task: (bail: (err?: Error) => never) => Promise<T>,
  options: {
    delay: number;
    retries: number;
    onFailedAttempt?: (error: any) => void;
    timeout?: number;
  },
): Promise<T> => {
  const { delay, retries, onFailedAttempt, timeout } = options;

  const bail = (err?: Error) => {
    throw new BailError(err);
  };

  try {
    if (timeout) {
      const result = await raceTimeout(task(bail), timeout || 0);
      if (result === undefined) {
        throw new Error("Timeout");
      }
      return result;
    }
    return task(bail);
  } catch (error) {
    if (error instanceof BailError) {
      if (error.cause) {
        throw error.cause;
      }
      throw error;
    }
    if (retries === 0) {
      throw error;
    }
    if (onFailedAttempt) {
      onFailedAttempt(error);
    }
    await sleep(delay);
    return retry(task, { delay, retries: retries - 1, onFailedAttempt, timeout });
  }
};
