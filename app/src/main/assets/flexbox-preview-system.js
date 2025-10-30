/**
 * BlocVibe Ultra-Advanced Flexbox Preview System v4.0
 * نظام معاينة Flexbox متقدم مع مؤشرات بصرية تفاعلية
 * 
 * المميزات:
 * - معاينة فورية لخصائص Flexbox
 * - مؤشرات بصرية للاتجاه والمحاذاة
 * - عرض gap والمسافات بصرياً
 * - تفاعل مباشر مع خصائص Flexbox
 * - معاينة responsive على أحجام مختلفة
 * 
 * @author BlocVibe Team
 * @version 4.0.0
 */

class FlexboxPreviewSystem {
    constructor() {
        this.previewElements = new Map();
        this.activePreviews = new Set();
        this.indicators = new Map();
        this.animationQueue = [];
        this.isPreviewMode = false;
        
        this.config = {
            animationDuration: 300,
            indicatorSize: 20,
            previewOpacity: 0.3,
            arrowColor: '#2196F3',
            gapColor: '#4CAF50',
            alignmentColor: '#FF9800',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderColor: '#2196F3',
            textColor: '#2196F3'
        };

        this.setupEventListeners();
        this.setupPreviewControls();
        this.initializePerformanceMonitoring();
    }

    /**
     * تفعيل نظام المعاينة
     */
    enablePreviewMode(container = null) {
        if (this.isPreviewMode && container === null) return;

        this.isPreviewMode = true;
        
        if (container) {
            this.showContainerPreview(container);
        } else {
            this.showAllFlexboxContainers();
        }

        this.updatePreviewControls();
        this.notifyPreviewModeChange(true);
    }

    /**
     * إلغاء تفعيل نظام المعاينة
     */
    disablePreviewMode() {
        this.isPreviewMode = false;
        this.hideAllPreviews();
        this.clearAllIndicators();
        this.updatePreviewControls();
        this.notifyPreviewModeChange(false);
    }

    /**
     * عرض معاينة لحاوية محددة
     */
    showContainerPreview(container) {
        if (!this.isFlexboxContainer(container)) {
            console.warn('Container is not using flexbox layout');
            return;
        }

        // إنشاء عناصر المعاينة
        this.createDirectionIndicators(container);
        this.createAlignmentIndicators(container);
        this.createGapIndicators(container);
        this.createLayoutBounds(container);

        // تسجيل الحاوية النشطة
        this.activePreviews.add(container);

        // تطبيق الرسوم المتحركة
        this.animatePreviewEntrance(container);
    }

    /**
     * إنشاء مؤشرات الاتجاه
     */
    createDirectionIndicators(container) {
        const direction = window.getComputedStyle(container).flexDirection;
        const rect = container.getBoundingClientRect();
        
        // إزالة المؤشرات الموجودة
        this.removeDirectionIndicators(container);

        const indicator = this.createIndicator('direction', container);
        
        // تحديد شكل السهم بناءً على الاتجاه
        switch (direction) {
            case 'row':
                this.configureRowIndicator(indicator, container);
                break;
            case 'row-reverse':
                this.configureRowReverseIndicator(indicator, container);
                break;
            case 'column':
                this.configureColumnIndicator(indicator, container);
                break;
            case 'column-reverse':
                this.configureColumnReverseIndicator(indicator, container);
                break;
        }

        this.indicators.set(this.getKey(container, 'direction'), indicator);
    }

    /**
     * تكوين مؤشر الاتجاه الأفقي
     */
    configureRowIndicator(indicator, container) {
        const rect = container.getBoundingClientRect();
        
        indicator.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 15px solid ${this.config.arrowColor};
            z-index: 1000;
            pointer-events: none;
            animation: bounceDown 1s infinite alternate;
        `;

        // إضافة نص الاتجاه
        const label = document.createElement('div');
        label.textContent = '→ Row';
        label.style.cssText = `
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.config.arrowColor};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
        `;
        indicator.appendChild(label);

        // إضافة CSS للرسوم المتحركة
        this.addBounceAnimation();
    }

    /**
     * تكوين مؤشر الاتجاه العكسي الأفقي
     */
    configureRowReverseIndicator(indicator, container) {
        const rect = container.getBoundingClientRect();
        
        indicator.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-top: 15px solid ${this.config.arrowColor};
            z-index: 1000;
            pointer-events: none;
            animation: bounceUp 1s infinite alternate;
        `;

