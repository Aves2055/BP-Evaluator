document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("bp-form");
  const resetBtn = document.getElementById("reset-btn");
  const clearHistoryBtn = document.getElementById("clear-history-btn");
  const errorBox = document.getElementById("error-box");
  const resultsSection = document.getElementById("results-section");

  const STORAGE_KEY = "cardiocheck_bp_history_v1";

  // Load saved history on startup
  renderHistory();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    hideError();

    const sys = parseInt(document.getElementById("sys").value, 10);
    const dia = parseInt(document.getElementById("dia").value, 10);
    const pulse = parseInt(document.getElementById("pulse").value, 10);

    // Validation
    const validationError = validateInputs(sys, dia, pulse);
    if (validationError) {
      showError(validationError);
      return;
    }

    // Evaluate all metrics
    const bpEval = evaluateBP(sys, dia);
    const sysEval = evaluateSystolic(sys);
    const diaEval = evaluateDiastolic(dia);
    const pulseEval = evaluatePulse(pulse);
    const derivedEval = evaluateDerived(sys, dia);

    // Update UI
    displayResults({
      sys,
      dia,
      pulse,
      bpEval,
      sysEval,
      diaEval,
      pulseEval,
      derivedEval,
    });

    // Save to local history
    saveReading({
      date: new Date().toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      sys,
      dia,
      pulse,
      category: bpEval.category,
      statusClass: bpEval.statusClass,
    });
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    hideError();
    resultsSection.classList.add("hidden");
  });

  clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });

  function validateInputs(sys, dia, pulse) {
    if (isNaN(sys) || isNaN(dia) || isNaN(pulse)) {
      return "Please enter numbers for all three fields: SYS, DIA, and PULSE.";
    }
    if (sys < 40 || sys > 300) {
      return "Systolic (SYS) reading must be between 40 and 300 mmHg.";
    }
    if (dia < 30 || dia > 200) {
      return "Diastolic (DIA) reading must be between 30 and 200 mmHg.";
    }
    if (sys <= dia) {
      return "Systolic (top number) must be higher than Diastolic (bottom number). Please double-check your monitor.";
    }
    if (pulse < 30 || pulse > 250) {
      return "Pulse reading must be between 30 and 250 BPM.";
    }
    return null;
  }

  // Overall BP Evaluation (Checks highest risk first)
  function evaluateBP(sys, dia) {
    if (sys > 180 || dia > 120) {
      return {
        category: "Hypertensive Crisis",
        statusClass: "status-crisis",
        borderColor: "#991b1b",
        gaugePercent: 92,
        isEmergency: true,
        explanation:
          "Your blood pressure is dangerously high (above 180 systolic or above 120 diastolic). Blood pressure at this level can damage blood vessels and organs if not addressed promptly.",
        tips: [
          "Wait 5 minutes and take your blood pressure again to confirm the reading.",
          "If your reading stays above 180/120 and you have NO symptoms, contact your doctor immediately.",
          "If you have chest pain, shortness of breath, back pain, numbness, weakness, change in vision, or difficulty speaking, call emergency services immediately.",
          "Do not try to rapidly lower your blood pressure on your own without medical guidance.",
        ],
      };
    }

    if (sys >= 140 || dia >= 90) {
      return {
        category: "High Blood Pressure (Stage 2)",
        statusClass: "status-stage2",
        borderColor: "#dc2626",
        gaugePercent: 75,
        isEmergency: false,
        explanation:
          "Your blood pressure is significantly elevated (140+ systolic or 90+ diastolic). At this stage, doctors typically recommend a combination of lifestyle changes and blood pressure medication.",
        tips: [
          "Schedule an appointment with your healthcare provider soon to review this reading.",
          "Record your BP twice daily (morning and evening) for a week to show your doctor a trend.",
          "Strictly limit sodium (salt), processed foods, alcohol, and caffeine.",
          "If you are already prescribed BP medication, verify you haven't missed a dose.",
        ],
      };
    }

    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) {
      return {
        category: "High Blood Pressure (Stage 1)",
        statusClass: "status-stage1",
        borderColor: "#ea580c",
        gaugePercent: 58,
        isEmergency: false,
        explanation:
          "Your reading falls into Stage 1 Hypertension (130–139 systolic or 80–89 diastolic). Over time, consistently elevated pressure makes your heart work harder and puts extra strain on artery walls.",
        tips: [
          "Consult a doctor to discuss whether lifestyle adjustments alone or medication are appropriate for your overall health.",
          "Follow a heart-healthy diet rich in vegetables, fruits, whole grains, and potassium (such as the DASH diet).",
          "Aim for at least 150 minutes of moderate aerobic activity (like brisk walking) per week.",
          "Manage stress and ensure 7–8 hours of quality sleep each night.",
        ],
      };
    }

    if (sys >= 120 && sys <= 129 && dia < 80) {
      return {
        category: "Elevated Blood Pressure",
        statusClass: "status-elevated",
        borderColor: "#ca8a04",
        gaugePercent: 41,
        isEmergency: false,
        explanation:
          "Your systolic (top) number is slightly above normal (120–129), while your diastolic number remains normal (below 80). People with elevated blood pressure are likely to develop high blood pressure unless steps are taken to control it.",
        tips: [
          "Take proactive steps now to bring your systolic number back under 120 mmHg.",
          "Cut back on packaged snacks, restaurant meals, and added table salt.",
          "Stay physically active and maintain a healthy body weight.",
          "Re-check your blood pressure once a week under calm, rested conditions.",
        ],
      };
    }

    if (sys < 90 || dia < 60) {
      return {
        category: "Low Blood Pressure (Hypotension)",
        statusClass: "status-low",
        borderColor: "#2563eb",
        gaugePercent: 8,
        isEmergency: sys < 80 || dia < 50,
        explanation:
          "Your blood pressure is lower than the standard normal range (below 90 systolic or below 60 diastolic). For very fit individuals, low BP without symptoms can be harmless, but it can also reduce blood flow to vital organs.",
        tips: [
          "Pay attention to symptoms like dizziness, lightheadedness, blurred vision, fatigue, or fainting.",
          "Drink a glass of water—dehydration is one of the most common causes of low blood pressure.",
          "Stand up slowly from sitting or lying positions to avoid sudden drops in pressure.",
          "Consult a doctor if low readings are unusual for you or if you take BP/heart medications.",
        ],
      };
    }

    // Normal: SYS 90-119 AND DIA 60-79
    return {
      category: "Normal Blood Pressure",
      statusClass: "status-normal",
      borderColor: "#16a34a",
      gaugePercent: 25,
      isEmergency: false,
      explanation:
        "Great news! Both your systolic (90–119 mmHg) and diastolic (60–79 mmHg) numbers are within the healthy, optimal range. Your heart and blood vessels are under healthy resting pressure.",
      tips: [
        "Keep up your current healthy habits, including regular movement and balanced nutrition.",
        "Stay well-hydrated and keep sodium intake moderate to protect long-term heart health.",
        "Continue checking your blood pressure periodically to establish your personal baseline.",
      ],
    };
  }

  function evaluateSystolic(sys) {
    if (sys < 90) return { label: "Low", cls: "status-low", desc: "Pressure when your heart beats is below 90 mmHg." };
    if (sys <= 119) return { label: "Normal", cls: "status-normal", desc: "Healthy arterial pressure while the heart contracts." };
    if (sys <= 129) return { label: "Elevated", cls: "status-elevated", desc: "Slightly above optimal pressure during heartbeats." };
    if (sys <= 139) return { label: "Stage 1 High", cls: "status-stage1", desc: "Moderately elevated pressure when the heart pumps." };
    if (sys <= 180) return { label: "Stage 2 High", cls: "status-stage2", desc: "High force against artery walls during heartbeats." };
    return { label: "Crisis", cls: "status-crisis", desc: "Critically high systolic pressure; seek medical care." };
  }

  function evaluateDiastolic(dia) {
    if (dia < 60) return { label: "Low", cls: "status-low", desc: "Resting pressure between beats is below 60 mmHg." };
    if (dia <= 79) return { label: "Normal", cls: "status-normal", desc: "Healthy arterial relaxation pressure between heartbeats." };
    if (dia <= 89) return { label: "Stage 1 High", cls: "status-stage1", desc: "Arteries stay moderately tense even between beats." };
    if (dia <= 120) return { label: "Stage 2 High", cls: "status-stage2", desc: "High resting tension in blood vessels between beats." };
    return { label: "Crisis", cls: "status-crisis", desc: "Critically high resting pressure; seek medical care." };
  }

  function evaluatePulse(pulse) {
    if (pulse < 60) {
      return {
        label: "Low (Bradycardia)",
        cls: "status-low",
        desc: "Below 60 BPM. Normal for well-trained athletes or during deep rest; consult a doctor if you feel dizzy or fatigued.",
      };
    }
    if (pulse <= 100) {
      return {
        label: "Normal",
        cls: "status-normal",
        desc: "Within the healthy adult resting heart rate range of 60–100 beats per minute.",
      };
    }
    return {
      label: "High (Tachycardia)",
      cls: "status-stage1",
      desc: "Above 100 BPM. Can be triggered by recent exercise, stress, caffeine, fever, or dehydration. Rest and re-test.",
    };
  }

  function evaluateDerived(sys, dia) {
    const pulsePressure = sys - dia;
    const map = Math.round(dia + (1 / 3) * pulsePressure);

    let ppNote = "Normal pulse pressure (40–60 mmHg).";
    if (pulsePressure < 40) ppNote = "Narrow pulse pressure (<40 mmHg).";
    if (pulsePressure > 60) ppNote = "Wide pulse pressure (>60 mmHg), often linked to arterial stiffness.";

    let mapNote = "Normal organ perfusion (70–100 mmHg).";
    if (map < 70) mapNote = "Low MAP (<70 mmHg).";
    if (map > 100) mapNote = "Elevated MAP (>100 mmHg).";

    return {
      pp: pulsePressure,
      map: map,
      desc: `${ppNote} ${mapNote}`,
    };
  }

  function displayResults({ sys, dia, pulse, bpEval, sysEval, diaEval, pulseEval, derivedEval }) {
    resultsSection.classList.remove("hidden");

    // Emergency Banner
    const emergencyAlert = document.getElementById("emergency-alert");
    if (bpEval.isEmergency) {
      emergencyAlert.classList.remove("hidden");
    } else {
      emergencyAlert.classList.add("hidden");
    }

    // Main BP Card
    const resultCard = document.getElementById("bp-result-card");
    resultCard.style.borderTopColor = bpEval.borderColor;

    const categoryTitle = document.getElementById("bp-category-title");
    categoryTitle.textContent = bpEval.category;
    categoryTitle.style.color = bpEval.borderColor;

    document.getElementById("reading-summary-pill").textContent = `${sys} / ${dia} mmHg • ${pulse} BPM`;
    document.getElementById("gauge-marker").style.left = `${bpEval.gaugePercent}%`;
    document.getElementById("bp-explanation").textContent = bpEval.explanation;

    // SYS Card
    document.getElementById("sys-val").textContent = sys;
    const sysBadge = document.getElementById("sys-badge");
    sysBadge.textContent = sysEval.label;
    sysBadge.className = `mini-badge ${sysEval.cls}`;
    document.getElementById("sys-desc").textContent = sysEval.desc;

    // DIA Card
    document.getElementById("dia-val").textContent = dia;
    const diaBadge = document.getElementById("dia-badge");
    diaBadge.textContent = diaEval.label;
    diaBadge.className = `mini-badge ${diaEval.cls}`;
    document.getElementById("dia-desc").textContent = diaEval.desc;

    // Pulse Card
    document.getElementById("pulse-val").textContent = pulse;
    const pulseBadge = document.getElementById("pulse-badge");
    pulseBadge.textContent = pulseEval.label;
    pulseBadge.className = `mini-badge ${pulseEval.cls}`;
    document.getElementById("pulse-desc").textContent = pulseEval.desc;

    // Derived Card (PP & MAP)
    document.getElementById("pp-val").textContent = derivedEval.pp;
    document.getElementById("map-val").textContent = derivedEval.map;
    document.getElementById("derived-desc").textContent = derivedEval.desc;

    // Tips
    const tipsList = document.getElementById("tips-list");
    tipsList.innerHTML = "";
    bpEval.tips.forEach((tip) => {
      const li = document.createElement("li");
      li.textContent = tip;
      tipsList.appendChild(li);
    });

    resultsSection.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function saveReading(entry) {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    existing.unshift(entry);
    const trimmed = existing.slice(0, 10); // Keep last 10 readings
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    renderHistory();
  }

  function renderHistory() {
    const container = document.getElementById("history-container");
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    if (history.length === 0) {
      container.innerHTML =
        '<p class="empty-history">No readings saved yet. Your evaluated readings will appear here automatically on this device.</p>';
      return;
    }

    const ul = document.createElement("ul");
    ul.className = "history-list";

    history.forEach((item) => {
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `
        <span><strong>${item.sys}/${item.dia}</strong> mmHg &bull; <strong>${item.pulse}</strong> BPM</span>
        <span class="mini-badge ${item.statusClass}">${item.category}</span>
        <span style="color: #64748b; font-size: 0.82rem;">${item.date}</span>
      `;
      ul.appendChild(li);
    });

    container.innerHTML = "";
    container.appendChild(ul);
  }

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.classList.remove("hidden");
  }

  function hideError() {
    errorBox.textContent = "";
    errorBox.classList.add("hidden");
  }
});
