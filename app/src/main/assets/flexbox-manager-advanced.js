/**
 * BlocVibe Ultra-Advanced Flexbox Manager v4.0
 * نظام إدارة Flexbox متقدم مع تحليل ذكي والتحسين التلقائي
 * 
 * المميزات:
 * - تحليل شامل لفرص استخدام Flexbox
 * - تحويل تلقائي للتخطيطات
 * - تحسين الأداء والأمان
 * - دعم responsive design
 * - توليد media queries تلقائي
 * 
 * @author BlocVibe Team
 * @version 4.0.0
 */

class FlexboxManagerAdvanced {
    constructor() {
        this.flexboxContainers = new Map();
        this.flexboxAnalysis = new Map();
        this.conversionHistory = [];
        this.performanceMetrics = {
            totalAnalyses: 0,
            successfulConversions: 0,
            averageAnalysisTime: 0,
            performanceScore: 0
        };
        
        this.scoringCriteria = {
            childCount: { weight: 0.25, threshold: 2 },
            layoutConsistency: { weight: 0.30, threshold: 0.7 },
            responsiveNeeds: { weight: 0.20, threshold: 0.6 },
            alignmentNeeds: { weight: 0.15, threshold: 0.5 },
            complexity: { weight: 0.10, threshold: 0.4 }
        };
        
        this.observers = new Map();
        this.setupObserver();
        this.setupPerformanceMonitoring();
    }

    /**
     * تحليل شامل لإمكانية استخدام Flexbox
     */
    analyzeFlexboxOpportunities(container, options = {}) {
        const startTime = performance.now();
        
        try {
            const analysis = {
                container: container,
                timestamp: new Date(),
                opportunities: [],
                score: 0,
                recommendations: [],
                alternatives: [],
                conversionRisk: 'low',
                estimatedBenefits: {
                    performance: 0,
                    maintainability: 0,
                    responsiveness: 0
                },
                flexboxProperties: {},
                mediaQueries: [],
                performanceMetrics: {}
            };

            // تحليل عدد العناصر
            const childAnalysis = this.analyzeChildren(container, options);
            analysis.opportunities.push(...childAnalysis.opportunities);
            analysis.score += childAnalysis.score * this.scoringCriteria.childCount.weight;

            // تحليل اتساق التخطيط
            const layoutAnalysis = this.analyzeLayoutConsistency(container);
            analysis.opportunities.push(...layoutAnalysis.opportunities);
            analysis.score += layoutAnalysis.score * this.scoringCriteria.layoutConsistency.weight;

            // تحليل احتياجات responsive
            const responsiveAnalysis = this.analyzeResponsiveNeeds(container, options);
            analysis.opportunities.push(...responsiveAnalysis.opportunities);
            analysis.score += responsiveAnalysis.score * this.scoringCriteria.responsiveNeeds.weight;

            // تحليل احتياجات المحاذاة
            const alignmentAnalysis = this.analyzeAlignmentNeeds(container);
            analysis.opportunities.push(...alignmentAnalysis.opportunities);
            analysis.score += alignmentAnalysis.score * this.scoringCriteria.alignmentNeeds.weight;

            // تحليل مستوى التعقيد
            const complexityAnalysis = this.analyzeComplexity(container);
            analysis.opportunities.push(...complexityAnalysis.opportunities);
            analysis.score += complexityAnalysis.score * this.scoringCriteria.complexity.weight;

            // تحديد مستوى المخاطرة
            analysis.conversionRisk = this.determineConversionRisk(analysis);
            
            // حساب الفوائد المتوقعة
            analysis.estimatedBenefits = this.calculateEstimatedBenefits(analysis);

            // اقتراح خصائص Flexbox
            analysis.flexboxProperties = this.suggestFlexboxProperties(container, analysis);

            // توليد media queries
            analysis.mediaQueries = this.generateMediaQueries(container, analysis);

            // تحديث الأداء
            this.updatePerformanceMetrics(startTime, true);

            // حفظ التحليل
            this.flexboxAnalysis.set(this.getElementKey(container), analysis);

            return analysis;

        } catch (error) {
            this.updatePerformanceMetrics(startTime, false);
            console.error('Error in flexbox analysis:', error);
            return this.createErrorAnalysis(container, error);
        }
    }

