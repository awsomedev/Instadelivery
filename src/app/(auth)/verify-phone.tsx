import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CodeField,
  Cursor,
  useBlurOnFulfill,
  useClearByFocusCell,
} from "react-native-confirmation-code-field";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppButton } from "@/components/ui/app-button";
import { useVerifyPhoneViewModel } from "@/view-models/use-verify-phone-view-model";

export default function VerifyPhoneScreen() {
  const {
    canVerify,
    code,
    countryCode,
    displayPhone,
    error,
    isOtpStep,
    onChangeNumber,
    onResendCode,
    onSendCode,
    onVerifyCode,
    otpCellCount,
    phoneNumber,
    sendingCode,
    setCode,
    setPhoneNumber,
    statusMessage,
    verifyingCode,
  } = useVerifyPhoneViewModel();
  const ref = useBlurOnFulfill({ cellCount: otpCellCount, value: code });
  const [codeFieldProps, getCellOnLayoutHandler] = useClearByFocusCell({
    setValue: setCode,
    value: code,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.content}>
          <Text style={styles.title}>Verify your phone</Text>
          <Text style={styles.subtitle}>
            {isOtpStep
              ? "Enter the 6-digit code sent to your phone."
              : "Add a phone number and we'll send you a verification code."}
          </Text>

          <View style={styles.form}>
            <View style={styles.phoneSection}>
              <Text style={styles.label}>Phone number</Text>
              {isOtpStep ? (
                <View style={styles.phoneDisplayRow}>
                  <Text style={styles.phoneDisplay}>{displayPhone}</Text>
                  <Pressable
                    onPress={onChangeNumber}
                    style={styles.changeNumber}
                  >
                    <Text style={styles.changeNumberText}>Change number</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.phoneInputWrapper}>
                  <Text style={styles.phonePrefix}>{countryCode} </Text>
                  <TextInput
                    autoCapitalize="none"
                    keyboardType="phone-pad"
                    onChangeText={setPhoneNumber}
                    placeholder="555 123 4567"
                    placeholderTextColor="#8A8A8E"
                    style={styles.phoneInput}
                    value={phoneNumber}
                  />
                </View>
              )}
            </View>

            {isOtpStep && (
              <>
                <CodeField
                  {...codeFieldProps}
                  ref={ref}
                  cellCount={otpCellCount}
                  keyboardType="number-pad"
                  onChangeText={setCode}
                  rootStyle={styles.codeFieldRoot}
                  textContentType="oneTimeCode"
                  value={code}
                  renderCell={({ index, symbol, isFocused }) => (
                    <Text
                      key={index}
                      onLayout={getCellOnLayoutHandler(index)}
                      style={[
                        styles.codeCell,
                        isFocused ? styles.codeCellFocused : null,
                      ]}
                    >
                      {symbol || (isFocused ? <Cursor /> : null)}
                    </Text>
                  )}
                />
              </>
            )}

            {statusMessage ? (
              <Text style={styles.status}>{statusMessage}</Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>

          <View style={styles.actions}>
            {isOtpStep ? (
              <>
                <AppButton
                  label="Resend code"
                  loading={sendingCode}
                  onPress={onResendCode}
                  variant="ghost"
                />
                <AppButton
                  disabled={!canVerify}
                  label="Verify phone number"
                  loading={verifyingCode}
                  onPress={onVerifyCode}
                />
              </>
            ) : (
              <AppButton
                label="Send code"
                loading={sendingCode}
                onPress={onSendCode}
              />
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
  changeNumber: {
    paddingVertical: 8,
  },
  changeNumberText: {
    color: "#0A84FF",
    fontSize: 15,
    fontWeight: "600",
  },
  codeCell: {
    borderColor: "#D1D1D6",
    borderRadius: 10,
    borderWidth: 1,
    color: "#121212",
    fontSize: 22,
    height: 52,
    lineHeight: 48,
    textAlign: "center",
    width: 46,
  },
  codeCellFocused: {
    borderColor: "#0A84FF",
  },
  codeFieldRoot: {
    columnGap: 8,
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    gap: 26,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  error: {
    color: "#D0302F",
    fontSize: 13,
  },
  form: {
    gap: 14,
  },
  keyboardContainer: {
    flex: 1,
  },
  label: {
    color: "#3A3A3C",
    fontSize: 14,
    fontWeight: "600",
  },
  phoneDisplay: {
    color: "#121212",
    flex: 1,
    fontSize: 16,
  },
  phoneDisplayRow: {
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderColor: "#E4E4E7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phoneInput: {
    color: "#121212",
    flex: 1,
    fontSize: 16,
    paddingVertical: 14,
  },
  phoneInputWrapper: {
    alignItems: "center",
    backgroundColor: "#F4F4F5",
    borderColor: "#E4E4E7",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 16,
  },
  phonePrefix: {
    color: "#121212",
    fontSize: 16,
  },
  phoneSection: {
    gap: 8,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  status: {
    color: "#2B8A3E",
    fontSize: 13,
  },
  subtitle: {
    color: "#6E6E73",
    fontSize: 15,
  },
  title: {
    color: "#111111",
    fontSize: 30,
    fontWeight: "700",
  },
});
