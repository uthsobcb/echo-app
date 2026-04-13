describe('config', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('provides a default API_BASE_URL', () => {
        const { config } = require('../service/config');
        expect(config.API_BASE_URL).toBe('https://echo-next.vercel.app/api');
    });

    it('has Google OAuth fields as strings', () => {
        const { config } = require('../service/config');
        expect(typeof config.GOOGLE_IOS_CLIENT_ID).toBe('string');
        expect(typeof config.GOOGLE_ANDROID_CLIENT_ID).toBe('string');
        expect(typeof config.GOOGLE_WEB_CLIENT_ID).toBe('string');
    });
});
