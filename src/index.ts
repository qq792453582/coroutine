import "@ungap/with-resolvers";

export class CoroutineCancelledError extends Error {
    constructor() {
        super("Coroutine cancelled");
    }
}

export class CoroutineYieldScheduler {
    constructor(private work: (project: () => void) => (() => void)) {
    }

    public schedule(action: () => void): (() => void) {
        return this.work(action);
    }
}

export type Coroutine<T> = Promise<T> & {
    cancel: () => void
}

export function startCoroutine<T>(routine: Generator<any, T, void> | AsyncGenerator<any, T, void>): Coroutine<T> {
    let completed = false;
    let cancelSchedule: (() => void) | undefined;

    const { promise, resolve, reject } = Promise.withResolvers<T>();

    (async function continueCoroutine() {
        try {
            if (cancelSchedule) {
                cancelSchedule();
                cancelSchedule = undefined;
            }

            const result = await routine.next();

            if (completed) {
                return;
            }

            if (result.done) {
                completed = true;
                resolve(result.value);
                return;
            }

            if (result.value instanceof CoroutineYieldScheduler) {
                cancelSchedule = result.value.schedule(() => continueCoroutine());
                return;
            }

            await result.value;
            if (completed) {
                return;
            }
            return continueCoroutine();
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

        reject(new CoroutineCancelledError());
    }

    return Object.assign(promise, { cancel });
}