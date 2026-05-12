import { SignIn } from "@clerk/clerk-react";
import { C, FONT_DISPLAY, FONT_BODY } from "../theme";

export function SignInScreen() {
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.tx,
      fontFamily: FONT_BODY,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 28,
      padding: 24,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: FONT_DISPLAY,
          fontSize: 18,
          fontWeight: 800,
          color: C.gold,
          letterSpacing: "2px",
          marginBottom: 6,
        }}>
          KINGSHOT RALLY OPTIMIZER
        </div>
        <div style={{ fontSize: 12, color: C.txD }}>
          Sign in to access your character sheet
        </div>
      </div>
      <SignIn routing="hash" />
    </div>
  );
}
