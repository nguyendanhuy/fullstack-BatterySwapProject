export default {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }]
  ],
  plugins: [
    // Transform import.meta to process.env for Jest compatibility
    function () {
      return {
        visitor: {
          MemberExpression(path) {
            // Transform import.meta.env.VITE_* to process.env.VITE_*
            if (
              path.node.object.type === 'MetaProperty' &&
              path.node.object.meta.name === 'import' &&
              path.node.object.property.name === 'meta'
            ) {
              path.replaceWith({
                type: 'MemberExpression',
                object: { type: 'Identifier', name: 'process' },
                property: path.node.property
              });
            }
          }
        }
      };
    }
  ]
};
