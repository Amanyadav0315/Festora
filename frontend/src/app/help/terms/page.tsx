"use client";
import { useTranslations } from "next-intl";
import { BackHeader } from "@/components/BackHeader";

export default function TermsPage() {
  const t = useTranslations("profileMenu");
  return (
    <main className="mx-auto max-w-2xl px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("termsConditionsTitle")} backHref="/help" />
      <div className="mt-4 space-y-5 rounded-xl border border-gray-100 bg-white px-4 py-6 text-sm leading-relaxed text-gray-700 shadow-sm sm:px-6">
        <p className="text-xs text-gray-400">Last updated: 14 August 2026</p>

        <section>
          <h2 className="text-base font-semibold text-gray-900">1. Acceptance of terms</h2>
          <p className="mt-1">
            By creating an account on Event Saman, you agree to these Terms & Conditions. If you do
            not agree, please do not create an account or use the platform.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">2. Who can use Event Saman</h2>
          <p className="mt-1">
            Any individual or business offering or seeking event/celebration services in the
            categories we support (tent house & mandap, DJ & sound, photography/videography,
            banquet halls, catering, resorts/farmhouses) may create an account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">3. Your account</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>You must provide accurate information, including a genuine business name and phone number.</li>
            <li>You are responsible for keeping your password secure and for all activity on your account.</li>
            <li>You must be legally able to enter into contracts under Indian law to use the platform.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">4. Listings & conduct</h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Listings must be accurate, honestly priced, and only in the supported categories.</li>
            <li>Do not post misleading, offensive, or fraudulent content.</li>
            <li>Deals are made directly between buyers and sellers; Event Saman is not a party to any transaction.</li>
            <li>We do not process payments — never share OTPs or send advance payments to strangers.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">5. Reporting & enforcement</h2>
          <p className="mt-1">
            We may remove listings, suspend, or delete accounts that violate these terms, receive
            credible reports of fraud or abuse, or otherwise harm the platform or its users.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">6. Limitation of liability</h2>
          <p className="mt-1">
            Event Saman is provided "as is". We are not liable for disputes, losses, or damages
            arising from transactions or interactions between users conducted outside our control.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">7. Changes to these terms</h2>
          <p className="mt-1">
            We may update these Terms from time to time. Continued use of the platform after
            changes means you accept the updated terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900">8. Contact us</h2>
          <p className="mt-1">
            Questions about these terms? Reach out via "Report an issue" in the Help section.
          </p>
        </section>
      </div>
    </main>
  );
}
