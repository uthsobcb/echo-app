import EntryCard from "@/component/EntryCard";
import { useStorage } from "@/context/StorageContext";
import { useTheme, ThemeColors } from "@/context/ThemeContext";
import { api } from "@/service/api";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dailyPrompt } from "./../../constant/const";

export default function Home() {
  const { user, stats, entries, appMode } = useStorage();
  const { colors } = useTheme();
  const [prompt, setPrompt] = useState("");
  const [todos, setTodos] = useState<any[]>([]);
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
        .filter((t: any) => t.status === 'pending')
        .map((t: any) => ({
          id: t._id,
          text: t.todo
        }));

      setTaskCount(pendingItems.length);
      setTodos(pendingItems.slice(0, 4));
    } catch (e) {
      console.error('[Home] Failed to load todos', e);
    }
  };

  const handleToggleTodo = async (todoId: string, todoText: string) => {
    setTodos(prev => prev.filter(t => t.text !== todoText));
    setTaskCount(prev => Math.max(0, prev - 1));

    try {
      await api.todo.updateStatus(todoId, 'completed');
    } catch (e) {
      console.error('[Home] Failed to complete todo', e);
      loadTodos();
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const dynamicStyles = useMemo(() => {
    const safeArea: ViewStyle = { flex: 1, backgroundColor: colors.background };
    const scroll: ViewStyle = { flex: 1, backgroundColor: colors.background };
    const greeting: TextStyle = { fontSize: 14, color: colors.textSecondary, fontWeight: "500" };
    const userName: TextStyle = { fontSize: 24, fontWeight: "800", color: colors.text };
    const iconBtn: ViewStyle = {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 50,
      padding: 10,
    };
    const promptCard: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      shadowColor: "#4F6BFF",
      shadowOpacity: 0.08,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 6 },
      elevation: 3,
      borderWidth: 1,
      borderColor: colors.border,
    };
    const promptBadgeText: TextStyle = {
      fontSize: 11,
      fontWeight: "700",
      color: colors.primary,
      letterSpacing: 1.2,
    };
    const promptTitle: TextStyle = { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 8 };
    const promptText: TextStyle = { fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 18 };
    const echoCard: ViewStyle = {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 18,
      shadowColor: "#000",
      shadowOpacity: 0.05,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    };
    const echoTitle: TextStyle = { fontSize: 16, fontWeight: "700", color: colors.text };
    const moodPill: ViewStyle = {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 3,
      alignSelf: "flex-start",
      marginTop: 4,
    };
    const moodPillText: TextStyle = { fontSize: 12, color: colors.primary, fontWeight: "600" };
    const echoBody: TextStyle = { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginBottom: 14 };
    const echoBtnSecondary: ViewStyle = {
      flex: 1,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    };
    const echoBtnSecondaryText: TextStyle = { color: colors.primary, fontWeight: "700", fontSize: 14 };
    const todoCard: ViewStyle = {
      backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 14,
      borderWidth: 1.5, borderColor: colors.border,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    };
    const todoEmptyText: TextStyle = {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    };
    const todoText: TextStyle = {
      fontSize: 15,
      color: colors.text,
      fontWeight: "500",
      flex: 1,
    };
    const sectionTitle: TextStyle = { fontSize: 18, fontWeight: "800", color: colors.text };
    const sectionLink: TextStyle = { fontSize: 13, color: colors.primary, fontWeight: "600" };
    const spaceBtn: ViewStyle = {
      flexDirection: "row", alignItems: "center", gap: 14,
      backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 14,
      borderWidth: 1.5, borderColor: colors.border,
      shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    };
    const spaceBtnTitle: TextStyle = { fontSize: 16, fontWeight: "800", color: colors.text };
    const spaceBtnSub: TextStyle = { fontSize: 12, color: colors.textSecondary, marginTop: 2 };
    return { safeArea, scroll, greeting, userName, iconBtn, promptCard, promptBadgeText, promptTitle, promptText, echoCard, echoTitle, moodPill, moodPillText, echoBody, echoBtnSecondary, echoBtnSecondaryText, todoCard, todoEmptyText, todoText, sectionTitle, sectionLink, spaceBtn, spaceBtnTitle, spaceBtnSub };
  }, [colors]);

  return (
    <SafeAreaView style={dynamicStyles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={dynamicStyles.greeting}>{greeting()},</Text>
            <Text style={dynamicStyles.userName}>{user.name} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={dynamicStyles.iconBtn} onPress={() => router.push("/(chat)")}>
              <Ionicons name="chatbubble-ellipses" color={colors.primary} size={22} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              {user.image || user.avatar ? (
                <Image
                  source={{ uri: (user.image || user.avatar) as string }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                    {user.name?.charAt(0)?.toUpperCase() ?? '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.px}>
          <LinearGradient
            colors={["#4F6BFF", "#7B3FE4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.streakCard}
          >
            <View style={styles.streakInner}>
              <View>
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakCount}>{stats.streak} Day Streak</Text>
                <Text style={styles.streakSub}>Keep it going!</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.xpBlock}>
                <Text style={styles.xpLabel}>ENTRIES</Text>
                <Text style={styles.xpValue}>{stats.entries}</Text>
              </View>
              <View style={styles.streakDivider} />
              <View style={styles.xpBlock}>
                <Text style={styles.xpLabel}>TASKS</Text>
                <Text style={styles.xpValue}>{taskCount}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.px}>
          <View style={dynamicStyles.promptCard}>
            <View style={styles.promptBadge}>
              <Ionicons name="sparkles" size={13} color={colors.primary} />
              <Text style={dynamicStyles.promptBadgeText}>DAILY PROMPT</Text>
            </View>
            <Text style={dynamicStyles.promptTitle}>Ready to reflect?</Text>
            <Text style={dynamicStyles.promptText}>{prompt}</Text>
            <TouchableOpacity
              style={styles.writeBtn}
              onPress={() => router.push("/(tabs)/create")}
              activeOpacity={0.85}
            >
              <AntDesign name="edit" size={18} color="#fff" />
              <Text style={styles.writeBtnText}>Write Now</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.px}>
          <View style={dynamicStyles.echoCard}>
            <View style={styles.echoHeader}>
              <Image
                source={require("../../assets/images/frustated-echo.webp")}
                style={styles.echoImg}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={dynamicStyles.echoTitle}>Echo Says…</Text>
                {(echoMood || (user as any).mood) ? (
                  <View style={dynamicStyles.moodPill}>
                    <Text style={dynamicStyles.moodPillText}>Mood: {echoMood || (user as any).mood}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={dynamicStyles.echoBody}>
              {echoMessage ||
                (entries[0]?.comment) ||
                "Journal your thoughts — Echo will analyse your mood and share personalised insights here."}
            </Text>
            <View style={styles.echoActions}>
              <TouchableOpacity
                style={styles.echoBtnPrimary}
                onPress={() => router.push("/(chat)")}
                activeOpacity={0.85}
              >
                <Text style={styles.echoBtnPrimaryText}>✋  Talk</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={dynamicStyles.echoBtnSecondary}
                onPress={() => router.push("/(meditation)")}
                activeOpacity={0.85}
              >
                <Text style={dynamicStyles.echoBtnSecondaryText}>🧘  Breathe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.px}>
          <View style={dynamicStyles.todoCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.row}>
                <Ionicons name="list" size={18} color={colors.primary} />
                <Text style={[dynamicStyles.sectionTitle, { marginLeft: 8 }]}>Daily Tasks</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/todo')}>
                <Text style={dynamicStyles.sectionLink}>View All →</Text>
              </TouchableOpacity>
            </View>

            {todos.length > 0 ? (
              todos.map((todo, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.todoRow}
                  onPress={() => handleToggleTodo(todo.id, todo.text)}
                  activeOpacity={0.7}
                >
                  <View style={styles.todoCheck}>
                    <Ionicons name="ellipse-outline" size={18} color={colors.textSecondary} />
                  </View>
                  <Text style={dynamicStyles.todoText} numberOfLines={1}>
                    {todo.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.todoEmpty}>
                <Text style={dynamicStyles.todoEmptyText}>
                  {appMode === 'api' ? "No pending tasks! Echo extracts these from your journals." : "Switch to Cloud mode to see AI tasks."}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.px}>
          <TouchableOpacity
            style={dynamicStyles.spaceBtn}
            onPress={() => router.push('/(space)')}
            activeOpacity={0.85}
          >
            <Text style={styles.spaceBtnEmoji}>🌌</Text>
            <View style={{ flex: 1 }}>
              <Text style={dynamicStyles.spaceBtnTitle}>Space</Text>
              <Text style={dynamicStyles.spaceBtnSub}>Draw a card from the community</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.px, styles.lastEntrySection]}>
          <View style={styles.sectionHeader}>
            <Text style={dynamicStyles.sectionTitle}>Last Entry</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/journal")}>
              <Text style={dynamicStyles.sectionLink}>All Entries →</Text>
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
  px: { paddingHorizontal: 16, marginBottom: 16 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#4F6BFF" },

  streakCard: {
    borderRadius: 20,
    padding: 20,
  },
  streakInner: { flexDirection: "row", alignItems: "center" },
  streakEmoji: { fontSize: 26 },
  streakCount: { fontSize: 17, fontWeight: "800", color: "#fff", marginTop: 2 },
  streakSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  streakDivider: { width: 1, height: 44, backgroundColor: "rgba(255,255,255,0.25)", marginHorizontal: 20 },
  xpBlock: { alignItems: "center" },
  xpLabel: { fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: "700", letterSpacing: 1 },
  xpValue: { fontSize: 26, fontWeight: "800", color: "#fff", marginTop: 2 },

  promptBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  writeBtn: {
    backgroundColor: "#4F6BFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  writeBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  echoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  echoImg: { width: 52, height: 52, borderRadius: 12 },
  echoActions: { flexDirection: "row", gap: 10 },
  echoBtnPrimary: {
    flex: 1,
    backgroundColor: "#4F6BFF",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  echoBtnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  lastEntrySection: { marginBottom: 0 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoEmpty: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F2F8",
  },
  todoCheck: {
    marginRight: 10,
  },
  spaceBtnEmoji: { fontSize: 32 },
});