import { View } from "react-native";

import { LockOrb } from "@/components/lock-orb";

export default function HomeScreen() {
	return (
		<View className="flex-1 bg-[#F7F6F2]">
			<View className="flex-1 items-center justify-center px-6">
				<LockOrb />
			</View>
		</View>
	);
}
