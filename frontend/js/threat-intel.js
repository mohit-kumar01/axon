// Threat Intelligence functionality
class ThreatIntelligence {
    constructor(app) {
        this.app = app;
        this.init();
    }

    init() {
        this.setupIOCSearch();
        this.setupURLAnalysis();
        this.loadTopThreats();
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

    setupURLAnalysis() {
        // Add URL analysis form if it doesn't exist
        const iocSearch = document.querySelector('.ioc-search');
        if (iocSearch && !document.getElementById('url-analysis')) {
            const urlAnalysisHTML = `
                <div class="url-analysis" id="url-analysis">
                    <h3>URL Analysis</h3>
                    <div class="analysis-container">
                        <div class="url-input-section">
                            <div class="form-group">
                                <label for="url-input">URL to Analyze</label>
                                <input type="url" id="url-input" placeholder="https://example.com/suspicious-link">
                                <button id="analyze-url-btn" class="btn-primary">
                                    <i class="fas fa-search"></i>
                                    Analyze URL
                                </button>
                            </div>
                        </div>
                        
                        <div class="text-analysis-section">
                            <div class="form-group">
                                <label for="text-input">Text Content (Extract & Analyze URLs)</label>
                                <textarea id="text-input" rows="4" placeholder="Paste email content or text with URLs here..."></textarea>
                                <button id="analyze-text-btn" class="btn-secondary">
                                    <i class="fas fa-text-width"></i>
                                    Extract & Analyze URLs
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="url-analysis-results" class="analysis-results">
                        <!-- Analysis results will appear here -->
                    </div>
                </div>
            `;
            iocSearch.insertAdjacentHTML('afterend', urlAnalysisHTML);
            
            // Setup event listeners for new elements
            const analyzeUrlBtn = document.getElementById('analyze-url-btn');
            const analyzeTextBtn = document.getElementById('analyze-text-btn');
            const urlInput = document.getElementById('url-input');
            const textInput = document.getElementById('text-input');
            
            if (analyzeUrlBtn) {
                analyzeUrlBtn.addEventListener('click', () => this.analyzeURL());
            }
            
            if (analyzeTextBtn) {
                analyzeTextBtn.addEventListener('click', () => this.analyzeText());
            }
            
            if (urlInput) {
                urlInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.analyzeURL();
                    }
                });
            }
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
            this.app.showLoading();
            
            // Determine IOC type and search accordingly
            let endpoint;
            let iocType;
            
            if (this.isValidHash(ioc)) {
                iocType = 'File Hash';
                endpoint = `/scan/attachment`; // We'll check if this hash was scanned before
            } else if (this.isValidURL(ioc)) {
                iocType = 'URL';
                endpoint = `/analyze/url`;
            } else if (this.isValidIP(ioc)) {
                iocType = 'IP Address';
                endpoint = `/analyze/url`; // Treat as URL for now
            } else {
                iocType = 'Domain/Unknown';
                endpoint = `/analyze/url`;
            }

