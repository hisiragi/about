class MP3Player {
    constructor() {
        this.audio = new Audio();
        this.playlist = [];
        this.currentIndex = 0;
        this.loopMode = 'none'; // none, single, all

        // DOM要素の取得
        this.elements = {
            fileInput: document.getElementById('fileInput'),
            uploadArea: document.getElementById('uploadArea'),
            playlistContainer: document.getElementById('playlist'),
            currentTitle: document.getElementById('currentTitle'),
            progress: document.getElementById('progress'),
            seekBar: document.getElementById('seekBar'),
            currentTime: document.getElementById('currentTime'),
            duration: document.getElementById('duration'),
            prevButton: document.getElementById('prevButton'),
            playButton: document.getElementById('playButton'),
            nextButton: document.getElementById('nextButton'),
            volumeControl: document.getElementById('volumeControl'),
            loopButton: document.getElementById('loopButton')
        };

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // ファイルアップロードの処理
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.elements.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadArea.style.borderColor = 'var(--primary-color)';
        });
        this.elements.uploadArea.addEventListener('dragleave', () => {
            this.elements.uploadArea.style.borderColor = 'var(--text-secondary)';
        });
        this.elements.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.elements.uploadArea.style.borderColor = 'var(--text-secondary)';
            const files = e.dataTransfer.files;
            this.handleFiles(Array.from(files));
        });

        // 再生コントロール
        this.elements.playButton.addEventListener('click', () => this.togglePlay());
        this.elements.prevButton.addEventListener('click', () => this.playPrevious());
        this.elements.nextButton.addEventListener('click', () => this.playNext());
        this.elements.volumeControl.addEventListener('input', (e) => this.setVolume(e.target.value));
        this.elements.loopButton.addEventListener('click', () => this.toggleLoop());
        this.elements.seekBar.addEventListener('input', (e) => this.seek(e.target.value));

        // オーディオイベント
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('ended', () => this.handleTrackEnd());
        this.audio.addEventListener('loadedmetadata', () => {
            this.elements.duration.textContent = this.formatTime(this.audio.duration);
            this.elements.seekBar.max = this.audio.duration;
        });
    }

    handleFileUpload(event) {
        const files = Array.from(event.target.files);
        this.handleFiles(files);
    }

    handleFiles(files) {
        const audioFiles = files.filter(file => file.type.startsWith('audio/'));
        if (audioFiles.length === 0) return;

        this.playlist.push(...audioFiles);
        this.updatePlaylistUI();

        if (this.playlist.length === files.length) {
            this.loadTrack(this.currentIndex);
        }
    }

    updatePlaylistUI() {
        this.elements.playlistContainer.innerHTML = '';
        this.playlist.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'playlist-item';
            if (index === this.currentIndex) {
                item.classList.add('active');
            }
            item.textContent = file.name;
            item.addEventListener('click', () => {
                this.currentIndex = index;
                this.loadTrack(index);
            });
            this.elements.playlistContainer.appendChild(item);
        });
    }

    loadTrack(index) {
        if (index < 0 || index >= this.playlist.length) return;

        const file = this.playlist[index];
        const url = URL.createObjectURL(file);
        this.audio.src = url;
        this.elements.currentTitle.textContent = file.name;
        this.updatePlaylistUI();
        this.audio.play();
        this.updatePlayButton();
    }

    togglePlay() {
        if (this.audio.paused) {
            this.audio.play();
        } else {
            this.audio.pause();
        }
        this.updatePlayButton();
    }

    updatePlayButton() {
        const icon = this.elements.playButton.querySelector('.material-icons');
        icon.textContent = this.audio.paused ? 'play_arrow' : 'pause';
    }

    playPrevious() {
        this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadTrack(this.currentIndex);
    }

    playNext() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.loadTrack(this.currentIndex);
    }

    setVolume(value) {
        this.audio.volume = value / 100;
        const icon = this.elements.volumeControl.previousElementSibling;
        if (value == 0) {
            icon.textContent = 'volume_off';
        } else if (value < 50) {
            icon.textContent = 'volume_down';
        } else {
            icon.textContent = 'volume_up';
        }
    }

    toggleLoop() {
        const states = ['none', 'single', 'all'];
        const currentIndex = states.indexOf(this.loopMode);
        this.loopMode = states[(currentIndex + 1) % states.length];

        const icon = this.elements.loopButton.querySelector('.material-icons');
        switch (this.loopMode) {
            case 'none':
                icon.textContent = 'repeat';
                this.elements.loopButton.classList.remove('loop-active');
                break;
            case 'single':
                icon.textContent = 'repeat_one';
                this.elements.loopButton.classList.add('loop-active');
                break;
            case 'all':
                icon.textContent = 'repeat';
                this.elements.loopButton.classList.add('loop-active');
                break;
        }
    }

    seek(value) {
        this.audio.currentTime = value;
    }

    updateProgress() {
        const progress = (this.audio.currentTime / this.audio.duration) * 100;
        this.elements.progress.style.width = `${progress}%`;
        this.elements.seekBar.value = this.audio.currentTime;
        this.elements.currentTime.textContent = this.formatTime(this.audio.currentTime);
    }

    handleTrackEnd() {
        switch (this.loopMode) {
            case 'none':
                if (this.currentIndex < this.playlist.length - 1) {
                    this.playNext();
                }
                break;
            case 'single':
                this.audio.play();
                break;
            case 'all':
                this.playNext();
                break;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
}

// プレイヤーのインスタンス化
const player = new MP3Player();