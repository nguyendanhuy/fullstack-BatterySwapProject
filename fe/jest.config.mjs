export default {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg|webp|ico)$": "<rootDir>/src/__mocks__/fileMock.js",
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
    // Cho phép BatteryInspection.jsx có threshold thấp hơn do hạn chế test Radix UI Select
    "./src/pages/staff/BatteryInspection.jsx": {
      branches: 75,
      functions: 75,
      lines: 82,
      statements: 82,
    },
  },
};
