import { testCampusChat } from "@/lib/test-campus-chat";
import { testWebChatbot } from "@/lib/test-web-chatbot";
import { testResendEmail } from "@/lib/test-web-email";
import { testAcademyChat } from "@/lib/test-academy-chat";
import { testExamsEvaluate } from "@/lib/test-exams-evaluate";
import { testWhatsappExtraction } from "@/lib/test-whatsapp-extraction";
import { testEnglishBooster } from "@/lib/test-english-booster";
import { testConversationalClub } from "@/lib/test-conversational-chat";



const TESTS = [
  { id: "campus-chat", fn: testCampusChat },
  { id: "web-chatbot", fn: testWebChatbot },
  { id: "testResendEmail", fn: testResendEmail },
  { id: "academy-chat", fn: testAcademyChat },
  { id: "exams-evaluate", fn: testExamsEvaluate },
  { id: "whatsapp-extraction", fn: testWhatsappExtraction },
  { id: "english-booster-registration", fn: testEnglishBooster },
  { id: "conversational-club", fn: testConversationalClub },

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
    r.status === "fulfilled" ? r.value : {
      id: "unknown",
      success: false,
      message: "Promise rejected",
      durationMs: 0,
      meta: r.reason,
    }
  );

  const allPassed = normalized.every((t) => t.success);

  return {
    runId: `run_${Date.now()}`,
    startedAt: new Date(startedAt).toISOString(),
    finishedAt: new Date().toISOString(),
    durationMsTotal: Date.now() - startedAt,
    allPassed,
    summary: {
      total: normalized.length,
      passed: normalized.filter(t => t.success).length,
      failed: normalized.filter(t => !t.success).length,
    },
    results: normalized,
  };
}
