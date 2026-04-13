describe('logger', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'info').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('logger.error always calls console.error', () => {
        const { logger } = require('../service/logger');
        logger.error('test error');
        expect(console.error).toHaveBeenCalledWith('test error');
    });

    it('logger.warn always calls console.warn', () => {
        const { logger } = require('../service/logger');
        logger.warn('test warning');
        expect(console.warn).toHaveBeenCalledWith('test warning');
    });

    it('logger.debug calls console.log in dev mode', () => {
        (global as Record<string, unknown>).__DEV__ = true;
        const { logger } = require('../service/logger');
        logger.debug('debug msg');
        expect(console.log).toHaveBeenCalledWith('debug msg');
    });
});