    /**
     * تحليل عناصر الحاوية الفرعية
     */
    analyzeChildren(container, options) {
        const children = Array.from(container.children).filter(el => 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
        );

        const opportunities = [];
        let score = 0;

        if (children.length >= this.scoringCriteria.childCount.threshold) {
            // فرصة لتطبيق Flexbox للعناصر المتعددة
            opportunities.push({
                type: 'multiple_children',
                description: `Container has ${children.length} children - ideal for flexbox`,
                priority: 'high',
                score: 0.9,
                properties: ['display: flex', 'flex-direction', 'justify-content']
            });
            score = 0.8;
        }

        // تحليل أحجام العناصر
        const sizeAnalysis = this.analyzeChildSizes(children);
        opportunities.push(...sizeAnalysis.opportunities);
        score = Math.max(score, sizeAnalysis.score);

        return { opportunities, score };
    }

    /**
     * تحليل أحجام العناصر الفرعية
     */
    analyzeChildSizes(children) {
        const opportunities = [];
        let score = 0;

        const widths = children.map(el => el.offsetWidth || el.getBoundingClientRect().width).filter(w => w > 0);
        const heights = children.map(el => el.offsetHeight || el.getBoundingClientRect().height).filter(h => h > 0);

        if (widths.length > 1 && this.hasConsistentPattern(widths)) {
            opportunities.push({
                type: 'consistent_width_pattern',
                description: 'Children have consistent width patterns',
                priority: 'medium',
                score: 0.7,
                properties: ['flex', 'flex-basis', 'flex-grow']
            });
            score = 0.7;
        }

        if (heights.length > 1 && this.hasConsistentPattern(heights)) {
            opportunities.push({
                type: 'consistent_height_pattern',
                description: 'Children have consistent height patterns',
                priority: 'medium',
                score: 0.6,
                properties: ['flex', 'align-items', 'align-self']
            });
            score = Math.max(score, 0.6);
        }

        return { opportunities, score };
    }

    /**
     * تحليل اتساق التخطيط
     */
    analyzeLayoutConsistency(container) {
        const children = Array.from(container.children).filter(el => 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
        );

        const opportunities = [];
        let score = 0;

        // تحليل الاتجاه الأفقي
        const horizontalAlignment = this.analyzeHorizontalAlignment(children);
        if (horizontalAlignment.score > this.scoringCriteria.layoutConsistency.threshold) {
            opportunities.push({
                type: 'horizontal_alignment',
                description: 'Elements need horizontal alignment control',
                priority: 'high',
                score: 0.8,
                properties: ['flex-direction: row', 'justify-content']
            });
            score = 0.8;
        }

        // تحليل الاتجاه العمودي
        const verticalAlignment = this.analyzeVerticalAlignment(children);
        if (verticalAlignment.score > this.scoringCriteria.layoutConsistency.threshold) {
            opportunities.push({
                type: 'vertical_alignment',
                description: 'Elements need vertical alignment control',
                priority: 'high',
                score: 0.8,
                properties: ['flex-direction: column', 'justify-content']
            });
            score = Math.max(score, 0.8);
        }

        // تحليل توزيع المسافات
        const spacingAnalysis = this.analyzeSpacingConsistency(children);
        opportunities.push(...spacingAnalysis.opportunities);
        score = Math.max(score, spacingAnalysis.score);

        return { opportunities, score };
    }

    /**
     * تحليل احتياجات responsive design
     */
    analyzeResponsiveNeeds(container, options) {
        const opportunities = [];
        let score = 0;

        // تحليل حجم الحاوية
        const containerWidth = container.offsetWidth || container.getBoundingClientRect().width;
        if (containerWidth > 768) { // الشاشة المتوسطة
            opportunities.push({
                type: 'large_screen_optimization',
                description: 'Container size suggests desktop optimization with flexbox',
                priority: 'medium',
                score: 0.6,
                properties: ['flex-wrap', 'gap', 'media queries']
            });
            score = 0.6;
        }

        // تحليل التخطيط المعقد
        if (this.hasComplexLayout(container)) {
            opportunities.push({
                type: 'complex_layout',
                description: 'Complex layout would benefit from flexbox responsive control',
                priority: 'high',
                score: 0.8,
                properties: ['flex-wrap', 'media queries', 'flex-basis']
            });
            score = 0.8;
        }

        return { opportunities, score };
    }

