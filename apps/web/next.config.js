/** @type {import('next').NextConfig} */
const nextConfig = {
  // These are workspace packages shipped as raw TS source (no build step
  // yet) -- this tells Next's bundler to transpile them instead of
  // expecting compiled JS in node_modules.
  transpilePackages: [
    "@shiplog/core",
    "@shiplog/connectors-manual",
    "@shiplog/connectors-slack",
    "@shiplog/connectors-email",
  ],
};

module.exports = nextConfig;
