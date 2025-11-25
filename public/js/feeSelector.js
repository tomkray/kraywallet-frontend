/**
 * 💰 Fee Selector Component
 * 
 * Componente para seleção de fees com opções automáticas e customização
 */

class FeeSelector {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            defaultMode: 'medium', // high, medium, low, custom
            showMempool: true,
            allowCustom: true,
            minFee: 1,
            maxFee: 1000,
            onChange: null,
            ...options
        };
        
        this.fees = {
            high: 20,
            medium: 10,
            low: 5,
            minimum: 1,
            halfHour: 15
        };
        
        this.selectedMode = this.options.defaultMode;
        this.customFee = 10;
        
        this.init();
    }

    async init() {
        await this.fetchFees();
        this.render();
        this.attachEvents();
    }

    async fetchFees() {
        try {
            const response = await fetch('https://kraywallet-frontend.vercel.app/api/psbt/fees');
            const data = await response.json();
            
            if (data.success) {
                this.fees = data.fees;
                this.source = data.source;
            }
        } catch (error) {
            console.error('Error fetching fees:', error);
        }
    }

    render() {
        const html = `
            <div class="fee-selector">
                <div class="fee-selector-header">
                    <h3>⚡ Transaction Fee</h3>
                    <span class="fee-source">${this.source === 'mempool.space' ? '🌐 Live from Mempool' : '🔗 Bitcoin Core'}</span>
                </div>
                
                <div class="fee-options">
                    <!-- High Priority -->
                    <div class="fee-option ${this.selectedMode === 'high' ? 'selected' : ''}" data-mode="high">
                        <div class="fee-option-header">
                            <input type="radio" name="feeMode" value="high" ${this.selectedMode === 'high' ? 'checked' : ''}>
                            <label>
                                <span class="fee-label">🚀 High Priority</span>
                                <span class="fee-time">~10 minutes</span>
                            </label>
                        </div>
                        <div class="fee-value">${this.fees.high} sat/vB</div>
                    </div>

                    <!-- Half Hour -->
                    ${this.fees.halfHour ? `
                    <div class="fee-option ${this.selectedMode === 'halfHour' ? 'selected' : ''}" data-mode="halfHour">
                        <div class="fee-option-header">
                            <input type="radio" name="feeMode" value="halfHour" ${this.selectedMode === 'halfHour' ? 'checked' : ''}>
                            <label>
                                <span class="fee-label">⚡ Fast</span>
                                <span class="fee-time">~30 minutes</span>
                            </label>
                        </div>
                        <div class="fee-value">${this.fees.halfHour} sat/vB</div>
                    </div>
                    ` : ''}

                    <!-- Medium Priority -->
                    <div class="fee-option ${this.selectedMode === 'medium' ? 'selected' : ''}" data-mode="medium">
                        <div class="fee-option-header">
                            <input type="radio" name="feeMode" value="medium" ${this.selectedMode === 'medium' ? 'checked' : ''}>
                            <label>
                                <span class="fee-label">⏱️ Medium</span>
                                <span class="fee-time">~1 hour</span>
                            </label>
                        </div>
                        <div class="fee-value">${this.fees.medium} sat/vB</div>
                    </div>

                    <!-- Low Priority -->
                    <div class="fee-option ${this.selectedMode === 'low' ? 'selected' : ''}" data-mode="low">
                        <div class="fee-option-header">
                            <input type="radio" name="feeMode" value="low" ${this.selectedMode === 'low' ? 'checked' : ''}>
                            <label>
                                <span class="fee-label">🐌 Economy</span>
                                <span class="fee-time">~2-6 hours</span>
                            </label>
                        </div>
                        <div class="fee-value">${this.fees.low} sat/vB</div>
                    </div>

                    ${this.options.allowCustom ? `
                    <!-- Custom Fee -->
                    <div class="fee-option fee-option-custom ${this.selectedMode === 'custom' ? 'selected' : ''}" data-mode="custom">
                        <div class="fee-option-header">
                            <input type="radio" name="feeMode" value="custom" ${this.selectedMode === 'custom' ? 'checked' : ''}>
                            <label>
                                <span class="fee-label">⚙️ Custom</span>
                                <span class="fee-time">Set your own</span>
                            </label>
                        </div>
                        <div class="custom-fee-input">
                            <input 
                                type="number" 
                                id="customFeeInput" 
                                value="${this.customFee}" 
                                min="${this.options.minFee}" 
                                max="${this.options.maxFee}"
                                ${this.selectedMode !== 'custom' ? 'disabled' : ''}
                            >
                            <span>sat/vB</span>
                        </div>
                    </div>
                    ` : ''}
                </div>

                <div class="fee-summary">
                    <div class="fee-summary-item">
                        <span>Selected Fee:</span>
                        <strong>${this.getSelectedFee()} sat/vB</strong>
                    </div>
                    <div class="fee-summary-item">
                        <span>Estimated Time:</span>
                        <strong>${this.getEstimatedTime()}</strong>
                    </div>
                </div>

                <button class="refresh-fees-btn" onclick="feeSelector.refresh()">
                    🔄 Refresh Fees
                </button>
            </div>
        `;

        this.container.innerHTML = html;
        this.addStyles();
    }

    attachEvents() {
        // Radio buttons
        const radios = this.container.querySelectorAll('input[name="feeMode"]');
        radios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.selectedMode = e.target.value;
                this.render();
                
                // Habilitar/desabilitar custom input
                const customInput = document.getElementById('customFeeInput');
                if (customInput) {
                    customInput.disabled = this.selectedMode !== 'custom';
                }
                
                if (this.options.onChange) {
                    this.options.onChange(this.getSelectedFee());
                }
            });
        });

        // Custom fee input
        const customInput = document.getElementById('customFeeInput');
        if (customInput) {
            customInput.addEventListener('input', (e) => {
                this.customFee = parseInt(e.target.value) || this.options.minFee;
                
                if (this.customFee < this.options.minFee) {
                    this.customFee = this.options.minFee;
                    e.target.value = this.customFee;
                }
                if (this.customFee > this.options.maxFee) {
                    this.customFee = this.options.maxFee;
                    e.target.value = this.customFee;
                }
                
                this.updateSummary();
                
                if (this.options.onChange) {
                    this.options.onChange(this.getSelectedFee());
                }
            });
        }
    }

    getSelectedFee() {
        if (this.selectedMode === 'custom') {
            return this.customFee;
        }
        return this.fees[this.selectedMode] || this.fees.medium;
    }

    getEstimatedTime() {
        const times = {
            high: '~10 minutes',
            halfHour: '~30 minutes',
            medium: '~1 hour',
            low: '~2-6 hours',
            custom: 'Varies'
        };
        return times[this.selectedMode] || 'Unknown';
    }

    updateSummary() {
        const summaryFee = this.container.querySelector('.fee-summary-item strong');
        const summaryTime = this.container.querySelectorAll('.fee-summary-item strong')[1];
        
        if (summaryFee) summaryFee.textContent = `${this.getSelectedFee()} sat/vB`;
        if (summaryTime) summaryTime.textContent = this.getEstimatedTime();
    }

    async refresh() {
        const btn = this.container.querySelector('.refresh-fees-btn');
        btn.textContent = '🔄 Refreshing...';
        btn.disabled = true;
        
        await this.fetchFees();
        this.render();
        this.attachEvents();
        
        setTimeout(() => {
            btn.textContent = '✅ Updated!';
            setTimeout(() => {
                btn.textContent = '🔄 Refresh Fees';
                btn.disabled = false;
            }, 1000);
        }, 500);
    }

    addStyles() {
        if (document.getElementById('fee-selector-styles')) return;
        
        const styles = `
            <style id="fee-selector-styles">
                .fee-selector {
                    background: #1a1a2e;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .fee-selector-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .fee-selector-header h3 {
                    margin: 0;
                    color: #fff;
                }

                .fee-source {
                    font-size: 12px;
                    color: #00ff88;
                    background: rgba(0, 255, 136, 0.1);
                    padding: 4px 12px;
                    border-radius: 12px;
                }

                .fee-options {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .fee-option {
                    background: #16213e;
                    border: 2px solid #2a3f5f;
                    border-radius: 8px;
                    padding: 15px;
                    cursor: pointer;
                    transition: all 0.3s;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .fee-option:hover {
                    border-color: #00ff88;
                    transform: translateX(5px);
                }

                .fee-option.selected {
                    border-color: #00ff88;
                    background: rgba(0, 255, 136, 0.1);
                }

                .fee-option-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    flex: 1;
                }

                .fee-option-header label {
                    display: flex;
                    flex-direction: column;
                    cursor: pointer;
                }

                .fee-label {
                    color: #fff;
                    font-weight: 600;
                    font-size: 16px;
                }

                .fee-time {
                    color: #888;
                    font-size: 12px;
                    margin-top: 4px;
                }

                .fee-value {
                    color: #00ff88;
                    font-weight: bold;
                    font-size: 18px;
                }

                .fee-option-custom .custom-fee-input {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .fee-option-custom input[type="number"] {
                    background: #0f1922;
                    border: 1px solid #2a3f5f;
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 6px;
                    width: 100px;
                    font-size: 16px;
                }

                .fee-option-custom input[type="number"]:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .fee-summary {
                    background: rgba(0, 255, 136, 0.05);
                    border-radius: 8px;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 15px;
                }

                .fee-summary-item {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }

                .fee-summary-item span {
                    color: #888;
                    font-size: 12px;
                }

                .fee-summary-item strong {
                    color: #00ff88;
                    font-size: 16px;
                }

                .refresh-fees-btn {
                    width: 100%;
                    background: #00ff88;
                    color: #0f1922;
                    border: none;
                    padding: 12px;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s;
                }

                .refresh-fees-btn:hover {
                    background: #00dd77;
                    transform: translateY(-2px);
                }

                .refresh-fees-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Export para uso global
window.FeeSelector = FeeSelector;