    /**
     * تحليل احتياجات المحاذاة
     */
    analyzeAlignmentNeeds(container) {
        const children = Array.from(container.children).filter(el => 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
        );

        const opportunities = [];
        let score = 0;

        // تحليل محاذاة النص
        const textAlignments = children.map(el => 
            window.getComputedStyle(el).textAlign
        ).filter(align => align !== 'start');

        if (textAlignments.length > 0) {
            opportunities.push({
                type: 'text_alignment',
                description: 'Elements have text alignment that could be controlled with flexbox',
                priority: 'medium',
                score: 0.5,
                properties: ['align-items', 'align-self', 'text-align']
            });
            score = 0.5;
        }

        // تحليل margin spacing
        const marginAnalysis = this.analyzeMarginUsage(children);
        opportunities.push(...marginAnalysis.opportunities);
        score = Math.max(score, marginAnalysis.score);

        return { opportunities, score };
    }

    /**
     * تحليل مستوى التعقيد
     */
    analyzeComplexity(container) {
        const complexityScore = this.calculateComplexityScore(container);
        
        const opportunities = [];
        let score = 0;

        if (complexityScore > this.scoringCriteria.complexity.threshold) {
            opportunities.push({
                type: 'complex_layout_simplification',
                description: 'Complex layout could be simplified with flexbox',
                priority: 'medium',
                score: 0.4,
                properties: ['flex-direction', 'flex-wrap', 'gap']
            });
            score = 0.4;
        }

        return { opportunities, score };
    }

    /**
     * تحويل تلقائي للتخطيط إلى Flexbox
     */
    convertToFlexbox(container, options = {}) {
        const analysis = this.flexboxAnalysis.get(this.getElementKey(container)) || 
                        this.analyzeFlexboxOpportunities(container, options);
        
        if (analysis.score < 0.6) {
            throw new Error('Flexbox conversion not recommended - low score: ' + analysis.score);
        }

        try {
            const conversionStart = performance.now();
            
            // حفظ الحالة الحالية
            const originalState = this.captureContainerState(container);

            // تطبيق خصائص Flexbox
            this.applyFlexboxProperties(container, analysis.flexboxProperties);

            // تطبيق media queries إذا لزم الأمر
            if (analysis.mediaQueries.length > 0) {
                this.applyMediaQueries(container, analysis.mediaQueries);
            }

            // إضافة أمان للتحويل
            this.addConversionSafety(container, originalState);

            // تحديث الأداء
            const conversionTime = performance.now() - conversionStart;
            this.recordSuccessfulConversion(container, analysis, conversionTime);

            // إشعار النجاح
            this.notifyConversion(container, analysis);

            return {
                success: true,
                container: container,
                analysis: analysis,
                conversionTime: conversionTime,
                properties: analysis.flexboxProperties,
                mediaQueries: analysis.mediaQueries
            };

        } catch (error) {
            this.recordFailedConversion(container, analysis, error);
            console.error('Flexbox conversion failed:', error);
            
            // محاولة الاسترجاع
            this.attemptRecovery(container, originalState);
            
            throw error;
        }
    }

    /**
     * تطبيق خصائص Flexbox
     */
    applyFlexboxProperties(container, properties) {
        // تطبيق الخصائص الأساسية
        if (properties.display) {
            container.style.display = properties.display;
        }

        if (properties.flexDirection) {
            container.style.flexDirection = properties.flexDirection;
        }

        if (properties.justifyContent) {
            container.style.justifyContent = properties.justifyContent;
        }

        if (properties.alignItems) {
            container.style.alignItems = properties.alignItems;
        }

        if (properties.alignContent) {
            container.style.alignContent = properties.alignContent;
        }

        if (properties.flexWrap) {
            container.style.flexWrap = properties.flexWrap;
        }

        if (properties.gap !== undefined) {
            container.style.gap = properties.gap;
        }

        // تطبيق خصائص العناصر الفرعية
        if (properties.childProperties) {
            const children = Array.from(container.children).filter(el => 
                el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
            );

            properties.childProperties.forEach((childProp, index) => {
                if (children[index]) {
                    Object.keys(childProp).forEach(prop => {
                        children[index].style[prop] = childProp[prop];
                    });
                }
            });
        }
    }

    /**
     * توليد media queries تلقائي
     */
    generateMediaQueries(container, analysis) {
        const mediaQueries = [];
        const containerWidth = container.offsetWidth || container.getBoundingClientRect().width;

        // Query للشاشات الصغيرة
        if (containerWidth > 480) {
            const smallScreenQuery = {
                condition: '@media (max-width: 768px)',
                properties: this.generateSmallScreenProperties(analysis),
                priority: 'high'
            };
            mediaQueries.push(smallScreenQuery);
        }

        // Query للشاشات المتوسطة
        if (containerWidth > 768) {
            const mediumScreenQuery = {
                condition: '@media (min-width: 769px) and (max-width: 1024px)',
                properties: this.generateMediumScreenProperties(analysis),
                priority: 'medium'
            };
            mediaQueries.push(mediumScreenQuery);
        }

        return mediaQueries;
    }

