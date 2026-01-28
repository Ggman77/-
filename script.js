// Конфигурация
const CONFIG = {
    STORAGE_KEY: 'vsg_database',
    ADMIN_PASSWORD: 'VSG2026',
    NEWS_LIMIT: 10,
    SITE_TITLE: 'VECTOR SERIOUS GAMES',
    DISCORD_CLIENT_ID: 'YOUR_DISCORD_CLIENT_ID', // Замените на ваш Client ID
    DISCORD_REDIRECT_URI: 'http://localhost:8000/', // Замените на ваш Redirect URI
    DISCORD_SCOPES: 'identify email guilds',
    DEFAULT_USER: {
        id: 1,
        username: 'VSG_Admin',
        role: 'admin',
        discordId: null,
        joined: new Date().toISOString()
    }
};

// Система уведомлений
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notificationsContainer');
        this.notifications = [];
        this.init();
    }

    init() {
        // Автоматически удаляем старые уведомления
        setInterval(() => this.cleanup(), 60000);
    }

    showNotification(title, message, type = 'info', duration = 5000) {
        const id = Date.now();
        const notification = {
            id,
            title,
            message,
            type,
            time: new Date(),
            element: null
        };

        this.notifications.unshift(notification);
        this.renderNotification(notification);

        if (duration > 0) {
            setTimeout(() => this.removeNotification(id), duration);
        }

        return id;
    }

    renderNotification(notification) {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${notification.type}`;
        notificationEl.id = `notification-${notification.id}`;
        
        notificationEl.innerHTML = `
            <div class="notification-header">
                <div class="notification-title">
                    <i class="fas fa-${this.getIconByType(notification.type)}"></i>
                    ${notification.title}
                </div>
                <button class="notification-close" onclick="notificationSystem.removeNotification(${notification.id})">
                    &times;
                </button>
            </div>
            <div class="notification-content">${notification.message}</div>
            <div class="notification-time">${this.formatTime(notification.time)}</div>
        `;

        this.container.appendChild(notificationEl);
        notification.element = notificationEl;

        // Анимация появления
        setTimeout(() => {
            notificationEl.style.transform = 'translateX(0)';
            notificationEl.style.opacity = '1';
        }, 10);
    }

    removeNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;

        const notification = this.notifications[index];
        if (notification.element) {
            notification.element.style.transform = 'translateX(100%)';
            notification.element.style.opacity = '0';
            
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
            }, 300);
        }

        this.notifications.splice(index, 1);
    }

    cleanup() {
        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60000);
        
        this.notifications.forEach(notification => {
            if (notification.time < oneMinuteAgo) {
                this.removeNotification(notification.id);
            }
        });
    }

    getIconByType(type) {
        const icons = {
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Только что';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
        
        return date.toLocaleTimeString('ru-RU', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
}

// Класс для работы с JSON базой данных
class VectorDatabase {
    constructor() {
        this.db = {
            news: [],
            schedule: [],
            rules: [],
            teams: [],
            faq: [],
            users: [CONFIG.DEFAULT_USER],
            profiles: [],
            settings: {
                discordWebhook: '',
                discordServerId: '',
                siteTitle: CONFIG.SITE_TITLE
            },
            lastUpdate: new Date().toISOString()
        };
        this.loadFromStorage();
    }

    // Загрузка из LocalStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.db = {
                    ...this.db,
                    ...parsed,
                    // Обеспечиваем наличие всех необходимых массивов
                    news: parsed.news || [],
                    schedule: parsed.schedule || [],
                    rules: parsed.rules || [],
                    teams: parsed.teams || [],
                    faq: parsed.faq || [],
                    users: parsed.users || [CONFIG.DEFAULT_USER],
                    profiles: parsed.profiles || [],
                    settings: parsed.settings || this.db.settings
                };
            } else {
                this.initializeSampleData();
            }
        } catch (error) {
            console.error('Ошибка загрузки из хранилища:', error);
            this.initializeSampleData();
        }
    }

    // Инициализация тестовыми данными
    initializeSampleData() {
        this.db.news = [
            {
                id: 1,
                title: 'Запуск проекта VECTOR SERIOUS GAMES',
                date: new Date().toISOString().split('T')[0],
                author: 'VSG_Command',
                content: `<h3>Добро пожаловать на официальный сайт VECTOR SERIOUS GAMES!</h3>
                <p>Мы начинаем регулярные проведения тактических TVT/TTVT игр в Roblox с правилом <strong>одной жизни</strong>.</p>
                <div class="server-info">
                    <strong>Первый тестовый ивент:</strong><br>
                    • Дата: 30 января 2026<br>
                    • Время: 20:00 МСК<br>
                    • Сервер: VSG | TEST EVENT #1
                </div>
                <p>Основные правила уже доступны в соответствующем разделе.</p>
                <p class="rules-note">Основной принцип: Тактика, координация и реализм превыше всего.</p>`
            }
        ];

        this.db.schedule = [
            {
                id: 1,
                day: 'Понедельник',
                time: '20:00',
                title: 'TVT Тренировка',
                server: 'VSG #1',
                description: 'Базовые тренировки для новых игроков',
                teamA: ['Альфа', 'Браво', 'Чарли'],
                teamB: ['Дельта', 'Эхо', 'Фокстрот']
            },
            {
                id: 2,
                day: 'Среда',
                time: '20:00',
                title: 'Официальный ивент',
                server: 'VSG #1',
                description: 'Основное событие недели',
                teamA: ['Волки', 'Медведи', 'Орлы'],
                teamB: ['Тигры', 'Акулы', 'Скорпионы']
            },
            {
                id: 3,
                day: 'Пятница',
                time: '20:00',
                title: 'TTVT Командный',
                server: 'VSG #1',
                description: 'Командные сражения 3х3',
                teamA: ['Красные', 'Синие', 'Зеленые'],
                teamB: ['Желтые', 'Фиолетовые', 'Оранжевые']
            }
        ];

        this.db.rules = [
            {
                id: 1,
                title: 'Одна жизнь',
                icon: 'skull',
                description: 'Каждый игрок имеет только одну жизнь на всю миссию. После смерти - наблюдение до конца игры.'
            },
            {
                id: 2,
                title: 'Дисциплина связи',
                icon: 'headset',
                description: 'Только командиры отделений общаются между собой. Рации обязательны.'
            }
        ];

        this.db.teams = [
            {
                id: 1,
                name: 'Альфа',
                type: 'assault',
                leader: 'VSG_AlphaLead',
                size: 8,
                maxSize: 12,
                description: 'Основная штурмовая группа'
            },
            {
                id: 2,
                name: 'Браво',
                type: 'support',
                leader: 'VSG_BravoCmd',
                size: 6,
                maxSize: 8,
                description: 'Группа поддержки и снабжения'
            }
        ];

        this.db.faq = [
            {
                id: 1,
                question: 'Как присоединиться к игре?',
                answer: '1. Зайдите на наш Discord сервер<br>2. Проверьте расписание на сайте<br>3. За 30 минут до начала игры появится пароль<br>4. Подключитесь к серверу Roblox через поиск по названию "VECTOR"'
            },
            {
                id: 2,
                question: 'Что такое "одна жизнь"?',
                answer: 'Это основной принцип наших игр. После смерти вы не возрождаетесь до конца миссии. Вы можете наблюдать за игрой от третьего лица или выйти до следующей миссии.'
            }
        ];

        // Профили пользователей
        this.db.profiles = [
            {
                userId: 1,
                username: 'VSG_Admin',
                discordId: 'admin_123',
                rank: 'Администратор',
                gamesPlayed: 156,
                gamesWon: 89,
                hoursPlayed: 324,
                kdRatio: 2.34,
                accuracy: '78%',
                survivalRate: '64%',
                rating: 2450,
                activities: [
                    {
                        id: 1,
                        type: 'game',
                        title: 'Победа в матче',
                        description: 'Командный ивент "Осада базы"',
                        time: new Date(Date.now() - 3600000).toISOString()
                    },
                    {
                        id: 2,
                        type: 'achievement',
                        title: 'Новое достижение',
                        description: 'Снайперский выстрел на 1000м',
                        time: new Date(Date.now() - 86400000).toISOString()
                    }
                ],
                teams: ['Альфа'],
                createdAt: new Date().toISOString()
            }
        ];

        this.saveToStorage();
    }

    // Сохранение в LocalStorage
    saveToStorage() {
        try {
            this.db.lastUpdate = new Date().toISOString();
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.db));
        } catch (error) {
            console.error('Ошибка сохранения в хранилище:', error);
        }
    }

    // Получение следующего ID для массива
    getNextId(array) {
        return array.length > 0 ? Math.max(...array.map(item => item.id)) + 1 : 1;
    }

    // === Работа с профилями ===
    getUserProfile(userId) {
        return this.db.profiles.find(profile => profile.userId === userId);
    }

    createProfile(userData) {
        const profile = {
            userId: userData.id,
            username: userData.username,
            discordId: userData.discordId,
            rank: 'Новичок',
            gamesPlayed: 0,
            gamesWon: 0,
            hoursPlayed: 0,
            kdRatio: 0.00,
            accuracy: '0%',
            survivalRate: '0%',
            rating: 1000,
            activities: [
                {
                    id: 1,
                    type: 'registration',
                    title: 'Регистрация на сайте',
                    description: 'Создан профиль игрока',
                    time: new Date().toISOString()
                }
            ],
            teams: [],
            createdAt: new Date().toISOString()
        };
        
        this.db.profiles.push(profile);
        this.saveToStorage();
        return profile;
    }

    updateProfile(userId, updates) {
        const index = this.db.profiles.findIndex(p => p.userId === userId);
        if (index !== -1) {
            this.db.profiles[index] = { ...this.db.profiles[index], ...updates };
            this.saveToStorage();
            return this.db.profiles[index];
        }
        return null;
    }

    addActivity(userId, activity) {
        const profile = this.getUserProfile(userId);
        if (profile) {
            activity.id = profile.activities.length + 1;
            activity.time = new Date().toISOString();
            profile.activities.unshift(activity);
            this.saveToStorage();
            return activity;
        }
        return null;
    }

    // === CRUD операции для новостей ===
    getAllNews() {
        return [...this.db.news].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getRecentNews(limit = CONFIG.NEWS_LIMIT) {
        return this.getAllNews().slice(0, limit);
    }

    addNews(newsItem) {
        const newId = this.getNextId(this.db.news);
        const newsWithId = {
            id: newId,
            date: newsItem.date || new Date().toISOString().split('T')[0],
            ...newsItem
        };
        
        this.db.news.unshift(newsWithId);
        this.saveToStorage();
        return newsWithId;
    }

    deleteNews(id) {
        const index = this.db.news.findIndex(item => item.id === id);
        if (index !== -1) {
            this.db.news.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    clearAllNews() {
        this.db.news = [];
        this.saveToStorage();
        return true;
    }

    // === CRUD операции для расписания ===
    getAllSchedule() {
        return [...this.db.schedule];
    }

    addSchedule(scheduleItem) {
        const newId = this.getNextId(this.db.schedule);
        const scheduleWithId = {
            id: newId,
            teamA: scheduleItem.teamA || [],
            teamB: scheduleItem.teamB || [],
            ...scheduleItem
        };
        
        this.db.schedule.push(scheduleWithId);
        this.saveToStorage();
        return scheduleWithId;
    }

    deleteSchedule(id) {
        const index = this.db.schedule.findIndex(item => item.id === id);
        if (index !== -1) {
            this.db.schedule.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // === CRUD операции для правил ===
    getAllRules() {
        return [...this.db.rules];
    }

    saveRules(rules) {
        this.db.rules = rules;
        this.saveToStorage();
        return true;
    }

    // === CRUD операции для команд ===
    getAllTeams() {
        return [...this.db.teams];
    }

    addTeam(teamItem) {
        const newId = this.getNextId(this.db.teams);
        const teamWithId = {
            id: newId,
            ...teamItem
        };
        
        this.db.teams.push(teamWithId);
        this.saveToStorage();
        return teamWithId;
    }

    deleteTeam(id) {
        const index = this.db.teams.findIndex(item => item.id === id);
        if (index !== -1) {
            this.db.teams.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // === CRUD операции для FAQ ===
    getAllFaq() {
        return [...this.db.faq];
    }

    addFaq(faqItem) {
        const newId = this.getNextId(this.db.faq);
        const faqWithId = {
            id: newId,
            ...faqItem
        };
        
        this.db.faq.push(faqWithId);
        this.saveToStorage();
        return faqWithId;
    }

    deleteFaq(id) {
        const index = this.db.faq.findIndex(item => item.id === id);
        if (index !== -1) {
            this.db.faq.splice(index, 1);
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // === Работа с пользователями ===
    getCurrentUser() {
        const userId = sessionStorage.getItem('vsg_user_id');
        if (userId) {
            return this.db.users.find(user => user.id === parseInt(userId)) || null;
        }
        return null;
    }

    addUser(userData) {
        const newId = this.getNextId(this.db.users);
        const userWithId = {
            id: newId,
            role: 'user',
            joined: new Date().toISOString(),
            ...userData
        };
        
        this.db.users.push(userWithId);
        this.saveToStorage();
        return userWithId;
    }

    // === Настройки ===
    getSettings() {
        return this.db.settings;
    }

    updateSettings(newSettings) {
        this.db.settings = { ...this.db.settings, ...newSettings };
        this.saveToStorage();
        return true;
    }

    // === Экспорт/Импорт ===
    exportFullDatabase() {
        const dataStr = JSON.stringify(this.db, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `vsg_full_database_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        return true;
    }

    importFullDatabase(jsonData) {
        try {
            const imported = JSON.parse(jsonData);
            
            // Проверка структуры
            const requiredArrays = ['news', 'schedule', 'rules', 'teams', 'faq', 'users', 'profiles'];
            for (const arrayName of requiredArrays) {
                if (!imported[arrayName] || !Array.isArray(imported[arrayName])) {
                    throw new Error(`Неверный формат: ${arrayName}`);
                }
            }
            
            this.db = {
                ...this.db,
                ...imported,
                lastUpdate: new Date().toISOString()
            };
            
            this.saveToStorage();
            return true;
        } catch (error) {
            console.error('Ошибка импорта JSON:', error);
            throw error;
        }
    }

    resetDatabase() {
        if (confirm('ВНИМАНИЕ: Это сбросит ВСЮ базу данных к начальному состоянию. Это действие необратимо. Продолжить?')) {
            localStorage.removeItem(CONFIG.STORAGE_KEY);
            this.db = {
                news: [],
                schedule: [],
                rules: [],
                teams: [],
                faq: [],
                users: [CONFIG.DEFAULT_USER],
                profiles: [],
                settings: {
                    discordWebhook: '',
                    discordServerId: '',
                    siteTitle: CONFIG.SITE_TITLE
                },
                lastUpdate: new Date().toISOString()
            };
            this.initializeSampleData();
            return true;
        }
        return false;
    }
}

