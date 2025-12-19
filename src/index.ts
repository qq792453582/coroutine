import "@ungap/with-resolvers";

export class CoroutineCancelError extends Error {
    constructor() {
        super("Coroutine cancelled");
        this.name = "CoroutineCancelError";
    }
}

export class CoroutineYieldScheduler<T = void> {
    constructor(private work: (project: (value: T) => void) => (() => void)) {
    }

    public schedule(project: (value: T) => void): (() => void) {
        return this.work(project);
    }
}

export type CoroutineYieldResult<T> = T extends CoroutineYieldScheduler<infer U> ? U: Awaited<T>;

export type Coroutine<T> = Promise<T> & {
    cancel: () => void
}

export function startCoroutine<T>(routine: Generator<unknown, T, unknown> | AsyncGenerator<unknown, T, unknown>): Coroutine<T> {
    let completed = false;
    let cancelSchedule: (() => void) | undefined;

    const { promise, resolve, reject } = Promise.withResolvers<T>();

    (async function continueCoroutine(value: unknown = undefined) {
        try {
            if (cancelSchedule) {
                cancelSchedule();
                cancelSchedule = undefined;
            }

            if (completed) {
                return;
            }

            const result = await routine.next(value);

            if (completed) {
                return;
            }

            if (result.done) {
                completed = true;
                resolve(result.value);
                return;
            }

            if (result.value instanceof CoroutineYieldScheduler) {
                cancelSchedule = result.value.schedule(continueCoroutine);
                return;
            }

            continueCoroutine(await result.value);
        }
        catch (e) {
            completed = true;
            reject(e);
        }
    })();

    function cancel() {
        if (completed) {
            return;
        }
        completed = true;

        if (cancelSchedule) {
            cancelSchedule();
            cancelSchedule = undefined;
        }

        reject(new CoroutineCancelError());
    }

    return Object.assign(promise, { cancel });
}


export function* coroutineYield<T>(yieldValue: T) {
    const value: unknown = yield yieldValue
    return value as CoroutineYieldResult<T>;
}