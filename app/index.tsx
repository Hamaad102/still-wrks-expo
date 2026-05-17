import { StyleSheet, View } from "react-native";

import { LockOrb } from "@/components/lock-orb";

export default function HomeScreen() {
	return (
		<View style={styles.screen}>
			<View style={styles.stage}>
				<LockOrb />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "#F7F6F2",
	},
	stage: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
});
