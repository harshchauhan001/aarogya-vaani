import fetch from "node-fetch";

async function run() {
  let res = await fetch("http://localhost:3000/api/gemini/conversational-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{"role": "user", "content": "I have a sudden severe headache, worst headache of my life, and blurry vision"}],
      language: "English",
      department: "AYUSH",
      consultationMode: "AYUSH",
      completedDomains: [],
      currentDomainId: "pradhana_lakshana",
      currentFacts: {}
    })
  });
  let data = await res.json();
  console.log("Red Flag Detected:", data.data.redFlagDetected);
  console.log("Red Flag Symptom Pattern:", data.data.redFlagSymptomPattern);
  console.log("Extracted Facts:", JSON.stringify(data.data.extractedFacts, null, 2));
}
run();
