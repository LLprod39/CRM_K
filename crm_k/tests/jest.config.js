const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: '../',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/setup.js'],
  testEnvironment: 'node',
  testMatch: [
    '<rootDir>/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.spec.{js,jsx,ts,tsx}'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
  },
  collectCoverageFrom: [
    '../src/**/*.{js,jsx,ts,tsx}',
    '!../src/**/*.d.ts',
    '!../src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 15000, // Увеличиваем таймаут для стабильности
  reporters: [
    ['<rootDir>/reporters/russian-reporter.js', {}]
  ],
  verbose: true,
  // Настройки для лучшего вывода
  displayName: 'CRM System Tests',
  testSequencer: '@jest/test-sequencer',
  // Отключаем стандартный вывод для использования только нашего репортера
  silent: false,
  // Настройки для параллельного выполнения
  maxWorkers: 1, // Запускаем тесты последовательно для стабильности
  // Настройки для лучшего логирования
  logHeapUsage: false,
  // Настройки для обработки ошибок
  errorOnDeprecated: true,
  // Настройки для отчетов
  notify: false,
  notifyMode: 'failure-change'
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)