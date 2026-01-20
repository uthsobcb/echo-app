import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const chartWidth = width - 80;

// Mock data for insights
const weeklyMoods = [
    { day: 'Mon', mood: 'happy', value: 4 },
    { day: 'Tue', mood: 'neutral', value: 3 },
    { day: 'Wed', mood: 'happy', value: 5 },
    { day: 'Thu', mood: 'sad', value: 2 },
    { day: 'Fri', mood: 'happy', value: 4 },
    { day: 'Sat', mood: 'happy', value: 5 },
    { day: 'Sun', mood: 'neutral', value: 3 },
];

// Bar chart data for mood tracker
const moodBarData = weeklyMoods.map((item) => {
    const colors: Record<number, string> = {
        1: '#EF4444',
        2: '#F59E0B',
        3: '#FCD34D',
        4: '#84CC16',
        5: '#22C55E',
    };
    return {
        value: item.value,
        label: item.day,
        frontColor: colors[item.value] || '#84CC16',
        topLabelComponent: () => (
            <Text style={{ fontSize: 16, marginBottom: 4 }}>
                {item.mood === 'happy' ? '😊' : item.mood === 'neutral' ? '😐' : '😢'}
            </Text>
        ),
    };
});

// Line chart data for writing activity over time
const lineChartData = [
    { value: 3, label: 'Jan 1' },
    { value: 5, label: 'Jan 5' },
    { value: 4, label: 'Jan 8' },
    { value: 7, label: 'Jan 12' },
    { value: 6, label: 'Jan 15' },
    { value: 8, label: 'Jan 18' },
    { value: 5, label: 'Jan 20' },
];

// Bar chart data for weekly entries
const weeklyBarData = [
    { value: 5, label: 'W1', frontColor: '#93C5FD' },
    { value: 7, label: 'W2', frontColor: '#60A5FA' },
    { value: 4, label: 'W3', frontColor: '#93C5FD' },
    { value: 6, label: 'W4', frontColor: '#3B82F6' },
];

// Pie chart data for topics
const pieData = [
    { value: 12, color: '#3B82F6', text: 'Work', focused: true },
    { value: 8, color: '#10B981', text: 'Family' },
    { value: 6, color: '#F59E0B', text: 'Health' },
    { value: 5, color: '#8B5CF6', text: 'Goals' },
    { value: 4, color: '#EC4899', text: 'Gratitude' },
];

type TimeRange = 'week' | 'month' | 'year';

