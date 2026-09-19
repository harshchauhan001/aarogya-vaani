import fetch from "node-fetch";

async function run() {
  const messages = [];
  const state = {
    completedDomains: [],
    currentDomainId: null,
    currentFacts: {}
  };

  messages.push({ role: "user", content: "I have a headache" });
  let res = await fetch("http://localhost:3000/api/gemini/conversational-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      language: "English",
      department: "AYUSH",
      consultationMode: "AYUSH",
      completedDomains: state.completedDomains,
      currentDomainId: state.currentDomainId,
      currentFacts: state.currentFacts
    })
  });
  let data = (await res.json()).data;
  console.log("Assistant:", data.replyMessage);
  
  state.completedDomains = data.completedDomains;
  state.currentDomainId = data.currentDomainId;
  state.currentFacts = data.extractedFacts;
  messages.push({ role: "assistant", content: data.replyMessage });

  const answers = {
    "pradhana_lakshana": "It started yesterday, sudden onset.",
    "prakriti_vikriti": "I have a thin frame, dry skin, and feel cold and anxious.",
    "agni_koshtha": "My appetite is variable and I have hard dry stools.",
    "nidra_manas": "Takes hours to fall asleep, very anxious.",
    "bala_ama_sweda": "Low stamina, don't sweat much, tongue is coated.",
    "ritu_ahara_triggers": "Worse in cold wind.",
    "prior_ayush_lifestyle": "I take Triphala at night."
  };

  for (let i = 0; i < 7; i++) {
    const userReply = answers[state.currentDomainId] || "Yes.";
    console.log("User:", userReply);
    messages.push({ role: "user", content: userReply });

    res = await fetch("http://localhost:3000/api/gemini/conversational-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        language: "English",
        department: "AYUSH",
        consultationMode: "AYUSH",
        completedDomains: state.completedDomains,
        currentDomainId: state.currentDomainId,
        currentFacts: state.currentFacts
      })
    });
    data = (await res.json()).data;
    console.log(`Assistant [${data.currentDomainId}]:`, data.replyMessage);
    
    state.completedDomains = data.completedDomains;
    state.currentDomainId = data.currentDomainId;
    state.currentFacts = data.extractedFacts;
    messages.push({ role: "assistant", content: data.replyMessage });

    if (data.isHistoryComplete) {
      break;
    }
  }

  console.log("Final Extracted Facts:", JSON.stringify(state.currentFacts, null, 2));
}

run();
