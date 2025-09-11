// Dashboard functionality
class Dashboard {
    constructor(app) {
        this.app = app;
        this.charts = {};
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.setupAutoRefresh();
        this.loadDashboardData();
    }

    setupAutoRefresh() {
        // Refresh dashboard data every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (this.app.currentSection === 'dashboard') {
                this.loadDashboardData();
            }
        }, 30000);
    }

    async loadDashboardData() {
        try {
            await Promise.all([
                this.loadStatistics(),
                this.loadRecentActivity(),
                this.loadThreatTrends(),
                this.loadSystemHealth(),
                this.loadActiveAlerts()
            ]);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        }
    }

    async loadStatistics() {
        try {
            const response = await this.app.apiRequest('/dashboard/stats');
            if (response.success) {
                this.updateStatistics(response.data);
            }
        } catch (error) {
            console.error('Failed to load statistics:', error);
        }
    }

    updateStatistics(stats) {
        // Update stat cards
        this.animateCounter('total-email-scans', stats.total_email_scans || 0);
        this.animateCounter('total-file-scans', stats.total_file_scans || 0);
        this.animateCounter('phishing-detected', stats.phishing_detected || 0);
        this.animateCounter('malware-detected', stats.malware_detected || 0);

        // Update additional metrics if available
        if (stats.detection_rate) {
            this.updateDetectionRates(stats.detection_rate);
        }

        if (stats.recent_email_scans !== undefined || stats.recent_file_scans !== undefined) {
            this.updateRecentActivityCounts(stats.recent_email_scans || 0, stats.recent_file_scans || 0);
        }
    }

    animateCounter(elementId, targetValue) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const currentValue = parseInt(element.textContent) || 0;
        const increment = Math.ceil((targetValue - currentValue) / 20);
        
        if (increment === 0) return;

        const timer = setInterval(() => {
            const current = parseInt(element.textContent) || 0;
            const newValue = current + increment;
            
            if ((increment > 0 && newValue >= targetValue) || 
                (increment < 0 && newValue <= targetValue)) {
                element.textContent = targetValue.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = newValue.toLocaleString();
            }
        }, 50);
    }

    updateDetectionRates(rates) {
        // Add detection rate indicators to stat cards
        const emailCard = document.getElementById('total-email-scans')?.closest('.stat-card');
        const fileCard = document.getElementById('total-file-scans')?.closest('.stat-card');

        if (emailCard && rates.phishing !== undefined) {
            this.addDetectionRate(emailCard, rates.phishing, 'phishing');
        }

        if (fileCard && rates.malware !== undefined) {
            this.addDetectionRate(fileCard, rates.malware, 'malware');
        }
    }

    addDetectionRate(cardElement, rate, type) {
        const existing = cardElement.querySelector('.detection-rate');
        if (existing) {
            existing.remove();
        }

        const rateElement = document.createElement('div');
        rateElement.className = 'detection-rate';
        rateElement.innerHTML = `<small>${rate}% ${type} detected</small>`;
        
        const contentElement = cardElement.querySelector('.stat-content');
        if (contentElement) {
            contentElement.appendChild(rateElement);
        }
    }

    updateRecentActivityCounts(emailScans, fileScans) {
        // This could update a "Recent Activity" summary
        console.log(`Recent activity: ${emailScans} email scans, ${fileScans} file scans`);
    }

    async loadRecentActivity() {
        try {
            const response = await this.app.apiRequest('/dashboard/recent-activity?limit=10');
            if (response.success) {
                this.updateRecentActivity(response.data);
            }
        } catch (error) {
            console.error('Failed to load recent activity:', error);
            this.showEmptyActivity();
        }
    }

    updateRecentActivity(activities) {
        const container = document.getElementById('recent-activity');
        if (!container) return;

        if (!activities || activities.length === 0) {
            this.showEmptyActivity();
            return;
        }

        const activityHTML = activities.map(activity => {
            const threatClass = activity.threat_detected ? 'high' : 'low';
            const threatText = activity.threat_detected ? 'THREAT' : 'CLEAN';
            const timeAgo = this.app.timeAgo(new Date(activity.timestamp));
            const icon = activity.scan_type === 'email' ? 'fa-envelope' : 'fa-file';

            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas ${icon}"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-type">${activity.scan_type.toUpperCase()} Scan</div>
                        <div class="activity-description">${activity.details}</div>
                        <div class="activity-time">${timeAgo}</div>
                    </div>
                    <div class="activity-status">
                        <span class="threat-badge ${threatClass}">${threatText}</span>
                        <div class="confidence-score ${this.app.getConfidenceClass(activity.confidence_score)}">
                            ${activity.confidence_score}%
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = activityHTML;
    }

    showEmptyActivity() {
        const container = document.getElementById('recent-activity');
        if (container) {
            container.innerHTML = `
                <div class="no-activity">
                    <i class="fas fa-chart-line"></i>
                    <p>No recent activity</p>
                    <small>Scan some emails or files to see activity here</small>
                </div>
            `;
        }
    }

    async loadThreatTrends() {
        try {
            const response = await this.app.apiRequest('/dashboard/threat-trends?days=7');
            if (response.success) {
                this.updateThreatChart(response.data);
            }
        } catch (error) {
            console.error('Failed to load threat trends:', error);
            this.showEmptyChart();
        }
    }

    updateThreatChart(trends) {
        const ctx = document.getElementById('threatChart');
        if (!ctx) return;

        // Destroy existing chart
        if (this.charts.threatChart) {
            this.charts.threatChart.destroy();
        }

        const labels = trends.map(trend => {
            const date = new Date(trend.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        this.charts.threatChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Email Scans',
                        data: trends.map(t => t.email_scans || 0),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'File Scans',
                        data: trends.map(t => t.file_scans || 0),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Threats Detected',
                        data: trends.map(t => (t.phishing_detected || 0) + (t.malware_detected || 0)),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                aspectRatio: window.innerWidth < 768 ? 1.5 : 2.5,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: window.innerWidth < 768 ? 10 : 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                layout: {
                    padding: {
                        top: 10,
                        bottom: 10
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            maxTicksLimit: window.innerWidth < 768 ? 4 : 5,
                            font: {
                                size: window.innerWidth < 768 ? 10 : 12
                            }
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            maxRotation: 0,
                            font: {
                                size: window.innerWidth < 768 ? 10 : 12
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    showEmptyChart() {
        const chartContainer = document.querySelector('.chart-container');
        if (chartContainer) {
            const canvas = chartContainer.querySelector('canvas');
            if (canvas) {
                canvas.style.display = 'none';
            }
            
            const emptyState = chartContainer.querySelector('.empty-chart') || 
                              document.createElement('div');
            emptyState.className = 'empty-chart';
            emptyState.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-chart-line"></i>
                    <p>No trend data available</p>
                    <small>Trends will appear as you scan more content</small>
                </div>
            `;
            
            if (!chartContainer.querySelector('.empty-chart')) {
                chartContainer.appendChild(emptyState);
            }
        }
    }

    async loadSystemHealth() {
        try {
            const response = await this.app.apiRequest('/dashboard/system-health');
            if (response.success) {
                this.updateSystemHealth(response.data);
            }
        } catch (error) {
            console.error('Failed to load system health:', error);
            this.showSystemHealthError();
        }
    }

    updateSystemHealth(healthData) {
        if (!healthData.services) return;

        Object.entries(healthData.services).forEach(([serviceName, serviceData]) => {
            this.updateServiceStatus(serviceName, serviceData);
        });

        // Update performance metrics if available
        if (healthData.performance_metrics) {
            this.updatePerformanceMetrics(healthData.performance_metrics);
        }
    }

    updateServiceStatus(serviceName, serviceData) {
        const healthItems = document.querySelectorAll('.health-item');
        
        healthItems.forEach(item => {
            const span = item.querySelector('span');
            if (span && span.textContent.toLowerCase().includes(serviceName.replace('_', ' '))) {
                const indicator = item.querySelector('.status-indicator');
                if (indicator) {
                    // Remove existing status classes
                    indicator.classList.remove('running', 'warning', 'error');
                    
                    // Add appropriate status class
                    switch (serviceData.status) {
                        case 'running':
                        case 'connected':
                            indicator.classList.add('running');
                            break;
                        case 'warning':
                            indicator.classList.add('warning');
                            break;
                        case 'error':
                        case 'disconnected':
                            indicator.classList.add('error');
                            break;
                    }
                    
                    // Update tooltip with response time
                    if (serviceData.response_time) {
                        indicator.title = `Response time: ${serviceData.response_time}s`;
                    }
                }
            }
        });
    }

    updatePerformanceMetrics(metrics) {
        // This could create a separate performance metrics display
        console.log('Performance metrics:', metrics);
        
        // You could add CPU, memory, disk usage displays here
        if (metrics.cpu_usage > 80) {
            this.showPerformanceAlert('CPU usage is high', 'warning');
        }
        
        if (metrics.memory_usage > 90) {
            this.showPerformanceAlert('Memory usage is critical', 'error');
        }
    }

    showPerformanceAlert(message, type) {
        // This could show performance alerts in the UI
        console.warn(`Performance alert (${type}): ${message}`);
    }

    showSystemHealthError() {
        const healthContainer = document.querySelector('.health-container');
        if (healthContainer) {
            const errorElement = document.createElement('div');
            errorElement.className = 'health-error';
            errorElement.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Unable to load system health data</p>
                </div>
            `;
            
            if (!healthContainer.querySelector('.health-error')) {
                healthContainer.appendChild(errorElement);
            }
        }
    }

    async loadActiveAlerts() {
        try {
            const response = await this.app.apiRequest('/dashboard/alerts');
            if (response.success) {
                this.updateActiveAlerts(response.data);
            }
        } catch (error) {
            console.error('Failed to load active alerts:', error);
        }
    }

    updateActiveAlerts(alerts) {
        if (!alerts || alerts.length === 0) return;

        // Show alerts in a notification area or modal
        const criticalAlerts = alerts.filter(alert => 
            alert.severity === 'critical' || alert.severity === 'high'
        );

        if (criticalAlerts.length > 0) {
            this.showCriticalAlerts(criticalAlerts);
        }
    }

    showCriticalAlerts(alerts) {
        // Create alerts notification
        const alertsContainer = document.getElementById('alerts-container') || 
                               this.createAlertsContainer();

        const alertsHTML = alerts.map(alert => `
            <div class="alert-item ${alert.severity}">
                <div class="alert-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <div class="alert-content">
                    <h4>${alert.title}</h4>
                    <p>${alert.description}</p>
                    <small>${this.app.timeAgo(new Date(alert.timestamp))}</small>
                </div>
                <div class="alert-actions">
                    <button class="btn-small" onclick="dashboard.dismissAlert('${alert.id}')">
                        Dismiss
                    </button>
                </div>
            </div>
        `).join('');

        alertsContainer.innerHTML = alertsHTML;
        alertsContainer.style.display = 'block';
    }

    createAlertsContainer() {
        const container = document.createElement('div');
        container.id = 'alerts-container';
        container.className = 'alerts-container';
        
        // Add to dashboard or create floating alerts
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.appendChild(container);
        }
        
        return container;
    }

    async dismissAlert(alertId) {
        try {
            // In a real application, this would mark the alert as resolved
            console.log(`Dismissing alert: ${alertId}`);
            
            // Remove alert from UI
            const alertElement = document.querySelector(`[data-alert-id="${alertId}"]`);
            if (alertElement) {
                alertElement.remove();
            }
        } catch (error) {
            console.error('Failed to dismiss alert:', error);
        }
    }

    // Cleanup
    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.cyberGuardApp) {
        window.dashboard = new Dashboard(window.cyberGuardApp);
    }
});
