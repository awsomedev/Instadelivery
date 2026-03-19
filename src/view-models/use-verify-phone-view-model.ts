import { useMemo, useState } from "react";

import {
  linkPhoneNumberWithCode,
  reloadCurrentUser,
  sendPhoneVerificationCode,
} from "@/lib/firebase";

const otpCellCount = 6;
const countryCode = "+1";

export function useVerifyPhoneViewModel() {
  const [phoneNumber, setPhoneNumberState] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [code, setCode] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const isOtpStep = Boolean(verificationId);
  const canVerify = Boolean(verificationId) && code.length === otpCellCount;
  const digits = useMemo(() => phoneNumber.replace(/\D/g, ""), [phoneNumber]);
  const displayPhone = digits.length ? `${countryCode} ${digits}` : "";

  function setPhoneNumber(nextValue: string) {
    setPhoneNumberState(nextValue.replace(/\D/g, ""));
  }

  async function onSendCode() {
    if (!digits.length) {
      setError("Phone number is required.");
      return;
    }

    setError("");
    setStatusMessage("");
    setCode("");
    setSendingCode(true);

    try {
      const fullNumber = `${countryCode}${digits}`;
      const nextVerificationId = await sendPhoneVerificationCode(fullNumber);
      setVerificationId(nextVerificationId);
      setStatusMessage("Code sent. Enter the 6-digit OTP.");
    } catch (sendCodeError) {
      const message = sendCodeError instanceof Error ? sendCodeError.message : "Failed to send OTP.";
      setError(message);
    } finally {
      setSendingCode(false);
    }
  }

  async function onVerifyCode() {
    if (!canVerify) {
      setError("Enter the full 6-digit code.");
      return;
    }

    setError("");
    setStatusMessage("");
    setVerifyingCode(true);

    try {
      await linkPhoneNumberWithCode(verificationId, code);
      await reloadCurrentUser();
    } catch (verifyError) {
      const message = verifyError instanceof Error ? verifyError.message : "Failed to verify code.";
      setError(message);
    } finally {
      setVerifyingCode(false);
    }
  }

  function onChangeNumber() {
    setPhoneNumberState("");
    setVerificationId("");
    setCode("");
    setError("");
    setStatusMessage("");
  }

  async function onResendCode() {
    if (!digits.length) {
      return;
    }

    setError("");
    setStatusMessage("");
    setCode("");
    setSendingCode(true);

    try {
      const fullNumber = `${countryCode}${digits}`;
      const nextVerificationId = await sendPhoneVerificationCode(fullNumber);
      setVerificationId(nextVerificationId);
      setStatusMessage("Code resent.");
    } catch (sendCodeError) {
      const message = sendCodeError instanceof Error ? sendCodeError.message : "Failed to resend OTP.";
      setError(message);
    } finally {
      setSendingCode(false);
    }
  }

  return {
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
  };
}
