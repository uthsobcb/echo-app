import EntryCard from "@/component/EntryCard";
import { useStorage } from "@/context/StorageContext";
import { api } from "@/service/api";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
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

export default function Home() {
  const { user, stats, entries, appMode } = useStorage();
  const [prompt, setPrompt] = useState("");
  const [todos, setTodos] = useState<any[]>([]);
  const [completedTodos, setCompletedTodos] = useState<string[]>([]);

  useEffect(() => {
    const randomPrompt = dailyPrompt[Math.floor(Math.random() * dailyPrompt.length)];
    setPrompt(randomPrompt);
    if (appMode === 'api') loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      const data = await api.todo.getAll();
      // API returns array of mood objects with todo array inside
      const allTodos: any[] = [];
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (Array.isArray(item.todo)) {
            item.todo.forEach((t: string) => allTodos.push({ id: item._id, text: t }));
          }
        });
      }
      setTodos(allTodos.slice(0, 5));
    } catch (e) {
      console.error('[Home] Failed to load todos', e);
    }
  };

  const handleToggleTodo = async (todoId: string, todo: string) => {
    const key = `${todoId} -${todo} `;
    const isCompleted = completedTodos.includes(key);
    if (isCompleted) {
      setCompletedTodos(prev => prev.filter(t => t !== key));
    } else {
      setCompletedTodos(prev => [...prev, key]);
      try { await api.todo.updateStatus(todoId, 'done'); } catch { }
    }
  };

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{user.name} 👋</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(chat)")}>
              <Ionicons name="chatbubble-ellipses" color="#4F6BFF" size={22} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
              <Image
                source={require("../../assets/images/avatar.png")}
                style={styles.avatar}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Streak / XP Banner ── */}
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
                <Text style={styles.xpValue}>{stats.tasks}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Daily Prompt Card ── */}
        <View style={styles.px}>
          <View style={styles.promptCard}>
            <View style={styles.promptBadge}>
              <Ionicons name="sparkles" size={13} color="#4F6BFF" />
              <Text style={styles.promptBadgeText}>DAILY PROMPT</Text>
            </View>
            <Text style={styles.promptTitle}>Ready to reflect?</Text>
            <Text style={styles.promptText}>{prompt}</Text>
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

        {/* ── Echo AI Card ── */}
        <View style={styles.px}>
          <View style={styles.echoCard}>
            <View style={styles.echoHeader}>
              <Image
                source={require("../../assets/images/frustated-echo.webp")}
                style={styles.echoImg}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.echoTitle}>Echo Says…</Text>
                {(user as any).mood ? (
                  <View style={styles.moodPill}>
                    <Text style={styles.moodPillText}>Mood: {(user as any).mood}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <Text style={styles.echoBody}>
              It seems you've been feeling a bit low this week. Would you like
              to talk, or try a quick breathing exercise?
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
                style={styles.echoBtnSecondary}
                onPress={() => router.push("/(meditation)")}
                activeOpacity={0.85}
              >
                <Text style={styles.echoBtnSecondaryText}>🧘  Breathe</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── To-Do Widget ── */}
        {todos.length > 0 && (
          <View style={styles.px}>
            <View style={styles.todoCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your To-Dos</Text>
                <TouchableOpacity>
                  <Text style={styles.sectionLink}>See all →</Text>
                </TouchableOpacity>
              </View>
              {todos.map((todo, i) => {
                const key = `${todo.id} -${todo.text} `;
                const done = completedTodos.includes(key);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.todoRow}
                    onPress={() => handleToggleTodo(todo.id, todo.text)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.todoCheck, done && styles.todoCheckDone]}>
                      {done && <MaterialIcons name="check" size={12} color="#fff" />}
                    </View>
                    <Text style={[styles.todoText, done && styles.todoTextDone]} numberOfLines={1}>
                      {todo.text}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Space Button ── */}
        <View style={styles.px}>
          <TouchableOpacity
            style={styles.spaceBtn}
            onPress={() => router.push('/(space)')}
            activeOpacity={0.85}
          >
            <Text style={styles.spaceBtnEmoji}>🌌</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.spaceBtnTitle}>Space</Text>
              <Text style={styles.spaceBtnSub}>Draw a card from the community</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4F6BFF" />
          </TouchableOpacity>
        </View>

        {/* ── Last Entry ── */}
        <View style={[styles.px, styles.lastEntrySection]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Last Entry</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/journal")}>
              <Text style={styles.sectionLink}>All Entries →</Text>
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
  safeArea: { flex: 1, backgroundColor: "#F5F6FA" },
  scroll: { flex: 1, backgroundColor: "#F5F6FA" },
  px: { paddingHorizontal: 16, marginBottom: 16 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14, color: "#7A8499", fontWeight: "500" },
  userName: { fontSize: 24, fontWeight: "800", color: "#1A1D2E" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: {
    backgroundColor: "#EEF1FF",
    borderRadius: 50,
    padding: 10,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: "#4F6BFF" },

  // Streak Banner
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

  // Prompt Card
  promptCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#4F6BFF",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  promptBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 10 },
  promptBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4F6BFF",
    letterSpacing: 1.2,
  },
  promptTitle: { fontSize: 22, fontWeight: "800", color: "#1A1D2E", marginBottom: 8 },
  promptText: { fontSize: 15, color: "#7A8499", lineHeight: 22, marginBottom: 18 },
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

  // Echo Card
  echoCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  echoHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  echoImg: { width: 52, height: 52, borderRadius: 12 },
  echoTitle: { fontSize: 16, fontWeight: "700", color: "#1A1D2E" },
  moodPill: {
    backgroundColor: "#EEF1FF",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  moodPillText: { fontSize: 12, color: "#4F6BFF", fontWeight: "600" },
  echoBody: { fontSize: 14, color: "#7A8499", lineHeight: 21, marginBottom: 14 },
  echoActions: { flexDirection: "row", gap: 10 },
  echoBtnPrimary: {
    flex: 1,
    backgroundColor: "#4F6BFF",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  echoBtnPrimaryText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  echoBtnSecondary: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E8F0",
  },
  echoBtnSecondaryText: { color: "#4F6BFF", fontWeight: "700", fontSize: 14 },

  // Last Entry
  lastEntrySection: { marginBottom: 0 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1A1D2E" },
  sectionLink: { fontSize: 13, color: "#4F6BFF", fontWeight: "600" },

  // To-Do widget
  todoCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: "#E5E8F0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  todoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  todoCheck: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    borderColor: "#B0BAD0", alignItems: "center", justifyContent: "center",
  },
  todoCheckDone: { backgroundColor: "#4F6BFF", borderColor: "#4F6BFF" },
  todoText: { fontSize: 14, color: "#1A1D2E", flex: 1 },
  todoTextDone: { textDecorationLine: "line-through", color: "#B0BAD0" },

  // Space button
  spaceBtn: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14,
    borderWidth: 1.5, borderColor: "#E5E8F0",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  spaceBtnEmoji: { fontSize: 32 },
  spaceBtnTitle: { fontSize: 16, fontWeight: "800", color: "#1A1D2E" },
  spaceBtnSub: { fontSize: 12, color: "#7A8499", marginTop: 2 },
});
