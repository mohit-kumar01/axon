// Email Scanner functionality
class EmailScanner {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.setupEmailForm();
        this.setupIOCSearch();
    }

    setupEmailForm() {
        const form = document.getElementById('email-scan-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.scanEmail();
        });
    }

    setupIOCSearch() {
        const searchBtn = document.getElementById('ioc-search-btn');
        const input = document.getElementById('ioc-input');
        
        if (searchBtn && input) {
            searchBtn.addEventListener('click', () => this.searchIOC());
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchIOC();
                }
            });
        }
    }

    async scanEmail() {
        const senderEmail = document.getElementById('sender-email').value;
        const subject = document.getElementById('email-subject').value;
        const body = document.getElementById('email-body').value;

        if (!senderEmail || !subject || !body) {
            this.app.showAlert('Error', 'Please fill in all fields');
            return;
        }

        const emailData = {
            sender_email: senderEmail,
            subject: subject,
            body: body,
            headers: {}
        };

        try {
            this.app.showLoading();
            
            const response = await fetch(`${this.app.fileServiceBase}/scan/email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayEmailResults(result);
            this.app.loadRecentEmailScans();

        } catch (error) {
            console.error('Email scan failed:', error);
            this.app.showAlert('Scan Failed', error.message || 'Failed to scan email');
        } finally {
            this.app.hideLoading();
        }
    }

    displayEmailResults(result) {
        const container = document.getElementById('email-results');
        if (!container) return;

        const threatClass = result.is_phishing ? 'threat' : 'clean';
        const statusText = result.is_phishing ? 'PHISHING DETECTED' : 'EMAIL IS CLEAN';
        const confidenceClass = this.app.getConfidenceClass(result.confidence_score);
        const threatLevelClass = this.app.getThreatLevelClass(result.threat_level);

        const resultHTML = `
            <div class="scan-result ${threatClass}">
                <div class="result-header">
                    <div class="result-title">${statusText}</div>
                    <div class="confidence-score ${confidenceClass}">${result.confidence_score}%</div>
                </div>
                
                <div class="result-details">
                    <p><strong>Sender:</strong> ${result.sender_email}</p>
                    <p><strong>Subject:</strong> ${result.subject}</p>
                    <p><strong>Threat Level:</strong> 
                        <span class="threat-badge ${threatLevelClass}">${result.threat_level.toUpperCase()}</span>
                    </p>
                    <p><strong>URLs Found:</strong> ${result.urls_found || 0}</p>
                    <p><strong>Scan Time:</strong> ${result.processing_time}s</p>
                </div>

                ${result.indicators && result.indicators.length > 0 ? `
                    <div class="result-indicators">
                        <h4>Suspicious Indicators:</h4>
                        <div class="indicators-list">
                            ${result.indicators.map(indicator => 
                                `<span class="indicator-tag">${indicator}</span>`
                            ).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="result-recommendations">
                    <h4>Recommendations:</h4>
                    <ul>
                        ${result.is_phishing ? 
                            `<li>Do not click any links in this email</li>
                             <li>Do not download any attachments</li>
                             <li>Report this email as phishing</li>
                             <li>Delete this email immediately</li>` : 
                            `<li>Email appears to be legitimate</li>
                             <li>Still exercise caution with links and attachments</li>`
                        }
                    </ul>
                </div>
            </div>
        `;

        container.innerHTML = resultHTML;
        container.scrollIntoView({ behavior: 'smooth' });
    }

    async showDetailedAnalysis(resultId) {
        // In a real application, fetch detailed analysis from the server
        this.app.showAlert('Detailed Analysis', 'Detailed analysis view would show comprehensive scan results including header analysis, URL analysis, and ML model insights.');
    }

    async reportPhishing(resultId) {
        try {
            const response = await this.app.apiRequest('/email/report-phishing', {
                method: 'POST',
                body: JSON.stringify({ email_id: resultId, is_false_positive: false })
            });

            if (response.success) {
                this.app.showAlert('Thank You', 'Your feedback has been recorded and will help improve our detection accuracy.');
            }
        } catch (error) {
            this.app.showAlert('Error', 'Failed to submit feedback');
        }
    }

    async reportFalsePositive(resultId) {
        try {
            const response = await this.app.apiRequest('/email/report-phishing', {
                method: 'POST',
                body: JSON.stringify({ email_id: resultId, is_false_positive: true })
            });

            if (response.success) {
                this.app.showAlert('Thank You', 'Your feedback has been recorded and will help improve our detection accuracy.');
            }
        } catch (error) {
            this.app.showAlert('Error', 'Failed to submit feedback');
        }
    }

    async searchIOC() {
        const input = document.getElementById('ioc-input');
        const resultsContainer = document.getElementById('ioc-results');
        
        if (!input || !resultsContainer) return;

        const ioc = input.value.trim();
        if (!ioc) {
            this.app.showAlert('Error', 'Please enter an IOC to search');
            return;
        }

        try {
            resultsContainer.innerHTML = '<p>Searching...</p>';

            // Determine IOC type
            let endpoint = '/file/hash/';
            if (this.isValidHash(ioc)) {
                endpoint = `/file/hash/${ioc}`;
            } else if (this.isValidDomain(ioc)) {
                // For demo purposes, use hash endpoint
                endpoint = `/file/hash/${ioc}`;
            } else if (this.isValidIP(ioc)) {
                // For demo purposes, use hash endpoint
                endpoint = `/file/hash/${ioc}`;
            }

            const response = await this.app.apiRequest(endpoint);

            if (response.success) {
                this.displayIOCResults(ioc, response.data);
            } else {
                throw new Error(response.message || 'Search failed');
            }

        } catch (error) {
            console.error('IOC search failed:', error);
            resultsContainer.innerHTML = `
                <div class="scan-result clean">
                    <div class="result-header">
                        <div class="result-title">Search Results</div>
                    </div>
                    <div class="result-details">
                        <p>No threat intelligence found for: <strong>${ioc}</strong></p>
                        <p>This indicator appears to be clean or unknown.</p>
                    </div>
                </div>
            `;
        }
    }

    displayIOCResults(ioc, data) {
        const resultsContainer = document.getElementById('ioc-results');
        if (!resultsContainer) return;

        const threatClass = data.is_known_malware ? 'threat' : 'clean';
        const statusText = data.is_known_malware ? 'MALICIOUS' : 'CLEAN';

        const resultHTML = `
            <div class="scan-result ${threatClass}">
                <div class="result-header">
                    <div class="result-title">IOC Lookup Results</div>
                    <div class="confidence-score ${threatClass}">${statusText}</div>
                </div>
                
                <div class="result-details">
                    <p><strong>Indicator:</strong> ${ioc}</p>
                    <p><strong>Type:</strong> ${this.getIOCType(ioc)}</p>
                    <p><strong>Reputation:</strong> ${data.reputation}</p>
                    <p><strong>Status:</strong> ${data.is_known_malware ? 'Known malicious' : 'Clean/Unknown'}</p>
                </div>

                ${data.is_known_malware ? `
                    <div class="result-recommendations">
                        <h4>Recommendations:</h4>
                        <ul>
                            <li>Block this indicator in your security systems</li>
                            <li>Investigate any systems that may have interacted with this IOC</li>
                            <li>Monitor for related indicators</li>
                        </ul>
                    </div>
                ` : `
                    <div class="result-recommendations">
                        <h4>Recommendations:</h4>
                        <ul>
                            <li>No immediate action required</li>
                            <li>Continue monitoring as part of regular security practices</li>
                        </ul>
                    </div>
                `}
            </div>
        `;

        resultsContainer.innerHTML = resultHTML;
    }

    // Utility functions
    isValidHash(value) {
        // Check for MD5, SHA1, SHA256 formats
        return /^[a-fA-F0-9]{32}$/.test(value) || 
               /^[a-fA-F0-9]{40}$/.test(value) || 
               /^[a-fA-F0-9]{64}$/.test(value);
    }

    isValidDomain(value) {
        const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)*[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
        return domainRegex.test(value);
    }

    isValidIP(value) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipRegex.test(value);
    }

    getIOCType(value) {
        if (this.isValidHash(value)) {
            if (value.length === 32) return 'MD5 Hash';
            if (value.length === 40) return 'SHA1 Hash';
            if (value.length === 64) return 'SHA256 Hash';
        }
        if (this.isValidDomain(value)) return 'Domain';
        if (this.isValidIP(value)) return 'IP Address';
        return 'Unknown';
    }
}

// Initialize email scanner when DOM is loaded
// Initialize email scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.AXONApp) {
        window.emailScanner = new EmailScanner(window.AXONApp);
    }
});
