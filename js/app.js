const app = {
    currentSemester: '',
    currentModule: '',
    currentExercise: '',
    currentPart: null,
    selectedWords: [],
    correctOrder: [],
    isCustomExercise: false,
    isInputExercise: false,
    unlockedWords: [],
    allWords: [],
    successTimeout: null,
    exercisesProgress: {},
    STORAGE_KEY: 'mirea_exercises_progress',
    splitExercises: {
        'Sem4.4.2': { parts: 4, hasAnswerFiles: true },
        'Sem4.6.3': { parts: 5, hasAnswerFiles: true },
        'Sem4.7.3': { parts: 4, hasAnswerFiles: true }
    },

    loadProgress() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.exercisesProgress = JSON.parse(saved);
                console.log('Прогресс загружен:', this.exercisesProgress);
            }
        } catch (e) {
            console.error('Ошибка загрузки прогресса:', e);
        }
    },

    saveCurrentProgress() {
        const progressKey = this.getCurrentProgressKey();
        if (progressKey) {
            this.exercisesProgress[progressKey] = {
                selectedWords: [...this.selectedWords],
                unlockedWords: [...this.unlockedWords],
                allWords: [...this.allWords],
                correctOrder: [...this.correctOrder],
                isCustomExercise: this.isCustomExercise,
                isInputExercise: this.isInputExercise,
                lastUpdated: new Date().toISOString()
            };
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.exercisesProgress));
                console.log(`Прогресс сохранен для ${progressKey}`);
            } catch (e) {
                console.error('Ошибка сохранения прогресса:', e);
            }
        }
    },

    getCurrentProgressKey() {
        if (this.currentSemester && this.currentModule && this.currentExercise) {
            if (this.currentPart !== null) {
                return `${this.currentSemester}_${this.currentModule}_${this.currentExercise}_part${this.currentPart}`;
            }
            return `${this.currentSemester}_${this.currentModule}_${this.currentExercise}`;
        }
        return null;
    },

    loadCurrentProgress() {
        const progressKey = this.getCurrentProgressKey();
        if (progressKey && this.exercisesProgress[progressKey]) {
            const saved = this.exercisesProgress[progressKey];
            this.selectedWords = [...saved.selectedWords];
            this.unlockedWords = [...saved.unlockedWords];
            this.allWords = [...saved.allWords];
            this.correctOrder = [...saved.correctOrder];
            this.isCustomExercise = saved.isCustomExercise;
            this.isInputExercise = saved.isInputExercise;
            console.log(`Прогресс загружен для ${progressKey}`);
            return true;
        }
        return false;
    },

    clearCurrentProgress() {
        const progressKey = this.getCurrentProgressKey();
        if (progressKey && this.exercisesProgress[progressKey]) {
            delete this.exercisesProgress[progressKey];
            try {
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.exercisesProgress));
                console.log(`Прогресс очищен для ${progressKey}`);
            } catch (e) {
                console.error('Ошибка очистки прогресса:', e);
            }
        }
    },

    getTotalModules(semester) {
        return semester === 'Sem3' ? 7 : 7;
    },

    getModuleExerciseCount(semester, module, part = null) {
        const exerciseKey = `${semester}.${module}.${part || this.currentExercise}`;
        if (part !== null && this.splitExercises[`${semester}.${module}.${this.currentExercise}`]) {
            return this.splitExercises[`${semester}.${module}.${this.currentExercise}`].parts;
        }
        const counts = {
            'Sem3': {1:10, 2:9, 3:8, 4:6, 5:8, 6:9, 7:7},
            'Sem4': {1:10, 2:8, 3:8, 4:5, 5:7, 6:5, 7:5}
        };
        return counts[semester][module] || 5;
    },

    getNextExercisePosition() {
        let nextModule = this.currentModule;
        let nextExercise = this.currentExercise;
        let nextPart = this.currentPart;

        if (this.currentPart !== null) {
            const splitConfig = this.splitExercises[`${this.currentSemester}.${this.currentModule}.${this.currentExercise}`];
            if (splitConfig && this.currentPart < splitConfig.parts) {
                nextPart = this.currentPart + 1;
            } else {
                nextPart = null;
                nextExercise = this.currentExercise + 1;
            }
        } else {
            nextExercise = this.currentExercise + 1;
        }

        const moduleExerciseCount = this.getModuleExerciseCount(this.currentSemester, this.currentModule);
        if (nextExercise > moduleExerciseCount) {
            if (this.currentModule < this.getTotalModules(this.currentSemester)) {
                nextModule = this.currentModule + 1;
                nextExercise = 1;
                nextPart = null;
            } else {
                return null;
            }
        }

        const nextExerciseKey = `${this.currentSemester}.${nextModule}.${nextExercise}`;
        if (this.splitExercises[nextExerciseKey] && nextPart === null) {
            nextPart = 1;
        }

        return { module: nextModule, exercise: nextExercise, part: nextPart };
    },

    getPrevExercisePosition() {
        let prevModule = this.currentModule;
        let prevExercise = this.currentExercise;
        let prevPart = this.currentPart;

        if (this.currentPart !== null) {
            if (this.currentPart > 1) {
                prevPart = this.currentPart - 1;
            } else {
                prevPart = null;
                prevExercise = this.currentExercise - 1;
            }
        } else {
            prevExercise = this.currentExercise - 1;
        }

        if (prevExercise < 1) {
            if (this.currentModule > 1) {
                prevModule = this.currentModule - 1;
                const prevModuleExerciseCount = this.getModuleExerciseCount(this.currentSemester, prevModule);
                prevExercise = prevModuleExerciseCount;
                prevPart = null;
                const prevExerciseKey = `${this.currentSemester}.${prevModule}.${prevExercise}`;
                if (this.splitExercises[prevExerciseKey]) {
                    prevPart = this.splitExercises[prevExerciseKey].parts;
                }
            } else {
                return null;
            }
        } else {
            const prevExerciseKey = `${this.currentSemester}.${prevModule}.${prevExercise}`;
            if (this.splitExercises[prevExerciseKey] && prevPart === null) {
                prevPart = this.splitExercises[prevExerciseKey].parts;
            }
        }

        return { module: prevModule, exercise: prevExercise, part: prevPart };
    },

    navigateToNextExercise() {
        this.saveCurrentProgress();
        const nextPos = this.getNextExercisePosition();
        if (nextPos) {
            this.currentModule = nextPos.module;
            this.currentExercise = nextPos.exercise;
            this.currentPart = nextPos.part;
            document.getElementById('module-title').textContent = `${this.currentSemester}, Модуль ${this.currentModule}`;
            this.showExercise(this.currentExercise, this.currentPart);
        } else {
            alert('Это последнее упражнение в семестре');
        }
    },

    navigateToPrevExercise() {
        this.saveCurrentProgress();
        const prevPos = this.getPrevExercisePosition();
        if (prevPos) {
            this.currentModule = prevPos.module;
            this.currentExercise = prevPos.exercise;
            this.currentPart = prevPos.part;
            document.getElementById('module-title').textContent = `${this.currentSemester}, Модуль ${this.currentModule}`;
            this.showExercise(this.currentExercise, this.currentPart);
        } else {
            alert('Это первое упражнение в семестре');
        }
    },

    updateNavigationButtons() {
        const prevBtn = document.getElementById('prev-exercise-btn');
        const nextBtn = document.getElementById('next-exercise-btn');
        const prevPos = this.getPrevExercisePosition();
        
        if (prevPos === null || (this.currentModule === 1 && this.currentExercise === 1 && (this.currentPart === null || this.currentPart === 1))) {
            prevBtn.classList.add('btn-disabled');
            prevBtn.classList.remove('btn-nav');
            prevBtn.onclick = null;
        } else {
            prevBtn.classList.remove('btn-disabled');
            prevBtn.classList.add('btn-nav');
            prevBtn.onclick = () => this.navigateToPrevExercise();
        }

        const nextPos = this.getNextExercisePosition();
        if (nextPos === null) {
            nextBtn.classList.add('btn-disabled');
            nextBtn.classList.remove('btn-nav');
            nextBtn.onclick = null;
        } else {
            nextBtn.classList.remove('btn-disabled');
            nextBtn.classList.add('btn-nav');
            nextBtn.onclick = () => this.navigateToNextExercise();
        }
    },

    showSemester(semester) {
        this.currentSemester = semester;
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('module-menu').style.display = 'block';
        document.getElementById('semester-title').textContent = `${semester} - Изучение французского`;

        const modulesContainer = document.getElementById('module-buttons');
        modulesContainer.innerHTML = '';

        for (let i = 1; i <= 7; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = `📖 Модуль ${i}`;
            btn.onclick = () => this.showModule(i);
            modulesContainer.appendChild(btn);
        }
    },

    downloadTextbook(semester) {
        let downloadUrl = '';
        let filename = '';
        if (semester === 'Sem3') {
            downloadUrl = 'https://drive.google.com/uc?export=download&id=12ZDqmlCRrnvWat8DxKRHnIX5uE0PSEJy';
            filename = 'Учебник 3 семестра';
        } else if (semester === 'Sem4') {
            downloadUrl = 'https://drive.google.com/uc?export=download&id=1_m_shU3sSy74_pUYUtxuozCRD4icsu9T';
            filename = 'Учебник 4 семестра';
        }
        console.log(`Downloading textbook: ${filename}`);
        window.open(downloadUrl, '_blank');
    },

    showModule(module) {
        this.currentModule = module;
        document.getElementById('module-menu').style.display = 'none';
        document.getElementById('exercise-menu').style.display = 'block';
        document.getElementById('module-title').textContent = `${this.currentSemester}, Модуль ${module}`;

        const exercisesContainer = document.getElementById('exercise-buttons');
        exercisesContainer.innerHTML = '';

        const exerciseCount = this.getModuleExerciseCount(this.currentSemester, module);

        for (let i = 1; i <= exerciseCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            const exerciseKey = `${this.currentSemester}.${module}.${i}`;
            if (this.splitExercises[exerciseKey]) {
                btn.textContent = `✏️ Упражнение ${i} (часть 1/${this.splitExercises[exerciseKey].parts})`;
                btn.onclick = () => this.showExercise(i, 1);
            } else {
                btn.textContent = `✏️ Упражнение ${i}`;
                btn.onclick = () => this.showExercise(i);
            }
            exercisesContainer.appendChild(btn);
        }
    },

    clearSuccessMessage() {
        if (this.successTimeout) {
            clearTimeout(this.successTimeout);
            this.successTimeout = null;
        }
        const existingMessages = document.querySelectorAll('.success-message');
        existingMessages.forEach(msg => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        });
    },

    async showExercise(exercise, part = null) {
        this.clearSuccessMessage();
        this.currentExercise = exercise;
        this.currentPart = part;

        document.getElementById('exercise-menu').style.display = 'none';
        document.getElementById('exercise-content').style.display = 'block';

        let titleText = `${this.currentSemester}, Модуль ${this.currentModule}, Упражнение ${exercise}`;
        if (part !== null) titleText += ` (часть ${part})`;
        document.getElementById('exercise-title').textContent = titleText;

        const partIndicator = document.getElementById('part-indicator');
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${exercise}`;
        if (this.splitExercises[exerciseKey] && part !== null) {
            partIndicator.textContent = `Часть ${part} из ${this.splitExercises[exerciseKey].parts}`;
            partIndicator.style.display = 'block';
        } else {
            partIndicator.style.display = 'none';
        }

        document.getElementById('exercise-description').innerHTML = '<div class="loading">Загрузка упражнения...</div>';
        document.getElementById('answer-section').style.display = 'none';
        document.getElementById('input-section').style.display = 'none';
        document.getElementById('unlocked-words-section').style.display = 'none';

        const hasProgress = this.loadCurrentProgress();

        if (!hasProgress) {
            this.selectedWords = [];
            this.unlockedWords = [];
            this.allWords = [];
        }

        await this.loadExerciseDescription(hasProgress);
        this.updateNavigationButtons();
    },

    makeLinksClickable(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, function(url) {
            return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #007bff; text-decoration: underline; word-break: break-all;">${url}</a>`;
        });
    },

    getExerciseFileName() {
        if (this.currentPart !== null) {
            return `${this.currentModule}.${this.currentExercise}${this.currentPart}`;
        }
        return `${this.currentModule}.${this.currentExercise}`;
    },

    async loadExerciseDescription(hasProgress = false) {
        try {
            const fileName = this.getExerciseFileName();
            
            // Добавляем обработку CORS и проверку существования файлов
            const apiUrl = `https://mireafrancaisbot.ru/api/exercise/${this.currentSemester}/${fileName}.txt`;
            
            console.log('Загрузка упражнения:', apiUrl); // Для отладки
            
            // Пробуем загрузить с режимом CORS
            const response = await fetch(apiUrl, {
                mode: 'cors',
                headers: {
                    'Accept': 'text/plain',
                    'Origin': window.location.origin
                }
            });
    
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }
    
            let description = await response.text();
            description = this.makeLinksClickable(description);
    
            document.getElementById('exercise-description').innerHTML =
                `<div class="exercise-container">${description.replace(/\n/g, '<br>')}</div>`;
    
            // Аналогично для файла с ответами
            try {
                const answerResponse = await fetch(`https://mireafrancaisbot.ru/api/exercise/${this.currentSemester}/${fileName}A.txt`, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'text/plain',
                        'Origin': window.location.origin
                    }
                });
                
                if (answerResponse.ok) {
                    let answers = await answerResponse.text();
                    this.correctOrder = answers.split(',').map(word => word.trim()).filter(word => word.length > 0);
    
                    if (!hasProgress) {
                        const wordsForDisplay = this.getUniqueWordsForDisplay(this.correctOrder);
                        this.allWords = [...wordsForDisplay];
                    }
    
                    if (this.correctOrder.length > 0) {
                        this.isCustomExercise = this.checkIfCustomExercise();
                        this.isInputExercise = this.checkIfInputExercise();
    
                        if (this.isInputExercise) {
                            this.setupInputExercise(hasProgress);
                        } else if (this.isCustomExercise) {
                            this.setupCustomButtons();
                            document.getElementById('answer-section').style.display = 'block';
                        } else {
                            this.setupWordButtons(hasProgress);
                            document.getElementById('answer-section').style.display = 'block';
                        }
                    }
                }
            } catch (answerError) {
                console.log('Файл с ответами не найден или CORS ошибка:', answerError);
                // Показываем сообщение пользователю
                document.getElementById('exercise-description').innerHTML += 
                    `<div class="info-message">ℹ️ Это упражнение без автоматической проверки</div>`;
            }
        } catch (error) {
            console.error('Ошибка загрузки упражнения:', error);
            document.getElementById('exercise-description').innerHTML =
                `<div class="error">⚠️ Ошибка загрузки упражнения. Проверьте подключение к интернету.<br>${error.message}</div>`;
        }
    }

    checkIfCustomExercise() {
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        if (this.currentPart !== null) return false;

        const customExercisesSem3 = {
            'Sem3.1.5': true, 'Sem3.3.5': true, 'Sem3.4.4': true, 'Sem3.5.2': true,
            'Sem3.5.4': true, 'Sem3.6.5': true, 'Sem3.7.4': true, 'Sem3.3.6': true,
            'Sem3.2.5': true, 'Sem3.3.4': true, 'Sem3.6.4': true, 'Sem3.6.6': true,
            'Sem3.1.7': true, 'Sem3.2.2': true, 'Sem3.4.3': true, 'Sem3.7.3': true
        };

        const customExercisesSem4 = {
            'Sem4.1.3': true, 'Sem4.1.7': true, 'Sem4.5.3': true
        };

        return customExercisesSem3[exerciseKey] || customExercisesSem4[exerciseKey];
    },

    checkIfInputExercise() {
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        if (this.currentPart !== null) return false;

        const inputExercisesSem3 = {
            'Sem3.1.9': true, 'Sem3.2.8': true, 'Sem3.3.7': true, 'Sem3.4.5': true,
            'Sem3.5.7': true, 'Sem3.6.8': true, 'Sem3.7.6': true
        };

        const inputExercisesSem4 = {
            'Sem4.2.5': true, 'Sem4.3.6': true, 'Sem4.4.4': true, 'Sem4.5.2': true,
            'Sem4.5.5': true, 'Sem4.6.4': true, 'Sem4.7.4': true
        };

        return inputExercisesSem3[exerciseKey] || inputExercisesSem4[exerciseKey];
    },

    setupInputExercise(hasProgress = false) {
        document.getElementById('input-section').style.display = 'block';
        document.getElementById('unlocked-words-section').style.display = 'block';
        document.getElementById('answer-section').style.display = 'block';

        if (!hasProgress) {
            document.getElementById('word-input').value = '';
            document.getElementById('unlocked-words').innerHTML = '';
            document.getElementById('selected-words').textContent = 'Выберите слова в правильном порядке...';
            this.updateProgressCounter();
            this.updateUnlockedWords();
            this.updateWordButtons();
        } else {
            document.getElementById('selected-words').textContent = this.selectedWords.join(' ');
            this.updateUnlockedWords();
            this.updateWordButtons();
            this.updateProgressCounter();
        }

        if (this.currentSemester === 'Sem3') {
            document.getElementById('word-input').placeholder = 'Введите слово...';
        } else if (this.currentSemester === 'Sem4') {
            document.getElementById('word-input').placeholder = 'Entrez le mot...';
        }
    },

    updateProgressCounter() {
        const uniqueWords = [...new Set(this.allWords)];
        const counter = document.getElementById('progress-counter');
        counter.textContent = `Разблокировано: ${this.unlockedWords.length} из ${uniqueWords.length} слов`;
    },

    showSuccessMessage(message) {
        const existingMessages = document.querySelectorAll('.success-message, .info-message-small');
        existingMessages.forEach(msg => {
            if (msg.parentNode) msg.parentNode.removeChild(msg);
        });

        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = message;

        const inputSection = document.getElementById('input-section');
        inputSection.appendChild(successMessage);

        setTimeout(() => {
            if (successMessage.parentNode) successMessage.parentNode.removeChild(successMessage);
        }, 3000);
    },

    showInfoMessage(message) {
        const infoMessage = document.createElement('div');
        infoMessage.className = 'info-message-small';
        infoMessage.innerHTML = message;

        const inputSection = document.getElementById('input-section');
        inputSection.appendChild(infoMessage);

        setTimeout(() => {
            if (infoMessage.parentNode) infoMessage.parentNode.removeChild(infoMessage);
        }, 3000);
    },

    normalizeWordForMatching(word) {
        let normalized = word.toLowerCase()
            .replace(/\s/g, '')
            .replace(/-/g, '')
            .replace(/'/g, '');
        const letters = normalized.split('');
        const sortedLetters = letters.sort().join('');
        return sortedLetters;
    },

    checkWordInput() {
        const input = document.getElementById('word-input');
        let word = input.value.trim().toLowerCase();

        if (!word) {
            this.showInfoMessage('⚠️ Пожалуйста, введите слово');
            return;
        }

        const normalizedInput = this.normalizeWordForMatching(word);
        let matchedWord = null;

        for (let i = 0; i < this.allWords.length; i++) {
            const candidate = this.allWords[i].toLowerCase();
            const normalizedCandidate = this.normalizeWordForMatching(candidate);
            if (normalizedInput === normalizedCandidate) {
                matchedWord = this.allWords[i];
                break;
            }
        }

        if (!matchedWord) {
            for (let i = 0; i < this.allWords.length; i++) {
                const candidate = this.allWords[i].toLowerCase();
                const candidateWithoutSpaces = candidate.replace(/\s/g, '');
                const inputWithoutSpaces = word.replace(/\s/g, '');
                const candidateSorted = candidateWithoutSpaces.split('').sort().join('');
                const inputSorted = inputWithoutSpaces.split('').sort().join('');
                if (candidateSorted === inputSorted) {
                    matchedWord = this.allWords[i];
                    break;
                }
            }
        }

        if (matchedWord && !this.unlockedWords.includes(matchedWord)) {
            this.unlockedWords.push(matchedWord);
            this.updateUnlockedWords();
            this.updateWordButtons();
            this.updateProgressCounter();
            this.showSuccessMessage(`✅ Слово "<strong>${matchedWord}</strong>" разблокировано!`);
            this.saveCurrentProgress();

            const uniqueWords = [...new Set(this.allWords)];
            if (this.unlockedWords.length === uniqueWords.length) {
                setTimeout(() => {
                    this.showSuccessMessage('🎉 <strong>Поздравляем!</strong> Вы разблокировали все слова! Теперь составьте правильную последовательность.');
                }, 2000);
            }
        } else if (matchedWord && this.unlockedWords.includes(matchedWord)) {
            this.showInfoMessage('ℹ️ Это слово уже разблокировано');
        } else {
            this.showInfoMessage('❌ Слово не найдено. Попробуйте еще раз.');
        }

        input.value = '';
        input.focus();
    },

    updateUnlockedWords() {
        const unlockedContainer = document.getElementById('unlocked-words');
        unlockedContainer.innerHTML = '';

        if (this.unlockedWords.length === 0) {
            unlockedContainer.innerHTML = '<p>Пока нет разблокированных слов</p>';
            return;
        }

        this.unlockedWords.forEach((word, index) => {
            const wordBadge = document.createElement('div');
            wordBadge.className = 'word-badge';
            wordBadge.textContent = word;
            const wordNumber = document.createElement('div');
            wordNumber.className = 'word-number';
            wordNumber.textContent = index + 1;
            wordBadge.appendChild(wordNumber);
            unlockedContainer.appendChild(wordBadge);
        });
    },

    updateWordButtons() {
        const wordsContainer = document.getElementById('word-buttons');
        wordsContainer.innerHTML = '';

        if (this.unlockedWords.length === 0) {
            wordsContainer.innerHTML = '<p>Сначала разблокируйте слова через ввод</p>';
            return;
        }

        const shuffledWords = [...this.unlockedWords].sort(() => Math.random() - 0.5);
        shuffledWords.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-btn word-btn-unlocked';
            btn.textContent = word;
            btn.onclick = () => this.selectWord(word);
            wordsContainer.appendChild(btn);
        });
    },

    getUniqueWordsForDisplay(words) {
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        const partNumber = this.currentPart;

        if (this.currentSemester === 'Sem4' && this.currentModule === 4 && this.currentExercise === 2 && this.currentPart === 2) {
            const uniqueWords = [];
            words.forEach(word => {
                if (!uniqueWords.includes(word)) uniqueWords.push(word);
            });
            return uniqueWords;
        }
        return words;
    },

    setupCustomButtons() {
        const wordsContainer = document.getElementById('word-buttons');
        wordsContainer.innerHTML = '';
        this.selectedWords = [];
        document.getElementById('selected-words').textContent = 'Выберите правильные ответы...';

        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        let buttons = [];

        switch(exerciseKey) {
            case 'Sem3.1.5':
            case 'Sem3.3.5':
            case 'Sem3.4.4':
            case 'Sem3.5.4':
            case 'Sem3.6.5':
            case 'Sem3.7.4':
                buttons = ['v', 'f'];
                break;
            case 'Sem3.5.2':
                buttons = ['O', 'M'];
                break;
            case 'Sem3.3.6':
                buttons = ['refroidir', 'connecter', 'l\'écran', 'l\'unité centrale', 'entrée', 'place', 'connecteur', 'composant'];
                break;
            case 'Sem3.1.7':
            case 'Sem3.2.2':
            case 'Sem3.2.5':
            case 'Sem3.4.3':
            case 'Sem3.7.3':
                buttons = ['a', 'b', 'c', 'd'];
                break;
            case 'Sem3.3.4':
            case 'Sem3.6.4':
            case 'Sem3.6.6':
                buttons = ['a', 'b', 'c'];
                break;
            case 'Sem4.1.3':
                buttons = ['v', 'f'];
                break;
            case 'Sem4.1.7':
                buttons = ['a', 'b', 'c'];
                break;
            case 'Sem4.5.3':
                buttons = ['v', 'f'];
                break;
            default:
                this.setupWordButtons();
                return;
        }

        buttons.forEach(buttonText => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            btn.textContent = buttonText;
            btn.onclick = () => this.selectWord(buttonText);
            wordsContainer.appendChild(btn);
        });
    },

    setupWordButtons(hasProgress = false) {
        const wordsContainer = document.getElementById('word-buttons');
        wordsContainer.innerHTML = '';

        if (!hasProgress) {
            this.selectedWords = [];
            document.getElementById('selected-words').textContent = 'Выберите слова в правильном порядке...';
        } else {
            document.getElementById('selected-words').textContent = this.selectedWords.join(' ');
        }

        const shuffledWords = [...this.allWords].sort(() => Math.random() - 0.5);
        shuffledWords.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            btn.textContent = word;
            btn.onclick = () => this.selectWord(word);
            wordsContainer.appendChild(btn);
        });
    },

    selectWord(word) {
        this.selectedWords.push(word);
        document.getElementById('selected-words').textContent = this.selectedWords.join(' ');
        this.saveCurrentProgress();
    },

    removeLastWord() {
        if (this.selectedWords.length > 0) {
            this.selectedWords.pop();
            document.getElementById('selected-words').textContent = this.selectedWords.join(' ');
            this.saveCurrentProgress();
        } else {
            this.showInfoMessage('ℹ️ Нет слов для удаления');
        }
    },

    checkAnswer() {
        const userAnswer = this.selectedWords.join(',');
        const correctAnswer = this.correctOrder.join(',');

        if (userAnswer === correctAnswer) {
            this.clearSuccessMessage();
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';

            if (this.currentSemester === 'Sem3') {
                successMessage.innerHTML = '🎉 <strong>Правильно!</strong> ✅<br>Вы успешно выполнили упражнение!';
            } else if (this.currentSemester === 'Sem4') {
                successMessage.innerHTML = '🎉 <strong>Correct!</strong> ✅<br>Vous avez réussi l\'exercice!';
            }

            alert('🎉 Правильно! ✅');
            this.clearCurrentProgress();

            const answerSection = document.getElementById('answer-section');
            const actionButtons = answerSection.querySelector('.action-buttons');
            answerSection.insertBefore(successMessage, actionButtons);

            this.successTimeout = setTimeout(() => {
                if (successMessage.parentNode) successMessage.parentNode.removeChild(successMessage);
                this.successTimeout = null;
            }, 10000);
        } else {
            if (this.currentSemester === 'Sem3') {
                alert('❌ Неправильно. Попробуйте еще раз.');
            } else if (this.currentSemester === 'Sem4') {
                alert('❌ Incorrect. Essayez encore.');
            }
        }
    },

    resetAnswer() {
        this.selectedWords = [];
        document.getElementById('selected-words').textContent = 'Выберите слова в правильном порядке...';

        if (this.isInputExercise) {
            this.updateWordButtons();
        } else if (this.isCustomExercise) {
            this.setupCustomButtons();
        } else {
            this.setupWordButtons();
        }
        this.saveCurrentProgress();
    },

    backToMain() {
        this.clearSuccessMessage();
        document.getElementById('module-menu').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
    },

    backToModules() {
        this.clearSuccessMessage();
        document.getElementById('exercise-menu').style.display = 'none';
        document.getElementById('module-menu').style.display = 'block';
    },

    backToExercises() {
        this.clearSuccessMessage();
        this.saveCurrentProgress();

        document.getElementById('exercise-content').style.display = 'none';
        document.getElementById('exercise-menu').style.display = 'block';

        const exercisesContainer = document.getElementById('exercise-buttons');
        exercisesContainer.innerHTML = '';

        const exerciseCount = this.getModuleExerciseCount(this.currentSemester, this.currentModule);

        for (let i = 1; i <= exerciseCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            const exerciseKey = `${this.currentSemester}.${this.currentModule}.${i}`;
            if (this.splitExercises[exerciseKey]) {
                btn.textContent = `✏️ Упражнение ${i} (часть 1/${this.splitExercises[exerciseKey].parts})`;
                btn.onclick = () => this.showExercise(i, 1);
            } else {
                btn.textContent = `✏️ Упражнение ${i}`;
                btn.onclick = () => this.showExercise(i);
            }
            exercisesContainer.appendChild(btn);
        }
    }
};

// Инициализация
app.loadProgress();

if (typeof Telegram !== 'undefined') {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}
