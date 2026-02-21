const CURRENT_USER_KEY = "sciencelift_current_user";
const USERS_KEY = "sciencelift_users";
const SETTINGS_KEY = "sciencelift_settings";
const RESEARCH_CACHE_KEY = "sciencelift_research_cache";
let deferredInstallPrompt = null;

function getPlanKey(username) {
    return `sciencelift_plan_${username.toLowerCase()}`;
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    } catch (err) {
        return {};
    }
}

function setUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
    return localStorage.getItem(CURRENT_USER_KEY);
}

function setCurrentUser(username) {
    if (username) {
        localStorage.setItem(CURRENT_USER_KEY, username);
    } else {
        localStorage.removeItem(CURRENT_USER_KEY);
    }
}

function updateAuthUI() {
    const user = getCurrentUser();
    const authStatus = document.getElementById("auth-status");
    const usernameInput = document.getElementById("username");
    authStatus.textContent = user ? `Signed in as ${user}` : "Not signed in";
    if (user) {
        usernameInput.value = user;
    } else {
        usernameInput.value = "";
    }
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach((el) => {
        el.classList.remove("active");
    });
    document.getElementById(pageId).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach((el) => {
        el.classList.remove("active");
    });
    if (pageId === "plannerPage") document.getElementById("navPlanner").classList.add("active");
    if (pageId === "planPage") document.getElementById("navPlan").classList.add("active");
    if (pageId === "openRoutinePage") document.getElementById("navOpenRoutine").classList.add("active");
    if (pageId === "openDietPage") document.getElementById("navOpenDiet").classList.add("active");
    if (pageId === "authPage") document.getElementById("navAuth").classList.add("active");
    if (pageId === "settingsPage") document.getElementById("navSettings").classList.add("active");
}

function getFormState() {
    return {
        days: document.getElementById("days").value,
        splitMode: document.getElementById("splitMode").value,
        weight: document.getElementById("weight").value,
        weightUnit: document.getElementById("weightUnit").value,
        targetWeight: document.getElementById("targetWeight").value,
        height: document.getElementById("height").value,
        heightUnit: document.getElementById("heightUnit").value,
        age: document.getElementById("age").value,
        goal: document.getElementById("goal").value,
        benchPR: document.getElementById("benchPR").value,
        squatPR: document.getElementById("squatPR").value
    };
}

function applyFormState(state) {
    if (!state) return;
    document.getElementById("days").value = state.days || "4";
    document.getElementById("splitMode").value = state.splitMode || "optimal";
    document.getElementById("weight").value = state.weight || "";
    document.getElementById("weightUnit").value = state.weightUnit || "kg";
    document.getElementById("targetWeight").value = state.targetWeight || "";
    document.getElementById("height").value = state.height || "";
    document.getElementById("heightUnit").value = state.heightUnit || "cm";
    document.getElementById("age").value = state.age || "";
    document.getElementById("goal").value = state.goal || "maintain";
    document.getElementById("benchPR").value = state.benchPR || "";
    document.getElementById("squatPR").value = state.squatPR || "";
}

function savePlanForUser(showAlert = false) {
    const user = getCurrentUser();
    if (!user) {
        if (showAlert) alert("Sign in first to save your plan.");
        return false;
    }

    const dietHtml = document.getElementById("diet-display").innerHTML.trim();
    const workoutHtml = document.getElementById("workout-display").innerHTML.trim();
    const openRoutineHtml = document.getElementById("open-routine-display").innerHTML.trim();
    const openDietHtml = document.getElementById("open-diet-display").innerHTML.trim();
    if (!dietHtml && !workoutHtml && !openRoutineHtml && !openDietHtml) {
        if (showAlert) alert("Create a plan first, then save.");
        return false;
    }

    const payload = {
        updatedAt: new Date().toISOString(),
        form: getFormState(),
        dietHtml,
        workoutHtml,
        openRoutineHtml,
        openDietHtml
    };

    localStorage.setItem(getPlanKey(user), JSON.stringify(payload));
    if (showAlert) alert(`Plan saved for ${user}.`);
    return true;
}

