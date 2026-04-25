import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const TTS_ENABLED_KEY = 'echo_tts_enabled';
export const TTS_RATE_KEY = 'echo_tts_rate';

export type TTSRate = 0.8 | 1.0 | 1.3;

export function useTTSPrefs() {
  const [enabled, setEnabledState] = useState(false);
  const [rate, setRateState] = useState<TTSRate>(1.0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([TTS_ENABLED_KEY, TTS_RATE_KEY])
      .then(([[, en], [, rt]]) => {
        if (en !== null) setEnabledState(en === 'true');
        if (rt !== null) {
          const VALID_RATES: TTSRate[] = [0.8, 1.0, 1.3];
          const parsed = parseFloat(rt);
          if (VALID_RATES.includes(parsed as TTSRate)) setRateState(parsed as TTSRate);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setEnabled = async (val: boolean) => {
    setEnabledState(val);
    await AsyncStorage.setItem(TTS_ENABLED_KEY, val.toString());
  };

  const setRate = async (val: TTSRate) => {
    setRateState(val);
    await AsyncStorage.setItem(TTS_RATE_KEY, val.toString());
  };

  return { enabled, rate, setEnabled, setRate, loaded };
}
