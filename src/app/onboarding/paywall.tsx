import React from "react";
import { PaywallContent } from "@/components/paywall/PaywallContent";

/**
 * Onboarding paywall — the hard gate at the end of onboarding. First
 * users must pick a plan (trial counts as paid for entitlement
 * purposes) to enter the app. The shared `<PaywallContent>` body
 * renders without an X close affordance in this mode.
 */
const ScreenPaywall: React.FC = () => <PaywallContent mode="onboarding" />;

export default ScreenPaywall;
