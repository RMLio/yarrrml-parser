const JSLogger = require('js-logger');
JSLogger.useDefaults();

var yarrrmlParser___Logger_log = [];

class Logger {

    static trace(arg) { Logger._log(JSLogger.TRACE.name, arg) };
    static debug(arg) { Logger._log(JSLogger.DEBUG.name, arg) };
    static info(arg) { Logger._log(JSLogger.INFO.name, arg) };
    static log(arg) { Logger._log(JSLogger.INFO.name, arg) };
    static warn(arg) { Logger._log(JSLogger.WARN.name, arg) };
    static error(arg) { Logger._log(JSLogger.ERROR.name, arg) };

    /**
     * Get all logged messages
     * @return {array}
     */
    static getAll() {
        return yarrrmlParser___Logger_log;
    }

    /**
     * Returns true if message is logged with the given leven
     * @param {string} level
     * @return {boolean}
     */
    static has(level = '') {
        level = Logger._fixLevel(level);
        return yarrrmlParser___Logger_log.some(l => l.level == level);
    }

    /**
     * Clear all logs
     */
    static clear() {
        yarrrmlParser___Logger_log = [];
    }

    /**
     * Log with given Level
     * @param {string} level
     * @param {any} arg
     * @private
     */
    static _log(level = '', arg) {
        switch (level) {
            case JSLogger.TRACE.name:
                JSLogger.trace(arg);
                break;
            case JSLogger.DEBUG.name:
                JSLogger.debug(arg);
                break;
            case JSLogger.INFO.name:
                JSLogger.info(arg);
                break;
            case JSLogger.WARN.name:
                JSLogger.warn(arg);
                break;
            case JSLogger.ERROR.name:
                JSLogger.error(arg);
                break;

            default:
                level = 'INFO';
                JSLogger.warn(`Undefined logging type "${level}" given. Message: ${arg.toString()}`);
                break;
        }
        yarrrmlParser___Logger_log.push({level, message: arg.toString()})
    }

    static _fixLevel(level = '') {
        level = level.toUpperCase();
        if (level == 'WARNING') level = 'WARN';
        if (level == 'LOG') level = 'INFO';
        return level;
    }
}

module.exports = Logger;
