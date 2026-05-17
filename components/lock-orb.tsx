import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	interpolate,
	type SharedValue,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withSequence,
	withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ORB_COLOR = "#FFD15A";
const ORB_SHADOW_COLOR = "#F0C34D";
const LOCK_COLOR = "#111111";
const BASE_ORB_SIZE = 260;
const MAX_ORB_WIDTH_RATIO = 0.66;

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

type SparkMotionConfig = {
	opacityInput: readonly number[];
	opacityOutput: readonly number[];
	scaleInput: readonly number[];
	scaleOutput: readonly number[];
	travelX: number;
	travelY: number;
};

const SPARK_ONE_MOTION: SparkMotionConfig = {
	opacityInput: [0, 0.04, 0.74, 1],
	opacityOutput: [0, 0.96, 0.88, 0],
	scaleInput: [0, 0.12, 0.78, 1],
	scaleOutput: [0.62, 1, 0.82, 0.18],
	travelX: 13,
	travelY: -13,
};

const SPARK_TWO_MOTION: SparkMotionConfig = {
	opacityInput: [0, 0.04, 0.72, 1],
	opacityOutput: [0, 0.88, 0.78, 0],
	scaleInput: [0, 0.1, 0.76, 1],
	scaleOutput: [0.62, 1, 0.78, 0.16],
	travelX: 16,
	travelY: 0,
};

const SPARK_THREE_MOTION: SparkMotionConfig = {
	opacityInput: [0, 0.05, 0.7, 1],
	opacityOutput: [0, 0.78, 0.66, 0],
	scaleInput: [0, 0.14, 0.76, 1],
	scaleOutput: [0.62, 1, 0.74, 0.14],
	travelX: 12,
	travelY: 12,
};

type LockIconGeometry = ReturnType<typeof getLockIconGeometry>;

export function LockOrb() {
	const { width } = useWindowDimensions();
	const progress = useSharedValue(0);
	const pressScale = useSharedValue(1);
	const sparkProgress = useSharedValue(0);
	const shouldReduceMotion = useReducedMotion();

	const orbSize = Math.min(width * MAX_ORB_WIDTH_RATIO, BASE_ORB_SIZE);
	const iconScale = orbSize / BASE_ORB_SIZE;

	const orbAnimatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: pressScale.value }],
	}));

	const handlePress = async () => {
		const isOpening = progress.value === 0;

		cancelAnimation(progress);
		cancelAnimation(pressScale);
		cancelAnimation(sparkProgress);

		if (shouldReduceMotion) {
			pressScale.value = 1;
			progress.value = isOpening ? 1 : 0;
			sparkProgress.value = 0;
			await playHaptic(isOpening);
			return;
		}

		animatePressScale(pressScale);

		if (isOpening) {
			animateSpark(sparkProgress, SPARK_OPEN_DELAY, SPARK_OPEN_DURATION);
			animateOpen(progress);
			await playHaptic(true);
			return;
		}

		animateSpark(sparkProgress, SPARK_CLOSE_DELAY, SPARK_CLOSE_DURATION);
		animateClosed(progress);
		await playHaptic(false);
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
			<LockGlyph
				iconScale={iconScale}
				progress={progress}
				sparkProgress={sparkProgress}
			/>
		</AnimatedPressable>
	);
}

function LockGlyph({
	iconScale,
	progress,
	sparkProgress,
}: {
	iconScale: number;
	progress: SharedValue<number>;
	sparkProgress: SharedValue<number>;
}) {
	const geometry = getLockIconGeometry(iconScale);

	return (
		<View className="relative" style={geometry.frame}>
			<LockShackle
				geometry={geometry}
				iconScale={iconScale}
				progress={progress}
			/>
			<View
				className="absolute border-[#111111] bg-[#111111]"
				style={geometry.body}
			/>
			<SparkBurst
				geometry={geometry}
				iconScale={iconScale}
				progress={sparkProgress}
			/>
		</View>
	);
}

function LockShackle({
	geometry,
	iconScale,
	progress,
}: {
	geometry: LockIconGeometry;
	iconScale: number;
	progress: SharedValue<number>;
}) {
	const shackleAnimatedStyle = useShackleAnimatedStyle(progress, iconScale);

	return (
		<Animated.View style={[geometry.shackleWrap, shackleAnimatedStyle]}>
			<View
				className="absolute border-[#111111]"
				style={geometry.shackleArch}
			/>
			<View className="absolute bg-[#111111]" style={geometry.shackleLongLeg} />
			<View
				className="absolute bg-[#111111]"
				style={geometry.shackleShortLeg}
			/>
		</Animated.View>
	);
}