// Класс для рендеринга UI
class VectorRenderer {
    constructor(db, notificationSystem) {
        this.db = db;
        this.notificationSystem = notificationSystem;
        this.currentSection = 'home';
        this.isAdminAuthenticated = sessionStorage.getItem('vsg_admin_auth') === 'true';
        this.currentUser = null;
        this.currentProfile = null;
    }

    // Форматирование даты
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    // Форматирование времени
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Переключение секций
    switchSection(sectionId) {
        // Обновляем навигацию
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const targetLink = document.querySelector(`[data-section="${sectionId}"]`);
        if (targetLink) {
            targetLink.classList.add('active');
        }
        
        // Обновляем контент
        document.querySelectorAll('.section-content').forEach(section => {
            section.classList.remove('active');
        });
        
        const targetSection = document.getElementById(`${sectionId}Section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        // Обновляем заголовок
        this.updateSectionHeader(sectionId);
        
        this.currentSection = sectionId;
        
        // Загружаем контент секции
        this.loadSectionContent(sectionId);
        
        // Если перешли в админку, проверяем авторизацию
        if (sectionId === 'admin' && !this.isAdminAuthenticated) {
            this.showAdminLogin();
            return false;
        }
        
        return true;
    }

    // Обновление заголовка секции
    updateSectionHeader(sectionId) {
        const header = document.getElementById('contentHeader');
        const titles = {
            'home': 'ГЛАВНАЯ',
            'news': 'ПОСЛЕДНИЕ АНОНСЫ И НОВОСТИ',
            'schedule': 'РАСПИСАНИЕ ИГР',
            'rules': 'ПРАВИЛА ИГРЫ',
            'teams': 'КОМАНДЫ И ОТРЯДЫ',
            'faq': 'ЧАСТО ЗАДАВАЕМЫЕ ВОПРОСЫ',
            'profile': 'ПРОФИЛЬ',
            'admin': 'АДМИН-ПАНЕЛЬ'
        };
        
        const subtitles = {
            'home': 'Добро пожаловать в VECTOR SERIOUS GAMES',
            'news': 'На сайте отображаются последние анонсы игр. Полная история доступна в нашем Discord.',
            'schedule': 'Расписание официальных ивентов и тренировок.',
            'rules': 'Основные правила участия в играх VECTOR SERIOUS GAMES.',
            'teams': 'Список команд и их текущий состав.',
            'faq': 'Ответы на часто задаваемые вопросы.',
            'profile': 'Ваш профиль игрока и статистика',
            'admin': 'Управление контентом сайта.'
        };
        
        if (header && titles[sectionId]) {
            document.getElementById('sectionTitle').textContent = titles[sectionId];
            document.getElementById('sectionSubtitle').textContent = subtitles[sectionId];
        }
    }

    // Загрузка контента секции
    loadSectionContent(sectionId) {
        switch(sectionId) {
            case 'home':
                this.renderHomePage();
                break;
            case 'news':
                this.renderNewsFeed();
                break;
            case 'schedule':
                this.renderSchedule();
                break;
            case 'rules':
                this.renderRules();
                break;
            case 'teams':
                this.renderTeams();
                break;
            case 'faq':
                this.renderFaq();
                break;
            case 'profile':
                this.renderProfile();
                break;
            case 'admin':
                this.renderAdminPanel();
                break;
        }
    }

    // Рендеринг главной страницы
    renderHomePage() {
        // Рендерим последние новости
        const updatesGrid = document.getElementById('homeUpdates');
        const recentNews = this.db.getRecentNews(3);
        
        if (recentNews.length === 0) {
            updatesGrid.innerHTML = `
                <div class="update-card">
                    <h5>Новостей пока нет</h5>
                    <p>Будьте первым, кто добавит новость через админ-панель!</p>
                </div>
            `;
        } else {
            updatesGrid.innerHTML = recentNews.map(news => `
                <div class="update-card" onclick="switchSection('news')">
                    <h5>${news.title}</h5>
                    <div class="update-date">${this.formatDate(news.date)}</div>
                    <div class="update-preview">
                        ${news.content.substring(0, 100)}...
                    </div>
                </div>
            `).join('');
        }
    }

    // Рендеринг новостей
    renderNewsFeed() {
        const newsFeed = document.getElementById('newsFeed');
        const posts = this.db.getAllNews();
        
        if (posts.length === 0) {
            newsFeed.innerHTML = `
                <div class="news-post">
                    <div class="post-content">
                        <h3>Новостей пока нет</h3>
                        <p>Будьте первым, кто добавит новость через админ-панель!</p>
                    </div>
                </div>
            `;
            return;
        }

        newsFeed.innerHTML = posts.map(post => this.renderNewsPost(post)).join('');
    }

    // Рендеринг одной новости
    renderNewsPost(post) {
        const formattedDate = this.formatDate(post.date);
        
        return `
            <article class="news-post" data-id="${post.id}">
                <div class="post-header">
                    <div class="post-date">
                        от ${formattedDate}
                        <span class="badge">НОВОЕ</span>
                    </div>
                    <div class="post-author">
                        <i class="fas fa-user"></i> ${post.author}
                    </div>
                </div>
                <div class="post-content">
                    ${post.content}
                </div>
            </article>
        `;
    }

    // Рендеринг расписания с командами
    renderSchedule() {
        const container = document.getElementById('scheduleContainer');
        const schedule = this.db.getAllSchedule();
        
        // Группируем по дням
        const scheduleByDay = {};
        schedule.forEach(event => {
            if (!scheduleByDay[event.day]) {
                scheduleByDay[event.day] = [];
            }
            scheduleByDay[event.day].push(event);
        });
        
        const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
        
        let html = `
            <h3><i class="fas fa-calendar-week"></i> Расписание на неделю</h3>
            <div class="schedule-grid">
        `;
        
        days.forEach(day => {
            if (scheduleByDay[day]) {
                html += `
                    <div class="schedule-day">
                        <div class="day-header">${day}</div>
                        <div class="day-events">
                `;
                
                scheduleByDay[day].forEach(event => {
                    html += `
                        <div class="event">
                            <span class="event-time">${event.time}</span>
                            <span class="event-name">${event.title}</span>
                            <span class="event-server">${event.server}</span>
                        </div>
                        <div class="event-teams">
                            <div class="team-side">
                                <h5>Команда А</h5>
                                <div class="team-list">
                    `;
                    
                    if (event.teamA && event.teamA.length > 0) {
                        event.teamA.forEach(team => {
                            html += `
                                <div class="team-item">
                                    <i class="fas fa-users"></i>
                                    <span>${team}</span>
                                </div>
                            `;
                        });
                    } else {
                        html += `<div class="team-item">Не назначены</div>`;
                    }
                    
                    html += `
                                </div>
                            </div>
                            <div class="vs-label">VS</div>
                            <div class="team-side">
                                <h5>Команда Б</h5>
                                <div class="team-list">
                    `;
                    
                    if (event.teamB && event.teamB.length > 0) {
                        event.teamB.forEach(team => {
                            html += `
                                <div class="team-item">
                                    <i class="fas fa-users"></i>
                                    <span>${team}</span>
                                </div>
                            `;
                        });
                    } else {
                        html += `<div class="team-item">Не назначены</div>`;
                    }
                    
                    html += `
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }

    // Рендеринг правил
    renderRules() {
        const container = document.getElementById('rulesContainer');
        const rules = this.db.getAllRules();
        
        let html = `
            <h3><i class="fas fa-gavel"></i> Правила VECTOR SERIOUS GAMES</h3>
            <div class="rules-grid">
        `;
        
        rules.forEach(rule => {
            html += `
                <div class="rule-card">
                    <div class="rule-icon">
                        <i class="fas fa-${rule.icon}"></i>
                    </div>
                    <h4>${rule.title}</h4>
                    <p>${rule.description}</p>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }

    // Рендеринг команд
    renderTeams() {
        const container = document.getElementById('teamsContainer');
        const teams = this.db.getAllTeams();
        
        let html = `
            <h3><i class="fas fa-users"></i> Команды и отряды</h3>
            <div class="teams-list">
        `;
        
        teams.forEach(team => {
            html += `
                <div class="team-card">
                    <div class="team-header">
                        <h4>${team.name}</h4>
                        <span class="team-tag">${this.getTeamTypeLabel(team.type)}</span>
                    </div>
                    <div class="team-info">
                        <p><i class="fas fa-user"></i> Командир: ${team.leader}</p>
                        <p><i class="fas fa-users"></i> Состав: ${team.size}/${team.maxSize} человек</p>
                        <p><i class="fas fa-info-circle"></i> ${team.description}</p>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
    }

    getTeamTypeLabel(type) {
        const labels = {
            'assault': 'Штурм',
            'support': 'Поддержка',
            'recon': 'Разведка',
            'sniper': 'Снайперы'
        };
        return labels[type] || type;
    }

    // Рендеринг FAQ
    renderFaq() {
        const container = document.getElementById('faqContainer');
        const faq = this.db.getAllFaq();
        
        let html = `
            <h3><i class="fas fa-question-circle"></i> Часто задаваемые вопросы</h3>
            <div class="faq-list">
        `;
        
        faq.forEach((item, index) => {
            html += `
                <div class="faq-item" data-id="${item.id}">
                    <div class="faq-question">
                        <h4>${item.question}</h4>
                        <i class="fas fa-chevron-down"></i>
                    </div>
                    <div class="faq-answer">
                        <p>${item.answer}</p>
                    </div>
                </div>
            `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
        
        // Инициализируем аккордеон FAQ
        this.initFaqAccordion();
    }

    // Инициализация аккордеона FAQ
    initFaqAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                // Закрываем все остальные вопросы
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });

            // ==============================================
// АДМИН-ПАНЕЛЬ - ПОЛНЫЙ ФУНКЦИОНАЛ
// ==============================================

// Метод рендеринга админ-панели
async renderAdminPanel() {
    const container = document.getElementById('adminSection');
    if (!container) return;
    
    // Получаем статистику для админ-панели
    const stats = await this.getAdminStats();
    
    container.innerHTML = `
        <div class="admin-panel">
            <div class="admin-header">
                <h3><i class="fas fa-cog"></i> Админ-панель VECTOR SERIOUS GAMES</h3>
                <div class="admin-actions">
                    <button class="btn btn-primary" onclick="adminExportData()">
                        <i class="fas fa-download"></i> Экспорт
                    </button>
                    <button class="btn btn-secondary" onclick="adminBackup()">
                        <i class="fas fa-save"></i> Бекап
                    </button>
                </div>
            </div>
            
            <!-- Статистика -->
            <div class="admin-stats">
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${stats.totalUsers || 0}</div>
                    <div class="admin-stat-label">Пользователей</div>
                    <div class="admin-stat-change positive">+${stats.newUsers || 0} за неделю</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${stats.totalNews || 0}</div>
                    <div class="admin-stat-label">Новостей</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${stats.totalEvents || 0}</div>
                    <div class="admin-stat-label">Событий</div>
                </div>
                <div class="admin-stat-card">
                    <div class="admin-stat-value">${stats.activeUsers || 0}</div>
                    <div class="admin-stat-label">Онлайн</div>
                </div>
            </div>
            
            <!-- Вкладки -->
            <div class="admin-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" data-tab="news" onclick="adminSwitchTab('news')">
                        <i class="fas fa-newspaper"></i> Новости
                    </button>
                    <button class="tab-btn" data-tab="schedule" onclick="adminSwitchTab('schedule')">
                        <i class="fas fa-calendar"></i> Расписание
                    </button>
                    <button class="tab-btn" data-tab="content" onclick="adminSwitchTab('content')">
                        <i class="fas fa-file-alt"></i> Контент
                    </button>
                    <button class="tab-btn" data-tab="users" onclick="adminSwitchTab('users')">
                        <i class="fas fa-users"></i> Пользователи
                    </button>
                    <button class="tab-btn" data-tab="teams" onclick="adminSwitchTab('teams')">
                        <i class="fas fa-user-friends"></i> Команды
                    </button>
                    <button class="tab-btn" data-tab="settings" onclick="adminSwitchTab('settings')">
                        <i class="fas fa-sliders-h"></i> Настройки
                    </button>
                    <button class="tab-btn" data-tab="tools" onclick="adminSwitchTab('tools')">
                        <i class="fas fa-tools"></i> Инструменты
                    </button>
                </div>
                
                <!-- Контент вкладок -->
                <div id="adminTabContent">
                    ${await this.renderAdminNewsTab()}
                    ${await this.renderAdminScheduleTab()}
                    ${await this.renderAdminContentTab()}
                    ${await this.renderAdminUsersTab()}
                    ${await this.renderAdminTeamsTab()}
                    ${await this.renderAdminSettingsTab()}
                    ${await this.renderAdminToolsTab()}
                </div>
            </div>
        </div>
    `;
    
    // Инициализируем админ-табы
    this.initAdminTabs();
    // Инициализируем формы
    this.initAdminForms();
    // Загружаем данные
    await this.loadAdminData();
}

// Получение статистики для админ-панели
async getAdminStats() {
    try {
        const news = await this.db.getAllNews();
        const schedule = await this.db.getAllSchedule();
        const users = this.db.cache.profiles || {};
        
        return {
            totalNews: news.length,
            totalEvents: schedule.length,
            totalUsers: Object.keys(users).length,
            activeUsers: Object.values(users).filter(u => u.isOnline).length,
            newUsers: Math.floor(Math.random() * 10) // Пример
        };
    } catch (error) {
        console.error('Ошибка получения статистики:', error);
        return {};
    }
}

// Рендеринг вкладки новостей
async renderAdminNewsTab() {
    return `
        <div id="tab-news" class="tab-content active">
            <div class="admin-form">
                <h4><i class="fas fa-plus-circle"></i> Добавить новость</h4>
                <form id="newsForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="newsTitle">Заголовок *</label>
                            <input type="text" id="newsTitle" class="form-control" required 
                                   placeholder="Введите заголовок новости">
                        </div>
                        <div class="form-group">
                            <label for="newsDate">Дата</label>
                            <input type="date" id="newsDate" class="form-control" 
                                   value="${new Date().toISOString().split('T')[0]}">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="newsAuthor">Автор</label>
                        <input type="text" id="newsAuthor" class="form-control" 
                               value="${this.db.currentUser?.displayName || 'Администратор'}" 
                               placeholder="Имя автора">
                    </div>
                    
                    <div class="form-group">
                        <label for="newsContent">Содержание *</label>
                        <textarea id="newsContent" class="form-control" rows="8" 
                                  placeholder="Введите текст новости..." required></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label for="newsTags">Теги (через запятую)</label>
                        <input type="text" id="newsTags" class="form-control" 
                               placeholder="новости, игры, ивент">
                    </div>
                    
                    <div class="form-check">
                        <input type="checkbox" id="newsPin" class="form-check-input">
                        <label for="newsPin">Закрепить новость</label>
                    </div>
                    
                    <div class="form-check">
                        <input type="checkbox" id="newsNotify" class="form-check-input" checked>
                        <label for="newsNotify">Уведомить пользователей</label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-paper-plane"></i> Опубликовать
                        </button>
                        <button type="button" class="btn-secondary" onclick="adminClearForm('newsForm')">
                            <i class="fas fa-times"></i> Очистить
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="data-list" id="newsListContainer">
                <div class="data-list-header">
                    <div>Заголовок</div>
                    <div>Дата</div>
                    <div>Действия</div>
                </div>
                <div id="newsListContent">
                    <!-- Список новостей загружается динамически -->
                </div>
            </div>
        </div>
    `;
}

// Рендеринг вкладки расписания
async renderAdminScheduleTab() {
    return `
        <div id="tab-schedule" class="tab-content">
            <div class="admin-form">
                <h4><i class="fas fa-plus-circle"></i> Добавить событие</h4>
                <form id="scheduleForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="eventTitle">Название события *</label>
                            <input type="text" id="eventTitle" class="form-control" required 
                                   placeholder="Например: TVT тренировка">
                        </div>
                        <div class="form-group">
                            <label for="eventDay">День недели *</label>
                            <select id="eventDay" class="form-control" required>
                                <option value="">Выберите день</option>
                                <option value="Понедельник">Понедельник</option>
                                <option value="Вторник">Вторник</option>
                                <option value="Среда">Среда</option>
                                <option value="Четверг">Четверг</option>
                                <option value="Пятница">Пятница</option>
                                <option value="Суббота">Суббота</option>
                                <option value="Воскресенье">Воскресенье</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="eventTime">Время *</label>
                            <input type="time" id="eventTime" class="form-control" required 
                                   value="20:00">
                        </div>
                        <div class="form-group">
                            <label for="eventServer">Сервер</label>
                            <input type="text" id="eventServer" class="form-control" 
                                   placeholder="VSG #1" value="VSG #1">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="eventDescription">Описание</label>
                        <textarea id="eventDescription" class="form-control" rows="4" 
                                  placeholder="Описание события..."></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="eventTeamA">Команда А (через запятую)</label>
                            <input type="text" id="eventTeamA" class="form-control" 
                                   placeholder="Альфа, Браво, Чарли">
                        </div>
                        <div class="form-group">
                            <label for="eventTeamB">Команда Б (через запятую)</label>
                            <input type="text" id="eventTeamB" class="form-control" 
                                   placeholder="Дельта, Эхо, Фокстрот">
                        </div>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-calendar-plus"></i> Добавить
                        </button>
                        <button type="button" class="btn-secondary" onclick="adminClearForm('scheduleForm')">
                            <i class="fas fa-times"></i> Очистить
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="data-list" id="scheduleListContainer">
                <div class="data-list-header">
                    <div>Событие</div>
                    <div>День/Время</div>
                    <div>Действия</div>
                </div>
                <div id="scheduleListContent">
                    <!-- Список событий загружается динамически -->
                </div>
            </div>
        </div>
    `;
}

// Рендеринг вкладки контента (правила, FAQ)
async renderAdminContentTab() {
    return `
        <div id="tab-content" class="tab-content">
            <div class="content-tabs">
                <div class="tab-buttons">
                    <button class="tab-btn active" onclick="adminSwitchContentTab('rules')">
                        <i class="fas fa-gavel"></i> Правила
                    </button>
                    <button class="tab-btn" onclick="adminSwitchContentTab('faq')">
                        <i class="fas fa-question-circle"></i> FAQ
                    </button>
                    <button class="tab-btn" onclick="adminSwitchContentTab('teams')">
                        <i class="fas fa-users"></i> Команды
                    </button>
                </div>
                
                <div id="contentTabContent">
                    <!-- Правила -->
                    <div id="content-rules" class="content-tab active">
                        <div class="admin-form">
                            <h4><i class="fas fa-plus-circle"></i> Добавить правило</h4>
                            <form id="rulesForm">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="ruleTitle">Название правила *</label>
                                        <input type="text" id="ruleTitle" class="form-control" required 
                                               placeholder="Например: Одна жизнь">
                                    </div>
                                    <div class="form-group">
                                        <label for="ruleIcon">Иконка</label>
                                        <select id="ruleIcon" class="form-control">
                                            <option value="skull">Череп</option>
                                            <option value="headset">Гарнитура</option>
                                            <option value="users">Люди</option>
                                            <option value="shield-alt">Щит</option>
                                            <option value="crosshairs">Прицел</option>
                                            <option value="walkie-talkie">Рация</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="ruleDescription">Описание *</label>
                                    <textarea id="ruleDescription" class="form-control" rows="5" required 
                                              placeholder="Подробное описание правила..."></textarea>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i> Сохранить правило
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        <div class="data-list" id="rulesListContainer">
                            <div class="data-list-header">
                                <div>Правило</div>
                                <div>Описание</div>
                                <div>Действия</div>
                            </div>
                            <div id="rulesListContent">
                                <!-- Список правил -->
                            </div>
                        </div>
                    </div>
                    
                    <!-- FAQ -->
                    <div id="content-faq" class="content-tab">
                        <div class="admin-form">
                            <h4><i class="fas fa-plus-circle"></i> Добавить FAQ</h4>
                            <form id="faqForm">
                                <div class="form-group">
                                    <label for="faqQuestion">Вопрос *</label>
                                    <input type="text" id="faqQuestion" class="form-control" required 
                                           placeholder="Введите вопрос...">
                                </div>
                                
                                <div class="form-group">
                                    <label for="faqAnswer">Ответ *</label>
                                    <textarea id="faqAnswer" class="form-control" rows="6" required 
                                              placeholder="Введите ответ..."></textarea>
                                </div>
                                
                                <div class="form-group">
                                    <label for="faqOrder">Порядок отображения</label>
                                    <input type="number" id="faqOrder" class="form-control" value="1" min="1">
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn-primary">
                                        <i class="fas fa-save"></i> Сохранить FAQ
                                    </button>
                                </div>
                            </form>
                        </div>
                        
                        <div class="data-list" id="faqListContainer">
                            <div class="data-list-header">
                                <div>Вопрос</div>
                                <div>Ответ</div>
                                <div>Действия</div>
                            </div>
                            <div id="faqListContent">
                                <!-- Список FAQ -->
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Рендеринг вкладки пользователей
async renderAdminUsersTab() {
    return `
        <div id="tab-users" class="tab-content">
            <div class="admin-form">
                <h4><i class="fas fa-search"></i> Поиск пользователей</h4>
                <div class="form-row">
                    <div class="form-group">
                        <input type="text" id="userSearch" class="form-control" 
                               placeholder="Поиск по имени, email..." 
                               onkeyup="adminSearchUsers(this.value)">
                    </div>
                    <div class="form-group">
                        <select id="userRoleFilter" class="form-control" onchange="adminFilterUsers()">
                            <option value="">Все роли</option>
                            <option value="admin">Администраторы</option>
                            <option value="moderator">Модераторы</option>
                            <option value="user">Пользователи</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="admin-table">
                <table>
                    <thead>
                        <tr>
                            <th>Имя</th>
                            <th>Email</th>
                            <th>Роль</th>
                            <th>Статус</th>
                            <th>Дата регистрации</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <!-- Список пользователей загружается динамически -->
                    </tbody>
                </table>
            </div>
            
            <div class="pagination" id="usersPagination">
                <!-- Пагинация -->
            </div>
        </div>
    `;
}

// Рендеринг вкладки команд
async renderAdminTeamsTab() {
    return `
        <div id="tab-teams" class="tab-content">
            <div class="admin-form">
                <h4><i class="fas fa-plus-circle"></i> Создать команду</h4>
                <form id="teamForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="teamName">Название команды *</label>
                            <input type="text" id="teamName" class="form-control" required 
                                   placeholder="Например: Альфа">
                        </div>
                        <div class="form-group">
                            <label for="teamType">Тип команды</label>
                            <select id="teamType" class="form-control">
                                <option value="assault">Штурм</option>
                                <option value="support">Поддержка</option>
                                <option value="recon">Разведка</option>
                                <option value="sniper">Снайперы</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="teamLeader">Командир</label>
                            <input type="text" id="teamLeader" class="form-control" 
                                   placeholder="Имя командира">
                        </div>
                        <div class="form-group">
                            <label for="teamMaxSize">Макс. размер</label>
                            <input type="number" id="teamMaxSize" class="form-control" 
                                   value="12" min="1" max="50">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="teamDescription">Описание</label>
                        <textarea id="teamDescription" class="form-control" rows="4" 
                                  placeholder="Описание команды..."></textarea>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-users"></i> Создать команду
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="data-list" id="teamsListContainer">
                <div class="data-list-header">
                    <div>Команда</div>
                    <div>Тип / Лидер</div>
                    <div>Действия</div>
                </div>
                <div id="teamsListContent">
                    <!-- Список команд -->
                </div>
            </div>
        </div>
    `;
}

// Рендеринг вкладки настроек
async renderAdminSettingsTab() {
    const settings = await this.db.getSettings();
    
    return `
        <div id="tab-settings" class="tab-content">
            <div class="admin-form">
                <h4><i class="fas fa-cogs"></i> Основные настройки</h4>
                <form id="settingsForm">
                    <div class="form-group">
                        <label for="siteTitle">Название сайта *</label>
                        <input type="text" id="siteTitle" class="form-control" required 
                               value="${settings.siteTitle || CONFIG.SITE_TITLE}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="newsLimit">Лимит новостей на странице</label>
                            <input type="number" id="newsLimit" class="form-control" 
                                   value="${settings.newsLimit || 10}" min="1" max="50">
                        </div>
                        <div class="form-group">
                            <label for="adminEmail">Email администратора</label>
                            <input type="email" id="adminEmail" class="form-control" 
                                   value="${settings.adminEmail || ''}" 
                                   placeholder="admin@example.com">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="discordWebhook">Discord Webhook URL</label>
                        <input type="url" id="discordWebhook" class="form-control" 
                               value="${settings.discordWebhook || ''}" 
                               placeholder="https://discord.com/api/webhooks/...">
                    </div>
                    
                    <h5>Настройки доступа</h5>
                    <div class="form-check">
                        <input type="checkbox" id="maintenanceMode" class="form-check-input" 
                               ${settings.maintenanceMode ? 'checked' : ''}>
                        <label for="maintenanceMode">Режим технического обслуживания</label>
                    </div>
                    
                    <div class="form-check">
                        <input type="checkbox" id="registrationEnabled" class="form-check-input" 
                               ${settings.registrationEnabled === false ? '' : 'checked'}>
                        <label for="registrationEnabled">Разрешить регистрацию</label>
                    </div>
                    
                    <div class="form-check">
                        <input type="checkbox" id="emailVerification" class="form-check-input" 
                               ${settings.emailVerification ? 'checked' : ''}>
                        <label for="emailVerification">Требовать подтверждение email</label>
                    </div>
                    
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">
                            <i class="fas fa-save"></i> Сохранить настройки
                        </button>
                        <button type="button" class="btn-secondary" onclick="adminResetSettings()">
                            <i class="fas fa-undo"></i> Сбросить
                        </button>
                    </div>
                </form>
            </div>
            
            <div class="admin-form">
                <h4><i class="fas fa-palette"></i> Внешний вид</h4>
                <div class="form-row">
                    <div class="form-group">
                        <label for="themeColor">Основной цвет</label>
                        <input type="color" id="themeColor" class="form-control" 
                               value="${settings.themeColor || '#8B0000'}">
                    </div>
                    <div class="form-group">
                        <label for="backgroundColor">Фон</label>
                        <input type="color" id="backgroundColor" class="form-control" 
                               value="${settings.backgroundColor || '#000000'}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label>Логотип сайта</label>
                    <div class="image-upload">
                        <input type="file" id="logoUpload" accept="image/*" 
                               onchange="adminPreviewLogo(this)" style="display: none;">
                        <div class="image-preview" id="logoPreview">
                            <img src="${settings.logoUrl || '#'}" alt="Логотип" 
                                 style="${settings.logoUrl ? '' : 'display: none;'}">
                            <div id="logoPlaceholder" style="${settings.logoUrl ? 'display: none;' : ''}">
                                <i class="fas fa-image fa-3x"></i>
                                <p>Логотип не загружен</p>
                            </div>
                        </div>
                        <button type="button" class="btn-secondary" onclick="document.getElementById('logoUpload').click()">
                            <i class="fas fa-upload"></i> Загрузить логотип
                        </button>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-primary" onclick="adminSaveAppearance()">
                        <i class="fas fa-save"></i> Сохранить оформление
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Рендеринг вкладки инструментов
async renderAdminToolsTab() {
    return `
        <div id="tab-tools" class="tab-content">
            <div class="tools-grid">
                <div class="admin-form">
                    <h4><i class="fas fa-database"></i> Управление базой данных</h4>
                    <div class="form-group">
                        <button class="btn-primary btn-block" onclick="adminExportFullDatabase()">
                            <i class="fas fa-download"></i> Экспорт всей БД
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <input type="file" id="dbImport" accept=".json" style="display: none;" 
                               onchange="adminImportDatabase(this)">
                        <button class="btn-secondary btn-block" onclick="document.getElementById('dbImport').click()">
                            <i class="fas fa-upload"></i> Импорт БД
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminClearCache()">
                            <i class="fas fa-broom"></i> Очистить кэш
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn-danger btn-block" onclick="adminResetDatabase()">
                            <i class="fas fa-trash"></i> Сбросить БД
                        </button>
                    </div>
                </div>
                
                <div class="admin-form">
                    <h4><i class="fas fa-chart-line"></i> Аналитика</h4>
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminGenerateReport()">
                            <i class="fas fa-file-excel"></i> Сгенерировать отчет
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminViewLogs()">
                            <i class="fas fa-clipboard-list"></i> Просмотреть логи
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminBackupNow()">
                            <i class="fas fa-hdd"></i> Создать бекап
                        </button>
                    </div>
                </div>
                
                <div class="admin-form">
                    <h4><i class="fas fa-user-shield"></i> Безопасность</h4>
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminChangePassword()">
                            <i class="fas fa-key"></i> Сменить пароль
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminViewSessions()">
                            <i class="fas fa-user-clock"></i> Активные сессии
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <button class="btn-secondary btn-block" onclick="adminAuditLog()">
                            <i class="fas fa-history"></i> История действий
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="admin-form">
                <h4><i class="fas fa-terminal"></i> Системная информация</h4>
                <div class="system-info">
                    <div class="info-item">
                        <span>Версия системы:</span>
                        <strong>VSG 2.0</strong>
                    </div>
                    <div class="info-item">
                        <span>База данных:</span>
                        <strong>Firebase Firestore</strong>
                    </div>
                    <div class="info-item">
                        <span>Пользователей:</span>
                        <strong id="systemUsersCount">0</strong>
                    </div>
                    <div class="info-item">
                        <span>Новостей:</span>
                        <strong id="systemNewsCount">0</strong>
                    </div>
                    <div class="info-item">
                        <span>Последнее обновление:</span>
                        <strong id="systemLastUpdate">-</strong>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Инициализация админ-табов
initAdminTabs() {
    // Основные вкладки
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = tab.getAttribute('data-tab');
            if (tabId) {
                adminSwitchTab(tabId);
            }
        });
    });
    
    // Вкладки контента
    document.querySelectorAll('.content-tab-btn').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const tabId = tab.getAttribute('data-content-tab');
            if (tabId) {
                adminSwitchContentTab(tabId);
            }
        });
    });
}

// Инициализация админ-форм
initAdminForms() {
    // Форма новостей
    const newsForm = document.getElementById('newsForm');
    if (newsForm) {
        newsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddNews();
        });
    }
    
    // Форма расписания
    const scheduleForm = document.getElementById('scheduleForm');
    if (scheduleForm) {
        scheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddSchedule();
        });
    }
    
    // Форма правил
    const rulesForm = document.getElementById('rulesForm');
    if (rulesForm) {
        rulesForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddRule();
        });
    }
    
    // Форма FAQ
    const faqForm = document.getElementById('faqForm');
    if (faqForm) {
        faqForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddFaq();
        });
    }
    
    // Форма команд
    const teamForm = document.getElementById('teamForm');
    if (teamForm) {
        teamForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleAddTeam();
        });
    }
    
    // Форма настроек
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSaveSettings();
        });
    }
}

// Загрузка данных для админ-панели
async loadAdminData() {
    // Загружаем новости
    await this.loadAdminNews();
    
    // Загружаем расписание
    await this.loadAdminSchedule();
    
    // Загружаем правила
    await this.loadAdminRules();
    
    // Загружаем FAQ
    await this.loadAdminFaq();
    
    // Загружаем команды
    await this.loadAdminTeams();
    
    // Загружаем пользователей
    await this.loadAdminUsers();
    
    // Обновляем системную информацию
    await this.updateSystemInfo();
}

// Загрузка новостей для админ-панели
async loadAdminNews() {
    try {
        const news = await this.db.getAllNews();
        const container = document.getElementById('newsListContent');
        
        if (!container) return;
        
        if (news.length === 0) {
            container.innerHTML = `
                <div class="data-list-item">
                    <div class="item-title">Новостей нет</div>
                    <div class="item-date">-</div>
                    <div class="item-actions">-</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = news.map(item => `
            <div class="data-list-item" data-id="${item.id}">
                <div class="item-title">${item.title}</div>
                <div class="item-date">${this.formatDate(item.date || item.createdAt)}</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit" onclick="adminEditNews('${item.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-view" onclick="adminViewNews('${item.id}')" title="Просмотреть">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="adminDeleteNews('${item.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
    }
}

// Загрузка расписания для админ-панели
async loadAdminSchedule() {
    try {
        const schedule = await this.db.getAllSchedule();
        const container = document.getElementById('scheduleListContent');
        
        if (!container) return;
        
        if (schedule.length === 0) {
            container.innerHTML = `
                <div class="data-list-item">
                    <div class="item-title">Событий нет</div>
                    <div class="item-date">-</div>
                    <div class="item-actions">-</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = schedule.map(item => `
            <div class="data-list-item" data-id="${item.id}">
                <div class="item-title">${item.title}</div>
                <div class="item-date">${item.day} ${item.time}</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit" onclick="adminEditEvent('${item.id}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="adminDeleteEvent('${item.id}')" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки расписания:', error);
    }
}

// Загрузка правил для админ-панели
async loadAdminRules() {
    try {
        const rules = await this.db.getAllRules();
        const container = document.getElementById('rulesListContent');
        
        if (!container) return;
        
        if (rules.length === 0) {
            container.innerHTML = `
                <div class="data-list-item">
                    <div>Правил нет</div>
                    <div>-</div>
                    <div class="item-actions">-</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = rules.map(item => `
            <div class="data-list-item" data-id="${item.id}">
                <div>${item.title}</div>
                <div>${item.description.substring(0, 50)}...</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit" onclick="adminEditRule('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="adminDeleteRule('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки правил:', error);
    }
}

// Загрузка FAQ для админ-панели
async loadAdminFaq() {
    try {
        const faq = await this.db.getAllFaq();
        const container = document.getElementById('faqListContent');
        
        if (!container) return;
        
        if (faq.length === 0) {
            container.innerHTML = `
                <div class="data-list-item">
                    <div>FAQ нет</div>
                    <div>-</div>
                    <div class="item-actions">-</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = faq.map(item => `
            <div class="data-list-item" data-id="${item.id}">
                <div>${item.question}</div>
                <div>${item.answer.substring(0, 50)}...</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit" onclick="adminEditFaq('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="adminDeleteFaq('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки FAQ:', error);
    }
}

// Загрузка команд для админ-панели
async loadAdminTeams() {
    try {
        const teams = await this.db.getAllTeams();
        const container = document.getElementById('teamsListContent');
        
        if (!container) return;
        
        if (teams.length === 0) {
            container.innerHTML = `
                <div class="data-list-item">
                    <div>Команд нет</div>
                    <div>-</div>
                    <div class="item-actions">-</div>
                </div>
            `;
            return;
        }
        
        container.innerHTML = teams.map(item => `
            <div class="data-list-item" data-id="${item.id}">
                <div>${item.name}</div>
                <div>${this.getTeamTypeLabel(item.type)} / ${item.leader || 'Нет лидера'}</div>
                <div class="item-actions">
                    <button class="btn-icon btn-edit" onclick="adminEditTeam('${item.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-delete" onclick="adminDeleteTeam('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Ошибка загрузки команд:', error);
    }
}

// Загрузка пользователей для админ-панели
async loadAdminUsers(page = 1, limit = 10) {
    try {
        const users = Object.values(this.db.cache.profiles || {});
        const container = document.getElementById('usersTableBody');
        const pagination = document.getElementById('usersPagination');
        
        if (!container) return;
        
        // Пагинация
        const totalPages = Math.ceil(users.length / limit);
        const startIndex = (page - 1) * limit;
        const paginatedUsers = users.slice(startIndex, startIndex + limit);
        
        if (users.length === 0) {
            container.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center;">Пользователей нет</td>
                </tr>
            `;
            return;
        }
        
        container.innerHTML = paginatedUsers.map(user => `
            <tr data-id="${user.uid}">
                <td>
                    <strong>${user.username}</strong>
                    ${user.isOnline ? '<span class="badge" style="background: #00FF00; margin-left: 5px;">Онлайн</span>' : ''}
                </td>
                <td>${user.email || 'Не указан'}</td>
                <td>
                    <select class="role-select" data-user="${user.uid}" onchange="adminChangeUserRole('${user.uid}', this.value)">
                        <option value="user" ${user.role === 'user' ? 'selected' : ''}>Пользователь</option>
                        <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Модератор</option>
                        <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Администратор</option>
                    </select>
                </td>
                <td>
                    <span class="badge" style="background: ${user.isOnline ? '#00FF00' : '#FF0000'}">
                        ${user.isOnline ? 'Онлайн' : 'Офлайн'}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn-icon btn-edit" onclick="adminEditUser('${user.uid}')" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon btn-view" onclick="adminViewUser('${user.uid}')" title="Просмотреть">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${user.uid !== this.db.currentUser?.uid ? `
                        <button class="btn-icon btn-delete" onclick="adminDeleteUser('${user.uid}')" title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
        
        // Пагинация
        if (pagination) {
            let paginationHTML = '';
            
            if (page > 1) {
                paginationHTML += `<button onclick="adminLoadUsers(${page - 1})">&laquo; Назад</button>`;
            }
            
            for (let i = 1; i <= totalPages; i++) {
                if (i === page) {
                    paginationHTML += `<button class="active">${i}</button>`;
                } else if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) {
                    paginationHTML += `<button onclick="adminLoadUsers(${i})">${i}</button>`;
                } else if (i === page - 3 || i === page + 3) {
                    paginationHTML += `<button disabled>...</button>`;
                }
            }
            
            if (page < totalPages) {
                paginationHTML += `<button onclick="adminLoadUsers(${page + 1})">Вперед &raquo;</button>`;
            }
            
            pagination.innerHTML = paginationHTML;
        }
        
    } catch (error) {
        console.error('Ошибка загрузки пользователей:', error);
    }
}

// Обновление системной информации
async updateSystemInfo() {
    try {
        const news = await this.db.getAllNews();
        const users = Object.values(this.db.cache.profiles || {});
        
        document.getElementById('systemUsersCount').textContent = users.length;
        document.getElementById('systemNewsCount').textContent = news.length;
        document.getElementById('systemLastUpdate').textContent = 
            new Date().toLocaleString('ru-RU');
            
    } catch (error) {
        console.error('Ошибка обновления системной информации:', error);
    }
}

// ==============================================
// ОБРАБОТЧИКИ ФОРМ АДМИН-ПАНЕЛИ
// ==============================================

// Добавление новости
async handleAddNews() {
    const title = document.getElementById('newsTitle').value;
    const date = document.getElementById('newsDate').value;
    const author = document.getElementById('newsAuthor').value;
    const content = document.getElementById('newsContent').value;
    const tags = document.getElementById('newsTags').value;
    const isPinned = document.getElementById('newsPin').checked;
    const sendNotification = document.getElementById('newsNotify').checked;
    
    if (!title || !content) {
        this.notificationSystem.showNotification('Ошибка', 'Заполните обязательные поля', 'error');
        return;
    }
    
    try {
        const newsData = {
            title,
            date,
            author,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            isPinned,
            views: 0,
            likes: 0
        };
        
        await this.db.addNews(newsData);
        
        // Очищаем форму
        document.getElementById('newsForm').reset();
        document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('newsAuthor').value = this.db.currentUser?.displayName || 'Администратор';
        
        // Обновляем список новостей
        await this.loadAdminNews();
        
        // Показываем уведомление
        this.notificationSystem.showNotification(
            'Успех',
            'Новость успешно добавлена',
            'success'
        );
        
        // Отправляем уведомление пользователям если нужно
        if (sendNotification) {
            // Здесь можно добавить отправку уведомлений
        }
        
    } catch (error) {
        console.error('Ошибка добавления новости:', error);
        this.notificationSystem.showNotification(
            'Ошибка',
            'Не удалось добавить новость',
            'error'
        );
    }
}

// Добавление события в расписание
async handleAddSchedule() {
    const title = document.getElementById('eventTitle').value;
    const day = document.getElementById('eventDay').value;
    const time = document.getElementById('eventTime').value;
    const server = document.getElementById('eventServer').value;
    const description = document.getElementById('eventDescription').value;
    const teamA = document.getElementById('eventTeamA').value;
    const teamB = document.getElementById('eventTeamB').value;
    
    if (!title || !day || !time) {
        this.notificationSystem.showNotification('Ошибка', 'Заполните обязательные поля', 'error');
        return;
    }
    
    try {
        const scheduleData = {
            title,
            day,
            time,
            server,
            description,
            teamA: teamA.split(',').map(team => team.trim()).filter(team => team),
            teamB: teamB.split(',').map(team => team.trim()).filter(team => team),
            participants: [],
            maxParticipants: 20
        };
        
        await this.db.addSchedule(scheduleData);
        
        // Очищаем форму
        document.getElementById('scheduleForm').reset();
        document.getElementById('eventTime').value = '20:00';
        document.getElementById('eventServer').value = 'VSG #1';
        
        // Обновляем список событий
        await this.loadAdminSchedule();
        
        this.notificationSystem.showNotification(
            'Успех',
            'Событие добавлено в расписание',
            'success'
        );
        
    } catch (error) {
        console.error('Ошибка добавления события:', error);
        this.notificationSystem.showNotification(
            'Ошибка',
            'Не удалось добавить событие',
            'error'
        );
    }
}

// Добавление правила
async handleAddRule() {
    const title = document.getElementById('ruleTitle').value;
    const icon = document.getElementById('ruleIcon').value;
    const description = document.getElementById('ruleDescription').value;
    
    if (!title || !description) {
        this.notificationSystem.showNotification('Ошибка', 'Заполните обязательные поля', 'error');
        return;
    }
    
    try {
        const ruleData = {
            title,
            icon,
            description
        };
        
        // Получаем текущие правила
        const currentRules = await this.db.getAllRules();
        
        // Добавляем новое правило
        const newRules = [...currentRules, {
            ...ruleData,
            id: `rule_${Date.now()}`
        }];
        
        await this.db.saveRules(newRules);
        
        // Очищаем форму
        document.getElementById('rulesForm').reset();
        
        // Обновляем список правил
        await this.loadAdminRules();
        
        this.notificationSystem.showNotification(
            'Успех',
            'Правило успешно добавлено',
            'success'
        );
        
    } catch (error) {
        console.error('Ошибка добавления правила:', error);
        this.notificationSystem.showNotification(
            'Ошибка',
            'Не удалось добавить правило',
            'error'
        );
    }
}

// Добавление FAQ
async handleAddFaq() {
    const question = document.getElementById('faqQuestion').value;
    const answer = document.getElementById('faqAnswer').value;
    const order = document.getElementById('faqOrder').value;
    
    if (!question || !answer) {
        this.notificationSystem.showNotification('Ошибка', 'Заполните обязательные поля', 'error');
        return;
    }
    
    try {
        const faqData = {
            question,
            answer,
            order: parseInt(order) || 1
        };
        
        await this.db.addFaq(faqData);
        
        // Очищаем форму
        document.getElementById('faqForm').reset();
        document.getElementById('faqOrder').value = 1;
        
        // Обновляем список FAQ
        await this.loadAdminFaq();
        
        this.notificationSystem.showNotification(
            'Успех',
            'FAQ успешно добавлен',
            'success'
        );
        
    } catch (error) {
        console.error('Ошибка добавления FAQ:', error);
        this.notificationSystem.showNotification(
            'Ошибка',
            'Не удалось добавить FAQ',
            'error'
        );
    }
}

// Добавление команды
async handleAddTeam() {
    const name = document.getElementById('teamName').value;
    const type = document.getElementById('teamType').value;
    const leader = document.getElementById('teamLeader').value;
    const maxSize = document.getElementById('teamMaxSize').value;
    const description = document.getElementById('teamDescription').value;
    
    if (!name) {
        this.notificationSystem.showNotification('Ошибка', 'Введите название команды', 'error');
        return;
    }
    
    try {
        const teamData = {
            name,
            type,
            leader,
            maxSize: parseInt(maxSize) || 12,
            description,
            size: 0,
            members: []
        };
        
        await this.db.addTeam(teamData);
        
        // Очищаем форму
        document.getElementById('teamForm').reset();
        document.getElementById('teamMaxSize').value = 12;
        
        // Обновляем список команд
        await this.loadAdminTeams();
        
        this.notificationSystem.showNotification(
            'Успех',
            'Команда успешно создана',
            'success'
        );
        
    } catch (error) {
        console.error('Ошибка добавления команды:', error);
        this.notificationSystem.showNotification(
            'Ошибка',
            'Не удалось создать команду',
            'error'
        );
    }
}

// Сохранение настроек
async handleSaveSettings() {
    const siteTitle = document.getElementById('siteTitle').value;
    const newsLimit = document.getElementById('newsLimit').value;
    const adminEmail = document.getElementById('adminEmail').value;
    const discordWebhook = document.getElementById('discordWebhook').value;
    const maintenanceMode = document.getElementById('maintenanceMode').checked;
    const registrationEnabled = document.getElementById('registrationEnabled').checked;
    const emailVerification = document.getElementById('emailVerification').checked;
    
    try {
        const settingsData = {
            siteTitle,
            newsLimit: parseInt(newsLimit) || 10,
            adminEmail,
            discordWebhook,
            maintenanceMode,
            registrationEnabled,
            emailVerification,
            updatedAt: new Date().toISOString()
        };
        
        await this.db.updateSettings(settingsData);
        
        // Обновляем заголовок страницы
        document.title = siteTitle;
        
        this.notificationSystem.showNotification(
            'Успех',
            'Настройки успешно сохранены',
            'success'
        );
        
    } catch (error) {
        console.error('Ошибка сохранения настроек:', error);
        this.notificationSystem.showNotification(
            'Ошибка',
            'Не удалось сохранить настройки',
            'error'
        );
    }
}
                
                // Переключаем текущий вопрос
                item.classList.toggle('active');
            });
        });
        
        // Открываем первый вопрос по умолчанию
        if (faqItems.length > 0) {
            faqItems[0].classList.add('active');
        }
    }

    // Рендеринг профиля
    renderProfile() {
        if (!this.currentProfile) {
            // Если профиля нет, переключаем на главную
            this.switchSection('home');
            this.notificationSystem.showNotification(
                'Внимание',
                'Для просмотра профиля необходимо авторизоваться',
                'warning'
            );
            return;
        }

        // Заполняем данные профиля
        document.getElementById('profileUsername').textContent = this.currentProfile.username;
        document.getElementById('profileRank').textContent = this.currentProfile.rank;
        document.getElementById('gamesPlayed').textContent = this.currentProfile.gamesPlayed;
        document.getElementById('gamesWon').textContent = this.currentProfile.gamesWon;
        document.getElementById('hoursPlayed').textContent = this.currentProfile.hoursPlayed;
        document.getElementById('kdRatio').textContent = this.currentProfile.kdRatio.toFixed(2);
        document.getElementById('accuracy').textContent = this.currentProfile.accuracy;
        document.getElementById('survivalRate').textContent = this.currentProfile.survivalRate;
        document.getElementById('rating').textContent = this.currentProfile.rating;

        // Рендерим активности
        this.renderActivities();

        // Обновляем статус Discord
        const discordBadge = document.getElementById('discordConnected');
        if (this.currentProfile.discordId) {
            discordBadge.style.display = 'inline-flex';
        } else {
            discordBadge.style.display = 'none';
        }

        // Рендерим команды игрока
        this.renderPlayerTeams();
    }

    // Рендеринг активностей
    renderActivities() {
        const activityList = document.getElementById('activityList');
        if (!this.currentProfile.activities || this.currentProfile.activities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Нет активностей</div>
                        <div class="activity-time">Примите участие в игре</div>
                    </div>
                </div>
            `;
            return;
        }

        activityList.innerHTML = this.currentProfile.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${activity.title}</div>
                    <div class="activity-time">${this.formatTime(activity.time)}</div>
                    ${activity.description ? `<div class="activity-description">${activity.description}</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'game': 'gamepad',
            'achievement': 'trophy',
            'registration': 'user-plus',
            'team': 'users',
            'event': 'calendar-check'
        };
        return icons[type] || 'info-circle';
    }

    // Рендеринг команд игрока
    renderPlayerTeams() {
        const playerTeams = document.getElementById('playerTeams');
        if (!this.currentProfile.teams || this.currentProfile.teams.length === 0) {
            playerTeams.innerHTML = `
                <div class="team-membership">
                    <div class="team-info">
                        <div class="team-name">Не в команде</div>
                        <div class="team-role">Игрок</div>
                    </div>
                    <button class="btn btn-small" onclick="switchSection('teams')">
                        <i class="fas fa-search"></i> Найти команду
                    </button>
                </div>
            `;
            return;
        }

        playerTeams.innerHTML = this.currentProfile.teams.map(teamName => `
            <div class="team-membership">
                <div class="team-info">
                    <div class="team-name">${teamName}</div>
                    <div class="team-role">Участник</div>
                </div>
                <button class="btn btn-small btn-danger" onclick="leaveTeam('${teamName}')">
                    <i class="fas fa-sign-out-alt"></i> Покинуть
                </button>
            </div>
        `).join('');
    }

    // Рендеринг админ-панели
    renderAdminPanel() {
        this.renderAdminNews();
        this.renderAdminSchedule();
        this.renderAdminTeams();
        this.renderAdminFaq();
        this.renderAdminSettings();
    }

    // ... (остальные методы админ-панели остаются без изменений) ...

    // Модальные окна
    showAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        modal.classList.add('active');
        document.getElementById('adminPassword').focus();
    }

    hideAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        modal.classList.remove('active');
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginMessage').textContent = '';
    }

    showDiscordLogin() {
        const modal = document.getElementById('discordLoginModal');
        modal.classList.add('active');
        document.getElementById('discordMessage').textContent = '';
    }

    hideDiscordLogin() {
        const modal = document.getElementById('discordLoginModal');
        modal.classList.remove('active');
    }

    // Discord OAuth2 авторизация
    startDiscordOAuth() {
        const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${CONFIG.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(CONFIG.DISCORD_REDIRECT_URI)}&response_type=code&scope=${CONFIG.DISCORD_SCOPES}`;
        
        // В реальном приложении здесь будет редирект
        // window.location.href = discordAuthUrl;
        
        // Для демо покажем сообщение
        this.notificationSystem.showNotification(
            'Discord OAuth2',
            'В реальном приложении вы будете перенаправлены на страницу авторизации Discord. Для теста используйте кнопку "Тестовый вход".',
            'info',
            8000
        );
    }

    // Тестовый вход (без Discord)
    simulateDiscordLogin() {
        // Создаем тестового пользователя
        const testUser = {
            id: Date.now(),
            username: `Игрок_${Math.floor(Math.random() * 1000)}`,
            discordId: null,
            role: 'user'
        };

        // Сохраняем пользователя
        this.db.addUser(testUser);
        this.currentUser = testUser;

        // Создаем профиль
        const profile = this.db.createProfile({
            id: testUser.id,
            username: testUser.username,
            discordId: null
        });
        this.currentProfile = profile;

        // Сохраняем в сессии
        sessionStorage.setItem('vsg_user_id', testUser.id);

        // Обновляем UI
        this.updateUserStatus();
        this.updateDiscordButton();
        this.showProfileNavLink();

        // Закрываем модальное окно
        this.hideDiscordLogin();

        // Показываем уведомление
        this.notificationSystem.showNotification(
            'Успешный вход',
            `Добро пожаловать, ${testUser.username}! Теперь у вас есть доступ ко всем функциям сайта.`,
            'success'
        );

        // Добавляем активность
        this.db.addActivity(testUser.id, {
            type: 'registration',
            title: 'Тестовый вход',
            description: 'Авторизация через тестовый режим'
        });

        // Переключаем на профиль
        setTimeout(() => {
            this.switchSection('profile');
        }, 1000);
    }

    // Обновление кнопки Discord
    updateDiscordButton() {
        const discordBtn = document.getElementById('discordBtn');
        if (this.currentUser) {
            discordBtn.innerHTML = '<i class="fas fa-user"></i> Профиль';
            discordBtn.className = 'discord-login-btn profile';
            discordBtn.onclick = () => this.switchSection('profile');
        } else {
            discordBtn.innerHTML = '<i class="fab fa-discord"></i> Войти через Discord';
            discordBtn.className = 'discord-login-btn';
            discordBtn.onclick = () => this.showDiscordLogin();
        }
    }

    // Показать ссылку на профиль в навигации
    showProfileNavLink() {
        const profileNavLink = document.getElementById('profileNavLink');
        if (this.currentUser) {
            profileNavLink.style.display = 'flex';
        } else {
            profileNavLink.style.display = 'none';
        }
    }

    // Обновление статуса пользователя
    updateUserStatus() {
        const userStatus = document.getElementById('userStatus');
        if (this.currentUser) {
            userStatus.innerHTML = `
                <i class="fas fa-user-check"></i>
                <span>${this.currentUser.username}</span>
            `;
            userStatus.style.borderLeftColor = '#00FF00';
        } else {
            userStatus.innerHTML = `
                <i class="fas fa-user"></i>
                <span>Не авторизован</span>
            `;
            userStatus.style.borderLeftColor = 'var(--vsg-red)';
        }
    }

    // Выход из системы
    logout() {
        if (confirm('Вы уверены, что хотите выйти?')) {
            sessionStorage.removeItem('vsg_user_id');
            this.currentUser = null;
            this.currentProfile = null;
            
            this.updateUserStatus();
            this.updateDiscordButton();
            this.showProfileNavLink();
            
            this.notificationSystem.showNotification(
                'Выход из системы',
                'Вы успешно вышли из аккаунта',
                'info'
            );
            
            this.switchSection('home');
        }
    }

    // Отключение Discord
    disconnectDiscord() {
        if (confirm('Отключить привязку Discord аккаунта?')) {
            if (this.currentProfile) {
                this.currentProfile.discordId = null;
                this.db.updateProfile(this.currentUser.id, { discordId: null });
                
                this.notificationSystem.showNotification(
                    'Discord отключен',
                    'Привязка Discord аккаунта удалена',
                    'info'
                );
                
                this.renderProfile();
            }
        }
    }

    // Инициализация
    init() {
        // Проверяем авторизацию
        const userId = sessionStorage.getItem('vsg_user_id');
        if (userId) {
            this.currentUser = this.db.getCurrentUser();
            if (this.currentUser) {
                this.currentProfile = this.db.getUserProfile(this.currentUser.id);
            }
        }

        // Инициализируем навигацию
        this.initNavigation();
        
        // Инициализируем формы
        this.initForms();
        
        // Инициализируем админ-табы
        this.initAdminTabs();
        
        // Обновляем UI
        this.updateDiscordButton();
        this.showProfileNavLink();
        this.updateUserStatus();
        
        // Загружаем начальную секцию
        this.switchSection('home');
        
        // Загружаем настройки
        this.renderAdminSettings();

        // Показываем приветственное уведомление
        setTimeout(() => {
            this.notificationSystem.showNotification(
                'Добро пожаловать!',
                'Добро пожаловать в VECTOR SERIOUS GAMES - сообщество тактических игр с одной жизнью.',
                'info',
                10000
            );
        }, 1000);
    }

    initNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const section = link.getAttribute('data-section');
                if (section) {
                    this.switchSection(section);
                }
            });
        });
        
        // Обработка клика по логотипу
        document.querySelector('.logo').addEventListener('click', (e) => {
            e.preventDefault();
            this.switchSection('home');
        });
    }

    initForms() {
        // Форма новостей
        const newsForm = document.getElementById('newsForm');
        if (newsForm) {
            newsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const title = document.getElementById('postTitle').value;
                const date = document.getElementById('postDate').value;
                const author = document.getElementById('postAuthor').value;
                const content = document.getElementById('postContent').value;
                
                if (!title || !content) {
                    this.notificationSystem.showNotification('Ошибка', 'Заполните все обязательные поля', 'error');
                    return;
                }
                
                const newPost = {
                    title,
                    date,
                    author,
                    content: `<h3>${title}</h3>` + content.replace(/\n/g, '<br>')
                };
                
                this.db.addNews(newPost);
                
                this.notificationSystem.showNotification('Успех', `Новость "${title}" успешно добавлена!`, 'success');
                this.clearForm();
                this.renderNewsFeed();
                this.renderAdminNews();
                this.renderHomePage();
            });
        }

        // Форма расписания
        const scheduleForm = document.getElementById('scheduleForm');
        if (scheduleForm) {
            scheduleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const title = document.getElementById('eventTitle').value;
                const day = document.getElementById('eventDay').value;
                const time = document.getElementById('eventTime').value;
                const server = document.getElementById('eventServer').value;
                const description = document.getElementById('eventDescription').value;
                
                if (!title || !day || !time || !server) {
                    this.notificationSystem.showNotification('Ошибка', 'Заполните все обязательные поля', 'error');
                    return;
                }
                
                const newEvent = {
                    title,
                    day,
                    time,
                    server,
                    description
                };
                
                this.db.addSchedule(newEvent);
                
                this.notificationSystem.showNotification('Успех', `Событие "${title}" успешно добавлено!`, 'success');
                scheduleForm.reset();
                this.renderSchedule();
                this.renderAdminSchedule();
            });
        }

        // ... (остальные формы) ...
    }

    initAdminTabs() {
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                // Убираем активный класс у всех вкладок
                document.querySelectorAll('.admin-tab').forEach(t => {
                    t.classList.remove('active');
                });
                
                // Добавляем активный класс текущей вкладке
                tab.classList.add('active');
                
                // Скрываем все контенты
                document.querySelectorAll('.admin-tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                // Показываем нужный контент
                const tabId = tab.getAttribute('data-tab');
                document.getElementById(`admin${tabId.charAt(0).toUpperCase() + tabId.slice(1)}`).classList.add('active');
            });
        });
    }

    // Вспомогательные методы
    clearForm() {
        const form = document.getElementById('newsForm');
        if (form) {
            form.reset();
            document.getElementById('postDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('postAuthor').value = 'VSG_Command';
        }
    }
}

