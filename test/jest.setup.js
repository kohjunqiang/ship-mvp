jest.setTimeout(30000); // Set default timeout to 30 seconds

// Suppress console.log during tests unless there's an error
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error,
};
