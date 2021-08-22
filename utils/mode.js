const mode = process.env.NODE_ENV;

const isDev = mode === 'development';
const isProd = mode === 'production';

module.exports = {
  mode,
  isDev,
  isProd,
};
