document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    const START_DATE = new Date(2025, 11, 31); // Dec 31, 2025 (Tomorrow)
    const END_DATE = new Date(2027, 0, 1);   // Jan 1, 2027 (Start of next year)
    const TOTAL_DAYS = Math.ceil((END_DATE - START_DATE) / (1000 * 60 * 60 * 24));

    // --- STATE MANAGEMENT ---
    let appData = {
        skills: {},
        metrics: {
            leetcode: 0,
            books: 0,
            movies: 0,
            animes: 0,
            shows: 0,
            cgpa: 0
        },
        milestones: {},
        protocol: {
            currentStreak: 0,
            lastCheckIn: null, // ISO Date string YYYY-MM-DD
            history: [] // Array of date strings
        }
    };

    // --- DOM ELEMENTS ---
    const ui = {
        currentDay: document.getElementById('current-day'),
        totalDays: document.getElementById('total-days'),
        totalProgress: document.getElementById('total-progress'),
        checkboxes: document.querySelectorAll('input[type="checkbox"]'),
        sliders: document.querySelectorAll('.bat-slider'),
        streakCount: document.getElementById('current-streak'),
        btnCheckIn: document.getElementById('btn-checkin'),
        btnReset: document.getElementById('btn-reset'),
        heatmap: document.getElementById('heatmap-grid'),
        clockDisplay: document.getElementById('doomsday-clock'),
        valDisplays: {
            leetcode: document.getElementById('val-leetcode'),
            books: document.getElementById('val-books'),
            movies: document.getElementById('val-movies'),
            animes: document.getElementById('val-animes'),
            shows: document.getElementById('val-shows'),
            cgpa: document.getElementById('val-cgpa')
        },
        pctDisplays: {
            leetcode: document.getElementById('pct-leetcode'),
            books: document.getElementById('pct-books'),
            movies: document.getElementById('pct-movies'),
            animes: document.getElementById('pct-animes'),
            shows: document.getElementById('pct-shows'),
            cgpa: document.getElementById('pct-cgpa')
        }
    };

    // --- INITIALIZATION ---
    function init() {
        loadData();
        renderHeatmap();
        updateUI();
        calculateDay();
        if (ui.totalDays) ui.totalDays.innerText = TOTAL_DAYS;
        setupEventListeners();
        startClock();
    }

    // --- DATA HANDLING ---
    function loadData() {
        const saved = localStorage.getItem('batmanTracker2026');
        if (saved) {
            appData = { ...appData, ...JSON.parse(saved) };
            if (!appData.metrics) appData.metrics = {};
        }
    }

    function saveData() {
        localStorage.setItem('batmanTracker2026', JSON.stringify(appData));
        calculateProgress();
    }

    // --- CORE FEATURES ---

    function calculateDay() {
        const now = new Date();
        const diffTime = Math.abs(now - START_DATE);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (now < START_DATE) {
            ui.currentDay.innerText = "PRE-OP";
        } else {
            ui.currentDay.innerText = Math.min(diffDays, TOTAL_DAYS);
        }
    }

    function startClock() {
        function updateClock() {
            const now = new Date();
            const distance = END_DATE - now;

            if (distance < 0) {
                ui.clockDisplay.innerText = "MISSION END";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            ui.clockDisplay.innerText =
                `${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        updateClock();
        setInterval(updateClock, 1000);
    }

    function setupEventListeners() {
        // Checkboxes (Skills & Milestones)
        ui.checkboxes.forEach(cb => {
            const category = cb.name === 'skill' ? 'skills' : 'milestones';
            const id = cb.dataset.id;

            if (appData[category][id]) {
                cb.checked = true;
            }

            cb.addEventListener('change', (e) => {
                appData[category][id] = e.target.checked;
                saveData();
                calculateProgress();
            });
        });

        // Custom Progress Controls (Metrics)
        const progressControls = document.querySelectorAll('.bat-progress-control');

        progressControls.forEach(control => {
            const id = control.dataset.id;
            const min = parseFloat(control.dataset.min);
            const max = parseFloat(control.dataset.max);
            const step = parseFloat(control.dataset.step) || 1;

            const btnMinus = control.querySelector('.minus');
            const btnPlus = control.querySelector('.plus');
            const fill = control.querySelector('.progress-fill');

            // Initialize value
            let currentVal = appData.metrics[id] !== undefined ? appData.metrics[id] : min;
            updateMetricDisplay(id, currentVal, max);
            updateProgressBar(fill, currentVal, max);

            // Minus Button
            btnMinus.addEventListener('click', () => {
                let newVal = currentVal - step;
                if (newVal < min) newVal = min;
                currentVal = newVal;

                appData.metrics[id] = currentVal;
                updateMetricDisplay(id, currentVal, max);
                updateProgressBar(fill, currentVal, max);
                saveData();
            });

            // Plus Button
            btnPlus.addEventListener('click', () => {
                let newVal = currentVal + step;
                if (newVal > max) newVal = max;
                currentVal = newVal;

                appData.metrics[id] = currentVal;
                updateMetricDisplay(id, currentVal, max);
                updateProgressBar(fill, currentVal, max);
                saveData();
            });
        });

        // Protocol Buttons
        ui.btnCheckIn.addEventListener('click', handleCheckIn);
        ui.btnReset.addEventListener('click', resetProtocol);
    }

    function updateMetricDisplay(id, value, max) {
        if (ui.valDisplays[id]) {
            if (id === 'cgpa') {
                const cgpaVal = (value / 100).toFixed(2);
                ui.valDisplays[id].innerText = cgpaVal;
            } else {
                ui.valDisplays[id].innerText = value;
            }
        }

        // Update Percentage
        if (ui.pctDisplays[id]) {
            let pct = 0;
            if (max > 0) {
                pct = Math.round((value / max) * 100);
            }
            ui.pctDisplays[id].innerText = `${pct}%`;
        }
    }

    function updateProgressBar(fillElement, value, max) {
        if (!fillElement) return;
        let pct = 0;
        if (max > 0) {
            pct = (value / max) * 100;
        }
        fillElement.style.width = `${pct}%`;
    }

    function getLocalDayString(dateObj = new Date()) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // --- PROTOCOL (STREAK) LOGIC ---
    function handleCheckIn() {
        const today = getLocalDayString();

        if (appData.protocol.lastCheckIn === today) {
            alert("ALREADY CHECKED IN FOR TODAY.");
            return;
        }

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = getLocalDayString(yesterdayDate);

        if (appData.protocol.lastCheckIn === yesterdayStr) {
            appData.protocol.currentStreak++;
        } else {
            if (appData.protocol.lastCheckIn === null) {
                appData.protocol.currentStreak = 1;
            } else {
                appData.protocol.currentStreak = 1;
            }
        }

        appData.protocol.lastCheckIn = today;
        appData.protocol.history.push(today);

        saveData();
        updateUI();
        renderHeatmap();
    }

    function resetProtocol() {
        if (confirm("RESET PROTOCOL? THIS CANNOT BE UNDONE.")) {
            appData.protocol.currentStreak = 0;
            appData.protocol.lastCheckIn = null;
            saveData();
            updateUI();
        }
    }

    function renderHeatmap() {
        ui.heatmap.innerHTML = '';
        let itr = new Date(START_DATE);

        for (let i = 0; i < TOTAL_DAYS; i++) {
            const dateStr = getLocalDayString(itr);
            const el = document.createElement('div');
            el.classList.add('heat-box');
            el.title = dateStr;

            if (appData.protocol.history.includes(dateStr)) {
                el.classList.add('active');
            }

            ui.heatmap.appendChild(el);
            itr.setDate(itr.getDate() + 1);
        }
    }

    // --- PROGRESS CALCULATION ---
    function calculateProgress() {
        let score = 0;
        let totalScore = 0;

        // Skills (Each worth 5 points)
        const skillKeys = ['ai-ml', 'cybersecurity', 'webdev', 'datascience', 'english', 'ibm-camp'];
        skillKeys.forEach(k => {
            totalScore += 5;
            if (appData.skills[k]) score += 5;
        });

        // Milestones (Each worth 10 points)
        const milestoneKeys = ['cm-cf', 'research-paper', 'gym', 'acquaintances', 'hackathons'];
        milestoneKeys.forEach(k => {
            totalScore += 10;
            if (appData.milestones[k]) score += 10;
        });

        // Metrics (Normalized to 10 points each)
        // Leetcode: 400
        totalScore += 10;
        score += Math.min((appData.metrics.leetcode || 0) / 400, 1) * 10;

        // Books: 50
        totalScore += 10;
        score += Math.min((appData.metrics.books || 0) / 50, 1) * 10;

        // Movies: 200
        totalScore += 10;
        score += Math.min((appData.metrics.movies || 0) / 200, 1) * 10;

        // Animes: 12
        totalScore += 10;
        score += Math.min((appData.metrics.animes || 0) / 12, 1) * 10;

        // Shows: 20
        totalScore += 10;
        score += Math.min((appData.metrics.shows || 0) / 20, 1) * 10;

        // CGPA: 4.0 (Stored as 0-400 slider val mostly)
        totalScore += 10;
        score += Math.min((appData.metrics.cgpa || 0) / 400, 1) * 10;

        const percent = Math.round((score / totalScore) * 100);

        // Safety check for NaN
        if (isNaN(percent)) ui.totalProgress.innerText = "0%";
        else ui.totalProgress.innerText = percent + "%";
    }

    function updateUI() {
        ui.streakCount.innerText = appData.protocol.currentStreak;
        calculateProgress();
    }

    // Run
    init();
});
