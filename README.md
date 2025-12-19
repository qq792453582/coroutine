# @zeta/coroutine

基于 async generator 编写的 coroutine 库。

## Features

- **基于 Generator**: 使用 Generator 函数编写异步逻辑，代码更线性。
- **支持 Promise**: 可以直接 yield Promise。
- **自定义调度**: 通过 `CoroutineYieldScheduler` 支持自定义调度逻辑（如延迟、特定事件触发）。
- **可取消**: 支持协程取消 (`cancel()`)，并能正确清理资源。
- **类型安全**: 提供 `coroutineYield` 辅助函数以获得更好的类型推断。

## Example Usage
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