function loadSavedPlanForCurrentUser(showAlert = false) {
    const user = getCurrentUser();
    if (!user) return false;

    const raw = localStorage.getItem(getPlanKey(user));
    if (!raw) {
        if (showAlert) alert("No saved plan found for this user yet.");
        return false;
    }

    try {
        const saved = JSON.parse(raw);
        applyFormState(saved.form);
        document.getElementById("diet-display").innerHTML = saved.dietHtml || "";
        document.getElementById("workout-display").innerHTML = saved.workoutHtml || "";
        document.getElementById("open-routine-display").innerHTML = saved.openRoutineHtml || "";
        document.getElementById("open-diet-display").innerHTML = saved.openDietHtml || "";
        if (showAlert) alert(`Loaded saved plan for ${user}.`);
        return true;
    } catch (err) {
        if (showAlert) alert("Saved plan data is invalid.");
        return false;
    }
}

function autoSavePlanIfSignedIn() {
    const settings = getSettings();
    if (settings.autoSave !== "on") return;
    if (getCurrentUser()) {
        savePlanForUser(false);
    }
}

function signIn() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (!username || !password) {
        alert("Enter username and password to sign in.");
        return;
    }
    const users = getUsers();
    if (!users[username] || users[username].password !== password) {
        alert("Invalid username or password.");
        return;
    }
    setCurrentUser(username);
    updateAuthUI();
    loadSavedPlanForCurrentUser(true);
    showPage("plannerPage");
}

function createAccount() {
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    if (!username || !password) {
        alert("Enter username and password to create an account.");
        return;
    }
    const users = getUsers();
    if (users[username]) {
        alert("This username already exists.");
        return;
    }
    users[username] = { password };
    setUsers(users);
    setCurrentUser(username);
    updateAuthUI();
    alert("Account created and signed in.");
    showPage("plannerPage");
}

function signOut() {
    setCurrentUser(null);
    updateAuthUI();
}

function getSettings() {
    try {
        const parsed = JSON.parse(localStorage.getItem(SETTINGS_KEY));
        return parsed || { defaultWeightUnit: "kg", defaultHeightUnit: "cm", autoSave: "on", autoResearch: "on" };
    } catch (err) {
        return { defaultWeightUnit: "kg", defaultHeightUnit: "cm", autoSave: "on", autoResearch: "on" };
    }
}

function applySettingsToUI(settings) {
    document.getElementById("defaultWeightUnit").value = settings.defaultWeightUnit || "kg";
    document.getElementById("defaultHeightUnit").value = settings.defaultHeightUnit || "cm";
    document.getElementById("autoSaveSetting").value = settings.autoSave || "on";
    document.getElementById("autoResearchSetting").value = settings.autoResearch || "on";
    document.getElementById("weightUnit").value = settings.defaultWeightUnit || "kg";
    document.getElementById("heightUnit").value = settings.defaultHeightUnit || "cm";
}

