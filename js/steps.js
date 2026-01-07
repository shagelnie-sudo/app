// steps.js
import { isEmployer } from "./auth.js";

let currentStep = 1;

export function showStep(step) {
  document.querySelectorAll(".form-card").forEach(s =>
    s.classList.add("hidden")
  );

  if (step === 1) document.getElementById("step1").classList.remove("hidden");
  else if (step === 2) document.getElementById("step2-verification").classList.remove("hidden");
  else {
    const id = isEmployer ? `step${step}-employer` : `step${step}-employee`;
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  }

  currentStep = step;
}

export function nextStep() {
  showStep(currentStep + 1);
}

export function prevStep() {
  showStep(currentStep - 1);
}