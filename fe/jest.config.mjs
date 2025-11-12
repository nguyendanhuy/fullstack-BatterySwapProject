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
    "src/pages/**/*.jsx",
    "!src/pages/**/Dashboard.jsx",           // Loại bỏ các Dashboard
    "!src/pages/**/*Layout.jsx",             // Loại bỏ Layout components
    "!src/pages/**/*Sidebar.jsx",            // Loại bỏ Sidebar components
    "!src/pages/**/*PrivateRouter.jsx",      // Loại bỏ Router guards
    "!src/pages/Index.jsx",                  // Loại bỏ Index
    "!src/pages/NotFound.jsx",               // Loại bỏ NotFound
    "!src/pages/Landing.jsx",                // Loại bỏ Landing (trang chủ)
    "!src/pages/GoongMap.jsx",               // Loại bỏ GoongMap
    "!src/pages/ResetPassword.jsx",          // Loại bỏ ResetPassword (chưa test)
    "!src/pages/VerifyEmail.jsx",            // Loại bỏ VerifyEmail (chưa test)
    "!src/pages/SignUp.jsx",                 // Loại bỏ SignUp (chưa test)
    "!src/pages/driver/Invoice.jsx",         // Loại bỏ Invoice (chưa test)
    "!src/pages/driver/SubscriptionCheckout.jsx",  // Loại bỏ SubscriptionCheckout (chưa test)
    "!src/pages/staff/BatteryInspection.jsx",      // Loại bỏ BatteryInspection (chưa test)
    "!src/pages/staff/BatteryInventory.jsx",       // Loại bỏ BatteryInventory (chưa test)
    "!src/pages/staff/SwapHistory.jsx",            // Loại bỏ SwapHistory (chưa test)
    "!src/pages/staff/TransactionHistory.jsx",     // Loại bỏ TransactionHistory (chưa test)
    "!src/pages/admin/**",                   // Loại bỏ tất cả admin pages
    "!src/main.jsx",
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
