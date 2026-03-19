import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";

export function DriverMarker() {
  return (
    <View style={{ width: 40, height: 40 }}>
      <Svg width={40} height={40} viewBox="0 0 40 40" fill="none">
        <Circle cx={20} cy={20} r={18} fill="#1D4ED8" />
        <Path
          d="M12 24V18C12 16.9 12.9 16 14 16H22L25 20H28C29.1 20 30 20.9 30 22V24"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={16} cy={25} r={2} fill="#FFFFFF" />
        <Circle cx={26} cy={25} r={2} fill="#FFFFFF" />
      </Svg>
    </View>
  );
}

export function DeliveryMarker() {
  return (
    <View style={{ width: 36, height: 36 }}>
      <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
        <Circle cx={18} cy={18} r={16} fill="#0F172A" />
        <Rect x={11} y={12} width={14} height={12} rx={2} stroke="#FFFFFF" strokeWidth={1.8} />
        <Path
          d="M11 17H25"
          stroke="#FFFFFF"
          strokeWidth={1.8}
        />
        <Path
          d="M18 12V17"
          stroke="#FFFFFF"
          strokeWidth={1.8}
        />
      </Svg>
    </View>
  );
}

export function NextDeliveryMarker() {
  return (
    <View style={{ width: 42, height: 42 }}>
      <Svg width={42} height={42} viewBox="0 0 42 42" fill="none">
        <Circle cx={21} cy={21} r={19} fill="#F59E0B" />
        <Rect x={12} y={13} width={18} height={15} rx={2} stroke="#FFFFFF" strokeWidth={2} />
        <Path
          d="M12 19H30"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
        <Path
          d="M21 13V19"
          stroke="#FFFFFF"
          strokeWidth={2}
        />
      </Svg>
    </View>
  );
}