        const label = document.createElement('div');
        label.textContent = '← Row-Reverse';
        label.style.cssText = `
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.config.arrowColor};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
        `;
        indicator.appendChild(label);
    }

    /**
     * تكوين مؤشر الاتجاه العمودي
     */
    configureColumnIndicator(indicator, container) {
        const rect = container.getBoundingClientRect();
        
        indicator.style.cssText = `
            position: absolute;
            left: -30px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-right: 15px solid ${this.config.arrowColor};
            z-index: 1000;
            pointer-events: none;
            animation: bounceRight 1s infinite alternate;
        `;

        const label = document.createElement('div');
        label.textContent = '↓ Column';
        label.style.cssText = `
            position: absolute;
            left: -80px;
            top: 50%;
            transform: translateY(-50%);
            background: ${this.config.arrowColor};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
        `;
        indicator.appendChild(label);
    }

    /**
     * تكوين مؤشر الاتجاه العكسي العمودي
     */
    configureColumnReverseIndicator(indicator, container) {
        const rect = container.getBoundingClientRect();
        
        indicator.style.cssText = `
            position: absolute;
            right: -30px;
            top: 50%;
            transform: translateY(-50%);
            width: 0;
            height: 0;
            border-top: 8px solid transparent;
            border-bottom: 8px solid transparent;
            border-left: 15px solid ${this.config.arrowColor};
            z-index: 1000;
            pointer-events: none;
            animation: bounceLeft 1s infinite alternate;
        `;

        const label = document.createElement('div');
        label.textContent = '↑ Column-Reverse';
        label.style.cssText = `
            position: absolute;
            right: -100px;
            top: 50%;
            transform: translateY(-50%);
            background: ${this.config.arrowColor};
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            white-space: nowrap;
        `;
        indicator.appendChild(label);
    }

    /**
     * إنشاء مؤشرات المحاذاة
     */
    createAlignmentIndicators(container) {
        const justifyContent = window.getComputedStyle(container).justifyContent;
        const alignItems = window.getComputedStyle(container).alignItems;
        
        this.removeAlignmentIndicators(container);

        // مؤشر justify-content
        if (justifyContent !== 'flex-start') {
            this.createJustifyContentIndicator(container, justifyContent);
        }

        // مؤشر align-items
        if (alignItems !== 'stretch') {
            this.createAlignItemsIndicator(container, alignItems);
        }
    }

    /**
     * إنشاء مؤشر justify-content
     */
    createJustifyContentIndicator(container, justifyContent) {
        const indicator = this.createIndicator('justify', container);
        const rect = container.getBoundingClientRect();
        
        // تحديد موقع المؤشر بناءً على justify-content
        let position = 'center';
        switch (justifyContent) {
            case 'flex-start':
                position = 'start';
                break;
            case 'flex-end':
                position = 'end';
                break;
            case 'center':
                position = 'center';
                break;
            case 'space-between':
                position = 'space-between';
                break;
            case 'space-around':
                position = 'space-around';
                break;
            case 'space-evenly':
                position = 'space-evenly';
                break;
        }

        indicator.style.cssText = `
            position: absolute;
            top: -60px;
            ${position === 'center' ? 'left: 50%; transform: translateX(-50%);' : ''}
            ${position === 'start' ? 'left: 10px;' : ''}
            ${position === 'end' ? 'right: 10px;' : ''}
            background: ${this.config.alignmentColor};
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            opacity: ${this.config.previewOpacity};
            animation: fadeInOut 2s infinite alternate;
        `;

        indicator.textContent = `justify: ${justifyContent}`;
        this.indicators.set(this.getKey(container, 'justify'), indicator);
    }

    /**
     * إنشاء مؤشر align-items
     */
    createAlignItemsIndicator(container, alignItems) {
        const indicator = this.createIndicator('align', container);
        const rect = container.getBoundingClientRect();
        
        indicator.style.cssText = `
            position: absolute;
            left: -100px;
            top: 50%;
            transform: translateY(-50%);
            background: ${this.config.alignmentColor};
            color: white;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
            white-space: nowrap;
            opacity: ${this.config.previewOpacity};
            animation: fadeInOut 2s infinite alternate;
        `;

        indicator.textContent = `align: ${alignItems}`;
        this.indicators.set(this.getKey(container, 'align'), indicator);
    }

    /**
     * إنشاء مؤشرات المسافات (gap)
     */
    createGapIndicators(container) {
        const gap = window.getComputedStyle(container).gap;
        if (!gap || gap === '0' || gap === 'normal') {
            this.removeGapIndicators(container);
            return;
        }

        this.removeGapIndicators(container);

        const children = Array.from(container.children).filter(el => 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
        );

        if (children.length > 1) {
            // إنشاء مؤشرات بين العناصر
            for (let i = 0; i < children.length - 1; i++) {
                this.createGapIndicatorBetween(container, children[i], children[i + 1], i);
            }
        }
    }

    /**
     * إنشاء مؤشر مسافة بين عنصرين
     */
    createGapIndicatorBetween(container, child1, child2, index) {
        const indicator = this.createIndicator(`gap-${index}`, container);
        const rect1 = child1.getBoundingClientRect();
        const rect2 = child2.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        const direction = window.getComputedStyle(container).flexDirection;
        
        if (direction === 'row' || direction === 'row-reverse') {
            // مؤشر مسافة أفقي
            const leftPos = Math.max(rect1.right, rect2.left);
            indicator.style.cssText = `
                position: absolute;
                top: ${rect1.top - containerRect.top + rect1.height / 2 - 10}px;
                left: ${leftPos - containerRect.left}px;
                width: 2px;
                height: 20px;
                background: ${this.config.gapColor};
                z-index: 1000;
                pointer-events: none;
                opacity: ${this.config.previewOpacity};
            `;
        } else {
            // مؤشر مسافة عمودي
            const topPos = Math.max(rect1.bottom, rect2.top);
            indicator.style.cssText = `
                position: absolute;
                left: ${rect1.left - containerRect.left + rect1.width / 2 - 10}px;
                top: ${topPos - containerRect.top}px;
                width: 20px;
                height: 2px;
                background: ${this.config.gapColor};
                z-index: 1000;
                pointer-events: none;
                opacity: ${this.config.previewOpacity};
            `;
        }

        // إضافة قيمة gap
        const gapLabel = document.createElement('div');
        gapLabel.textContent = window.getComputedStyle(container).gap;
        gapLabel.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: ${this.config.gapColor};
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            font-weight: bold;
            white-space: nowrap;
        `;
        indicator.appendChild(gapLabel);

        this.indicators.set(this.getKey(container, `gap-${index}`), indicator);
    }

    /**
     * إنشاء حدود التخطيط
     */
    createLayoutBounds(container) {
        const existingBounds = this.indicators.get(this.getKey(container, 'bounds'));
        if (existingBounds) {
            existingBounds.remove();
        }

        const bounds = document.createElement('div');
        const rect = container.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        bounds.style.cssText = `
            position: absolute;
            top: ${rect.top + scrollY - 2}px;
            left: ${rect.left + scrollX - 2}px;
            width: ${rect.width + 4}px;
            height: ${rect.height + 4}px;
            border: 2px dashed ${this.config.borderColor};
            background: ${this.config.backgroundColor};
            z-index: 999;
            pointer-events: none;
            opacity: ${this.config.previewOpacity};
        `;

        document.body.appendChild(bounds);
        this.indicators.set(this.getKey(container, 'bounds'), bounds);

        // إزالة تلقائية بعد انتهاء المعاينة
        setTimeout(() => {
            if (!this.isPreviewMode || !this.activePreviews.has(container)) {
                bounds.remove();
            }
        }, 5000);
    }

    /**
     * إنشاء عنصر مؤشر
     */
    createIndicator(type, container) {
        const indicator = document.createElement('div');
        indicator.className = `flexbox-indicator flexbox-${type}-indicator`;
        indicator.dataset.containerId = container.id || this.generateContainerId(container);
        indicator.dataset.indicatorType = type;

        document.body.appendChild(indicator);
        return indicator;
    }

    /**
     * إزالة مؤشرات الاتجاه
     */
    removeDirectionIndicators(container) {
        const directionKey = this.getKey(container, 'direction');
        const indicator = this.indicators.get(directionKey);
        if (indicator) {
            indicator.remove();
            this.indicators.delete(directionKey);
        }
    }

    /**
     * إزالة مؤشرات المحاذاة
     */
    removeAlignmentIndicators(container) {
        ['justify', 'align'].forEach(type => {
            const key = this.getKey(container, type);
            const indicator = this.indicators.get(key);
            if (indicator) {
                indicator.remove();
                this.indicators.delete(key);
            }
        });
    }

    /**
     * إزالة مؤشرات المسافات
     */
    removeGapIndicators(container) {
        for (let i = 0; i < 10; i++) { // الحد الأقصى للعناصر
            const key = this.getKey(container, `gap-${i}`);
            const indicator = this.indicators.get(key);
            if (indicator) {
                indicator.remove();
                this.indicators.delete(key);
            }
        }
    }

    /**
     * إزالة جميع المؤشرات من حاوية
     */
    removeAllContainerIndicators(container) {
        this.removeDirectionIndicators(container);
        this.removeAlignmentIndicators(container);
        this.removeGapIndicators(container);
        
        const boundsKey = this.getKey(container, 'bounds');
        const bounds = this.indicators.get(boundsKey);
        if (bounds) {
            bounds.remove();
            this.indicators.delete(boundsKey);
        }
    }

    /**
     * إظهار جميع حاويات Flexbox
     */
    showAllFlexboxContainers() {
        const flexboxContainers = document.querySelectorAll('[style*="display: flex"], .flex-container, .flexbox-container');
        
        flexboxContainers.forEach(container => {
            if (this.isFlexboxContainer(container)) {
                this.showContainerPreview(container);
            }
        });
    }

    /**
     * إخفاء جميع المعاينات
     */
    hideAllPreviews() {
        this.activePreviews.forEach(container => {
            this.removeAllContainerIndicators(container);
        });
        this.activePreviews.clear();
    }

    /**
     * مسح جميع المؤشرات
     */
    clearAllIndicators() {
        this.indicators.forEach((indicator, key) => {
            if (indicator && indicator.parentNode) {
                indicator.remove();
            }
        });
        this.indicators.clear();
    }

    /**
     * رسوم متحركة لدخول المعاينة
     */
    animatePreviewEntrance(container) {
        const indicators = [
            this.getKey(container, 'direction'),
            this.getKey(container, 'justify'),
            this.getKey(container, 'align'),
            this.getKey(container, 'bounds')
        ];

        indicators.forEach((key, index) => {
            const indicator = this.indicators.get(key);
            if (indicator) {
                setTimeout(() => {
                    indicator.style.animation = 'slideIn 0.3s ease-out';
                }, index * 100);
            }
        });
    }

    /**
     * تحديث معاينة حاوية
     */
    updatePreview(container) {
        if (!this.activePreviews.has(container)) return;

        this.removeAllContainerIndicators(container);
        this.showContainerPreview(container);
    }

    /**
     * إنشاء لوحة تحكم المعاينة
     */
    createPreviewControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'flexbox-preview-panel';
        panel.className = 'flexbox-preview-panel';
        
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border: 2px solid #2196F3;
            border-radius: 8px;
            padding: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 10000;
            min-width: 250px;
            font-family: Arial, sans-serif;
        `;

        panel.innerHTML = `
            <div style="border-bottom: 1px solid #eee; padding-bottom: 10px; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #2196F3; font-size: 16px;">🎯 Flexbox Preview</h3>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    <input type="checkbox" id="preview-direction" checked style="margin-right: 8px;">
                    إظهار اتجاه التخطيط
                </label>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    <input type="checkbox" id="preview-alignment" checked style="margin-right: 8px;">
                    إظهار المحاذاة
                </label>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    <input type="checkbox" id="preview-gaps" checked style="margin-right: 8px;">
                    إظهار المسافات
                </label>
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    <input type="checkbox" id="preview-bounds" checked style="margin-right: 8px;">
                    إظهار الحدود
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    شفافية المؤشرات:
                    <input type="range" id="preview-opacity" min="0.1" max="1" step="0.1" value="0.3" style="width: 100%; margin-top: 5px;">
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    حجم المؤشرات:
                    <input type="range" id="preview-size" min="10" max="40" step="5" value="20" style="width: 100%; margin-top: 5px;">
                </label>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    لون المؤشر:
                    <select id="preview-color" style="width: 100%; padding: 5px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="#2196F3">أزرق</option>
                        <option value="#4CAF50">أخضر</option>
                        <option value="#FF9800">برتقالي</option>
                        <option value="#9C27B0">بنفسجي</option>
                        <option value="#F44336">أحمر</option>
                    </select>
                </label>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="preview-refresh" style="flex: 1; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    تحديث
                </button>
                <button id="preview-close" style="flex: 1; padding: 8px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                    إغلاق
                </button>
            </div>
        `;

        return panel;
    }

    /**
     * إعداد مستمعات الأحداث للوحة التحكم
     */
    setupPreviewControls() {
        document.addEventListener('click', (e) => {
            if (e.target.id === 'toggle-preview' || e.target.closest('#toggle-preview')) {
                this.togglePreviewMode();
            }
        });
    }

    /**
     * إعداد مستمعات الأحداث العامة
     */
    setupEventListeners() {
        // مراقبة تغييرات الخصائص
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    this.handleAttributeChange(mutation);
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            subtree: true
        });

        // مراقبة تغييرات الحجم
        window.addEventListener('resize', () => {
            this.updateAllPreviews();
        });

        // مراقبة التمرير
        window.addEventListener('scroll', () => {
            this.updatePreviewPositions();
        }, { passive: true });
    }

    /**
     * معالجة تغييرات الخصائص
     */
    handleAttributeChange(mutation) {
        const element = mutation.target;
        if (this.activePreviews.has(element)) {
            this.updatePreview(element);
        }
    }

    /**
     * تحديث جميع المعاينات
     */
    updateAllPreviews() {
        this.activePreviews.forEach(container => {
            this.updatePreview(container);
        });
    }

    /**
     * تحديث مواقع المؤشرات
     */
    updatePreviewPositions() {
        this.indicators.forEach((indicator, key) => {
            const containerId = indicator.dataset.containerId;
            const container = document.getElementById(containerId);
            
            if (container && this.activePreviews.has(container)) {
                // إعادة حساب الموقع
                this.updateSingleIndicatorPosition(indicator, container, key);
            }
        });
    }

    /**
     * تحديث موقع مؤشر واحد
     */
    updateSingleIndicatorPosition(indicator, container, key) {
        const type = indicator.dataset.indicatorType;
        const rect = container.getBoundingClientRect();
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;

        switch (type) {
            case 'direction':
                // إعادة تطبيق موقع مؤشر الاتجاه
                this.configureDirectionIndicator(indicator, container);
                break;
            case 'justify':
            case 'align':
                // إعادة تطبيق موقع مؤشر المحاذاة
                this.configureAlignmentIndicator(indicator, container, type);
                break;
            case 'bounds':
                // إعادة تطبيق حدود التخطيط
                indicator.style.top = `${rect.top + scrollY - 2}px`;
                indicator.style.left = `${rect.left + scrollX - 2}px`;
                indicator.style.width = `${rect.width + 4}px`;
                indicator.style.height = `${rect.height + 4}px`;
                break;
            case 'gap':
                // إعادة تطبيق مؤشرات المسافات
                this.updateGapIndicators(container);
                break;
        }
    }

    /**
     * تبديل وضع المعاينة
     */
    togglePreviewMode() {
        if (this.isPreviewMode) {
            this.disablePreviewMode();
        } else {
            this.enablePreviewMode();
        }
    }

    /**
     * تحديث لوحة التحكم
     */
    updatePreviewControls() {
        let panel = document.getElementById('flexbox-preview-panel');
        
        if (this.isPreviewMode && !panel) {
            panel = this.createPreviewControlPanel();
            document.body.appendChild(panel);
            this.setupPanelEventListeners(panel);
        } else if (!this.isPreviewMode && panel) {
            panel.remove();
        }
    }

    /**
     * إعداد مستمعات أحداث لوحة التحكم
     */
    setupPanelEventListeners(panel) {
        // خيارات المعاينة
        panel.querySelector('#preview-direction').addEventListener('change', (e) => {
            this.toggleIndicatorType('direction', e.target.checked);
        });

        panel.querySelector('#preview-alignment').addEventListener('change', (e) => {
            this.toggleIndicatorType('alignment', e.target.checked);
        });

        panel.querySelector('#preview-gaps').addEventListener('change', (e) => {
            this.toggleIndicatorType('gaps', e.target.checked);
        });

        panel.querySelector('#preview-bounds').addEventListener('change', (e) => {
            this.toggleIndicatorType('bounds', e.target.checked);
        });

        // شفافية المؤشرات
        panel.querySelector('#preview-opacity').addEventListener('input', (e) => {
            this.updateIndicatorOpacity(parseFloat(e.target.value));
        });

        // حجم المؤشرات
        panel.querySelector('#preview-size').addEventListener('input', (e) => {
            this.updateIndicatorSize(parseInt(e.target.value));
        });

        // لون المؤشرات
        panel.querySelector('#preview-color').addEventListener('change', (e) => {
            this.updateIndicatorColor(e.target.value);
        });

        // أزرار التحكم
        panel.querySelector('#preview-refresh').addEventListener('click', () => {
            this.updateAllPreviews();
        });

        panel.querySelector('#preview-close').addEventListener('click', () => {
            this.disablePreviewMode();
        });
    }

    /**
     * تبديل نوع المؤشر
     */
    toggleIndicatorType(type, enabled) {
        switch (type) {
            case 'direction':
                this.activePreviews.forEach(container => {
                    if (enabled) {
                        this.createDirectionIndicators(container);
                    } else {
                        this.removeDirectionIndicators(container);
                    }
                });
                break;
            case 'alignment':
                this.activePreviews.forEach(container => {
                    if (enabled) {
                        this.createAlignmentIndicators(container);
                    } else {
                        this.removeAlignmentIndicators(container);
                    }
                });
                break;
            case 'gaps':
                this.activePreviews.forEach(container => {
                    if (enabled) {
                        this.createGapIndicators(container);
                    } else {
                        this.removeGapIndicators(container);
                    }
                });
                break;
            case 'bounds':
                this.activePreviews.forEach(container => {
                    if (enabled) {
                        this.createLayoutBounds(container);
                    } else {
                        this.removeLayoutBounds(container);
                    }
                });
                break;
        }
    }

    /**
     * تحديث شفافية المؤشرات
     */
    updateIndicatorOpacity(opacity) {
        this.config.previewOpacity = opacity;
        
        this.indicators.forEach(indicator => {
            indicator.style.opacity = opacity;
        });
    }

    /**
     * تحديث حجم المؤشرات
     */
    updateIndicatorSize(size) {
        this.config.indicatorSize = size;
        this.updateAllPreviews();
    }

    /**
     * تحديث لون المؤشرات
     */
    updateIndicatorColor(color) {
        this.config.arrowColor = color;
        this.config.alignmentColor = color;
        this.config.gapColor = color;
        this.config.borderColor = color;
        
        this.updateAllPreviews();
    }

    /**
     * إزالة حدود التخطيط
     */
    removeLayoutBounds(container) {
        const boundsKey = this.getKey(container, 'bounds');
        const bounds = this.indicators.get(boundsKey);
        if (bounds) {
            bounds.remove();
            this.indicators.delete(boundsKey);
        }
    }

    /**
     * فحص ما إذا كان العنصر حاوية flexbox
     */
    isFlexboxContainer(element) {
        const computedStyle = window.getComputedStyle(element);
        return computedStyle.display === 'flex' || 
               computedStyle.display === 'inline-flex' ||
               element.classList.contains('flex-container') ||
               element.classList.contains('flexbox-container');
    }

    /**
     * إنشاء معرف للحاوية
     */
    generateContainerId(container) {
        if (!container.id) {
            container.id = 'flex-container-' + Math.random().toString(36).substr(2, 9);
        }
        return container.id;
    }

    /**
     * الحصول على مفتاح فريد للمؤشر
     */
    getKey(container, type) {
        const containerId = container.id || this.generateContainerId(container);
        return `${containerId}-${type}`;
    }

    /**
     * إضافة الرسوم المتحركة
     */
    addBounceAnimation() {
        if (!document.querySelector('#flexbox-preview-styles')) {
            const style = document.createElement('style');
            style.id = 'flexbox-preview-styles';
            style.textContent = `
                @keyframes bounceDown {
                    from { transform: translateX(-50%) translateY(0); }
                    to { transform: translateX(-50%) translateY(5px); }
                }
                
                @keyframes bounceUp {
                    from { transform: translateX(-50%) translateY(0); }
                    to { transform: translateX(-50%) translateY(-5px); }
                }
                
                @keyframes bounceRight {
                    from { transform: translateY(-50%) translateX(0); }
                    to { transform: translateY(-50%) translateX(5px); }
                }
                
                @keyframes bounceLeft {
                    from { transform: translateY(-50%) translateX(0); }
                    to { transform: translateY(-50%) translateX(-5px); }
                }
                
                @keyframes fadeInOut {
                    from { opacity: ${this.config.previewOpacity}; }
                    to { opacity: ${this.config.previewOpacity * 0.5}; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0; 
                        transform: scale(0.8); 
                    }
                    to { 
                        opacity: ${this.config.previewOpacity}; 
                        transform: scale(1); 
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * إعداد مراقبة الأداء
     */
    initializePerformanceMonitoring() {
        this.performanceMetrics = {
            previewsCreated: 0,
            indicatorsGenerated: 0,
            averageRenderTime: 0,
            memoryUsage: 0
        };
    }

    /**
     * إشعار تغيير وضع المعاينة
     */
    notifyPreviewModeChange(enabled) {
        const event = new CustomEvent('flexboxPreviewModeChange', {
            detail: { enabled, activePreviews: Array.from(this.activePreviews) }
        });
        document.dispatchEvent(event);
    }

    /**
     * الحصول على تقرير الأداء
     */
    getPerformanceReport() {
        return {
            ...this.performanceMetrics,
            activePreviews: this.activePreviews.size,
            totalIndicators: this.indicators.size,
            isPreviewMode: this.isPreviewMode,
            config: { ...this.config }
        };
    }

    /**
     * تصدير إعدادات المعاينة
     */
    exportPreviewSettings() {
        return {
            config: { ...this.config },
            activePreviews: Array.from(this.activePreviews).map(container => ({
                id: container.id,
                className: container.className,
                tagName: container.tagName
            })),
            exportDate: new Date().toISOString()
        };
    }

    /**
     * استيراد إعدادات المعاينة
     */
    importPreviewSettings(settings) {
        if (settings.config) {
            Object.assign(this.config, settings.config);
        }
        
        this.updatePreviewControls();
        
        if (settings.activePreviews && settings.activePreviews.length > 0) {
            this.enablePreviewMode();
            settings.activePreviews.forEach(previewInfo => {
                const container = document.getElementById(previewInfo.id);
                if (container) {
                    this.showContainerPreview(container);
                }
            });
        }
    }
}

// إنشاء مثيل عام
window.FlexboxPreviewSystem = new FlexboxPreviewSystem();

// تصدير للاستخدام
window.BlocVibeCanvas = window.BlocVibeCanvas || {};
window.BlocVibeCanvas.flexboxPreview = window.FlexboxPreviewSystem;