beforeEach(() => {
    jest.resetModules();
});

const computeStreak = (entries: { createdAt: number | string }[]): number => {
    if (!entries.length) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = new Set(
        entries.map(e => {
            const d = new Date(e.createdAt);
            d.setHours(0, 0, 0, 0);
            return d.getTime();
        })
    );
    let streak = 0;
    let check = today.getTime();
    while (uniqueDays.has(check)) {
        streak++;
        check -= 86400000;
    }
    return streak;
};

describe('streak computation', () => {
    it('returns 0 for no entries', () => {
        expect(computeStreak([])).toBe(0);
    });

    it('returns 1 for entry today', () => {
        expect(computeStreak([{ createdAt: Date.now() }])).toBe(1);
    });

    it('returns 2 for today + yesterday', () => {
        expect(computeStreak([
            { createdAt: Date.now() },
            { createdAt: Date.now() - 86400000 },
        ])).toBe(2);
    });

    it('breaks on gap', () => {
        expect(computeStreak([
            { createdAt: Date.now() },
            { createdAt: Date.now() - 2 * 86400000 },
        ])).toBe(1);
    });

    it('deduplicates same day', () => {
        expect(computeStreak([
            { createdAt: Date.now() },
            { createdAt: Date.now() - 1000 },
        ])).toBe(1);
    });
});
