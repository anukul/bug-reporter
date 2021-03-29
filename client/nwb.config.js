require('dotenv/config');
const getenv = require('getenv');

const config = nwb => {
  return {
    type: 'react-app',
    webpack: {
      define: {
        'process.env.API_URL': JSON.stringify(getenv.string('API_URL')),
        'process.env.RECAPTCHA_KEY': JSON.stringify(getenv.string('RECAPTCHA_KEY'))
      },
      extractCSS: false,
      config(config) {
        config.output.filename = 'main.js'
        config.optimization.splitChunks = {
          cacheGroups: {
            default: false,
          },
        }
        config.optimization.runtimeChunk = false
        return config
      }
    }
  }
}

module.exports = config;