function TimeRangeSelector({ selected, onSelect }: { selected: TimeRange; onSelect: (range: TimeRange) => void }) {
    const options: TimeRange[] = ['week', 'month', 'year'];
    return (
        <View className="flex-row bg-gray-100 rounded-xl p-1">
            {options.map((option) => (
                <TouchableOpacity
                    key={option}
                    onPress={() => onSelect(option)}
                    className={`flex-1 py-2 px-4 rounded-lg ${selected === option ? 'bg-white' : ''}`}
                    style={selected === option ? { shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 } : {}}
                >
                    <Text className={`text-center text-sm font-medium capitalize ${selected === option ? 'text-blue-600' : 'text-gray-500'}`}>
                        {option}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

function StatCard({ icon, title, value, subtitle, color }: { icon: React.ReactNode; title: string; value: string; subtitle: string; color: string }) {
    return (
        <View
            className="flex-1 bg-white p-4 rounded-2xl"
            style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 }}
        >
            <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3`} style={{ backgroundColor: `${color}15` }}>
                {icon}
            </View>
            <Text className="text-gray-500 text-xs font-medium">{title}</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">{value}</Text>
            <Text className="text-gray-400 text-xs mt-1">{subtitle}</Text>
        </View>
    );
}

export default function Insights() {
    const [timeRange, setTimeRange] = useState<TimeRange>('week');

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                {/* Header */}
                <View className="px-6 py-4">
                    <Text className="text-2xl font-bold text-gray-900">Insights</Text>
                    <Text className="text-gray-500 text-sm mt-1">Track your journaling journey</Text>
                </View>

                {/* Time Range Selector */}
                <View className="px-6 mb-6">
                    <TimeRangeSelector selected={timeRange} onSelect={setTimeRange} />
                </View>

                {/* Quick Stats */}
                <View className="px-4 mb-6">
                    <View className="flex-row gap-3">
                        <StatCard
                            icon={<Ionicons name="document-text" size={20} color="#3B82F6" />}
                            title="Total Entries"
                            value="47"
                            subtitle="This month"
                            color="#3B82F6"
                        />
                        <StatCard
                            icon={<MaterialCommunityIcons name="fire" size={20} color="#F59E0B" />}
                            title="Current Streak"
                            value="12"
                            subtitle="Days"
                            color="#F59E0B"
                        />
                    </View>
                    <View className="flex-row gap-3 mt-3">
                        <StatCard
                            icon={<Feather name="clock" size={20} color="#8B5CF6" />}
                            title="Avg. Length"
                            value="342"
                            subtitle="Words/entry"
                            color="#8B5CF6"
                        />
                        <StatCard
                            icon={<Ionicons name="trending-up" size={20} color="#10B981" />}
                            title="Best Streak"
                            value="21"
                            subtitle="Days"
                            color="#10B981"
                        />
                    </View>
                </View>

                {/* Mood Tracker with Bar Chart */}
                <View className="px-4 mb-6">
                    <View
                        className="bg-white p-5 rounded-3xl"
                        style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-gray-900">Mood Tracker</Text>
                            <View className="flex-row items-center">
                                <Text className="text-2xl mr-2">😊</Text>
                                <Text className="text-sm text-gray-500">Mostly Happy</Text>
                            </View>
                        </View>

                        <View className="items-center">
                            <BarChart
                                data={moodBarData}
                                width={chartWidth}
                                height={150}
                                barWidth={28}
                                spacing={20}
                                roundedTop
                                roundedBottom
                                xAxisThickness={0}
                                yAxisThickness={0}
                                yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 11 }}
                                noOfSections={5}
                                maxValue={5}
                                hideRules
                                isAnimated
                            />
                        </View>
                    </View>
                </View>

                {/* Writing Activity Line Chart */}
                <View className="px-4 mb-6">
                    <View
                        className="bg-white p-5 rounded-3xl"
                        style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-gray-900">Writing Trend</Text>
                            <View className="bg-green-50 px-3 py-1 rounded-full">
                                <Text className="text-green-600 text-xs font-semibold">+23% vs last week</Text>
                            </View>
                        </View>

                        <View className="items-center">
                            <LineChart
                                data={lineChartData}
                                width={chartWidth}
                                height={150}
                                spacing={40}
                                color="#3B82F6"
                                thickness={3}
                                startFillColor="#3B82F6"
                                endFillColor="#DBEAFE"
                                startOpacity={0.4}
                                endOpacity={0.1}
                                initialSpacing={20}
                                noOfSections={4}
                                yAxisColor="transparent"
                                xAxisColor="transparent"
                                yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 9 }}
                                hideDataPoints={false}
                                dataPointsColor="#3B82F6"
                                dataPointsRadius={5}
                                curved
                                areaChart
                                isAnimated
                            />
                        </View>
                    </View>
                </View>

                {/* Weekly Entries Bar Chart */}
                <View className="px-4 mb-6">
                    <View
                        className="bg-white p-5 rounded-3xl"
                        style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}
                    >
                        <Text className="text-lg font-bold text-gray-900 mb-4">Weekly Entries</Text>

                        <View className="items-center">
                            <BarChart
                                data={weeklyBarData}
                                width={chartWidth}
                                height={120}
                                barWidth={50}
                                spacing={25}
                                roundedTop
                                xAxisThickness={0}
                                yAxisThickness={0}
                                yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
                                xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 12 }}
                                noOfSections={4}
                                hideRules
                                showValuesAsTopLabel
                                topLabelTextStyle={{ color: '#374151', fontSize: 12, fontWeight: '600' }}
                                isAnimated
                            />
                        </View>
                    </View>
                </View>

                {/* Top Topics with Pie Chart */}
                <View className="px-4 mb-6">
                    <View
                        className="bg-white p-5 rounded-3xl"
                        style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}
                    >
                        <Text className="text-lg font-bold text-gray-900 mb-4">Top Topics</Text>

                        <View className="flex-row items-center">
                            <PieChart
                                data={pieData}
                                donut
                                radius={70}
                                innerRadius={45}
                                centerLabelComponent={() => (
                                    <View className="items-center">
                                        <Text className="text-xl font-bold text-gray-900">35</Text>
                                        <Text className="text-xs text-gray-500">Total</Text>
                                    </View>
                                )}
                                isAnimated
                            />

                            <View className="flex-1 ml-6">
                                {pieData.map((item, index) => (
                                    <View key={index} className="flex-row items-center mb-2">
                                        <View
                                            style={{ backgroundColor: item.color }}
                                            className="w-3 h-3 rounded-full mr-2"
                                        />
                                        <Text className="text-sm text-gray-700 flex-1">{item.text}</Text>
                                        <Text className="text-sm font-semibold text-gray-900">{item.value}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Word Cloud Placeholder */}
                <View className="px-4 mb-6">
                    <View
                        className="bg-gradient-to-br bg-blue-50 p-5 rounded-3xl border border-blue-100"
                        style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}
                    >
                        <View className="flex-row items-center mb-3">
                            <MaterialCommunityIcons name="tag-text" size={20} color="#3B82F6" />
                            <Text className="text-lg font-bold text-gray-900 ml-2">Common Words</Text>
                        </View>
                        <View className="flex-row flex-wrap gap-2">
                            {[
                                { word: 'grateful', size: 'text-xl', color: 'text-blue-600' },
                                { word: 'family', size: 'text-lg', color: 'text-purple-600' },
                                { word: 'work', size: 'text-xl', color: 'text-emerald-600' },
                                { word: 'happy', size: 'text-base', color: 'text-orange-500' },
                                { word: 'peaceful', size: 'text-sm', color: 'text-pink-500' },
                                { word: 'growth', size: 'text-lg', color: 'text-blue-600' },
                                { word: 'learning', size: 'text-base', color: 'text-purple-600' },
                                { word: 'friends', size: 'text-xl', color: 'text-emerald-600' },
                                { word: 'health', size: 'text-sm', color: 'text-orange-500' },
                                { word: 'goals', size: 'text-lg', color: 'text-pink-500' },
                            ].map((item, index) => (
                                <Text key={index} className={`${item.size} ${item.color} font-medium`}>
                                    {item.word}
                                </Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Journaling Streaks Calendar */}
                <View className="px-4 mb-6">
                    <View
                        className="bg-white p-5 rounded-3xl"
                        style={{ shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 }}
                    >
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-lg font-bold text-gray-900">January 2026</Text>
                            <View className="flex-row gap-2">
                                <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
                                    <Ionicons name="chevron-back" size={16} color="#6B7280" />
                                </TouchableOpacity>
                                <TouchableOpacity className="p-2 bg-gray-100 rounded-full">
                                    <Ionicons name="chevron-forward" size={16} color="#6B7280" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Day headers */}
                        <View className="flex-row justify-between mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                <View key={index} className="w-8 items-center">
                                    <Text className="text-xs text-gray-400 font-medium">{day}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Calendar grid - showing 4 weeks */}
                        {[
                            [null, null, null, null, 1, 2, 3],
                            [4, 5, 6, 7, 8, 9, 10],
                            [11, 12, 13, 14, 15, 16, 17],
                            [18, 19, 20, null, null, null, null],
                        ].map((week, weekIndex) => (
                            <View key={weekIndex} className="flex-row justify-between mb-2">
                                {week.map((day, dayIndex) => {
                                    const hasEntry = day && [1, 2, 3, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20].includes(day);
                                    const isToday = day === 20;
                                    return (
                                        <View
                                            key={dayIndex}
                                            className={`w-8 h-8 rounded-full items-center justify-center ${hasEntry ? 'bg-blue-500' : day ? 'bg-gray-100' : ''
                                                } ${isToday ? 'border-2 border-blue-300' : ''}`}
                                        >
                                            {day && (
                                                <Text className={`text-xs font-medium ${hasEntry ? 'text-white' : 'text-gray-600'}`}>
                                                    {day}
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ))}

                        {/* Legend */}
                        <View className="flex-row items-center justify-center mt-4 gap-4">
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-blue-500 mr-2" />
                                <Text className="text-xs text-gray-500">Journaled</Text>
                            </View>
                            <View className="flex-row items-center">
                                <View className="w-3 h-3 rounded-full bg-gray-100 mr-2" />
                                <Text className="text-xs text-gray-500">Missed</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* AI Insights */}
                <View className="px-4 mb-10">
                    <View
                        className="bg-gradient-to-br bg-purple-50 p-5 rounded-3xl border border-purple-100"
                        style={{ shadowColor: '#8B5CF6', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 }}
                    >
                        <View className="flex-row items-center mb-3">
                            <View className="w-10 h-10 bg-purple-100 rounded-xl items-center justify-center mr-3">
                                <MaterialCommunityIcons name="robot-happy" size={22} color="#8B5CF6" />
                            </View>
                            <View>
                                <Text className="text-lg font-bold text-gray-900">Echo's Insights</Text>
                                <Text className="text-xs text-gray-500">AI-powered analysis</Text>
                            </View>
                        </View>

                        <View className="bg-white/60 rounded-2xl p-4 mt-2">
                            <Text className="text-gray-700 leading-6">
                                📈 You've been more consistent this week! Your entries show a positive trend in mood, especially when you write about family and gratitude.
                            </Text>
                        </View>

                        <View className="bg-white/60 rounded-2xl p-4 mt-3">
                            <Text className="text-gray-700 leading-6">
                                💡 Try journaling in the morning - your most positive entries tend to be written before noon.
                            </Text>
                        </View>

                        <TouchableOpacity className="flex-row items-center justify-center mt-4 py-3 bg-purple-500 rounded-2xl">
                            <MaterialCommunityIcons name="auto-fix" size={18} color="white" />
                            <Text className="text-white font-semibold ml-2">Get More Insights</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}