// Глобальные переменные
let dbInstance;
let uiInstance;
let notificationSystem;

// Глобальные функции для вызова из HTML
function switchSection(sectionId) {
    uiInstance.switchSection(sectionId);
}

function showAdminLogin() {
    uiInstance.showAdminLogin();
}

function showDiscordLogin() {
    uiInstance.showDiscordLogin();
}

function closeModal() {
    uiInstance.hideAdminLogin();
    uiInstance.hideDiscordLogin();
}

function checkAdminPassword() {
    const password = document.getElementById('adminPassword').value;
    const messageEl = document.getElementById('loginMessage');
    
    if (password === CONFIG.ADMIN_PASSWORD) {
        uiInstance.isAdminAuthenticated = true;
        sessionStorage.setItem('vsg_admin_auth', 'true');
        messageEl.textContent = 'Доступ разрешен!';
        messageEl.className = 'message success';
        
        setTimeout(() => {
            uiInstance.hideAdminLogin();
            uiInstance.switchSection('admin');
        }, 1000);
    } else {
        messageEl.textContent = 'Неверный пароль!';
        messageEl.className = 'message error';
    }
}

function startDiscordOAuth() {
    uiInstance.startDiscordOAuth();
}

function simulateDiscordLogin() {
    uiInstance.simulateDiscordLogin();
}

