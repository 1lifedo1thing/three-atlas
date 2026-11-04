module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4214/'],
      startServerCommand: 'npm run preview -- --port 4214',
      startServerReadyPattern: 'Local:',
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--headless --use-angle=metal --enable-gpu',
        formFactor: 'mobile',
        throttlingMethod: 'simulate',
        throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 4 },
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95, aggregationMethod: 'pessimistic' }],
        'categories:accessibility': ['error', { minScore: 0.95, aggregationMethod: 'pessimistic' }],
        'categories:best-practices': ['error', { minScore: 0.95, aggregationMethod: 'pessimistic' }],
        'categories:seo': ['error', { minScore: 0.95, aggregationMethod: 'pessimistic' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000, aggregationMethod: 'pessimistic' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.02, aggregationMethod: 'pessimistic' }],
        'total-blocking-time': ['error', { maxNumericValue: 100, aggregationMethod: 'pessimistic' }],
      },
    },
  },
};
