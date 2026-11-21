module.exports = {
  testEnvironment: 'jsdom',
  roots: [
    '<rootDir>/components',
    '<rootDir>/containers',
    '<rootDir>/utils',
    '<rootDir>/tests',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/setupTests.js'],
  moduleNameMapper: {
    '^components/(.*)$': '<rootDir>/components/$1',
    '^containers/(.*)$': '<rootDir>/containers/$1',
    '^utils/(.*)$': '<rootDir>/utils/$1',
    '^sass/(.*)$': '<rootDir>/sass/$1',
    '^images/(.*)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '\\.(css|scss|sass)$': '<rootDir>/tests/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|webp|ico|mp4|woff2?|ttf|eot)$':
      '<rootDir>/tests/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },
  testPathIgnorePatterns: ['/node_modules/', '/build/'],
  clearMocks: true,
};
