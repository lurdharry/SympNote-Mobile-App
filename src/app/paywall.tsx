import React from "react";
import { PaywallContent } from "@/components/paywall/PaywallContent";

/**
 * In-app paywall modal — presented when an action gate fires
 * post-onboarding (brief generation, regenerate, PDF export, record),
 * or when a `<LockedView>` CTA is tapped from a view-level gate
 * (Insights tab). Dismissable via the X button; the user returns to
 * view-only mode and can browse existing data.
 */
const ScreenInAppPaywall: React.FC = () => <PaywallContent mode="gate" />;

export default ScreenInAppPaywall;
