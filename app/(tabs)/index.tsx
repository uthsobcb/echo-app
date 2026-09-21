import { EchoAvatar } from "@/component/EchoAvatar";
import ProgressRing from "@/component/gamification/ProgressRing";
import { useGamification } from "@/context/GamificationContext";
import { useStorage } from "@/context/StorageContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/service/api";
import { moodToExpression } from "@/service/mood";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dailyPrompt } from "./../../constant/const";

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

export default function Home() {
  const { user, entries, appMode } = useStorage();
  const { colors, isDark } = useTheme();
  const { state: gam } = useGamification();
  const insets = useSafeAreaInsets();

  const [prompt, setPrompt] = useState("");
  const [topTask, setTopTask] = useState<{ _id: string; todo: string } | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    setPrompt(dailyPrompt[Math.floor(Math.random() * dailyPrompt.length)]);
  }, []);

  // Refetch on every focus, not just once on mount — otherwise the pending-task
  // count goes stale the moment you leave Home and come back after journaling.
  useFocusEffect(
    useCallback(() => {
      if (appMode !== "api") return;
      api.todo
        .getAll()
        .then((data: any) => {
          const pending = (data?.todos ?? []).filter((t: any) => t.status === "pending");
          setPendingCount(pending.length);
          setTopTask(pending[0] ?? null);
        })
        .catch(() => {});
    }, [appMode])
  );

  const echoMessage =
    entries[0]?.comment ||
    "Journal your thoughts — Echo will analyse your mood and share personalised insights here.";
  const echoMood = entries[0]?.mood ?? "";
  const echoExpression = moodToExpression(echoMood);
  const xpBarProgress = gam.xpProgress;
  const streakBonus = gam.currentStreak > 0 && gam.currentStreak % 7 === 0;

  const heroGradient: readonly [string, string, string] = isDark
    ? ["#0A0A1F", "#0F0C35", "#1C1060"]
    : ["#4F6BFF", "#7B3FE4", "#A855F7"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* ─────────────────────────── HERO ─────────────────────────── */}
        <View style={[styles.hero, { paddingTop: insets.top + 20 }]}>
          <LinearGradient colors={heroGradient} style={StyleSheet.absoluteFill} />

          {/* Decorative orbs */}
          <View style={styles.orbTR} />
          <View style={styles.orbBL} />

          {/* Header row */}
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroGreeting}>{greeting()}</Text>
              <Text style={styles.heroName}>{user.name} 👋</Text>
            </View>
            <View style={styles.heroHeaderRight}>
              <TouchableOpacity
                style={styles.levelBadge}
                onPress={() => router.push("/(tabs)/insights")}
              >
                <Text style={styles.levelBadgeText}>Lv.{gam.currentLevel}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
                {user.image || user.avatar ? (
                  <Image
                    source={{ uri: (user.image || user.avatar) as string }}
                    style={styles.heroAvatar}
                  />
                ) : (
                  <View style={styles.heroAvatarFallback}>
                    <Text style={styles.heroAvatarFallbackText}>
                      {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Echo avatar centrepiece */}
          <View style={styles.echoCentre}>
            <View style={styles.echoGlow} />
            <EchoAvatar expression={echoExpression} size={130} animated />
            {echoMood ? (
              <View style={styles.moodChip}>
                <Text style={styles.moodChipText}>✦ {echoMood}</Text>
              </View>
            ) : null}
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statVal}>🔥 {gam.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{gam.totalXp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statVal}>{gam.currentLevel}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
          </View>

          {/* Daily check-in ring — tap to write today's entry (Liven-style mood ring) */}
          <TouchableOpacity
            style={styles.ringWrap}
            onPress={() => router.push("/(tabs)/create")}
            activeOpacity={0.85}
          >
            <ProgressRing
              progress={xpBarProgress}
              size={116}
              strokeWidth={9}
              color={gam.dailyGoalMet ? "#22C55E" : "#FCD34D"}
              bgColor="rgba(255,255,255,0.18)"
            >
              <Ionicons
                name={gam.dailyGoalMet ? "checkmark" : "add"}
                size={22}
                color="#fff"
              />
              <Text style={styles.ringLabel}>
                {gam.dailyGoalMet ? "Entry Done!" : "Write Entry"}
              </Text>
            </ProgressRing>
            <Text style={styles.xpHint}>
              {gam.xpInCurrentLevel} / {gam.xpToNextLevel} XP → Lv.{gam.currentLevel + 1}
            </Text>
          </TouchableOpacity>

          {/* Streak at risk */}
          {gam.streakAtRisk && !gam.dailyGoalMet && (
            <View style={styles.riskBanner}>
              <Ionicons name="warning-outline" size={14} color="#FCD34D" />
              <Text style={styles.riskText}>
                Your {gam.currentStreak}-day streak ends tonight!
              </Text>
            </View>
          )}
        </View>

        {/* ─────────────────────── ECHO INSIGHT ─────────────────────── */}
        <View style={styles.insightWrap}>
          <View style={[styles.insightCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.insightHeader}>
              <View style={[styles.insightIconWrap, { backgroundColor: colors.surfaceSecondary }]}>
                <EchoAvatar expression={echoExpression} size={44} animated={false} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>Echo says</Text>
                {echoMood ? (
                  <View style={[styles.moodPill, { backgroundColor: colors.surfaceSecondary }]}>
                    <Text style={[styles.moodPillText, { color: colors.primary }]}>
                      Mood · {echoMood}
                    </Text>
                  </View>
                ) : null}
              </View>
              <TouchableOpacity
                style={[styles.talkBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(chat)")}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-ellipses" size={14} color="#fff" />
                <Text style={styles.talkBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.insightBody, { color: colors.textSecondary }]} numberOfLines={3}>
              {echoMessage}
            </Text>
          </View>
        </View>

        {/* ──────────────────────── ACTION GRID ─────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today</Text>
          {gam.dailyGoalMet && (
            <View style={styles.goalMetBadge}>
              <Text style={styles.goalMetText}>✅ Goal complete</Text>
            </View>
          )}
        </View>

        <View style={styles.grid}>
          {/* Write */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => router.push("/(tabs)/create")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={gam.dailyGoalMet ? ["#059669", "#10B981"] : ["#4F6BFF", "#6366F1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCardGradient}
            >
              <View style={styles.gridCardIconWrap}>
                <Ionicons name={gam.dailyGoalMet ? "checkmark-circle" : "pencil"} size={24} color="#fff" />
              </View>
              <Text style={styles.gridCardTitle}>
                {gam.dailyGoalMet ? "Entry Done!" : "Write Entry"}
              </Text>
              <Text style={styles.gridCardSub}>
                {gam.dailyGoalMet ? "Come back tomorrow" : "Journal your day"}
              </Text>
              {!gam.dailyGoalMet && (
                <View style={styles.xpChip}>
                  <Text style={styles.xpChipText}>+10 XP</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Chat */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => router.push("/(chat)")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#7B3FE4", "#A855F7"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridCardGradient}
            >
              <View style={styles.gridCardIconWrap}>
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
              </View>
              <Text style={styles.gridCardTitle}>Talk to Echo</Text>
              <Text style={styles.gridCardSub}>AI companion</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Tasks */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => router.push("/todo")}
            activeOpacity={0.85}
          >
            <View style={[styles.gridCardSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.gridCardTop}>
                <View style={[styles.gridSurfaceIcon, { backgroundColor: "#EEF1FF" }]}>
                  <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
                </View>
                {pendingCount > 0 && (
                  <View style={[styles.gridBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.gridBadgeText}>{pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.gridSurfaceTitle, { color: colors.text }]}>My Tasks</Text>
              <Text style={[styles.gridSurfaceSub, { color: colors.textSecondary }]} numberOfLines={2}>
                {topTask ? topTask.todo : "All caught up!"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Breathe */}
          <TouchableOpacity
            style={styles.gridCell}
            onPress={() => router.push("/(meditation)")}
            activeOpacity={0.85}
          >
            <View style={[styles.gridCardSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.gridCardTop}>
                <View style={[styles.gridSurfaceIcon, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons name="leaf-outline" size={20} color="#10B981" />
                </View>
              </View>
              <Text style={[styles.gridSurfaceTitle, { color: colors.text }]}>Breathe</Text>
              <Text style={[styles.gridSurfaceSub, { color: colors.textSecondary }]}>
                Box breathing
              </Text>
            </View>
          </TouchableOpacity>

          {/* Space */}
          {appMode === "api" && (
            <TouchableOpacity
              style={styles.gridCell}
              onPress={() => router.push("/(space)")}
              activeOpacity={0.85}
            >
              <View style={[styles.gridCardSurface, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.gridCardTop}>
                  <View style={[styles.gridSurfaceIcon, { backgroundColor: "#FFF7ED" }]}>
                    <Ionicons name="planet-outline" size={20} color="#F97316" />
                  </View>
                </View>
                <Text style={[styles.gridSurfaceTitle, { color: colors.text }]}>Space</Text>
                <Text style={[styles.gridSurfaceSub, { color: colors.textSecondary }]}>
                  Community thoughts
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ──────────────────────── DAILY PROMPT ────────────────────── */}
        <View style={styles.px}>
          <LinearGradient
            colors={isDark ? ["#0F0C35", "#1C1060"] : ["#F5F3FF", "#EDE9FE"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.promptCard, { borderColor: isDark ? "rgba(167,139,250,0.2)" : "#DDD6FE" }]}
          >
            <View style={styles.promptTop}>
              <Ionicons name="sparkles" size={14} color="#A78BFA" />
              <Text style={[styles.promptLabel, { color: "#A78BFA" }]}>DAILY CHALLENGE</Text>
            </View>
            <Text style={[styles.promptText, { color: isDark ? "#E9D5FF" : "#4C1D95" }]}>
              "{prompt}"
            </Text>
            <TouchableOpacity
              style={styles.promptBtn}
              onPress={() => router.push("/(tabs)/create")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#7C3AED", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.promptBtnGradient}
              >
                <Ionicons name="pencil-outline" size={16} color="#fff" />
                <Text style={styles.promptBtnText}>Write Now</Text>
                <View style={styles.promptXp}>
                  <Text style={styles.promptXpText}>+10 XP</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
            {streakBonus && (
              <View style={styles.bonusBanner}>
                <Text style={styles.bonusText}>🔥 7-day streak bonus — +50 XP today!</Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const GRID_GAP = 12;

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Hero ──────────────────────────────────────────────────────────
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: "hidden",
  },
  orbTR: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(167,139,250,0.18)",
    top: -60,
    right: -60,
  },
  orbBL: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(79,107,255,0.15)",
    bottom: -40,
    left: -40,
  },

  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  heroGreeting: { fontSize: 13, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  heroName:    { fontSize: 26, color: "#fff", fontWeight: "800", marginTop: 2 },
  heroHeaderRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  levelBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  levelBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  heroAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: "rgba(255,255,255,0.5)",
  },
  heroAvatarFallback: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.4)",
  },
  heroAvatarFallbackText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  echoCentre: { alignItems: "center", marginBottom: 28 },
  echoGlow: {
    position: "absolute",
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -14,
  },
  moodChip: {
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  moodChipText: { color: "#fff", fontSize: 12, fontWeight: "700", letterSpacing: 0.5 },

  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 0,
    marginBottom: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statVal:  { color: "#fff", fontSize: 20, fontWeight: "900" },
  statLabel:{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 2, fontWeight: "600" },
  statDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

  ringWrap: { alignItems: "center", gap: 8 },
  ringLabel: { color: "#fff", fontSize: 11, fontWeight: "800", marginTop: 2 },
  xpHint: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "600" },

  riskBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(239,68,68,0.2)",
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
  },
  riskText: { color: "#FCD34D", fontSize: 12, fontWeight: "700", flex: 1 },

  // ── Echo Insight ─────────────────────────────────────────────────
  insightWrap: { paddingHorizontal: 16, marginTop: -16, marginBottom: 16, zIndex: 10 },
  insightCard: {
    borderRadius: 22, padding: 16, borderWidth: 1,
    shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  insightHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  insightIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  insightTitle: { fontSize: 15, fontWeight: "800" },
  moodPill: {
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: "flex-start", marginTop: 3,
  },
  moodPillText: { fontSize: 11, fontWeight: "700" },
  talkBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
  },
  talkBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  insightBody: { fontSize: 13, lineHeight: 20 },

  // ── Section header ───────────────────────────────────────────────
  sectionHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  goalMetBadge: {
    backgroundColor: "#DCFCE7", borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  goalMetText: { color: "#166534", fontSize: 11, fontWeight: "700" },

  // ── Action Grid ──────────────────────────────────────────────────
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: GRID_GAP,
    marginBottom: 20,
  },
  gridCell: { width: `${(100 - GRID_GAP) / 2}%` as any },

  gridCardGradient: {
    borderRadius: 22, padding: 18, minHeight: 150,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  gridCardIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  gridCardTitle: { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 2 },
  gridCardSub:   { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "500" },
  xpChip: {
    alignSelf: "flex-start", marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  xpChipText: { color: "#FCD34D", fontSize: 11, fontWeight: "800" },

  gridCardSurface: {
    borderRadius: 22, padding: 16, minHeight: 150,
    borderWidth: 1, justifyContent: "flex-end",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  gridCardTop: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 12,
  },
  gridSurfaceIcon: {
    width: 42, height: 42, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  gridBadge: {
    borderRadius: 10, minWidth: 22, height: 22,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 6,
  },
  gridBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  gridSurfaceTitle: { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  gridSurfaceSub:   { fontSize: 11, lineHeight: 15 },

  // ── Daily Prompt ─────────────────────────────────────────────────
  px: { paddingHorizontal: 16 },
  promptCard: {
    borderRadius: 24, padding: 20, borderWidth: 1,
    overflow: "hidden",
  },
  promptTop: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  promptLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.2 },
  promptText: { fontSize: 16, lineHeight: 24, fontStyle: "italic", marginBottom: 18, fontWeight: "500" },
  promptBtn: { borderRadius: 14, overflow: "hidden" },
  promptBtnGradient: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 13, gap: 8,
  },
  promptBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  promptXp: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  promptXpText: { color: "#FCD34D", fontSize: 11, fontWeight: "800" },
  bonusBanner: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10, paddingVertical: 8,
    paddingHorizontal: 12, marginTop: 12,
  },
  bonusText: { color: "#FCD34D", fontWeight: "700", fontSize: 12, textAlign: "center" },
});
