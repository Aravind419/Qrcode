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
        // Clear existing QR code
        this.qrcodeDiv.innerHTML = '';

        // Collect data from all input fields
        const data = {};
        this.qrTypes[this.currentType].fields.forEach(field => {
            data[field.id] = document.getElementById(field.id).value;
        });

        // Format data according to QR type
        const qrData = this.qrTypes[this.currentType].format(data);

        // Generate new QR code with higher quality
        const qr = new QRCode(this.qrcodeDiv, {
            text: qrData,
            width: 256,  // Increased size for better quality
            height: 256,
            colorDark: this.foregroundColor.value,
            colorLight: this.backgroundColor.value,
            correctLevel: QRCode.CorrectLevel.H,
            quality: 1.0
        });

        // Add to history
        this.addToHistory({
            type: this.currentType,
            data: data,
            colors: {
                foreground: this.foregroundColor.value,
                background: this.backgroundColor.value
            },
            timestamp: new Date().toISOString()
        });

        // Show download button
        this.downloadBtn.classList.remove('hidden');
        this.shareBtn.classList.remove('hidden');
    }

    downloadQRCode() {
        const canvas = document.createElement('canvas');
        const qrImage = this.qrcodeDiv.querySelector('img');
        
        if (!qrImage) {
            alert('Please generate a QR code first');
            return;
        }

        // Create high-quality canvas
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        const ctx = canvas.getContext('2d');
        
        // Wait for image to load
        qrImage.onload = () => {
            ctx.drawImage(qrImage, 0, 0);
            
            // Convert to blob
            canvas.toBlob((blob) => {
                const timestamp = new Date().getTime();
                const fileName = `QRCode_${timestamp}.png`;
                
                if (window.navigator.msSaveOrOpenBlob) {
                    // IE/Edge support
                    window.navigator.msSaveOrOpenBlob(blob, fileName);
                } else {
                    // Create download link
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = fileName;
                    
                    // Trigger download
                    document.body.appendChild(link);
                    link.click();
                    
                    // Cleanup
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(downloadUrl);
                }
            }, 'image/png', 1.0);
        };
        
        // Trigger load event
        qrImage.src = qrImage.src;
    }

    shareQRCode() {
        const canvas = document.createElement('canvas');
        const qrImage = this.qrcodeDiv.querySelector('img');
        
        if (!qrImage) {
            alert('Please generate a QR code first');
            return;
        }

        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        const ctx = canvas.getContext('2d');

        // Create shareable image
        qrImage.onload = () => {
            ctx.drawImage(qrImage, 0, 0);
            canvas.toBlob(async (blob) => {
                const file = new File([blob], 'QRCode.png', { type: 'image/png' });

                try {
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: 'QR Code',
                            text: 'Here\'s your QR Code'
                        });
                    } else if (navigator.share) {
                        // Fallback to basic share if file sharing is not supported
                        await navigator.share({
                            title: 'QR Code',
                            text: 'Here\'s your QR Code',
                            url: window.location.href
                        });
                    } else {
                        throw new Error('Sharing not supported');
                    }
                } catch (error) {
                    console.error('Sharing failed:', error);
                    alert('Sharing is not supported. Please use the download button instead.');
                    this.downloadQRCode();
                }
            }, 'image/png', 1.0);
        };

        // Trigger load event
        qrImage.src = qrImage.src;
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