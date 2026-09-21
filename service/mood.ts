import { ExpressionName } from '@/component/EchoAvatar';

export function moodToExpression(mood: string): ExpressionName {
    const m = (mood ?? '').toLowerCase();
    if (m.includes('happy') || m.includes('joy') || m.includes('great')) return 'happy';
    if (m.includes('sad') || m.includes('down') || m.includes('depress')) return 'sad';
    if (m.includes('calm') || m.includes('peace') || m.includes('relax')) return 'calm';
    if (m.includes('excit') || m.includes('energe')) return 'excited';
    if (m.includes('curious') || m.includes('wonder')) return 'curious';
    if (m.includes('proud') || m.includes('achiev')) return 'proud';
    if (m.includes('tire') || m.includes('sleep') || m.includes('exhaust')) return 'sleepy';
    return 'calm';
}
