# Echo Identity System — Design Spec

**Date:** 2026-04-25  
**Scope:** Echo character, theme revamp, onboarding, chat revamp, meditation revamp  
**Approach:** Foundation-first (Echo component + palette), then screens  

---

## 1. Echo Character System

### Component
- File: `component/EchoAvatar/index.tsx`
- Expression map: `component/EchoAvatar/expressions.ts`
- Library: `react-native-svg` (SVG rendering) + `react-native-reanimated` (animation)
- Both already in `package.json` — no new installs for this component

### Shape
Cloud silhouette — rounded bumps on top, flat base. Fill: `echoCloud` theme token (gradient day/night).

### Face Elements
All elements are animated via `react-native-reanimated` shared values:

| Element | Animation |
|---|---|
| Eyes (circles) | scale for blink, Y-offset for look direction |
| Pupils (small circles) | X/Y shift for curiosity/attention |
| Eyebrows (arcs) | rotate + translate for emotion |
| Mouth (SVG path) | morphs: smile / neutral / frown / "O" |
| Blush (soft circles) | opacity toggle for shy/happy |
| Sparkles (star shapes) | appear for excited/proud states |

### Expression States (8)

| State | Trigger context |
|---|---|
| `happy` | streak complete, positive chat, onboarding greeting |
| `calm` | meditation active, default idle |
| `thinking` | waiting for AI response |
| `excited` | XP earned, milestone, onboarding final step |
| `sad` | user missed streak, negative mood log |
| `curious` | onboarding questions, deep chat question |
| `proud` | badge unlocked, meditation complete |
| `sleepy` | late night session, meditation exhale phase |

### Animation Rules
- Expression transitions: spring physics (not linear easing)
- Idle: gentle float `translateY` loop, ±4px, 3s period
- Speaking mode: mouth animates in loop (for TTS playback)

### Props Interface
```ts
interface EchoAvatarProps {
  expression: 'happy' | 'calm' | 'thinking' | 'excited' | 'sad' | 'curious' | 'proud' | 'sleepy';
  size?: number;          // default 120
  animated?: boolean;     // idle float, default true
  speaking?: boolean;     // mouth loop for TTS, default false
}
```

---

## 2. Theme / Palette System

### Strategy
Extend existing `ThemeContext.tsx`. Add `accent` and `echoCloud` tokens to `ThemeColors` interface.  
Update `tailwind.config.js` with all tokens.

### Day Palette (light mode)

| Token | Value | Use |
|---|---|---|
| `background` | `#EEF6FF` | sky white-blue |
| `surface` | `#FFFFFF` | cloud white |
| `surfaceSecondary` | `#F0F7FF` | mist |
| `primary` | `#5B9BF8` | sky blue |
| `accent` | `#FFB347` | golden sun |
| `text` | `#1A2A4A` | deep navy |
| `textSecondary` | `#6B8CAE` | faded sky |
| `border` | `#C8DFF5` | cloud edge |
| `echoCloud` | `#D6EAFF` | Echo body fill |

### Night Palette (dark mode)

| Token | Value | Use |
|---|---|---|
| `background` | `#0A0E1A` | deep space |
| `surface` | `#131929` | midnight |
| `surfaceSecondary` | `#1C2540` | dark navy |
| `primary` | `#7EB8FF` | moonlit blue |
| `accent` | `#C084FC` | soft purple |
| `text` | `#E8F0FF` | starlight |
| `textSecondary` | `#7A94C0` | dim star |
| `border` | `#2A3A5C` | night edge |
| `echoCloud` | `#1E2D50` | Echo body fill dark |

### Gradients

| Mode | Value |
|---|---|
| Day | `['#C9E8FF', '#EEF6FF']` top→bottom |
| Night | `['#0A0E1A', '#131929', '#1C2540']` top→bottom |

Used on: onboarding background, meditation background, Echo container backgrounds.

---

## 3. Onboarding Flow

### Route
`app/(onboarding)/index.tsx`  
`app/(onboarding)/_layout.tsx`

### Trigger
`app/index.tsx` reads `onboardingComplete` from AsyncStorage.  
- `false` → redirect to `/(onboarding)/`  
- `true` → redirect to `/(tabs)/`

### 5-Step Flow (single screen, animated transitions)

**Step 1 — Echo wakes up**
- Echo: `sleepy` → `happy` (auto-transition on mount)
- Text: `"Hey... I'm Echo."` — typewriter effect
- No input. Tap anywhere to continue.

**Step 2 — Name**
- Echo: `curious`
- Text: `"What should I call you?"`
- Centered `TextInput`, soft styled
- Echo mouth animates subtly while user types

**Step 3 — Intent**
- Echo: `happy`
- Text: `"What brought you to me, [name]?"`
- Multi-select chips (4 options):
  - "I need someone to talk to"
  - "I want to build better habits"
  - "I want to meditate more"
  - "I'm just exploring"

**Step 4 — Echo responds**
- Echo: `calm` or `proud` (based on selection)
- Text: personalized to selection
  - talk → `"I'm here. Always."`
  - habits → `"Let's build something solid together."`
  - meditate → `"Let's find your calm."`
  - explore → `"Wander with me."`
- Cloud particles float upward behind Echo (implement as 5-8 small `Animated.View` circles with randomized translateY + opacity — no external particle library)

**Step 5 — Enter together**
- Echo: `excited`, size=180
- Text: `"Ready?"`
- CTA: "Let's go" → saves data → navigates to `/(tabs)/`
- No skip button

