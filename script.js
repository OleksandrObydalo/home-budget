class ExpenseTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.goals = JSON.parse(localStorage.getItem('goals')) || [];
        this.currentTab = 'expenses';
        this.currentPeriod = 'month';
        
        this.categoryColors = {
            food: '#ef4444',
            transport: '#f59e0b',
            utilities: '#3b82f6',
            entertainment: '#8b5cf6',
            clothing: '#ec4899',
            health: '#10b981',
            education: '#06b6d4',
            other: '#6b7280'
        };

        this.categoryIcons = {
            food: '🍎',
            transport: '🚗',
            utilities: '⚡',
            entertainment: '🎬',
            clothing: '👕',
            health: '🏥',
            education: '📚',
            other: '📦'
        };
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderExpenses();
        this.updateBalance();
        this.updateStatistics();
        this.generateTips();
        this.renderGoals();
        this.setTodayDate();
    }

    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Expense form
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Category filter
        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.renderExpenses(e.target.value);
        });

        // Period selector
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.changePeriod(e.target.dataset.period);
            });
        });

        // Goals
        document.getElementById('setGoalBtn').addEventListener('click', () => {
            this.addGoal();
        });
    }

    setTodayDate() {
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load specific tab content
        if (tabName === 'analytics') {
            this.renderCharts();
        } else if (tabName === 'tips') {
            this.generateTips();
        }
    }

    addExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value;
        const date = document.getElementById('date').value;

        if (!amount || !category || !date) {
            alert('Будь ласка, заповніть всі обов\'язкові поля');
            return;
        }

        const expense = {
            id: Date.now(),
            amount,
            category,
            description: description || 'Без опису',
            date,
            timestamp: new Date().toISOString()
        };

        this.expenses.unshift(expense);
        this.saveData();
        this.renderExpenses();
        this.updateBalance();
        this.updateStatistics();
        this.generateTips();
        this.clearForm();

        // Show success animation
        this.showNotification('Витрату додано успішно!', 'success');
    }

    deleteExpense(id) {
        if (confirm('Ви впевнені, що хочете видалити цю витрату?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveData();
            this.renderExpenses();
            this.updateBalance();
            this.updateStatistics();
            this.generateTips();
            this.showNotification('Витрату видалено', 'info');
        }
    }

    renderExpenses(filterCategory = '') {
        const container = document.getElementById('expensesList');
        let filteredExpenses = this.expenses;

        if (filterCategory) {
            filteredExpenses = this.expenses.filter(expense => expense.category === filterCategory);
        }

        if (filteredExpenses.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-receipt" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>Поки що немає витрат</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item">
                <div class="expense-info">
                    <span class="expense-category">${this.categoryIcons[expense.category]}</span>
                    <div class="expense-details">
                        <h4>${expense.description}</h4>
                        <p>${this.formatDate(expense.date)} • ${this.getCategoryName(expense.category)}</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <span class="expense-amount">-₴${expense.amount.toFixed(2)}</span>
                    <button class="delete-btn" onclick="tracker.deleteExpense(${expense.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateBalance() {
        const total = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        document.getElementById('totalBalance').textContent = `-₴${total.toFixed(2)}`;
    }

    updateStatistics() {
        const now = new Date();
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const weeklyExpenses = this.getExpensesInPeriod(weekStart);
        const monthlyExpenses = this.getExpensesInPeriod(monthStart);
        
        const weeklyTotal = weeklyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const monthlyTotal = monthlyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const avgDaily = monthlyTotal / new Date().getDate();

        document.getElementById('weeklyTotal').textContent = `₴${weeklyTotal.toFixed(2)}`;
        document.getElementById('monthlyTotal').textContent = `₴${monthlyTotal.toFixed(2)}`;
        document.getElementById('avgDaily').textContent = `₴${avgDaily.toFixed(2)}`;
    }

    getExpensesInPeriod(startDate, endDate = new Date()) {
        return this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    }

    changePeriod(period) {
        this.currentPeriod = period;
        
        // Update active button
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-period="${period}"]`).classList.add('active');
        
        this.renderCharts();
    }

    renderCharts() {
        this.renderCategoryChart();
        this.renderTimeChart();
    }

    renderCategoryChart() {
        const ctx = document.getElementById('categoryChart').getContext('2d');
        
        // Clear existing chart
        if (window.categoryChartInstance) {
            window.categoryChartInstance.destroy();
        }

        const periodExpenses = this.getExpensesForPeriod();
        const categoryTotals = {};

        periodExpenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const labels = Object.keys(categoryTotals).map(cat => this.getCategoryName(cat));
        const data = Object.values(categoryTotals);
        const colors = Object.keys(categoryTotals).map(cat => this.categoryColors[cat]);

        window.categoryChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#1e293b'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#cbd5e1',
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                }
            }
        });
    }

    renderTimeChart() {
        const ctx = document.getElementById('timeChart').getContext('2d');
        
        // Clear existing chart
        if (window.timeChartInstance) {
            window.timeChartInstance.destroy();
        }

        const periodExpenses = this.getExpensesForPeriod();
        const timeData = this.groupExpensesByTime(periodExpenses);

        window.timeChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: timeData.labels,
                datasets: [{
                    label: 'Витрати (₴)',
                    data: timeData.values,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        }
                    },
                    x: {
                        grid: {
                            color: '#374151'
                        },
                        ticks: {
                            color: '#cbd5e1'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5e1'
                        }
                    }
                }
            }
        });
    }

    getExpensesForPeriod() {
        const now = new Date();
        let startDate;

        switch (this.currentPeriod) {
            case 'week':
                startDate = new Date(now.setDate(now.getDate() - 7));
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        return this.getExpensesInPeriod(startDate);
    }

    groupExpensesByTime(expenses) {
        const grouped = {};
        const labels = [];
        const values = [];

        expenses.forEach(expense => {
            const date = new Date(expense.date);
            let key;

            if (this.currentPeriod === 'week') {
                key = date.toLocaleDateString('uk-UA', { weekday: 'short' });
            } else if (this.currentPeriod === 'month') {
                key = date.getDate().toString();
            } else {
                key = date.toLocaleDateString('uk-UA', { month: 'short' });
            }

            grouped[key] = (grouped[key] || 0) + expense.amount;
        });

        Object.keys(grouped).forEach(key => {
            labels.push(key);
            values.push(grouped[key]);
        });

        return { labels, values };
    }

    generateTips() {
        const container = document.getElementById('tipsContainer');
        const tips = this.getTipsBasedOnSpending();

        container.innerHTML = tips.map(tip => `
            <div class="tip-card ${tip.type}">
                <h4>${tip.title}</h4>
                <p>${tip.content}</p>
            </div>
        `).join('');
    }

    getTipsBasedOnSpending() {
        const tips = [];
        const monthlyExpenses = this.getExpensesForPeriod();
        const categoryTotals = {};

        monthlyExpenses.forEach(expense => {
            categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
        });

        const totalSpent = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        const avgDaily = totalSpent / 30;

        // High spending categories
        const highestCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b
        );

        if (categoryTotals[highestCategory] > totalSpent * 0.4) {
            tips.push({
                type: 'warning',
                title: 'Висока витрата на категорію',
                content: `Категорія "${this.getCategoryName(highestCategory)}" займає ${Math.round(categoryTotals[highestCategory]/totalSpent*100)}% від загальних витрат. Спробуйте оптимізувати витрати в цій категорії.`
            });
        }

        // Food savings tips
        if (categoryTotals.food > totalSpent * 0.3) {
            tips.push({
                type: 'info',
                title: 'Економія на їжі',
                content: 'Готуйте вдома частіше, плануйте меню на тиждень та купуйте продукти зі списком. Це може заощадити до 30% витрат на їжу.'
            });
        }

        // Transport tips
        if (categoryTotals.transport > totalSpent * 0.2) {
            tips.push({
                type: 'info',
                title: 'Оптимізація транспорту',
                content: 'Розгляньте можливість використання громадського транспорту, велосипеда або спільних поїздок. Об\'єднайте кілька справ в одну поїздку.'
            });
        }

        // General tips
        tips.push({
            type: 'success',
            title: 'Правило 50/30/20',
            content: '50% доходу на необхідні витрати, 30% на бажання, 20% на заощадження. Перевірте, чи відповідають ваші витрати цьому правилу.'
        });

        if (avgDaily > 500) {
            tips.push({
                type: 'warning',
                title: 'Високі щоденні витрати',
                content: `Ваші щоденні витрати складають ₴${avgDaily.toFixed(2)}. Спробуйте встановити денний ліміт витрат та відстежуйте їх протягом дня.`
            });
        }

        return tips;
    }

    addGoal() {
        const amount = parseFloat(document.getElementById('savingsGoal').value);
        const period = document.getElementById('goalPeriod').value;

        if (!amount || amount <= 0) {
            alert('Введіть коректну суму для економії');
            return;
        }

        const goal = {
            id: Date.now(),
            amount,
            period,
            created: new Date().toISOString(),
            progress: 0
        };

        this.goals.push(goal);
        this.saveData();
        this.renderGoals();
        
        document.getElementById('savingsGoal').value = '';
        this.showNotification('Ціль додано!', 'success');
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        
        if (this.goals.length === 0) {
            container.innerHTML = '<p style="color: var(--text-secondary);">Поки що немає цілей економії</p>';
            return;
        }

        container.innerHTML = this.goals.map(goal => {
            const progress = this.calculateGoalProgress(goal);
            return `
                <div class="goal-item">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span>Заощадити ₴${goal.amount} за ${this.getPeriodName(goal.period)}</span>
                        <button onclick="tracker.deleteGoal(${goal.id})" style="background: var(--danger-color); color: white; border: none; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="goal-progress">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                            <span style="font-size: 0.875rem; color: var(--text-secondary);">Прогрес: ${progress.percentage}%</span>
                            <span style="font-size: 0.875rem; color: var(--text-secondary);">₴${progress.saved.toFixed(2)} / ₴${goal.amount}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progress.percentage}%"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    calculateGoalProgress(goal) {
        const goalDate = new Date(goal.created);
        const now = new Date();
        
        let periodStart;
        switch (goal.period) {
            case 'month':
                periodStart = new Date(goalDate.getFullYear(), goalDate.getMonth(), 1);
                break;
            case 'quarter':
                periodStart = new Date(goalDate.getFullYear(), Math.floor(goalDate.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                periodStart = new Date(goalDate.getFullYear(), 0, 1);
                break;
        }

        const periodExpenses = this.getExpensesInPeriod(periodStart);
        const spent = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Calculate theoretical spending without this goal
        const daysInPeriod = this.getDaysInPeriod(goal.period);
        const daysPassed = Math.floor((now - periodStart) / (1000 * 60 * 60 * 24));
        const avgDailySpending = spent / daysPassed;
        const projectedSpending = avgDailySpending * daysInPeriod;
        
        const targetSpending = projectedSpending - goal.amount;
        const saved = Math.max(0, projectedSpending - spent);
        const percentage = Math.min(100, Math.round((saved / goal.amount) * 100));

        return { saved, percentage };
    }

    deleteGoal(id) {
        this.goals = this.goals.filter(goal => goal.id !== id);
        this.saveData();
        this.renderGoals();
        this.showNotification('Ціль видалено', 'info');
    }

    getDaysInPeriod(period) {
        const now = new Date();
        switch (period) {
            case 'month':
                return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            case 'quarter':
                return 90;
            case 'year':
                return 365;
            default:
                return 30;
        }
    }

    getPeriodName(period) {
        const names = {
            month: 'місяць',
            quarter: 'квартал',
            year: 'рік'
        };
        return names[period] || period;
    }

    getCategoryName(category) {
        const names = {
            food: 'Їжа',
            transport: 'Транспорт',
            utilities: 'Комунальні',
            entertainment: 'Розваги',
            clothing: 'Одяг',
            health: 'Здоров\'я',
            education: 'Освіта',
            other: 'Інше'
        };
        return names[category] || category;
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('uk-UA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    clearForm() {
        document.getElementById('expenseForm').reset();
        this.setTodayDate();
    }

    saveData() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('goals', JSON.stringify(this.goals));
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'warning' ? 'var(--warning-color)' : 'var(--info-color)'};
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        notification.textContent = message;
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the app
const tracker = new ExpenseTracker();

