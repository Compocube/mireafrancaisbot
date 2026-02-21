// Основной класс приложения
class App {
    constructor() {
        this.currentSemester = '';
        this.currentModule = '';
        this.currentExercise = '';
        this.selectedWords = [];
        this.correctOrder = [];
        this.isCustomExercise = false;
        this.isInputExercise = false;
        this.unlockedWords = [];
        this.allWords = [];
        
        this.init();
    }
    
    init() {
        // Инициализация Telegram Web App
        if (typeof Telegram !== 'undefined') {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }
    
    // Получение сообщения для текущего семестра
    getMessage(key, params = {}) {
        let message = CONFIG.messages[this.currentSemester]?.[key] || CONFIG.messages['Sem3'][key];
        
        // Замена параметров в сообщении
        for (const [param, value] of Object.entries(params)) {
            message = message.replace(`{${param}}`, value);
        }
        
        return message;
    }
    
    // Показать семестр
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
    }
    
    // Скачать учебник
    downloadTextbook(semester) {
        const textbook = CONFIG.textbooks[semester];
        if (textbook) {
            console.log(`Downloading textbook: ${textbook.filename}`);
            window.open(textbook.url, '_blank');
        }
    }
    
    // Показать модуль
    showModule(module) {
        this.currentModule = module;
        document.getElementById('module-menu').style.display = 'none';
        document.getElementById('exercise-menu').style.display = 'block';
        document.getElementById('module-title').textContent = `${this.currentSemester}, Модуль ${module}`;
        
        const exercisesContainer = document.getElementById('exercise-buttons');
        exercisesContainer.innerHTML = '';
        
        const exerciseCount = this.getExerciseCount();
        
        for (let i = 1; i <= exerciseCount; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.textContent = `✏️ Упражнение ${i}`;
            btn.onclick = () => this.showExercise(i);
            exercisesContainer.appendChild(btn);
        }
    }
    
    // Показать упражнение
    showExercise(exercise) {
        this.currentExercise = exercise;
        document.getElementById('exercise-menu').style.display = 'none';
        document.getElementById('exercise-content').style.display = 'block';
        document.getElementById('exercise-title').textContent =
            `${this.currentSemester}, Модуль ${this.currentModule}, Упражнение ${exercise}`;
        
        document.getElementById('exercise-description').innerHTML = '<div class="loading">Загрузка упражнения...</div>';
        document.getElementById('answer-section').style.display = 'none';
        document.getElementById('input-section').style.display = 'none';
        document.getElementById('unlocked-words-section').style.display = 'none';
        
        // Сброс состояний
        this.selectedWords = [];
        this.unlockedWords = [];
        this.allWords = [];
        
        this.loadExerciseDescription();
    }
    
    // Загрузить описание упражнения
    async loadExerciseDescription() {
        try {
            const response = await fetch(`${CONFIG.apiBaseUrl}${this.currentSemester}/${this.currentModule}.${this.currentExercise}.txt`);
            
            if (!response.ok) {
                throw new Error(`Ошибка загрузки: ${response.status}`);
            }
            
            const description = await response.text();
            document.getElementById('exercise-description').innerHTML =
                `<div class="exercise-container">${description.replace(/\n/g, '<br>')}</div>`;
            
            // Проверяем, есть ли файл с ответами
            try {
                const answerResponse = await fetch(`${CONFIG.apiBaseUrl}${this.currentSemester}/${this.currentModule}.${this.currentExercise}A.txt`);
                if (answerResponse.ok) {
                    const answers = await answerResponse.text();
                    this.correctOrder = answers.split(',').map(word => word.trim()).filter(word => word.length > 0);
                    this.allWords = [...this.correctOrder];
                    
                    if (this.correctOrder.length > 0) {
                        // Проверяем тип упражнения
                        this.isCustomExercise = this.checkIfCustomExercise();
                        this.isInputExercise = this.checkIfInputExercise();
                        
                        if (this.isInputExercise) {
                            this.setupInputExercise();
                        } else if (this.isCustomExercise) {
                            this.setupCustomButtons();
                            document.getElementById('answer-section').style.display = 'block';
                        } else {
                            this.setupWordButtons();
                            document.getElementById('answer-section').style.display = 'block';
                        }
                    }
                }
            } catch (answerError) {
                console.log('Файл с ответами не найден, это упражнение без проверки');
            }
            
        } catch (error) {
            console.error('Ошибка загрузки упражнения:', error);
            document.getElementById('exercise-description').innerHTML =
                `<div class="error">Ошибка загрузки упражнения: ${error.message}</div>`;
        }
    }
    
