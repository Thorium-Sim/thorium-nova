let perf: Performance | null = null,
  start = Date.now();

// use global browser performance module
// for node create a polyfill
if (!global) {
  perf = window.performance;
} else {
  perf = {
    now() {
      return Date.now() - start;
    },
  } as Performance;
}

export default perf as Performance;
