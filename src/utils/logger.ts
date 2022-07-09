import * as winston from 'winston'; // Logging

const myCustomLevels = {
  levels: {
    error: 0,
    info: 1,
  },
  colors: {
    error: 'red',
    info: 'white',
  },
};

winston.addColors(myCustomLevels.colors);

// Setup winston logger
export const logger = winston.createLogger({
  levels: myCustomLevels.levels,
  // Simple line-by-line output
  format: winston.format.combine(winston.format.simple()),
  transports: [
    // Print to console
    new winston.transports.Console(),
    // Error outputs
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // + Output to generator logfile
    new winston.transports.File({ filename: 'index.log' }),
  ],
});
