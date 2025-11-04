export default {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass|jpg|jpeg|png|gif|svg)$": "identity-obj-proxy",
  },

  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],

  // ⚙️ Bật coverage & ngưỡng 80%
  collectCoverage: true,
  collectCoverageFrom: [
    "src/pages/SignUp.jsx",
    "src/**/*.jsx",
    "!src/main.jsx",
    "!src/**/index.jsx",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
