module.exports = {
  testTimeout: 30000,
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'db/**/*.js',
    '!db/server.js', // entry point, covered in integration tests
    '!db/seed.js',
    '!db/config/db.js', // external dependency
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/testing/setup.js'],
  testMatch: ['**/testing/**/*.test.js'],
  verbose: true,
};
