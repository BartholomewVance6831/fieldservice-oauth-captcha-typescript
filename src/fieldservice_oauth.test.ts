import { recordTechnicianFollowUp } from "./fieldservice_oauth.ts";

const originalFetch = globalThis.fetch;
globalThis.fetch = async () => new Response(JSON.stringify({ ok: true, data: { accepted: true }, metadata: {} }), { status: 200 });
const result = await recordTechnicianFollowUp({ workOrderId: "wo-42", technicianId: "tech-7", photoUrl: "https://photos.example/42", note: "Meter replaced" }, { workOrderId: "wo-42", status: "complete", followUp: "Send receipt" }, "widget-42", "test-token", "203.0.113.7");
if (result.status !== "complete") throw new Error("completed dispatch should be returned");
globalThis.fetch = originalFetch;
console.log("follow-up decision: complete");
