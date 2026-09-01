class ClockApp {
    constructor() {
        this.initializeVariables();
        this.initializeElements();
        this.initializeEventListeners();
        this.loadFromLocalStorage();
        this.startClockUpdate();
    }

    initializeVariables() {
        this.activeTab = 'worldclock';
        this.alarms = [];
        this.selectedDays = [];
        this.customSounds = [];
        this.worldClocks = [];
        this.stopwatchRunning = false;
        this.stopwatchTime = 0;
        this.stopwatchInterval = null;
        this.lapTimes = [];
        this.timerRunning = false;
        this.timerTime = 0;
        this.timerInterval = null;
    }

    initializeElements() {
        // タブ関連
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // 世界時計関連
        this.citySearch = document.getElementById('citySearch');
        this.cityModal = document.getElementById('cityModal');
        this.cityModalSearch = document.getElementById('cityModalSearch');
        this.cityModalList = document.getElementById('cityModalList');
        this.worldClockList = document.getElementById('worldClockList');

        // アラーム関連
        this.alarmModal = document.getElementById('alarmModal');
        this.alarmList = document.getElementById('alarmList');
        this.alarmTime = document.getElementById('alarmTime');
        this.alarmSound = document.getElementById('alarmSound');
        this.customSoundInput = document.getElementById('customSound');
        this.dayButtons = document.querySelectorAll('.day-buttons button');
        this.alarmAudio = document.getElementById('alarmAudio');

        // ストップウォッチ関連
        this.stopwatchDisplay = document.querySelector('#stopwatch .time');
        this.stopwatchLapList = document.querySelector('#stopwatch .lap-times');
        this.stopwatchStartButton = document.querySelector('#stopwatch .start-button');
        this.stopwatchLapButton = document.querySelector('#stopwatch .lap-button');
        this.stopwatchResetButton = document.querySelector('#stopwatch .reset-button');

        // タイマー関連
        this.timerInputs = {
            hours: document.querySelector('#timer .hours'),
            minutes: document.querySelector('#timer .minutes'),
            seconds: document.querySelector('#timer .seconds')
        };
        this.timerDisplay = document.querySelector('.timer-remaining');
        this.timerStartButton = document.querySelector('#timer .start-button');
        this.timerPauseButton = document.querySelector('#timer .pause-button');
        this.timerCancelButton = document.querySelector('#timer .cancel-button');
    }

    initializeEventListeners() {
        // タブ切り替え
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // 世界時計
        document.getElementById('addCityButton').addEventListener('click', () => this.showCityModal());
        this.citySearch.addEventListener('input', (e) => this.filterCities(e.target.value));
        this.cityModalSearch.addEventListener('input', (e) => this.filterCities(e.target.value, true));
        document.querySelector('#cityModal .cancel-button').addEventListener('click', () => this.hideCityModal());

        // アラーム
        document.getElementById('addAlarmButton').addEventListener('click', () => this.showAlarmModal());
        this.customSoundInput.addEventListener('change', (e) => this.handleCustomSoundUpload(e));
        this.dayButtons.forEach(button => {
            button.addEventListener('click', () => this.toggleDay(button));
        });
        document.querySelector('#alarmModal .save-button').addEventListener('click', () => this.saveAlarm());
        document.querySelector('#alarmModal .cancel-button').addEventListener('click', () => this.hideAlarmModal());

        // ストップウォッチ
        this.stopwatchStartButton.addEventListener('click', () => this.toggleStopwatch());
        this.stopwatchLapButton.addEventListener('click', () => this.recordLap());
        this.stopwatchResetButton.addEventListener('click', () => this.resetStopwatch());

        // タイマー
        this.timerStartButton.addEventListener('click', () => this.startTimer());
        this.timerPauseButton.addEventListener('click', () => this.pauseTimer());
        this.timerCancelButton.addEventListener('click', () => this.cancelTimer());
        Object.values(this.timerInputs).forEach(input => {
            input.addEventListener('input', () => this.validateTimerInput(input));
        });
    }

    // タブ切り替え
    switchTab(tabName) {
        this.activeTab = tabName;
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    // 世界時計機能
    showCityModal() {
        this.cityModal.style.display = 'block';
        this.updateCityList();
    }

    hideCityModal() {
        this.cityModal.style.display = 'none';
    }

    filterCities(query, isModal = false) {
        const filteredCities = worldCities.filter(city => {
            const searchStr = `${city.city} ${city.country}`.toLowerCase();
            return searchStr.includes(query.toLowerCase());
        });

        if (isModal) {
            this.updateCityModalList(filteredCities);
        } else {
            this.updateCityList(filteredCities);
        }
    }

    updateCityList(cities = worldCities) {
        const list = cities.map(city => `
            <div class="world-clock-item">
                <div class="city-info">
                    <span class="city-name">${city.city}</span>
                    <span class="time-difference">${city.country}</span>
                </div>
                <div class="city-time">${this.getTimeInTimezone(city.timezone)}</div>
            </div>
        `).join('');

        if (this.cityModalList.style.display === 'block') {
            this.cityModalList.innerHTML = list;
        } else {
            this.worldClockList.innerHTML = list;
        }
    }

    getTimeInTimezone(timezone) {
        return new Date().toLocaleTimeString('ja-JP', {
            timeZone: timezone,
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // アラーム機能
    showAlarmModal() {
        this.alarmModal.style.display = 'block';
        this.selectedDays = [];
        this.dayButtons.forEach(button => button.classList.remove('active'));
        this.alarmTime.value = '';
    }

    hideAlarmModal() {
        this.alarmModal.style.display = 'none';
    }

    toggleDay(button) {
        const day = parseInt(button.dataset.day);
        button.classList.toggle('active');
        
        if (button.classList.contains('active')) {
            this.selectedDays.push(day);
        } else {
            this.selectedDays = this.selectedDays.filter(d => d !== day);
        }
        this.selectedDays.sort((a, b) => a - b);
    }

    handleCustomSoundUpload(event) {
        const files = Array.from(event.target.files);
        files.forEach(file => {
            if (file.type.startsWith('audio/')) {
                const soundName = file.name.replace(/\.[^/.]+$/, "");
                this.customSounds.push({
                    name: soundName,
                    file: file
                });
                
                const option = document.createElement('option');
                option.value = this.customSounds.length - 1;
                option.textContent = soundName;
                this.alarmSound.appendChild(option);
            }
        });
        this.saveToLocalStorage();
    }

    saveAlarm() {
        const time = this.alarmTime.value;
        if (!time) return;

        const alarm = {
            id: Date.now(),
            time: time,
            days: this.selectedDays,
            soundIndex: this.alarmSound.value,
            enabled: true,
            snooze: document.getElementById('snoozeEnabled').checked
        };

        this.alarms.push(alarm);
        this.updateAlarmList();
        this.hideAlarmModal();
        this.saveToLocalStorage();
    }

    updateAlarmList() {
        const list = this.alarms.map(alarm => `
            <div class="alarm-item" data-id="${alarm.id}">
                <div class="alarm-info">
                    <div class="alarm-time">${alarm.time}</div>
                    <div class="alarm-details">
                        ${this.getAlarmDaysText(alarm.days)}
                        ${alarm.snooze ? '・スヌーズ' : ''}
                    </div>
                </div>
                <div class="alarm-toggle ${alarm.enabled ? 'active' : ''}"
                     onclick="clockApp.toggleAlarm(${alarm.id})"></div>
            </div>
        `).join('');

        this.alarmList.innerHTML = list;
    }

    getAlarmDaysText(days) {
        if (days.length === 0) return '一度のみ';
        if (days.length === 7) return '毎日';
        
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        return days.map(d => dayNames[d]).join(' ');
    }

    toggleAlarm(id) {
        const alarm = this.alarms.find(a => a.id === id);
        if (alarm) {
            alarm.enabled = !alarm.enabled;
            this.updateAlarmList();
            this.saveToLocalStorage();
        }
    }

    checkAlarms() {
        const now = new Date();
        const currentTime = now.toLocaleTimeString('ja-JP', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
        });
        const currentDay = now.getDay();

        this.alarms.forEach(alarm => {
            if (alarm.enabled && alarm.time === currentTime) {
                if (alarm.days.length === 0 || alarm.days.includes(currentDay)) {
                    this.triggerAlarm(alarm);
                }
            }
        });
    }

    triggerAlarm(alarm) {
        if (this.customSounds[alarm.soundIndex]) {
            const sound = this.customSounds[alarm.soundIndex];
            this.alarmAudio.src = URL.createObjectURL(sound.file);
        } else {
            this.alarmAudio.src = 'default-alarm.mp3';
        }

        this.alarmAudio.play();

        const notification = new Notification('アラーム', {
            body: `${alarm.time} のアラームです`,
            icon: '/icon.png'
        });

        if (alarm.snooze) {
            setTimeout(() => {
                this.alarmAudio.pause();
                const snoozeMinutes = 9;
                const snoozeTime = new Date(Date.now() + snoozeMinutes * 60000);
                this.createTemporaryAlarm(snoozeTime);
            }, 60000); // 1分後に自動スヌーズ
        }
    }

    createTemporaryAlarm(time) {
        const tempAlarm = {
            id: Date.now(),
            time: time.toLocaleTimeString('ja-JP', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit'
            }),
            days: [],
            soundIndex: 0,
            enabled: true,
            snooze: true
        };

        this.alarms.push(tempAlarm);
        this.updateAlarmList();
        this.saveToLocalStorage();
    }

    // ストップウォッチ機能
    toggleStopwatch() {
        if (this.stopwatchRunning) {
            clearInterval(this.stopwatchInterval);
            this.stopwatchStartButton.textContent = '開始';
        } else {
            const startTime = Date.now() - this.stopwatchTime;
            this.stopwatchInterval = setInterval(() => {
                this.stopwatchTime = Date.now() - startTime;
                this.updateStopwatchDisplay();
            }, 10);
            this.stopwatchStartButton.textContent = '停止';
        }
        this.stopwatchRunning = !this.stopwatchRunning;
    }

    recordLap() {
        if (!this.stopwatchRunning) return;
        
        this.lapTimes.push(this.stopwatchTime);
        this.updateLapList();
    }

    resetStopwatch() {
        clearInterval(this.stopwatchInterval);
        this.stopwatchRunning = false;
        this.stopwatchTime = 0;
        this.lapTimes = [];
        this.updateStopwatchDisplay();
        this.updateLapList();
        this.stopwatchStartButton.textContent = '開始';
    }

    updateStopwatchDisplay() {
        const time = this.formatTime(this.stopwatchTime);
        this.stopwatchDisplay.textContent = time;
    }

    updateLapList() {
        const laps = this.lapTimes.map((time, index) => `
            <div class="lap-time">
                <span>ラップ ${index + 1}</span>
                <span>${this.formatTime(time)}</span>
            </div>
        `).join('');
        
        this.stopwatchLapList.innerHTML = laps;
    }

    // タイマー機能
    startTimer() {
        if (this.timerRunning) return;

        const hours = parseInt(this.timerInputs.hours.value) || 0;
        const minutes = parseInt(this.timerInputs.minutes.value) || 0;
        const seconds = parseInt(this.timerInputs.seconds.value) || 0;

        this.timerTime = (hours * 3600 + minutes * 60 + seconds) * 1000;
        if (this.timerTime <= 0) return;

        const endTime = Date.now() + this.timerTime;
        this.timerInterval = setInterval(() => {
            const remaining = endTime - Date.now();
            if (remaining <= 0) {
                this.timerComplete();
            } else {
                this.timerTime = remaining;
                this.updateTimerDisplay();
            }
        }, 100);

        this.timerRunning = true;
        this.timerStartButton.style.display = 'none';
        this.timerPauseButton.style.display = 'inline-block';
    }

    pauseTimer() {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerStartButton.style.display = 'inline-block';
        this.timerPauseButton.style.display = 'none';
    }

    cancelTimer() {
        this.pauseTimer();
        this.timerTime = 0;
        this.updateTimerDisplay();
        Object.values(this.timerInputs).forEach(input => input.value = '0');
    }

    timerComplete() {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerTime = 0;
        this.updateTimerDisplay();
        this.playTimerCompleteSound();
        
        new Notification('タイマー', {
            body: 'タイマーが終了しました',
            icon: '/icon.png'
        });
    }

    playTimerCompleteSound() {
        const audio = new Audio('timer-complete.mp3');
        audio.play();
    }

    validateTimerInput(input) {
        let value = parseInt(input.value) || 0;
        const max = parseInt(input.max);
        if (value > max) value = max;
        if (value < 0) value = 0;
        input.value = value;
    }

    updateTimerDisplay() {
        const time = this.formatTime(this.timerTime);
        this.timerDisplay.textContent = time;
    }

    // ユーティリティ
    formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const centiseconds = Math.floor((ms % 1000) / 10);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
        }
    }

    saveToLocalStorage() {
        const data = {
            alarms: this.alarms,
            worldClocks: this.worldClocks,
            customSounds: this.customSounds.map(sound => ({
                name: sound.name,
                file: sound.file
            }))
        };
        localStorage.setItem('clockAppData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('clockAppData');
        if (data) {
            const parsed = JSON.parse(data);
            this.alarms = parsed.alarms || [];
            this.worldClocks = parsed.worldClocks || [];
            this.updateAlarmList();
            this.updateWorldClockList();
        }
    }

    startClockUpdate() {
        setInterval(() => {
            this.updateWorldClockList();
            this.checkAlarms();
        }, 1000);
    }
}

// アプリケーションの初期化
const clockApp = new ClockApp();

// 通知の許可を要求
if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}