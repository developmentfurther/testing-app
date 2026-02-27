import { testCampusChat } from "@/lib/test-campus-chat";
import { testWebChatbot } from "@/lib/test-web-chatbot";
import { testResendEmail } from "@/lib/test-web-email";
import { testAcademyChat } from "@/lib/test-academy-chat";
import { testExamsEvaluate } from "@/lib/test-exams-evaluate";
import { testWhatsappExtraction } from "@/lib/test-whatsapp-extraction";
import { testEnglishBooster } from "@/lib/test-english-booster";
import { testConversationalClub } from "@/lib/test-conversational-chat";

// ─── Landings ─────────────────────────────────────────────────────────────────
import { testLandingEgger } from "@/lib/test-landing-egger";
import { testLandingKopius } from "@/lib/test-landing-kopius";
import { testLandingBoca } from "@/lib/test-landing-boca";
import { testLandingAccenture } from "@/lib/test-landing-accenture";
import { testLandingAdmCentral } from "@/lib/test-landing-adm-central";
import { testLandingFaroVerde } from "@/lib/test-landing-faro-verde";
import { testLandingElCronista } from "@/lib/test-landing-el-cronista";

const TESTS = [
  // ── Apps core ──────────────────────────────────────────────────────────────
  { id: "campus-chat", fn: testCampusChat },
  { id: "web-chatbot", fn: testWebChatbot },
  { id: "testResendEmail", fn: testResendEmail },
  { id: "academy-chat", fn: testAcademyChat },
  { id: "exams-evaluate", fn: testExamsEvaluate },
  { id: "whatsapp-extraction", fn: testWhatsappExtraction },
  { id: "english-booster-registration", fn: testEnglishBooster },
  { id: "conversational-club", fn: testConversationalClub },

  // ── Landings ───────────────────────────────────────────────────────────────
  { id: "landing-egger", fn: testLandingEgger },
  { id: "landing-kopius", fn: testLandingKopius },
  { id: "landing-boca", fn: testLandingBoca },
  { id: "landing-accenture", fn: testLandingAccenture },
  { id: "landing-adm-central", fn: testLandingAdmCentral },
  { id: "landing-faro-verde", fn: testLandingFaroVerde },
  { id: "landing-el-cronista", fn: testLandingElCronista },
];

export async function runAllTests() {
  const startedAt = Date.now();

  const results = await Promise.allSettled(
    TESTS.map(async ({ id, fn }) => {
      const t0 = Date.now();

      try {
        const res = await fn();

        return {
          id,
          success: Boolean(res?.success),
          message: res?.message || "OK",
          durationMs: Date.now() - t0,
          meta: res?.output || res || null,
        };
      } catch (err) {
        return {
          id,
          success: false,
          message: err?.message || "Unhandled exception",
          durationMs: Date.now() - t0,
          meta: { stack: err?.stack },
        };
      }
    })
  );

  const normalized = results.map((r) =>
    r.status === "fulfilled"
      ? r.value
      : {
          id: "unknown",
          success: false,
          message: "Promise rejected",
          durationMs: 0,
          meta: r.reason,
        }
  );

  const allPassed = normalized.every((t) => t.success);
  const failedTests = normalized.filter((t) => !t.success);
  const failedTestIds = failedTests.map((t) => t.id);
  const failureDetails = failedTests.map((t) => `${t.id} → ${t.message}`);

  return {
    runId: `run_${Date.now()}`,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMsTotal: Date.now() - startedAt,
    allPassed,
    summary: {
      total: normalized.length,
      passed: normalized.filter((t) => t.success).length,
      failed: normalized.filter((t) => !t.success).length,
    },
    failedTestIds,
    failureDetails,
    results: normalized,
  };
}