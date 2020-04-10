module.exports = {
  presets: [
    [
      "@babel/env",
      {
        targets: {
          node: "8",
        },
        useBuiltIns: "usage",
        corejs: {
          version: 3,
          // proposals: true,
        },
      },
    ],
  ],
};