    // Проверка на специальное упражнение
    checkIfCustomExercise() {
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        return CONFIG.customExercisesSem3[exerciseKey] || CONFIG.customExercisesSem4[exerciseKey];
    }
    
    // Проверка на упражнение с вводом
    checkIfInputExercise() {
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        return CONFIG.inputExercisesSem3[exerciseKey] || CONFIG.inputExercisesSem4[exerciseKey];
    }
    
    // Получить количество упражнений
    getExerciseCount() {
        return CONFIG.exerciseCounts[this.currentSemester]?.[this.currentModule] || 5;
    }
    
    // Настройка упражнения с вводом
    setupInputExercise() {
        document.getElementById('input-section').style.display = 'block';
        document.getElementById('unlocked-words-section').style.display = 'block';
        document.getElementById('answer-section').style.display = 'block';
        
        // Очищаем поля
        document.getElementById('word-input').value = '';
        document.getElementById('unlocked-words').innerHTML = '';
        document.getElementById('selected-words').textContent = 'Выберите слова в правильном порядке...';
        
        // Специфичные для семестра настройки
        if (this.currentSemester === 'Sem3') {
            document.getElementById('word-input').placeholder = 'Введите слово...';
        } else if (this.currentSemester === 'Sem4') {
            document.getElementById('word-input').placeholder = 'Entrez le mot...';
        }
        
        this.updateProgressCounter();
        this.updateUnlockedWords();
        this.updateWordButtons();
    }
    
    // Обновить счетчик прогресса
    updateProgressCounter() {
        const uniqueWords = [...new Set(this.allWords)];
        const counter = document.getElementById('progress-counter');
        counter.textContent = `Разблокировано: ${this.unlockedWords.length} из ${uniqueWords.length} слов`;
    }
    
