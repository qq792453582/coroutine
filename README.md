Example Usage
```typescript
import { clearImmediate } from "node:timers";

const waitForTick = new CoroutineYieldScheduler((action) => {
	const immediate = setImmediate(() => {
		console.log("waitForTick immediate start");
		action();
		console.log("waitForTick immediate end");
	});
	
	return () => {
		clearImmediate(immediate);
	};
});

function* createGenerator() {
	console.log("waitForTick start");
	yield waitForTick;
	console.log("waitForTick end");
	
	console.log("1111");
	yield testWaitResult("1111", 1);
	console.log("2222");
	yield testWaitResult("2222", 2);
	console.log("3333");
	yield testWaitResult("3333", 3);
	console.log("createGenerator2");
	yield* createGenerator2();
	
	console.log("createGenerator end");
	return testWaitResult("end", "end");
}

function* createGenerator2() {
	console.log("4444");
	yield testWaitResult("4444", 4);
	console.log("5555");
	yield testWaitResult("5555", 5);
	console.log("6666");
	yield testWaitResult("6666", 6);
	console.log("createGenerator2 end");
	
}

const co = startCoroutine(createGenerator());
(async function test() {
	try {
		await co;
	}
	catch (e) {
		console.error(e);
	}
	
})();

waitForSeconds(2.5).then(() => co.cancel());
```