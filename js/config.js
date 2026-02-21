// Конфигурация приложения
const CONFIG = {
    apiBaseUrl: 'https://mireafrancaisbot.ru/api/exercise/',
    
    // Количество упражнений по семестрам и модулям
    exerciseCounts: {
        'Sem3': {1:10, 2:9, 3:8, 4:6, 5:8, 6:9, 7:7},
        'Sem4': {1:10, 2:8, 3:8, 4:5, 5:7, 6:5, 7:5}
    },
    
    // Специальные упражнения с кастомными кнопками (3 семестр)
    customExercisesSem3: {
        'Sem3.1.5': true, 'Sem3.3.5': true, 'Sem3.4.4': true, 'Sem3.5.2': true,
        'Sem3.5.4': true, 'Sem3.6.5': true, 'Sem3.7.4': true, 'Sem3.3.6': true,
        'Sem3.2.5': true, 'Sem3.3.4': true, 'Sem3.6.4': true, 'Sem3.6.6': true,
        'Sem3.1.7': true, 'Sem3.2.2': true, 'Sem3.4.3': true, 'Sem3.7.3': true
    },
    
    // Специальные упражнения с кастомными кнопками (4 семестр)
    customExercisesSem4: {
        'Sem4.1.3': true, 'Sem4.1.7': true
    },
    
    // Упражнения с вводом слов (3 семестр)
    inputExercisesSem3: {
        'Sem3.1.9': true, 'Sem3.2.8': true, 'Sem3.3.7': true, 'Sem3.4.5': true,
        'Sem3.5.7': true, 'Sem3.6.8': true, 'Sem3.7.6': true
    },
    
    // Упражнения с вводом слов (4 семестр)
    inputExercisesSem4: {},
    
    // Ссылки на учебники
    textbooks: {
        'Sem3': {
            url: 'https://drive.google.com/uc?export=download&id=12ZDqmlCRrnvWat8DxKRHnIX5uE0PSEJy',
            filename: 'Учебник 3 семестра'
        },
        'Sem4': {
            url: 'https://drive.google.com/uc?export=download&id=1_m_shU3sSy74_pUYUtxuozCRD4icsu9T',
            filename: 'Учебник 4 семестра'
        }
    },
    
    // Сообщения для разных семестров
    messages: {
        'Sem3': {
            correct: '🎉 Правильно! ✅',
            incorrect: '❌ Неправильно. Попробуйте еще раз.',
            wordNotFound: '❌ Слово не найдено. Попробуйте еще раз.',
            wordUnlocked: '✅ Слово "<strong>{word}</strong>" разблокировано!',
            allWordsUnlocked: '🎉 <strong>Поздравляем!</strong> Вы разблокировали все слова! Теперь составьте правильную последовательность.',
            noWordsToRemove: 'ℹ️ Нет слов для удаления',
            wordAlreadyUnlocked: 'ℹ️ Это слово уже разблокировано',
            enterWord: '⚠️ Пожалуйста, введите слово'
        },
        'Sem4': {
            correct: '🎉 <strong>Correct!</strong> ✅<br>Vous avez réussi l\'exercice!',
            incorrect: '❌ Incorrect. Essayez encore.',
            wordNotFound: '❌ Mot non trouvé. Essayez encore.',
            wordUnlocked: '✅ Mot "<strong>{word}</strong>" débloqué!',
            allWordsUnlocked: '🎉 <strong>Félicitations!</strong> Vous avez débloqué tous les mots!',
            noWordsToRemove: 'ℹ️ Aucun mot à supprimer',
            wordAlreadyUnlocked: 'ℹ️ Ce mot est déjà débloqué',
            enterWord: '⚠️ Veuillez entrer un mot'
        }
    }
};