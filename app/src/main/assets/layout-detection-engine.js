/**
 * BlocVibe Layout Detection Engine v3.0
 * =====================================
 * محرك كشف وتحليل التخطيطات الذكية للشبكات والتخطيطات المعقدة
 * يوفر كشفاً تلقائياً وتحسيناً للتخطيطات المبنية بـ Block, Flex, Grid
 * 
 * الميزات الرئيسية:
 * - كشف تلقائي لأنواع التخطيط (block, flex, grid)
 * - تحليل responsive breakpoints والتفاعلات
 * - كشف التداخلات والتعقيدات في التخطيطات
 * - اقتراح تحسينات ذكية للتخطيطات
 * - تحسين الأداء للعناصر الكثيرة
 * - تكامل كامل مع BlocElement structure
 */

(function() {
    'use strict';
    
    // ==================== ENUMS & CONSTANTS ====================
    
    /**
     * أنواع التخطيطات المدعومة مع الوصف المفصل
     */
    const LayoutType = Object.freeze({
        BLOCK: 'block',              // تخطيط block عادي
        FLEX: 'flex',                // تخطيط flexbox
        GRID: 'grid',                // تخطيط CSS Grid
        INLINE_BLOCK: 'inline-block', // تخطيط inline-block
        INLINE_FLEX: 'inline-flex',   // تخطيط flexbox inline
        INLINE_GRID: 'inline-grid',   // تخطيط grid inline
        TABLE: 'table',              // تخطيط جدول
        ABSOLUTE: 'absolute',        // تخطيط absolute positioning
        RELATIVE: 'relative',        // تخطيط relative positioning
        STICKY: 'sticky',            // تخطيط sticky positioning
        UNKNOWN: 'unknown'           // نوع غير محدد
    });
    
    /**
     * اتجاهات التخطيط المختلفة
     */
    const LayoutDirection = Object.freeze({
        ROW: 'row',                  // صف أفقي
        COLUMN: 'column',            // عمود عمودي
        ROW_REVERSE: 'row-reverse',  // صف معكوس
        COLUMN_REVERSE: 'column-reverse', // عمود معكوس
        UNKNOWN: 'unknown'
    });
    
    /**
     * مستويات التعقيد في التخطيطات
     */
    const ComplexityLevel = Object.freeze({
        SIMPLE: 'simple',            // تخطيط بسيط
        MODERATE: 'moderate',        // تخطيط متوسط التعقيد
        COMPLEX: 'complex',          // تخطيط معقد
        VERY_COMPLEX: 'very-complex' // تخطيط معقد جداً
    });
    
    /**
     * أنواع نقاط الكسر (Breakpoints)
     */
    const BreakpointType = Object.freeze({
        MIN_WIDTH: 'min-width',      // width دنيا
        MAX_WIDTH: 'max-width',      // width قصوى
        MIN_HEIGHT: 'min-height',    // height دنيا
        MAX_HEIGHT: 'max-height',    // height قصوى
        ORIENTATION: 'orientation',  // اتجاه الشاشة
        DEVICE_PIXEL_RATIO: 'resolution' // دقة الشاشة
    });
    
    /**
     * مستويات التحسين المقترحة
     */
    const OptimizationLevel = Object.freeze({
        NONE: 'none',                // لا يحتاج تحسين
        MINOR: 'minor',              // تحسينات بسيطة
        MAJOR: 'major',              // تحسينات كبيرة
        COMPLETE_RESTRUCTURE: 'complete-restructructure' // إعادة بناء كاملة
    });
    
    // ==================== UTILITY CLASSES ====================
    
    /**
     * حاسبة المسافات والهوامش المتقدمة
     */
    class SpacingCalculator {
        constructor() {
            this.baseUnit = 4; // الوحدة الأساسية (px)
            this.tolerance = 2; // هامش الخطأ المسموح
        }
        
        /**
         * تحليل المسافات بين العناصر
         * @param {Array} elements - قائمة العناصر
         * @returns {Object} تحليل المسافات
         */
        analyzeSpacing(elements) {
            const analysis = {
                horizontalSpacing: [],
                verticalSpacing: [],
                margins: {},
                paddings: {},
                gaps: {},
                consistency: {
                    horizontal: 0,
                    vertical: 0,
                    overall: 0
                }
            };
            
            // تحليل المسافات الأفقية
            for (let i = 0; i < elements.length - 1; i++) {
                const current = elements[i];
                const next = elements[i + 1];
                
                const currentRect = current.getBoundingClientRect();
                const nextRect = next.getBoundingClientRect();
                
                // مسافة أفقية
                const horizontalDistance = nextRect.left - (currentRect.left + currentRect.width);
                analysis.horizontalSpacing.push(Math.abs(horizontalDistance));
                
                // مسافة عمودية
                const verticalDistance = nextRect.top - (currentRect.top + currentRect.height);
                analysis.verticalSpacing.push(Math.abs(verticalDistance));
            }
            
            // تحليل الهوامش والحشو
            elements.forEach(element => {
                const styles = window.getComputedStyle(element);
                
                analysis.margins[element.dataset.blocId || element.id] = {
                    top: this.parseUnit(styles.marginTop),
                    right: this.parseUnit(styles.marginRight),
                    bottom: this.parseUnit(styles.marginBottom),
                    left: this.parseUnit(styles.marginLeft)
                };
                
                analysis.paddings[element.dataset.blocId || element.id] = {
                    top: this.parseUnit(styles.paddingTop),
                    right: this.parseUnit(styles.paddingRight),
                    bottom: this.parseUnit(styles.paddingBottom),
                    left: this.parseUnit(styles.paddingLeft)
                };
            });
            
            // تحليل الـ gaps في flex/grid
            elements.forEach(element => {
                const styles = window.getComputedStyle(element);
                const gap = this.parseUnit(styles.gap) || this.parseUnit(styles.columnGap) || 0;
                analysis.gaps[element.dataset.blocId || element.id] = gap;
            });
            
            // حساب مستوى الاتساق
            analysis.consistency.horizontal = this.calculateConsistency(analysis.horizontalSpacing);
            analysis.consistency.vertical = this.calculateConsistency(analysis.verticalSpacing);
            analysis.consistency.overall = (analysis.consistency.horizontal + analysis.consistency.vertical) / 2;
            
            return analysis;
        }
        
        /**
         * حساب المسافات المثلى بين العناصر
         * @param {Array} elements - قائمة العناصر
         * @param {string} layoutType - نوع التخطيط
         * @returns {Object} المسافات المثلى
         */
        calculateOptimalSpacing(elements, layoutType) {
            const analysis = this.analyzeSpacing(elements);
            const baseUnit = this.baseUnit;
            
            const optimal = {
                margin: {},
                padding: {},
                gap: 0,
                alignment: 'flex-start'
            };
            
            switch (layoutType) {
                case LayoutType.FLEX:
                    optimal.gap = this.normalizeToUnit(analysis.horizontalSpacing[0] || baseUnit);
                    break;
                    
                case LayoutType.GRID:
                    const avgGap = analysis.horizontalSpacing.reduce((a, b) => a + b, 0) / analysis.horizontalSpacing.length;
                    optimal.gap = this.normalizeToUnit(avgGap);
                    break;
                    
                case LayoutType.BLOCK:
                    const avgMargin = this.calculateMedian(analysis.horizontalSpacing);
                    optimal.margin.bottom = this.normalizeToUnit(avgMargin);
                    break;
            }
            
            return optimal;
        }
        
        /**
         * تحويل القيم إلى رقم
         * @param {string} value - القيمة المراد تحويلها
         * @returns {number} الرقم المحول
         */
        parseUnit(value) {
            if (!value || value === '0') return 0;
            const match = value.match(/^(-?\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        }
        
        /**
         * تسوية القيمة إلى أقرب وحدة أساسية
         * @param {number} value - القيمة
         * @returns {number} القيمة المسوية
         */
        normalizeToUnit(value) {
            return Math.round(value / this.baseUnit) * this.baseUnit;
        }
        
        /**
         * حساب الاتساق في مجموعة من القيم
         * @param {Array} values - القيم
         * @returns {number} مستوى الاتساق (0-1)
         */
        calculateConsistency(values) {
            if (values.length < 2) return 1;
            
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length;
            const standardDeviation = Math.sqrt(variance);
            
            // تحويل الانحراف إلى نسبة الاتساق
            return Math.max(0, 1 - (standardDeviation / (avg + 1)));
        }
        
        /**
         * حساب الوسيط لقائمة القيم
         * @param {Array} values - القيم
         * @returns {number} الوسيط
         */
        calculateMedian(values) {
            if (values.length === 0) return 0;
            
            const sorted = [...values].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            
            return sorted.length % 2 === 0 
                ? (sorted[mid - 1] + sorted[mid]) / 2
                : sorted[mid];
        }
    }
    
    /**
     * محلل نقاط الكسر (Breakpoints) المتقدم
     */
    class BreakpointAnalyzer {
        constructor() {
            this.detectedBreakpoints = [];
            this.currentViewport = {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio || 1
            };
            this.breakpointTolerance = 20; // هامش الخطأ لنقاط الكسر
        }
        
        /**
         * كشف نقاط الكسر في ملف CSS
         * @param {CSSStyleSheet} stylesheet - ورقة الأنماط
         * @returns {Array} قائمة نقاط الكسر
         */
        detectBreakpointsInStylesheet(stylesheet) {
            const breakpoints = [];
            
            try {
                const rules = stylesheet.cssRules || stylesheet.rules;
                
                for (let rule of rules) {
                    if (rule instanceof CSSMediaRule) {
                        const mediaText = rule.media.mediaText;
                        
                        // استخراج القيم من media query
                        const matches = this.parseMediaQuery(mediaText);
                        breakpoints.push(...matches);
                    }
                }
            } catch (error) {
                console.warn('[BreakpointAnalyzer] ⚠️ خطأ في قراءة ورقة الأنماط:', error);
            }
            
            return this.consolidateBreakpoints(breakpoints);
        }
        
        /**
         * كشف نقاط الكسر من جميع ملفات CSS
         * @returns {Array} جميع نقاط الكسر
         */
        detectAllBreakpoints() {
            const allBreakpoints = [];
            
            // فحص جميع stylesheets
            for (let stylesheet of document.styleSheets) {
                const breakpoints = this.detectBreakpointsInStylesheet(stylesheet);
                allBreakpoints.push(...breakpoints);
            }
            
            // كشف الـ inline styles للعناصر
            const elementsWithMediaQueries = document.querySelectorAll('[style*="media"], [style*="@media"]');
            elementsWithMediaQueries.forEach(element => {
                const style = element.getAttribute('style');
                const matches = this.parseMediaQuery(style);
                allBreakpoints.push(...matches);
            });
            
            return this.consolidateBreakpoints(allBreakpoints);
        }
        
        /**
         * تحليل media query واستخراج القيم
         * @param {string} mediaText - نص media query
         * @returns {Array} القيم المستخرجة
         */
        parseMediaQuery(mediaText) {
            const breakpoints = [];
            const minWidthMatches = mediaText.match(/min-width:\s*(\d+)px/g);
            const maxWidthMatches = mediaText.match(/max-width:\s*(\d+)px/g);
            const minHeightMatches = mediaText.match(/min-height:\s*(\d+)px/g);
            const maxHeightMatches = mediaText.match(/max-height:\s*(\d+)px/g);
            
            if (minWidthMatches) {
                minWidthMatches.forEach(match => {
                    const value = parseInt(match.match(/\d+/)[0]);
                    breakpoints.push({
                        type: BreakpointType.MIN_WIDTH,
                        value: value,
                        raw: match
                    });
                });
            }
            
            if (maxWidthMatches) {
                maxWidthMatches.forEach(match => {
                    const value = parseInt(match.match(/\d+/)[0]);
                    breakpoints.push({
                        type: BreakpointType.MAX_WIDTH,
                        value: value,
                        raw: match
                    });
                });
            }
            
            if (minHeightMatches) {
                minHeightMatches.forEach(match => {
                    const value = parseInt(match.match(/\d+/)[0]);
                    breakpoints.push({
                        type: BreakpointType.MIN_HEIGHT,
                        value: value,
                        raw: match
                    });
                });
            }
            
            if (maxHeightMatches) {
                maxHeightMatches.forEach(match => {
                    const value = parseInt(match.match(/\d+/)[0]);
                    breakpoints.push({
                        type: BreakpointType.MAX_HEIGHT,
                        value: value,
                        raw: match
                    });
                });
            }
            
            return breakpoints;
        }
        
        /**
         * دمج وتصفية نقاط الكسر المتشابهة
         * @param {Array} breakpoints - قائمة نقاط الكسر
         * @returns {Array} النقاط المدموجة
         */
        consolidateBreakpoints(breakpoints) {
            const consolidated = [];
            
            // تجميع النقاط حسب النوع والقيمة
            const groups = {};
            breakpoints.forEach(bp => {
                const key = `${bp.type}_${bp.value}`;
                if (!groups[key]) {
                    groups[key] = [];
                }
                groups[key].push(bp);
            });
            
            // دمج المجموعات المشابهة
            Object.values(groups).forEach(group => {
                if (group.length > 0) {
                    const representative = { ...group[0] };
                    representative.count = group.length;
                    representative.sources = group.map(bp => bp.raw);
                    consolidated.push(representative);
                }
            });
            
            // ترتيب النقاط
            return consolidated.sort((a, b) => {
                if (a.type !== b.type) {
                    const typeOrder = [BreakpointType.MIN_WIDTH, BreakpointType.MAX_WIDTH, 
                                     BreakpointType.MIN_HEIGHT, BreakpointType.MAX_HEIGHT];
                    return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type);
                }
                return a.value - b.value;
            });
        }
        
        /**
         * تحديث معلومات النافذة الحالية
         */
        updateViewportInfo() {
            this.currentViewport = {
                width: window.innerWidth,
                height: window.innerHeight,
                pixelRatio: window.devicePixelRatio || 1
            };
        }
        
        /**
         * الحصول على نقطة الكسر النشطة الحالية
         * @returns {Object} معلومات نقطة الكسر النشطة
         */
        getCurrentActiveBreakpoint() {
            const active = {
                minWidth: null,
                maxWidth: null,
                minHeight: null,
                maxHeight: null,
                isMobile: false,
                isTablet: false,
                isDesktop: false
            };
            
            this.detectedBreakpoints.forEach(bp => {
                switch (bp.type) {
                    case BreakpointType.MIN_WIDTH:
                        if (this.currentViewport.width >= bp.value) {
                            active.minWidth = Math.max(active.minWidth || 0, bp.value);
                        }
                        break;
                    case BreakpointType.MAX_WIDTH:
                        if (this.currentViewport.width <= bp.value) {
                            active.maxWidth = Math.min(active.maxWidth || Infinity, bp.value);
                        }
                        break;
                }
            });
            
            // تحديد نوع الجهاز
            active.isMobile = this.currentViewport.width < 768;
            active.isTablet = this.currentViewport.width >= 768 && this.currentViewport.width < 1024;
            active.isDesktop = this.currentViewport.width >= 1024;
            
            return active;
        }
    }
    
    // ==================== MAIN LAYOUT DETECTION ENGINE ====================
    
    class LayoutDetectionEngine {
        constructor() {
            // التحليل الأساسي
            this.layoutCache = new Map(); // ذاكرة التخزين المؤقت للتحليلات
            this.analysisVersion = 0;
            this.isAnalyzing = false;
            
            // المكونات المساعدة
            this.spacingCalculator = new SpacingCalculator();
            this.breakpointAnalyzer = new BreakpointAnalyzer();
            
            // تتبع الأداء
            this.performanceMetrics = {
                analysisCount: 0,
                totalAnalysisTime: 0,
                cacheHitRate: 0,
                lastAnalysis: null
            };
            
            // إعدادات التحليل
            this.analysisConfig = {
                enableCaching: true,
                batchSize: 50, // عدد العناصر في كل مجموعة تحليل
                analysisDelay: 100, // تأخير التحليل (ms)
                enablePerformanceTracking: true,
                enableBreakpointDetection: true,
                enableFlexDetection: true,
                enableGridDetection: true
            };
            
            // مستمعي الأحداث
            this.analysisCallbacks = {
                onLayoutDetected: [],
                onLayoutChanged: [],
                onBreakpointDetected: [],
                onOptimizationSuggested: []
            };
            
            // تتبع العناصر المراقبة
            this.monitoredElements = new Set();
            this.observer = null;
            
            this.init();
        }
        
        // ==================== INITIALIZATION ====================
        
        init() {
            console.log('[LayoutDetectionEngine] 🚀 Initializing Layout Detection Engine...');
            
            // تحديث معلومات النافذة
            this.updateViewportInfo();
            
            // كشف نقاط الكسر الأولي
            if (this.analysisConfig.enableBreakpointDetection) {
                this.detectBreakpoints();
            }
            
            // إعداد المراقب الذكي
            this.setupIntelligentObserver();
            
            // إعداد مستمعي الأحداث العامة
            this.setupGlobalListeners();
            
            // بدء التحليل الدوري
            this.startPeriodicAnalysis();
            
            console.log('[LayoutDetectionEngine] ✅ Layout Detection Engine ready');
        }
        
        /**
         * تحديث معلومات النافذة والاستجابة
         */
        updateViewportInfo() {
            this.breakpointAnalyzer.updateViewportInfo();
            
            // إشعار بتغيير حجم النافذة
            this.notifyLayoutChange({
                type: 'viewport-resize',
                oldSize: { width: window.innerWidth, height: window.innerHeight },
                newSize: { width: window.innerWidth, height: window.innerHeight },
                timestamp: Date.now()
            });
        }
        
        /**
         * إعداد المراقب الذكي للعناصر
         */
        setupIntelligentObserver() {
            const config = {
                attributes: true,
                childList: true,
                subtree: true,
                attributeOldValue: true,
                attributeFilter: ['class', 'style', 'data-layout-type']
            };
            
            this.observer = new MutationObserver((mutations) => {
                this.handleMutations(mutations);
            });
            
            // مراقبة العناصر المراقبة
            this.monitoredElements.forEach(element => {
                this.observer.observe(element, config);
            });
        }
        
        /**
         * إعداد مستمعي الأحداث العامة
         */
        setupGlobalListeners() {
            // تغيير حجم النافذة
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    this.updateViewportInfo();
                }, 250);
            });
            
            // تغيير الاتجاه (للهواتف)
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.updateViewportInfo();
                }, 500);
            });
            
            // تحميل الموارد
            window.addEventListener('load', () => {
                console.log('[LayoutDetectionEngine] 📱 Window loaded, starting comprehensive analysis...');
                this.analyzeCurrentLayout(document.body);
            });
        }
        
        // ==================== CORE ANALYSIS METHODS ====================
        
        /**
         * تحليل التخطيط الحالي لعنصر محدد
         * @param {Element} parentElement - العنصر الأب للتحليل
         * @param {Object} options - خيارات التحليل
         * @returns {Object} نتيجة التحليل الشاملة
         */
        analyzeCurrentLayout(parentElement, options = {}) {
            const startTime = performance.now();
            this.analysisVersion++;
            
            // التحقق من الذاكرة المؤقتة
            const cacheKey = this.generateCacheKey(parentElement, options);
            if (this.analysisConfig.enableCaching && this.layoutCache.has(cacheKey)) {
                const cached = this.layoutCache.get(cacheKey);
                if (cached.version === this.analysisVersion) {
                    this.performanceMetrics.cacheHitRate++;
                    return cached.data;
                }
            }
            
            console.log(`[LayoutDetectionEngine] 🔍 Starting comprehensive layout analysis for:`, parentElement);
            
            // إعدادات التحليل
            const analysisOptions = {
                includeChildren: true,
                detectNested: true,
                analyzeSpacing: true,
                detectBreakpoints: true,
                suggestOptimizations: true,
                ...options
            };
            
            // جمع المعلومات الأساسية
            const layoutInfo = {
                element: parentElement,
                analysisVersion: this.analysisVersion,
                timestamp: Date.now(),
                viewport: { ...this.breakpointAnalyzer.currentViewport },
                layout: this.detectContainerType(parentElement),
                children: [],
                metrics: {},
                issues: [],
                optimizations: [],
                performance: {}
            };
            
            // تحليل العناصر الفرعية
            if (analysisOptions.includeChildren) {
                const children = this.getLayoutChildren(parentElement);
                layoutInfo.children = children.map(child => this.analyzeElement(child, analysisOptions));
            }
            
            // تحليل المسافات والهوامش
            if (analysisOptions.analyzeSpacing) {
                layoutInfo.spacing = this.spacingCalculator.analyzeSpacing(
                    layoutInfo.children.map(child => child.element)
                );
            }
            
            // كشف نقاط الكسر
            if (analysisOptions.detectBreakpoints) {
                layoutInfo.breakpoints = this.breakpointAnalyzer.getCurrentActiveBreakpoint();
            }
            
            // تحليل التعقيد
            layoutInfo.complexity = this.analyzeLayoutComplexity(layoutInfo);
            
            // كشف التداخلات
            layoutInfo.nesting = this.analyzeNesting(parentElement, layoutInfo.children);
            
            // تحليل الأداء
            layoutInfo.performance = {
                analysisTime: performance.now() - startTime,
                elementCount: layoutInfo.children.length + 1,
                cacheUsed: this.analysisConfig.enableCaching && this.layoutCache.has(cacheKey)
            };
            
            // اقتراح التحسينات
            if (analysisOptions.suggestOptimizations) {
                layoutInfo.optimizations = this.suggestLayoutImprovements(layoutInfo);
            }
            
            // حفظ في الذاكرة المؤقتة
            if (this.analysisConfig.enableCaching) {
                this.layoutCache.set(cacheKey, {
                    version: this.analysisVersion,
                    data: layoutInfo
                });
            }
            
            // تحديث الإحصائيات
            this.updatePerformanceMetrics(layoutInfo.performance.analysisTime);
            
            // إشعار الكشف
            this.notifyLayoutDetection(layoutInfo);
            
            console.log(`[LayoutDetectionEngine] ✅ Analysis complete:`, {
                layout: layoutInfo.layout.type,
                complexity: layoutInfo.complexity.level,
                elements: layoutInfo.children.length,
                optimizations: layoutInfo.optimizations.length
            });
            
            return layoutInfo;
        }
        
        /**
         * تحليل عنصر واحد بالتفصيل
         * @param {Element} element - العنصر المراد تحليله
         * @param {Object} options - خيارات التحليل
         * @returns {Object} تحليل العنصر
         */
        analyzeElement(element, options = {}) {
            const analysis = {
                element: element,
                id: element.dataset.blocId || element.id || `element_${Math.random().toString(36).substr(2, 9)}`,
                layout: this.detectContainerType(element),
                dimensions: this.getElementDimensions(element),
                positioning: this.getPositioningInfo(element),
                spacing: this.getSpacingInfo(element),
                performance: {},
                issues: []
            };
            
            // كشف التعقيد
            analysis.complexity = this.analyzeElementComplexity(element);
            
            // تحليل الأذونات والمسؤوليات
            analysis.responsibilities = this.analyzeResponsibilities(element);
            
            // كشف التداخلات
            if (options.detectNested) {
                analysis.children = this.getLayoutChildren(element).map(child => 
                    this.analyzeElement(child, options)
                );
            }
            
            return analysis;
        }
        
        /**
         * كشف نوع تخطيط العنصر
         * @param {Element} element - العنصر المراد فحصه
         * @returns {Object} معلومات نوع التخطيط
         */
        detectContainerType(element) {
            const styles = window.getComputedStyle(element);
            const display = styles.display;
            const position = styles.position;
            
            // تحديد نوع التخطيط الأساسي
            let layoutType = LayoutType.UNKNOWN;
            let layoutDirection = LayoutDirection.UNKNOWN;
            let layoutInfo = {
                type: LayoutType.UNKNOWN,
                direction: LayoutDirection.UNKNOWN,
                isContainer: false,
                isNested: false,
                confidence: 0
            };
            
            // تحليل نوع display
            switch (display) {
                case 'flex':
                case 'inline-flex':
                    layoutType = display === 'flex' ? LayoutType.FLEX : LayoutType.INLINE_FLEX;
                    layoutDirection = styles.flexDirection;
                    layoutInfo.isContainer = true;
                    break;
                    
                case 'grid':
                case 'inline-grid':
                    layoutType = display === 'grid' ? LayoutType.GRID : LayoutType.INLINE_GRID;
                    layoutInfo.isContainer = true;
                    break;
                    
                case 'block':
                    layoutType = LayoutType.BLOCK;
                    layoutInfo.isContainer = element.children.length > 0;
                    break;
                    
                case 'inline-block':
                    layoutType = LayoutType.INLINE_BLOCK;
                    layoutInfo.isContainer = element.children.length > 0;
                    break;
                    
                case 'table':
                case 'table-cell':
                case 'table-row':
                    layoutType = LayoutType.TABLE;
                    layoutInfo.isContainer = true;
                    break;
                    
                default:
                    layoutType = LayoutType.BLOCK; // افتراضي
                    layoutInfo.isContainer = element.children.length > 0;
            }
            
            // تحديد الموقع
            switch (position) {
                case 'absolute':
                    layoutType = LayoutType.ABSOLUTE;
                    break;
                case 'relative':
                    if (layoutType === LayoutType.UNKNOWN) {
                        layoutType = LayoutType.RELATIVE;
                    }
                    break;
                case 'fixed':
                    layoutType = LayoutType.STICKY;
                    break;
            }
            
            // حساب مستوى الثقة في الكشف
            const confidence = this.calculateLayoutDetectionConfidence(element, layoutType, styles);
            
            layoutInfo = {
                ...layoutInfo,
                type: layoutType,
                direction: layoutDirection,
                confidence: confidence,
                originalDisplay: display,
                originalPosition: position,
                styles: {
                    display: styles.display,
                    flexDirection: styles.flexDirection,
                    justifyContent: styles.justifyContent,
                    alignItems: styles.alignItems,
                    gridTemplateColumns: styles.gridTemplateColumns,
                    gridTemplateRows: styles.gridTemplateRows,
                    gap: styles.gap,
                    position: styles.position
                }
            };
            
            // كشف التخطيطات المختلطة
            layoutInfo.isHybrid = this.detectHybridLayout(element);
            layoutInfo.hybridComponents = this.detectHybridComponents(element);
            
            return layoutInfo;
        }
        
        /**
         * كشف التخطيطات المختلطة
         * @param {Element} element - العنصر المراد فحصه
         * @returns {boolean} هل هو تخطيط مختلط
         */
        detectHybridLayout(element) {
            const children = Array.from(element.children);
            if (children.length < 2) return false;
            
            const displayTypes = new Set();
            children.forEach(child => {
                const childDisplay = window.getComputedStyle(child).display;
                displayTypes.add(childDisplay);
            });
            
            // إذا كان لدينا أكثر من نوع display، فهو مختلط
            return displayTypes.size > 1;
        }
        
        /**
         * كشف مكونات التخطيطات المختلطة
         * @param {Element} element - العنصر المراد فحصه
         * @returns {Array} قائمة المكونات
         */
        detectHybridComponents(element) {
            const components = [];
            const children = Array.from(element.children);
            
            children.forEach((child, index) => {
                const styles = window.getComputedStyle(child);
                components.push({
                    index: index,
                    element: child,
                    type: styles.display,
                    position: styles.position,
                    width: styles.width,
                    height: styles.height,
                    id: child.dataset.blocId || child.id || `hybrid_${index}`
                });
            });
            
            return components;
        }
        
        /**
         * حساب مستوى الثقة في كشف نوع التخطيط
         * @param {Element} element - العنصر
         * @param {string} layoutType - نوع التخطيط المكتشف
         * @param {Object} styles - الأنماط المحسوبة
         * @returns {number} مستوى الثقة (0-1)
         */
        calculateLayoutDetectionConfidence(element, layoutType, styles) {
            let confidence = 0.5; // ثقة افتراضية
            
            // زيادة الثقة بناءً على وضوح المؤشرات
            const indicators = {
                clearDisplay: styles.display !== 'block' && styles.display !== 'inline',
                hasFlexProperties: styles.flexDirection !== 'normal' || styles.justifyContent !== 'normal',
                hasGridProperties: styles.gridTemplateColumns !== 'none' || styles.gridTemplateRows !== 'none',
                hasPositioning: styles.position !== 'static',
                hasBlocId: !!element.dataset.blocId,
                hasLayoutClasses: element.classList.contains('layout') || 
                                element.classList.contains('container') ||
                                element.classList.contains('flex') ||
                                element.classList.contains('grid')
            };
            
            // حساب الثقة بناءً على المؤشرات
            const indicatorWeights = {
                clearDisplay: 0.2,
                hasFlexProperties: 0.3,
                hasGridProperties: 0.3,
                hasPositioning: 0.1,
                hasBlocId: 0.05,
                hasLayoutClasses: 0.15
            };
            
            Object.keys(indicators).forEach(key => {
                if (indicators[key]) {
                    confidence += indicatorWeights[key];
                }
            });
            
            // تعديل الثقة بناءً على نوع التخطيط
            switch (layoutType) {
                case LayoutType.FLEX:
                case LayoutType.GRID:
                    confidence += 0.1; // التخطيطات الحديثة أكثر وضوحاً
                    break;
                case LayoutType.TABLE:
                    confidence += 0.05;
                    break;
                default:
                    confidence -= 0.05; // التخطيطات التقليدية أقل وضوحاً
            }
            
            return Math.min(Math.max(confidence, 0), 1); // عدم التجاوز عن الحد
        }
        
        /**
         * حساب المسافات المثلى بين العناصر
         * @param {Array} elements - قائمة العناصر
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Object} المسافات المثلى
         */
        calculateOptimalSpacing(elements, layoutInfo) {
            if (!elements || elements.length === 0) {
                return {
                    margin: { top: 0, right: 0, bottom: 8, left: 0 },
                    padding: { top: 16, right: 16, bottom: 16, left: 16 },
                    gap: 16,
                    alignment: 'flex-start'
                };
            }
            
            return this.spacingCalculator.calculateOptimalSpacing(elements, layoutInfo.type);
        }
        
        /**
         * اقتراح تحسينات التخطيط
         * @param {Object} layoutInfo - معلومات التخطيط المحلل
         * @returns {Array} قائمة التحسينات المقترحة
         */
        suggestLayoutImprovements(layoutInfo) {
            const improvements = [];
            
            // اقتراحات بناءً على نوع التخطيط
            switch (layoutInfo.layout.type) {
                case LayoutType.FLEX:
                    improvements.push(...this.suggestFlexImprovements(layoutInfo));
                    break;
                case LayoutType.GRID:
                    improvements.push(...this.suggestGridImprovements(layoutInfo));
                    break;
                case LayoutType.BLOCK:
                    improvements.push(...this.suggestBlockImprovements(layoutInfo));
                    break;
            }
            
            // اقتراحات بناءً على التعقيد
            if (layoutInfo.complexity.level === ComplexityLevel.VERY_COMPLEX) {
                improvements.push({
                    type: 'complexity-reduction',
                    priority: OptimizationLevel.MAJOR,
                    title: 'تقليل تعقيد التخطيط',
                    description: 'التخطيط معقد جداً. فكر في تقسيمه إلى مكونات أصغر.',
                    estimatedImpact: 'high',
                    implementation: 'restructure-layout'
                });
            }
            
            // اقتراحات بناءً على الأداء
            if (layoutInfo.performance.analysisTime > 50) {
                improvements.push({
                    type: 'performance-optimization',
                    priority: OptimizationLevel.MINOR,
                    title: 'تحسين أداء التحليل',
                    description: 'تحليل التخطيط يستغرق وقتاً طويلاً. فكر في تبسيط البنية.',
                    estimatedImpact: 'medium',
                    implementation: 'simplify-layout'
                });
            }
            
            return improvements;
        }
        
        /**
         * اقتراحات تحسينات التخطيطات المرنة (Flexbox)
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Array} قائمة الاقتراحات
         */
        suggestFlexImprovements(layoutInfo) {
            const suggestions = [];
            const styles = layoutInfo.layout.styles;
            
            // تحسين direction
            if (styles.flexDirection === 'row' && layoutInfo.children.length > 3) {
                suggestions.push({
                    type: 'flex-direction-optimization',
                    priority: OptimizationLevel.MINOR,
                    title: 'تحسين اتجاه Flexbox',
                    description: 'يمكنك استخدام flex-wrap للتعامل مع العناصر الكثيرة',
                    currentValue: styles.flexDirection,
                    suggestedValue: 'row wrap',
                    implementation: 'flex-wrap'
                });
            }
            
            // تحسين justify-content
            if (styles.justifyContent === 'flex-start' && layoutInfo.children.length > 1) {
                suggestions.push({
                    type: 'justify-content-optimization',
                    priority: OptimizationLevel.MINOR,
                    title: 'تحسين محاذاة العناصر',
                    description: 'استخدم space-between أو space-around لتوزيع العناصر بشكل أفضل',
                    currentValue: styles.justifyContent,
                    suggestedValue: 'space-between',
                    implementation: 'justify-content'
                });
            }
            
            // تحسين align-items
            if (styles.alignItems === 'stretch') {
                suggestions.push({
                    type: 'align-items-optimization',
                    priority: OptimizationLevel.MINOR,
                    title: 'تحسين محاذاة العناصر العمودية',
                    description: 'استخدم center لمحاذاة أفضل في حالة العناصر ذات المحتوى المختلف',
                    currentValue: styles.alignItems,
                    suggestedValue: 'center',
                    implementation: 'align-items'
                });
            }
            
            return suggestions;
        }
        
        /**
         * اقتراحات تحسينات الشبكات (Grid)
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Array} قائمة الاقتراحات
         */
        suggestGridImprovements(layoutInfo) {
            const suggestions = [];
            const styles = layoutInfo.layout.styles;
            
            // تحسين template
            if (!styles.gridTemplateColumns || styles.gridTemplateColumns === 'none') {
                suggestions.push({
                    type: 'grid-template-optimization',
                    priority: OptimizationLevel.MAJOR,
                    title: 'تحسين قالب الشبكة',
                    description: 'حدد grid-template-columns لتوزيع العناصر بشكل أفضل',
                    suggestedValue: 'repeat(auto-fit, minmax(200px, 1fr))',
                    implementation: 'grid-template-columns'
                });
            }
            
            // تحسين gap
            if (!styles.gap || styles.gap === 'normal') {
                suggestions.push({
                    type: 'grid-gap-optimization',
                    priority: OptimizationLevel.MINOR,
                    title: 'تحسين المسافات في الشبكة',
                    description: 'حدد قيمة gap مناسبة لتحسين التناسق البصري',
                    suggestedValue: '16px',
                    implementation: 'gap'
                });
            }
            
            return suggestions;
        }
        
        /**
         * اقتراحات تحسينات التخطيطات العادية (Block)
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Array} قائمة الاقتراحات
         */
        suggestBlockImprovements(layoutInfo) {
            const suggestions = [];
            
            // اقتراح تحويل إلى flex
            if (layoutInfo.children.length >= 2) {
                suggestions.push({
                    type: 'layout-conversion',
                    priority: OptimizationLevel.MAJOR,
                    title: 'تحويل إلى Flexbox',
                    description: 'فكر في تحويل هذا التخطيط إلى flexbox لسهولة التحكم',
                    suggestedLayout: LayoutType.FLEX,
                    implementation: 'display-flex'
                });
            }
            
            return suggestions;
        }
        
        // ==================== LAYOUT COMPLEXITY ANALYSIS ====================
        
        /**
         * تحليل تعقيد التخطيط
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Object} تحليل التعقيد
         */
        analyzeLayoutComplexity(layoutInfo) {
            const complexity = {
                level: ComplexityLevel.SIMPLE,
                score: 0,
                factors: {},
                recommendations: []
            };
            
            let score = 0;
            const factors = {};
            
            // عدد العناصر
            const elementCount = layoutInfo.children.length;
            if (elementCount > 10) {
                score += 3;
                factors.elementCount = 'too-many';
            } else if (elementCount > 5) {
                score += 2;
                factors.elementCount = 'moderate';
            } else if (elementCount > 2) {
                score += 1;
                factors.elementCount = 'few';
            } else {
                factors.elementCount = 'minimal';
            }
            
            // نوع التخطيط
            switch (layoutInfo.layout.type) {
                case LayoutType.GRID:
                    score += 2;
                    factors.layoutType = 'complex';
                    break;
                case LayoutType.FLEX:
                    score += 1;
                    factors.layoutType = 'moderate';
                    break;
                case LayoutType.BLOCK:
                    score += 0.5;
                    factors.layoutType = 'simple';
                    break;
                default:
                    score += 1.5;
                    factors.layoutType = 'unknown';
            }
            
            // التداخلات
            const nestingLevel = this.calculateNestingLevel(layoutInfo.element);
            if (nestingLevel > 4) {
                score += 3;
                factors.nesting = 'deep';
            } else if (nestingLevel > 2) {
                score += 2;
                factors.nesting = 'moderate';
            } else {
                score += 0.5;
                factors.nesting = 'shallow';
            }
            
            // التخطيطات المختلطة
            if (layoutInfo.layout.isHybrid) {
                score += 2;
                factors.hybrid = true;
            }
            
            // مساواة النتيجة مع المستوى
            complexity.score = score;
            complexity.factors = factors;
            
            if (score >= 8) {
                complexity.level = ComplexityLevel.VERY_COMPLEX;
            } else if (score >= 5) {
                complexity.level = ComplexityLevel.COMPLEX;
            } else if (score >= 2) {
                complexity.level = ComplexityLevel.MODERATE;
            } else {
                complexity.level = ComplexityLevel.SIMPLE;
            }
            
            // اقتراحات بناءً على التعقيد
            if (complexity.level !== ComplexityLevel.SIMPLE) {
                complexity.recommendations = this.generateComplexityRecommendations(complexity);
            }
            
            return complexity;
        }
        
        /**
         * تحليل تعقيد عنصر واحد
         * @param {Element} element - العنصر المراد تحليله
         * @returns {Object} تحليل التعقيد
         */
        analyzeElementComplexity(element) {
            let complexity = 0;
            const factors = [];
            
            // عدد الخصائص المميزة
            const styles = window.getComputedStyle(element);
            const specialProperties = [
                styles.transform,
                styles.transition,
                styles.animation,
                styles.filter
            ].filter(prop => prop && prop !== 'none');
            
            complexity += specialProperties.length * 0.5;
            if (specialProperties.length > 0) {
                factors.push('animations-effects');
            }
            
            // عدد العناصر الفرعية
            const childCount = element.children.length;
            if (childCount > 5) {
                complexity += 2;
                factors.push('many-children');
            } else if (childCount > 2) {
                complexity += 1;
                factors.push('moderate-children');
            }
            
            // عدد المعرفات والفئات
            const classCount = element.classList.length;
            const id = element.id ? 1 : 0;
            
            if (classCount > 5 || id > 0) {
                complexity += 0.5;
                factors.push('complex-selectors');
            }
            
            return {
                score: complexity,
                factors: factors,
                isComplex: complexity > 2
            };
        }
        
        /**
         * حساب مستوى التداخل
         * @param {Element} element - العنصر
         * @returns {number} مستوى التداخل
         */
        calculateNestingLevel(element) {
            let level = 0;
            let current = element.parentElement;
            
            while (current && current !== document.body) {
                level++;
                current = current.parentElement;
            }
            
            return level;
        }
        
        /**
         * تحليل التداخلات
         * @param {Element} parent - العنصر الأب
         * @param {Array} children - العناصر الفرعية
         * @returns {Object} تحليل التداخلات
         */
        analyzeNesting(parent, children) {
            const nesting = {
                depth: this.calculateNestingLevel(parent),
                maxChildDepth: 0,
                problematicLevels: [],
                recommendations: []
            };
            
            // حساب أقصى عمق للعناصر الفرعية
            children.forEach(child => {
                if (child.children) {
                    const childDepth = this.calculateNestingLevel(child.element);
                    nesting.maxChildDepth = Math.max(nesting.maxChildDepth, childDepth);
                }
            });
            
            // كشف المستويات المشكلة
            if (nesting.depth > 6) {
                nesting.problematicLevels.push({
                    level: nesting.depth,
                    issue: 'deep-nesting',
                    severity: 'high'
                });
            }
            
            return nesting;
        }
        
        // ==================== UTILITY METHODS ====================
        
        /**
         * الحصول على العناصر الفرعية التي تؤثر على التخطيط
         * @param {Element} element - العنصر الأب
         * @returns {Array} العناصر الفرعية
         */
        getLayoutChildren(element) {
            const children = Array.from(element.children);
            
            // فلترة العناصر التي تؤثر على التخطيط
            return children.filter(child => {
                const styles = window.getComputedStyle(child);
                return styles.display !== 'none' && 
                       styles.visibility !== 'hidden' &&
                       parseFloat(styles.opacity) > 0;
            });
        }
        
        /**
         * الحصول على أبعاد العنصر
         * @param {Element} element - العنصر
         * @returns {Object} الأبعاد
         */
        getElementDimensions(element) {
            const rect = element.getBoundingClientRect();
            const styles = window.getComputedStyle(element);
            
            return {
                width: rect.width,
                height: rect.height,
                offsetWidth: element.offsetWidth,
                offsetHeight: element.offsetHeight,
                scrollWidth: element.scrollWidth,
                scrollHeight: element.scrollHeight,
                computedWidth: this.parseUnit(styles.width),
                computedHeight: this.parseUnit(styles.height),
                aspectRatio: rect.width / rect.height,
                isOverflowing: element.scrollWidth > element.offsetWidth || 
                              element.scrollHeight > element.offsetHeight
            };
        }
        
        /**
         * الحصول على معلومات الموضع
         * @param {Element} element - العنصر
         * @returns {Object} معلومات الموضع
         */
        getPositioningInfo(element) {
            const styles = window.getComputedStyle(element);
            
            return {
                position: styles.position,
                top: this.parseUnit(styles.top),
                right: this.parseUnit(styles.right),
                bottom: this.parseUnit(styles.bottom),
                left: this.parseUnit(styles.left),
                zIndex: styles.zIndex === 'auto' ? 0 : parseInt(styles.zIndex),
                transform: styles.transform,
                isPositioned: styles.position !== 'static'
            };
        }
        
        /**
         * الحصول على معلومات المسافات
         * @param {Element} element - العنصر
         * @returns {Object} معلومات المسافات
         */
        getSpacingInfo(element) {
            const styles = window.getComputedStyle(element);
            
            return {
                margin: {
                    top: this.parseUnit(styles.marginTop),
                    right: this.parseUnit(styles.marginRight),
                    bottom: this.parseUnit(styles.marginBottom),
                    left: this.parseUnit(styles.marginLeft)
                },
                padding: {
                    top: this.parseUnit(styles.paddingTop),
                    right: this.parseUnit(styles.paddingRight),
                    bottom: this.parseUnit(styles.paddingBottom),
                    left: this.parseUnit(styles.paddingLeft)
                },
                border: {
                    top: this.parseUnit(styles.borderTopWidth),
                    right: this.parseUnit(styles.borderRightWidth),
                    bottom: this.parseUnit(styles.borderBottomWidth),
                    left: this.parseUnit(styles.borderLeftWidth)
                },
                gap: this.parseUnit(styles.gap) || this.parseUnit(styles.rowGap),
                totalHorizontalMargin: this.parseUnit(styles.marginLeft) + this.parseUnit(styles.marginRight),
                totalVerticalMargin: this.parseUnit(styles.marginTop) + this.parseUnit(styles.marginBottom)
            };
        }
        
        /**
         * تحويل القيم إلى أرقام
         * @param {string} value - القيمة
         * @returns {number} الرقم
         */
        parseUnit(value) {
            if (!value || value === '0') return 0;
            const match = value.match(/^(-?\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0;
        }
        
        /**
         * توليد مفتاح الذاكرة المؤقتة
         * @param {Element} element - العنصر
         * @param {Object} options - الخيارات
         * @returns {string} المفتاح
         */
        generateCacheKey(element, options) {
            const elementId = element.dataset.blocId || element.id || 'unknown';
            const optionsHash = JSON.stringify(options);
            const viewportHash = `${this.breakpointAnalyzer.currentViewport.width}x${this.breakpointAnalyzer.currentViewport.height}`;
            
            return `${elementId}_${optionsHash}_${viewportHash}_${this.analysisVersion}`;
        }
        
        // ==================== PERFORMANCE OPTIMIZATION ====================
        
        /**
         * بدء التحليل الدوري
         */
        startPeriodicAnalysis() {
            setInterval(() => {
                if (!this.isAnalyzing && this.monitoredElements.size > 0) {
                    this.performOptimizedBatchAnalysis();
                }
            }, this.analysisConfig.analysisDelay);
        }
        
        /**
         * تنفيذ التحليل المجمع المحسن
         */
        performOptimizedBatchAnalysis() {
            if (this.monitoredElements.size === 0) return;
            
            this.isAnalyzing = true;
            const elements = Array.from(this.monitoredElements).slice(0, this.analysisConfig.batchSize);
            
            // معالجة مجمعة مع تأخير
            setTimeout(() => {
                try {
                    elements.forEach(element => {
                        if (element.isConnected) {
                            this.analyzeCurrentLayout(element, { 
                                suggestOptimizations: false,
                                includeChildren: false
                            });
                        } else {
                            this.monitoredElements.delete(element);
                        }
                    });
                } finally {
                    this.isAnalyzing = false;
                }
            }, 0);
        }
        
        /**
         * تحديث مقاييس الأداء
         * @param {number} analysisTime - وقت التحليل
         */
        updatePerformanceMetrics(analysisTime) {
            this.performanceMetrics.analysisCount++;
            this.performanceMetrics.totalAnalysisTime += analysisTime;
            this.performanceMetrics.lastAnalysis = Date.now();
        }
        
        // ==================== EVENT HANDLING ====================
        
        /**
         * التعامل مع الطفرات (Mutations)
         * @param {Array} mutations - قائمة الطفرات
         */
        handleMutations(mutations) {
            const relevantMutations = mutations.filter(mutation => {
                return mutation.type === 'childList' || 
                       (mutation.type === 'attributes' && 
                        ['class', 'style', 'data-layout-type'].includes(mutation.attributeName));
            });
            
            if (relevantMutations.length > 0) {
                // تأخير التحليل لتجنب التحليل المتكرر
                clearTimeout(this.analysisTimeout);
                this.analysisTimeout = setTimeout(() => {
                    this.handleRelevantMutations(relevantMutations);
                }, 100);
            }
        }
        
        /**
         * التعامل مع الطفرات المهمة
         * @param {Array} mutations - الطفرات المهمة
         */
        handleRelevantMutations(mutations) {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // إعادة تحليل العناصر المتأثرة
                    if (mutation.target && mutation.target.dataset.blocId) {
                        this.monitoredElements.add(mutation.target);
                        this.analyzeCurrentLayout(mutation.target);
                    }
                } else if (mutation.type === 'attributes') {
                    // تحديث حالة العنصر
                    const element = mutation.target;
                    if (element.dataset.blocId && element.isConnected) {
                        this.notifyLayoutChange({
                            type: 'attribute-change',
                            element: element,
                            attributeName: mutation.attributeName,
                            oldValue: mutation.oldValue,
                            newValue: element.getAttribute(mutation.attributeName),
                            timestamp: Date.now()
                        });
                    }
                }
            });
        }
        
        // ==================== CALLBACK MANAGEMENT ====================
        
        /**
         * إضافة مستمع لكشف التخطيط
         * @param {Function} callback - الدالة المستمعة
         */
        onLayoutDetected(callback) {
            this.analysisCallbacks.onLayoutDetected.push(callback);
        }
        
        /**
         * إضافة مستمع لتغيير التخطيط
         * @param {Function} callback - الدالة المستمعة
         */
        onLayoutChanged(callback) {
            this.analysisCallbacks.onLayoutChanged.push(callback);
        }
        
        /**
         * إضافة مستمع لكشف نقاط الكسر
         * @param {Function} callback - الدالة المستمعة
         */
        onBreakpointDetected(callback) {
            this.analysisCallbacks.onBreakpointDetected.push(callback);
        }
        
        /**
         * إضافة مستمع لاقتراحات التحسين
         * @param {Function} callback - الدالة المستمعة
         */
        onOptimizationSuggested(callback) {
            this.analysisCallbacks.onOptimizationSuggested.push(callback);
        }
        
        /**
         * إشعار كشف التخطيط
         * @param {Object} layoutInfo - معلومات التخطيط
         */
        notifyLayoutDetection(layoutInfo) {
            this.analysisCallbacks.onLayoutDetected.forEach(callback => {
                try {
                    callback(layoutInfo);
                } catch (error) {
                    console.error('[LayoutDetectionEngine] ❌ خطأ في مستمع كشف التخطيط:', error);
                }
            });
        }
        
        /**
         * إشعار تغيير التخطيط
         * @param {Object} changeInfo - معلومات التغيير
         */
        notifyLayoutChange(changeInfo) {
            this.analysisCallbacks.onLayoutChanged.forEach(callback => {
                try {
                    callback(changeInfo);
                } catch (error) {
                    console.error('[LayoutDetectionEngine] ❌ خطأ في مستمع تغيير التخطيط:', error);
                }
            });
        }
        
        /**
         * كشف نقاط الكسر
         * @returns {Array} قائمة نقاط الكسر
         */
        detectBreakpoints() {
            const breakpoints = this.breakpointAnalyzer.detectAllBreakpoints();
            
            this.analysisCallbacks.onBreakpointDetected.forEach(callback => {
                try {
                    callback(breakpoints);
                } catch (error) {
                    console.error('[LayoutDetectionEngine] ❌ خطأ في مستمع كشف نقاط الكسر:', error);
                }
            });
            
            console.log(`[LayoutDetectionEngine] 📱 تم كشف ${breakpoints.length} نقطة كسر`);
            return breakpoints;
        }
        
        // ==================== PUBLIC API ====================
        
        /**
         * بدء مراقبة عنصر
         * @param {Element} element - العنصر المراد مراقبته
         * @param {Object} options - خيارات المراقبة
         */
        startMonitoring(element, options = {}) {
            if (!element || !element.isConnected) {
                console.warn('[LayoutDetectionEngine] ⚠️ العنصر غير صالح للمراقبة');
                return false;
            }
            
            this.monitoredElements.add(element);
            
            if (this.observer) {
                const config = {
                    attributes: true,
                    childList: true,
                    subtree: true,
                    ...options
                };
                this.observer.observe(element, config);
            }
            
            // تحليل أولي
            this.analyzeCurrentLayout(element);
            
            console.log(`[LayoutDetectionEngine] 👁️ بدء مراقبة العنصر:`, element.dataset.blocId || element.id);
            return true;
        }
        
        /**
         * إيقاف مراقبة عنصر
         * @param {Element} element - العنصر المراد إيقاف مراقبته
         */
        stopMonitoring(element) {
            if (this.monitoredElements.has(element)) {
                this.monitoredElements.delete(element);
                
                if (this.observer) {
                    this.observer.unobserve(element);
                }
                
                // إزالة من الذاكرة المؤقتة
                const keysToRemove = [];
                this.layoutCache.forEach((value, key) => {
                    if (key.includes(element.dataset.blocId) || key.includes(element.id)) {
                        keysToRemove.push(key);
                    }
                });
                keysToRemove.forEach(key => this.layoutCache.delete(key));
                
                console.log(`[LayoutDetectionEngine] 👁️ إيقاف مراقبة العنصر:`, element.dataset.blocId || element.id);
            }
        }
        
        /**
         * الحصول على تقرير الأداء
         * @returns {Object} تقرير الأداء
         */
        getPerformanceReport() {
            const avgAnalysisTime = this.performanceMetrics.analysisCount > 0 
                ? this.performanceMetrics.totalAnalysisTime / this.performanceMetrics.analysisCount 
                : 0;
            
            return {
                totalAnalyses: this.performanceMetrics.analysisCount,
                averageAnalysisTime: `${avgAnalysisTime.toFixed(2)}ms`,
                cacheHitRate: `${(this.performanceMetrics.cacheHitRate * 100 / this.performanceMetrics.analysisCount || 0).toFixed(1)}%`,
                monitoredElements: this.monitoredElements.size,
                cachedAnalyses: this.layoutCache.size,
                lastAnalysis: this.performanceMetrics.lastAnalysis ? 
                    new Date(this.performanceMetrics.lastAnalysis).toLocaleString() : 'never'
            };
        }
        
        /**
         * الحصول على معلومات نقطة الكسر الحالية
         * @returns {Object} معلومات نقطة الكسر
         */
        getCurrentBreakpoint() {
            return this.breakpointAnalyzer.getCurrentActiveBreakpoint();
        }
        
        /**
         * فرض تحليل فوري لعنصر
         * @param {Element} element - العنصر
         * @param {Object} options - الخيارات
         * @returns {Object} نتيجة التحليل
         */
        forceAnalysis(element, options = {}) {
            // تجاهل الذاكرة المؤقتة
            const originalCacheSetting = this.analysisConfig.enableCaching;
            this.analysisConfig.enableCaching = false;
            
            const result = this.analyzeCurrentLayout(element, options);
            
            // إعادة تفعيل الذاكرة المؤقتة
            this.analysisConfig.enableCaching = originalCacheSetting;
            
            return result;
        }
        
        /**
         * مسح الذاكرة المؤقتة
         */
        clearCache() {
            this.layoutCache.clear();
            console.log('[LayoutDetectionEngine] 🗑️ تم مسح الذاكرة المؤقتة');
        }
        
        /**
         * الحصول على معلومات شاملة عن حالة المحرك
         * @returns {Object} حالة المحرك
         */
        getEngineStatus() {
            return {
                version: '3.0',
                isAnalyzing: this.isAnalyzing,
                analysisVersion: this.analysisVersion,
                monitoredElements: this.monitoredElements.size,
                cacheSize: this.layoutCache.size,
                performance: this.getPerformanceReport(),
                currentBreakpoint: this.getCurrentBreakpoint(),
                configuration: { ...this.analysisConfig },
                viewport: { ...this.breakpointAnalyzer.currentViewport }
            };
        }
    }
    
    // ==================== AUTO-LAYOUT ALGORITHMS ====================
    
    /**
     * خوارزميات التخطيط التلقائي المتقدمة
     */
    class AutoLayoutAlgorithms {
        constructor(layoutEngine) {
            this.layoutEngine = layoutEngine;
            this.spacingCalculator = layoutEngine.spacingCalculator;
        }
        
        /**
         * توليد شبكة ذكية
         * @param {Array} elements - العناصر
         * @param {Object} containerInfo - معلومات الحاوية
         * @returns {Object} إعدادات الشبكة المثلى
         */
        generateSmartGrid(elements, containerInfo) {
            const containerWidth = containerInfo.dimensions.width;
            const elementCount = elements.length;
            
            // حساب عدد الأعمدة المثلى
            const minElementWidth = Math.min(...elements.map(el => el.dimensions.width));
            const maxColumns = Math.floor(containerWidth / (minElementWidth + 20));
            const optimalColumns = Math.min(maxColumns, Math.max(1, Math.ceil(Math.sqrt(elementCount))));
            
            // حساب حجم الأعمدة
            const columnWidth = Math.floor((containerWidth - (optimalColumns - 1) * 16) / optimalColumns);
            
            return {
                gridTemplateColumns: `repeat(${optimalColumns}, ${columnWidth}px)`,
                gap: '16px',
                justifyContent: 'space-between',
                alignItems: 'start'
            };
        }
        
        /**
         * تحسين تخطيط Flexbox
         * @param {Array} elements - العناصر
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Object} إعدادات Flexbox المحسنة
         */
        optimizeFlexboxLayout(elements, layoutInfo) {
            const containerWidth = layoutInfo.element.getBoundingClientRect().width;
            const totalElementWidth = elements.reduce((sum, el) => sum + el.dimensions.width, 0);
            const spaceEfficiency = totalElementWidth / containerWidth;
            
            const optimizations = {
                display: 'flex',
                flexDirection: layoutInfo.direction || 'row'
            };
            
            // تحديد اتجاه مناسب
            if (elements.length > 5 && spaceEfficiency > 0.8) {
                optimizations.flexWrap = 'wrap';
            }
            
            // تحديد justify-content مناسب
            if (spaceEfficiency < 0.6) {
                optimizations.justifyContent = 'space-around';
            } else if (spaceEfficiency < 0.8) {
                optimizations.justifyContent = 'space-between';
            } else {
                optimizations.justifyContent = 'flex-start';
            }
            
            // تحسين align-items
            const hasVariableHeights = Math.max(...elements.map(el => el.dimensions.height)) - 
                                     Math.min(...elements.map(el => el.dimensions.height)) > 20;
            
            if (hasVariableHeights) {
                optimizations.alignItems = 'flex-start';
            } else {
                optimizations.alignItems = 'center';
            }
            
            // تحسين gap
            const optimalSpacing = this.spacingCalculator.calculateOptimalSpacing(elements, LayoutType.FLEX);
            optimizations.gap = `${optimalSpacing.gap}px`;
            
            return optimizations;
        }
        
        /**
         * تسوية المسافات
         * @param {Array} elements - العناصر
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Object} المسافات المسوية
         */
        normalizeSpacing(elements, layoutInfo) {
            const analysis = this.spacingCalculator.analyzeSpacing(elements);
            
            const normalized = {
                container: {},
                elements: {}
            };
            
            // تسوية مسافات الحاوية
            if (layoutInfo.layout.type === LayoutType.FLEX || layoutInfo.layout.type === LayoutType.GRID) {
                const optimalGap = this.spacingCalculator.calculateMedian(analysis.horizontalSpacing) || 16;
                normalized.container.gap = `${optimalGap}px`;
            }
            
            // تسوية مسافات العناصر
            elements.forEach((element, index) => {
                const spacing = this.spacingCalculator.analyzeSpacing([element]);
                const elementId = element.dataset.blocId || `element_${index}`;
                
                normalized.elements[elementId] = {
                    margin: spacing.margins[elementId] || { top: 0, right: 0, bottom: 8, left: 0 },
                    padding: spacing.paddings[elementId] || { top: 16, right: 16, bottom: 16, left: 16 }
                };
            });
            
            return normalized;
        }
        
        /**
         * تصحيح المحاذاة
         * @param {Array} elements - العناصر
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Object} إعدادات المحاذاة المصححة
         */
        correctAlignment(elements, layoutInfo) {
            const alignments = {
                horizontal: 'flex-start',
                vertical: 'flex-start',
                baseline: 'auto'
            };
            
            // تحليل محاذاة العناصر الحالية
            const currentAlignments = elements.map(el => {
                const styles = window.getComputedStyle(el);
                return {
                    textAlign: styles.textAlign,
                    verticalAlign: styles.verticalAlign
                };
            });
            
            // تحديد الاتجاه السائد
            const textAligns = currentAlignments.map(a => a.textAlign).filter(a => a !== 'start' && a !== 'initial');
            const mostCommonAlign = textAligns.length > 0 ? 
                textAligns.sort((a,b) =>
                    textAligns.filter(v => v===a).length - textAligns.filter(v => v===b).length
                ).pop() : 'left';
            
            // تحديد المحاذاة المناسبة
            switch (layoutInfo.layout.type) {
                case LayoutType.FLEX:
                case LayoutType.GRID:
                    if (mostCommonAlign === 'center') {
                        alignments.horizontal = 'center';
                    } else if (mostCommonAlign === 'right') {
                        alignments.horizontal = 'flex-end';
                    } else {
                        alignments.horizontal = 'flex-start';
                    }
                    break;
                    
                case LayoutType.BLOCK:
                    alignments.horizontal = mostCommonAlign;
                    break;
            }
            
            return alignments;
        }
        
        /**
         * إنشاء تحليل شامل للتحسينات
         * @param {Object} layoutInfo - معلومات التخطيط
         * @returns {Object} خطة التحسين الشاملة
         */
        createOptimizationPlan(layoutInfo) {
            const plan = {
                recommendations: [],
                actions: [],
                estimatedImprovements: {
                    performance: 0,
                    maintainability: 0,
                    accessibility: 0,
                    responsive: 0
                }
            };
            
            // تحليل العناصر الفرعية
            const elements = layoutInfo.children || [];
            
            if (elements.length > 0) {
                // توليد شبكة ذكية إذا كانت مفيدة
                if (layoutInfo.layout.type === LayoutType.BLOCK && elements.length >= 3) {
                    const gridOptimization = this.generateSmartGrid(elements, layoutInfo);
                    plan.recommendations.push({
                        type: 'convert-to-grid',
                        priority: 'high',
                        description: 'تحويل إلى شبكة CSS لسهولة التحكم',
                        implementation: gridOptimization
                    });
                    plan.estimatedImprovements.maintainability += 30;
                }
                
                // تحسين Flexbox الموجود
                if (layoutInfo.layout.type === LayoutType.FLEX) {
                    const flexOptimization = this.optimizeFlexboxLayout(elements, layoutInfo);
                    plan.recommendations.push({
                        type: 'flexbox-optimization',
                        priority: 'medium',
                        description: 'تحسين إعدادات Flexbox',
                        implementation: flexOptimization
                    });
                    plan.estimatedImprovements.performance += 20;
                }
                
                // تسوية المسافات
                const spacingOptimization = this.normalizeSpacing(elements, layoutInfo);
                plan.recommendations.push({
                    type: 'spacing-normalization',
                    priority: 'medium',
                    description: 'تسوية المسافات بين العناصر',
                    implementation: spacingOptimization
                });
                plan.estimatedImprovements.accessibility += 25;
            }
            
            // اقتراحات بناءً على التعقيد
            if (layoutInfo.complexity.level === ComplexityLevel.VERY_COMPLEX) {
                plan.recommendations.push({
                    type: 'complexity-reduction',
                    priority: 'high',
                    description: 'تقليل تعقيد التخطيط',
                    implementation: 'component-splitting'
                });
                plan.estimatedImprovements.maintainability += 50;
            }
            
            return plan;
        }
    }
    
    // ==================== USAGE EXAMPLES ====================
    
    /**
     * أمثلة على الاستخدام المتقدم للـ Layout Detection Engine
     */
    class LayoutEngineExamples {
        
        /**
         * مثال 1: تحليل تخطيط بسيط
         */
        static exampleBasicLayoutAnalysis() {
            console.log('📖 مثال 1: تحليل تخطيط بسيط');
            
            const engine = window.BlocVibeLayoutEngine;
            const container = document.querySelector('.container') || document.body;
            
            const analysis = engine.analyzeCurrentLayout(container, {
                includeChildren: true,
                suggestOptimizations: true
            });
            
            console.log('نتيجة التحليل:', {
                نوع_التخطيط: analysis.layout.type,
                عدد_العناصر: analysis.children.length,
                مستوى_التعقيد: analysis.complexity.level,
                عدد_التحسينات: analysis.optimizations.length
            });
        }
        
        /**
         * مثال 2: كشف نقاط الكسر
         */
        static exampleBreakpointDetection() {
            console.log('📖 مثال 2: كشف نقاط الكسر');
            
            const engine = window.BlocVibeLayoutEngine;
            const breakpoints = engine.detectBreakpoints();
            
            console.log('نقاط الكسر المكتشفة:', breakpoints.map(bp => ({
                النوع: bp.type,
                القيمة: `${bp.value}px`,
                المصادر: bp.count
            })));
            
            console.log('النقطة النشطة حالياً:', engine.getCurrentBreakpoint());
        }
        
        /**
         * مثال 3: مراقبة العناصر التلقائية
         */
        static exampleElementMonitoring() {
            console.log('📖 مثال 3: مراقبة العناصر التلقائية');
            
            const engine = window.BlocVibeLayoutEngine;
            
            // مراقبة جميع الحاويات
            const containers = document.querySelectorAll('[data-layout-container], .container, .flex-container, .grid-container');
            
            containers.forEach((container, index) => {
                setTimeout(() => {
                    const success = engine.startMonitoring(container);
                    if (success) {
                        console.log(`✅ بدء مراقبة الحاوية ${index + 1}:`, container.className || container.id);
                    }
                }, index * 100);
            });
            
            // إضافة مستمع للتغييرات
            engine.onLayoutDetected((layoutInfo) => {
                console.log('🔍 تم كشف تخطيط جديد:', {
                    العنصر: layoutInfo.element.className || layoutInfo.element.id,
                    النوع: layoutInfo.layout.type,
                    التعقيد: layoutInfo.complexity.level
                });
            });
        }
        
        /**
         * مثال 4: التحسين التلقائي للتخطيطات
         */
        static exampleAutoOptimization() {
            console.log('📖 مثال 4: التحسين التلقائي للتخطيطات');
            
            const engine = window.BlocVibeLayoutEngine;
            const algorithms = engine.autoLayoutAlgorithms;
            
            // العثور على العناصر المرنة التي تحتاج تحسين
            const flexContainers = document.querySelectorAll('.flex-container, [style*="display: flex"]');
            
            flexContainers.forEach(container => {
                const analysis = engine.analyzeCurrentLayout(container);
                const elements = analysis.children.map(child => child.element);
                
                if (elements.length > 0) {
                    const optimization = algorithms.optimizeFlexboxLayout(elements, analysis);
                    console.log('التحسين المقترح:', optimization);
                }
            });
        }
        
        /**
         * مثال 5: تحليل الأداء والمراقبة
         */
        static examplePerformanceMonitoring() {
            console.log('📖 مثال 5: تحليل الأداء والمراقبة');
            
            const engine = window.BlocVibeLayoutEngine;
            
            // تشغيل عدة تحاليل ومراقبة الأداء
            const containers = document.querySelectorAll('.container').slice(0, 5);
            
            containers.forEach((container, index) => {
                setTimeout(() => {
                    const startTime = performance.now();
                    const analysis = engine.analyzeCurrentLayout(container);
                    const endTime = performance.now();
                    
                    console.log(`📊 تحليل ${index + 1}:`, {
                        وقت_التحليل: `${(endTime - startTime).toFixed(2)}ms`,
                        نوع_التخطيط: analysis.layout.type,
                        العناصر: analysis.children.length
                    });
                }, index * 200);
            });
            
            // إظهار تقرير الأداء بعد فترة
            setTimeout(() => {
                const report = engine.getPerformanceReport();
                console.log('📈 تقرير الأداء الشامل:', report);
            }, 2000);
        }
        
        /**
         * تشغيل جميع الأمثلة
         */
        static runAllExamples() {
            console.log('🎯 تشغيل جميع أمثلة Layout Detection Engine');
            console.log('=' * 60);
            
            this.exampleBasicLayoutAnalysis();
            this.exampleBreakpointDetection();
            
            setTimeout(() => this.exampleElementMonitoring(), 1000);
            setTimeout(() => this.exampleAutoOptimization(), 2000);
            setTimeout(() => this.examplePerformanceMonitoring(), 3000);
            
            console.log('✅ تم جدولة تشغيل جميع الأمثلة');
        }
    }
    
    // ==================== GLOBAL EXPORT ====================
    
    // إنشاء instance عام من المحرك
    const layoutEngine = new LayoutDetectionEngine();
    
    // إضافة خوارزميات التخطيط التلقائي
    layoutEngine.autoLayoutAlgorithms = new AutoLayoutAlgorithms(layoutEngine);
    
    // تصدير للمحرك عالمياً
    window.BlocVibeLayoutEngine = layoutEngine;
    
    // تصدير الأنواع للاستخدام في ملفات أخرى
    window.BlocVibeLayoutType = LayoutType;
    window.BlocVibeLayoutDirection = LayoutDirection;
    window.BlocVibeComplexityLevel = ComplexityLevel;
    window.BlocVibeBreakpointType = BreakpointType;
    window.BlocVibeOptimizationLevel = OptimizationLevel;
    
    // تصدير أمثلة الاستخدام
    window.LayoutEngineExamples = LayoutEngineExamples;
    
    console.log('[LayoutDetectionEngine] 🌟 Layout Detection Engine loaded and ready!');
    console.log('📚 لتشغيل أمثلة الاستخدام: LayoutEngineExamples.runAllExamples()');
    console.log('🔍 لتحليل تخطيط: BlocVibeLayoutEngine.analyzeCurrentLayout(element, options)');
    console.log('👁️ لمراقبة عنصر: BlocVibeLayoutEngine.startMonitoring(element)');
    console.log('📱 لكشف نقاط الكسر: BlocVibeLayoutEngine.detectBreakpoints()');
    console.log('📊 لتقرير الأداء: BlocVibeLayoutEngine.getPerformanceReport()');
    
})();