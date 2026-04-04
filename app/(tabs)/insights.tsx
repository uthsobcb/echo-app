import { useStorage } from '@/context/StorageContext';
import { api } from '@/service/api';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');
const chartWidth = width - 80;

type TimeRange = 'week' | 'month' | 'year';

const TOPIC_COLORS = ['#4F6BFF', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

function TimeRangeSelector({ selected, onSelect, colors }: { selected: TimeRange; onSelect: (r: TimeRange) => void; colors: any }) {
    const options: TimeRange[] = ['week', 'month', 'year'];
    return (
        <View className="flex-row rounded-3xl p-1" style={{ backgroundColor: colors.surfaceSecondary }}>
            {options.map((o) => (
                <TouchableOpacity
                    key={o}
                    onPress={() => onSelect(o)}
                    className={`flex-1 py-2 rounded-2xl items-center ${selected === o ? 'shadow-sm' : ''}`}
                    style={selected === o ? { backgroundColor: colors.surface } : {}}
                >
                    <Text className={`text-[13px] font-semibold ${selected === o ? '' : ''}`} style={{ color: selected === o ? colors.primary : colors.textSecondary }}>
                        {o.charAt(0).toUpperCase() + o.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function StatCard({ icon, title, value, subtitle, color, colors }: { icon: React.ReactNode; title: string; value: string; subtitle: string; color: string; colors: any }) {
    return (
        <View className="flex-1 rounded-[18px] p-3.5" style={{ backgroundColor: colors.surface }}>
            <View className="w-9 h-9 rounded-3xl items-center justify-center mb-2.5" style={{ backgroundColor: color + '18' }}>
                {icon}
            </View>
            <Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>{title}</Text>
            <Text className="text-[22px] font-extrabold mt-0.5" style={{ color: colors.text }}>{value}</Text>
            <Text className="text-[11px] mt-0.5" style={{ color: colors.textSecondary }}>{subtitle}</Text>
        </View>
    );
}

export default function Insights() {
    const { appMode } = useStorage();
    const { colors, isDark } = useTheme();
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

    const chartAxisText = { color: colors.textSecondary, fontSize: 10 };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View className="px-5 pt-3 pb-1">
                    <Text className="text-[26px] font-extrabold" style={{ color: colors.text }}>Insights</Text>
                    <Text className="text-[13px] mt-0.5" style={{ color: colors.textSecondary }}>Track your journaling journey</Text>
                </View>

                <View className="px-4 mb-4">
                    <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} colors={colors} />
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center pt-20">
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text className="text-sm mt-3" style={{ color: colors.textSecondary }}>Loading insights…</Text>
                    </View>
                ) : (
                    <>
                        <View className="px-4 mb-4">
                            <View className="flex-row gap-2.5">
                                <StatCard icon={<Ionicons name="document-text" size={20} color="#4F6BFF" />} title="Total Entries" value={`${stats.totalEntries ?? '—'}`} subtitle="This period" color="#4F6BFF" colors={colors} />
                                <StatCard icon={<MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />} title="Current Streak" value={`${stats.currentStreak ?? '—'}`} subtitle="Days" color="#F59E0B" colors={colors} />
                            </View>
                            <View className="flex-row gap-2.5 mt-2.5">
                                <StatCard icon={<Feather name="clock" size={20} color="#8B5CF6" />} title="Avg. Length" value={`${stats.avgWordCount ?? '—'}`} subtitle="Words/entry" color="#8B5CF6" colors={colors} />
                                <StatCard icon={<Ionicons name="trending-up" size={20} color="#10B981" />} title="Best Streak" value={`${stats.bestStreak ?? '—'}`} subtitle="Days" color="#10B981" colors={colors} />
                            </View>
                        </View>

                        {moodBarData.length > 0 && (
                            <View className="px-4 mb-4">
                                <View className="rounded-3xl p-4" style={{ backgroundColor: colors.surface }}>
                                    <Text className="text-[17px] font-extrabold mb-3" style={{ color: colors.text }}>Mood Tracker</Text>
                                    <View className="items-center">
                                        <BarChart data={moodBarData} width={chartWidth} height={150} barWidth={28} spacing={20} roundedTop roundedBottom xAxisThickness={0} yAxisThickness={0} yAxisTextStyle={chartAxisText} xAxisLabelTextStyle={chartAxisText} noOfSections={5} maxValue={5} hideRules isAnimated />
                                    </View>
                                </View>
                            </View>
                        )}

                        {lineData.length > 0 && (
                            <View className="px-4 mb-4">
                                <View className="rounded-3xl p-4" style={{ backgroundColor: colors.surface }}>
                                    <View className="flex-row items-center mb-3">
                                        <Text className="text-[17px] font-extrabold" style={{ color: colors.text }}>Writing Trend</Text>
                                        {trendComparison ? (
                                            <View className="ml-auto rounded-full px-2.5 py-1" style={{ backgroundColor: trendComparison.startsWith('+') ? '#ECFDF5' : '#FEF2F2' }}>
                                                <Text className="text-xs font-bold" style={{ color: trendComparison.startsWith('+') ? '#059669' : '#DC2626' }}>{trendComparison} vs last period</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    <View className="items-center">
                                        <LineChart data={lineData} width={chartWidth} height={150} spacing={40} color="#4F6BFF" thickness={3} startFillColor="#4F6BFF" endFillColor="#DBEAFE" startOpacity={0.4} endOpacity={0.1} initialSpacing={20} noOfSections={4} yAxisColor="transparent" xAxisColor="transparent" yAxisTextStyle={chartAxisText} xAxisLabelTextStyle={{ ...chartAxisText, fontSize: 9 }} dataPointsColor="#4F6BFF" dataPointsRadius={5} curved areaChart isAnimated />
                                    </View>
                                </View>
                            </View>
                        )}

                        {weeklyBarData.length > 0 && (
                            <View className="px-4 mb-4">
                                <View className="rounded-3xl p-4" style={{ backgroundColor: colors.surface }}>
                                    <Text className="text-[17px] font-extrabold mb-3" style={{ color: colors.text }}>Weekly Entries</Text>
                                    <View className="items-center mt-3">
                                        <BarChart data={weeklyBarData} width={chartWidth} height={120} barWidth={50} spacing={25} roundedTop xAxisThickness={0} yAxisThickness={0} yAxisTextStyle={chartAxisText} xAxisLabelTextStyle={chartAxisText} noOfSections={4} hideRules showValuesAsTopLabel topLabelTextStyle={{ color: '#374151', fontSize: 12, fontWeight: '600' }} isAnimated />
                                    </View>
                                </View>
                            </View>
                        )}

                        {pieData.length > 0 && (
                            <View className="px-4 mb-4">
                                <View className="rounded-3xl p-4" style={{ backgroundColor: colors.surface }}>
                                    <Text className="text-[17px] font-extrabold mb-3" style={{ color: colors.text }}>Top Topics</Text>
                                    <View className="flex-row items-center mt-3">
                                        <PieChart data={pieData} donut radius={70} innerRadius={45} centerLabelComponent={() => (
                                            <View className="items-center">
                                                <Text className="text-[18px] font-extrabold" style={{ color: colors.text }}>{totalTopicCount}</Text>
                                                <Text className="text-[11px]" style={{ color: colors.textSecondary }}>Total</Text>
                                            </View>
                                        )} isAnimated />
                                        <View className="flex-1 ml-5">
                                            {topTopics.map((item, i) => (
                                                <View key={i} className="flex-row items-center mb-1.5">
                                                    <View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: TOPIC_COLORS[i % TOPIC_COLORS.length] }} />
                                                    <Text className="text-[13px] flex-1" style={{ color: colors.textSecondary }}>{item.topic}</Text>
                                                    <Text className="text-[13px] font-bold" style={{ color: colors.text }}>{item.count}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                </View>
                            </View>
                        )}

                        {commonWords.length > 0 && (
                            <View className="px-4 mb-4">
                                <View className="rounded-3xl p-4" style={{ backgroundColor: isDark ? '#2D1F4E' : '#F5F0FF' }}>
                                    <View className="flex-row items-center mb-3">
                                        <MaterialCommunityIcons name="tag-text" size={18} color="#7B3FE4" />
                                        <Text className="text-[17px] font-extrabold ml-2" style={{ color: colors.text }}>Common Words</Text>
                                    </View>
                                    <View className="flex-row flex-wrap">
                                        {commonWords.map((item, i) => {
                                            const size = Math.max(13, Math.min(22, 13 + (item.frequency / commonWords[0].frequency) * 9));
                                            const wordColors = ['#4F6BFF', '#7B3FE4', '#059669', '#F59E0B', '#EC4899'];
                                            return (
                                                <Text key={i} className="mr-2 mb-1.5" style={{ fontSize: size, color: wordColors[i % wordColors.length], fontWeight: '700' }}>
                                                    {item.word}
                                                </Text>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>
                        )}

                        <View className="px-4 mb-4">
                            <View className="rounded-3xl p-4" style={{ backgroundColor: colors.surface }}>
                                <Text className="text-[17px] font-extrabold mb-3" style={{ color: colors.text }}>
                                    {today.toLocaleString('default', { month: 'long' })} {currentYear}
                                </Text>
                                <View className="flex-row justify-between mb-1.5">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                        <View key={i} className="w-9 items-center"><Text className="text-[11px] font-semibold" style={{ color: colors.textSecondary }}>{d}</Text></View>
                                    ))}
                                </View>
                                {calendarRows.map((week, wi) => (
                                    <View key={wi} className="flex-row justify-between mb-1.5">
                                        {week.map((day, di) => {
                                            const hasEntry = day !== null && activitySet.has(day);
                                            const isToday = day === today.getDate();
                                            return (
                                                <View key={di} className={`w-9 h-9 rounded-full items-center justify-center ${hasEntry ? '' : ''}`} style={{ backgroundColor: hasEntry ? colors.primary : colors.surfaceSecondary }}>
                                                    {day && <Text className="text-[12px] font-semibold" style={{ color: hasEntry ? '#fff' : colors.textSecondary }}>{day}</Text>}
                                                </View>
                                            );
                                        })}
                                    </View>
                                ))}
                                <View className="flex-row justify-center gap-5 mt-3.5">
                                    <View className="flex-row items-center"><View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors.primary }} /><Text className="text-[13px]" style={{ color: colors.textSecondary }}>Journaled</Text></View>
                                    <View className="flex-row items-center"><View className="w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: colors.border }} /><Text className="text-[13px]" style={{ color: colors.textSecondary }}>No entry</Text></View>
                                </View>
                            </View>
                        </View>

                        {(aiInsights.length > 0 || appMode !== 'api') && (
                            <View className="px-4 mb-7">
                                <View className="rounded-3xl p-4" style={{ backgroundColor: isDark ? '#2D1F4E' : '#F5F0FF' }}>
                                    <View className="flex-row items-center gap-3 mb-3">
                                        <View className="w-10 h-10 rounded-3xl items-center justify-center" style={{ backgroundColor: '#EDE9FF' }}><MaterialCommunityIcons name="robot-happy" size={22} color="#7B3FE4" /></View>
                                        <View>
                                            <Text className="text-[17px] font-extrabold" style={{ color: colors.text }}>Echo's Insights</Text>
                                            <Text className="text-[12px]" style={{ color: colors.textSecondary }}>AI-powered analysis</Text>
                                        </View>
                                    </View>
                                    {(aiInsights.length > 0 ? aiInsights : [
                                        "📈 Keep journaling consistently to unlock personalized insights!",
                                        "💡 Try a morning journaling routine for more positive entries."
                                    ]).map((insight, i) => (
                                        <View key={i} className="rounded-4xl p-3.5 mb-2.5" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.7)' }}>
                                            <Text className="text-sm leading-[21px]" style={{ color: colors.text }}>{insight}</Text>
                                        </View>
                                    ))}
                                    <TouchableOpacity className="flex-row items-center justify-center gap-2 rounded-4xl py-3 mt-1" style={{ backgroundColor: '#7B3FE4' }}>
                                        <MaterialCommunityIcons name="auto-fix" size={16} color="#fff" />
                                        <Text className="text-[14px] font-bold text-white">Get More Insights</Text>
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