function saveSettings(showAlert = false) {
    const settings = {
        defaultWeightUnit: document.getElementById("defaultWeightUnit").value,
        defaultHeightUnit: document.getElementById("defaultHeightUnit").value,
        autoSave: document.getElementById("autoSaveSetting").value,
        autoResearch: document.getElementById("autoResearchSetting").value
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    applySettingsToUI(settings);
    if (showAlert) alert("Settings saved.");
}

function getResearchCache() {
    try {
        return JSON.parse(localStorage.getItem(RESEARCH_CACHE_KEY));
    } catch (err) {
        return null;
    }
}

function setResearchCache(data) {
    localStorage.setItem(RESEARCH_CACHE_KEY, JSON.stringify(data));
}

function renderResearch() {
    const target = document.getElementById("research-display");
    const cache = getResearchCache();
    if (!cache || !cache.papers || cache.papers.length === 0) {
        target.innerHTML = `
            <h3>Research Sync</h3>
            <p>No research synced yet.</p>
            <small>Use "Sync Research Now" to fetch the latest papers.</small>
        `;
        return;
    }

    const items = cache.papers.slice(0, 5).map((paper) => {
        const source = paper.source ? ` (${paper.source})` : "";
        return `<li><a href="${paper.url}" target="_blank" rel="noopener noreferrer">${paper.title}</a> - ${paper.year}${source}</li>`;
    }).join("");

    target.innerHTML = `
        <h3>Research Sync</h3>
        <p>Last updated: ${new Date(cache.updatedAt).toLocaleString()}</p>
        <ul>${items}</ul>
        <small>Data source: OpenAlex recent hypertrophy/nutrition papers.</small>
    `;
}

function getProteinMultiplier(goal) {
    const cache = getResearchCache();
    const hasProteinPapers = cache && cache.papers && cache.papers.some((p) => /protein/i.test(p.title));
    if (goal === "cut") return hasProteinPapers ? 2.2 : 2.0;
    return hasProteinPapers ? 2.0 : 1.8;
}

async function syncResearch(showAlert = false, force = false) {
    const settings = getSettings();
    const cache = getResearchCache();
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    if (!force && settings.autoResearch !== "on") {
        renderResearch();
        return;
    }

    if (!force && cache && now - new Date(cache.updatedAt).getTime() < dayMs) {
        renderResearch();
        return;
    }

    try {
        const url = "https://api.openalex.org/works?search=resistance%20training%20hypertrophy%20protein%20meta-analysis&filter=from_publication_date:2023-01-01,language:en,type:article&sort=publication_date:desc&per-page=8";
        const res = await fetch(url);
        if (!res.ok) throw new Error("Research fetch failed");
        const data = await res.json();
        const papers = (data.results || []).map((item) => ({
            title: item.title || "Untitled",
            year: item.publication_year || "n/a",
            source: item.primary_location?.source?.display_name || "",
            url: item.doi ? `https://doi.org/${item.doi.replace("https://doi.org/", "")}` : (item.id || "#")
        }));
        setResearchCache({
            updatedAt: new Date().toISOString(),
            papers
        });
        renderResearch();
        if (showAlert) alert("Research synced from recent papers.");
    } catch (err) {
        renderResearch();
        if (showAlert) alert("Could not sync research right now.");
    }
}

function getCardioSuggestion(days, goal) {
    const suggestions = {
        cut: {
            3: "Cardio: Tue, Thu, Sat (3 days) - 25-35 min Zone 2 + 1 short HIIT finisher.",
            4: "Cardio: Wed, Sat, Sun (3 days) - 25-35 min Zone 2.",
            5: "Cardio: Wed, Sat (2 days) - 20-30 min Zone 2 + 8-12k daily steps."
        },
        maintain: {
            3: "Cardio: Tue, Sat (2 days) - 20-30 min Zone 2.",
            4: "Cardio: Wed, Sun (2 days) - 20-25 min Zone 2.",
            5: "Cardio: Sat (1 day) - 20-30 min Zone 2."
        },
        bulk: {
            3: "Cardio: Wed, Sun (2 light days) - 15-25 min easy Zone 2.",
            4: "Cardio: Sun (1 light day) - 15-20 min easy Zone 2.",
            5: "Cardio: Optional 1 light day - 15-20 min easy Zone 2."
        }
    };

    const goalMap = suggestions[goal] || suggestions.maintain;
    return goalMap[days] || goalMap[4];
}

function buildCardioCard(days, goal) {
    const cardioText = getCardioSuggestion(days, goal);
    return `
        <div class="workout-card">
            <h3>Suggested Cardio Days</h3>
            <p>${cardioText}</p>
            <small>Keep cardio low-impact when possible to protect leg recovery.</small>
        </div>
    `;
}

function architectPlan(showValidationAlert = false) {
    const wInput = parseFloat(document.getElementById("weight").value);
    const targetWInput = parseFloat(document.getElementById("targetWeight").value);
    const hInput = parseFloat(document.getElementById("height").value);
    const a = parseFloat(document.getElementById("age").value);
    const goal = document.getElementById("goal").value;
    const days = Number(document.getElementById("days").value);
    const weightUnit = document.getElementById("weightUnit").value;
    const heightUnit = document.getElementById("heightUnit").value;
    const bench = parseFloat(document.getElementById("benchPR").value) || 0;
    const w = weightUnit === "lb" ? wInput * 0.45359237 : wInput;
    const targetW = weightUnit === "lb" ? targetWInput * 0.45359237 : targetWInput;
    const h = heightUnit === "in" ? hInput * 2.54 : hInput;

    if (!w || !h) {
        if (showValidationAlert) {
            alert("Please enter weight and height.");
        }
        document.getElementById("diet-display").innerHTML = `
            <div class="workout-card" style="border-left-color: var(--vibrant-blue)">
                <h3>Daily Science-Based Nutrition</h3>
                <p>Enter your weight and height (kg/lb and cm/in supported).</p>
            </div>
        `;
        document.getElementById("workout-display").innerHTML = "";
        document.getElementById("open-routine-display").innerHTML = "";
        document.getElementById("open-diet-display").innerHTML = "";
        return;
    }

    // 1. DIET LOGIC (Mifflin-St Jeor)
    const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    const tdee = bmr * 1.55;
    let targetCals = tdee;

    if (goal === "bulk") targetCals += 300;
    if (goal === "cut") targetCals -= 500;

    const protein = w * getProteinMultiplier(goal);
    const fats = (targetCals * 0.25) / 9;
    const carbs = (targetCals - (protein * 4) - (fats * 9)) / 4;
    const dailyCalorieDelta = targetCals - tdee;

    let goalProjection = "<small>Add a target weight to estimate total calories and timeline.</small>";
    if (targetW && targetW > 0) {
        const deltaKg = targetW - w;
        const totalCaloriesNeeded = Math.abs(deltaKg) * 7700;
        const direction = deltaKg > 0 ? "gain" : deltaKg < 0 ? "lose" : "maintain";
        const effectiveDailyDelta = Math.abs(dailyCalorieDelta);
        let etaText = "Set a bulk/cut calorie target to estimate timeline.";

        if (direction === "maintain") {
            etaText = "You are already at your target weight.";
        } else if (effectiveDailyDelta > 0) {
            const daysNeeded = totalCaloriesNeeded / effectiveDailyDelta;
            const weeksNeeded = daysNeeded / 7;
            etaText = `Estimated time: ${Math.round(daysNeeded)} days (${weeksNeeded.toFixed(1)} weeks).`;
        }

        goalProjection = `
            <p><strong>Weight Goal:</strong> ${direction === "maintain" ? "Maintain" : `${Math.abs(deltaKg).toFixed(1)} kg to ${direction}`}</p>
            <p><strong>Total Calories Required:</strong> ${Math.round(totalCaloriesNeeded).toLocaleString()} kcal</p>
            <small>${etaText}</small>
        `;
    }

    // 2. WORKOUT LOGIC (Based on Strength Level)
    const strengthRatio = bench / w;
    let level = "Novice";
    let volAdjust = "3 sets";

    if (strengthRatio > 1.2) {
        level = "Intermediate/Advanced";
        volAdjust = "4-5 sets";
    }

    // 3. RENDER RESULTS
    document.getElementById("diet-display").innerHTML = `
        <div class="workout-card" style="border-left-color: var(--vibrant-blue)">
            <h3>Daily Science-Based Nutrition</h3>
            <p><strong>Calories:</strong> ${Math.round(targetCals)} kcal</p>
            <p><strong>Macros:</strong> P: ${Math.round(protein)}g | C: ${Math.round(carbs)}g | F: ${Math.round(fats)}g</p>
            ${goalProjection}
            <small>Prioritize 0.4g/kg protein per meal for MPS spikes.</small>
        </div>
    `;

    document.getElementById("workout-display").innerHTML = `
        <div class="workout-card">
            <h3>${level} Hypertrophy Protocol</h3>
            <p>Targeting ${volAdjust} per exercise for optimal effective volume.</p>
            <ul>
                <li>Main Compound: ${volAdjust} x 5-8 reps (RPE 8)</li>
                <li>Accessory A: 3 x 10-12 reps (RPE 9)</li>
                <li>Finisher: 2 x 15-20 reps (To Failure)</li>
            </ul>
        </div>
        ${buildCardioCard(days, goal)}
    `;
    document.getElementById("open-routine-display").innerHTML = "";
    document.getElementById("open-diet-display").innerHTML = "";

    autoSavePlanIfSignedIn();
    if (showValidationAlert) {
        showPage("planPage");
    }
}

function openDietSchedule() {
    const wInput = parseFloat(document.getElementById("weight").value);
    const hInput = parseFloat(document.getElementById("height").value);
    const a = parseFloat(document.getElementById("age").value);
    const goal = document.getElementById("goal").value;
    const weightUnit = document.getElementById("weightUnit").value;
    const heightUnit = document.getElementById("heightUnit").value;
    const display = document.getElementById("open-diet-display");
    const w = weightUnit === "lb" ? wInput * 0.45359237 : wInput;
    const h = heightUnit === "in" ? hInput * 2.54 : hInput;

    if (!w || !h || !a) {
        alert("Enter weight, height, and age to generate a diet schedule.");
        return;
    }

    const bmr = (10 * w) + (6.25 * h) - (5 * a) + 5;
    const tdee = bmr * 1.55;
    let targetCals = tdee;
    if (goal === "bulk") targetCals += 300;
    if (goal === "cut") targetCals -= 500;

    const protein = w * getProteinMultiplier(goal);
    const fats = (targetCals * 0.25) / 9;
    const carbs = (targetCals - (protein * 4) - (fats * 9)) / 4;

    const meals = [
        { name: "Meal 1 (Breakfast)", calsPct: 0.25, proteinPct: 0.25, carbsPct: 0.30, fatsPct: 0.20 },
        { name: "Meal 2 (Lunch)", calsPct: 0.30, proteinPct: 0.30, carbsPct: 0.30, fatsPct: 0.30 },
        { name: "Meal 3 (Pre/Post Workout)", calsPct: 0.25, proteinPct: 0.25, carbsPct: 0.30, fatsPct: 0.15 },
        { name: "Meal 4 (Dinner)", calsPct: 0.20, proteinPct: 0.20, carbsPct: 0.10, fatsPct: 0.35 }
    ];

    const cards = meals.map((m) => `
        <div class="workout-card">
            <h3>${m.name}</h3>
            <p><strong>Calories:</strong> ${Math.round(targetCals * m.calsPct)} kcal</p>
            <p><strong>Macros:</strong> P ${Math.round(protein * m.proteinPct)}g | C ${Math.round(carbs * m.carbsPct)}g | F ${Math.round(fats * m.fatsPct)}g</p>
            <small>Example foods: lean protein, fruit/rice/potato, vegetables, healthy fats.</small>
        </div>
    `).join("");

    display.innerHTML = `
        <div class="workout-card">
            <h3>Open Diet Schedule (${goal})</h3>
            <p><strong>Daily Total:</strong> ${Math.round(targetCals)} kcal</p>
            <p><strong>Daily Macros:</strong> P ${Math.round(protein)}g | C ${Math.round(carbs)}g | F ${Math.round(fats)}g</p>
            <small>Distribute protein across 3-5 feedings for muscle protein synthesis support.</small>
        </div>
        ${cards}
    `;

    autoSavePlanIfSignedIn();
    showPage("openDietPage");
}

function getOpenPlanTemplates() {
    return {
        optimal: {
            3: {
                name: "3-Day Full Body (Best Fit)",
                days: [
                    ["Day 1 - Full Body", ["Back Squat 3x6-8", "Bench Press 3x6-8", "Chest-Supported Row 3x8-10", "Romanian Deadlift 2x8-10", "Cable Curl 2x10-12"]],
                    ["Day 2 - Full Body", ["Leg Press 3x10-12", "Incline DB Press 3x8-10", "Lat Pulldown 3x8-12", "Leg Curl 2x10-12", "Rope Pressdown 2x10-12"]],
                    ["Day 3 - Full Body", ["Hack Squat 3x8-10", "Machine Chest Press 3x8-10", "Seated Cable Row 3x8-12", "Hip Thrust 2x8-12", "Hammer Curl 2x10-12"]]
                ]
            },
            4: {
                name: "4-Day Upper/Lower (Best Fit)",
                days: [
                    ["Day 1 - Upper A", ["Bench Press 3x5-8", "Barbell Row 3x6-10", "Incline DB Press 2x8-12", "Lat Pulldown 2x8-12", "Lateral Raise 2x12-15"]],
                    ["Day 2 - Lower A", ["Back Squat 3x5-8", "Romanian Deadlift 3x6-10", "Leg Press 2x10-12", "Leg Curl 2x10-12", "Calf Raise 3x10-15"]],
                    ["Day 3 - Upper B", ["Incline Smith Press 3x6-10", "Seated Cable Row 3x8-12", "Machine Chest Fly 2x10-14", "Pull-Up 2x6-10", "Overhead Triceps Ext 2x10-12"]],
                    ["Day 4 - Lower B", ["Hack Squat 3x8-10", "Hip Thrust 3x8-12", "Split Squat 2x10-12", "Seated Leg Curl 2x10-14", "Cable Crunch 2x12-15"]]
                ]
            },
            5: {
                name: "5-Day PPL + UL (Best Fit)",
                days: [
                    ["Day 1 - Push", ["Bench Press 3x6-8", "Incline DB Press 3x8-10", "Shoulder Press 2x8-12", "Lateral Raise 3x12-15", "Rope Pressdown 2x10-12"]],
                    ["Day 2 - Pull", ["Weighted Pull-Up 3x5-8", "Chest-Supported Row 3x8-10", "Lat Pulldown 2x10-12", "Rear Delt Fly 2x12-15", "Incline Curl 3x8-12"]],
                    ["Day 3 - Legs", ["Back Squat 3x5-8", "RDL 3x6-10", "Leg Press 2x10-12", "Leg Curl 2x10-14", "Calf Raise 3x10-15"]],
                    ["Day 4 - Upper", ["Incline Press 2x8-12", "Cable Row 2x8-12", "Machine Chest Fly 2x12-15", "Pulldown 2x8-12", "Arms Superset 2x12-15"]],
                    ["Day 5 - Lower", ["Hack Squat 3x8-10", "Hip Thrust 3x8-12", "Walking Lunge 2x10-12", "Leg Curl 2x12-15", "Calf Raise 3x12-15"]]
                ]
            }
        },
        ul_arms_no_shoulders: {
            4: {
                name: "Upper/Lower (Lower + Arms, No Shoulders)",
                note: "Lower days include biceps/triceps and exclude shoulder work.",
                days: [
                    ["Day 1 - Upper A", ["Bench Press 3x5-8", "Barbell Row 3x6-10", "Incline DB Press 2x8-12", "Lat Pulldown 2x8-12", "Chest Fly 2x10-12"]],
                    ["Day 2 - Lower + Arms A", ["Back Squat 3x5-8", "Romanian Deadlift 3x6-10", "Leg Press 2x10-12", "EZ Curl 3x10-12", "Rope Pressdown 3x10-12"]],
                    ["Day 3 - Upper B", ["Incline Smith Press 3x6-10", "Seated Cable Row 3x8-12", "Weighted Dip 2x6-10", "Pull-Up 2x6-10", "Cable Chest Press 2x10-12"]],
                    ["Day 4 - Lower + Arms B", ["Hack Squat 3x8-10", "Hip Thrust 3x8-12", "Seated Leg Curl 2x10-14", "Hammer Curl 3x10-12", "Overhead Cable Triceps 3x10-12"]]
                ]
            }
        }
    };
}

function openPlan() {
    const days = Number(document.getElementById("days").value);
    const splitMode = document.getElementById("splitMode").value;
    const goal = document.getElementById("goal").value;
    const display = document.getElementById("open-routine-display");
    const templates = getOpenPlanTemplates();
    let plan = templates[splitMode]?.[days];
    let fallbackNote = "";

    if (!plan && splitMode === "ul_arms_no_shoulders") {
        plan = templates.ul_arms_no_shoulders[4];
        fallbackNote = "This split is best fit as a 4-day structure, so the 4-day template is shown.";
    }
    if (!plan) {
        plan = templates.optimal[4];
        fallbackNote = "No direct match for this combination, so a 4-day optimal plan is shown.";
    }

    const cards = plan.days.map(([title, exercises]) => `
        <div class="workout-card">
            <h3>${title}</h3>
            <ul>
                ${exercises.map((ex) => `<li>${ex}</li>`).join("")}
            </ul>
        </div>
    `).join("");

    display.innerHTML = `
        <div class="workout-card">
            <h3>Open Plan: ${plan.name}</h3>
            <p>Optimized for your selected schedule and split mode.</p>
            ${plan.note ? `<small>${plan.note}</small>` : ""}
            ${fallbackNote ? `<p><small>${fallbackNote}</small></p>` : ""}
        </div>
        ${cards}
        ${buildCardioCard(days, goal)}
    `;

    autoSavePlanIfSignedIn();
    showPage("openRoutinePage");
}

function setupInstallFlow() {
    const installBtn = document.getElementById("installBtn");
    const installHelp = document.getElementById("install-help");
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

    if (isStandalone) {
        installHelp.textContent = "App installed. Open from your home screen.";
        installBtn.hidden = true;
        return;
    }

    if (isIOS) {
        installHelp.textContent = "On iPhone/iPad: Share -> Add to Home Screen.";
        installBtn.hidden = true;
    } else {
        installHelp.textContent = "Use Install App for quick home-screen access.";
    }

    window.addEventListener("beforeinstallprompt", (event) => {
        event.preventDefault();
        deferredInstallPrompt = event;
        installBtn.hidden = false;
    });

    installBtn.addEventListener("click", async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        installBtn.hidden = true;
    });
}

function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(() => {});
    }
}

updateAuthUI();
applySettingsToUI(getSettings());
setupInstallFlow();
registerServiceWorker();
renderResearch();
syncResearch(false, false);
if (!loadSavedPlanForCurrentUser(false)) {
    architectPlan(false);
}