            // For demonstration, show search results
            this.displayIOCResults({
                ioc: ioc,
                type: iocType,
                found: Math.random() > 0.5, // Random for demo
                threat_score: Math.floor(Math.random() * 100),
                first_seen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
                last_seen: new Date().toISOString(),
                sources: ['Internal DB', 'VirusTotal', 'AlienVault']
            });

        } catch (error) {
            console.error('IOC search failed:', error);
            this.app.showAlert('Search Failed', error.message || 'Failed to search IOC');
        } finally {
            this.app.hideLoading();
        }
    }

    async analyzeURL() {
        const input = document.getElementById('url-input');
        const resultsContainer = document.getElementById('url-analysis-results');
        
        if (!input || !resultsContainer) return;
        
        const url = input.value.trim();
        if (!url) {
            this.app.showAlert('Error', 'Please enter a URL to analyze');
            return;
        }

        if (!this.isValidURL(url)) {
            this.app.showAlert('Error', 'Please enter a valid URL');
            return;
        }

        try {
            this.app.showLoading();
            
            const response = await fetch(`${this.app.urlServiceBase}/analyze/url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayURLAnalysisResults([result], 'single');

        } catch (error) {
            console.error('URL analysis failed:', error);
            this.app.showAlert('Analysis Failed', error.message || 'Failed to analyze URL');
        } finally {
            this.app.hideLoading();
        }
    }

    async analyzeText() {
        const input = document.getElementById('text-input');
        const resultsContainer = document.getElementById('url-analysis-results');
        
        if (!input || !resultsContainer) return;
        
        const text = input.value.trim();
        if (!text) {
            this.app.showAlert('Error', 'Please enter text content to analyze');
            return;
        }

        try {
            this.app.showLoading();
            
            const response = await fetch(`${this.app.urlServiceBase}/analyze/text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ text: text })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.displayTextAnalysisResults(result);

        } catch (error) {
            console.error('Text analysis failed:', error);
            this.app.showAlert('Analysis Failed', error.message || 'Failed to analyze text');
        } finally {
            this.app.hideLoading();
        }
    }

    displayIOCResults(result) {
        const container = document.getElementById('ioc-results');
        if (!container) return;

        const threatClass = result.found && result.threat_score > 50 ? 'threat' : 'clean';
        const statusText = result.found ? 'FOUND IN THREAT DATABASE' : 'NOT FOUND IN THREAT DATABASE';

        const resultHTML = `
            <div class="scan-result ${threatClass}">
                <div class="result-header">
                    <div class="result-title">${statusText}</div>
                    <div class="confidence-score ${threatClass}">${result.threat_score}%</div>
                </div>
                
                <div class="result-details">
                    <p><strong>IOC:</strong> ${result.ioc}</p>
                    <p><strong>Type:</strong> ${result.type}</p>
                    <p><strong>Threat Score:</strong> ${result.threat_score}/100</p>
                    <p><strong>First Seen:</strong> ${new Date(result.first_seen).toLocaleDateString()}</p>
                    <p><strong>Last Seen:</strong> ${new Date(result.last_seen).toLocaleDateString()}</p>
                    <p><strong>Sources:</strong> ${result.sources.join(', ')}</p>
                </div>
            </div>
        `;

        container.innerHTML = resultHTML;
    }

    displayURLAnalysisResults(results, type = 'single') {
        const container = document.getElementById('url-analysis-results');
        if (!container) return;

        if (type === 'single') {
            const result = results[0];
            const threatClass = result.is_malicious ? 'threat' : 'clean';
            const statusText = result.is_malicious ? 'MALICIOUS URL DETECTED' : 'URL APPEARS CLEAN';
            const confidenceClass = this.app.getConfidenceClass(result.confidence_score);
            const threatLevelClass = this.app.getThreatLevelClass(result.threat_level);

            const resultHTML = `
                <div class="scan-result ${threatClass}">
                    <div class="result-header">
                        <div class="result-title">${statusText}</div>
                        <div class="confidence-score ${confidenceClass}">${result.confidence_score}%</div>
                    </div>
                    
                    <div class="result-details">
                        <p><strong>URL:</strong> <a href="${result.url}" target="_blank" rel="noopener">${result.url}</a></p>
                        <p><strong>Threat Level:</strong> 
                            <span class="threat-badge ${threatLevelClass}">${result.threat_level.toUpperCase()}</span>
                        </p>
                        <p><strong>RMM Tool Detected:</strong> ${result.rmm_detected ? 'Yes' : 'No'}</p>
                        <p><strong>Analysis Time:</strong> ${result.processing_time}s</p>
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
                </div>
            `;

            container.innerHTML = resultHTML;
        }
    }

    displayTextAnalysisResults(result) {
        const container = document.getElementById('url-analysis-results');
        if (!container) return;

        const threatClass = result.high_risk_urls > 0 ? 'threat' : 'clean';
        const statusText = result.high_risk_urls > 0 ? 'HIGH-RISK URLS FOUND' : 'NO HIGH-RISK URLS DETECTED';

        let resultHTML = `
            <div class="scan-result ${threatClass}">
                <div class="result-header">
                    <div class="result-title">${statusText}</div>
                    <div class="confidence-score ${threatClass}">${Math.round(result.overall_threat_score)}%</div>
                </div>
                
                <div class="result-details">
                    <p><strong>Text Analyzed:</strong> ${result.text_analyzed} characters</p>
                    <p><strong>URLs Found:</strong> ${result.urls_found}</p>
                    <p><strong>High-Risk URLs:</strong> ${result.high_risk_urls}</p>
                    <p><strong>RMM Tools Detected:</strong> ${result.rmm_detected ? 'Yes' : 'No'}</p>
                    <p><strong>Overall Threat Score:</strong> ${Math.round(result.overall_threat_score)}%</p>
                    <p><strong>Processing Time:</strong> ${result.processing_time}s</p>
                </div>
        `;

        if (result.urls_analyzed && result.urls_analyzed.length > 0) {
            resultHTML += `
                <div class="url-breakdown">
                    <h4>Individual URL Analysis:</h4>
                    <div class="url-list">
            `;

            result.urls_analyzed.forEach(urlResult => {
                const urlThreatClass = urlResult.is_malicious ? 'threat' : 'clean';
                resultHTML += `
                    <div class="url-item ${urlThreatClass}">
                        <div class="url-header">
                            <span class="url-link">${urlResult.url}</span>
                            <span class="url-score">${urlResult.confidence_score}%</span>
                        </div>
                        ${urlResult.indicators && urlResult.indicators.length > 0 ? `
                            <div class="url-indicators">
                                ${urlResult.indicators.map(indicator => 
                                    `<span class="indicator-tag small">${indicator}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
            });

            resultHTML += `
                    </div>
                </div>
            `;
        }

        resultHTML += `</div>`;
        container.innerHTML = resultHTML;
    }

    loadTopThreats() {
        const container = document.getElementById('top-threats-list');
        if (!container) return;

        // Mock threat data for demonstration
        const threats = [
            { name: 'Phishing Campaign #2024-09', severity: 'High', count: 1247 },
            { name: 'Malicious PDF Attachments', severity: 'Medium', count: 892 },
            { name: 'Suspicious URLs', severity: 'Medium', count: 634 },
            { name: 'RMM Tool Abuse', severity: 'High', count: 421 },
            { name: 'Business Email Compromise', severity: 'Critical', count: 156 }
        ];

        const threatsHTML = threats.map(threat => `
            <div class="threat-item ${threat.severity.toLowerCase()}">
                <div class="threat-info">
                    <span class="threat-name">${threat.name}</span>
                    <span class="threat-count">${threat.count} detected</span>
                </div>
                <span class="threat-severity ${threat.severity.toLowerCase()}">${threat.severity}</span>
            </div>
        `).join('');

        container.innerHTML = threatsHTML;
    }

    // Utility functions
    isValidHash(str) {
        // Check for MD5, SHA1, SHA256 hashes
        return /^[a-fA-F0-9]{32}$/.test(str) || 
               /^[a-fA-F0-9]{40}$/.test(str) || 
               /^[a-fA-F0-9]{64}$/.test(str);
    }

    isValidURL(str) {
        try {
            new URL(str);
            return true;
        } catch {
            return false;
        }
    }

    isValidIP(str) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        return ipv4Regex.test(str) || ipv6Regex.test(str);
    }
}

// Initialize threat intelligence when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.AXONApp) {
        window.threatIntel = new ThreatIntelligence(window.AXONApp);
    }
});
