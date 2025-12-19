Example Usage
```typescript
import { CoroutineCancelError, coroutineYield, CoroutineYieldScheduler, startCoroutine } from "@zeta/coroutine";

// Helper to create a delay using CoroutineYieldScheduler
function delay(ms: number) {
	return new CoroutineYieldScheduler<void>((resolve) => {
		const id = setTimeout(resolve, ms);
		return () => clearTimeout(id);
	});
}

function* myGenerator() {
	console.log("Coroutine started");

	// Yield a Promise using coroutineYield helper to get the type-safe result
	const value = yield* coroutineYield(Promise.resolve(10));
	console.log("Yielded Promise value:", value); // 10

	// Yield a custom scheduler (delay)
	console.log("Waiting for 100ms...");
	yield delay(100);
	console.log("Resumed after delay");

	return "Done";
}

const co = startCoroutine(myGenerator());

// Handle completion
co.then((result) => {
	console.log("Coroutine finished with result:", result);
}).catch((err) => {
	if (err instanceof CoroutineCancelError) {
		console.log("Coroutine cancelled");
	} else {
		console.error("Coroutine error:", err);
	}
});

// Example of cancellation
// setTimeout(() => {
// 	co.cancel();
// }, 50);
```