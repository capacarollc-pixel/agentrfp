import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const PLANS = {
  pro: {
    name: "Pro",
    pricePerSeat: 49,
    features: [
      "Unlimited RFPs",
      "AI answer generation",
      "Knowledge base",
      "Answer library",
      "Word & Excel export",
      "Team collaboration",
      "SSO & integrations",
    ],
  },
} as const;