### Data Saved (StorageContext)
```ts
{
  userName: string,
  onboardingGoals: string[],  // selected chip values
  onboardingComplete: true
}
```

`StorageContext.tsx` must add these three fields to its state + AsyncStorage keys. Expose via context: `userName`, `onboardingGoals`, `onboardingComplete`, `completeOnboarding(data)` setter.

### Animation
- Step transitions: slide + fade via `react-native-reanimated`
- Background gradient pulses gently between steps
- Echo expression auto-transitions per step (spring physics)

---

## 4. Chat Revamp

### Echo Persona (System Prompt)
Injected in `ChatContext.tsx` as system message:

```
You are Echo, a gentle cloud spirit who listens deeply and responds with warmth.
Adapt your tone: playful when the user is light, calm when they need grounding,
wise when they ask deep questions. Always speak as Echo, never break character.
Keep responses concise — you speak, not lecture.
```

### Header
- Replace generic icon with `<EchoAvatar size={36} expression={echoMood} animated={false} />`
- `echoMood` derived from last AI message via keyword scan (no external NLP)

### Mood → Expression Mapping (chat)

| Signal | Expression |
|---|---|
| First message / greeting | `happy` |
| Keywords: sad, stressed, anxious, tired | `sad` |
| Waiting for AI response | `thinking` |
| Keywords: milestone, achieved, proud, did it | `excited` |
| Keywords: why, how, meaning, wonder | `curious` |
| Default | `calm` |

### Typing Indicator
Replace current dot animation with `<EchoAvatar size={40} expression="thinking" speaking={true} />` + gentle bounce.

### Dependency
`expo-speech` not yet in project. Install: `npx expo install expo-speech`  
Note: `expo-speech-recognition` (STT) already installed — useful for future STT scope.

### TTS — Echo Speaks (`expo-speech`)

Flow:
1. AI response arrives
2. If TTS enabled: `Speech.speak(responseText, { rate, language })`
3. `EchoAvatar speaking={true}` during playback
4. `speaking={false}` on `onDone` callback
5. Tap Echo avatar → re-read last message

TTS settings in `SettingsModal`:
- Toggle: "Let Echo speak" (default: off)
- Speed: Slow (0.8) / Normal (1.0) / Fast (1.3)
- Voice: system default (custom voice = future scope)

### STT Placeholder
- Mic icon in `ChatInput`, grayed out
- Tooltip / disabled state: "Coming soon"
- No functionality wired

---

## 5. Meditation Revamp

### Visual Layout
```
[full-screen sky gradient background]

  [duration chips — top bar]
  3 min | 5 min | 10 min | 15 min

  [EchoAvatar size=220, center screen]
  expression: calm
  speaking={isGuiding}
  
  [breathing ring — behind Echo]
  semi-transparent circle, pulses with breath phase
  
  [phase label — below Echo]
  "Breathe in..." / "Hold..." / "Breathe out..."
  typewriter fade, synced to breath timer
  
  [start/pause button — bottom center]
  [BGM toggle — bottom right]
```

### Echo Behavior Per Phase

| Phase | Expression | Animation |
|---|---|---|
| Idle (not started) | `calm` | gentle float |
| Inhale | `calm` | scale 1.0→1.15, ring expands |
| Hold | `calm` | scale holds, subtle shimmer |
| Exhale | `sleepy` | scale 1.15→1.0, ring contracts |
| Session complete | `proud` → `happy` | sparkle burst, expression transition |
| BGM on | `calm` | musical note particle floats off Echo |

Echo scale animation replaces current circle expand/contract. Breathing ring stays as soft halo behind Echo.

### TTS Breath Cues (`expo-speech`)
Uses same toggle as chat. Rate locked to `0.75`.

Cues:
- Inhale: `"Breathe in... slowly."`
- Hold: `"Hold... gently."`
- Exhale: `"Breathe out... let it go."`

`EchoAvatar speaking={true}` during each cue.

### Unchanged
- Timer logic
- BGM loading (`assets/bgm.mp3`)
- Duration options

---

## 6. Scope Boundaries

### Current Scope

| Feature | Notes |
|---|---|
| `EchoAvatar` SVG component, 8 expressions | Foundation — built first |
| Sky palette day/night + Tailwind update | Foundation — built second |
| Onboarding 5-step flow | Built on foundation |
| Chat: Echo persona system prompt | ChatContext update |
| Chat: Echo avatar header + mood mapping | Visual identity |
| Chat: TTS via `expo-speech` + settings | Echo speaks |
| Chat: STT mic placeholder (disabled) | UI only |
| Meditation: Echo as breathing guide | Visual layer swap |
| Meditation: TTS breath cues | Echo guides aloud |

### Future Scope

| Feature | Notes |
|---|---|
| STT — user speaks to Echo | `expo-av` + Whisper API or on-device |
| Full voice conversation (STT+TTS loop) | Push-to-talk mode |
| Echo custom voice | ElevenLabs or custom TTS model |
| Echo personality evolution | Learns user patterns, adapts tone |
| Echo mood persistence across sessions | Remembers last mood |
| Echo in journal/todo screens | Out of scope now by design |
| Cloud particle system | Full atmospheric background |
| Expressions 9+ | Expandable beyond initial 8 |

---

## 7. Build Order

1. `EchoAvatar` component + `expressions.ts`
2. Theme palette tokens + Tailwind config
3. Onboarding flow (`app/(onboarding)/`)
4. Chat revamp (persona + avatar + mood + TTS)
5. Meditation revamp (Echo visual + TTS cues)