    // Показать сообщение об успехе
    showSuccessMessage(message) {
        // Удаляем предыдущие сообщения об успехе
        const existingMessages = document.querySelectorAll('.success-message, .info-message-small');
        existingMessages.forEach(msg => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
        
        const successMessage = document.createElement('div');
        successMessage.className = 'success-message';
        successMessage.innerHTML = message;
        
        // Вставляем сообщение после поля ввода
        const inputSection = document.getElementById('input-section');
        inputSection.appendChild(successMessage);
        
        // Убираем сообщение через 3 секунды
        setTimeout(() => {
            if (successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
        }, 3000);
    }
    
    // Показать информационное сообщение
    showInfoMessage(message) {
        const infoMessage = document.createElement('div');
        infoMessage.className = 'info-message-small';
        infoMessage.innerHTML = message;
        
        // Вставляем сообщение после поля ввода
        const inputSection = document.getElementById('input-section');
        inputSection.appendChild(infoMessage);
        
        // Убираем сообщение через 3 секунды
        setTimeout(() => {
            if (infoMessage.parentNode) {
                infoMessage.parentNode.removeChild(infoMessage);
            }
        }, 3000);
    }
    
    // Проверить введенное слово
    checkWordInput() {
        const input = document.getElementById('word-input');
        const word = input.value.trim().toLowerCase(); // Приводим к нижнему регистру
        
        if (!word) {
            this.showInfoMessage(this.getMessage('enterWord'));
            return;
        }
        
        // Проверяем, есть ли слово в списке правильных ответов
        const normalizedWords = this.allWords.map(w => w.toLowerCase());
        const wordIndex = normalizedWords.indexOf(word);
        
        if (wordIndex !== -1) {
            const correctWord = this.allWords[wordIndex];
            
            // Если слово еще не разблокировано, добавляем его
            if (!this.unlockedWords.includes(correctWord)) {
                this.unlockedWords.push(correctWord);
                this.updateUnlockedWords();
                this.updateWordButtons();
                this.updateProgressCounter();
                this.showSuccessMessage(this.getMessage('wordUnlocked', {word: correctWord}));
                
                // Если все уникальные слова разблокированы, показываем сообщение
                const uniqueWords = [...new Set(this.allWords)];
                if (this.unlockedWords.length === uniqueWords.length) {
                    setTimeout(() => {
                        this.showSuccessMessage(this.getMessage('allWordsUnlocked'));
                    }, 2000);
                }
            } else {
                this.showInfoMessage(this.getMessage('wordAlreadyUnlocked'));
            }
        } else {
            this.showInfoMessage(this.getMessage('wordNotFound'));
        }
        
        input.value = '';
        input.focus();
    }
    
    // Обновить отображение разблокированных слов
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
    }
    
    // Обновить кнопки слов
    updateWordButtons() {
        const wordsContainer = document.getElementById('word-buttons');
        wordsContainer.innerHTML = '';
        
        if (this.unlockedWords.length === 0) {
            wordsContainer.innerHTML = '<p>Сначала разблокируйте слова через ввод</p>';
            return;
        }
        
        // Перемешиваем разблокированные слова
        const shuffledWords = [...this.unlockedWords].sort(() => Math.random() - 0.5);
        
        shuffledWords.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-btn word-btn-unlocked';
            btn.textContent = word;
            btn.onclick = () => this.selectWord(word);
            wordsContainer.appendChild(btn);
        });
    }
    
    // Настройка кастомных кнопок для специальных упражнений
    setupCustomButtons() {
        const wordsContainer = document.getElementById('word-buttons');
        wordsContainer.innerHTML = '';
        this.selectedWords = [];
        document.getElementById('selected-words').textContent = 'Выберите правильные ответы...';
        
        const exerciseKey = `${this.currentSemester}.${this.currentModule}.${this.currentExercise}`;
        let buttons = [];
        
        // Определяем кнопки для специальных упражнений
        switch(exerciseKey) {
            // Упражнения 3 семестра
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
                
            // Упражнения 4 семестра
            case 'Sem4.1.3':
                buttons = ['v', 'f'];
                break;
            case 'Sem4.1.7':
                buttons = ['a', 'b', 'c'];
                break;
                
            default:
                // Если это не специальное упражнение, используем стандартные кнопки
                this.setupWordButtons();
                return;
        }
        
        // Создаем кнопки
        buttons.forEach(buttonText => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            btn.textContent = buttonText;
            btn.onclick = () => this.selectWord(buttonText);
            wordsContainer.appendChild(btn);
        });
    }
    
    // Настройка стандартных кнопок слов
    setupWordButtons() {
        const wordsContainer = document.getElementById('word-buttons');
        wordsContainer.innerHTML = '';
        this.selectedWords = [];
        document.getElementById('selected-words').textContent = 'Выберите слова в правильном порядке...';
        
        // Перемешиваем слова
        const shuffledWords = [...this.correctOrder].sort(() => Math.random() - 0.5);
        
        shuffledWords.forEach(word => {
            const btn = document.createElement('button');
            btn.className = 'word-btn';
            btn.textContent = word;
            btn.onclick = () => this.selectWord(word);
            wordsContainer.appendChild(btn);
        });
    }
    
    // Выбрать слово
    selectWord(word) {
        this.selectedWords.push(word);
        document.getElementById('selected-words').textContent = this.selectedWords.join(' ');
    }
    
    // Убрать последнее слово
    removeLastWord() {
        if (this.selectedWords.length > 0) {
            this.selectedWords.pop();
            document.getElementById('selected-words').textContent = this.selectedWords.join(' ');
        } else {
            this.showInfoMessage(this.getMessage('noWordsToRemove'));
        }
    }
    
    // Проверить ответ
    checkAnswer() {
        const userAnswer = this.selectedWords.join(',');
        const correctAnswer = this.correctOrder.join(',');
        
        if (userAnswer === correctAnswer) {
            // Показываем сообщение об успехе
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = this.getMessage('correct');
            
            alert(this.getMessage('correct').replace(/<[^>]*>/g, ''));
            
            // Вставляем сообщение перед кнопками действий
            const answerSection = document.getElementById('answer-section');
            const actionButtons = answerSection.querySelector('.action-buttons');
            answerSection.insertBefore(successMessage, actionButtons);
            
            // Убираем сообщение через 10 секунд
            setTimeout(() => {
                if (successMessage.parentNode) {
                    successMessage.parentNode.removeChild(successMessage);
                }
            }, 10000);
            
        } else {
            alert(this.getMessage('incorrect').replace(/<[^>]*>/g, ''));
        }
    }
    
    // Сбросить ответ
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
    }
    
    // Навигационные методы
    backToMain() {
        document.getElementById('module-menu').style.display = 'none';
        document.getElementById('main-menu').style.display = 'block';
    }
    
    backToModules() {
        document.getElementById('exercise-menu').style.display = 'none';
        document.getElementById('module-menu').style.display = 'block';
    }
    
    backToExercises() {
        document.getElementById('exercise-content').style.display = 'none';
        document.getElementById('exercise-menu').style.display = 'block';
    }
}

// Создаем глобальный экземпляр приложения
const app = new App();