function SparkBurst({
	geometry,
	iconScale,
	progress,
}: {
	geometry: LockIconGeometry;
	iconScale: number;
	progress: SharedValue<number>;
}) {
	const sparkOneStyle = useSparkDotAnimatedStyle(
		progress,
		iconScale,
		SPARK_ONE_MOTION,
	);
	const sparkTwoStyle = useSparkDotAnimatedStyle(
		progress,
		iconScale,
		SPARK_TWO_MOTION,
	);
	const sparkThreeStyle = useSparkDotAnimatedStyle(
		progress,
		iconScale,
		SPARK_THREE_MOTION,
	);

	return (
		<View className="absolute" pointerEvents="none" style={geometry.sparkWrap}>
			<Animated.View
				style={[styles.sparkDot, geometry.sparkDot, sparkOneStyle]}
			/>
			<Animated.View
				style={[styles.sparkDot, geometry.sparkDot, sparkTwoStyle]}
			/>
			<Animated.View
				style={[styles.sparkDot, geometry.sparkDot, sparkThreeStyle]}
			/>
		</View>
	);
}

function useShackleAnimatedStyle(
	progress: SharedValue<number>,
	iconScale: number,
) {
	return useAnimatedStyle(() => {
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
}

function useSparkDotAnimatedStyle(
	progress: SharedValue<number>,
	iconScale: number,
	config: SparkMotionConfig,
) {
	return useAnimatedStyle(() => {
		const opacity = interpolate(
			progress.value,
			config.opacityInput,
			config.opacityOutput,
		);
		const scale = interpolate(
			progress.value,
			config.scaleInput,
			config.scaleOutput,
		);
		const translateX = interpolate(
			progress.value,
			[0, 1],
			[0, config.travelX * iconScale],
		);
		const translateY = interpolate(
			progress.value,
			[0, 1],
			[0, config.travelY * iconScale],
		);

		return {
			opacity,
			transform: [{ translateX }, { translateY }, { scale }],
		};
	});
}

function animatePressScale(pressScale: SharedValue<number>) {
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
}

function animateSpark(
	sparkProgress: SharedValue<number>,
	delay: number,
	duration: number,
) {
	sparkProgress.value = 0;
	sparkProgress.value = withSequence(
		withTiming(0, {
			duration: delay,
			easing: Easing.linear,
		}),
		withTiming(1, {
			duration,
			easing: EASE_OUT_QUINT,
		}),
	);
}

function animateOpen(progress: SharedValue<number>) {
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
}

function animateClosed(progress: SharedValue<number>) {
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
}

async function playHaptic(isOpening: boolean) {
	await Haptics.impactAsync(
		isOpening
			? Haptics.ImpactFeedbackStyle.Light
			: Haptics.ImpactFeedbackStyle.Soft,
	);
}

function getLockIconGeometry(iconScale: number) {
	return {
		frame: {
			width: 102 * iconScale,
			height: 118 * iconScale,
		},
		shackleWrap: {
			position: "absolute" as const,
			overflow: "visible" as const,
			width: SHACKLE_WIDTH * iconScale,
			height: (SHACKLE_ARCH_HEIGHT + SHACKLE_LONG_LEG) * iconScale,
			left: 30 * iconScale,
			top: 5 * iconScale,
		},
		shackleArch: {
			width: SHACKLE_WIDTH * iconScale,
			height: SHACKLE_ARCH_HEIGHT * iconScale,
			borderTopLeftRadius: (SHACKLE_WIDTH / 2) * iconScale,
			borderTopRightRadius: (SHACKLE_WIDTH / 2) * iconScale,
			borderTopWidth: SHACKLE_STROKE * iconScale,
			borderLeftWidth: SHACKLE_STROKE * iconScale,
			borderRightWidth: SHACKLE_STROKE * iconScale,
			borderBottomWidth: 0,
		},
		shackleLongLeg: {
			width: SHACKLE_STROKE * iconScale,
			height: SHACKLE_LONG_LEG * iconScale,
			borderRadius: (SHACKLE_STROKE / 2) * iconScale,
			left: 0,
			top: (SHACKLE_ARCH_HEIGHT - 1) * iconScale,
		},
		shackleShortLeg: {
			width: SHACKLE_STROKE * iconScale,
			height: SHACKLE_SHORT_LEG * iconScale,
			borderRadius: (SHACKLE_STROKE / 2) * iconScale,
			right: 0,
			top: (SHACKLE_ARCH_HEIGHT - 1) * iconScale,
		},
		body: {
			width: 54 * iconScale,
			height: 48 * iconScale,
			left: 24 * iconScale,
			top: 48 * iconScale,
			borderRadius: 10 * iconScale,
			borderWidth: 6 * iconScale,
		},
		sparkWrap: {
			left: 71 * iconScale,
			top: 39 * iconScale,
		},
		sparkDot: {
			width: SPARK_DOT_SIZE * iconScale,
			height: SPARK_DOT_SIZE * iconScale,
			borderRadius: (SPARK_DOT_SIZE / 2) * iconScale,
		},
	};
}

const styles = StyleSheet.create({
	orb: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: ORB_COLOR,
		shadowColor: ORB_SHADOW_COLOR,
		shadowOffset: {
			width: 0,
			height: 20,
		},
		shadowOpacity: 0.14,
		shadowRadius: 36,
		elevation: 8,
	},
	sparkDot: {
		position: "absolute",
		backgroundColor: LOCK_COLOR,
	},
});
