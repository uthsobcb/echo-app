import { useStorage } from '@/context/StorageContext';
import { api } from '@/service/api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const chartWidth = width - 80;

type TimeRange = 'week' | 'month' | 'year';

const TOPIC_COLORS = ['#4F6BFF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

function TimeRangeSelector({ selected, onSelect }: { selected: TimeRange; onSelect: (r: TimeRange) => void }) {
    const options: TimeRange[] = ['week', 'month', 'year'];
    return (
        <View style={s.tabRow}>
            {options.map((o) => (
                <TouchableOpacity
                    key={o}
                    onPress={() => onSelect(o)}
                    style={[s.tab, selected === o && s.tabActive]}
                >
                    <Text style={[s.tabText, selected === o && s.tabTextActive]}>{o.charAt(0).toUpperCase() + o.slice(1)}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function StatCard({ icon, title, value, subtitle, color }: { icon: React.ReactNode; title: string; value: string; subtitle: string; color: string }) {
    return (
        <View style={s.statCard}>
            <View style={[s.statIcon, { backgroundColor: color + '18' }]}>{icon}</View>
            <Text style={s.statLabel}>{title}</Text>
            <Text style={s.statValue}>{value}</Text>
            <Text style={s.statSub}>{subtitle}</Text>
        </View>
    );
}

export default function Insights() {
    const { appMode } = useStorage();
    const [timeRange, setTimeRange] = useState<TimeRange>('week');
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, [timeRange]);

    const loadInsights = async () => {
        if (appMode !== 'api') {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const result = await api.insights.get(timeRange);
            setData(result);
        } catch (e) {
            console.error('[Insights] Failed to load', e);
        } finally {
            setLoading(false);
        }
    };

    // Build chart data from API response or fall back to empty
    const stats = data?.stats || {};
    const moodTimeline: any[] = data?.moodTimeline || [];
    const writingTrend: any[] = data?.writingTrend || [];
    const weeklyEntries: any[] = data?.weeklyEntries || [];
    const topTopics: any[] = data?.topTopics || [];
    const commonWords: any[] = data?.commonWords || [];
    const activityCalendar: any[] = data?.activityCalendar || [];
    const aiInsights: string[] = data?.aiInsights || [];
    const trendComparison: string = data?.writingTrendComparison || '';

    const moodColors: Record<number, string> = { 1: '#EF4444', 2: '#F59E0B', 3: '#FCD34D', 4: '#84CC16', 5: '#22C55E' };
    const moodScoreToEmoji: Record<string, string> = { happy: '😊', sad: '😢', neutral: '😐', excited: '🤩', anxious: '😰', angry: '😡' };

    const moodBarData = moodTimeline.map((item) => ({
        value: item.score || 3,
        label: item.day,
        frontColor: moodColors[item.score] || '#84CC16',
        topLabelComponent: () => (
            <Text style={{ fontSize: 14, marginBottom: 2 }}>
                {moodScoreToEmoji[item.mood?.toLowerCase()] || '😐'}
            </Text>
        ),
    }));

    const lineData = writingTrend.map((item) => ({ value: item.count, label: item.label }));

    const weeklyBarData = weeklyEntries.map((item, i) => ({
        value: item.count,
        label: item.label,
        frontColor: i % 2 === 0 ? '#93C5FD' : '#4F6BFF',
    }));

    const pieData = topTopics.map((item, i) => ({
        value: item.count,
        color: TOPIC_COLORS[i % TOPIC_COLORS.length],
        text: item.topic,
    }));
    const totalTopicCount = topTopics.reduce((s, t) => s + t.count, 0);

    // Calendar
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const activitySet = new Set(activityCalendar.filter(d => d.hasEntry).map(d => new Date(d.date).getDate()));

    const calendarRows: (number | null)[][] = [];
    let cells: (number | null)[] = Array(firstDayOfMonth).fill(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push(d);
        if (cells.length === 7) { calendarRows.push(cells); cells = []; }
    }
    if (cells.length) { while (cells.length < 7) cells.push(null); calendarRows.push(cells); }

    return (
        <SafeAreaView style={s.safe}>
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.pageTitle}>Insights</Text>
                    <Text style={s.pageSub}>Track your journaling journey</Text>
                </View>

                {/* Time Range */}
                <View style={s.px}>
                    <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />
                </View>

                {loading ? (
                    <View style={s.loader}>
                        <ActivityIndicator size="large" color="#4F6BFF" />
                        <Text style={s.loaderText}>Loading insights…</Text>
                    </View>
                ) : (
                    <>
                        {/* Stats */}
                        <View style={s.px}>
                            <View style={s.statsRow}>
                                <StatCard icon={<Ionicons name="document-text" size={20} color="#4F6BFF" />} title="Total Entries" value={`${stats.totalEntries ?? '—'}`} subtitle="This period" color="#4F6BFF" />
                                <StatCard icon={<MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />} title="Current Streak" value={`${stats.currentStreak ?? '—'}`} subtitle="Days" color="#F59E0B" />
                            </View>
                            <View style={[s.statsRow, { marginTop: 10 }]}>
                                <StatCard icon={<Feather name="clock" size={20} color="#8B5CF6" />} title="Avg. Length" value={`${stats.avgWordCount ?? '—'}`} subtitle="Words/entry" color="#8B5CF6" />
                                <StatCard icon={<Ionicons name="trending-up" size={20} color="#10B981" />} title="Best Streak" value={`${stats.bestStreak ?? '—'}`} subtitle="Days" color="#10B981" />
                            </View>
                        </View>

                        {/* Mood Tracker */}
                        {moodBarData.length > 0 && (
                            <View style={s.px}>
                                <View style={s.card}>
                                    <View style={s.cardHeader}>
                                        <Text style={s.cardTitle}>Mood Tracker</Text>
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <BarChart data={moodBarData} width={chartWidth} height={150} barWidth={28} spacing={20} roundedTop roundedBottom xAxisThickness={0} yAxisThickness={0} yAxisTextStyle={s.chartAxisText} xAxisLabelTextStyle={s.chartAxisText} noOfSections={5} maxValue={5} hideRules isAnimated />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Writing Trend */}
                        {lineData.length > 0 && (
                            <View style={s.px}>
                                <View style={s.card}>
                                    <View style={s.cardHeader}>
                                        <Text style={s.cardTitle}>Writing Trend</Text>
                                        {trendComparison ? (
                                            <View style={[s.badge, { backgroundColor: trendComparison.startsWith('+') ? '#ECFDF5' : '#FEF2F2' }]}>
                                                <Text style={{ color: trendComparison.startsWith('+') ? '#059669' : '#DC2626', fontSize: 12, fontWeight: '700' }}>{trendComparison} vs last period</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View style={{ alignItems: 'center' }}>
                                        <LineChart data={lineData} width={chartWidth} height={150} spacing={40} color="#4F6BFF" thickness={3} startFillColor="#4F6BFF" endFillColor="#DBEAFE" startOpacity={0.4} endOpacity={0.1} initialSpacing={20} noOfSections={4} yAxisColor="transparent" xAxisColor="transparent" yAxisTextStyle={s.chartAxisText} xAxisLabelTextStyle={{ ...s.chartAxisText, fontSize: 9 }} dataPointsColor="#4F6BFF" dataPointsRadius={5} curved areaChart isAnimated />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Weekly Entries */}
                        {weeklyBarData.length > 0 && (
                            <View style={s.px}>
                                <View style={s.card}>
                                    <Text style={s.cardTitle}>Weekly Entries</Text>
                                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                                        <BarChart data={weeklyBarData} width={chartWidth} height={120} barWidth={50} spacing={25} roundedTop xAxisThickness={0} yAxisThickness={0} yAxisTextStyle={s.chartAxisText} xAxisLabelTextStyle={s.chartAxisText} noOfSections={4} hideRules showValuesAsTopLabel topLabelTextStyle={{ color: '#374151', fontSize: 12, fontWeight: '600' }} isAnimated />
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Top Topics */}
                        {pieData.length > 0 && (
                            <View style={s.px}>
                                <View style={s.card}>
                                    <Text style={s.cardTitle}>Top Topics</Text>
                                    <View style={s.pieRow}>
                                        <PieChart data={pieData} donut radius={70} innerRadius={45} centerLabelComponent={() => (
                                            <View style={{ alignItems: 'center' }}>
                                                <Text style={{ fontSize: 18, fontWeight: '800', color: '#1A1D2E' }}>{totalTopicCount}</Text>
                                                <Text style={{ fontSize: 11, color: '#7A8499' }}>Total</Text>
                                            </View>
                                        )} isAnimated />
                                        <View style={{ flex: 1, marginLeft: 20 }}>
                                            {topTopics.map((item, i) => (
                                                <View key={i} style={s.legendRow}>
                                                    <View style={[s.legendDot, { backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }]} />
                                                    <Text style={s.legendLabel}>{item.topic}</Text>
                                                    <Text style={s.legendValue}>{item.count}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Common Words */}
                        {commonWords.length > 0 && (
                            <View style={s.px}>
                                <View style={[s.card, { backgroundColor: '#F5F0FF' }]}>
                                    <View style={s.cardHeader}>
                                        <MaterialCommunityIcons name="tag-text" size={18} color="#7B3FE4" />
                                        <Text style={[s.cardTitle, { marginLeft: 8 }]}>Common Words</Text>
                                    </View>
                                    <View style={s.wordCloud}>
                                        {commonWords.map((item, i) => {
                                            const size = Math.max(13, Math.min(22, 13 + (item.frequency / commonWords[0].frequency) * 9));
                                            const colors = ['#4F6BFF', '#7B3FE4', '#059669', '#F59E0B', '#EC4899'];
                                            return (
                                                <Text key={i} style={{ fontSize: size, color: colors[i % colors.length], fontWeight: '700', marginRight: 8, marginBottom: 6 }}>
                                                    {item.word}
                                                </Text>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* Activity Calendar */}
                        <View style={s.px}>
                            <View style={s.card}>
                                <View style={s.cardHeader}>
                                    <Text style={s.cardTitle}>
                                        {today.toLocaleString('default', { month: 'long' })} {currentYear}
                                    </Text>
                                </View>
                                <View style={s.calDayRow}>
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <View key={i} style={s.calDayHeader}><Text style={s.calDayText}>{d}</Text></View>
                                    ))}
                                </View>
                                {calendarRows.map((week, wi) => (
                                    <View key={wi} style={s.calDayRow}>
                                        {week.map((day, di) => {
                                            const hasEntry = day !== null && activitySet.has(day);
                                            const isToday = day === today.getDate();
                                            return (
                                                <View key={di} style={[s.calCell, hasEntry && s.calCellActive, isToday && s.calCellToday]}>
                                                    {day && <Text style={[s.calCellText, hasEntry && { color: '#fff' }]}>{day}</Text>}
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                                <View style={s.calLegend}>
                                    <View style={s.legendRow}><View style={[s.legendDot, { backgroundColor: '#4F6BFF' }]} /><Text style={s.legendLabel}>Journaled</Text></View>
                                    <View style={s.legendRow}><View style={[s.legendDot, { backgroundColor: '#E5E8F0' }]} /><Text style={s.legendLabel}>No entry</Text></View>
                                </View>
                            </View>
                        </View>

                        {/* AI Insights */}
                        {(aiInsights.length > 0 || appMode !== 'api') && (
                            <View style={[s.px, { marginBottom: 30 }]}>
                                <View style={[s.card, { backgroundColor: '#F5F0FF' }]}>
                                    <View style={s.aiHeader}>
                                        <View style={s.aiIcon}><MaterialCommunityIcons name="robot-happy" size={22} color="#7B3FE4" /></View>
                                        <View>
                                            <Text style={s.aiTitle}>Echo's Insights</Text>
                                            <Text style={s.aiSub}>AI-powered analysis</Text>
                                        </View>
                                    </View>
                                    {(aiInsights.length > 0 ? aiInsights : [
                                        "📈 Keep journaling consistently to unlock personalized insights!",
                                        "💡 Try a morning journaling routine for more positive entries."
                                    ]).map((insight, i) => (
                                        <View key={i} style={s.insightBubble}>
                                            <Text style={s.insightText}>{insight}</Text>
                                        </View>
                                    ))}
                                    <TouchableOpacity style={s.insightBtn}>
                                        <MaterialCommunityIcons name="auto-fix" size={16} color="#fff" />
                                        <Text style={s.insightBtnText}>Get More Insights</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F5F6FA' },
    loader: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
    loaderText: { marginTop: 12, fontSize: 14, color: '#7A8499' },
    header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
    pageTitle: { fontSize: 26, fontWeight: '800', color: '#1A1D2E' },
    pageSub: { fontSize: 13, color: '#7A8499', marginTop: 2, marginBottom: 16 },
    px: { paddingHorizontal: 16, marginBottom: 16 },

    tabRow: { flexDirection: 'row', backgroundColor: '#E9EBFF', borderRadius: 14, padding: 4 },
    tab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
    tabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    tabText: { fontSize: 13, fontWeight: '600', color: '#7A8499' },
    tabTextActive: { color: '#4F6BFF' },

    statsRow: { flexDirection: 'row', gap: 10 },
    statCard: {
        flex: 1, backgroundColor: '#fff', borderRadius: 18, padding: 14,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    },
    statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    statLabel: { fontSize: 11, color: '#7A8499', fontWeight: '600' },
    statValue: { fontSize: 22, fontWeight: '800', color: '#1A1D2E', marginTop: 2 },
    statSub: { fontSize: 11, color: '#B0BAD0', marginTop: 2 },

    card: {
        backgroundColor: '#fff', borderRadius: 24, padding: 18,
        shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 17, fontWeight: '800', color: '#1A1D2E' },
    badge: { marginLeft: 'auto', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },

    chartAxisText: { color: '#9CA3AF', fontSize: 10 },

    pieRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
    legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    legendLabel: { fontSize: 13, color: '#4A5568', flex: 1 },
    legendValue: { fontSize: 13, fontWeight: '700', color: '#1A1D2E' },

    wordCloud: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },

    calDayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    calDayHeader: { width: 36, alignItems: 'center' },
    calDayText: { fontSize: 11, color: '#B0BAD0', fontWeight: '600' },
    calCell: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F6FA' },
    calCellActive: { backgroundColor: '#4F6BFF' },
    calCellToday: { borderWidth: 2, borderColor: '#4F6BFF' },
    calCellText: { fontSize: 12, fontWeight: '600', color: '#4A5568' },
    calLegend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 14 },

    aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
    aiIcon: { width: 42, height: 42, backgroundColor: '#EDE9FF', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    aiTitle: { fontSize: 17, fontWeight: '800', color: '#1A1D2E' },
    aiSub: { fontSize: 12, color: '#7A8499' },
    insightBubble: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 14, marginBottom: 10 },
    insightText: { fontSize: 14, color: '#4A5568', lineHeight: 21 },
    insightBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, backgroundColor: '#7B3FE4', borderRadius: 16, paddingVertical: 12, marginTop: 4,
    },
    insightBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});