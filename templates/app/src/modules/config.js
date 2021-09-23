require('dotenv/config');

export const logging = {
  level: process.env.<%= package.configPrefix %>_LOG_LEVEL || 'info',
  timestampFormat: process.env.<%= package.configPrefix %>_LOG_TIME_FMT
};

export default {
  logging
};
