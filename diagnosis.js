/**
 * Mock agronomy rules engine.
 * In production, this might call out to an LLM or an expert system API.
 * For now, it matches keywords and handles the "yellowing wheat" scenario natively.
 */

function analyzeAgronomySymptoms(crop, symptoms, history) {
  // We'll normalize the strings
  const c = (crop || "").toLowerCase();
  const s = (symptoms || "").toLowerCase();

  // Condition 1: Missing critical context (Step 3: AI Asks Clarifying Questions)
  // E.g., The farmer says "My wheat leaves are turning yellow" but hasn't said which parts of the plant.
  if (c === "wheat" && s.includes("yellow")) {
    if (!s.includes("top") && !s.includes("bottom") && !s.includes("lower")) {
      return {
        action: "CLARIFY",
        message: "Are the yellowing leaves on the older lower parts of the plant, or the newer growth at the top? And have you applied any fertilizer in the past two weeks?"
      };
    }
  }

  // Condition 2: Enough context provided -> Diagnosis (Step 4: Diagnosis and Recommendation)
  // Assume they answered "lower parts" or similar
  if (c === "wheat" && s.includes("yellow") && (s.includes("lower") || s.includes("bottom"))) {
    return {
      action: "DIAGNOSE",
      diagnosis: "Nitrogen deficiency, likely triggered by waterlogging.",
      recommendation: "Apply 25 kg of urea per acre once the soil dries up.",
      message: "Based on what you've described, this sounds like a nitrogen deficiency, which often happens when waterlogging washes nutrients from the soil. I recommend applying 25 kilograms of urea per acre as soon as the soil is dry enough. Watch the crop for the next 3 days."
    };
  }

  // Condition 3: Unrecognized or complex (Step 5: Escalation)
  if (s.includes("spots") || s.includes("wilted entire plant suddenly")) {
    return {
      action: "ESCALATE",
      message: "This situation sounds complex and there could be multiple causes. Let me connect you directly to our lead agronomist to make sure you get the best advice."
    };
  }

  // Default clarification
  return {
    action: "CLARIFY",
    message: "I want to be sure I give you the best advice. Could you describe the problem in a bit more detail, like when the symptoms started or what the weather has been like?"
  };
}

module.exports = { analyzeAgronomySymptoms };
