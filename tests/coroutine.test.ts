import { afterEach, describe, expect, it, vi } from "vitest";
import { CoroutineCancelError, CoroutineYieldScheduler, coroutineYield, startCoroutine } from "../src";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllTimers();
});

describe("startCoroutine", () => {
  it("resolves yielded promise values", async () => {
    const coroutine = startCoroutine((function* () {
      const value = yield* coroutineYield(Promise.resolve(3));
      return value + 1;
    })());

    await expect(coroutine).resolves.toBe(4);
  });

  it("supports CoroutineYieldScheduler scheduling", async () => {
    vi.useFakeTimers();

    const coroutine = startCoroutine((function* () {
      yield new CoroutineYieldScheduler<void>((project) => {
        const id = setTimeout(() => project(), 5);
        return () => clearTimeout(id);
      });
    })());

    vi.runAllTimers();
    await expect(coroutine).resolves.toBeUndefined();
  });

  it("allows cancellation before scheduled resume", async () => {
    vi.useFakeTimers();

    const coroutine = startCoroutine((function* () {
      yield new CoroutineYieldScheduler<void>((project) => {
        const id = setTimeout(() => project(), 50);
        return () => clearTimeout(id);
      });
    })());

    coroutine.cancel();
    vi.runAllTimers();

    await expect(coroutine).rejects.toBeInstanceOf(CoroutineCancelError);
  });

  it("propagates thrown errors", async () => {
    const expected = new Error("boom");

    const coroutine = startCoroutine((function* () {
      yield Promise.reject(expected);
    })());

    await expect(coroutine).rejects.toBe(expected);
  });

  it("coroutineYield unwraps yielded promise", async () => {
    const coroutine = startCoroutine((function* () {
      const value = yield* coroutineYield(Promise.resolve(7));
      return value + 1;
    })());

    await expect(coroutine).resolves.toBe(8);
  });
});
