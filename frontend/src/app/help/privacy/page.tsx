"use client";
import { useTranslations } from "next-intl";
import { BackHeader } from "@/components/BackHeader";

export default function PrivacyPolicyPage() {
  const t = useTranslations("profileMenu");
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("privacyPolicyTitle")} backHref="/help" />
      <div className="mt-4 space-y-5 rounded-xl border border-gray-100 bg-white px-4 py-6 text-sm leading-relaxed text-gray-700 shadow-sm sm:px-6">
        <p className="text-xs text-gray-400">Last updated: 14 August 2026</p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Who we are</h2>
          <p className="mt-1">
            Event Saman ("we", "us", "our") operates a marketplace connecting buyers and sellers of
            event and celebration services in India. This Privacy Policy explains what information
            we collect, why, and how we protect it.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Information we collect</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Account details you provide at signup: name, business name, phone number, and email (optional).</li>
            <li>Content you post: listings, photos, messages, and reviews.</li>
            <li>Usage data such as pages visited and actions taken, to keep the platform working reliably.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. How we use your information</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>To create and secure your account and let you list, browse, and message on the platform.</li>
            <li>To show your business name on your listings so buyers know who they're dealing with.</li>
            <li>To respond to support requests and enforce our community guidelines.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Phone number visibility</h2>
          <p className="mt-1">
            Your phone number is private by default and is never shown on your public profile
            unless you explicitly turn on "Display phone number on profile" in Settings. You can
            turn this off at any time.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Sharing of information</h2>
          <p className="mt-1">
            We do not sell your personal information. Information you choose to make public
            (listings, your name, business name, and, if enabled, your phone number) is visible to
            other users of the platform. We may share information if required by law.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">6. Data retention & account deletion</h2>
          <p className="mt-1">
            If you delete your account, it is deactivated immediately. Data is kept for 60 days in
            case you change your mind and log back in — after that period it is permanently deleted.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">7. Your choices</h2>
          <p className="mt-1">
            You can edit or delete your profile information, control phone number visibility, and
            delete your account at any time from Settings.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">8. Contact us</h2>
          <p className="mt-1">
            Questions about this policy? Reach out via "Report an issue" in the Help section.
          </p>
        </section>
      </div>
    </main>
  );
}