    /**
     * توليد خصائص للشاشات الصغيرة
     */
    generateSmallScreenProperties(analysis) {
        return {
            'flex-direction': 'column',
            'align-items': 'stretch',
            'justify-content': 'flex-start',
            'gap': '0.5rem'
        };
    }

    /**
     * توليد خصائص للشاشات المتوسطة
     */
    generateMediumScreenProperties(analysis) {
        return {
            'flex-direction': analysis.flexboxProperties.flexDirection || 'row',
            'align-items': 'center',
            'justify-content': 'space-between',
            'gap': '1rem'
        };
    }

    /**
     * استرجاع التخطيط الأصلي
     */
    revertFlexbox(container) {
        const key = this.getElementKey(container);
        
        if (!this.conversionHistory.some(entry => 
            entry.container === container && entry.reverted === false
        )) {
            throw new Error('No flexbox conversion found to revert');
        }

        try {
            const historyEntry = this.conversionHistory.find(entry => 
                entry.container === container && entry.reverted === false
            );

            // استرجاع الحالة الأصلية
            this.restoreContainerState(container, historyEntry.originalState);

            // إزالة خصائص Flexbox
            this.removeFlexboxProperties(container);

            // إزالة media queries
            this.removeMediaQueries(container, historyEntry.mediaQueries);

            // تحديث الحالة
            historyEntry.reverted = true;
            historyEntry.revertTime = new Date();

            // إشعار الاسترجاع
            this.notifyRevert(container, historyEntry);

            return { success: true, reverted: true };

        } catch (error) {
            console.error('Error reverting flexbox conversion:', error);
            throw error;
        }
    }

    /**
     * تحسين تخطيط Flexbox الموجود
     */
    optimizeFlexboxLayout(container) {
        const currentFlexboxProps = this.extractCurrentFlexboxProperties(container);
        const optimizationSuggestions = this.analyzeFlexboxOptimization(container, currentFlexboxProps);

        const optimizations = [];

        optimizationSuggestions.forEach(suggestion => {
            if (suggestion.improvementScore > 0.3) {
                optimizations.push(suggestion);
            }
        });

        // تطبيق التحسينات
        optimizations.forEach(optimization => {
            this.applyFlexboxOptimization(container, optimization);
        });

        return {
            optimizationsApplied: optimizations.length,
            improvements: optimizations,
            originalProperties: currentFlexboxProps,
            optimizedProperties: this.extractCurrentFlexboxProperties(container)
        };
    }

    /**
     * تحليل فرص تحسين Flexbox
     */
    analyzeFlexboxOptimization(container, currentProps) {
        const suggestions = [];
        const children = Array.from(container.children).filter(el => 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE'
        );

        // تحليل اتجاه التخطيط
        if (currentProps.flexDirection === 'row' && this.hasVerticalSpace(container)) {
            suggestions.push({
                type: 'direction_optimization',
                description: 'Consider changing to column layout for better space utilization',
                current: currentProps.flexDirection,
                suggestion: 'column',
                improvementScore: 0.6,
                properties: { 'flex-direction': 'column' }
            });
        }

        // تحليل justify-content
        const justifyContentAnalysis = this.analyzeJustifyContentNeeds(container, children);
        if (justifyContentAnalysis.improvementScore > 0.3) {
            suggestions.push({
                type: 'justify_content_optimization',
                description: 'Better justify-content value for current layout',
                current: currentProps.justifyContent,
                suggestion: justifyContentAnalysis.suggestedValue,
                improvementScore: justifyContentAnalysis.improvementScore,
                properties: { 'justify-content': justifyContentAnalysis.suggestedValue }
            });
        }

        // تحليل gap spacing
        const gapAnalysis = this.analyzeGapSpacing(children);
        if (gapAnalysis.improvementScore > 0.4) {
            suggestions.push({
                type: 'gap_optimization',
                description: 'Optimal gap spacing for better visual balance',
                current: currentProps.gap,
                suggestion: gapAnalysis.suggestedValue,
                improvementScore: gapAnalysis.improvementScore,
                properties: { 'gap': gapAnalysis.suggestedValue }
            });
        }

        return suggestions;
    }

