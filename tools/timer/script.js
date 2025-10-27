class TimerApp {
    constructor() {
        this.initializeVariables();
        this.initializeElements();
        this.initializeEventListeners();
        this.loadFromLocalStorage();
        this.startBackgroundCheck();
    }

    initializeVariables() {
        // タイマー関連
        this.timers = new Map();
        this.customSounds = [];
        
        // ストップウォッチ関連
        this.stopwatchRunning = false;
        this.stopwatchStartTime = 0;
        this.stopwatchElapsed = 0;
        this.laps = [];
        this.lastLapTime = 0;
    }

    initializeElements() {
        // タブ関連
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabContents = document.querySelectorAll('.tab-content');

        // タイマー関連
        this.timerModal = document.getElementById('timerModal');
        this.timerInputs = {
            hours: document.querySelector('#timerModal .hours'),
            minutes: document.querySelector('#timerModal .minutes'),
            seconds: document.querySelector('#timerModal .seconds')
        };
        this.timerSound = document.getElementById('timerSound');
        this.customSoundInput = document.getElementById('customSound');
        this.activeTimers = document.getElementById('activeTimers');
        this.timerTemplate = document.getElementById('timerTemplate');
        this.timerAudio = document.getElementById('timerAudio');

        // ストップウォッチ関連
        this.stopwatchDisplay = document.querySelector('#stopwatch .time');
        this.lapList = document.querySelector('#stopwatch .lap-times');
        this.lapButton = document.querySelector('#stopwatch .lap-button');
        this.startButton = document.querySelector('#stopwatch .start-button');
        this.resetButton = document.querySelector('#stopwatch .reset-button');
    }

    initializeEventListeners() {
        // タブ切り替え
        this.tabButtons.forEach(button => {
            button.addEventListener('click', () => this.switchTab(button.dataset.tab));
        });

        // タイマー関連
        document.getElementById('addTimerButton').addEventListener('click', () => this.showTimerModal());
        this.customSoundInput.addEventListener('change', (e) => this.handleCustomSoundUpload(e));
        document.querySelector('#timerModal .save-button').addEventListener('click', () => this.createTimer());
        document.querySelector('#timerModal .cancel-button').addEventListener('click', () => this.hideTimerModal());

        // ストップウォッチ関連
        this.startButton.addEventListener('click', () => this.toggleStopwatch());
        this.lapButton.addEventListener('click', () => this.recordLap());
        this.resetButton.addEventListener('click', () => this.resetStopwatch());

        // タイマー入力の検証
        Object.values(this.timerInputs).forEach(input => {
            input.addEventListener('input', () => this.validateTimerInput(input));
        });

        // ページを閉じる前にステートを保存
        window.addEventListener('beforeunload', () => this.saveToLocalStorage());

        // ページがバックグラウンドになったときの処理
        document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    }

    // タブ切り替え
    switchTab(tabName) {
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });
    }

    // タイマー機能
    showTimerModal() {
        this.timerModal.style.display = 'block';
        Object.values(this.timerInputs).forEach(input => input.value = '0');
    }

    hideTimerModal() {
        this.timerModal.style.display = 'none';
    }

    validateTimerInput(input) {
        let value = parseInt(input.value) || 0;
        const max = parseInt(input.max);
        if (value > max) value = max;
        if (value < 0) value = 0;
        input.value = value;
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
                this.timerSound.appendChild(option);
            }
        });
    }

    createTimer() {
        const hours = parseInt(this.timerInputs.hours.value) || 0;
        const minutes = parseInt(this.timerInputs.minutes.value) || 0;
        const seconds = parseInt(this.timerInputs.seconds.value) || 0;
        
        const totalMilliseconds = (hours * 3600 + minutes * 60 + seconds) * 1000;
        if (totalMilliseconds <= 0) return;

        const timer = {
            id: Date.now(),
            duration: totalMilliseconds,
            remaining: totalMilliseconds,
            startTime: Date.now(),
            pausedAt: null,
            soundIndex: this.timerSound.value,
            element: this.createTimerElement()
        };

        this.timers.set(timer.id, timer);
        this.activeTimers.appendChild(timer.element);
        this.updateTimerDisplay(timer);
        this.hideTimerModal();
        this.saveToLocalStorage();
    }

    createTimerElement() {
        const template = this.timerTemplate.content.cloneNode(true);
        const element = template.querySelector('.timer-item');
        const pauseButton = element.querySelector('.pause-button');
        const cancelButton = element.querySelector('.cancel-button');

        pauseButton.addEventListener('click', () => this.toggleTimer(element.dataset.id));
        cancelButton.addEventListener('click', () => this.removeTimer(element.dataset.id));

        return element;
    }

    updateTimerDisplay(timer) {
        const element = timer.element;
        const timeDisplay = element.querySelector('.timer-time');
        const progress = element.querySelector('.progress');
        
        const hours = Math.floor(timer.remaining / 3600000);
        const minutes = Math.floor((timer.remaining % 3600000) / 60000);
        const seconds = Math.floor((timer.remaining % 60000) / 1000);
        
        timeDisplay.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progressPercent = ((timer.duration - timer.remaining) / timer.duration) * 100;
        progress.style.width = `${progressPercent}%`;
    }

    toggleTimer(id) {
        const timer = this.timers.get(parseInt(id));
        if (!timer) return;

        if (timer.pausedAt) {
            // 再開
            timer.startTime = Date.now() - (timer.duration - timer.remaining);
            timer.pausedAt = null;
            timer.element.querySelector('.pause-button .material-icons').textContent = 'pause';
        } else {
            // 一時停止
            timer.pausedAt = Date.now();
            timer.element.querySelector('.pause-button .material-icons').textContent = 'play_arrow';
        }

        this.saveToLocalStorage();
    }

    removeTimer(id) {
        const timer = this.timers.get(parseInt(id));
        if (!timer) return;

        timer.element.remove();
        this.timers.delete(parseInt(id));
        this.saveToLocalStorage();
    }

    updateTimers() {
        this.timers.forEach(timer => {
            if (!timer.pausedAt) {
                const now = Date.now();
                timer.remaining = timer.duration - (now - timer.startTime);

                if (timer.remaining <= 0) {
                    this.timerComplete(timer);
                } else {
                    this.updateTimerDisplay(timer);
                }
            }
        });
    }

    timerComplete(timer) {
        timer.remaining = 0;
        this.updateTimerDisplay(timer);
        this.playTimerSound(timer.soundIndex);
        this.showNotification('タイマー終了', '設定した時間が経過しました');
        this.removeTimer(timer.id);
    }

    playTimerSound(soundIndex) {
        if (this.customSounds[soundIndex]) {
            const sound = this.customSounds[soundIndex];
            this.timerAudio.src = URL.createObjectURL(sound.file);
        } else {
            this.timerAudio.src = 'default-alarm.mp3';
        }
        this.timerAudio.play();
    }

    // ストップウォッチ機能
    toggleStopwatch() {
        if (this.stopwatchRunning) {
            // 停止
            this.stopwatchElapsed += Date.now() - this.stopwatchStartTime;
            this.stopwatchRunning = false;
            this.startButton.querySelector('.material-icons').textContent = 'play_arrow';
            this.startButton.textContent = '開始';
        } else {
            // 開始
            this.stopwatchStartTime = Date.now();
            this.stopwatchRunning = true;
            this.startButton.querySelector('.material-icons').textContent = 'pause';
            this.startButton.textContent = '停止';
        }

        this.lapButton.disabled = !this.stopwatchRunning;
        this.resetButton.disabled = this.stopwatchRunning;
        this.saveToLocalStorage();
    }

    recordLap() {
        const currentTime = this.stopwatchRunning ? 
            this.stopwatchElapsed + (Date.now() - this.stopwatchStartTime) : 
            this.stopwatchElapsed;
        
        const lapTime = currentTime - this.lastLapTime;
        this.laps.push({
            number: this.laps.length + 1,
            lapTime: lapTime,
            totalTime: currentTime
        });

        this.lastLapTime = currentTime;
        this.updateLapList();
        this.saveToLocalStorage();
    }

    resetStopwatch() {
        this.stopwatchRunning = false;
        this.stopwatchStartTime = 0;
        this.stopwatchElapsed = 0;
        this.lastLapTime = 0;
        this.laps = [];
        this.updateStopwatchDisplay();
        this.updateLapList();
        this.startButton.querySelector('.material-icons').textContent = 'play_arrow';
        this.startButton.textContent = '開始';
        this.lapButton.disabled = true;
        this.resetButton.disabled = true;
        this.saveToLocalStorage();
    }

    updateStopwatchDisplay() {
        const currentTime = this.stopwatchRunning ? 
            this.stopwatchElapsed + (Date.now() - this.stopwatchStartTime) : 
            this.stopwatchElapsed;

        this.stopwatchDisplay.textContent = this.formatTime(currentTime);
    }

    updateLapList() {
        this.lapList.innerHTML = this.laps.map(lap => `
            <div class="lap-time">
                <span>ラップ ${lap.number}</span>
                <span>${this.formatTime(lap.lapTime)}</span>
                <span>${this.formatTime(lap.totalTime)}</span>
            </div>
        `).join('');
    }

    // ユーティリティ関数
    formatTime(ms) {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        const centiseconds = Math.floor((ms % 1000) / 10);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
        }
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    }

    showNotification(title, body) {
        if (Notification.permission === 'granted') {
            new Notification(title, { body });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification(title, { body });
                }
            });
        }
    }

    // ローカルストレージ関連
    saveToLocalStorage() {
        const data = {
            timers: Array.from(this.timers.entries()).map(([id, timer]) => ({
                id,
                duration: timer.duration,
                remaining: timer.remaining,
                startTime: timer.startTime,
                pausedAt: timer.pausedAt,
                soundIndex: timer.soundIndex
            })),
            stopwatch: {
                running: this.stopwatchRunning,
                elapsed: this.stopwatchElapsed,
                startTime: this.stopwatchStartTime,
                laps: this.laps,
                lastLapTime: this.lastLapTime
            },
            customSounds: this.customSounds.map(sound => ({
                name: sound.name,
                file: sound.file
            }))
        };
        
        localStorage.setItem('timerAppData', JSON.stringify(data));
    }

    loadFromLocalStorage() {
        const data = localStorage.getItem('timerAppData');
        if (data) {
            const parsed = JSON.parse(data);
            
            // タイマーの復元
            parsed.timers.forEach(timer => {
                const element = this.createTimerElement();
                this.timers.set(timer.id, {
                    ...timer,
                    element
                });
                this.activeTimers.appendChild(element);
                this.updateTimerDisplay(this.timers.get(timer.id));
            });

            // ストップウォッチの復元
            if (parsed.stopwatch) {
                this.stopwatchRunning = parsed.stopwatch.running;
                this.stopwatchElapsed = parsed.stopwatch.elapsed;
                this.stopwatchStartTime = parsed.stopwatch.startTime;
                this.laps = parsed.stopwatch.laps;
                this.lastLapTime = parsed.stopwatch.lastLapTime;
                this.updateStopwatchDisplay();
                this.updateLapList();
                
                if (this.stopwatchRunning) {
                    this.startButton.querySelector('.material-icons').textContent = 'pause';
                    this.startButton.textContent = '停止';
                }
                this.lapButton.disabled = !this.stopwatchRunning;
                this.resetButton.disabled = this.stopwatchRunning;
            }

            // カスタムサウンドの復元
            if (parsed.customSounds) {
                this.customSounds = parsed.customSounds;
                this.customSounds.forEach((sound, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = sound.name;
                    this.timerSound.appendChild(option);
                });
            }
        }
    }

    handleVisibilityChange() {
        if (document.hidden) {
            // バックグラウンドに移行したときの時刻を記録
            this.backgroundTime = Date.now();
        } else {
            // フォアグラウンドに戻ったときの処理
            const timeDiff = Date.now() - this.backgroundTime;
            
            // タイマーの更新
            this.timers.forEach(timer => {
                if (!timer.pausedAt) {
                    timer.startTime += timeDiff;
                }
            });

            // ストップウォッチの更新
            if (this.stopwatchRunning) {
                this.stopwatchStartTime += timeDiff;
            }
        }
    }

    startBackgroundCheck() {
        // タイマーとストップウォッチの表示を定期的に更新
        setInterval(() => {
            this.updateTimers();
            if (this.stopwatchRunning) {
                this.updateStopwatchDisplay();
            }
        }, 100);
    }
}

// アプリケーションの初期化
const timerApp = new TimerApp();

// 通知の許可を要求
if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}