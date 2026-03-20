export enum AuthScreen {
  Login = "Login",
  Signup = "Signup",
  VerifyPhone = "VerifyPhone",
}

export enum AppScreen {
  Deliveries = "Deliveries",
  Route = "Route",
  RouteFullscreen = "RouteFullscreen",
}

export type AuthStackParamList = {
  [AuthScreen.Login]: undefined;
  [AuthScreen.Signup]: undefined;
  [AuthScreen.VerifyPhone]: undefined;
};

export type AppStackParamList = {
  [AppScreen.Deliveries]: undefined;
  [AppScreen.Route]: undefined;
  [AppScreen.RouteFullscreen]: undefined;
};
