import DailyGoalRing from "@/component/gamification/DailyGoalRing";
import ProgressRing from "@/component/gamification/ProgressRing";
import StreakFlame from "@/component/gamification/StreakFlame";
import EntryCard from "@/component/EntryCard";
import { useGamification } from "@/context/GamificationContext";
import { useStorage } from "@/context/StorageContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/service/api";
import { logger } from "@/service/logger";
import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dailyPrompt } from "./../../constant/const";

interface TodoItem {
  id: string;
  text: string;
}

const ALL_BADGES = [
  { id: 'Echo Sunshine', icon: 'sun-wireless', color: '#FCD34D', required: 1 },
  { id: 'Pen Whisperer', icon: 'feather', color: '#60A5FA', required: 7 },
  { id: 'Mindful Scribe', icon: 'book-open-variant', color: '#34D399', required: 30 },
  { id: 'Thought Architect', icon: 'brain', color: '#A78BFA', required: 45 },
  { id: 'Guardian of Inked Wisdom', icon: 'shield-star', color: '#F87171', required: 60 },
];

export default function Home() {
  const { user, stats, entries, appMode } = useStorage();
  const { colors } = useTheme();
  const { state: gam } = useGamification();
  const [prompt, setPrompt] = useState("");
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    setPrompt(dailyPrompt[Math.floor(Math.random() * dailyPrompt.length)]);
    if (appMode === 'api') loadTodos();
  }, [appMode]);

  const echoMessage = entries[0]?.comment ||
    "Journal your thoughts — Echo will analyse your mood and share personalised insights here.";
  const echoMood = entries[0]?.mood ?? '';

  const loadTodos = async () => {
    try {
      const data = await api.todo.getAll();
      const items = data?.todos || [];
      const pendingItems = items
        .filter((t: { status: string }) => t.status === 'pending')
        .map((t: { _id: string; todo: string }) => ({ id: t._id, text: t.todo }));
      setTaskCount(pendingItems.length);
      setTodos(pendingItems.slice(0, 4));
    } catch (e) {
      logger.error('[Home] Failed to load todos', e);
    }
  };

  const handleToggleTodo = async (todoId: string, todoText: string) => {
    setTodos(prev => prev.filter(t => t.text !== todoText));
    setTaskCount(prev => Math.max(0, prev - 1));
    try {
      await api.todo.update(todoId, { status: 'completed' });
    } catch (e) {
      logger.error('[Home] Failed to complete todo', e);
      loadTodos();
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const xpBarProgress = gam.xpProgress;
  const streakBonus = gam.currentStreak > 0 && gam.currentStreak % 7 === 0;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>{greeting()},</Text>
            <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.levelPill, { backgroundColor: colors.surfaceSecondary }]}
              onPress={() => router.push("/(tabs)/insights")}
            >
              <Text style={[styles.levelPillText, { color: colors.primary }]}>Lv.{gam.currentLevel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.surfaceSecondary }]} onPress={() => router.push("/(chat)")}>
              <Ionicons name="chatbubble-ellipses" color={colors.primary} size={20} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              {user.image || user.avatar ? (
                <Image source={{ uri: (user.image || user.avatar) as string }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>{user.name?.charAt(0)?.toUpperCase() ?? '?'}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Daily Goal Card ── */}
        <View style={styles.px}>
          <LinearGradient
            colors={gam.dailyGoalMet ? ['#059669', '#10B981'] : ['#4F6BFF', '#7B3FE4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.goalCard}
          >
            <View style={styles.goalCardInner}>
              <View style={styles.goalRingWrap}>
                <ProgressRing
                  progress={gam.dailyGoalMet ? 1 : 0}
                  size={90}
                  strokeWidth={8}
                  color="#fff"
                  bgColor="rgba(255,255,255,0.25)"
                >
                  {gam.dailyGoalMet ? (
                    <Text style={{ fontSize: 32 }}></Text>
                  ) : (
                    <Text style={styles.goalRingText}>0/1</Text>
                  )}
                </ProgressRing>
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.goalTitle}>
                  {gam.dailyGoalMet ? 'Goal Complete!' : 'Daily Goal'}
                </Text>
                <Text style={styles.goalSub}>
                  {gam.dailyGoalMet
                    ? "Great job! You've journaled today."
                    : 'Write one entry to keep your streak alive'
                  }
                </Text>
                <View style={styles.goalStats}>
                  <View style={styles.goalStatItem}>
                    <Text style={styles.goalStatEmoji}></Text>
                    <Text style={styles.goalStatVal}>{gam.currentStreak}</Text>
                  </View>
                  <View style={styles.goalStatDivider} />
                  <View style={styles.goalStatItem}>
                    <Text style={styles.goalStatLabel}>XP</Text>
                    <Text style={styles.goalStatVal}>{gam.totalXp}</Text>
                  </View>
                  <View style={styles.goalStatDivider} />
                  <View style={styles.goalStatItem}>
                    <Text style={styles.goalStatLabel}>Lv.</Text>
                    <Text style={styles.goalStatVal}>{gam.currentLevel}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Streak at risk warning */}
            {gam.streakAtRisk && !gam.dailyGoalMet && (
              <View style={styles.riskBanner}>
                <Text style={styles.riskText}>Your {gam.currentStreak}-day streak ends tonight!</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* ── XP Progress Bar ── */}
        <View style={[styles.px, styles.xpBarSection]}>
          <View style={styles.xpBarHeader}>
            <Text style={[styles.xpBarLabel, { color: colors.textSecondary }]}>Level {gam.currentLevel}</Text>
            <Text style={[styles.xpBarLabel, { color: colors.textSecondary }]}>{gam.xpInCurrentLevel}/{gam.xpToNextLevel} XP</Text>
          </View>
          <View style={[styles.xpBarBg, { backgroundColor: colors.surfaceSecondary }]}>
            <View style={[styles.xpBarFill, { width: `${Math.max(2, xpBarProgress * 100)}%` }]} />
          </View>
        </View>

        {/* ── Daily Challenge Card ── */}
        <View style={styles.px}>
          <View style={[styles.promptCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.promptBadge}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={[styles.promptBadgeText, { color: colors.primary }]}>DAILY CHALLENGE</Text>
            </View>
            <Text style={[styles.promptTitle, { color: colors.text }]}>Ready to reflect?</Text>
            <Text style={[styles.promptText, { color: colors.textSecondary }]}>{prompt}</Text>
            <TouchableOpacity
              style={styles.writeBtn}
              onPress={() => router.push("/(tabs)/create")}
              activeOpacity={0.85}
            >
              <AntDesign name="edit" size={18} color="#fff" />
              <Text style={styles.writeBtnText}>Write Now</Text>
              <View style={styles.xpReward}>
                <Text style={styles.xpRewardText}>+10 XP</Text>
              </View>
            </TouchableOpacity>
            {streakBonus && (
              <View style={styles.bonusBanner}>
                <Text style={styles.bonusText}> Streak Bonus: +50 XP today!</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Badge Progress ── */}
        <View style={styles.px}>
          <View style={[styles.badgeCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.row}>
                <MaterialCommunityIcons name="shield-star" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>Badge Progress</Text>
              </View>
              {gam.nextBadge && (
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  {gam.entriesUntilNextBadge} to go
                </Text>
              )}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeScroll}>
              {ALL_BADGES.map((badge) => {
                const isEarned = gam.earnedBadges.includes(badge.id);
                const progress = Math.min(1, gam.totalEntries / badge.required);
                return (
                  <View key={badge.id} style={styles.badgeItem}>
                    <ProgressRing
                      progress={isEarned ? 1 : progress}
                      size={56}
                      strokeWidth={4}
                      color={isEarned ? badge.color : colors.primary}
                      bgColor={colors.surfaceSecondary}
                    >
                      <MaterialCommunityIcons
                        name={badge.icon as any}
                        size={22}
                        color={isEarned ? badge.color : colors.textSecondary}
                      />
                    </ProgressRing>
                    <Text
                      style={[styles.badgeName, { color: isEarned ? colors.text : colors.textSecondary }]}
                      numberOfLines={1}
                    >
                      {badge.id.split(' ')[0]}
                    </Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* ── Echo Says ── */}
        <View style={styles.px}>
          <View style={[styles.echoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.echoHeader}>
              <Image
                source={require("../../assets/images/frustated-echo.webp")}
                style={styles.echoImg}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.echoTitle, { color: colors.text }]}>Echo Says...</Text>
                {echoMood ? (
                  <View style={[styles.moodPill, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.moodPillText, { color: colors.primary }]}>Mood: {echoMood}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={[styles.echoBody, { color: colors.textSecondary }]}>{echoMessage}</Text>
            <View style={styles.echoActions}>
              <TouchableOpacity style={styles.echoBtnPrimary} onPress={() => router.push("/(chat)")} activeOpacity={0.85}>
                <Text style={styles.echoBtnPrimaryText}>Talk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.echoBtnSecondary, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
                onPress={() => router.push("/(meditation)")}
                activeOpacity={0.85}
              >
                <Text style={[styles.echoBtnSecondaryText, { color: colors.primary }]}>Breathe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── Daily Tasks ── */}
        <View style={styles.px}>
          <View style={[styles.todoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <View style={styles.row}>
                <Ionicons name="list" size={18} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.text, marginLeft: 8 }]}>Daily Tasks</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/todo')}>
                <Text style={[styles.sectionLink, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            {todos.length > 0 ? (
              todos.map((todo, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.todoRow, { borderBottomColor: colors.borderSecondary ?? colors.border }]}
                  onPress={() => handleToggleTodo(todo.id, todo.text)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipse-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                  <Text style={[styles.todoText, { color: colors.text }]} numberOfLines={1}>{todo.text}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.todoEmpty}>
                <Text style={[styles.todoEmptyText, { color: colors.textSecondary }]}>
                  {appMode === 'api' ? "No pending tasks! Echo extracts these from your journals." : "Switch to Cloud mode to see AI tasks."}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Space ── */}
        <View style={styles.px}>
          <TouchableOpacity
            style={[styles.spaceBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push('/(space)')}
            activeOpacity={0.85}
          >
            <Text style={styles.spaceBtnEmoji}></Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.spaceBtnTitle, { color: colors.text }]}>Space</Text>
              <Text style={[styles.spaceBtnSub, { color: colors.textSecondary }]}>Draw a card from the community</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* ── Last Entry ── */}
        <View style={[styles.px, { marginBottom: 0 }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Last Entry</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/journal")}>
              <Text style={[styles.sectionLink, { color: colors.primary }]}>All Entries</Text>
            </TouchableOpacity>
          </View>
          <EntryCard entry={entries[0]} />
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  px: { paddingHorizontal: 16, marginBottom: 16 },

  // Header
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  greetingText: { fontSize: 14, fontWeight: "500" },
  userName: { fontSize: 24, fontWeight: "800" },
  avatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#4F6BFF" },
  iconBtn: { borderRadius: 50, padding: 9 },
  levelPill: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  levelPillText: { fontSize: 12, fontWeight: '800' },

  // Daily Goal Card
  goalCard: { borderRadius: 24, padding: 20, overflow: 'hidden' },
  goalCardInner: { flexDirection: 'row', alignItems: 'center' },
  goalRingWrap: { marginRight: 20 },
  goalRingText: { fontSize: 18, fontWeight: '900', color: '#fff' },
  goalInfo: { flex: 1 },
  goalTitle: { fontSize: 20, fontWeight: '900', color: '#fff' },
  goalSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, lineHeight: 18 },
  goalStats: { flexDirection: 'row', alignItems: 'center', marginTop: 14, gap: 2 },
  goalStatItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  goalStatEmoji: { fontSize: 16 },
  goalStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '700' },
  goalStatVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  goalStatDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.25)', marginHorizontal: 12 },
  riskBanner: { backgroundColor: 'rgba(239,68,68,0.25)', borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, marginTop: 14 },
  riskText: { color: '#fff', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  // XP Bar
  xpBarSection: { marginBottom: 12 },
  xpBarHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  xpBarLabel: { fontSize: 12, fontWeight: '600' },
  xpBarBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  xpBarFill: { height: '100%', borderRadius: 4, backgroundColor: '#F59E0B' },

  // Prompt Card
  promptCard: { borderRadius: 20, padding: 20, borderWidth: 1, shadowColor: "#4F6BFF", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  promptBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  promptBadgeText: { fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  promptTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8 },
  promptText: { fontSize: 15, lineHeight: 22, marginBottom: 18 },
  writeBtn: { backgroundColor: "#4F6BFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  writeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  xpReward: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  xpRewardText: { color: '#FCD34D', fontWeight: '800', fontSize: 12 },
  bonusBanner: { backgroundColor: '#FEF3C7', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginTop: 12 },
  bonusText: { color: '#92400E', fontWeight: '700', fontSize: 13, textAlign: 'center' },

  // Badge Progress
  badgeCard: { borderRadius: 20, padding: 16, borderWidth: 1 },
  badgeScroll: { gap: 14, paddingVertical: 8 },
  badgeItem: { alignItems: 'center', width: 70 },
  badgeName: { fontSize: 10, fontWeight: '700', marginTop: 6, textAlign: 'center' },

  // Echo Card
  echoCard: { borderRadius: 20, padding: 18, borderWidth: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  echoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  echoImg: { width: 52, height: 52, borderRadius: 12 },
  echoTitle: { fontSize: 16, fontWeight: "700" },
  moodPill: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4 },
  moodPillText: { fontSize: 12, fontWeight: "600" },
  echoBody: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  echoActions: { flexDirection: "row", gap: 10 },
  echoBtnPrimary: { flex: 1, backgroundColor: "#4F6BFF", borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  echoBtnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  echoBtnSecondary: { flex: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center", borderWidth: 1 },
  echoBtnSecondaryText: { fontWeight: "700", fontSize: 14 },

  // Todo Card
  todoCard: { borderRadius: 20, padding: 16, borderWidth: 1.5, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  todoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1 },
  todoText: { fontSize: 15, fontWeight: "500", flex: 1 },
  todoEmpty: { paddingVertical: 12, alignItems: 'center' },
  todoEmptyText: { fontSize: 13, textAlign: "center", lineHeight: 18 },

  // Space
  spaceBtn: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 20, padding: 16, borderWidth: 1.5, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  spaceBtnEmoji: { fontSize: 32 },
  spaceBtnTitle: { fontSize: 16, fontWeight: "800" },
  spaceBtnSub: { fontSize: 12, marginTop: 2 },

  // Shared
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800" },
  sectionLink: { fontSize: 13, fontWeight: "600" },
  row: { flexDirection: 'row', alignItems: 'center' },
});
