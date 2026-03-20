export {
  loginWithEmailPassword,
  signUpWithEmailPassword,
  signOutCurrentUser,
  subscribeToAuthState,
  sendPhoneVerificationCode,
  linkPhoneNumberWithCode,
  reloadCurrentUser,
} from "./auth";

export { subscribeToAssignedDeliveries, markDeliveryStatus } from "./deliveries";

export { createDriverProfile, saveDriverFcmToken, updateDriverLocation } from "./driver";

export {
  getFcmDeviceToken,
  requestFcmPermission,
  subscribeToFcmTokenRefresh,
} from "./messaging";

export type {
  AuthUser,
  DeliveryCoordinates,
  DeliveryDocument,
  DeliveryItem,
  DeliveryStatus,
} from "@/types/delivery";
