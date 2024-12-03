class QRCodeGenerator {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.loadThemePreference();
        this.loadHistory();
        this.currentType = 'url';
        this.setupQRTypes();
    }

    initializeElements() {
        this.inputFields = document.getElementById('inputFields');
        this.qrcodeDiv = document.getElementById('qrcode');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.shareBtn = document.getElementById('shareBtn');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistory');
        this.darkModeToggle = document.getElementById('darkModeToggle');
        this.foregroundColor = document.getElementById('foregroundColor');
        this.backgroundColor = document.getElementById('backgroundColor');
        this.logoUpload = document.getElementById('logoUpload');
        this.generateBtn = document.getElementById('generateBtn');
        this.history = [];

        // Define input fields for different QR types
        this.qrTypes = {
            url: {
                fields: [
                    { label: 'Website URL', type: 'url', id: 'urlInput', placeholder: 'https://aravind-6.vercel.app' }
                ],
                format: (data) => data.urlInput
            },
            email: {
                fields: [
                    { label: 'Email Address', type: 'email', id: 'emailTo', placeholder: 'aravind@example.com' },
                    { label: 'Subject', type: 'text', id: 'emailSubject', placeholder: 'Email Subject' },
                    { label: 'Message', type: 'textarea', id: 'emailBody', placeholder: 'Email Body' }
                ],
                format: (data) => `mailto:${data.emailTo}?subject=${encodeURIComponent(data.emailSubject)}&body=${encodeURIComponent(data.emailBody)}`
            },
            phone: {
                fields: [
                    { label: 'Phone Number', type: 'tel', id: 'phoneNumber', placeholder: '9876543210' }
                ],
                format: (data) => `tel:${data.phoneNumber}`
            },
            sms: {
                fields: [
                    { label: 'Phone Number', type: 'tel', id: 'smsNumber', placeholder: '9876543210' },
                    { label: 'Message', type: 'textarea', id: 'smsMessage', placeholder: 'SMS Message' }
                ],
                format: (data) => `sms:${data.smsNumber}?body=${encodeURIComponent(data.smsMessage)}`
            },
            whatsapp: {
                fields: [
                    { label: 'Phone Number', type: 'tel', id: 'waNumber', placeholder: '9876543217' },
                    { label: 'Message', type: 'textarea', id: 'waMessage', placeholder: 'WhatsApp Message' }
                ],
                format: (data) => `https://wa.me/${data.waNumber.replace(/\D/g, '')}?text=${encodeURIComponent(data.waMessage)}`
            },
            wifi: {
                fields: [
                    { label: 'Network Name (SSID)', type: 'text', id: 'wifiSsid', placeholder: 'Network Name' },
                    { label: 'Password', type: 'password', id: 'wifiPassword', placeholder: 'Network Password' },
                    { label: 'Encryption Type', type: 'select', id: 'wifiType', options: ['WPA', 'WEP', 'nopass'] }
                ],
                format: (data) => `WIFI:T:${data.wifiType};S:${data.wifiSsid};P:${data.wifiPassword};;`
            },
            vcard: {
                fields: [
                    { label: 'Full Name', type: 'text', id: 'vcardName', placeholder: 'Aravind' },
                    { label: 'Phone', type: 'tel', id: 'vcardPhone', placeholder: '9807645312' },
                    { label: 'Email', type: 'email', id: 'vcardEmail', placeholder: 'aravind@example.com' },
                    { label: 'Website', type: 'url', id: 'vcardUrl', placeholder: 'https://aravind.com' },
                    { label: 'Company', type: 'text', id: 'vcardOrg', placeholder: 'Company Name' },
                    { label: 'Address', type: 'text', id: 'vcardAddress', placeholder: 'Street, City, Country' }
                ],
                format: (data) => {
                    return `BEGIN:VCARD
VERSION:3.0
FN:${data.vcardName}
TEL:${data.vcardPhone}
EMAIL:${data.vcardEmail}
URL:${data.vcardUrl}
ORG:${data.vcardOrg}
ADR:;;${data.vcardAddress};;;
END:VCARD`;
                }
            },
            text: {
                fields: [
                    { label: 'Text Content', type: 'textarea', id: 'textContent', placeholder: 'Enter your text here' }
                ],
                format: (data) => data.textContent
            }
        };
    }

    setupEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generateQRCode());
        this.downloadBtn.addEventListener('click', () => this.downloadQRCode());
        this.shareBtn.addEventListener('click', () => this.shareQRCode());
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
        this.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        // Setup QR type selection
        document.querySelectorAll('.qr-type-list li').forEach(item => {
            item.addEventListener('click', () => this.changeQRType(item.dataset.type));
        });
    }

    setupQRTypes() {
        this.changeQRType('url'); // Set default type
    }

    changeQRType(type) {
        // Update active state in sidebar
        document.querySelectorAll('.qr-type-list li').forEach(item => {
            item.classList.toggle('active', item.dataset.type === type);
        });

        this.currentType = type;
        this.inputFields.innerHTML = ''; // Clear existing fields

        // Create new input fields for selected type
        this.qrTypes[type].fields.forEach(field => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'input-group';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', field.id);

            let input;
            if (field.type === 'textarea') {
                input = document.createElement('textarea');
            } else if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(option => {
                    const optionElement = document.createElement('option');
                    optionElement.value = option;
                    optionElement.textContent = option;
                    input.appendChild(optionElement);
                });
            } else {
                input = document.createElement('input');
                input.type = field.type;
            }

            input.id = field.id;
            input.placeholder = field.placeholder;

            inputGroup.appendChild(label);
            inputGroup.appendChild(input);
            this.inputFields.appendChild(inputGroup);
        });
    }

    generateQRCode() {
        this.qrcodeDiv.innerHTML = '';
        const data = {};
        this.qrTypes[this.currentType].fields.forEach(field => {
            data[field.id] = document.getElementById(field.id).value;
        });

        const qrData = this.qrTypes[this.currentType].format(data);

        // Generate QR code with higher quality
        new QRCode(this.qrcodeDiv, {
            text: qrData,
            width: 256,
            height: 256,
            colorDark: this.foregroundColor.value,
            colorLight: this.backgroundColor.value,
            correctLevel: QRCode.CorrectLevel.H
        });

        // Add click-to-save functionality for mobile
        const qrImage = this.qrcodeDiv.querySelector('img');
        if (qrImage) {
            qrImage.style.cursor = 'pointer';
            qrImage.title = 'Tap to save QR Code';
            qrImage.addEventListener('click', () => this.handleQRCodeClick(qrImage));
        }

        // Show buttons after generation
        this.downloadBtn.classList.remove('hidden');
        this.shareBtn.classList.remove('hidden');
    }

    async handleQRCodeClick(qrImage) {
        // Check if it's a mobile device
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            try {
                // Create a canvas with white background
                const canvas = document.createElement('canvas');
                canvas.width = qrImage.width + 40; // Add padding
                canvas.height = qrImage.height + 40;
                const ctx = canvas.getContext('2d');

                // Fill white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw QR code in the center
                ctx.drawImage(qrImage, 20, 20, qrImage.width, qrImage.height);

                // Convert to blob
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
                
                // Try saving using different methods
                if ('showSaveFilePicker' in window) {
                    // Use File System Access API
                    try {
                        const handle = await window.showSaveFilePicker({
                            suggestedName: this.generateFileName(),
                            types: [{
                                description: 'PNG Image',
                                accept: {'image/png': ['.png']},
                            }],
                        });
                        const writable = await handle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                        this.showToast('QR code saved successfully!');
                        return;
                    } catch (e) {
                        console.log('File System Access API failed, trying alternative method');
                    }
                }

                // Fallback method
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.generateFileName();
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                this.showToast('Tap and hold the QR code to save');
            } catch (error) {
                console.error('Save failed:', error);
                this.showToast('Could not save QR code. Please try the download button.');
            }
        }
    }

    async downloadQRCode() {
        try {
            const qrImage = this.qrcodeDiv.querySelector('img');
            if (!qrImage) {
                this.showToast('Please generate a QR code first');
                return;
            }

            // Show loading indicator
            this.showLoading('Preparing download...');

            // Create a high-quality version of the QR code
            const canvas = document.createElement('canvas');
            canvas.width = 1024;  // Larger size for better quality
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            // Set white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR code
            const image = new Image();
            image.src = qrImage.src;
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            // Calculate size to maintain aspect ratio
            const size = Math.min(canvas.width, canvas.height) * 0.9;
            const x = (canvas.width - size) / 2;
            const y = (canvas.height - size) / 2;
            ctx.drawImage(image, x, y, size, size);

            // Convert to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
            const fileName = this.generateFileName();

            // Create download link
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);

            this.hideLoading();
            this.showToast('QR code downloaded successfully!');
        } catch (error) {
            console.error('Download failed:', error);
            this.hideLoading();
            this.showToast('Download failed. Please try again.');
        }
    }

    async shareQRCode() {
        try {
            const qrImage = this.qrcodeDiv.querySelector('img');
            if (!qrImage) {
                this.showToast('Please generate a QR code first');
                return;
            }

            this.showLoading('Preparing to share...');

            // Create high-quality QR code for sharing
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 1024;
            const ctx = canvas.getContext('2d');

            // Set white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw QR code
            const image = new Image();
            image.src = qrImage.src;
            await new Promise((resolve, reject) => {
                image.onload = resolve;
                image.onerror = reject;
            });

            // Calculate size to maintain aspect ratio
            const size = Math.min(canvas.width, canvas.height) * 0.9;
            const x = (canvas.width - size) / 2;
            const y = (canvas.height - size) / 2;
            ctx.drawImage(image, x, y, size, size);

            // Get blob for sharing
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
            const file = new File([blob], this.generateFileName(), { type: 'image/png' });

            this.hideLoading();

            // Try different sharing methods
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                // Native sharing with file
                await navigator.share({
                    files: [file],
                    title: 'QR Code',
                    text: 'Here\'s your QR Code'
                });
            } else if (navigator.share) {
                // Native sharing without file
                await navigator.share({
                    title: 'QR Code',
                    text: 'Here\'s your QR Code',
                    url: window.location.href
                });
            } else {
                // Fallback to custom share modal
                this.showShareModal(file);
            }
        } catch (error) {
            console.error('Share failed:', error);
            this.hideLoading();
            this.showToast('Sharing failed. Please try downloading instead.');
        }
    }

    // Helper methods
    generateFileName() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const type = this.currentType || 'qr';
        return `qrcode-${type}-${timestamp}.png`;
    }

    showLoading(message) {
        if (!this.loadingElement) {
            this.loadingElement = document.createElement('div');
            this.loadingElement.className = 'loading-overlay';
            this.loadingElement.innerHTML = `
                <div class="loading-spinner"></div>
                <div class="loading-message"></div>
            `;
            document.body.appendChild(this.loadingElement);
        }
        this.loadingElement.querySelector('.loading-message').textContent = message;
        this.loadingElement.style.display = 'flex';
    }

    hideLoading() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showToast(message, duration = 3000) {
        if (!this.toastElement) {
            this.toastElement = document.createElement('div');
            this.toastElement.className = 'toast-message';
            document.body.appendChild(this.toastElement);
        }
        this.toastElement.textContent = message;
        this.toastElement.classList.add('show');
        setTimeout(() => {
            this.toastElement.classList.remove('show');
        }, duration);
    }

    showShareModal(file) {
        const modal = document.createElement('div');
        modal.className = 'share-modal';
        modal.innerHTML = `
            <div class="share-modal-content">
                <h3>Share QR Code</h3>
                <div class="share-options">
                    <button class="share-option" data-type="download">
                        <i class="fas fa-download"></i>
                        <span>Download</span>
                    </button>
                    <button class="share-option" data-type="copy">
                        <i class="fas fa-copy"></i>
                        <span>Copy</span>
                    </button>
                    <button class="share-option" data-type="email">
                        <i class="fas fa-envelope"></i>
                        <span>Email</span>
                    </button>
                </div>
                <button class="close-modal">Close</button>
            </div>
        `;
        document.body.appendChild(modal);

        // Handle modal actions
        modal.querySelector('.close-modal').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.querySelector('[data-type="download"]').onclick = () => {
            this.downloadQRCode();
            document.body.removeChild(modal);
        };

        modal.querySelector('[data-type="copy"]').onclick = async () => {
            try {
                await navigator.clipboard.write([
                    new ClipboardItem({ 'image/png': file })
                ]);
                this.showToast('QR code copied to clipboard!');
            } catch (err) {
                this.showToast('Failed to copy QR code');
            }
            document.body.removeChild(modal);
        };

        modal.querySelector('[data-type="email"]').onclick = () => {
            const mailTo = `mailto:?subject=QR Code&body=Here's your QR code.`;
            window.location.href = mailTo;
            document.body.removeChild(modal);
        };
    }

    addToHistory(item) {
        this.history.unshift(item);
        if (this.history.length > 5) {
            this.history.pop();
        }
        this.saveHistory();
        this.displayHistory();
    }

    displayHistory() {
        this.historyList.innerHTML = '';
        this.history.forEach((item, index) => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <div class="history-item-content">
                    <i class="fas ${this.getIconForType(item.type)}"></i>
                    <span>${this.formatHistoryItemText(item)}</span>
                    <small>${new Date(item.timestamp).toLocaleString()}</small>
                </div>
                <div class="history-item-buttons">
                    <button onclick="qrGenerator.regenerateQRCode(${index})" class="action-btn">
                        <i class="fas fa-redo"></i>
                    </button>
                    <button onclick="qrGenerator.deleteHistoryItem(${index})" class="action-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            this.historyList.appendChild(historyItem);
        });
    }

    getIconForType(type) {
        const icons = {
            url: 'fa-link',
            email: 'fa-envelope',
            phone: 'fa-phone',
            sms: 'fa-sms',
            whatsapp: 'fa-whatsapp',
            wifi: 'fa-wifi',
            vcard: 'fa-address-card',
            text: 'fa-align-left'
        };
        return icons[type] || 'fa-qrcode';
    }

    formatHistoryItemText(item) {
        switch (item.type) {
            case 'url':
                return item.data.urlInput;
            case 'email':
                return item.data.emailTo;
            case 'phone':
            case 'sms':
            case 'whatsapp':
                return item.data[`${item.type}Number`] || item.data.phoneNumber;
            case 'wifi':
                return item.data.wifiSsid;
            case 'vcard':
                return item.data.vcardName;
            case 'text':
                return item.data.textContent.substring(0, 30) + '...';
            default:
                return 'QR Code';
        }
    }

    regenerateQRCode(index) {
        const item = this.history[index];
        this.changeQRType(item.type);
        
        // Restore input values
        setTimeout(() => {
            Object.entries(item.data).forEach(([id, value]) => {
                const input = document.getElementById(id);
                if (input) input.value = value;
            });

            this.foregroundColor.value = item.colors.foreground;
            this.backgroundColor.value = item.colors.background;
            this.generateQRCode();
        }, 100);
    }

    deleteHistoryItem(index) {
        this.history.splice(index, 1);
        this.saveHistory();
        this.displayHistory();
    }

    clearHistory() {
        this.history = [];
        this.saveHistory();
        this.displayHistory();
    }

    saveHistory() {
        localStorage.setItem('qrHistory', JSON.stringify(this.history));
    }

    loadHistory() {
        const savedHistory = localStorage.getItem('qrHistory');
        if (savedHistory) {
            this.history = JSON.parse(savedHistory);
            this.displayHistory();
        }
    }

    toggleDarkMode() {
        const isDark = document.body.getAttribute('data-theme') === 'dark';
        document.body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        localStorage.setItem('darkMode', !isDark);
    }

    loadThemePreference() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        document.body.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    }
}

const qrGenerator = new QRCodeGenerator();