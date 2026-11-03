import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import { SCENES } from '../art/scenes';
import { colors } from '../theme';

// The chapter's setting as a band across the top of a screen that fades into the plain
// background, so text further down stays easy to read. Put it first inside the screen's container.
// height: how tall the band is; the lower half of it is the fade.
export default function SceneBackground({ scene, height = 260 }) {
  const xml = SCENES[scene];
  if (!xml) return null;
  return (
    <View style={[styles.band, { height }]} pointerEvents="none">
      <SvgXml xml={xml} width="100%" height="100%" />
      <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
        <Defs>
          <LinearGradient id="scene-fade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.mist} stopOpacity="0.15" />
            <Stop offset="0.4" stopColor={colors.mist} stopOpacity="0.35" />
            <Stop offset="0.85" stopColor={colors.mist} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#scene-fade)" />
      </Svg>
    </View>
  );
}

// The scene as a short banner, e.g. at the top of the step sheet.
export function SceneBanner({ scene, height = 110, style }) {
  const xml = SCENES[scene];
  if (!xml) return null;
  return (
    <View style={[{ height, overflow: 'hidden' }, style]}>
      <SvgXml xml={xml} width="100%" height="100%" />
    </View>
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, left: 0, right: 0 },
});
