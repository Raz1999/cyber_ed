// Mock for expo/src/winter/ImportMetaRegistry
// Prevents Jest 30's "import outside scope" error when Expo's lazy global getter fires
module.exports = {
  ImportMetaRegistry: {
    url: 'http://localhost/',
  },
};
