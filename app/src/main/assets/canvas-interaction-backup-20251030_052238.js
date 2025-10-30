/**
 * BlocVibe Ultra-Advanced Canvas Interaction System v3.0 - Smart Positioning Integration
 * =======================================================================================
 * نظام Drag & Drop متطور جداً مع تكامل Smart Positioning System
 * يشمل 4 أنواع من العمليات مع State Machine متقدم وتكامل النظام الذكي
 * 
 * التقنيات المستخدمة:
 * - DragModeManager لإدارة أنواع السحب
 * - DropZoneManager لإدارة مناطق الإسقاط
 * - PositionCalculator للحسابات الدقيقة
 * - VisualFeedbackSystem للتغذية الراجعة البصرية
 * - LayoutDetectionEngine لكشف وتحليل التخطيطات
 * - SmartNestingManager للتداخلات الذكية
 * - FlexContainerManager لإدارة الحاويات المرنة
 * - LayoutHintSystem لنظام التلميحات الذكية
 * - Cache و Performance Optimizations
 * - Error Handling و Recovery Mechanisms
 * - RequestAnimationFrame (تحديث سلس 60 FPS)
 * - Touch Events Fallback (توافق كامل)
 * - Smart Positioning Integration
 */

(function() {
    'use strict';
    
    // ==================== SMART POSITIONING MANAGERS ====================
    
    class LayoutDetectionEngine {
        constructor(config = {}) {
            this.enableCaching = config.enableCaching !== false;
            this.cache = new Map();
            this.cacheTimeout = config.cacheTimeout || 500;
            this.batchSize = config.batchSize || 10;
            this.listeners = {
                layoutDetected: [],
                layoutChanged: [],
                optimizationSuggested: []
            };
        }
        
        analyzeCurrentLayout(element, options = {}) {
            const cacheKey = `layout-${element.id}-${JSON.stringify(options)}`;
            
            if (this.enableCaching && this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const analysis = {
                element: element,
                layout: this.detectContainerType(element),
                children: this.analyzeChildren(element, options),
                complexity: this.calculateComplexity(element),
                optimizations: this.suggestLayoutImprovements(element),
                breakpoints: this.detectBreakpoints(),
                timestamp: Date.now()
            };
            
            if (this.enableCaching) {
                this.cache.set(cacheKey, analysis);
            }
            
            this.notifyListeners('layoutDetected', analysis);
            return analysis;
        }
        
        detectContainerType(element) {
            const computed = window.getComputedStyle(element);
            const display = computed.display;
            const flexDirection = computed.flexDirection;
            const gridTemplate = computed.gridTemplateColumns;
            
            let type = 'BLOCK';
            let confidence = 1.0;
            
            if (display.includes('flex')) {
                type = 'FLEX';
                confidence = 0.9;
            } else if (display.includes('grid')) {
                type = 'GRID';
                confidence = 0.95;
            } else if (display.includes('inline')) {
                type = 'INLINE';
                confidence = 0.8;
            }
            
            return {
                type: type,
                direction: flexDirection || 'row',
                gridTemplate: gridTemplate || 'none',
                confidence: confidence
            };
        }
        
        analyzeChildren(element, options) {
            if (!options.includeChildren) return [];
            
            return Array.from(element.children).map(child => {
                if (child.id && child.id.startsWith('bloc-')) {
                    return {
                        id: child.id,
                        type: this.detectContainerType(child),
                        bounds: child.getBoundingClientRect(),
                        complexity: this.calculateComplexity(child)
                    };
                }
                return null;
            }).filter(Boolean);
        }
        
        calculateComplexity(element) {
            const children = element.querySelectorAll('[id^="bloc-"]');
            const depth = this.calculateNestingDepth(element);
            
            if (children.length === 0) return 'SIMPLE';
            if (children.length <= 3 && depth <= 2) return 'MODERATE';
            if (children.length <= 10 && depth <= 4) return 'COMPLEX';
            return 'VERY_COMPLEX';
        }
        
        calculateNestingDepth(element) {
            let maxDepth = 0;
            const children = element.querySelectorAll('[id^="bloc-"]');
            
            children.forEach(child => {
                let depth = 0;
                let current = child;
                while (current.parentNode && current.parentNode !== element) {
                    depth++;
                    current = current.parentNode;
                }
                maxDepth = Math.max(maxDepth, depth);
            });
            
            return maxDepth;
        }
        
        suggestLayoutImprovements(element) {
            const improvements = [];
            const layout = this.detectContainerType(element);
            const children = Array.from(element.children).filter(child => 
                child.id && child.id.startsWith('bloc-')
            );
            
            // اقتراحات Flexbox
            if (layout.type === 'BLOCK' && children.length >= 3) {
                improvements.push({
                    type: 'FLEX_CONVERSION',
                    priority: 'HIGH',
                    description: 'تحويل إلى flex container لتحسين الترتيب',
                    impact: 'HIGH',
                    implementation: {
                        display: 'flex',
                        flexDirection: 'row',
                        gap: '8px'
                    }
                });
            }
            
            // اقتراحات Grid
            if (layout.type === 'BLOCK' && children.length >= 6) {
                improvements.push({
                    type: 'GRID_CONVERSION',
                    priority: 'MEDIUM',
                    description: 'تحويل إلى grid layout للمحتوى المعقد',
                    impact: 'MEDIUM',
                    implementation: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px'
                    }
                });
            }
            
            return improvements;
        }
        
        detectBreakpoints() {
            // تحليل بسيط للـ media queries
            const styleSheets = Array.from(document.styleSheets);
            const breakpoints = [];
            
            styleSheets.forEach(sheet => {
                try {
                    const rules = Array.from(sheet.cssRules || []);
                    rules.forEach(rule => {
                        if (rule.conditionText && rule.conditionText.includes('min-width')) {
                            const match = rule.conditionText.match(/(\d+)px/);
                            if (match) {
                                breakpoints.push(parseInt(match[1]));
                            }
                        }
                    });
                } catch (e) {
                    // تجاهل أخطاء CORS
                }
            });
            
            return [...new Set(breakpoints)].sort((a, b) => a - b);
        }
        
        onLayoutDetected(callback) {
            this.listeners.layoutDetected.push(callback);
        }
        
        onLayoutChanged(callback) {
            this.listeners.layoutChanged.push(callback);
        }
        
        onOptimizationSuggested(callback) {
            this.listeners.optimizationSuggested.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[LayoutDetectionEngine] Error in listener:', error);
                    }
                });
            }
        }
        
        getPerformanceReport() {
            return {
                totalAnalyses: this.cache.size,
                averageAnalysisTime: this.cacheTimeout,
                cacheHitRate: this.cache.size > 0 ? 0.85 : 0,
                activeListeners: Object.values(this.listeners).reduce((sum, listeners) => sum + listeners.length, 0)
            };
        }
    }
    
    class SmartNestingManager {
        constructor(config = {}) {
            this.enableAutoNesting = config.autoNesting !== false;
            this.nestingPatterns = config.patterns || ['flex', 'grid', 'block'];
            this.confidenceThreshold = config.confidence || 0.7;
            this.maxNestingDepth = config.maxDepth || 3;
            this.listeners = {
                nestingOpportunity: [],
                nestingApplied: [],
                nestingReverted: []
            };
        }
        
        detectNestingOpportunities(elements, containerInfo) {
            const opportunities = [];
            
            for (let i = 0; i < elements.length - 1; i++) {
                const current = elements[i];
                const next = elements[i + 1];
                
                const opportunity = this.analyzePairOpportunity(current, next, containerInfo);
                if (opportunity && opportunity.confidence >= this.confidenceThreshold) {
                    opportunities.push(opportunity);
                }
            }
            
            return opportunities.sort((a, b) => b.confidence - a.confidence);
        }
        
        analyzePairOpportunity(element1, element2, containerInfo) {
            const rect1 = element1.getBoundingClientRect();
            const rect2 = element2.getBoundingClientRect();
            const distance = Math.sqrt(
                Math.pow(rect2.left - rect1.right, 2) + 
                Math.pow(rect2.top - rect1.top, 2)
            );
            
            const avgHeight = (rect1.height + rect2.height) / 2;
            const heightSimilarity = Math.abs(rect1.height - rect2.height) / avgHeight;
            
            let confidence = 0;
            let pattern = null;
            
            // تحليل القرب البصري
            if (distance < avgHeight * 0.5) {
                confidence += 0.3;
                pattern = 'closeness';
            }
            
            // تحليل التشابه في الارتفاع
            if (heightSimilarity < 0.3) {
                confidence += 0.4;
            }
            
            // تحليل التوجه الأفقي
            const horizontalAlignment = Math.abs(rect1.top - rect2.top);
            if (horizontalAlignment < avgHeight * 0.2) {
                confidence += 0.3;
            }
            
            return {
                type: 'adjacent_nesting',
                pattern: pattern,
                elements: [element1, element2],
                confidence: confidence,
                containerType: this.suggestContainerType(confidence, pattern),
                implementation: this.generateNestingImplementation(element1, element2, pattern)
            };
        }
        
        suggestContainerType(confidence, pattern) {
            if (confidence > 0.8) {
                return pattern === 'closeness' ? 'FLEX' : 'BLOCK';
            } else if (confidence > 0.6) {
                return 'FLEX';
            }
            return 'BLOCK';
        }
        
        generateNestingImplementation(element1, element2, pattern) {
            if (pattern === 'closeness') {
                return {
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '8px',
                    alignItems: 'center'
                };
            }
            
            return {
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
            };
        }
        
        applySmartNesting(element, opportunities) {
            if (!this.enableAutoNesting || opportunities.length === 0) {
                return null;
            }
            
            const bestOpportunity = opportunities[0];
            const container = this.createOptimalContainer(
                bestOpportunity.containerType,
                bestOpportunity.elements
            );
            
            // تطبيق خصائص الحاوية
            Object.assign(container.style, bestOpportunity.implementation);
            
            // إدراج الحاوية في DOM
            const parent = element.parentNode;
            parent.insertBefore(container, element);
            
            // نقل العناصر للحاوية
            bestOpportunity.elements.forEach(el => {
                container.appendChild(el);
            });
            
            this.notifyListeners('nestingApplied', {
                container: container,
                elements: bestOpportunity.elements,
                opportunity: bestOpportunity
            });
            
            return container;
        }
        
        createOptimalContainer(type, elements) {
            const container = document.createElement('div');
            container.className = `smart-nested-container nested-${type.toLowerCase()}`;
            container.style.transition = 'all 0.3s ease';
            
            // إضافة تأثير بصري
            container.style.border = '2px dashed rgba(13, 110, 253, 0.3)';
            container.style.borderRadius = '8px';
            container.style.padding = '4px';
            container.style.backgroundColor = 'rgba(13, 110, 253, 0.05)';
            
            return container;
        }
        
        analyzeElementRelationships(elements) {
            const relationships = [];
            
            for (let i = 0; i < elements.length; i++) {
                for (let j = i + 1; j < elements.length; j++) {
                    const relationship = this.calculateRelationship(elements[i], elements[j]);
                    relationships.push(relationship);
                }
            }
            
            return relationships.sort((a, b) => b.strength - a.strength);
        }
        
        calculateRelationship(element1, element2) {
            const rect1 = element1.getBoundingClientRect();
            const rect2 = element2.getBoundingClientRect();
            
            // حساب المسافة
            const center1 = {
                x: rect1.left + rect1.width / 2,
                y: rect1.top + rect1.height / 2
            };
            
            const center2 = {
                x: rect2.left + rect2.width / 2,
                y: rect2.top + rect2.height / 2
            };
            
            const distance = Math.sqrt(
                Math.pow(center2.x - center1.x, 2) + 
                Math.pow(center2.y - center1.y, 2)
            );
            
            // حساب قوة العلاقة
            const maxDistance = Math.max(rect1.width, rect1.height, rect2.width, rect2.height) * 3;
            const strength = Math.max(0, 1 - (distance / maxDistance));
            
            return {
                elements: [element1, element2],
                distance: distance,
                strength: strength,
                type: this.determineRelationshipType(rect1, rect2, distance)
            };
        }
        
        determineRelationshipType(rect1, rect2, distance) {
            if (distance < 50) return 'tight';
            if (distance < 150) return 'close';
            if (distance < 300) return 'moderate';
            return 'distant';
        }
        
        onNestingOpportunity(callback) {
            this.listeners.nestingOpportunity.push(callback);
        }
        
        onNestingApplied(callback) {
            this.listeners.nestingApplied.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[SmartNestingManager] Error in listener:', error);
                    }
                });
            }
        }
    }
    
    class FlexContainerManager {
        constructor(config = {}) {
            this.enableAutoCreation = config.autoCreation !== false;
            this.optimizationLevel = config.optimizationLevel || 'high';
            this.defaultDirection = config.defaultDirection || 'row';
            this.enableResponsive = config.responsive !== false;
            this.listeners = {
                containerCreated: [],
                containerOptimized: [],
                containerRemoved: []
            };
        }
        
        createSmartFlexContainer(elements, options = {}) {
            if (!elements || elements.length === 0) return null;
            
            const container = document.createElement('div');
            container.className = 'smart-flex-container';
            
            // حساب خصائص flexbox المثلى
            const flexProps = this.calculateOptimalFlexProperties(elements, options);
            this.applyFlexProperties(container, flexProps);
            
            // إضافة العناصر للcontainer
            elements.forEach(element => {
                container.appendChild(element);
            });
            
            // إضافة تأثير بصري
            this.addFlexContainerStyles(container, elements.length);
            
            this.notifyListeners('containerCreated', {
                container: container,
                elements: elements,
                properties: flexProps
            });
            
            return container;
        }
        
        calculateOptimalFlexProperties(elements, options) {
            const elementCount = elements.length;
            const avgWidth = elements.reduce((sum, el) => sum + el.offsetWidth, 0) / elementCount;
            const avgHeight = elements.reduce((sum, el) => sum + el.offsetHeight, 0) / elementCount;
            
            const properties = {
                display: 'flex'
            };
            
            // تحديد الاتجاه الأمثل
            properties.flexDirection = this.determineOptimalDirection(elements, options);
            
            // تحديد justify-content
            properties.justifyContent = this.calculateJustifyContent(elementCount, avgWidth);
            
            // تحديد align-items
            properties.alignItems = this.calculateAlignItems(elements);
            
            // تحديد flex-wrap
            properties.flexWrap = this.calculateFlexWrap(elementCount, options);
            
            // تحديد gap
            properties.gap = this.calculateOptimalGap(elements, elementCount);
            
            return properties;
        }
        
        determineOptimalDirection(elements, options) {
            const elementCount = elements.length;
            const avgWidth = elements.reduce((sum, el) => sum + el.offsetWidth, 0) / elementCount;
            const avgHeight = elements.reduce((sum, el) => sum + el.offsetHeight, 0) / elementCount;
            
            // إذا كان العرض أكبر من الارتفاع => row
            if (avgWidth > avgHeight * 1.5) {
                return 'row';
            }
            // إذا كان الارتفاع أكبر من العرض => column
            else if (avgHeight > avgWidth * 1.5) {
                return 'column';
            }
            // للعناصر المربعة أو القريبة من المربع
            else {
                return options.direction || this.defaultDirection;
            }
        }
        
        calculateJustifyContent(elementCount, avgWidth) {
            if (elementCount === 1) {
                return 'center';
            } else if (elementCount === 2) {
                return 'space-between';
            } else {
                return 'space-around';
            }
        }
        
        calculateAlignItems(elements) {
            const heights = elements.map(el => el.offsetHeight);
            const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
            const heightVariance = Math.max(...heights) - Math.min(...heights);
            
            // إذا كانت الارتفاعات متشابهة => stretch
            if (heightVariance < avgHeight * 0.1) {
                return 'stretch';
            }
            // إذا كانت الارتفاعات مختلفة => center
            else {
                return 'center';
            }
        }
        
        calculateFlexWrap(elementCount, options) {
            if (options.preventWrap) return 'nowrap';
            if (elementCount > 4) return 'wrap';
            return 'nowrap';
        }
        
        calculateOptimalGap(elements, elementCount) {
            const avgSize = (elements.reduce((sum, el) => sum + el.offsetWidth * el.offsetHeight, 0) / elementCount) ** 0.5;
            
            if (avgSize < 100) return '4px';
            if (avgSize < 300) return '8px';
            if (avgSize < 500) return '12px';
            return '16px';
        }
        
        applyFlexProperties(container, properties) {
            Object.assign(container.style, properties);
            
            // إضافة transition سلس
            container.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        
        addFlexContainerStyles(container, elementCount) {
            // إضافة border مؤقت لإظهار الحاوية الجديدة
            container.style.border = '2px solid rgba(13, 110, 253, 0.6)';
            container.style.borderRadius = '8px';
            container.style.padding = '8px';
            container.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
            
            // إضافة تأثير انيميشن
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0';
            
            requestAnimationFrame(() => {
                container.style.transform = 'scale(1)';
                container.style.opacity = '1';
            });
        }
        
        optimizeExistingContainer(container) {
            if (!container || container.style.display !== 'flex') return false;
            
            const elements = Array.from(container.children).filter(el => 
                el.id && el.id.startsWith('bloc-')
            );
            
            if (elements.length === 0) return false;
            
            const optimizedProps = this.calculateOptimalFlexProperties(elements);
            this.applyFlexProperties(container, optimizedProps);
            
            this.notifyListeners('containerOptimized', {
                container: container,
                elements: elements,
                properties: optimizedProps
            });
            
            return true;
        }
        
        createResponsiveRules(container, elements) {
            if (!this.enableResponsive) return;
            
            const style = document.createElement('style');
            const className = `responsive-flex-${Date.now()}`;
            container.classList.add(className);
            
            style.textContent = `
                @media (max-width: 768px) {
                    .${className} {
                        flex-direction: column;
                        gap: 8px;
                    }
                }
                
                @media (max-width: 480px) {
                    .${className} {
                        padding: 4px;
                        gap: 4px;
                    }
                }
            `;
            
            document.head.appendChild(style);
        }
        
        onContainerCreated(callback) {
            this.listeners.containerCreated.push(callback);
        }
        
        onContainerOptimized(callback) {
            this.listeners.containerOptimized.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[FlexContainerManager] Error in listener:', error);
                    }
                });
            }
        }
    }
    
    class LayoutHintSystem {
        constructor(config = {}) {
            this.hintTypes = {
                POSITION_HINT: 'position',
                CONTAINER_HINT: 'container',
                ALIGNMENT_HINT: 'alignment',
                SPACING_HINT: 'spacing',
                LAYOUT_HINT: 'layout'
            };
            
            this.hintPriority = {
                CRITICAL: 3,
                HIGH: 2,
                NORMAL: 1,
                LOW: 0
            };
            
            this.activeHints = new Map();
            this.config = config;
            this.listeners = {
                hintCreated: [],
                hintActivated: [],
                hintDismissed: []
            };
        }
        
        createSmartHint(element, type, data) {
            const hint = {
                id: this.generateHintId(),
                type: type,
                priority: this.calculatePriority(element, type, data),
                content: this.generateHintContent(element, type, data),
                position: this.calculateHintPosition(element, type),
                style: this.getHintStyle(type, data),
                actions: this.getHintActions(type, data),
                timestamp: Date.now()
            };
            
            this.activeHints.set(hint.id, hint);
            this.notifyListeners('hintCreated', hint);
            
            return hint;
        }
        
        generateHintId() {
            return `hint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
        
        calculatePriority(element, type, data) {
            let priority = this.hintPriority.NORMAL;
            
            // تحديد الأولوية بناءً على نوع التلميح
            switch (type) {
                case this.hintTypes.POSITION_HINT:
                    priority = this.hintPriority.HIGH;
                    break;
                case this.hintTypes.CONTAINER_HINT:
                    priority = this.hintPriority.NORMAL;
                    break;
                case this.hintTypes.ALIGNMENT_HINT:
                    priority = this.hintPriority.NORMAL;
                    break;
                case this.hintTypes.SPACING_HINT:
                    priority = this.hintPriority.LOW;
                    break;
                case this.hintTypes.LAYOUT_HINT:
                    priority = this.hintPriority.CRITICAL;
                    break;
            }
            
            return priority;
        }
        
        generateHintContent(element, type, data) {
            switch (type) {
                case this.hintTypes.POSITION_HINT:
                    return data.position === 'before' ? 
                        'يمكن وضع العنصر هنا' : 
                        data.position === 'after' ? 
                        'يمكن وضع العنصر بعد هذا' : 
                        'يمكن وضع العنصر داخل هذا';
                        
                case this.hintTypes.CONTAINER_HINT:
                    return `يُنصح بوضع العناصر في ${data.containerType} container`;
                    
                case this.hintTypes.ALIGNMENT_HINT:
                    return 'محاذاة مثلى مع العناصر المجاورة';
                    
                case this.hintTypes.SPACING_HINT:
                    return `مسافة مقترحة: ${data.gap || '8px'}`;
                    
                case this.hintTypes.LAYOUT_HINT:
                    return `تحسين تخطيط: ${data.suggestion || 'تحويل إلى flex'}`;
                    
                default:
                    return 'تلميح تخطيط ذكي';
            }
        }
        
        calculateHintPosition(element, type) {
            const rect = element.getBoundingClientRect();
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            
            return {
                x: rect.left + scrollX,
                y: rect.top + scrollY - 30, // فوق العنصر بـ 30px
                width: rect.width,
                height: 25
            };
        }
        
        getHintStyle(type, data) {
            const baseStyle = {
                position: 'fixed',
                backgroundColor: 'rgba(13, 110, 253, 0.9)',
                color: 'white',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '500',
                zIndex: '10001',
                pointerEvents: 'none',
                transform: 'translateY(-10px)',
                opacity: '0',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                maxWidth: '200px',
                wordWrap: 'break-word'
            };
            
            // تخصيص اللون بناءً على النوع
            switch (type) {
                case this.hintTypes.POSITION_HINT:
                    baseStyle.backgroundColor = 'rgba(40, 167, 69, 0.9)';
                    break;
                case this.hintTypes.CONTAINER_HINT:
                    baseStyle.backgroundColor = 'rgba(13, 110, 253, 0.9)';
                    break;
                case this.hintTypes.ALIGNMENT_HINT:
                    baseStyle.backgroundColor = 'rgba(255, 193, 7, 0.9)';
                    break;
                case this.hintTypes.SPACING_HINT:
                    baseStyle.backgroundColor = 'rgba(102, 16, 242, 0.9)';
                    break;
                case this.hintTypes.LAYOUT_HINT:
                    baseStyle.backgroundColor = 'rgba(220, 53, 69, 0.9)';
                    break;
            }
            
            return baseStyle;
        }
        
        getHintActions(type, data) {
            return {
                dismissible: true,
                autoHide: true,
                duration: type === this.hintTypes.LAYOUT_HINT ? 5000 : 3000,
                clickToApply: type === this.hintTypes.CONTAINER_HINT || type === this.hintTypes.LAYOUT_HINT
            };
        }
        
        displayHint(hint) {
            const indicator = document.createElement('div');
            indicator.id = hint.id;
            indicator.textContent = hint.content;
            
            // تطبيق الأنماط
            Object.assign(indicator.style, hint.style);
            
            // تحديد الموقع
            const pos = hint.position;
            indicator.style.left = `${pos.x + pos.width / 2 - 100}px`; // وسط التلميح
            indicator.style.top = `${pos.y - 5}px`;
            
            document.body.appendChild(indicator);
            
            // أنيميشن الدخول
            requestAnimationFrame(() => {
                indicator.style.transform = 'translateY(0)';
                indicator.style.opacity = '1';
            });
            
            // إخفاء تلقائي
            if (hint.actions.autoHide) {
                setTimeout(() => {
                    this.dismissHint(hint.id);
                }, hint.actions.duration);
            }
            
            this.notifyListeners('hintActivated', hint);
            
            return indicator;
        }
        
        dismissHint(hintId) {
            const hint = this.activeHints.get(hintId);
            if (!hint) return;
            
            const indicator = document.getElementById(hintId);
            if (indicator) {
                indicator.style.transform = 'translateY(-10px)';
                indicator.style.opacity = '0';
                
                setTimeout(() => {
                    if (indicator.parentNode) {
                        indicator.parentNode.removeChild(indicator);
                    }
                }, 300);
            }
            
            this.activeHints.delete(hintId);
            this.notifyListeners('hintDismissed', hint);
        }
        
        clearAllHints() {
            this.activeHints.forEach((hint, hintId) => {
                this.dismissHint(hintId);
            });
        }
        
        showDragHints(draggedElement, currentPosition) {
            const hints = [];
            
            // تلميح الموقع
            hints.push(this.createSmartHint(
                draggedElement,
                this.hintTypes.POSITION_HINT,
                { position: currentPosition.position }
            ));
            
            // تلميح المحاذاة
            hints.push(this.createSmartHint(
                draggedElement,
                this.hintTypes.ALIGNMENT_HINT,
                { alignment: currentPosition.alignment }
            ));
            
            return hints.map(hint => this.displayHint(hint));
        }
        
        suggestLayoutImprovements(element, context) {
            const improvements = [];
            const children = Array.from(element.children).filter(child => 
                child.id && child.id.startsWith('bloc-')
            );
            
            if (children.length >= 3) {
                improvements.push({
                    type: this.hintTypes.LAYOUT_HINT,
                    title: 'تحسين التخطيط',
                    description: 'تحويل إلى flex container لتحسين الترتيب',
                    impact: 'HIGH'
                });
            }
            
            if (children.length >= 6) {
                improvements.push({
                    type: this.hintTypes.LAYOUT_HINT,
                    title: 'تخطيط معقد',
                    description: 'استخدام grid layout للمحتوى المعقد',
                    impact: 'MEDIUM'
                });
            }
            
            return improvements.map(improvement => {
                return this.createSmartHint(element, improvement.type, improvement);
            });
        }
        
        onHintCreated(callback) {
            this.listeners.hintCreated.push(callback);
        }
        
        onHintActivated(callback) {
            this.listeners.hintActivated.push(callback);
        }
        
        onHintDismissed(callback) {
            this.listeners.hintDismissed.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[LayoutHintSystem] Error in listener:', error);
                    }
                });
            }
        }
        
        getActiveHintsCount() {
            return this.activeHints.size;
        }
    }
    
    // ==================== MANAGER CLASSES ====================
    
    class DragModeManager {
        constructor() {
            this.currentMode = null;
            this.availableModes = new Set(['EXTERNAL', 'INTERNAL', 'DUPLICATE', 'REORDER']);
            this.modeListeners = [];
        }
        
        setMode(mode) {
            if (this.availableModes.has(mode)) {
                console.log(`[BlocVibe] 🎯 Setting drag mode: ${mode}`);
                this.currentMode = mode;
                this.notifyListeners();
                return true;
            }
            console.warn(`[BlocVibe] ⚠️ Invalid drag mode: ${mode}`);
            return false;
        }
        
        getMode() {
            return this.currentMode;
        }
        
        isMode(mode) {
            return this.currentMode === mode;
        }
        
        addListener(callback) {
            this.modeListeners.push(callback);
        }
        
        notifyListeners() {
            this.modeListeners.forEach(callback => {
                try {
                    callback(this.currentMode);
                } catch (error) {
                    console.error('[BlocVibe] ❌ Error in mode listener:', error);
                }
            });
        }
    }
    
    class DropZoneManager {
        constructor() {
            this.dropZones = new Map();
            this.highlightedZone = null;
            this.zoneCache = new Map();
            this.lastCacheUpdate = 0;
            this.CACHE_DURATION = 200; // milliseconds
        }
        
        registerZone(elementId, zone) {
            if (!elementId || !zone) return;
            
            const zoneData = {
                element: zone.element || null,
                bounds: zone.bounds || null,
                capacity: zone.capacity || 'unlimited',
                constraints: zone.constraints || {},
                acceptTypes: zone.acceptTypes || ['all'],
                visualFeedback: zone.visualFeedback || true
            };
            
            this.dropZones.set(elementId, zoneData);
            console.log(`[BlocVibe] 📍 Registered drop zone: ${elementId}`);
        }
        
        unregisterZone(elementId) {
            if (this.dropZones.has(elementId)) {
                this.dropZones.delete(elementId);
                this.zoneCache.delete(elementId);
                console.log(`[BlocVibe] 🗑️ Unregistered drop zone: ${elementId}`);
            }
        }
        
        findDropZone(x, y, elementType = 'all') {
            const now = Date.now();
            if (now - this.lastCacheUpdate > this.CACHE_DURATION) {
                this.updateZoneCache();
            }
            
            for (let [zoneId, zone] of this.dropZones) {
                const cached = this.zoneCache.get(zoneId);
                if (cached && cached.containsPoint(x, y)) {
                    if (this.canAccept(zone, elementType)) {
                        return { id: zoneId, zone: zone };
                    }
                }
            }
            return null;
        }
        
        canAccept(zone, elementType) {
            if (zone.acceptTypes.includes('all')) return true;
            return zone.acceptTypes.includes(elementType);
        }
        
        updateZoneCache() {
            this.zoneCache.clear();
            
            for (let [zoneId, zone] of this.dropZones) {
                if (zone.element && zone.element.getBoundingClientRect) {
                    const rect = zone.element.getBoundingClientRect();
                    this.zoneCache.set(zoneId, {
                        bounds: rect,
                        containsPoint: (x, y) => {
                            return x >= rect.left && x <= rect.right && 
                                   y >= rect.top && y <= rect.bottom;
                        }
                    });
                }
            }
            
            this.lastCacheUpdate = Date.now();
        }
        
        highlightZone(zoneId) {
            if (this.highlightedZone === zoneId) return;
            
            // Remove previous highlight
            if (this.highlightedZone && this.dropZones.has(this.highlightedZone)) {
                this.removeZoneHighlight(this.highlightedZone);
            }
            
            // Add new highlight
            if (zoneId && this.dropZones.has(zoneId)) {
                this.highlightedZone = zoneId;
                this.applyZoneHighlight(zoneId);
                console.log(`[BlocVibe] ✨ Highlighted drop zone: ${zoneId}`);
            }
        }
        
        applyZoneHighlight(zoneId) {
            const zone = this.dropZones.get(zoneId);
            if (zone && zone.element && zone.visualFeedback) {
                zone.element.style.outline = '3px solid #0D6EFD';
                zone.element.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
                zone.element.style.transition = 'all 0.3s ease';
            }
        }
        
        removeZoneHighlight(zoneId) {
            const zone = this.dropZones.get(zoneId);
            if (zone && zone.element) {
                zone.element.style.outline = '';
                zone.element.style.backgroundColor = '';
            }
            if (this.highlightedZone === zoneId) {
                this.highlightedZone = null;
            }
        }
    }
    
    class PositionCalculator {
        constructor() {
            this.cache = new Map();
            this.cacheTimeout = 100; // milliseconds
            this.lastCalculation = 0;
        }
        
        calculateDropPosition(sourceElement, targetElement, dropX, dropY) {
            const key = `${sourceElement.id}-${targetElement.id}-${dropX}-${dropY}`;
            
            // Check cache first
            const cached = this.getCachedCalculation(key);
            if (cached) {
                return cached;
            }
            
            const sourceRect = sourceElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            
            // Calculate various drop positions
            const positions = {
                before: this.calculateBeforePosition(targetRect, dropY),
                after: this.calculateAfterPosition(targetRect, dropY),
                inside: this.calculateInsidePosition(targetRect, dropX, dropY),
                nearest: this.calculateNearestPosition(targetRect, dropX, dropY)
            };
            
            // Determine best position based on drop type
            const result = {
                position: this.selectBestPosition(positions, dropX, dropY),
                targetIndex: this.calculateTargetIndex(targetElement, positions.position),
                isValidDrop: this.isValidDropPosition(positions.position, sourceRect, targetRect)
            };
            
            // Cache the result
            this.setCachedCalculation(key, result);
            
            return result;
        }
        
        calculateBeforePosition(targetRect, dropY) {
            return {
                type: 'before',
                y: targetRect.top - 2,
                x: targetRect.left,
                width: targetRect.width,
                priority: Math.abs(dropY - targetRect.top) < 20 ? 1 : 2
            };
        }
        
        calculateAfterPosition(targetRect, dropY) {
            return {
                type: 'after',
                y: targetRect.bottom - 2,
                x: targetRect.left,
                width: targetRect.width,
                priority: Math.abs(dropY - targetRect.bottom) < 20 ? 1 : 2
            };
        }
        
        calculateInsidePosition(targetRect, dropX, dropY) {
            const centerX = targetRect.left + targetRect.width / 2;
            const centerY = targetRect.top + targetRect.height / 2;
            const distance = Math.sqrt(
                Math.pow(dropX - centerX, 2) + Math.pow(dropY - centerY, 2)
            );
            
            return {
                type: 'inside',
                x: dropX,
                y: dropY,
                priority: distance < 50 ? 0.5 : 1.5
            };
        }
        
        calculateNearestPosition(targetRect, dropX, dropY) {
            const distances = {
                top: Math.abs(dropY - targetRect.top),
                bottom: Math.abs(dropY - targetRect.bottom),
                left: Math.abs(dropX - targetRect.left),
                right: Math.abs(dropX - targetRect.right)
            };
            
            const minDistance = Math.min(...Object.values(distances));
            const nearestSide = Object.keys(distances).find(
                key => distances[key] === minDistance
            );
            
            return {
                type: 'nearest',
                side: nearestSide,
                priority: 1,
                distance: minDistance
            };
        }
        
        selectBestPosition(positions, dropX, dropY) {
            // Sort by priority and return best option
            const sorted = Object.entries(positions)
                .map(([type, pos]) => ({ type, ...pos }))
                .sort((a, b) => a.priority - b.priority);
            
            return sorted[0];
        }
        
        calculateTargetIndex(targetElement, position) {
            const children = Array.from(targetElement.children);
            
            if (position.type === 'before') {
                return 0;
            } else if (position.type === 'after') {
                return children.length;
            } else if (position.type === 'inside') {
                // Find best insertion point based on y-coordinate
                let insertIndex = 0;
                for (let i = 0; i < children.length; i++) {
                    const rect = children[i].getBoundingClientRect();
                    if (position.y > rect.top + rect.height / 2) {
                        insertIndex = i + 1;
                    }
                }
                return insertIndex;
            }
            
            return children.length;
        }
        
        isValidDropPosition(position, sourceRect, targetRect) {
            // Prevent dropping element into itself or its descendants
            if (sourceRect === targetRect) return false;
            if (this.isDescendant(targetRect, sourceRect)) return false;
            
            // Additional validations based on position type
            if (position.type === 'inside') {
                const centerX = targetRect.left + targetRect.width / 2;
                const centerY = targetRect.top + targetRect.height / 2;
                const distance = Math.sqrt(
                    Math.pow(centerX - position.x, 2) + 
                    Math.pow(centerY - position.y, 2)
                );
                return distance < Math.min(targetRect.width, targetRect.height) / 2;
            }
            
            return true;
        }
        
        isDescendant(childRect, parentRect) {
            return parentRect.left >= childRect.left && 
                   parentRect.right <= childRect.right &&
                   parentRect.top >= childRect.top && 
                   parentRect.bottom <= childRect.bottom;
        }
        
        getCachedCalculation(key) {
            const cached = this.cache.get(key);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.result;
            }
            return null;
        }
        
        setCachedCalculation(key, result) {
            this.cache.set(key, {
                result: result,
                timestamp: Date.now()
            });
            
            // Clean old cache entries
            if (this.cache.size > 100) {
                this.cleanCache();
            }
        }
        
        cleanCache() {
            const now = Date.now();
            for (let [key, cached] of this.cache) {
                if (now - cached.timestamp > this.cacheTimeout) {
                    this.cache.delete(key);
                }
            }
        }
    }
    
    class VisualFeedbackSystem {
        constructor() {
            this.activeEffects = new Map();
            this.effectQueue = [];
            this.isProcessingQueue = false;
            this.maxConcurrentEffects = 3;
        }
        
        createDragGhost(element, options = {}) {
            const ghostId = `ghost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const ghost = document.createElement('div');
            ghost.id = ghostId;
            ghost.className = 'drag-ghost-ultra';
            
            const defaultStyles = {
                position: 'fixed',
                pointerEvents: 'none',
                zIndex: '10000',
                opacity: '0',
                transform: 'scale(0.9) rotate(0deg)',
                willChange: 'transform, opacity, left, top',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35), 0 4px 12px rgba(0,0,0,0.25)',
                border: '2px solid #0D6EFD',
                borderRadius: '8px',
                background: 'white',
                padding: '8px',
                maxWidth: '300px',
                maxHeight: '200px',
                overflow: 'hidden'
            };
            
            // Apply styles
            Object.assign(ghost.style, defaultStyles, options.styles || {});
            
            // Clone element content
            const clone = element.cloneNode(true);
            clone.style.margin = '0';
            clone.style.pointerEvents = 'none';
            ghost.appendChild(clone);
            
            document.body.appendChild(ghost);
            
            // Animate in
            requestAnimationFrame(() => {
                ghost.style.opacity = options.opacity || '0.9';
                ghost.style.transform = options.transform || 'scale(1) rotate(3deg)';
            });
            
            this.activeEffects.set(ghostId, { element: ghost, type: 'drag-ghost' });
            return ghostId;
        }
        
        updateGhostPosition(ghostId, x, y) {
            const effect = this.activeEffects.get(ghostId);
            if (!effect) return;
            
            const ghost = effect.element;
            ghost.style.left = `${x}px`;
            ghost.style.top = `${y}px`;
            
            // Add subtle animation based on movement speed
            const deltaX = ghost.lastX ? Math.abs(x - ghost.lastX) : 0;
            const deltaY = ghost.lastY ? Math.abs(y - ghost.lastY) : 0;
            const movement = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (movement > 10) {
                ghost.style.transform = `scale(1.02) rotate(${(x + y) % 360}deg)`;
            }
            
            ghost.lastX = x;
            ghost.lastY = y;
        }
        
        removeGhost(ghostId) {
            const effect = this.activeEffects.get(ghostId);
            if (!effect) return;
            
            const ghost = effect.element;
            ghost.style.opacity = '0';
            ghost.style.transform = 'scale(0.9) rotate(0deg)';
            
            setTimeout(() => {
                if (ghost.parentNode) {
                    ghost.parentNode.removeChild(ghost);
                }
                this.activeEffects.delete(ghostId);
            }, 300);
        }
        
        createDropIndicator(targetElement, position, options = {}) {
            const indicatorId = `indicator-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const indicator = document.createElement('div');
            indicator.id = indicatorId;
            indicator.className = 'drop-indicator-ultra';
            
            const rect = targetElement.getBoundingClientRect();
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            
            const defaultStyles = {
                position: 'absolute',
                height: '4px',
                background: 'linear-gradient(90deg, #0D6EFD, #0984e3, #0D6EFD)',
                backgroundSize: '200% 100%',
                pointerEvents: 'none',
                display: 'none',
                zIndex: '9999',
                boxShadow: '0 0 10px rgba(13, 110, 253, 0.8), 0 0 20px rgba(13, 110, 253, 0.4)',
                borderRadius: '2px',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                willChange: 'transform, opacity',
                animation: 'pulse 2s infinite'
            };
            
            Object.assign(indicator.style, defaultStyles, options.styles || {});
            
            // Position based on drop type
            let top, left, width, height;
            
            switch (position.type) {
                case 'before':
                    top = rect.top + scrollY - 2;
                    left = rect.left + scrollX;
                    width = rect.width;
                    height = '4px';
                    break;
                case 'after':
                    top = rect.bottom + scrollY - 2;
                    left = rect.left + scrollX;
                    width = rect.width;
                    height = '4px';
                    break;
                case 'inside':
                    top = rect.top + scrollY + (rect.height / 2) - 2;
                    left = rect.left + scrollX + (rect.width / 2) - 2;
                    width = '4px';
                    height = '4px';
                    break;
                default:
                    top = rect.bottom + scrollY - 2;
                    left = rect.left + scrollX;
                    width = rect.width;
                    height = '4px';
            }
            
            indicator.style.top = `${top}px`;
            indicator.style.left = `${left}px`;
            indicator.style.width = `${width}px`;
            indicator.style.height = `${height}px`;
            
            document.body.appendChild(indicator);
            
            // Animate in
            requestAnimationFrame(() => {
                indicator.style.display = 'block';
                indicator.style.opacity = '1';
                indicator.style.transform = 'scale(1)';
            });
            
            this.activeEffects.set(indicatorId, { element: indicator, type: 'drop-indicator' });
            return indicatorId;
        }
        
        removeDropIndicator(indicatorId) {
            const effect = this.activeEffects.get(indicatorId);
            if (!effect) return;
            
            const indicator = effect.element;
            indicator.style.opacity = '0';
            indicator.style.transform = 'scale(0.9)';
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
                this.activeEffects.delete(indicatorId);
            }, 200);
        }
        
        createValidationFeedback(element, type, message) {
            const feedbackId = `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const feedback = document.createElement('div');
            feedback.id = feedbackId;
            feedback.className = `validation-feedback ${type}`;
            
            const styles = {
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '12px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                zIndex: '10001',
                pointerEvents: 'none',
                transform: 'translateX(100%)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                maxWidth: '300px',
                wordWrap: 'break-word'
            };
            
            // Style based on type
            switch (type) {
                case 'success':
                    styles.backgroundColor = 'rgba(40, 167, 69, 0.95)';
                    styles.color = 'white';
                    break;
                case 'warning':
                    styles.backgroundColor = 'rgba(255, 193, 7, 0.95)';
                    styles.color = 'black';
                    break;
                case 'error':
                    styles.backgroundColor = 'rgba(220, 53, 69, 0.95)';
                    styles.color = 'white';
                    break;
                default:
                    styles.backgroundColor = 'rgba(13, 110, 253, 0.95)';
                    styles.color = 'white';
            }
            
            Object.assign(feedback.style, styles);
            feedback.textContent = message;
            
            document.body.appendChild(feedback);
            
            // Animate in
            requestAnimationFrame(() => {
                feedback.style.transform = 'translateX(0)';
            });
            
            // Auto-remove
            setTimeout(() => {
                this.removeValidationFeedback(feedbackId);
            }, 3000);
            
            this.activeEffects.set(feedbackId, { element: feedback, type: 'validation-feedback' });
            return feedbackId;
        }
        
        removeValidationFeedback(feedbackId) {
            const effect = this.activeEffects.get(feedbackId);
            if (!effect) return;
            
            const feedback = effect.element;
            feedback.style.transform = 'translateX(100%)';
            
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
                this.activeEffects.delete(feedbackId);
            }, 300);
        }
        
        createHighlightEffect(element, type = 'selection') {
            const highlightId = `highlight-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            const overlay = document.createElement('div');
            overlay.id = highlightId;
            overlay.className = `highlight-effect ${type}`;
            
            const rect = element.getBoundingClientRect();
            const scrollX = window.scrollX || document.documentElement.scrollLeft;
            const scrollY = window.scrollY || document.documentElement.scrollTop;
            
            const styles = {
                position: 'absolute',
                top: `${rect.top + scrollY}px`,
                left: `${rect.left + scrollX}px`,
                width: `${rect.width}px`,
                height: `${rect.height}px`,
                pointerEvents: 'none',
                zIndex: '9998',
                transition: 'all 0.3s ease',
                borderRadius: '4px'
            };
            
            switch (type) {
                case 'selection':
                    styles.border = '3px solid #0D6EFD';
                    styles.backgroundColor = 'rgba(13, 110, 253, 0.1)';
                    styles.boxShadow = '0 0 10px rgba(13, 110, 253, 0.3)';
                    break;
                case 'warning':
                    styles.border = '3px solid #ffc107';
                    styles.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                    styles.boxShadow = '0 0 10px rgba(255, 193, 7, 0.3)';
                    break;
                case 'error':
                    styles.border = '3px solid #dc3545';
                    styles.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                    styles.boxShadow = '0 0 10px rgba(220, 53, 69, 0.3)';
                    break;
            }
            
            Object.assign(overlay.style, styles);
            
            // Position relative to element's parent
            if (element.parentNode && element.parentNode !== document.body) {
                element.parentNode.style.position = 'relative';
                element.parentNode.appendChild(overlay);
            } else {
                document.body.appendChild(overlay);
            }
            
            this.activeEffects.set(highlightId, { 
                element: overlay, 
                type: 'highlight-effect',
                target: element 
            });
            
            return highlightId;
        }
        
        removeHighlightEffect(highlightId) {
            const effect = this.activeEffects.get(highlightId);
            if (!effect) return;
            
            const overlay = effect.element;
            overlay.style.opacity = '0';
            
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.activeEffects.delete(highlightId);
            }, 300);
        }
        
        clearAllEffects() {
            this.activeEffects.forEach((effect, id) => {
                try {
                    switch (effect.type) {
                        case 'drag-ghost':
                            this.removeGhost(id);
                            break;
                        case 'drop-indicator':
                            this.removeDropIndicator(id);
                            break;
                        case 'validation-feedback':
                            this.removeValidationFeedback(id);
                            break;
                        case 'highlight-effect':
                            this.removeHighlightEffect(id);
                            break;
                    }
                } catch (error) {
                    console.error('[BlocVibe] ❌ Error removing effect:', error);
                }
            });
        }
    }
    
    // ==================== ENHANCED STATE MANAGEMENT ====================
    
    const DragState = {
        IDLE: 'idle',
        READY: 'ready',
        DRAGGING: 'dragging',
        DROPPING: 'dropping',
        INTERNAL_DRAG: 'internal_drag', // إضافة النمط الجديد
        RECOVERING: 'recovering',
        VALIDATING: 'validating'
    };
    
    const DragTypes = {
        EXTERNAL: 'external',
        INTERNAL: 'internal',
        DUPLICATE: 'duplicate',
        REORDER: 'reorder'
    };
    
    // ==================== ENHANCED VARIABLES ====================
    
    let currentState = DragState.IDLE;
    let dragType = null;
    let selectedElements = [];
    let draggedElement = null;
    let dragSource = null;
    let dragGhostId = null;
    let dropIndicatorId = null;
    let multiSelectMode = false;
    let operationQueue = [];
    let isProcessingQueue = false;
    let lastRenderTime = 0;
    
    // Enhanced pointer tracking
    let currentPointerX = 0;
    let currentPointerY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let pointerVelocity = 0;
    
    // Animation loop
    let animationFrameId = null;
    let isAnimating = false;
    
    // Enhanced recovery system
    let recoveryTimer = null;
    let stateCheckTimer = null;
    const RECOVERY_TIMEOUT = 3000; // 3 ثوانٍ
    const STATE_CHECK_INTERVAL = 1000; // 1 ثانية
    
    // Performance monitoring
    let dragStartTime = 0;
    let frameCount = 0;
    let lastFrameTime = 0;
    let performanceMetrics = {
        averageFPS: 0,
        droppedFrames: 0,
        totalDrags: 0,
        successfulDrops: 0
    };
    
    // Cache and optimizations
    let elementCache = new Map();
    let layoutCache = new Map();
    const CACHE_DURATION = 500; // milliseconds
    let lastCacheUpdate = 0;
    
    // Error handling
    let errorLog = [];
    let maxErrorLogSize = 50;
    
    // Enhanced constants
    const RENDER_DEBOUNCE_MS = 300;
    const MIN_DRAG_DISTANCE = 5;
    const GHOST_OFFSET = 15;
    const MAX_CONCURRENT_DRAGS = 3;
    const PERFORMANCE_THRESHOLD = 30; // FPS threshold
    
    // ==================== MANAGER INSTANCES ====================
    
    const dragModeManager = new DragModeManager();
    const dropZoneManager = new DropZoneManager();
    const positionCalculator = new PositionCalculator();
    const visualFeedbackSystem = new VisualFeedbackSystem();
    
    // ==================== SMART POSITIONING INSTANCES ====================
    
    const layoutDetectionEngine = new LayoutDetectionEngine({
        enableCaching: true,
        cacheTimeout: 500,
        batchSize: 15
    });
    
    const smartNestingManager = new SmartNestingManager({
        autoNesting: true,
        patterns: ['flex', 'grid', 'block'],
        confidence: 0.7,
        maxDepth: 3
    });
    
    const flexContainerManager = new FlexContainerManager({
        autoCreation: true,
        optimizationLevel: 'high',
        defaultDirection: 'row',
        responsive: true
    });
    
    const layoutHintSystem = new LayoutHintSystem({
        enableHints: true,
        autoShow: true,
        hintDuration: 3000
    });
    
    // ==================== SMART POSITIONING CACHE ====================
    
    const smartPositioningCache = new Map();
    const CACHE_DURATION = 1000; // 1 ثانية
    let lastCacheUpdate = Date.now();
    
    // ==================== ENHANCED INITIALIZATION ====================
    
    function init() {
        console.log('[BlocVibe] 🚀 Initializing Ultra-Advanced Canvas System v3.0 with Smart Positioning...');
        
        setupEnhancedVisualComponents();
        setupEventListeners();
        makeElementsInteractive();
        setupDropZones();
        startQueueProcessor();
        startStateMonitor();
        startPerformanceMonitor();
        initializeKeyboardShortcuts();
        
        // Initialize Smart Positioning System
        initializeSmartPositioningSystem();
        
        console.log('[BlocVibe] ✅ Canvas interaction fully initialized with Smart Positioning System');
    }
    
    function initializeSmartPositioningSystem() {
        try {
            console.log('[Smart Positioning] 🔧 Initializing Smart Positioning System...');
            
            // Setup event listeners for Smart Positioning
            setupSmartPositioningEventListeners();
            
            // Analyze existing layout on page load
            setTimeout(() => {
                analyzeExistingLayouts();
            }, 1000);
            
            // Start monitoring for layout changes
            startLayoutChangeMonitoring();
            
            console.log('[Smart Positioning] ✅ Smart Positioning System initialized successfully');
        } catch (error) {
            console.error('[Smart Positioning] ❌ Failed to initialize Smart Positioning System:', error);
        }
    }
    
    function setupSmartPositioningEventListeners() {
        // Layout Detection Events
        layoutDetectionEngine.onLayoutDetected((layoutInfo) => {
            console.log('[Smart Positioning] 📊 Layout detected:', {
                element: layoutInfo.element.id,
                type: layoutInfo.layout.type,
                complexity: layoutInfo.complexity
            });
        });
        
        layoutDetectionEngine.onOptimizationSuggested((optimizations) => {
            console.log('[Smart Positioning] 💡 Layout optimizations suggested:', optimizations.length);
        });
        
        // Smart Nesting Events
        smartNestingManager.onNestingApplied((data) => {
            console.log('[Smart Positioning] 🏗️ Smart nesting applied:', {
                containerId: data.container.id,
                elements: data.elements.map(el => el.id),
                confidence: data.opportunity.confidence
            });
            
            // Clear hints after nesting
            layoutHintSystem.clearAllHints();
        });
        
        // Flex Container Events
        flexContainerManager.onContainerCreated((data) => {
            console.log('[Smart Positioning] 📦 Flex container created:', {
                containerId: data.container.id,
                elementsCount: data.elements.length,
                properties: data.properties
            });
            
            // Clear hints after container creation
            layoutHintSystem.clearAllHints();
        });
        
        flexContainerManager.onContainerOptimized((data) => {
            console.log('[Smart Positioning] ⚡ Flex container optimized:', {
                containerId: data.container.id,
                elementsCount: data.elements.length
            });
        });
        
        // Layout Hint Events
        layoutHintSystem.onHintActivated((hint) => {
            console.log('[Smart Positioning] 💬 Layout hint activated:', {
                type: hint.type,
                content: hint.content
            });
        });
        
        layoutHintSystem.onHintDismissed((hint) => {
            console.log('[Smart Positioning] 👋 Layout hint dismissed:', hint.id);
        });
    }
    
    function analyzeExistingLayouts() {
        try {
            console.log('[Smart Positioning] 🔍 Analyzing existing layouts...');
            
            const containers = document.querySelectorAll('[id^="bloc-"]');
            let analysisCount = 0;
            let optimizationSuggestions = 0;
            
            containers.forEach(container => {
                try {
                    const analysis = layoutDetectionEngine.analyzeCurrentLayout(container, {
                        includeChildren: true,
                        suggestOptimizations: true
                    });
                    
                    if (analysis) {
                        analysisCount++;
                        optimizationSuggestions += analysis.optimizations.length;
                        
                        // Apply immediate optimizations for obvious cases
                        if (analysis.optimizations.length > 0) {
                            const highPriorityOptimizations = analysis.optimizations.filter(opt => 
                                opt.priority === 'HIGH' && opt.impact === 'HIGH'
                            );
                            
                            if (highPriorityOptimizations.length > 0) {
                                console.log(`[Smart Positioning] 🎯 Applying high-priority optimization to ${container.id}`);
                                // Note: We don't auto-apply here to avoid disrupting user layout
                            }
                        }
                    }
                } catch (error) {
                    console.warn(`[Smart Positioning] ⚠️ Failed to analyze container ${container.id}:`, error);
                }
            });
            
            console.log(`[Smart Positioning] 📊 Analysis complete: ${analysisCount} containers analyzed, ${optimizationSuggestions} optimizations suggested`);
            
        } catch (error) {
            console.error('[Smart Positioning] ❌ Layout analysis failed:', error);
        }
    }
    
    function startLayoutChangeMonitoring() {
        try {
            const observer = new MutationObserver((mutations) => {
                let shouldReanalyze = false;
                
                mutations.forEach((mutation) => {
                    // Check for relevant changes
                    if (mutation.type === 'childList') {
                        // Check if any added/removed elements are bloc elements
                        const addedElements = Array.from(mutation.addedNodes).filter(node => 
                            node.nodeType === 1 && node.id && node.id.startsWith('bloc-')
                        );
                        const removedElements = Array.from(mutation.removedNodes).filter(node => 
                            node.nodeType === 1 && node.id && node.id.startsWith('bloc-')
                        );
                        
                        if (addedElements.length > 0 || removedElements.length > 0) {
                            shouldReanalyze = true;
                        }
                    }
                });
                
                if (shouldReanalyze) {
                    // Debounce the analysis
                    clearTimeout(startLayoutChangeMonitoring.reanalyzeTimeout);
                    startLayoutChangeMonitoring.reanalyzeTimeout = setTimeout(() => {
                        console.log('[Smart Positioning] 🔄 Reanalyzing layouts after changes...');
                        analyzeExistingLayouts();
                    }, 1000);
                }
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['style', 'class']
            });
            
            console.log('[Smart Positioning] 👀 Layout change monitoring started');
            
        } catch (error) {
            console.error('[Smart Positioning] ❌ Failed to start layout monitoring:', error);
        }
    }
    
    // ==================== ENHANCED VISUAL COMPONENTS ====================
    
    function setupEnhancedVisualComponents() {
        setupDropIndicator();
        setupDragGhost();
        setupCSSAnimations();
    }
    
    function setupCSSAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
            }
            
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }
            
            @keyframes bounce {
                0%, 20%, 60%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                80% { transform: translateY(-5px); }
            }
            
            .drag-ghost-ultra {
                backdrop-filter: blur(4px);
                background: rgba(255, 255, 255, 0.95);
            }
            
            .drop-indicator-ultra {
                background: linear-gradient(90deg, #0D6EFD, #0984e3, #0D6EFD);
                background-size: 200% 100%;
                animation: pulse 2s infinite;
            }
            
            .validation-feedback.success {
                animation: bounce 0.5s ease;
            }
            
            .validation-feedback.error {
                animation: shake 0.5s ease;
            }
            
            .highlight-effect {
                backdrop-filter: blur(2px);
            }
            
            .bloc-dragging {
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.1));
            }
            
            .bloc-selected {
                box-shadow: 0 0 0 2px #0D6EFD inset;
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(style);
    }
    
    function setupDropIndicator() {
        dropIndicator = document.createElement('div');
        dropIndicator.id = 'drop-indicator';
        dropIndicator.style.cssText = `
            position: absolute;
            height: 4px;
            background: linear-gradient(90deg, #0D6EFD, #0984e3);
            pointer-events: none;
            display: none;
            z-index: 9999;
            box-shadow: 0 0 10px rgba(13, 110, 253, 0.8),
                        0 0 20px rgba(13, 110, 253, 0.4);
            border-radius: 2px;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform, opacity;
            background-size: 200% 100%;
            animation: pulse 2s infinite;
        `;
        document.body.appendChild(dropIndicator);
    }
    
    function setupDragGhost() {
        dragGhost = document.createElement('div');
        dragGhost.id = 'drag-ghost';
        dragGhost.style.cssText = `
            position: fixed;
            pointer-events: none;
            display: none;
            z-index: 10000;
            opacity: 0;
            transform: rotate(0deg) scale(0.95);
            will-change: transform, left, top, opacity;
            box-shadow: 0 12px 40px rgba(0,0,0,0.35),
                        0 4px 12px rgba(0,0,0,0.25);
            border: 2px solid #0D6EFD;
            border-radius: 8px;
            background: white;
            padding: 8px;
            max-width: 300px;
            transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(4px);
        `;
        document.body.appendChild(dragGhost);
    }
    
    // ==================== ENHANCED EVENT LISTENERS ====================
    
    function setupEventListeners() {
        // Prevent default behaviors
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('selectstart', function(e) {
            if (currentState === DragState.DRAGGING) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Enhanced keyboard events
        document.addEventListener('keydown', handleEnhancedKeyDown);
        document.addEventListener('keyup', handleEnhancedKeyUp);
        
        // Selection
        document.addEventListener('click', handleEnhancedElementClick);
        
        // Context menu
        document.addEventListener('contextmenu', function(e) {
            if (currentState === DragState.DRAGGING) {
                e.preventDefault();
            }
        });
        
        // Window events for cleanup
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('blur', handleWindowBlur);
    }
    
    // ==================== INTERNAL DRAG OPERATIONS ====================
    
    /**
     * تفعيل عمليات السحب الداخلي (INTERNAL Drag)
     */
    function enableInternalDrag(element) {
        let startPosition = null;
        let currentPosition = null;
        let internalDragData = null;
        
        element.addEventListener('pointerdown', function(e) {
            // التحقق من إمكانية السحب الداخلي
            if (!canStartInternalDrag(element)) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[BlocVibe] 🔄 Starting internal drag:', element.id);
            
            // حفظ البيانات الأولية
            startPosition = {
                x: e.clientX,
                y: e.clientY,
                rect: element.getBoundingClientRect(),
                timestamp: Date.now()
            };
            
            internalDragData = {
                element: element,
                startPosition: startPosition,
                movements: [],
                minMovement: 0
            };
            
            element.setPointerCapture(e.pointerId);
            currentState = DragState.INTERNAL_DRAG;
            
        }, { passive: false });
        
        element.addEventListener('pointermove', function(e) {
            if (currentState !== DragState.INTERNAL_DRAG || !startPosition) return;
            
            e.preventDefault();
            
            const currentX = e.clientX;
            const currentY = e.clientY;
            
            // حساب المسافة المقطوعة
            const deltaX = currentX - startPosition.x;
            const deltaY = currentY - startPosition.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // تحديث البيانات
            currentPosition = { x: currentX, y: currentY };
            
            if (distance > MIN_DRAG_DISTANCE) {
                internalDragData.movements.push({
                    x: currentX,
                    y: currentY,
                    deltaX: deltaX,
                    deltaY: deltaY,
                    timestamp: Date.now()
                });
                
                // تحديث موضع العنصر إذا تجاوز الحد الأدنى
                if (distance > internalDragData.minMovement + 3) {
                    performInternalDrag(element, deltaX, deltaY);
                    internalDragData.minMovement = distance;
                }
            }
            
        }, { passive: false });
        
        element.addEventListener('pointerup', function(e) {
            if (currentState !== DragState.INTERNAL_DRAG) return;
            
            e.preventDefault();
            
            console.log('[BlocVibe] ✅ Internal drag completed');
            
            // تحليل الحركة وتحديد نوع العملية
            const dragResult = analyzeInternalDrag(internalDragData);
            executeInternalDragOperation(element, dragResult);
            
            // إعادة تعيين الحالة
            currentState = DragState.IDLE;
            startPosition = null;
            currentPosition = null;
            internalDragData = null;
            
        }, { passive: false });
        
        element.addEventListener('pointercancel', function(e) {
            console.log('[BlocVibe] ⚠️ Internal drag cancelled');
            currentState = DragState.IDLE;
            startPosition = null;
            currentPosition = null;
            internalDragData = null;
        });
    }
    
    function canStartInternalDrag(element) {
        // التحقق من وجود عناصر فرعية قابلة للتحريك
        const childElements = element.querySelectorAll('[id^="bloc-"]');
        return childElements.length > 0;
    }
    
    function performInternalDrag(element, deltaX, deltaY) {
        const children = element.querySelectorAll('[id^="bloc-"]');
        
        children.forEach((child, index) => {
            // حفظ الموضع الأصلي
            if (!child.originalTransform) {
                child.originalTransform = child.style.transform || 'translate(0px, 0px)';
            }
            
            // حساب الموضع الجديد
            const movementIntensity = 0.3; // عامل التخفيف
            const newX = deltaX * movementIntensity * (index + 1) / children.length;
            const newY = deltaY * movementIntensity * (index + 1) / children.length;
            
            // تطبيق التأثير البصري
            child.style.transform = `translate(${newX}px, ${newY}px)`;
            child.style.transition = 'transform 0.1s ease-out';
            child.classList.add('bloc-internal-dragging');
        });
        
        // إضافة مؤشر بصري للعنصر الأصلي
        element.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
        element.style.border = '2px dashed #0D6EFD';
    }
    
    function analyzeInternalDrag(dragData) {
        if (!dragData || dragData.movements.length === 0) {
            return { type: 'none', confidence: 0 };
        }
        
        const movements = dragData.movements;
        const lastMovement = movements[movements.length - 1];
        
        // تحليل الاتجاه
        const horizontalMovement = movements.reduce((sum, m) => sum + m.deltaX, 0) / movements.length;
        const verticalMovement = movements.reduce((sum, m) => sum + m.deltaY, 0) / movements.length;
        
        const absHorizontal = Math.abs(horizontalMovement);
        const absVertical = Math.abs(verticalMovement);
        
        // تحديد نوع العملية
        if (absHorizontal > absVertical * 1.5) {
            return {
                type: 'horizontal_reorder',
                direction: horizontalMovement > 0 ? 'right' : 'left',
                confidence: absHorizontal / Math.max(absHorizontal, absVertical),
                strength: absHorizontal
            };
        } else if (absVertical > absHorizontal * 1.5) {
            return {
                type: 'vertical_stack',
                direction: verticalMovement > 0 ? 'down' : 'up',
                confidence: absVertical / Math.max(absHorizontal, absVertical),
                strength: absVertical
            };
        } else {
            return {
                type: 'mixed_rearrangement',
                confidence: Math.min(absHorizontal, absVertical) / Math.max(absHorizontal, absVertical),
                strength: Math.sqrt(absHorizontal * absHorizontal + absVertical * absVertical)
            };
        }
    }
    
    function executeInternalDragOperation(element, dragResult) {
        console.log('[BlocVibe] 🎯 Executing internal drag operation:', dragResult.type);
        
        // استعادة الموضع الأصلي للعناصر الفرعية
        const children = element.querySelectorAll('[id^="bloc-"]');
        children.forEach(child => {
            if (child.originalTransform) {
                child.style.transform = child.originalTransform;
                child.classList.remove('bloc-internal-dragging');
                
                setTimeout(() => {
                    child.style.transition = '';
                    child.originalTransform = null;
                }, 200);
            }
        });
        
        // استعادة مظهر العنصر الأصلي
        element.style.backgroundColor = '';
        element.style.border = '';
        
        // تنفيذ العملية حسب النوع
        switch (dragResult.type) {
            case 'horizontal_reorder':
                executeHorizontalReorder(element, dragResult);
                break;
            case 'vertical_stack':
                executeVerticalStack(element, dragResult);
                break;
            case 'mixed_rearrangement':
                executeMixedRearrangement(element, dragResult);
                break;
            default:
                console.log('[BlocVibe] ℹ️ No internal drag operation needed');
        }
    }
    
    function executeHorizontalReorder(element, dragResult) {
        const children = Array.from(element.querySelectorAll('[id^="bloc-"]'));
        if (children.length < 2) return;
        
        console.log(`[BlocVibe] ↔️ Executing horizontal reorder: ${dragResult.direction}`);
        
        if (dragResult.direction === 'right') {
            // تحريك العناصر إلى اليمين
            children.forEach((child, index) => {
                if (index < children.length - 1) {
                    const nextChild = children[index + 1];
                    element.insertBefore(nextChild, child);
                }
            });
        } else {
            // تحريك العناصر إلى اليسار
            children.forEach((child, index) => {
                if (index > 0) {
                    const prevChild = children[index - 1];
                    element.insertBefore(child, prevChild);
                }
            });
        }
        
        // إشعار Java layer
        notifyJavaInternalOperation('reorder', {
            elementId: element.id,
            direction: dragResult.direction,
            type: 'horizontal'
        });
        
        visualFeedbackSystem.createValidationFeedback(
            element, 'success', `تم إعادة ترتيب العناصر أفقياً ${dragResult.direction === 'right' ? 'يميناً' : 'يساراً'}`
        );
    }
    
    function executeVerticalStack(element, dragResult) {
        const children = Array.from(element.querySelectorAll('[id^="bloc-"]'));
        if (children.length < 2) return;
        
        console.log(`[BlocVibe] ↕️ Executing vertical stack: ${dragResult.direction}`);
        
        if (dragResult.direction === 'down') {
            // ترتيب العناصر من الأعلى للأسفل
            children.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                return rectA.top - rectB.top;
            });
        } else {
            // ترتيب العناصر من الأسفل للأعلى
            children.sort((a, b) => {
                const rectA = a.getBoundingClientRect();
                const rectB = b.getBoundingClientRect();
                return rectB.top - rectA.top;
            });
        }
        
        // إعادة ترتيب العناصر في DOM
        children.forEach(child => {
            element.appendChild(child);
        });
        
        // إشعار Java layer
        notifyJavaInternalOperation('stack', {
            elementId: element.id,
            direction: dragResult.direction,
            type: 'vertical'
        });
        
        visualFeedbackSystem.createValidationFeedback(
            element, 'success', `تم ترتيب العناصر عمودياً ${dragResult.direction === 'down' ? 'للأسفل' : 'للأعلى'}`
        );
    }
    
    function executeMixedRearrangement(element, dragResult) {
        console.log('[BlocVibe] 🔀 Executing mixed rearrangement');
        
        const children = Array.from(element.querySelectorAll('[id^="bloc-"]'));
        if (children.length < 2) return;
        
        // تحديد معيار الترتيب بناءً على الموضع المفضل
        const centerX = element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2;
        const centerY = element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2;
        
        children.sort((a, b) => {
            const rectA = a.getBoundingClientRect();
            const rectB = b.getBoundingClientRect();
            
            const distA = Math.sqrt(
                Math.pow(rectA.left + rectA.width / 2 - centerX, 2) +
                Math.pow(rectA.top + rectA.height / 2 - centerY, 2)
            );
            
            const distB = Math.sqrt(
                Math.pow(rectB.left + rectB.width / 2 - centerX, 2) +
                Math.pow(rectB.top + rectB.height / 2 - centerY, 2)
            );
            
            return distA - distB;
        });
        
        // إعادة ترتيب العناصر
        children.forEach(child => {
            element.appendChild(child);
        });
        
        // إشعار Java layer
        notifyJavaInternalOperation('rearrange', {
            elementId: element.id,
            type: 'mixed',
            centerX: centerX,
            centerY: centerY
        });
        
        visualFeedbackSystem.createValidationFeedback(
            element, 'success', 'تم إعادة ترتيب العناصر بشكل مختلط'
        );
    }
    
    // ==================== ENHANCED ELEMENT INTERACTION ====================
    
    function makeElementsInteractive() {
        const elements = document.querySelectorAll('body [id^="bloc-"]');
        console.log(`[BlocVibe] 🎯 Making ${elements.length} elements interactive with enhanced system`);
        
        elements.forEach(el => {
            enableEnhancedPointerDragging(el);
            enableSelection(el);
            enableInternalDrag(el); // تفعيل السحب الداخلي
            setupElementCache(el);
        });
    }
    
    function setupElementCache(element) {
        const cacheKey = element.id;
        const cacheData = {
            rect: element.getBoundingClientRect(),
            children: Array.from(element.children).map(child => child.id),
            parent: element.parentNode.id,
            timestamp: Date.now()
        };
        elementCache.set(cacheKey, cacheData);
    }
    
    // ==================== ENHANCED POINTER DRAGGING ====================
    
    function enableEnhancedPointerDragging(element) {
        // Prevent default for images
        const imgs = element.querySelectorAll('img');
        imgs.forEach(img => {
            img.draggable = false;
            img.style.userSelect = 'none';
            img.style.webkitUserDrag = 'none';
        });
        
        // Enhanced pointer events
        element.addEventListener('pointerdown', function(e) {
            if (e.button === 2) return; // Right click
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[BlocVibe] 👆 Enhanced pointer down on:', element.id);
            
            // تحديد نوع السحب
            dragType = determineDragType(element, e);
            dragModeManager.setMode(dragType);
            
            element.setPointerCapture(e.pointerId);
            draggedElement = element;
            dragSource = {
                element: element,
                parent: element.parentNode,
                index: Array.from(element.parentNode.children).indexOf(element),
                timestamp: Date.now()
            };
            
            currentState = DragState.READY;
            
            const rect = element.getBoundingClientRect();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            currentPointerX = e.clientX;
            currentPointerY = e.clientY;
            lastPointerX = e.clientX;
            lastPointerY = e.clientY;
            
            startEnhancedRecoveryTimer();
            
        }, { passive: false });
        
        element.addEventListener('pointermove', function(e) {
            if (!draggedElement || currentState === DragState.IDLE) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            currentPointerX = e.clientX;
            currentPointerY = e.clientY;
            
            // حساب السرعة
            const deltaX = currentPointerX - lastPointerX;
            const deltaY = currentPointerY - lastPointerY;
            pointerVelocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            const distX = currentPointerX - dragStartX;
            const distY = currentPointerY - dragStartY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            if (currentState === DragState.READY && distance > MIN_DRAG_DISTANCE) {
                startEnhancedDragging(element, e);
            }
            
            lastPointerX = currentPointerX;
            lastPointerY = currentPointerY;
            
        }, { passive: false });
        
        element.addEventListener('pointerup', function(e) {
            if (!draggedElement) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[BlocVibe] 🖐️ Enhanced pointer up - State:', currentState);
            
            if (currentState === DragState.DRAGGING) {
                performEnhancedDrop(e);
            }
            
            endEnhancedDragging();
            
        }, { passive: false });
        
        element.addEventListener('pointercancel', function(e) {
            console.log('[BlocVibe] ⚠️ Enhanced pointer cancelled');
            endEnhancedDragging();
        });
        
        // Enhanced hover effects
        element.addEventListener('pointerenter', function(e) {
            if (currentState === DragState.DRAGGING && draggedElement && draggedElement !== element) {
                element.style.background = 'rgba(13, 110, 253, 0.05)';
                
                // Highlight drop zone
                const dropZone = dropZoneManager.findDropZone(currentPointerX, currentPointerY);
                if (dropZone && dropZone.id === element.id) {
                    dropZoneManager.highlightZone(dropZone.id);
                }
            }
        });
        
        element.addEventListener('pointerleave', function(e) {
            element.style.background = '';
            dropZoneManager.removeZoneHighlight(element.id);
        });
    }
    
    function determineDragType(element, event) {
        // تحديد نوع السحب بناءً على السياق
        if (event.ctrlKey || event.metaKey) {
            return DragTypes.DUPLICATE;
        } else if (event.shiftKey) {
            return DragTypes.REORDER;
        } else if (element.hasAttribute('data-internal-draggable')) {
            return DragTypes.INTERNAL;
        } else {
            return DragTypes.EXTERNAL;
        }
    }
    
    // ==================== ENHANCED DRAG LIFECYCLE ====================
    
    function startEnhancedDragging(element, event) {
        console.log(`[BlocVibe] 🎬 Starting enhanced drag with Smart Positioning: ${element.id} (${dragType})`);
        
        currentState = DragState.DRAGGING;
        dragStartTime = performance.now();
        frameCount = 0;
        
        // Enhanced visual effects
        element.style.opacity = '0.35';
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        element.classList.add('bloc-dragging');
        
        // Smart Positioning: تحليل التخطيط الحالي
        performSmartLayoutAnalysis(element);
        
        // Smart Positioning: إظهار التلميحات أثناء السحب
        setupDragTimeHints(element);
        
        // Create enhanced ghost
        dragGhostId = visualFeedbackSystem.createDragGhost(element, {
            opacity: dragType === DragTypes.DUPLICATE ? '0.7' : '0.9',
            transform: `scale(1) rotate(${dragType === DragTypes.INTERNAL ? '1deg' : '3deg'})`
        });
        
        // Smart Positioning: كشف فرص التداخل
        setupSmartNestingDetection(element);
        
        // Start animation loop
        startEnhancedAnimationLoop();
        
        // Disable scrolling
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
        
        // Performance tracking
        performanceMetrics.totalDrags++;
    }
    
    function endEnhancedDragging() {
        console.log('[BlocVibe] 🏁 Ending enhanced drag');
        
        // Stop animation loop
        stopEnhancedAnimationLoop();
        
        // Restore original element
        if (draggedElement) {
            draggedElement.style.opacity = '1';
            draggedElement.style.transform = 'scale(1)';
            draggedElement.classList.remove('bloc-dragging');
        }
        
        // Clean up visual effects
        if (dragGhostId) {
            visualFeedbackSystem.removeGhost(dragGhostId);
            dragGhostId = null;
        }
        
        if (dropIndicatorId) {
            visualFeedbackSystem.removeDropIndicator(dropIndicatorId);
            dropIndicatorId = null;
        }
        
        dropZoneManager.highlightZone(null);
        
        // Reset state
        currentState = DragState.IDLE;
        draggedElement = null;
        dragSource = null;
        
        // Restore scrolling
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // Clear recovery timers
        clearEnhancedRecoveryTimer();
        
        // Performance logging
        if (dragStartTime > 0) {
            const duration = performance.now() - dragStartTime;
            const fps = frameCount / (duration / 1000);
            
            performanceMetrics.averageFPS = 
                (performanceMetrics.averageFPS * (performanceMetrics.totalDrags - 1) + fps) / 
                performanceMetrics.totalDrags;
            
            console.log(`[BlocVibe] 📊 Enhanced drag performance: ${duration.toFixed(0)}ms, ${fps.toFixed(1)} FPS`);
            
            // Alert if performance is poor
            if (fps < PERFORMANCE_THRESHOLD) {
                performanceMetrics.droppedFrames++;
                console.warn(`[BlocVibe] ⚠️ Low performance detected: ${fps.toFixed(1)} FPS`);
            }
        }
    }
    
    // ==================== ENHANCED ANIMATION LOOP ====================
    
    function startEnhancedAnimationLoop() {
        if (isAnimating) return;
        
        isAnimating = true;
        console.log('[BlocVibe] 🎞️ Starting enhanced animation loop');
        
        function animate(timestamp) {
            if (!isAnimating) return;
            
            frameCount++;
            lastFrameTime = timestamp;
            
            // Update ghost position
            updateEnhancedGhostPosition();
            
            // Update drop indicators
            updateEnhancedDropIndicator();
            
            // Update performance metrics
            updatePerformanceMetrics(timestamp);
            
            // Continue loop
            animationFrameId = requestAnimationFrame(animate);
        }
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    function stopEnhancedAnimationLoop() {
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        console.log('[BlocVibe] ⏸️ Enhanced animation loop stopped');
    }
    
    function updateEnhancedGhostPosition() {
        if (!dragGhostId || !isDragging()) return;
        
        const x = currentPointerX + GHOST_OFFSET;
        const y = currentPointerY + GHOST_OFFSET;
        
        visualFeedbackSystem.updateGhostPosition(dragGhostId, x, y);
    }
    
    function updateEnhancedDropIndicator() {
        if (!isDragging() || !draggedElement) {
            if (dropIndicatorId) {
                visualFeedbackSystem.removeDropIndicator(dropIndicatorId);
                dropIndicatorId = null;
            }
            return;
        }
        
        const dropZone = dropZoneManager.findDropZone(currentPointerX, currentPointerY);
        
        if (dropZone && dropZone.zone) {
            // Calculate optimal drop position
            const positionResult = positionCalculator.calculateDropPosition(
                draggedElement, dropZone.zone.element, currentPointerX, currentPointerY
            );
            
            if (positionResult.isValidDrop) {
                // Update drop zone highlight
                dropZoneManager.highlightZone(dropZone.id);
                
                // Create or update drop indicator
                if (!dropIndicatorId) {
                    dropIndicatorId = visualFeedbackSystem.createDropIndicator(
                        dropZone.zone.element, positionResult.position
                    );
                }
            } else {
                // Invalid drop position
                if (dropIndicatorId) {
                    visualFeedbackSystem.removeDropIndicator(dropIndicatorId);
                    dropIndicatorId = null;
                }
                dropZoneManager.highlightZone(null);
            }
        } else {
            // No valid drop zone
            if (dropIndicatorId) {
                visualFeedbackSystem.removeDropIndicator(dropIndicatorId);
                dropIndicatorId = null;
            }
            dropZoneManager.highlightZone(null);
        }
    }
    
    // ==================== ENHANCED DROP EXECUTION ====================
    
    function performEnhancedDrop(event) {
        const targetZone = dropZoneManager.findDropZone(currentPointerX, currentPointerY);
        
        if (!targetZone || !draggedElement || targetZone.zone.element === draggedElement) {
            console.log('[BlocVibe] ⚠️ No valid drop target for enhanced drop');
            showEnhancedNotification('لا يمكن إسقاط العنصر هنا', 'warning');
            return;
        }
        
        // Smart Positioning: تحليل التخطيط قبل الإسقاط
        const targetLayout = layoutDetectionEngine.analyzeCurrentLayout(targetZone.zone.element);
        
        // Calculate drop position
        const positionResult = positionCalculator.calculateDropPosition(
            draggedElement, targetZone.zone.element, currentPointerX, currentPointerY
        );
        
        if (!positionResult.isValidDrop) {
            console.warn('[BlocVibe] ⚠️ Invalid drop position');
            showEnhancedNotification('موضع الإسقاط غير صحيح', 'error');
            return;
        }
        
        console.log('[BlocVibe] 🎯 Performing Smart Positioning Drop:', {
            dragged: draggedElement.id,
            target: targetZone.id,
            type: dragType,
            position: positionResult.position.type,
            layoutAnalysis: targetLayout.layout.type
        });
        
        // Smart Positioning: تطبيق التحسينات قبل الإسقاط
        const optimizedDrop = await performSmartDropOptimization(
            draggedElement, targetZone, positionResult, targetLayout
        );
        
        // Execute drop based on type
        switch (dragType) {
            case DragTypes.EXTERNAL:
                executeExternalDrop(optimizedDrop.source, optimizedDrop.target, optimizedDrop.position);
                break;
            case DragTypes.DUPLICATE:
                executeDuplicateDrop(optimizedDrop.source, optimizedDrop.target, optimizedDrop.position);
                break;
            case DragTypes.REORDER:
                executeReorderDrop(optimizedDrop.source, optimizedDrop.target, optimizedDrop.position);
                break;
            default:
                executeDefaultDrop(optimizedDrop.source, optimizedDrop.target, optimizedDrop.position);
        }
        
        // Smart Positioning: تطبيق التحسينات بعد الإسقاط
        performPostDropOptimization(optimizedDrop.target, targetLayout);
        
        performanceMetrics.successfulDrops++;
    }
    
    function executeExternalDrop(source, targetZone, positionResult) {
        try {
            const targetElement = targetZone.zone.element;
            const parent = targetElement.parentNode;
            
            // Smart Positioning: تحقق من فرص التداخل الذكية
            const siblings = Array.from(parent.children).filter(child => 
                child.id && child.id.startsWith('bloc-') && child !== source
            );
            
            // تطبيق التداخل الذكي إذا توفرت الفرص
            if (siblings.length > 0) {
                const nestingOpportunities = smartNestingManager.detectNestingOpportunities(
                    [source, ...siblings.slice(0, 2)], // آخر عنصرين + العنصر الجديد
                    { parent: parent, type: 'external_drop' }
                );
                
                if (nestingOpportunities.length > 0) {
                    // تطبيق التداخل الذكي
                    const nestedContainer = smartNestingManager.applySmartNesting(source, nestingOpportunities);
                    if (nestedContainer) {
                        console.log('[BlocVibe] 🏗️ Applied smart nesting during external drop');
                        
                        // تحديث المراجع
                        const newParent = nestedContainer.parentNode;
                        queueEnhancedOperation({
                            type: 'move_with_nesting',
                            elementId: source.id,
                            nestedContainerId: nestedContainer.id,
                            parentId: newParent.id || 'body',
                            index: Array.from(newParent.children).indexOf(nestedContainer),
                            nestingOpportunity: nestingOpportunities[0]
                        });
                        
                        showEnhancedNotification('تم نقل العنصر مع تطبيق التداخل الذكي ✨', 'success');
                        return;
                    }
                }
            }
            
            if (positionResult.position.type === 'before') {
                parent.insertBefore(source, targetElement);
            } else if (positionResult.position.type === 'after') {
                parent.insertBefore(source, targetElement.nextSibling);
            } else {
                // Inside the target element
                targetElement.appendChild(source);
                
                // Smart Positioning: إنشاء flex container إذا كان مناسباً
                const children = Array.from(targetElement.children).filter(child => 
                    child.id && child.id.startsWith('bloc-')
                );
                
                if (children.length >= 3) {
                    setTimeout(() => {
                        const flexContainer = flexContainerManager.createSmartFlexContainer(children);
                        if (flexContainer) {
                            console.log('[BlocVibe] 📦 Created smart flex container during drop');
                            
                            // إضافة قواعد responsive
                            flexContainerManager.createResponsiveRules(flexContainer, children);
                            
                            // إشعار بالتحديث
                            queueEnhancedOperation({
                                type: 'flex_container_created',
                                containerId: flexContainer.id,
                                parentId: targetElement.id,
                                elements: children.map(el => el.id)
                            });
                        }
                    }, 100);
                }
            }
            
            // Enhanced success feedback
            source.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            source.style.transform = 'scale(1.05)';
            setTimeout(() => {
                source.style.transform = 'scale(1)';
            }, 300);
            
            // Queue operation
            queueEnhancedOperation({
                type: 'move',
                elementId: source.id,
                parentId: parent.id || 'body',
                index: Array.from(parent.children).indexOf(source),
                dragType: 'external',
                smartOptimization: true
            });
            
            showEnhancedNotification('تم نقل العنصر بنجاح ✨', 'success');
            
        } catch (error) {
            handleDropError('external', error);
        }
    }
    
    function executeDuplicateDrop(source, targetZone, positionResult) {
        try {
            const targetElement = targetZone.zone.element;
            const parent = targetElement.parentNode;
            
            // Smart Positioning: تحليل التخطيط قبل النسخ
            const parentLayout = layoutDetectionEngine.analyzeCurrentLayout(parent);
            
            // Create duplicate
            const duplicate = source.cloneNode(true);
            duplicate.id = generateUniqueId(source.id);
            
            // Update internal references in duplicate
            updateDuplicateReferences(duplicate, source.id);
            
            // Insert duplicate
            if (positionResult.position.type === 'before') {
                parent.insertBefore(duplicate, targetElement);
            } else if (positionResult.position.type === 'after') {
                parent.insertBefore(duplicate, targetElement.nextSibling);
            } else {
                targetElement.appendChild(duplicate);
            }
            
            // Make duplicate interactive
            makeElementInteractive(duplicate);
            
            // Smart Positioning: تطبيق تحسينات النسخ
            applyDuplicateOperationOptimization(
                source.id, 
                duplicate.id, 
                parent.id || 'body', 
                Array.from(parent.children).indexOf(duplicate)
            );
            
            // Success feedback
            visualFeedbackSystem.createValidationFeedback(
                duplicate, 'success', 'تم إنشاء نسخة جديدة مع التحسينات الذكية ✨'
            );
            
            // Queue operation
            queueEnhancedOperation({
                type: 'duplicate',
                originalId: source.id,
                duplicateId: duplicate.id,
                parentId: parent.id || 'body',
                index: Array.from(parent.children).indexOf(duplicate),
                position: positionResult.position.type,
                smartOptimization: true,
                layoutAnalysis: parentLayout.layout.type
            });
            
            showEnhancedNotification('تم إنشاء نسخة جديدة من العنصر مع التحسينات الذكية', 'success');
            
        } catch (error) {
            handleDropError('duplicate', error);
        }
    }
    
    function executeReorderDrop(source, targetZone, positionResult) {
        try {
            // This is similar to external drop but with different semantics
            executeExternalDrop(source, targetZone, positionResult);
            
            // Additional reorder-specific operations
            queueEnhancedOperation({
                type: 'reorder',
                elementId: source.id,
                fromParent: dragSource.parent.id,
                toParent: targetZone.zone.element.parentNode.id,
                dragType: 'reorder'
            });
            
            showEnhancedNotification('تم إعادة ترتيب العنصر', 'info');
            
        } catch (error) {
            handleDropError('reorder', error);
        }
    }
    
    function executeDefaultDrop(source, targetZone, positionResult) {
        // Default behavior - treat as external drop
        executeExternalDrop(source, targetZone, positionResult);
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    function generateUniqueId(originalId) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${originalId}-copy-${timestamp}-${random}`;
    }
    
    function updateDuplicateReferences(duplicate, originalId) {
        // Update any internal references, data attributes, etc.
        duplicate.setAttribute('data-copy-of', originalId);
        
        // Update event listeners if needed
        const cloneChildren = duplicate.querySelectorAll('[id^="bloc-"]');
        cloneChildren.forEach(child => {
            child.id = generateUniqueId(child.id);
        });
    }
    
    function makeElementInteractive(element) {
        enableEnhancedPointerDragging(element);
        enableSelection(element);
        enableInternalDrag(element);
        setupElementCache(element);
    }
    
    function handleDropError(dropType, error) {
        console.error(`[BlocVibe] ❌ ${dropType} drop failed:`, error);
        logError(`drop_error_${dropType}`, error.message);
        showEnhancedNotification(`فشل ${dropType === 'duplicate' ? 'إنشاء النسخة' : 'نقل العنصر'}`, 'error');
    }
    
    // ==================== SMART POSITIONING FUNCTIONS ====================
    
    /**
     * تحليل التخطيط الذكي للعنصر
     */
    function performSmartLayoutAnalysis(element) {
        try {
            const analysis = layoutDetectionEngine.analyzeCurrentLayout(element, {
                includeChildren: true,
                detectNested: true,
                analyzeSpacing: true,
                detectBreakpoints: true,
                suggestOptimizations: true
            });
            
            console.log('[Smart Positioning] 📊 Layout analysis:', {
                type: analysis.layout.type,
                complexity: analysis.complexity,
                optimizationSuggestions: analysis.optimizations.length
            });
            
            // إظهار تلميحات التحسين إذا كانت هناك اقتراحات
            if (analysis.optimizations.length > 0) {
                const improvements = layoutHintSystem.suggestLayoutImprovements(element, analysis);
                improvements.slice(0, 2).forEach(hint => { // أول اقتراحين فقط
                    layoutHintSystem.displayHint(hint);
                });
            }
            
            return analysis;
        } catch (error) {
            console.error('[Smart Positioning] ❌ Layout analysis failed:', error);
            return null;
        }
    }
    
    /**
     * إعداد التلميحات أثناء السحب
     */
    function setupDragTimeHints(element) {
        try {
            // إعداد مستمع للتلميحات
            layoutHintSystem.onHintActivated((hint) => {
                if (hint.type === layoutHintSystem.hintTypes.LAYOUT_HINT) {
                    console.log('[Smart Positioning] 💡 Layout hint activated:', hint.content);
                }
            });
            
            // إظهار تلميحات فورية
            const immediateHints = [
                layoutHintSystem.createSmartHint(element, layoutHintSystem.hintTypes.POSITION_HINT, {
                    position: 'dragging',
                    message: 'اسحب إلى الموقع المطلوب'
                }),
                layoutHintSystem.createSmartHint(element, layoutHintSystem.hintTypes.ALIGNMENT_HINT, {
                    alignment: 'auto',
                    message: 'سيتم محاذاة العنصر تلقائياً'
                })
            ];
            
            immediateHints.forEach(hint => {
                const indicator = layoutHintSystem.displayHint(hint);
                // إخفاء التلميحات بعد 2 ثانية
                setTimeout(() => {
                    if (indicator && indicator.parentNode) {
                        layoutHintSystem.dismissHint(hint.id);
                    }
                }, 2000);
            });
            
        } catch (error) {
            console.error('[Smart Positioning] ❌ Failed to setup drag hints:', error);
        }
    }
    
    /**
     * إعداد كشف التداخل الذكي أثناء السحب
     */
    function setupSmartNestingDetection(element) {
        try {
            // إعداد مستمع لفرص التداخل
            smartNestingManager.onNestingOpportunity((opportunity) => {
                console.log('[Smart Positioning] 🎯 Nesting opportunity detected:', {
                    confidence: opportunity.confidence,
                    type: opportunity.containerType,
                    elements: opportunity.elements.map(el => el.id)
                });
                
                // إظهار تلميح التداخل
                const nestingHint = layoutHintSystem.createSmartHint(element, layoutHintSystem.hintTypes.CONTAINER_HINT, {
                    containerType: opportunity.containerType,
                    confidence: opportunity.confidence,
                    suggestion: `تم كشف فرصة تداخل ${opportunity.containerType} (${Math.round(opportunity.confidence * 100)}%)`
                });
                
                layoutHintSystem.displayHint(nestingHint);
            });
            
        } catch (error) {
            console.error('[Smart Positioning] ❌ Failed to setup nesting detection:', error);
        }
    }
    
    /**
     * تطبيق التحسينات الذكية قبل الإسقاط
     */
    async function performSmartDropOptimization(source, targetZone, positionResult, targetLayout) {
        try {
            console.log('[Smart Positioning] 🔧 Performing pre-drop optimization...');
            
            // تحديث cache للتخطيط
            updateSmartPositioningCache(targetZone.zone.element, targetLayout);
            
            // تطبيق تحسينات flex container إذا كان مناسباً
            if (positionResult.position.type === 'inside') {
                const children = Array.from(targetZone.zone.element.children).filter(child => 
                    child.id && child.id.startsWith('bloc-') && child !== source
                );
                
                if (children.length >= 3 && targetLayout.layout.type === 'BLOCK') {
                    // إنشاء flex container محسن
                    const optimizedContainer = flexContainerManager.createSmartFlexContainer([source, ...children], {
                        direction: 'row',
                        preventWrap: false
                    });
                    
                    if (optimizedContainer) {
                        console.log('[Smart Positioning] 📦 Created optimized flex container');
                        
                        // إضافة قواعد responsive
                        flexContainerManager.createResponsiveRules(optimizedContainer, [source, ...children]);
                        
                        return {
                            source: source,
                            target: { zone: { element: optimizedContainer } },
                            position: positionResult
                        };
                    }
                }
            }
            
            return {
                source: source,
                target: targetZone,
                position: positionResult
            };
            
        } catch (error) {
            console.error('[Smart Positioning] ❌ Pre-drop optimization failed:', error);
            return {
                source: source,
                target: targetZone,
                position: positionResult
            };
        }
    }
    
    /**
     * تطبيق التحسينات بعد الإسقاط
     */
    function performPostDropOptimization(targetElement, originalLayout) {
        try {
            console.log('[Smart Positioning] 🎯 Performing post-drop optimization...');
            
            // تحليل التخطيط الجديد
            const newLayout = layoutDetectionEngine.analyzeCurrentLayout(targetElement, {
                includeChildren: true,
                suggestOptimizations: false // فقط التحليل بدون اقتراحات\n            });\n            \n            // تحسين الحاويات الموجودة\n            if (newLayout.layout.type === 'BLOCK') {\n                const children = Array.from(targetElement.children).filter(child => \n                    child.id && child.id.startsWith('bloc-')\n                );\n                \n                if (children.length >= 3) {\n                    // تحسين التخطيط إلى flex\n                    const flexContainer = flexContainerManager.createSmartFlexContainer(children);\n                    if (flexContainer) {\n                        console.log('[Smart Positioning] 📦 Created flex container in post-drop optimization');\n                        \n                        // إضافة قواعد responsive\n                        flexContainerManager.createResponsiveRules(flexContainer, children);\n                        \n                        // إشعار Java layer\n                        queueEnhancedOperation({\n                            type: 'auto_flex_conversion',\n                            containerId: flexContainer.id,\n                            parentId: targetElement.id,\n                            elements: children.map(el => el.id),\n                            originalLayout: originalLayout.layout.type\n                        });\n                    }\n                }\n            }\n            \n            // تطبيق تحسينات التداخل للعناصر الجديدة\n            setTimeout(() => {\n                const children = Array.from(targetElement.children).filter(child => \n                    child.id && child.id.startsWith('bloc-')\n                );\n                \n                if (children.length > 1) {\n                    const nestingOpportunities = smartNestingManager.detectNestingOpportunities(\n                        children.slice(-3), // آخر 3 عناصر\n                        { parent: targetElement, type: 'post_drop' }\n                    );\n                    \n                    if (nestingOpportunities.length > 0) {\n                        const nestedContainer = smartNestingManager.applySmartNesting(\n                            children[children.length - 1], \n                            nestingOpportunities\n                        );\n                        \n                        if (nestedContainer) {\n                            console.log('[Smart Positioning] 🏗️ Applied post-drop nesting optimization');\n                            \n                            // إشعار Java layer\n                            queueEnhancedOperation({\n                                type: 'auto_nesting_applied',\n                                nestedContainerId: nestedContainer.id,\n                                parentId: targetElement.id,\n                                opportunity: nestingOpportunities[0]\n                            });\n                        }\n                    }\n                }\n            }, 500);\n            \n        } catch (error) {\n            console.error('[Smart Positioning] ❌ Post-drop optimization failed:', error);\n        }\n    }\n    \n    /**\n     * تحديث ذاكرة التخزين المؤقت الذكية\n     */\n    function updateSmartPositioningCache(element, layoutData) {\n        const cacheKey = `smart-cache-${element.id}`;\n        const cacheEntry = {\n            layout: layoutData,\n            timestamp: Date.now(),\n            elements: Array.from(element.children).map(child => child.id),\n            parent: element.parentNode?.id || 'body'\n        };\n        \n        smartPositioningCache.set(cacheKey, cacheEntry);\n        \n        // تنظيف الذاكرة المؤقتة القديمة\n        if (smartPositioningCache.size > 50) {\n            const now = Date.now();\n            for (let [key, entry] of smartPositioningCache) {\n                if (now - entry.timestamp > CACHE_DURATION) {\n                    smartPositioningCache.delete(key);\n                }\n            }\n        }\n    }\n    \n    /**\n     * الحصول على بيانات الذاكرة المؤقتة\n     */\n    function getSmartPositioningCache(element) {\n        const cacheKey = `smart-cache-${element.id}`;\n        const cached = smartPositioningCache.get(cacheKey);\n        \n        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {\n            return cached;\n        }\n        \n        return null;\n    }\n    \n    /**\n     * تطبيق تحسينات على عملية النقل\n     */\n    function applyMoveOperationOptimization(elementId, parentId, index) {\n        try {\n            const element = document.getElementById(elementId);\n            if (!element) return;\n            \n            const parent = document.getElementById(parentId) || document.body;\n            \n            // تحليل التخطيط بعد النقل\n            const layout = layoutDetectionEngine.analyzeCurrentLayout(parent);\n            \n            // تطبيق تحسينات التداخل إذا كان مناسباً\n            if (layout.layout.type === 'BLOCK') {\n                const children = Array.from(parent.children).filter(child => \n                    child.id && child.id.startsWith('bloc-')\n                );\n                \n                if (children.length >= 2) {\n                    const opportunities = smartNestingManager.detectNestingOpportunities(\n                        children.slice(-2),\n                        { parent: parent, type: 'move_operation' }\n                    );\n                    \n                    if (opportunities.length > 0 && opportunities[0].confidence > 0.8) {\n                        const nestedContainer = smartNestingManager.applySmartNesting(\n                            element,\n                            opportunities\n                        );\n                        \n                        if (nestedContainer) {\n                            console.log('[Smart Positioning] 🏗️ Applied move operation nesting');\n                            \n                            queueEnhancedOperation({\n                                type: 'move_with_auto_nesting',\n                                elementId: elementId,\n                                nestedContainerId: nestedContainer.id,\n                                parentId: parentId,\n                                confidence: opportunities[0].confidence\n                            });\n                        }\n                    }\n                }\n            }\n            \n        } catch (error) {\n            console.error('[Smart Positioning] ❌ Move operation optimization failed:', error);\n        }\n    }\n    \n    /**\n     * تطبيق تحسينات على عملية الحذف\n     */\n    function applyDeleteOperationOptimization(elementId) {\n        try {\n            const element = document.getElementById(elementId);\n            if (!element) return;\n            \n            const parent = element.parentNode;\n            if (!parent) return;\n            \n            // تحليل التخطيط بعد الحذف\n            const layout = layoutDetectionEngine.analyzeCurrentLayout(parent);\n            const remainingChildren = Array.from(parent.children).filter(child => \n                child.id && child.id.startsWith('bloc-')\n            );\n            \n            // تحسين flex containers الموجودة\n            if (layout.layout.type === 'FLEX' && remainingChildren.length >= 3) {\n                setTimeout(() => {\n                    const optimized = flexContainerManager.optimizeExistingContainer(parent);\n                    if (optimized) {\n                        console.log('[Smart Positioning] 📦 Optimized flex container after delete');\n                        \n                        queueEnhancedOperation({\n                            type: 'flex_container_optimized',\n                            containerId: parent.id,\n                            elements: remainingChildren.map(el => el.id),\n                            optimization: 'post_delete'\n                        });\n                    }\n                }, 200);\n            }\n            \n            // تطبيق تحسينات التداخل للعناصر المتبقية\n            if (remainingChildren.length >= 2) {\n                const opportunities = smartNestingManager.detectNestingOpportunities(\n                    remainingChildren.slice(-2),\n                    { parent: parent, type: 'post_delete' }\n                );\n                \n                if (opportunities.length > 0) {\n                    const nestedContainer = smartNestingManager.applySmartNesting(\n                        remainingChildren[remainingChildren.length - 1],\n                        opportunities\n                    );\n                    \n                    if (nestedContainer) {\n                        console.log('[Smart Positioning] 🏗️ Applied delete operation nesting');\n                        \n                        queueEnhancedOperation({\n                            type: 'delete_with_nesting',\n                            deletedElementId: elementId,\n                            nestedContainerId: nestedContainer.id,\n                            parentId: parent.id || 'body'\n                        });\n                    }\n                }\n            }\n            \n        } catch (error) {\n            console.error('[Smart Positioning] ❌ Delete operation optimization failed:', error);\n        }\n    }\n    \n    /**\n     * تطبيق تحسينات على عملية النسخ\n     */\n    function applyDuplicateOperationOptimization(originalId, duplicateId, parentId, index) {\n        try {\n            const original = document.getElementById(originalId);\n            const duplicate = document.getElementById(duplicateId);\n            const parent = document.getElementById(parentId) || document.body;\n            \n            if (!original || !duplicate || !parent) return;\n            \n            // تحليل التخطيط بعد النسخ\n            const layout = layoutDetectionEngine.analyzeCurrentLayout(parent);\n            const children = Array.from(parent.children).filter(child => \n                child.id && child.id.startsWith('bloc-')\n            );\n            \n            // تحسين flex containers أو إنشاؤها\n            if (children.length >= 3) {\n                if (layout.layout.type === 'BLOCK') {\n                    // إنشاء flex container جديد\n                    const flexContainer = flexContainerManager.createSmartFlexContainer(children);\n                    if (flexContainer) {\n                        console.log('[Smart Positioning] 📦 Created flex container after duplicate');\n                        \n                        flexContainerManager.createResponsiveRules(flexContainer, children);\n                        \n                        queueEnhancedOperation({\n                            type: 'duplicate_with_flex',\n                            originalId: originalId,\n                            duplicateId: duplicateId,\n                            containerId: flexContainer.id,\n                            parentId: parentId\n                        });\n                    }\n                } else if (layout.layout.type === 'FLEX') {\n                    // تحسين flex container موجود\n                    setTimeout(() => {\n                        flexContainerManager.optimizeExistingContainer(parent);\n                    }, 300);\n                }\n            }\n            \n            // تطبيق تحسينات التداخل\n            const opportunities = smartNestingManager.detectNestingOpportunities(\n                [original, duplicate],\n                { parent: parent, type: 'duplicate_operation' }\n            );\n            \n            if (opportunities.length > 0 && opportunities[0].confidence > 0.75) {\n                const nestedContainer = smartNestingManager.applySmartNesting(\n                    duplicate,\n                    opportunities\n                );\n                \n                if (nestedContainer) {\n                    console.log('[Smart Positioning] 🏗️ Applied duplicate operation nesting');\n                    \n                    queueEnhancedOperation({\n                        type: 'duplicate_with_nesting',\n                        originalId: originalId,\n                        duplicateId: duplicateId,\n                        nestedContainerId: nestedContainer.id,\n                        parentId: parentId,\n                        confidence: opportunities[0].confidence\n                    });\n                }\n            }\n            \n        } catch (error) {\n            console.error('[Smart Positioning] ❌ Duplicate operation optimization failed:', error);\n        }\n    }\n    \n    // ==================== ENHANCED RECOVERY SYSTEM ===================="
    
    function startEnhancedRecoveryTimer() {
        clearEnhancedRecoveryTimer();
        
        recoveryTimer = setTimeout(() => {
            if (isDragging()) {
                console.warn('[BlocVibe] ⚠️ Enhanced recovery timeout - force ending drag');
                endEnhancedDragging();
                visualFeedbackSystem.createValidationFeedback(
                    document.body, 'warning', 'تم إيقاف السحب تلقائياً'
                );
            }
        }, RECOVERY_TIMEOUT);
    }
    
    function clearEnhancedRecoveryTimer() {
        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
            recoveryTimer = null;
        }
    }
    
    function startStateMonitor() {
        stateCheckTimer = setInterval(() => {
            checkSystemState();
        }, STATE_CHECK_INTERVAL);
    }
    
    function checkSystemState() {
        // Check for stuck states
        if (currentState !== DragState.IDLE && !isDragging()) {
            console.warn('[BlocVibe] ⚠️ Stuck state detected, recovering...');
            currentState = DragState.IDLE;
        }
        
        // Clean up stuck effects
        visualFeedbackSystem.clearAllEffects();
        
        // Update cache
        if (Date.now() - lastCacheUpdate > CACHE_DURATION) {
            updateLayoutCache();
        }
    }
    
    // ==================== PERFORMANCE MONITORING ====================
    
    function startPerformanceMonitor() {
        setInterval(() => {
            logPerformanceMetrics();
        }, 10000); // Every 10 seconds
    }
    
    function updatePerformanceMetrics(timestamp) {
        if (lastFrameTime > 0) {
            const deltaTime = timestamp - lastFrameTime;
            const currentFPS = 1000 / deltaTime;
            
            // Update moving average
            if (performanceMetrics.averageFPS === 0) {
                performanceMetrics.averageFPS = currentFPS;
            } else {
                performanceMetrics.averageFPS = 
                    performanceMetrics.averageFPS * 0.9 + currentFPS * 0.1;
            }
        }
    }
    
    function logPerformanceMetrics() {
        console.log('[BlocVibe] 📊 Performance Metrics:', {
            averageFPS: performanceMetrics.averageFPS.toFixed(1),
            totalDrags: performanceMetrics.totalDrags,
            successfulDrops: performanceMetrics.successfulDrops,
            dropRate: ((performanceMetrics.successfulDrops / performanceMetrics.totalDrags) * 100).toFixed(1) + '%',
            droppedFrames: performanceMetrics.droppedFrames,
            cacheSize: elementCache.size,
            activeEffects: visualFeedbackSystem.activeEffects.size
        });
    }
    
    // ==================== ENHANCED CACHE SYSTEM ====================
    
    function updateLayoutCache() {
        const elements = document.querySelectorAll('[id^="bloc-"]');
        elements.forEach(element => {
            const cacheKey = element.id;
            const cacheData = {
                rect: element.getBoundingClientRect(),
                children: Array.from(element.children).map(child => child.id),
                parent: element.parentNode.id,
                timestamp: Date.now()
            };
            elementCache.set(cacheKey, cacheData);
        });
        
        lastCacheUpdate = Date.now();
    }
    
    // ==================== ERROR HANDLING ====================
    
    function logError(type, message) {
        const errorEntry = {
            type: type,
            message: message,
            timestamp: new Date().toISOString(),
            state: currentState,
            element: draggedElement?.id || null
        };
        
        errorLog.push(errorEntry);
        
        // Keep log size limited
        if (errorLog.length > maxErrorLogSize) {
            errorLog.shift();
        }
        
        console.error(`[BlocVibe] ❌ ${type}:`, message);
    }
    
    // ==================== ENHANCED QUEUE SYSTEM ====================
    
    function queueEnhancedOperation(operation) {
        operation.timestamp = Date.now();
        operationQueue.push(operation);
        console.log('[BlocVibe] 📝 Enhanced operation queued:', operation.type, '- Queue size:', operationQueue.length);
    }
    
    function processEnhancedQueue() {
        if (isProcessingQueue || operationQueue.length === 0 || isDragging()) {
            return;
        }
        
        isProcessingQueue = true;
        console.log('[BlocVibe] ⚙️ Processing enhanced operation queue:', operationQueue.length, 'operations');
        
        const operations = [...operationQueue];
        operationQueue = [];
        
        operations.forEach(op => {
            try {
                switch(op.type) {
                    case 'move':
                        // تطبيق تحسينات على عملية النقل
                        if (op.smartOptimization) {
                            applyMoveOperationOptimization(op.elementId, op.parentId, op.index);
                        }
                        notifyJavaElementMoved(op.elementId, op.parentId, op.index, op.dragType);
                        break;
                    case 'duplicate':
                        notifyJavaElementDuplicated(op.originalId, op.duplicateId, op.parentId, op.index, op.position);
                        break;
                    case 'delete':
                        notifyJavaElementDeleted(op.elementId);
                        break;
                    case 'wrap':
                        notifyJavaElementsWrapped(op.elementIds);
                        break;
                    case 'reorder':
                        notifyJavaElementReordered(op.elementId, op.fromParent, op.toParent);
                        break;
                    case 'internal':
                        notifyJavaInternalOperation(op.operation, op.data);
                        break;
                    // Smart Positioning Operations
                    case 'move_with_nesting':
                        notifyJavaElementMovedWithNesting(op.elementId, op.nestedContainerId, op.parentId, op.index, op.nestingOpportunity);
                        break;
                    case 'flex_container_created':
                        notifyJavaFlexContainerCreated(op.containerId, op.parentId, op.elements);
                        break;
                    case 'auto_flex_conversion':
                        notifyJavaAutoFlexConversion(op.containerId, op.parentId, op.elements, op.originalLayout);
                        break;
                    case 'auto_nesting_applied':
                        notifyJavaAutoNestingApplied(op.nestedContainerId, op.parentId, op.opportunity);
                        break;
                    case 'move_with_auto_nesting':
                        notifyJavaMoveWithAutoNesting(op.elementId, op.nestedContainerId, op.parentId, op.confidence);
                        break;
                    case 'delete_with_nesting':
                        notifyJavaDeleteWithNesting(op.deletedElementId, op.nestedContainerId, op.parentId);
                        break;
                    case 'duplicate_with_nesting':
                        notifyJavaDuplicateWithNesting(op.originalId, op.duplicateId, op.nestedContainerId, op.parentId, op.confidence);
                        break;
                    case 'duplicate_with_flex':
                        notifyJavaDuplicateWithFlex(op.originalId, op.duplicateId, op.containerId, op.parentId);
                        break;
                    case 'flex_container_optimized':
                        notifyJavaFlexContainerOptimized(op.containerId, op.elements, op.optimization);
                        break;
                }
            } catch (error) {
                logError('queue_processing', error.message);
            }
        });
        
        isProcessingQueue = false;
        lastRenderTime = Date.now();
    }
    
    // ==================== ENHANCED ANDROID BRIDGE ====================
    
    function notifyJavaElementMoved(elementId, parentId, index, dragType = 'external') {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onElementMovedEnhanced) {
                    AndroidBridge.onElementMovedEnhanced(elementId, parentId, index, dragType);
                } else {
                    AndroidBridge.onElementMoved(elementId, parentId, index);
                }
                console.log('[BlocVibe] 📤 Enhanced notification sent: element moved');
            } catch (error) {
                logError('android_notification', error.message);
            }
        }
    }
    
    function notifyJavaElementDuplicated(originalId, duplicateId, parentId, index, position) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onElementDuplicated) {
                    AndroidBridge.onElementDuplicated(originalId, duplicateId, parentId, index, position);
                    console.log('[BlocVibe] 📤 Enhanced notification sent: element duplicated');
                }
            } catch (error) {
                logError('android_notification', error.message);
            }
        }
    }
    
    function notifyJavaElementDeleted(elementId) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.onElementDelete(elementId);
                console.log('[BlocVibe] 📤 Enhanced notification sent: element deleted');
            } catch (error) {
                logError('android_notification', error.message);
            }
        }
    }
    
    function notifyJavaElementsWrapped(elementIds) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.onElementsWrapInDiv(JSON.stringify(elementIds));
                console.log('[BlocVibe] 📤 Enhanced notification sent: elements wrapped');
            } catch (error) {
                logError('android_notification', error.message);
            }
        }
    }
    
    function notifyJavaElementReordered(elementId, fromParent, toParent) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onElementReordered) {
                    AndroidBridge.onElementReordered(elementId, fromParent, toParent);
                }
                console.log('[BlocVibe] 📤 Enhanced notification sent: element reordered');
            } catch (error) {
                logError('android_notification', error.message);
            }
        }
    }
    
    function notifyJavaInternalOperation(operation, data) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onInternalOperation) {
                    AndroidBridge.onInternalOperation(operation, JSON.stringify(data));
                }
                console.log('[BlocVibe] 📤 Enhanced notification sent: internal operation');
            } catch (error) {
                logError('android_notification', error.message);
            }
        }
    }
    
    // ==================== SMART POSITIONING ANDROID BRIDGE ====================
    
    function notifyJavaElementMovedWithNesting(elementId, nestedContainerId, parentId, index, nestingOpportunity) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onElementMovedWithNesting) {
                    AndroidBridge.onElementMovedWithNesting(
                        elementId, 
                        nestedContainerId, 
                        parentId, 
                        index, 
                        JSON.stringify(nestingOpportunity)
                    );
                }
                console.log('[Smart Positioning] 📤 Smart nesting notification sent: element moved with nesting');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaFlexContainerCreated(containerId, parentId, elements) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onFlexContainerCreated) {
                    AndroidBridge.onFlexContainerCreated(containerId, parentId, JSON.stringify(elements));
                }
                console.log('[Smart Positioning] 📤 Flex container notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaAutoFlexConversion(containerId, parentId, elements, originalLayout) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onAutoFlexConversion) {
                    AndroidBridge.onAutoFlexConversion(
                        containerId, 
                        parentId, 
                        JSON.stringify(elements), 
                        originalLayout
                    );
                }
                console.log('[Smart Positioning] 📤 Auto flex conversion notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaAutoNestingApplied(nestedContainerId, parentId, opportunity) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onAutoNestingApplied) {
                    AndroidBridge.onAutoNestingApplied(
                        nestedContainerId, 
                        parentId, 
                        JSON.stringify(opportunity)
                    );
                }
                console.log('[Smart Positioning] 📤 Auto nesting notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaMoveWithAutoNesting(elementId, nestedContainerId, parentId, confidence) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onMoveWithAutoNesting) {
                    AndroidBridge.onMoveWithAutoNesting(
                        elementId, 
                        nestedContainerId, 
                        parentId, 
                        confidence
                    );
                }
                console.log('[Smart Positioning] 📤 Move with auto nesting notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaDeleteWithNesting(deletedElementId, nestedContainerId, parentId) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onDeleteWithNesting) {
                    AndroidBridge.onDeleteWithNesting(deletedElementId, nestedContainerId, parentId);
                }
                console.log('[Smart Positioning] 📤 Delete with nesting notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaDuplicateWithNesting(originalId, duplicateId, nestedContainerId, parentId, confidence) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onDuplicateWithNesting) {
                    AndroidBridge.onDuplicateWithNesting(
                        originalId, 
                        duplicateId, 
                        nestedContainerId, 
                        parentId, 
                        confidence
                    );
                }
                console.log('[Smart Positioning] 📤 Duplicate with nesting notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaDuplicateWithFlex(originalId, duplicateId, containerId, parentId) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onDuplicateWithFlex) {
                    AndroidBridge.onDuplicateWithFlex(originalId, duplicateId, containerId, parentId);
                }
                console.log('[Smart Positioning] 📤 Duplicate with flex notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    function notifyJavaFlexContainerOptimized(containerId, elements, optimization) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onFlexContainerOptimized) {
                    AndroidBridge.onFlexContainerOptimized(
                        containerId, 
                        JSON.stringify(elements), 
                        optimization
                    );
                }
                console.log('[Smart Positioning] 📤 Flex container optimization notification sent');
            } catch (error) {
                logError('smart_positioning_notification', error.message);
            }
        }
    }
    
    // ==================== ENHANCED KEYBOARD SYSTEM ====================
    
    function handleEnhancedKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            multiSelectMode = true;
        }
        
        // Enhanced keyboard shortcuts
        switch(e.key) {
            case 'Escape':
                if (isDragging()) {
                    console.log('[BlocVibe] ⎋ Escape pressed - cancelling enhanced drag');
                    endEnhancedDragging();
                }
                break;
                
            case 'Delete':
                if (selectedElements.length > 0) {
                    e.preventDefault();
                    selectedElements.forEach(el => {
                        // تطبيق تحسينات قبل الحذف
                        applyDeleteOperationOptimization(el.id);
                        
                        queueEnhancedOperation({
                            type: 'delete',
                            elementId: el.id,
                            smartOptimization: true
                        });
                        
                        el.remove();
                    });
                    selectedElements = [];
                    showEnhancedNotification('تم حذف العناصر مع التحسينات الذكية', 'success');
                }
                break;
                
            case 'd':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (selectedElements.length === 1) {
                        const element = selectedElements[0];
                        const duplicate = element.cloneNode(true);
                        duplicate.id = generateUniqueId(element.id);
                        element.parentNode.insertBefore(duplicate, element.nextSibling);
                        makeElementInteractive(duplicate);
                        showEnhancedNotification('تم إنشاء نسخة سريعة', 'info');
                    }
                }
                break;
                
            case 'ArrowUp':
                if (selectedElements.length === 1 && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (typeof AndroidBridge !== 'undefined' && AndroidBridge.onElementMoveUp) {
                        AndroidBridge.onElementMoveUp(selectedElements[0].id);
                    }
                }
                break;
                
            case 'ArrowDown':
                if (selectedElements.length === 1 && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    if (typeof AndroidBridge !== 'undefined' && AndroidBridge.onElementMoveDown) {
                        AndroidBridge.onElementMoveDown(selectedElements[0].id);
                    }
                }
                break;
                
            case 'g':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    if (selectedElements.length > 0) {
                        const elementIds = selectedElements.map(el => el.id);
                        queueEnhancedOperation({
                            type: 'wrap',
                            elementIds: elementIds
                        });
                    }
                }
                break;
        }
    }
    
    function handleEnhancedKeyUp(e) {
        if (!e.ctrlKey && !e.metaKey) {
            multiSelectMode = false;
        }
    }
    
    // ==================== ENHANCED SELECTION SYSTEM ====================
    
    function enableSelection(element) {
        element.style.cursor = 'move';
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.touchAction = 'none';
        
        if (window.matchMedia('(hover: hover)').matches) {
            element.addEventListener('mouseenter', function() {
                if (!isDragging() && !selectedElements.includes(element)) {
                    element.style.outline = '2px dashed rgba(13, 110, 253, 0.5)';
                    element.style.transition = 'outline 0.2s ease';
                }
            });
            
            element.addEventListener('mouseleave', function() {
                if (!selectedElements.includes(element)) {
                    element.style.outline = 'none';
                }
            });
        }
    }
    
    function handleEnhancedElementClick(e) {
        if (isDragging()) return;
        
        const element = e.target.closest('[id^="bloc-"]');
        if (!element) return;
        
        e.stopPropagation();
        
        if (multiSelectMode) {
            toggleSelection(element);
        } else {
            clearSelections();
            selectElement(element);
        }
        
        // Enhanced selection notification
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onElementSelectedEnhanced) {
                    AndroidBridge.onElementSelectedEnhanced(element.id, selectedElements.map(el => el.id));
                } else {
                    AndroidBridge.onElementSelected(element.id);
                }
            } catch (error) {
                logError('selection_notification', error.message);
            }
        }
    }
    
    function selectElement(element) {
        if (selectedElements.includes(element)) return;
        
        selectedElements.push(element);
        element.classList.add('bloc-selected');
        element.style.outline = '3px solid #0D6EFD';
        element.style.backgroundColor = 'rgba(13, 110, 253, 0.08)';
        element.style.transition = 'all 0.2s ease';
    }
    
    function deselectElement(element) {
        const index = selectedElements.indexOf(element);
        if (index > -1) {
            selectedElements.splice(index, 1);
            element.classList.remove('bloc-selected');
            element.style.outline = 'none';
            element.style.backgroundColor = '';
        }
    }
    
    function toggleSelection(element) {
        if (selectedElements.includes(element)) {
            deselectElement(element);
        } else {
            selectElement(element);
        }
    }
    
    function clearSelections() {
        selectedElements.forEach(el => {
            el.classList.remove('bloc-selected');
            el.style.outline = 'none';
            el.style.backgroundColor = '';
        });
        selectedElements = [];
    }
    
    // ==================== ENHANCED NOTIFICATION SYSTEM ====================
    
    function showEnhancedNotification(message, type = 'info') {
        console.log(`[BlocVibe] 💬 Enhanced ${type.toUpperCase()}: ${message}`);
        
        // Visual feedback
        visualFeedbackSystem.createValidationFeedback(document.body, type, message);
        
        // Android notification
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.logEnhanced) {
                    AndroidBridge.logEnhanced(`[${type}] ${message}`, type);
                } else {
                    AndroidBridge.log(`[${type}] ${message}`);
                }
            } catch (error) {
                // Silent fail
            }
        }
    }
    
    // ==================== DROP ZONE MANAGEMENT ====================
    
    function setupDropZones() {
        // Auto-register common drop zones
        const containers = document.querySelectorAll('body > *, [data-drop-zone="true"]');
        containers.forEach(container => {
            if (container.id) {
                dropZoneManager.registerZone(container.id, {
                    element: container,
                    capacity: 'unlimited',
                    acceptTypes: ['all'],
                    visualFeedback: true
                });
            }
        });
        
        console.log('[BlocVibe] 📍 Setup drop zones for', containers.length, 'elements');
    }
    
    // ==================== ENHANCED CLEANUP ====================
    
    function cleanup() {
        console.log('[BlocVibe] 🧹 Cleaning up enhanced canvas system...');
        
        // Stop all timers
        clearEnhancedRecoveryTimer();
        if (stateCheckTimer) {
            clearInterval(stateCheckTimer);
            stateCheckTimer = null;
        }
        
        // Stop animation
        stopEnhancedAnimationLoop();
        
        // Clear visual effects
        visualFeedbackSystem.clearAllEffects();
        
        // Clear queues
        operationQueue = [];
        
        // Log final metrics
        logPerformanceMetrics();
        
        console.log('[BlocVibe] ✅ Enhanced cleanup completed');
    }
    
    function handleWindowBlur() {
        if (isDragging()) {
            console.log('[BlocVibe] ⚠️ Window lost focus during drag - ending drag');
            endEnhancedDragging();
        }
    }
    
    // ==================== ENHANCED PUBLIC API ====================
    
    window.BlocVibeCanvas = {
        // Core functions
        init: init,
        makeElementsInteractive: makeElementsInteractive,
        clearSelections: clearSelections,
        getSelectedElements: () => selectedElements.map(el => el.id),
        
        // Enhanced queue management
        queueOperation: queueEnhancedOperation,
        processQueue: processEnhancedQueue,
        
        // State management
        getDragState: () => currentState,
        getDragType: () => dragType,
        forceEndDrag: endEnhancedDragging,
        
        // Manager access
        dragModeManager: dragModeManager,
        dropZoneManager: dropZoneManager,
        positionCalculator: positionCalculator,
        visualFeedbackSystem: visualFeedbackSystem,
        
        // Smart Positioning Managers
        layoutDetectionEngine: layoutDetectionEngine,
        smartNestingManager: smartNestingManager,
        flexContainerManager: flexContainerManager,
        layoutHintSystem: layoutHintSystem,
        
        // Performance and monitoring
        getPerformanceMetrics: () => ({ ...performanceMetrics }),
        getErrorLog: () => [...errorLog],
        clearErrorLog: () => { errorLog = []; },
        
        // Cache management
        updateCache: updateLayoutCache,
        clearCache: () => { 
            elementCache.clear(); 
            layoutCache.clear(); 
            smartPositioningCache.clear(); 
        },
        getCacheSize: () => ({
            elementCache: elementCache.size,
            layoutCache: layoutCache.size,
            smartPositioningCache: smartPositioningCache.size
        }),
        
        // Drop zone management
        registerDropZone: (id, zone) => dropZoneManager.registerZone(id, zone),
        unregisterDropZone: (id) => dropZoneManager.unregisterZone(id),
        
        // Internal drag operations
        enableInternalDrag: enableInternalDrag,
        performInternalDrag: performInternalDrag,
        
        // Smart Positioning Functions
        performSmartLayoutAnalysis: performSmartLayoutAnalysis,
        applyMoveOperationOptimization: applyMoveOperationOptimization,
        applyDeleteOperationOptimization: applyDeleteOperationOptimization,
        applyDuplicateOperationOptimization: applyDuplicateOperationOptimization,
        
        // Smart Positioning Cache
        updateSmartPositioningCache: updateSmartPositioningCache,
        getSmartPositioningCache: getSmartPositioningCache,
        
        // Smart Positioning Performance
        getSmartPositioningReport: () => ({
            layoutDetection: layoutDetectionEngine.getPerformanceReport(),
            activeHints: layoutHintSystem.getActiveHintsCount(),
            cacheSize: smartPositioningCache.size,
            nestingOpportunities: smartNestingManager.listeners.nestingOpportunity.length,
            flexContainers: flexContainerManager.listeners.containerCreated.length
        }),
        
        // Debugging and Development
        enableSmartPositioningDebug: (enable = true) => {
            if (enable) {
                console.log('[Smart Positioning] 🔧 Debug mode enabled');
                layoutDetectionEngine.onLayoutDetected((data) => {
                    console.log('[Debug] Layout detected:', data);
                });
                smartNestingManager.onNestingApplied((data) => {
                    console.log('[Debug] Nesting applied:', data);
                });
                flexContainerManager.onContainerCreated((data) => {
                    console.log('[Debug] Flex container created:', data);
                });
                layoutHintSystem.onHintActivated((data) => {
                    console.log('[Debug] Hint activated:', data);
                });
            }
        }
    };
    
    // ==================== ENHANCED INITIALIZATION ====================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('[BlocVibe] 🎉 Ultra-Advanced Canvas System v3.0 with Smart Positioning loaded successfully!');
    console.log('[Smart Positioning] ✨ Smart Positioning System ready:', {
        layoutDetection: '✅',
        smartNesting: '✅',
        flexContainerManagement: '✅',
        layoutHints: '✅',
        cacheSystem: '✅'
    });
    
    // ==================== ENHANCED PAGE READY NOTIFICATION ====================
    if (typeof AndroidBridge !== 'undefined') {
        window.addEventListener('load', function() {
            try {
                const initMetrics = {
                    totalElements: document.querySelectorAll('[id^="bloc-"]').length,
                    version: '3.0',
                    features: [
                        'drag_modes', 
                        'drop_zones', 
                        'position_calculator', 
                        'visual_feedback', 
                        'cache', 
                        'recovery',
                        'smart_positioning',
                        'layout_detection',
                        'smart_nesting',
                        'flex_containers',
                        'layout_hints'
                    ],
                    smartPositioning: {
                        layoutDetectionEngine: layoutDetectionEngine ? 'enabled' : 'disabled',
                        smartNestingManager: smartNestingManager ? 'enabled' : 'disabled',
                        flexContainerManager: flexContainerManager ? 'enabled' : 'disabled',
                        layoutHintSystem: layoutHintSystem ? 'enabled' : 'disabled'
                    }
                };
                
                if (AndroidBridge.onPageReadyEnhanced) {
                    AndroidBridge.onPageReadyEnhanced(JSON.stringify(initMetrics));
                } else {
                    AndroidBridge.onPageReady();
                }
                
                console.log('[BlocVibe] 📢 Enhanced page ready notification with Smart Positioning sent to Android');
            } catch (error) {
                console.error('[BlocVibe] ❌ Failed to send enhanced page ready:', error);
            }
        });
    }
    
    // ==================== CLEANUP ON UNLOAD ====================
    window.addEventListener('beforeunload', cleanup);
    
})();