function logout() {
    uiInstance.logout();
}

function disconnectDiscord() {
    uiInstance.disconnectDiscord();
}

function leaveTeam(teamName) {
    if (confirm(`Вы уверены, что хотите покинуть команду "${teamName}"?`)) {
        notificationSystem.showNotification(
            'Команда',
            `Заявка на выход из команды "${teamName}" отправлена`,
            'info'
        );
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Инициализируем систему уведомлений
    notificationSystem = new NotificationSystem();
    
    // Инициализируем базу данных
    dbInstance = new VectorDatabase();
    
    // Инициализируем UI
    uiInstance = new VectorRenderer(dbInstance, notificationSystem);
    uiInstance.init();
    
    // Устанавливаем сегодняшнюю дату в формах
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('postDate');
    if (dateInput) {
        dateInput.value = today;
    }
    
    // Устанавливаем текущее время в форме расписания
    const timeInput = document.getElementById('eventTime');
    if (timeInput) {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }
    
    console.log('VECTOR SERIOUS GAMES инициализирован');

const firebaseConfig = {

  apiKey: "AIzaSyC-RzJOwNEwh-TL5ZWIyTAwi6s8sxJe6tA",

  authDomain: "vector-sgr.firebaseapp.com",

  projectId: "vector-sgr",

  storageBucket: "vector-sgr.firebasestorage.app",

  messagingSenderId: "992636161479",

  appId: "1:992636161479:web:fcec192986d43b5b7cdde2",

  measurementId: "G-ZX1TXYWMMB"

};
};
});
