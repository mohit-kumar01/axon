// File Scanner functionality
class FileScanner {
    constructor(app) {
        this.app = app;
        this.selectedFiles = [];
        this.init();
    }

    init() {
        this.setupFileUpload();
        this.setupScanButton();
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('file-upload-area');
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.querySelector('.browse-btn');

        if (!uploadArea || !fileInput) return;

        // Handle browse button click
        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        // Handle file input change
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Handle drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFiles(e.dataTransfer.files);
        });

        // Handle click on upload area
        uploadArea.addEventListener('click', (e) => {
            if (e.target === uploadArea || e.target.tagName === 'P' || e.target.tagName === 'I') {
                fileInput.click();
            }
        });
    }

    setupScanButton() {
        const scanBtn = document.getElementById('scan-files-btn');
        if (!scanBtn) return;

        scanBtn.addEventListener('click', () => {
            this.scanFiles();
        });
    }

    handleFiles(files) {
        const fileArray = Array.from(files);
        
        // Add new files to the selected files array
        fileArray.forEach(file => {
            // Check if file is already selected
            const exists = this.selectedFiles.some(f => 
                f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
            );
            
            if (!exists) {
                this.selectedFiles.push(file);
            }
        });

        this.updateFileList();
        this.updateScanButton();
    }

    updateFileList() {
        const fileList = document.getElementById('file-list');
        if (!fileList) return;

        if (this.selectedFiles.length === 0) {
            fileList.innerHTML = '';
            return;
        }

        const filesHTML = this.selectedFiles.map((file, index) => `
            <div class="file-item" data-index="${index}">
                <div class="file-info">
                    <i class="fas fa-file file-icon"></i>
                    <div class="file-details">
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.app.formatFileSize(file.size)}</div>
                    </div>
                </div>
                <button class="file-remove" onclick="fileScanner.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        fileList.innerHTML = filesHTML;
    }

    removeFile(index) {
        this.selectedFiles.splice(index, 1);
        this.updateFileList();
        this.updateScanButton();
    }

    updateScanButton() {
        const scanBtn = document.getElementById('scan-files-btn');
        if (!scanBtn) return;

        if (this.selectedFiles.length > 0) {
            scanBtn.disabled = false;
            scanBtn.innerHTML = `
                <i class="fas fa-search"></i>
                Scan ${this.selectedFiles.length} File${this.selectedFiles.length > 1 ? 's' : ''}
            `;
        } else {
            scanBtn.disabled = true;
            scanBtn.innerHTML = `
                <i class="fas fa-search"></i>
                Scan Files
            `;
        }
    }

    async scanFiles() {
        if (this.selectedFiles.length === 0) {
            this.app.showAlert('Error', 'Please select files to scan');
            return;
        }

        try {
            this.app.showLoading();

            // Scan files one by one for better UX
            const results = [];
            
            for (let i = 0; i < this.selectedFiles.length; i++) {
                const file = this.selectedFiles[i];
                const result = await this.scanSingleFile(file);
                results.push(result);
                
                // Update progress
                const progress = Math.round(((i + 1) / this.selectedFiles.length) * 100);
                this.updateScanProgress(progress);
            }

            this.displayFileResults(results);
            this.app.loadRecentFileScans();

            // Clear selected files after successful scan
            this.selectedFiles = [];
            this.updateFileList();
            this.updateScanButton();

        } catch (error) {
            console.error('File scan failed:', error);
            this.app.showAlert('Scan Failed', error.message || 'Failed to scan files');
        } finally {
            this.app.hideLoading();
        }
    }

    async scanSingleFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.app.fileServiceBase}/scan/attachment`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Convert backend response format to frontend expected format
        return {
            filename: data.filename,
            is_malware: data.status === 'ThreatFound',
            confidence_score: Math.round(data.score * 4), // Convert 0-25 scale to 0-100 scale
            file_size: file.size,
            file_type: file.type || 'Unknown',
            file_hash: data.details?.file_hash || 'N/A',
            threat_level: data.status === 'ThreatFound' ? 'high' : 'low',
            malware_family: data.details?.matched_rules?.join(', ') || null,
            processing_time: 1.0, // Approximate
            indicators: data.details?.matched_rules || [],
            recommendations: data.status === 'ThreatFound' ? 
                ['Do not open this file', 'Delete immediately', 'Run full system scan'] : 
                ['File appears to be clean']
        };
    }

    updateScanProgress(progress) {
        const loadingOverlay = document.getElementById('loading-overlay');
        const progressText = loadingOverlay.querySelector('p');
        
        if (progressText) {
            progressText.textContent = `Scanning files... ${progress}%`;
        }
    }

    displayFileResults(results) {
        const container = document.getElementById('file-results');
        if (!container) return;

        const resultsHTML = results.map(result => {
            const threatClass = result.is_malware ? 'threat' : 'clean';
            const statusText = result.is_malware ? 'MALWARE DETECTED' : 'FILE IS CLEAN';
            const confidenceClass = this.app.getConfidenceClass(result.confidence_score);
            const threatLevelClass = this.app.getThreatLevelClass(result.threat_level);

            return `
                <div class="scan-result ${threatClass}">
                    <div class="result-header">
                        <div class="result-title">${statusText}</div>
                        <div class="confidence-score ${confidenceClass}">${result.confidence_score}%</div>
                    </div>
                    
                    <div class="result-details">
                        <p><strong>Filename:</strong> ${result.filename}</p>
                        <p><strong>File Size:</strong> ${this.app.formatFileSize(result.file_size)}</p>
                        <p><strong>File Type:</strong> ${result.file_type}</p>
                        <p><strong>SHA256:</strong> <code>${result.file_hash}</code></p>
                        <p><strong>Threat Level:</strong> 
                            <span class="threat-badge ${threatLevelClass}">${result.threat_level.toUpperCase()}</span>
                        </p>
                        ${result.malware_family ? `<p><strong>Malware Family:</strong> ${result.malware_family}</p>` : ''}
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

                    ${result.recommendations && result.recommendations.length > 0 ? `
                        <div class="result-recommendations">
                            <h4>Recommendations:</h4>
                            <ul>
                                ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    <div class="result-actions">
                        <button class="btn-secondary" onclick="fileScanner.showDetailedAnalysis('${result.id}')">
                            View Detailed Analysis
                        </button>
                        <button class="btn-info" onclick="fileScanner.lookupHash('${result.file_hash}')">
                            Lookup Hash
                        </button>
                        ${result.is_malware ? `
                            <button class="btn-warning" onclick="fileScanner.reportFalsePositive('${result.id}')">
                                Report False Positive
                            </button>
                        ` : `
                            <button class="btn-danger" onclick="fileScanner.reportMalware('${result.id}')">
                                Report as Malware
                            </button>
                        `}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = resultsHTML;
    }

    async showDetailedAnalysis(resultId) {
        // In a real application, fetch detailed analysis from the server
        this.app.showAlert('Detailed Analysis', 'Detailed analysis view would show comprehensive scan results including PE analysis, entropy analysis, YARA matches, and behavioral indicators.');
    }

    async lookupHash(hash) {
        try {
            const response = await this.app.apiRequest(`/file/hash/${hash}`);
            
            if (response.success) {
                const data = response.data;
                const statusText = data.is_known_malware ? 'Known Malware' : 'Clean/Unknown';
                const message = `Hash Lookup Results:\n\nHash: ${hash}\nStatus: ${statusText}\nReputation: ${data.reputation}`;
                
                this.app.showAlert('Hash Lookup', message);
            }
        } catch (error) {
            this.app.showAlert('Error', 'Failed to lookup hash');
        }
    }

    async reportMalware(resultId) {
        try {
            const response = await this.app.apiRequest('/file/report-malware', {
                method: 'POST',
                body: JSON.stringify({ file_id: resultId, is_false_positive: false })
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
            const response = await this.app.apiRequest('/file/report-malware', {
                method: 'POST',
                body: JSON.stringify({ file_id: resultId, is_false_positive: true })
            });

            if (response.success) {
                this.app.showAlert('Thank You', 'Your feedback has been recorded and will help improve our detection accuracy.');
            }
        } catch (error) {
            this.app.showAlert('Error', 'Failed to submit feedback');
        }
    }

    // File type detection and icon assignment
    getFileIcon(filename) {
        const extension = filename.split('.').pop().toLowerCase();
        
        const iconMap = {
            // Archives
            'zip': 'fa-file-archive',
            'rar': 'fa-file-archive',
            '7z': 'fa-file-archive',
            'tar': 'fa-file-archive',
            'gz': 'fa-file-archive',
            
            // Executables
            'exe': 'fa-file-code',
            'msi': 'fa-file-code',
            'dll': 'fa-file-code',
            'bat': 'fa-file-code',
            'cmd': 'fa-file-code',
            'com': 'fa-file-code',
            'scr': 'fa-file-code',
            
            // Documents
            'pdf': 'fa-file-pdf',
            'doc': 'fa-file-word',
            'docx': 'fa-file-word',
            'xls': 'fa-file-excel',
            'xlsx': 'fa-file-excel',
            'ppt': 'fa-file-powerpoint',
            'pptx': 'fa-file-powerpoint',
            
            // Images
            'jpg': 'fa-file-image',
            'jpeg': 'fa-file-image',
            'png': 'fa-file-image',
            'gif': 'fa-file-image',
            'bmp': 'fa-file-image',
            'svg': 'fa-file-image',
            
            // Videos
            'mp4': 'fa-file-video',
            'avi': 'fa-file-video',
            'mkv': 'fa-file-video',
            'mov': 'fa-file-video',
            'wmv': 'fa-file-video',
            
            // Audio
            'mp3': 'fa-file-audio',
            'wav': 'fa-file-audio',
            'flac': 'fa-file-audio',
            'aac': 'fa-file-audio',
            
            // Text/Code
            'txt': 'fa-file-alt',
            'js': 'fa-file-code',
            'html': 'fa-file-code',
            'css': 'fa-file-code',
            'json': 'fa-file-code',
            'xml': 'fa-file-code',
            'py': 'fa-file-code',
            'java': 'fa-file-code',
            'cpp': 'fa-file-code',
            'c': 'fa-file-code',
        };
        
        return iconMap[extension] || 'fa-file';
    }

    // File validation
    isValidFileType(file) {
        // In a production environment, you might want to restrict certain file types
        // For this demo, we'll allow most files but warn about potentially dangerous ones
        
        const dangerousExtensions = [
            'exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'vbs', 'js', 'jar', 'msi'
        ];
        
        const extension = file.name.split('.').pop().toLowerCase();
        
        if (dangerousExtensions.includes(extension)) {
            console.warn(`Potentially dangerous file type: ${extension}`);
            // In production, you might want to show a warning or request additional confirmation
        }
        
        return true; // Allow all files for demo purposes
    }

    // File size validation
    isValidFileSize(file) {
        const maxSize = 100 * 1024 * 1024; // 100MB limit
        
        if (file.size > maxSize) {
            this.app.showAlert('File Too Large', `File "${file.name}" is too large. Maximum size is 100MB.`);
            return false;
        }
        
        return true;
    }
}

// Initialize file scanner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.AXONApp) {
        window.fileScanner = new FileScanner(window.AXONApp);
    }
});
