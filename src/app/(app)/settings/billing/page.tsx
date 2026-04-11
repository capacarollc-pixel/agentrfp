"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";

type Subscription = {
  status: string;
  seats: number;
  current_period_end: string;
  stripe_customer_id: string;
} | null;

export default function BillingPage() {
  const [sub, setSub] = useState<Subscription>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [seats, setSeats] = useState(3);
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("users")
        .select("org_id")
        .eq("id", user.id)
        .single();

      if (profile?.org_id) {
        const { data } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("org_id", profile.org_id)
          .single();
        setSub(data);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleCheckout() {
    setCheckoutLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seats }),
    });
    const { url, error } = await res.json();
    if (url) {
      window.location.href = url;
    } else {
      alert(error || "Failed to create checkout session");
      setCheckoutLoading(false);
    }
  }

  async function handlePortal() {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const { url, error } = await res.json();
    if (url) {
      window.location.href = url;
    } else {
      alert(error || "Failed to open billing portal");
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  const isActive = sub?.status === "active" || sub?.status === "trialing";

  return (
    <div className="max-w-2xl">
      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
          Subscription activated! You're all set.
        </div>
      )}
      {canceled && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
          Checkout canceled. No charges were made.
        </div>
      )}

      {isActive ? (
        /* Active subscription */
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                AgentRFP Pro
              </h2>
              <p className="text-sm text-gray-500">
                {sub!.seats} seat{sub!.seats !== 1 ? "s" : ""} &middot; $
                {sub!.seats * 49}/mo
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {sub!.status === "trialing" ? "Trial" : "Active"}
            </span>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Next billing date:{" "}
            {new Date(sub!.current_period_end).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>

          <button
            onClick={handlePortal}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Manage subscription, update payment, or cancel &rarr;
          </button>
        </div>
      ) : sub?.status === "past_due" ? (
        /* Past due */
        <div className="bg-white border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Past Due
            </span>
            <h2 className="text-lg font-semibold text-gray-900">
              Payment Failed
            </h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Your last payment didn't go through. Please update your payment
            method to continue using AgentRFP.
          </p>
          <button
            onClick={handlePortal}
            className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700"
          >
            Update payment method
          </button>
        </div>
      ) : (
        /* No subscription — show pricing */
        <div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              AgentRFP Pro
            </h2>
            <p className="text-3xl font-bold text-gray-900">
              $49
              <span className="text-base font-normal text-gray-500">
                /user/mo
              </span>
            </p>

            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <CheckIcon />
                Unlimited RFPs
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                AI answer generation (BYOK)
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                Knowledge base & answer library
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                Word & Excel export
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                Team collaboration & SSO
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon />
                Cancel anytime
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How many seats?
            </label>
            <div className="flex items-center gap-4 mb-4">
              <input
                type="number"
                min={1}
                max={100}
                value={seats}
                onChange={(e) =>
                  setSeats(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-sm text-gray-500">
                = ${seats * 49}/month
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkoutLoading ? "Redirecting to checkout..." : "Subscribe"}
            </button>

            <p className="text-xs text-gray-400 mt-3 text-center">
              You can add or remove seats anytime from the billing portal.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 text-blue-500 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}
