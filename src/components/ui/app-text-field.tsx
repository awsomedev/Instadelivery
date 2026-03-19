import { ReactNode } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";

type AppTextFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  rightAdornment?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function AppTextField({
  label,
  error,
  rightAdornment,
  containerStyle,
  ...textInputProps
}: AppTextFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
        <TextInput
          autoCapitalize="none"
          placeholderTextColor="#8A8A8E"
          style={styles.input}
          {...textInputProps}
        />
        {rightAdornment ? <View>{rightAdornment}</View> : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  error: {
    color: "#D0302F",
    fontSize: 12,
  },
  input: {
    color: "#121212",
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  inputWrapper: {
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderColor: "#E4E4E7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
  },
  inputWrapperError: {
    borderColor: "#D0302F",
  },
  label: {
    color: "#3A3A3C",
    fontSize: 14,
    fontWeight: "600",
  },
});