    /**
     * إضافة مراقبة للتغييرات
     */
    setupObserver() {
        this.observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.handleChildListMutation(mutation);
                } else if (mutation.type === 'attributes') {
                    this.handleAttributeMutation(mutation);
                }
            });
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
    }

    /**
     * معالجة تغييرات قائمة الأطفال
     */
    handleChildListMutation(mutation) {
        const addedNodes = Array.from(mutation.addedNodes);
        const removedNodes = Array.from(mutation.removedNodes);

        // تحليل العناصر المضافة
        addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                this.analyzeNewElement(node);
            }
        });

        // تحليل العناصر المحذوفة
        removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
                this.cleanupRemovedElement(node);
            }
        });
    }

    /**
     * معالجة تغييرات الخصائص
     */
    handleAttributeMutation(mutation) {
        const target = mutation.target;
        if (target.style && this.isFlexboxContainer(target)) {
            // تحليل التغييرات على خصائص Flexbox
            this.analyzeFlexboxChange(target, mutation.attributeName);
        }
    }

    /**
     * إعداد مراقبة الأداء
     */
    setupPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000); // كل 5 ثواني
    }

    /**
     * تحديث مقاييس الأداء
     */
    updatePerformanceMetrics(startTime = null, success = null) {
        this.performanceMetrics.totalAnalyses++;
        
        if (startTime && success !== null) {
            const analysisTime = performance.now() - startTime;
            this.performanceMetrics.averageAnalysisTime = 
                (this.performanceMetrics.averageAnalysisTime + analysisTime) / 2;
            
            if (success) {
                this.performanceMetrics.successfulConversions++;
            }
        }

        this.performanceMetrics.performanceScore = 
            this.calculatePerformanceScore();
    }

    /**
     * حساب نتيجة الأداء
     */
    calculatePerformanceScore() {
        const conversionRate = this.performanceMetrics.totalAnalyses > 0 ?
            this.performanceMetrics.successfulConversions / this.performanceMetrics.totalAnalyses : 0;
        
        const speedScore = this.performanceMetrics.averageAnalysisTime < 100 ? 1 : 
            Math.max(0, 1 - (this.performanceMetrics.averageAnalysisTime - 100) / 1000);

        return (conversionRate * 0.6 + speedScore * 0.4) * 100;
    }

    // دوال مساعدة

    getElementKey(element) {
        return element.id || element.className || element.tagName + '_' + Math.random().toString(36).substr(2, 9);
    }

    hasConsistentPattern(values) {
        if (values.length < 2) return false;
        
        const sorted = [...values].sort((a, b) => a - b);
        const differences = [];
        
        for (let i = 1; i < sorted.length; i++) {
            differences.push(Math.abs(sorted[i] - sorted[i-1]));
        }
        
        const avgDiff = differences.reduce((sum, diff) => sum + diff, 0) / differences.length;
        const variance = differences.reduce((sum, diff) => sum + Math.pow(diff - avgDiff, 2), 0) / differences.length;
        
        return variance < (avgDiff * 0.1); // tolerance for pattern consistency
    }

    analyzeHorizontalAlignment(children) {
        // تحليل المحاذاة الأفقية
        const alignments = children.map(el => {
            const style = window.getComputedStyle(el);
            return {
                float: style.float,
                display: style.display,
                position: style.position,
                marginLeft: style.marginLeft,
                marginRight: style.marginRight
            };
        });

        // حساب درجة الاتساق
        const consistency = this.calculateAlignmentConsistency(alignments);
        
        return {
            score: consistency,
            needsAlignment: consistency > 0.7
        };
    }

    analyzeVerticalAlignment(children) {
        // تحليل المحاذاة العمودية
        const alignments = children.map(el => {
            const style = window.getComputedStyle(el);
            return {
                verticalAlign: style.verticalAlign,
                marginTop: style.marginTop,
                marginBottom: style.marginBottom,
                lineHeight: style.lineHeight
            };
        });

        const consistency = this.calculateAlignmentConsistency(alignments);
        
        return {
            score: consistency,
            needsAlignment: consistency > 0.7
        };
    }

    calculateAlignmentConsistency(alignments) {
        // حساب درجة الاتساق بين عناصر المحاذاة
        const properties = Object.keys(alignments[0]);
        let totalConsistency = 0;

        properties.forEach(prop => {
            const values = alignments.map(alignment => alignment[prop]);
            const uniqueValues = [...new Set(values)];
            const consistency = 1 - (uniqueValues.length - 1) / values.length;
            totalConsistency += consistency;
        });

        return totalConsistency / properties.length;
    }

    determineConversionRisk(analysis) {
        if (analysis.score > 0.8) return 'low';
        if (analysis.score > 0.6) return 'medium';
        return 'high';
    }

    calculateEstimatedBenefits(analysis) {
        return {
            performance: Math.min(analysis.score * 20, 15),
            maintainability: Math.min(analysis.score * 25, 20),
            responsiveness: Math.min(analysis.score * 30, 25)
        };
    }

    suggestFlexboxProperties(container, analysis) {
        const properties = {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'stretch',
            flexWrap: 'nowrap',
            gap: '0'
        };

        // تحديد الاتجاه بناءً على تحليل النتائج
        if (analysis.opportunities.some(op => op.type === 'vertical_alignment')) {
            properties.flexDirection = 'column';
            properties.justifyContent = 'flex-start';
        } else if (analysis.opportunities.some(op => op.type === 'horizontal_alignment')) {
            properties.flexDirection = 'row';
            properties.justifyContent = 'space-between';
        }

        // تحديد المحاذاة
        if (analysis.opportunities.some(op => op.type === 'text_alignment')) {
            properties.alignItems = 'center';
        }

        return properties;
    }

    // ... باقي الدوال المساعدة

    captureContainerState(container) {
        return {
            style: { ...container.style },
            className: container.className,
            children: Array.from(container.children).map(child => ({
                element: child,
                style: { ...child.style },
                className: child.className
            }))
        };
    }

    restoreContainerState(container, originalState) {
        // استرجاع خصائص الحاوية
        Object.assign(container.style, originalState.style);
        container.className = originalState.className;

        // استرجاع خصائص الأطفال
        originalState.children.forEach(childState => {
            Object.assign(childState.element.style, childState.style);
            childState.element.className = childState.className;
        });
    }

    removeFlexboxProperties(container) {
        const flexboxProps = [
            'display', 'flexDirection', 'justifyContent', 'alignItems', 
            'alignContent', 'flexWrap', 'gap', 'flex', 'flexBasis', 
            'flexGrow', 'flexShrink', 'alignSelf', 'order'
        ];

        flexboxProps.forEach(prop => {
            container.style[prop] = '';
        });

        // إزالة خصائص الأطفال أيضاً
        const children = Array.from(container.children);
        children.forEach(child => {
            flexboxProps.forEach(prop => {
                child.style[prop] = '';
            });
        });
    }

    isFlexboxContainer(element) {
        return window.getComputedStyle(element).display === 'flex';
    }

    // دوال أحداث وإشعارات
    notifyConversion(container, analysis) {
        const event = new CustomEvent('flexboxConversion', {
            detail: { container, analysis }
        });
        document.dispatchEvent(event);
    }

    notifyRevert(container, historyEntry) {
        const event = new CustomEvent('flexboxRevert', {
            detail: { container, historyEntry }
        });
        document.dispatchEvent(event);
    }

    // Public API
    getFlexboxAnalysis(container) {
        return this.flexboxAnalysis.get(this.getElementKey(container));
    }

    getAllFlexboxContainers() {
        return Array.from(this.flexboxContainers.keys());
    }

    getPerformanceReport() {
        return {
            metrics: this.performanceMetrics,
            conversionsCount: this.conversionHistory.length,
            activeAnalyses: this.flexboxAnalysis.size,
            recentActivity: this.conversionHistory.slice(-10)
        };
    }

    exportFlexboxConfiguration(container) {
        const analysis = this.getFlexboxAnalysis(container);
        if (!analysis) {
            throw new Error('No flexbox analysis found for this container');
        }

        return {
            container: {
                id: container.id,
                className: container.className,
                tagName: container.tagName
            },
            properties: analysis.flexboxProperties,
            mediaQueries: analysis.mediaQueries,
            analysis: {
                score: analysis.score,
                opportunities: analysis.opportunities,
                recommendations: analysis.recommendations
            },
            performance: analysis.performanceMetrics,
            exportDate: new Date().toISOString()
        };
    }
}

// إنشاء مثيل عام
window.FlexboxManagerAdvanced = new FlexboxManagerAdvanced();

// تصدير للاستخدام
window.BlocVibeCanvas = window.BlocVibeCanvas || {};
window.BlocVibeCanvas.flexboxManager = window.FlexboxManagerAdvanced;