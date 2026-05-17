import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const LOCK_COLOR = "#111111";

const SHACKLE_WIDTH = 42;
const SHACKLE_ARCH_HEIGHT = 40;
const SHACKLE_STROKE = 6;
const SHACKLE_LONG_LEG = 30;
const SHACKLE_SHORT_LEG = 10;
const SPARK_DOT_SIZE = 4.2;
const EASE_OUT_QUINT = Easing.bezier(0.23, 1, 0.32, 1);
const EASE_OUT_CUBIC = Easing.bezier(0.215, 0.61, 0.355, 1);
const EASE_IN_OUT_QUART = Easing.bezier(0.77, 0, 0.175, 1);
const EASE_IN_OUT_CUBIC = Easing.bezier(0.645, 0.045, 0.355, 1);
const SPARK_OPEN_DELAY = 110;
const SPARK_OPEN_DURATION = 720;
const SPARK_CLOSE_DELAY = 255;
const SPARK_CLOSE_DURATION = 620;

export function LockOrb() {
	const { width } = useWindowDimensions();
	const progress = useSharedValue(0);
	const pressScale = useSharedValue(1);
	const sparkProgress = useSharedValue(0);
	const shouldReduceMotion = useReducedMotion();

	const orbSize = Math.min(width * 0.66, 260);
	const iconScale = orbSize / 260;

	const orbAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
	}));

	const shackleAnimatedStyle = useAnimatedStyle(() => {
		const liftY = interpolate(
			progress.value,
			[0, 0.1, 0.88, 1],
			[0, -10 * iconScale, -13 * iconScale, -13 * iconScale],
		);
		const hingeRotation = interpolate(
			progress.value,
			[0, 0.1, 0.88, 1],
			[0, 0, -186, -180],
		);

		return {
			transformOrigin: [
				(SHACKLE_STROKE / 2) * iconScale,
				((SHACKLE_ARCH_HEIGHT + SHACKLE_LONG_LEG) / 2) * iconScale,
				0,
			],
			transform: [
				{ translateY: liftY },
				{ perspective: 360 * iconScale },
				{ rotateY: `${-hingeRotation}deg` },
			],
		};
	});

	const sparkOneDotAnimatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			sparkProgress.value,
			[0, 0.04, 0.74, 1],
			[0, 0.96, 0.88, 0],
		);
		const scale = interpolate(
			sparkProgress.value,
			[0, 0.12, 0.78, 1],
			[0.62, 1, 0.82, 0.18],
		);
		const translateX = interpolate(
			sparkProgress.value,
			[0, 1],
			[0, 13 * iconScale],
		);
		const translateY = interpolate(
			sparkProgress.value,
			[0, 1],
			[0, -13 * iconScale],
		);

		return {
			opacity,
			transform: [{ translateX }, { translateY }, { scale }],
		};
	});

	const sparkTwoDotAnimatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			sparkProgress.value,
			[0, 0.04, 0.72, 1],
			[0, 0.88, 0.78, 0],
		);
		const scale = interpolate(
			sparkProgress.value,
			[0, 0.1, 0.76, 1],
			[0.62, 1, 0.78, 0.16],
		);
		const translateX = interpolate(
			sparkProgress.value,
			[0, 1],
			[0, 16 * iconScale],
		);

		return {
			opacity,
			transform: [{ translateX }, { scale }],
		};
	});

	const sparkThreeDotAnimatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
			sparkProgress.value,
			[0, 0.05, 0.7, 1],
			[0, 0.78, 0.66, 0],
		);
		const scale = interpolate(
			sparkProgress.value,
			[0, 0.14, 0.76, 1],
			[0.62, 1, 0.74, 0.14],
		);
		const translateX = interpolate(
			sparkProgress.value,
			[0, 1],
			[0, 12 * iconScale],
		);
		const translateY = interpolate(
			sparkProgress.value,
			[0, 1],
			[0, 12 * iconScale],
		);

		return {
			opacity,
			transform: [{ translateX }, { translateY }, { scale }],
		};
	});

	const handlePress = async () => {
		const next = progress.value === 0 ? 1 : 0;

		cancelAnimation(progress);
		cancelAnimation(pressScale);
		cancelAnimation(sparkProgress);

		if (shouldReduceMotion) {
			pressScale.value = 1;
			progress.value = next;
			sparkProgress.value = 0;
			await Haptics.impactAsync(
				next === 1
					? Haptics.ImpactFeedbackStyle.Light
					: Haptics.ImpactFeedbackStyle.Soft,
			);
			return;
		}

		pressScale.value = withSequence(
			withTiming(0.968, {
				duration: 70,
				easing: EASE_OUT_CUBIC,
			}),
			withTiming(1.006, {
				duration: 130,
				easing: EASE_OUT_QUINT,
			}),
			withTiming(1, {
				duration: 110,
				easing: EASE_OUT_CUBIC,
			}),
		);

		if (next === 1) {
			sparkProgress.value = 0;
			sparkProgress.value = withSequence(
				withTiming(0, {
					duration: SPARK_OPEN_DELAY,
					easing: Easing.linear,
				}),
				withTiming(1, {
					duration: SPARK_OPEN_DURATION,
					easing: EASE_OUT_QUINT,
				}),
			);
			progress.value = withSequence(
				withTiming(0.1, {
					duration: 70,
					easing: EASE_OUT_QUINT,
				}),
				withTiming(0.88, {
					duration: 260,
					easing: EASE_IN_OUT_QUART,
				}),
				withTiming(1, {
					duration: 90,
					easing: EASE_OUT_CUBIC,
				}),
			);
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			return;
		}

		sparkProgress.value = 0;
		sparkProgress.value = withSequence(
			withTiming(0, {
				duration: SPARK_CLOSE_DELAY,
				easing: Easing.linear,
			}),
			withTiming(1, {
				duration: SPARK_CLOSE_DURATION,
				easing: EASE_OUT_QUINT,
			}),
		);
		progress.value = withSequence(
			withTiming(0.1, {
				duration: 245,
				easing: EASE_IN_OUT_CUBIC,
			}),
			withTiming(0, {
				duration: 95,
				easing: EASE_OUT_QUINT,
			}),
		);
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
	};

	return (
		<AnimatedPressable
			accessibilityRole="button"
			accessibilityLabel="Toggle focus lock"
			onPress={handlePress}
			style={[
				styles.orb,
				orbAnimatedStyle,
				{
					width: orbSize,
					height: orbSize,
					borderRadius: orbSize / 2,
				},
			]}
		>
			<View
				style={[
					styles.iconFrame,
					{
						width: 102 * iconScale,
						height: 118 * iconScale,
					},
				]}
			>
				<Animated.View
					style={[
						styles.shackleWrap,
						shackleAnimatedStyle,
						{
							width: SHACKLE_WIDTH * iconScale,
							height: (SHACKLE_ARCH_HEIGHT + SHACKLE_LONG_LEG) * iconScale,
							left: 30 * iconScale,
							top: 5 * iconScale,
						},
					]}
				>
					<View
						style={[
							styles.shackleArch,
							{
								width: SHACKLE_WIDTH * iconScale,
								height: SHACKLE_ARCH_HEIGHT * iconScale,
								borderTopLeftRadius: (SHACKLE_WIDTH / 2) * iconScale,
								borderTopRightRadius: (SHACKLE_WIDTH / 2) * iconScale,
								borderTopWidth: SHACKLE_STROKE * iconScale,
								borderLeftWidth: SHACKLE_STROKE * iconScale,
								borderRightWidth: SHACKLE_STROKE * iconScale,
							},
						]}
					/>
					<View
						style={[
							styles.shackleLongLeg,
							{
								width: SHACKLE_STROKE * iconScale,
								height: SHACKLE_LONG_LEG * iconScale,
								borderRadius: (SHACKLE_STROKE / 2) * iconScale,
								left: 0,
								top: (SHACKLE_ARCH_HEIGHT - 1) * iconScale,
							},
						]}
					/>
					<View
						style={[
							styles.shackleShortLeg,
							{
								width: SHACKLE_STROKE * iconScale,
								height: SHACKLE_SHORT_LEG * iconScale,
								borderRadius: (SHACKLE_STROKE / 2) * iconScale,
								right: 0,
								top: (SHACKLE_ARCH_HEIGHT - 1) * iconScale,
							},
						]}
					/>
				</Animated.View>

				<Animated.View
					style={[
						styles.body,
						{
							width: 54 * iconScale,
							height: 48 * iconScale,
							left: 24 * iconScale,
							top: 48 * iconScale,
							borderRadius: 10 * iconScale,
							borderWidth: 6 * iconScale,
						},
					]}
				/>

				<View
					style={[
						styles.sparkWrap,
						{
							left: 71 * iconScale,
							top: 39 * iconScale,
						},
					]}
				>
					<Animated.View
						style={[
							styles.sparkDot,
							sparkOneDotAnimatedStyle,
							{
								width: SPARK_DOT_SIZE * iconScale,
								height: SPARK_DOT_SIZE * iconScale,
								borderRadius: (SPARK_DOT_SIZE / 2) * iconScale,
							},
						]}
					/>
					<Animated.View
						style={[
							styles.sparkDot,
							sparkTwoDotAnimatedStyle,
							{
								width: SPARK_DOT_SIZE * iconScale,
								height: SPARK_DOT_SIZE * iconScale,
								borderRadius: (SPARK_DOT_SIZE / 2) * iconScale,
							},
						]}
					/>
					<Animated.View
						style={[
							styles.sparkDot,
							sparkThreeDotAnimatedStyle,
							{
								width: SPARK_DOT_SIZE * iconScale,
								height: SPARK_DOT_SIZE * iconScale,
								borderRadius: (SPARK_DOT_SIZE / 2) * iconScale,
							},
						]}
					/>
				</View>
			</View>
		</AnimatedPressable>
	);
}

const styles = StyleSheet.create({
	orb: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#FFD15A",
		shadowColor: "#F0C34D",
		shadowOffset: {
			width: 0,
			height: 20,
		},
		shadowOpacity: 0.14,
		shadowRadius: 36,
		elevation: 8,
	},
	iconFrame: {
		position: "relative",
	},
	shackleWrap: {
		position: "absolute",
		overflow: "visible",
	},
	shackleArch: {
		position: "absolute",
		borderColor: LOCK_COLOR,
		borderBottomWidth: 0,
	},
	shackleLongLeg: {
		position: "absolute",
		backgroundColor: LOCK_COLOR,
	},
	shackleShortLeg: {
		position: "absolute",
		backgroundColor: LOCK_COLOR,
	},
	body: {
		position: "absolute",
		borderColor: LOCK_COLOR,
		backgroundColor: LOCK_COLOR,
	},
	sparkWrap: {
		position: "absolute",
		pointerEvents: "none",
	},
	sparkDot: {
		position: "absolute",
		backgroundColor: LOCK_COLOR,
	},
});
