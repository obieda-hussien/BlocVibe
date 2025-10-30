/**
 * BlocVibe Ultra-Advanced Canvas Interaction System v3.0 - Advanced Properties Panel Integration
 * =======================================================================================
 * نظام Drag & Drop متطور جداً مع تكامل Smart Positioning System و Advanced Properties Panel
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
 * - Advanced Properties Panel System:
 *   * PropertyManager لإدارة خصائص العناصر
 *   * ElementTypeRegistry لتسجيل أنواع العناصر
 *   * DynamicPropertiesUI للواجهة الديناميكية
 *   * RealTimePropertySync للمزامنة الفورية
 *   * PropertyValidationEngine للتحقق من صحة البيانات
 *   * PropertiesPanelIntegration للتكامل مع اللوحة
 * - Cache و Performance Optimizations
 * - Error Handling و Recovery Mechanisms
 * - RequestAnimationFrame (تحديث سلس 60 FPS)
 * - Touch Events Fallback (توافق كامل)
 * - Smart Positioning Integration
 * - Advanced Properties Panel Integration
 */

(function() {
    'use strict';
    
    // ==================== FLEXBOX SYSTEM ====================
    
    /**
     * نظام Flexbox المتقدم - إدارة حاويات Flexbox
     */
    class FlexboxManagerAdvanced {
        constructor(config = {}) {
            this.enableAutoFlex = config.autoFlex !== false;
            this.optimizationLevel = config.optimizationLevel || 'high';
            this.listeners = {
                flexboxSuggested: [],
                flexboxApplied: [],
                flexboxPreviewShown: [],
                flexboxLayoutGenerated: []
            };
            this.flexboxCache = new Map();
            this.previewOverlays = new Map();
        }
        
        analyzeFlexboxOpportunities(element) {
            const cacheKey = `flexbox-analysis-${element.id}`;
            
            if (this.flexboxCache.has(cacheKey)) {
                return this.flexboxCache.get(cacheKey);
            }
            
            const children = Array.from(element.children).filter(child => 
                child.id && child.id.startsWith('bloc-')
            );
            
            const analysis = {
                element: element,
                candidate: false,
                confidence: 0,
                suggestions: [],
                layout: null,
                timestamp: Date.now()
            };
            
            if (children.length < 2) {
                this.flexboxCache.set(cacheKey, analysis);
                return analysis;
            }
            
            // تحليل فرص Flexbox
            const elementRects = children.map(child => ({
                element: child,
                rect: child.getBoundingClientRect(),
                width: child.offsetWidth,
                height: child.offsetHeight
            }));
            
            // تحليل المحاذاة الأفقية
            const horizontalAlignment = this.analyzeHorizontalAlignment(elementRects);
            if (horizontalAlignment.score > 0.6) {
                analysis.confidence += 0.3;
                analysis.suggestions.push({
                    type: 'horizontal_flex',
                    direction: 'row',
                    justifyContent: horizontalAlignment.suggestedJustify,
                    alignItems: 'center',
                    impact: 'HIGH'
                });
            }
            
            // تحليل المحاذاة الرأسية
            const verticalAlignment = this.analyzeVerticalAlignment(elementRects);
            if (verticalAlignment.score > 0.6) {
                analysis.confidence += 0.3;
                analysis.suggestions.push({
                    type: 'vertical_flex',
                    direction: 'column',
                    justifyContent: 'center',
                    alignItems: horizontalAlignment.suggestedAlign || 'stretch',
                    impact: 'HIGH'
                });
            }
            
            // تحليل التشابه في الحجم
            const sizeSimilarity = this.analyzeSizeSimilarity(elementRects);
            if (sizeSimilarity.score > 0.7) {
                analysis.confidence += 0.2;
                analysis.suggestions.forEach(suggestion => {
                    suggestion.alignItems = 'stretch';
                });
            }
            
            analysis.candidate = analysis.confidence > 0.5;
            analysis.layout = this.generateOptimalFlexboxLayout(elementRects, analysis.suggestions);
            
            this.flexboxCache.set(cacheKey, analysis);
            return analysis;
        }
        
        analyzeHorizontalAlignment(elementRects) {
            if (elementRects.length < 2) return { score: 0, suggestedJustify: 'center' };
            
            const topPositions = elementRects.map(er => er.rect.top);
            const avgTop = topPositions.reduce((sum, top) => sum + top, 0) / topPositions.length;
            const variance = topPositions.reduce((sum, top) => sum + Math.abs(top - avgTop), 0) / topPositions.length;
            
            const maxHeight = Math.max(...elementRects.map(er => er.height));
            const score = Math.max(0, 1 - (variance / maxHeight));
            
            let suggestedJustify = 'center';
            if (score > 0.8) suggestedJustify = 'space-between';
            else if (score > 0.6) suggestedJustify = 'space-around';
            
            return { score, suggestedJustify };
        }
        
        analyzeVerticalAlignment(elementRects) {
            if (elementRects.length < 2) return { score: 0, suggestedAlign: 'center' };
            
            const leftPositions = elementRects.map(er => er.rect.left);
            const avgLeft = leftPositions.reduce((sum, left) => sum + left, 0) / leftPositions.length;
            const variance = leftPositions.reduce((sum, left) => sum + Math.abs(left - avgLeft), 0) / leftPositions.length;
            
            const maxWidth = Math.max(...elementRects.map(er => er.width));
            const score = Math.max(0, 1 - (variance / maxWidth));
            
            return { score, suggestedAlign: score > 0.7 ? 'center' : 'stretch' };
        }
        
        analyzeSizeSimilarity(elementRects) {
            if (elementRects.length < 2) return { score: 0 };
            
            const areas = elementRects.map(er => er.width * er.height);
            const avgArea = areas.reduce((sum, area) => sum + area, 0) / areas.length;
            const variance = areas.reduce((sum, area) => sum + Math.abs(area - avgArea), 0) / areas.length;
            
            const score = Math.max(0, 1 - (variance / avgArea));
            return { score };
        }
        
        generateOptimalFlexboxLayout(elementRects, suggestions) {
            if (suggestions.length === 0) return null;
            
            const primarySuggestion = suggestions[0];
            const layout = {
                display: 'flex',
                flexDirection: primarySuggestion.direction,
                justifyContent: primarySuggestion.justifyContent,
                alignItems: primarySuggestion.alignItems,
                gap: this.calculateOptimalGap(elementRects),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            };
            
            return layout;
        }
        
        calculateOptimalGap(elementRects) {
            const avgWidth = elementRects.reduce((sum, er) => sum + er.width, 0) / elementRects.length;
            const avgHeight = elementRects.reduce((sum, er) => sum + er.height, 0) / elementRects.length;
            const avgSize = Math.min(avgWidth, avgHeight);
            
            if (avgSize < 80) return '4px';
            if (avgSize < 150) return '8px';
            if (avgSize < 250) return '12px';
            return '16px';
        }
        
        convertToFlexbox(elementId, direction = 'row', options = {}) {
            const element = document.getElementById(elementId);
            if (!element) return null;
            
            const analysis = this.analyzeFlexboxOpportunities(element);
            if (!analysis.candidate && !options.force) return null;
            
            const flexProperties = options.properties || analysis.layout || {
                display: 'flex',
                flexDirection: direction,
                gap: '8px'
            };
            
            // تطبيق خصائص Flexbox
            Object.assign(element.style, flexProperties);
            
            // إضافة تأثير بصري
            element.style.border = '2px dashed rgba(13, 110, 253, 0.6)';
            element.style.borderRadius = '8px';
            
            const children = Array.from(element.children).filter(child => 
                child.id && child.id.startsWith('bloc-')
            );
            
            children.forEach(child => {
                child.style.transition = 'all 0.3s ease';
            });
            
            this.notifyListeners('flexboxApplied', {
                element: element,
                properties: flexProperties,
                direction: direction,
                confidence: analysis.confidence,
                suggestions: analysis.suggestions
            });
            
            return flexProperties;
        }
        
        optimizeFlexbox(elementId) {
            const element = document.getElementById(elementId);
            if (!element || element.style.display !== 'flex') return false;
            
            const children = Array.from(element.children).filter(child => 
                child.id && child.id.startsWith('bloc-')
            );
            
            if (children.length === 0) return false;
            
            const elementRects = children.map(child => ({
                element: child,
                width: child.offsetWidth,
                height: child.offsetHeight
            }));
            
            // تحسين خصائص Flexbox
            const optimizedProps = {
                gap: this.calculateOptimalGap(elementRects),
                justifyContent: this.optimizeJustifyContent(children.length),
                alignItems: this.optimizeAlignItems(elementRects)
            };
            
            Object.assign(element.style, optimizedProps);
            
            this.notifyListeners('flexboxApplied', {
                element: element,
                properties: optimizedProps,
                type: 'optimization'
            });
            
            return true;
        }
        
        optimizeJustifyContent(itemCount) {
            if (itemCount === 1) return 'center';
            if (itemCount === 2) return 'space-between';
            return 'space-around';
        }
        
        optimizeAlignItems(elementRects) {
            const heights = elementRects.map(er => er.height);
            const avgHeight = heights.reduce((sum, h) => sum + h, 0) / heights.length;
            const variance = Math.max(...heights) - Math.min(...heights);
            
            return variance < avgHeight * 0.1 ? 'stretch' : 'center';
        }
        
        generateAutoLayout(elementIds) {
            const elements = elementIds.map(id => document.getElementById(id)).filter(Boolean);
            if (elements.length < 2) return null;
            
            // تحليل الترتيب الأمثل
            const positions = elements.map(el => ({
                element: el,
                centerX: el.offsetLeft + el.offsetWidth / 2,
                centerY: el.offsetTop + el.offsetHeight / 2
            }));
            
            const isHorizontal = this.detectHorizontalLayout(positions);
            const layout = {
                display: 'flex',
                flexDirection: isHorizontal ? 'row' : 'column',
                gap: this.calculateOptimalGap(elements.map(el => ({ width: el.offsetWidth, height: el.offsetHeight }))),
                justifyContent: 'center',
                alignItems: 'center'
            };
            
            this.notifyListeners('flexboxLayoutGenerated', {
                elements: elements,
                layout: layout,
                direction: isHorizontal ? 'horizontal' : 'vertical'
            });
            
            return layout;
        }
        
        detectHorizontalLayout(positions) {
            const avgY = positions.reduce((sum, pos) => sum + pos.centerY, 0) / positions.length;
            const varianceY = positions.reduce((sum, pos) => sum + Math.abs(pos.centerY - avgY), 0) / positions.length;
            
            const avgX = positions.reduce((sum, pos) => sum + pos.centerX, 0) / positions.length;
            const varianceX = positions.reduce((sum, pos) => sum + Math.abs(pos.centerX - avgX), 0) / positions.length;
            
            return varianceY < varianceX;
        }
        
        previewFlexboxChanges(elementId, properties) {
            const element = document.getElementById(elementId);
            if (!element) return null;
            
            const originalStyles = {};
            const previewStyles = { ...properties };
            
            // حفظ الأنماط الأصلية
            Object.keys(previewStyles).forEach(prop => {
                originalStyles[prop] = element.style[prop];
            });
            
            // تطبيق نمط المعاينة
            Object.assign(element.style, previewStyles);
            element.style.opacity = '0.7';
            element.style.pointerEvents = 'none';
            
            const overlay = document.createElement('div');
            overlay.className = 'flexbox-preview-overlay';
            overlay.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(13, 110, 253, 0.1);
                border: 2px dashed #0D6EFD;
                border-radius: 8px;
                pointer-events: none;
                z-index: 10000;
                animation: flexboxPreviewPulse 1.5s infinite;
            `;
            
            element.style.position = 'relative';
            element.appendChild(overlay);
            
            this.previewOverlays.set(elementId, { overlay, originalStyles });
            
            this.notifyListeners('flexboxPreviewShown', {
                element: element,
                properties: previewStyles,
                overlay: overlay
            });
            
            return overlay;
        }
        
        hideFlexboxPreview(elementId) {
            const previewData = this.previewOverlays.get(elementId);
            if (!previewData) return;
            
            const { overlay, originalStyles } = previewData;
            
            // استعادة الأنماط الأصلية
            Object.keys(originalStyles).forEach(prop => {
                element.style[prop] = originalStyles[prop];
            });
            
            // إزالة overlay
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            
            this.previewOverlays.delete(elementId);
        }
        
        detectFlexContainerOpportunities() {
            const opportunities = [];
            const containers = document.querySelectorAll('[id^="bloc-"]');
            
            containers.forEach(container => {
                const analysis = this.analyzeFlexboxOpportunities(container);
                if (analysis.candidate) {
                    opportunities.push({
                        element: container,
                        analysis: analysis,
                        priority: analysis.confidence
                    });
                }
            });
            
            return opportunities.sort((a, b) => b.priority - a.priority);
        }
        
        suggestFlexboxConversion(elementId) {
            const element = document.getElementById(elementId);
            if (!element) return null;
            
            const analysis = this.analyzeFlexboxOpportunities(element);
            if (!analysis.candidate) return null;
            
            this.notifyListeners('flexboxSuggested', {
                element: element,
                analysis: analysis,
                suggestions: analysis.suggestions
            });
            
            return analysis;
        }
        
        showFlexboxPreviewDuringDrag(draggedElement, containerElement) {
            if (!this.enableAutoFlex) return null;
            
            const analysis = this.analyzeFlexboxOpportunities(containerElement);
            if (!analysis.candidate) return null;
            
            const previewOverlay = this.previewFlexboxChanges(
                containerElement.id, 
                analysis.layout
            );
            
            return {
                overlay: previewOverlay,
                analysis: analysis,
                properties: analysis.layout
            };
        }
        
        onFlexboxSuggested(callback) {
            this.listeners.flexboxSuggested.push(callback);
        }
        
        onFlexboxApplied(callback) {
            this.listeners.flexboxApplied.push(callback);
        }
        
        onFlexboxPreviewShown(callback) {
            this.listeners.flexboxPreviewShown.push(callback);
        }
        
        onFlexboxLayoutGenerated(callback) {
            this.listeners.flexboxLayoutGenerated.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[FlexboxManagerAdvanced] Error in listener:', error);
                    }
                });
            }
        }
        
        clearCache() {
            this.flexboxCache.clear();
        }
    }
    
    /**
     * نظام معاينة Flexbox المتقدم
     */
    class FlexboxPreviewSystem {
        constructor() {
            this.previewElements = new Map();
            this.activePreviews = new Set();
            this.previewStyles = new WeakMap();
        }
        
        createFlexboxPreview(containerElement, properties, animation = true) {
            if (!containerElement) return null;
            
            const previewId = `flexbox-preview-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // إنشاء overlay للمعاينة
            const overlay = document.createElement('div');
            overlay.id = previewId;
            overlay.className = 'flexbox-preview';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9999;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            
            // إنشاء element container للمعاينة
            const previewContainer = document.createElement('div');
            previewContainer.className = 'flexbox-preview-container';
            previewContainer.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 12px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                padding: 24px;
                max-width: 80vw;
                max-height: 80vh;
                overflow: auto;
                pointer-events: auto;
            `;
            
            // عنوان المعاينة
            const title = document.createElement('h3');
            title.textContent = 'معاينة Flexbox Layout';
            title.style.cssText = `
                margin: 0 0 16px 0;
                color: #333;
                font-size: 18px;
                font-weight: 600;
            `;
            
            // معلومات خصائص Flexbox
            const propertiesList = document.createElement('div');
            propertiesList.style.cssText = `
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 20px;
            `;
            
            Object.entries(properties).forEach(([key, value]) => {
                const propertyItem = document.createElement('div');
                propertyItem.style.cssText = `
                    padding: 8px 12px;
                    background: #f8f9fa;
                    border-radius: 6px;
                    border: 1px solid #dee2e6;
                `;
                propertyItem.innerHTML = `
                    <strong style="color: #495057; font-size: 12px; display: block; margin-bottom: 4px;">${key}:</strong>
                    <span style="color: #007bff; font-weight: 500;">${value}</span>
                `;
                propertiesList.appendChild(propertyItem);
            });
            
            // منطقة معاينة العنصر
            const previewArea = document.createElement('div');
            previewArea.className = 'flexbox-preview-area';
            previewArea.style.cssText = `
                border: 2px dashed #dee2e6;
                border-radius: 8px;
                padding: 20px;
                min-height: 120px;
                background: #f8f9fa;
                position: relative;
            `;
            
            // إنشاء نسخة من العنصر للمعاينة
            const elementClone = containerElement.cloneNode(true);
            elementClone.id = `${containerElement.id}-preview`;
            
            // تطبيق خصائص Flexbox على النسخة
            Object.assign(elementClone.style, properties);
            elementClone.style.transform = 'scale(0.8)';
            elementClone.style.opacity = '0.8';
            
            previewArea.appendChild(elementClone);
            
            // أزرار التحكم
            const controls = document.createElement('div');
            controls.style.cssText = `
                display: flex;
                gap: 12px;
                justify-content: center;
                margin-top: 20px;
            `;
            
            const applyBtn = document.createElement('button');
            applyBtn.textContent = 'تطبيق Flexbox';
            applyBtn.style.cssText = `
                padding: 10px 20px;
                background: #0D6EFD;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s ease;
            `;
            
            const cancelBtn = document.createElement('button');
            cancelBtn.textContent = 'إلغاء';
            cancelBtn.style.cssText = `
                padding: 10px 20px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 6px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.2s ease;
            `;
            
            // تجميع المعاينة
            previewContainer.appendChild(title);
            previewContainer.appendChild(propertiesList);
            previewContainer.appendChild(previewArea);
            previewContainer.appendChild(controls);
            overlay.appendChild(previewContainer);
            
            // إضافة للأزرار
            controls.appendChild(applyBtn);
            controls.appendChild(cancelBtn);
            
            // إظهار المعاينة
            document.body.appendChild(overlay);
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });
            
            // حفظ بيانات المعاينة
            this.previewElements.set(previewId, {
                overlay: overlay,
                container: previewContainer,
                originalElement: containerElement,
                properties: properties,
                elementClone: elementClone
            });
            
            this.activePreviews.add(previewId);
            
            // أحداث الأزرار
            applyBtn.addEventListener('click', () => {
                this.applyFlexboxProperties(containerElement, properties);
                this.closeFlexboxPreview(previewId);
            });
            
            cancelBtn.addEventListener('click', () => {
                this.closeFlexboxPreview(previewId);
            });
            
            // إغلاق بالنقر خارج المعاينة
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.closeFlexboxPreview(previewId);
                }
            });
            
            return previewId;
        }
        
        applyFlexboxProperties(element, properties) {
            Object.assign(element.style, properties);
            
            // إضافة تأثير بصري
            element.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.transform = 'scale(1.02)';
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 100);
        }
        
        closeFlexboxPreview(previewId) {
            const previewData = this.previewElements.get(previewId);
            if (!previewData) return;
            
            const { overlay } = previewData;
            
            // إخفاء مع انيميشن
            overlay.style.opacity = '0';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                this.previewElements.delete(previewId);
                this.activePreviews.delete(previewId);
            }, 300);
        }
        
        closeAllPreviews() {
            this.activePreviews.forEach(previewId => {
                this.closeFlexboxPreview(previewId);
            });
        }
        
        updateFlexboxPreview(previewId, newProperties) {
            const previewData = this.previewElements.get(previewId);
            if (!previewData) return false;
            
            const { elementClone } = previewData;
            
            // تحديث خصائص المعاينة
            Object.assign(elementClone.style, newProperties);
            
            // حفظ الخصائص الجديدة
            previewData.properties = { ...previewData.properties, ...newProperties };
            
            return true;
        }
    }
    
    /**
     * نظام مؤشرات اتجاه Flexbox
     */
    class FlexboxDirectionIndicators {
        constructor() {
            this.indicators = new Map();
            this.activeIndicators = new Set();
        }
        
        showDirectionIndicator(containerElement, direction = 'row') {
            if (!containerElement) return null;
            
            const indicatorId = `direction-indicator-${Date.now()}`;
            const indicator = document.createElement('div');
            indicator.id = indicatorId;
            indicator.className = 'flexbox-direction-indicator';
            
            // أنماط المؤشر
            indicator.style.cssText = `
                position: absolute;
                top: -30px;
                left: 50%;
                transform: translateX(-50%);
                background: #0D6EFD;
                color: white;
                padding: 4px 12px;
                border-radius: 16px;
                font-size: 12px;
                font-weight: 500;
                z-index: 10001;
                pointer-events: none;
                box-shadow: 0 2px 8px rgba(13, 110, 253, 0.3);
                animation: directionIndicatorSlide 0.3s ease;
            `;
            
            // محتوى المؤشر
            const directionText = {
                'row': '→ أفقي',
                'column': '↓ عمودي',
                'row-reverse': '← أفقي معكوس',
                'column-reverse': '↑ عمودي معكوس'
            };
            
            indicator.textContent = directionText[direction] || direction;
            
            // إضافة للعنصر
            containerElement.style.position = 'relative';
            containerElement.appendChild(indicator);
            
            // حفظ المؤشر
            this.indicators.set(indicatorId, {
                indicator: indicator,
                element: containerElement,
                direction: direction
            });
            
            this.activeIndicators.add(indicatorId);
            
            return indicatorId;
        }
        
        hideDirectionIndicator(indicatorId) {
            const indicatorData = this.indicators.get(indicatorId);
            if (!indicatorData) return;
            
            const { indicator } = indicatorData;
            
            // إخفاء مع انيميشن
            indicator.style.transform = 'translateX(-50%) translateY(-10px)';
            indicator.style.opacity = '0';
            
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.parentNode.removeChild(indicator);
                }
                this.indicators.delete(indicatorId);
                this.activeIndicators.delete(indicatorId);
            }, 300);
        }
        
        showAllDirectionIndicators(containerElements) {
            containerElements.forEach(container => {
                if (container.style.display === 'flex') {
                    this.showDirectionIndicator(container, container.style.flexDirection || 'row');
                }
            });
        }
        
        hideAllDirectionIndicators() {
            this.activeIndicators.forEach(indicatorId => {
                this.hideDirectionIndicator(indicatorId);
            });
        }
        
        updateDirectionIndicator(indicatorId, newDirection) {
            const indicatorData = this.indicators.get(indicatorId);
            if (!indicatorData) return false;
            
            const { indicator } = indicatorData;
            const directionText = {
                'row': '→ أفقي',
                'column': '↓ عمودي',
                'row-reverse': '← أفقي معكوس',
                'column-reverse': '↑ عمودي معكوس'
            };
            
            indicator.textContent = directionText[newDirection] || newDirection;
            indicatorData.direction = newDirection;
            
            return true;
        }
    }
    
    /**
     * نظام الترتيب التلقائي لـ Flexbox
     */
    class FlexboxAutoLayout {
        constructor() {
            this.layoutStrategies = {
                equal_width: this.createEqualWidthLayout,
                responsive: this.createResponsiveLayout,
                centered: this.createCenteredLayout,
                spaced: this.createSpacedLayout
            };
            this.cache = new Map();
        }
        
        generateAutoLayout(elementIds, strategy = 'responsive', options = {}) {
            const elements = elementIds.map(id => document.getElementById(id)).filter(Boolean);
            if (elements.length === 0) return null;
            
            const cacheKey = `auto-layout-${strategy}-${elementIds.join('-')}`;
            
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }
            
            const layoutFunction = this.layoutStrategies[strategy];
            if (!layoutFunction) {
                console.warn(`Unknown layout strategy: ${strategy}`);
                return null;
            }
            
            const layout = layoutFunction.call(this, elements, options);
            
            this.cache.set(cacheKey, layout);
            return layout;
        }
        
        createEqualWidthLayout(elements, options = {}) {
            const elementCount = elements.length;
            const gap = options.gap || '8px';
            
            return {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'stretch',
                gap: gap,
                flexWrap: 'nowrap'
            };
        }
        
        createResponsiveLayout(elements, options = {}) {
            const elementCount = elements.length;
            const gap = options.gap || '12px';
            
            return {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                gap: gap,
                flexWrap: elementCount > 3 ? 'wrap' : 'nowrap'
            };
        }
        
        createCenteredLayout(elements, options = {}) {
            const elementCount = elements.length;
            const gap = options.gap || '16px';
            
            return {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                gap: gap,
                flexWrap: 'nowrap'
            };
        }
        
        createSpacedLayout(elements, options = {}) {
            const elementCount = elements.length;
            const gap = options.gap || '20px';
            
            return {
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                gap: gap,
                flexWrap: 'nowrap'
            };
        }
        
        optimizeLayoutForContainer(containerElement, elements) {
            if (!containerElement || elements.length === 0) return null;
            
            const containerWidth = containerElement.offsetWidth;
            const avgElementWidth = elements.reduce((sum, el) => sum + el.offsetWidth, 0) / elements.length;
            const totalWidth = elements.length * avgElementWidth;
            
            let strategy = 'centered';
            if (totalWidth < containerWidth * 0.8) {
                strategy = 'spaced';
            } else if (totalWidth > containerWidth) {
                strategy = 'responsive';
            } else {
                strategy = 'equal_width';
            }
            
            return this.generateAutoLayout(elements.map(el => el.id), strategy);
        }
        
        clearCache() {
            this.cache.clear();
        }
    }

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
    
    // ==================== ADVANCED PROPERTIES PANEL SYSTEM ====================
    
    class PropertyManager {
        constructor(config = {}) {
            this.propertiesCache = new Map();
            this.listeners = {
                propertyChanged: [],
                propertyValidated: [],
                propertyApplied: []
            };
            this.maxCacheSize = config.maxCacheSize || 100;
            this.validationEnabled = config.validationEnabled !== false;
        }
        
        getProperties(elementId, elementType) {
            const cacheKey = `${elementType}-${elementId}`;
            
            if (this.propertiesCache.has(cacheKey)) {
                return this.propertiesCache.get(cacheKey);
            }
            
            const properties = this.generateDefaultProperties(elementType);
            this.propertiesCache.set(cacheKey, properties);
            
            return properties;
        }
        
        generateDefaultProperties(elementType) {
            const baseProperties = {
                id: null,
                type: elementType,
                style: {},
                attributes: {},
                classes: [],
                animations: [],
                layout: {}
            };
            
            // Properties خاصة لكل نوع عنصر
            switch (elementType.toLowerCase()) {
                case 'text':
                    return {
                        ...baseProperties,
                        style: {
                            color: '#000000',
                            fontSize: '16px',
                            fontWeight: 'normal',
                            textAlign: 'left',
                            lineHeight: '1.5',
                            letterSpacing: '0px'
                        },
                        content: '',
                        link: null
                    };
                    
                case 'image':
                    return {
                        ...baseProperties,
                        style: {
                            width: '200px',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '0px',
                            border: 'none'
                        },
                        src: '',
                        alt: '',
                        link: null
                    };
                    
                case 'button':
                    return {
                        ...baseProperties,
                        style: {
                            backgroundColor: '#007bff',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '10px 20px',
                            fontSize: '14px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        },
                        text: 'Button',
                        disabled: false
                    };
                    
                case 'container':
                case 'div':
                    return {
                        ...baseProperties,
                        style: {
                            display: 'block',
                            width: '100%',
                            height: 'auto',
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '0px',
                            margin: '0px'
                        },
                        children: []
                    };
                    
                default:
                    return baseProperties;
            }
        }
        
        updateProperty(elementId, property, value, elementType) {
            const properties = this.getProperties(elementId, elementType);
            const oldValue = this.getNestedProperty(properties, property);
            
            this.setNestedProperty(properties, property, value);
            
            // Cache update
            const cacheKey = `${elementType}-${elementId}`;
            this.propertiesCache.set(cacheKey, properties);
            
            this.notifyListeners('propertyChanged', {
                elementId,
                property,
                oldValue,
                newValue: value,
                elementType
            });
            
            return { success: true, oldValue, newValue: value };
        }
        
        getNestedProperty(obj, path) {
            return path.split('.').reduce((current, key) => current?.[key], obj);
        }
        
        setNestedProperty(obj, path, value) {
            const keys = path.split('.');
            const lastKey = keys.pop();
            const target = keys.reduce((current, key) => {
                if (!current[key]) current[key] = {};
                return current[key];
            }, obj);
            target[lastKey] = value;
        }
        
        validateProperty(elementId, property, value, elementType) {
            const validationRules = this.getValidationRules(elementType);
            const rule = validationRules[property];
            
            if (!rule) {
                return { isValid: true, error: null };
            }
            
            const validationResult = this.applyValidationRule(value, rule);
            
            this.notifyListeners('propertyValidated', {
                elementId,
                property,
                value,
                validation: validationResult,
                elementType
            });
            
            return validationResult;
        }
        
        getValidationRules(elementType) {
            return {
                // Text validations
                'content': {
                    type: 'string',
                    maxLength: 1000,
                    required: false
                },
                'style.color': {
                    type: 'color',
                    pattern: /^#([0-9A-F]{3}){1,2}$/i
                },
                'style.fontSize': {
                    type: 'cssLength',
                    pattern: /^\d+(px|em|rem|%|vh|vw)$/
                },
                'style.width': {
                    type: 'cssLength',
                    pattern: /^\d+(px|em|rem|%|vh|vw)$/
                },
                'style.height': {
                    type: 'cssLength',
                    pattern: /^\d+(px|em|rem|%|vh|vw)$/
                },
                // Image validations
                'src': {
                    type: 'url',
                    pattern: /^https?:\/\/.+/
                },
                'alt': {
                    type: 'string',
                    maxLength: 100
                }
            };
        }
        
        applyValidationRule(value, rule) {
            switch (rule.type) {
                case 'string':
                    return {
                        isValid: typeof value === 'string' && 
                               (rule.maxLength ? value.length <= rule.maxLength : true) &&
                               (rule.required ? value.trim().length > 0 : true),
                        error: !rule.required && !value ? 'Optional field' : 
                               rule.required && !value ? 'Required field' :
                               rule.maxLength && value.length > rule.maxLength ? `Max length: ${rule.maxLength}` : null
                    };
                    
                case 'color':
                    return {
                        isValid: typeof value === 'string' && rule.pattern.test(value),
                        error: rule.pattern.test(value) ? null : 'Invalid color format'
                    };
                    
                case 'cssLength':
                    return {
                        isValid: typeof value === 'string' && rule.pattern.test(value),
                        error: rule.pattern.test(value) ? null : 'Invalid CSS length format'
                    };
                    
                case 'url':
                    return {
                        isValid: typeof value === 'string' && 
                               (!rule.pattern || rule.pattern.test(value)),
                        error: !value ? 'Required field' :
                               rule.pattern && !rule.pattern.test(value) ? 'Invalid URL format' : null
                    };
                    
                default:
                    return { isValid: true, error: null };
            }
        }
        
        onPropertyChanged(callback) {
            this.listeners.propertyChanged.push(callback);
        }
        
        onPropertyValidated(callback) {
            this.listeners.propertyValidated.push(callback);
        }
        
        onPropertyApplied(callback) {
            this.listeners.propertyApplied.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[PropertyManager] Error in listener:', error);
                    }
                });
            }
        }
        
        cleanupCache() {
            if (this.propertiesCache.size > this.maxCacheSize) {
                const keys = Array.from(this.propertiesCache.keys());
                const keysToRemove = keys.slice(0, this.propertiesCache.size - this.maxCacheSize);
                keysToRemove.forEach(key => this.propertiesCache.delete(key));
            }
        }
    }
    
    class ElementTypeRegistry {
        constructor() {
            this.registry = new Map();
            this.listeners = {
                typeRegistered: [],
                typeUpdated: []
            };
        }
        
        registerType(typeName, config) {
            const elementConfig = {
                name: typeName,
                category: config.category || 'general',
                properties: config.properties || {},
                validation: config.validation || {},
                ui: config.ui || {},
                handlers: config.handlers || {},
                priority: config.priority || 0
            };
            
            this.registry.set(typeName, elementConfig);
            
            this.notifyListeners('typeRegistered', {
                type: typeName,
                config: elementConfig
            });
            
            console.log(`[ElementTypeRegistry] Registered element type: ${typeName}`);
        }
        
        getType(typeName) {
            return this.registry.get(typeName);
        }
        
        getAllTypes() {
            return Array.from(this.registry.values());
        }
        
        getTypesByCategory(category) {
            return Array.from(this.registry.values())
                .filter(type => type.category === category);
        }
        
        updateType(typeName, updates) {
            const existing = this.getType(typeName);
            if (!existing) return false;
            
            const updated = {
                ...existing,
                ...updates,
                properties: { ...existing.properties, ...(updates.properties || {}) },
                validation: { ...existing.validation, ...(updates.validation || {}) },
                ui: { ...existing.ui, ...(updates.ui || {}) }
            };
            
            this.registry.set(typeName, updated);
            
            this.notifyListeners('typeUpdated', {
                type: typeName,
                config: updated,
                changes: updates
            });
            
            return true;
        }
        
        detectElementType(element) {
            // تحليل العنصر لتحديد نوعه
            if (!element) return 'unknown';
            
            const tagName = element.tagName.toLowerCase();
            const className = element.className.toLowerCase();
            const id = element.id.toLowerCase();
            
            // قواعد الكشف
            if (tagName === 'img') return 'image';
            if (tagName === 'button') return 'button';
            if (tagName === 'input') return 'input';
            if (tagName === 'textarea') return 'textarea';
            if (tagName === 'select') return 'select';
            if (tagName === 'a') return 'link';
            if (tagName === 'p' || tagName === 'h1' || tagName === 'h2' || 
                tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
                return 'text';
            }
            if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
                if (className.includes('container') || id.includes('container')) return 'container';
                return 'div';
            }
            
            // فحص registry للبحث عن تطابقات
            for (let [typeName, config] of this.registry) {
                if (config.handlers?.detect && config.handlers.detect(element)) {
                    return typeName;
                }
            }
            
            return tagName; // fallback
        }
        
        onTypeRegistered(callback) {
            this.listeners.typeRegistered.push(callback);
        }
        
        onTypeUpdated(callback) {
            this.listeners.typeUpdated.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[ElementTypeRegistry] Error in listener:', error);
                    }
                });
            }
        }
    }
    
    class DynamicPropertiesUI {
        constructor(containerElement) {
            this.container = containerElement;
            this.controls = new Map();
            this.listeners = {
                controlCreated: [],
                controlUpdated: [],
                controlDestroyed: []
            };
            this.defaultControlStyles = {
                marginBottom: '12px',
                padding: '8px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: '#fafafa'
            };
        }
        
        createControl(property, config) {
            const controlId = `control-${property}`;
            
            // إنشاء العنصر الأساسي
            const controlElement = document.createElement('div');
            controlElement.className = 'property-control';
            controlElement.id = controlId;
            
            // إضافة styles
            Object.assign(controlElement.style, this.defaultControlStyles);
            
            // إنشاء العنوان
            const label = document.createElement('label');
            label.textContent = config.label || property;
            label.style.display = 'block';
            label.style.marginBottom = '4px';
            label.style.fontWeight = '500';
            label.style.color = '#333';
            
            // إنشاء الحقل المناسب حسب النوع
            const input = this.createInputControl(property, config);
            
            // إضافة العنوان والحقل
            controlElement.appendChild(label);
            controlElement.appendChild(input);
            
            // إضافة للكونتينر
            this.container.appendChild(controlElement);
            
            // تخزين المرجع
            this.controls.set(property, {
                element: controlElement,
                input: input,
                config: config,
                property: property
            });
            
            this.notifyListeners('controlCreated', {
                property,
                control: controlElement,
                input,
                config
            });
            
            return controlElement;
        }
        
        createInputControl(property, config) {
            let input;
            
            switch (config.type) {
                case 'color':
                    input = document.createElement('input');
                    input.type = 'color';
                    break;
                    
                case 'select':
                    input = document.createElement('select');
                    config.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        input.appendChild(optionElement);
                    });
                    break;
                    
                case 'textarea':
                    input = document.createElement('textarea');
                    input.rows = config.rows || 3;
                    break;
                    
                case 'checkbox':
                    input = document.createElement('input');
                    input.type = 'checkbox';
                    break;
                    
                case 'number':
                    input = document.createElement('input');
                    input.type = 'number';
                    if (config.min !== undefined) input.min = config.min;
                    if (config.max !== undefined) input.max = config.max;
                    if (config.step !== undefined) input.step = config.step;
                    break;
                    
                case 'range':
                    input = document.createElement('input');
                    input.type = 'range';
                    if (config.min !== undefined) input.min = config.min;
                    if (config.max !== undefined) input.max = config.max;
                    if (config.step !== undefined) input.step = config.step;
                    break;
                    
                default:
                    input = document.createElement('input');
                    input.type = 'text';
            }
            
            // إضافة قيم افتراضية
            if (config.value !== undefined) {
                if (config.type === 'checkbox') {
                    input.checked = config.value;
                } else {
                    input.value = config.value;
                }
            }
            
            // إضافة event listeners
            input.addEventListener('change', (e) => {
                this.handleControlChange(property, e.target.value, config);
            });
            
            if (config.type === 'checkbox') {
                input.addEventListener('change', (e) => {
                    this.handleControlChange(property, e.target.checked, config);
                });
            }
            
            // إضافة styling
            input.style.width = '100%';
            input.style.padding = '6px 8px';
            input.style.border = '1px solid #ddd';
            input.style.borderRadius = '3px';
            input.style.fontSize = '14px';
            
            return input;
        }
        
        handleControlChange(property, value, config) {
            this.notifyListeners('controlUpdated', {
                property,
                value,
                config,
                input: this.controls.get(property)?.input
            });
        }
        
        updateControl(property, value, config) {
            const control = this.controls.get(property);
            if (!control) return;
            
            const input = control.input;
            
            if (config.type === 'checkbox') {
                input.checked = value;
            } else {
                input.value = value;
            }
            
            this.notifyListeners('controlUpdated', {
                property,
                value,
                config,
                input
            });
        }
        
        destroyControl(property) {
            const control = this.controls.get(property);
            if (!control) return;
            
            control.element.remove();
            this.controls.delete(property);
            
            this.notifyListeners('controlDestroyed', { property });
        }
        
        clearAllControls() {
            this.controls.forEach((control, property) => {
                control.element.remove();
            });
            this.controls.clear();
        }
        
        onControlCreated(callback) {
            this.listeners.controlCreated.push(callback);
        }
        
        onControlUpdated(callback) {
            this.listeners.controlUpdated.push(callback);
        }
        
        onControlDestroyed(callback) {
            this.listeners.controlDestroyed.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[DynamicPropertiesUI] Error in listener:', error);
                    }
                });
            }
        }
    }
    
    class RealTimePropertySync {
        constructor(config = {}) {
            this.syncQueue = new Map();
            this.isProcessing = false;
            this.batchSize = config.batchSize || 10;
            this.batchTimeout = config.batchTimeout || 100;
            this.listeners = {
                propertySynced: [],
                batchProcessed: []
            };
        }
        
        queueSync(elementId, property, value, source = 'ui') {
            if (!this.syncQueue.has(elementId)) {
                this.syncQueue.set(elementId, new Map());
            }
            
            const elementQueue = this.syncQueue.get(elementId);
            elementQueue.set(property, {
                value,
                source,
                timestamp: Date.now()
            });
            
            this.processBatch();
        }
        
        async processBatch() {
            if (this.isProcessing || this.syncQueue.size === 0) {
                return;
            }
            
            this.isProcessing = true;
            
            try {
                const batch = this.extractBatch();
                
                if (batch.length === 0) {
                    this.isProcessing = false;
                    return;
                }
                
                await this.applyBatch(batch);
                
                this.notifyListeners('batchProcessed', {
                    batch,
                    timestamp: Date.now()
                });
                
                // Continue processing if more items
                if (this.syncQueue.size > 0) {
                    setTimeout(() => this.processBatch(), this.batchTimeout);
                } else {
                    this.isProcessing = false;
                }
                
            } catch (error) {
                console.error('[RealTimePropertySync] Batch processing failed:', error);
                this.isProcessing = false;
            }
        }
        
        extractBatch() {
            const batch = [];
            const entries = Array.from(this.syncQueue.entries());
            
            for (let [elementId, properties] of entries) {
                const itemBatch = {
                    elementId,
                    properties: Object.fromEntries(properties)
                };
                batch.push(itemBatch);
                
                // Remove processed element
                this.syncQueue.delete(elementId);
                
                if (batch.length >= this.batchSize) break;
            }
            
            return batch;
        }
        
        async applyBatch(batch) {
            for (let item of batch) {
                try {
                    await this.applyElementSync(item.elementId, item.properties);
                    
                    this.notifyListeners('propertySynced', {
                        elementId: item.elementId,
                        properties: item.properties,
                        timestamp: Date.now()
                    });
                    
                } catch (error) {
                    console.error(`[RealTimePropertySync] Failed to sync element ${item.elementId}:`, error);
                }
            }
        }
        
        async applyElementSync(elementId, properties) {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            for (let [property, data] of Object.entries(properties)) {
                try {
                    await this.applyPropertyToDOM(element, property, data.value);
                    
                    // Update element with new value
                    this.updateElementProperty(element, property, data.value);
                    
                } catch (error) {
                    console.error(`[RealTimePropertySync] Failed to apply property ${property}:`, error);
                }
            }
        }
        
        async applyPropertyToDOM(element, property, value) {
            // تطبيق الخاصية على DOM
            if (property.startsWith('style.')) {
                const styleProperty = property.substring(6);
                element.style[styleProperty] = value;
            } else if (property.startsWith('attribute.')) {
                const attributeName = property.substring(10);
                if (value === null || value === undefined || value === '') {
                    element.removeAttribute(attributeName);
                } else {
                    element.setAttribute(attributeName, value);
                }
            } else {
                // خصائص مباشرة
                element[property] = value;
            }
        }
        
        updateElementProperty(element, property, value) {
            // تحديث خصائص العنصر الداخلية
            if (property === 'textContent' || property === 'innerHTML') {
                element[property] = value;
            } else if (property.startsWith('style.')) {
                const styleProperty = property.substring(6);
                element.style[styleProperty] = value;
            }
        }
        
        onPropertySynced(callback) {
            this.listeners.propertySynced.push(callback);
        }
        
        onBatchProcessed(callback) {
            this.listeners.batchProcessed.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[RealTimePropertySync] Error in listener:', error);
                    }
                });
            }
        }
        
        clearQueue() {
            this.syncQueue.clear();
        }
        
        getQueueSize() {
            return this.syncQueue.size;
        }
    }
    
    class PropertyValidationEngine {
        constructor(config = {}) {
            this.rules = new Map();
            this.customValidators = new Map();
            this.validationCache = new Map();
            this.listeners = {
                validationStarted: [],
                validationCompleted: [],
                validationFailed: []
            };
            this.maxCacheSize = config.maxCacheSize || 200;
        }
        
        addValidationRule(property, rule) {
            this.rules.set(property, {
                ...rule,
                id: `${property}_${Date.now()}`
            });
        }
        
        addCustomValidator(name, validator) {
            this.customValidators.set(name, validator);
        }
        
        validate(elementId, property, value, context = {}) {
            const validationId = this.generateValidationId(elementId, property, value);
            
            this.notifyListeners('validationStarted', {
                elementId,
                property,
                value,
                validationId
            });
            
            // Check cache first
            const cached = this.validationCache.get(validationId);
            if (cached && this.isCacheValid(cached)) {
                return cached.result;
            }
            
            try {
                const rule = this.rules.get(property);
                if (!rule) {
                    return { isValid: true, errors: [], warnings: [] };
                }
                
                const result = this.applyValidationRule(value, rule, context);
                
                // Cache result
                this.cacheValidationResult(validationId, result);
                
                this.notifyListeners('validationCompleted', {
                    elementId,
                    property,
                    value,
                    result,
                    validationId
                });
                
                return result;
                
            } catch (error) {
                const errorResult = {
                    isValid: false,
                    errors: [`Validation error: ${error.message}`],
                    warnings: []
                };
                
                this.notifyListeners('validationFailed', {
                    elementId,
                    property,
                    value,
                    error: error.message,
                    validationId
                });
                
                return errorResult;
            }
        }
        
        applyValidationRule(value, rule, context) {
            const errors = [];
            const warnings = [];
            
            // Required validation
            if (rule.required && (value === null || value === undefined || value === '')) {
                errors.push('This field is required');
                return { isValid: false, errors, warnings };
            }
            
            // Type validation
            if (rule.type && !this.validateType(value, rule.type)) {
                errors.push(`Invalid type. Expected: ${rule.type}`);
            }
            
            // Pattern validation
            if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
                errors.push(`Value does not match pattern: ${rule.pattern.source}`);
            }
            
            // Range validation
            if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
                errors.push(`Value must be at least ${rule.min}`);
            }
            
            if (rule.max !== undefined && typeof value === 'number' && value > rule.max) {
                errors.push(`Value must be at most ${rule.max}`);
            }
            
            // Length validation
            if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
                errors.push(`Length must be at least ${rule.minLength} characters`);
            }
            
            if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                errors.push(`Length must be at most ${rule.maxLength} characters`);
            }
            
            // Custom validation
            if (rule.custom && typeof rule.custom === 'function') {
                try {
                    const customResult = rule.custom(value, context);
                    if (customResult && typeof customResult === 'object') {
                        if (customResult.error) errors.push(customResult.error);
                        if (customResult.warning) warnings.push(customResult.warning);
                    }
                } catch (error) {
                    errors.push(`Custom validation failed: ${error.message}`);
                }
            }
            
            return {
                isValid: errors.length === 0,
                errors,
                warnings
            };
        }
        
        validateType(value, expectedType) {
            if (value === null || value === undefined) return !expectedType || expectedType === 'null';
            
            switch (expectedType) {
                case 'string':
                    return typeof value === 'string';
                case 'number':
                    return typeof value === 'number' && !isNaN(value);
                case 'boolean':
                    return typeof value === 'boolean';
                case 'array':
                    return Array.isArray(value);
                case 'object':
                    return typeof value === 'object' && !Array.isArray(value);
                case 'color':
                    return typeof value === 'string' && /^#([0-9A-F]{3}){1,2}$/i.test(value);
                case 'url':
                    return typeof value === 'string' && /^https?:\/\/.+/.test(value);
                default:
                    return true;
            }
        }
        
        generateValidationId(elementId, property, value) {
            return `${elementId}_${property}_${JSON.stringify(value)}_${typeof value}`;
        }
        
        isCacheValid(cached) {
            return Date.now() - cached.timestamp < 300000; // 5 minutes
        }
        
        cacheValidationResult(validationId, result) {
            this.validationCache.set(validationId, {
                result,
                timestamp: Date.now()
            });
            
            // Clean old cache entries
            if (this.validationCache.size > this.maxCacheSize) {
                this.cleanValidationCache();
            }
        }
        
        cleanValidationCache() {
            const now = Date.now();
            for (let [id, cached] of this.validationCache) {
                if (now - cached.timestamp > 300000) { // 5 minutes
                    this.validationCache.delete(id);
                }
            }
        }
        
        onValidationStarted(callback) {
            this.listeners.validationStarted.push(callback);
        }
        
        onValidationCompleted(callback) {
            this.listeners.validationCompleted.push(callback);
        }
        
        onValidationFailed(callback) {
            this.listeners.validationFailed.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[PropertyValidationEngine] Error in listener:', error);
                    }
                });
            }
        }
        
        clearCache() {
            this.validationCache.clear();
        }
    }
    
    class PropertiesPanelIntegration {
        constructor(config = {}) {
            this.panel = null;
            this.currentElement = null;
            this.isVisible = false;
            this.autoHide = config.autoHide !== false;
            this.position = config.position || 'right';
            this.width = config.width || '300px';
            this.animationDuration = config.animationDuration || 300;
            this.listeners = {
                panelOpened: [],
                panelClosed: [],
                elementChanged: [],
                propertyChanged: []
            };
        }
        
        createPanel() {
            if (this.panel) return this.panel;
            
            // إنشاء لوحة الخصائص
            this.panel = document.createElement('div');
            this.panel.id = 'properties-panel';
            this.panel.className = 'properties-panel';
            
            // إضافة الأنماط
            this.applyPanelStyles();
            
            // إنشاء المحتوى
            this.createPanelContent();
            
            // إضافة للصفحة
            document.body.appendChild(this.panel);
            
            console.log('[PropertiesPanelIntegration] Panel created');
            return this.panel;
        }
        
        applyPanelStyles() {
            const baseStyles = {
                position: 'fixed',
                top: '0',
                right: this.position === 'right' ? '0' : 'auto',
                left: this.position === 'left' ? '0' : 'auto',
                width: this.width,
                height: '100vh',
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                boxShadow: '-2px 0 10px rgba(0,0,0,0.1)',
                zIndex: '10000',
                transition: `transform ${this.animationDuration}ms ease-in-out`,
                transform: `translateX(${this.position === 'right' ? '100%' : '-100%'})`,
                overflowY: 'auto',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: '14px'
            };
            
            Object.assign(this.panel.style, baseStyles);
        }
        
        createPanelContent() {
            this.panel.innerHTML = `
                <div class="properties-panel-header">
                    <h3>خصائص العنصر</h3>
                    <button class="close-btn" aria-label="إغلاق">×</button>
                </div>
                <div class="properties-panel-content">
                    <div class="element-info">
                        <p class="element-type">نوع العنصر: <span id="current-element-type">غير محدد</span></p>
                        <p class="element-id">المعرف: <span id="current-element-id">غير محدد</span></p>
                    </div>
                    <div class="properties-section">
                        <h4>الخصائص العامة</h4>
                        <div id="general-properties" class="properties-container">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </div>
                    </div>
                    <div class="properties-section">
                        <h4>خصائص التصميم</h4>
                        <div id="style-properties" class="properties-container">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </div>
                    </div>
                    <div class="properties-section">
                        <h4>خصائص التخطيط</h4>
                        <div id="layout-properties" class="properties-container">
                            <!-- سيتم ملؤها ديناميكياً -->
                        </div>
                    </div>
                </div>
            `;
            
            // إضافة CSS للأنماط
            this.addPanelStyles();
            
            // إضافة event listeners
            this.addPanelEventListeners();
        }
        
        addPanelStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .properties-panel-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px;
                    border-bottom: 1px solid #e0e0e0;
                    background-color: #f8f9fa;
                }
                
                .properties-panel-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                    color: #333;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    font-size: 20px;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .close-btn:hover {
                    background-color: #e9ecef;
                    color: #333;
                }
                
                .properties-panel-content {
                    padding: 16px;
                }
                
                .element-info {
                    background-color: #f8f9fa;
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 16px;
                }
                
                .element-info p {
                    margin: 4px 0;
                    font-size: 13px;
                    color: #666;
                }
                
                .element-info span {
                    font-weight: 500;
                    color: #333;
                }
                
                .properties-section {
                    margin-bottom: 24px;
                }
                
                .properties-section h4 {
                    margin: 0 0 12px 0;
                    font-size: 14px;
                    font-weight: 600;
                    color: #333;
                    border-bottom: 1px solid #e0e0e0;
                    padding-bottom: 4px;
                }
                
                .properties-container {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .property-control {
                    margin-bottom: 0;
                }
                
                .property-control label {
                    font-size: 12px;
                    margin-bottom: 2px;
                }
                
                .property-control input,
                .property-control select,
                .property-control textarea {
                    font-size: 13px;
                    padding: 6px;
                }
            `;
            
            document.head.appendChild(style);
        }
        
        addPanelEventListeners() {
            const closeBtn = this.panel.querySelector('.close-btn');
            closeBtn.addEventListener('click', () => {
                this.hidePanel();
            });
            
            // إخفاء اللوحة عند النقر خارجها
            document.addEventListener('click', (e) => {
                if (this.isVisible && 
                    !this.panel.contains(e.target) && 
                    !e.target.closest('[id^="bloc-"]')) {
                    if (this.autoHide) {
                        this.hidePanel();
                    }
                }
            });
        }
        
        showPanel(elementId) {
            if (!this.panel) {
                this.createPanel();
            }
            
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn('[PropertiesPanelIntegration] Element not found:', elementId);
                return;
            }
            
            this.currentElement = element;
            this.updatePanelContent(element);
            this.panel.style.transform = 'translateX(0)';
            this.isVisible = true;
            
            this.notifyListeners('panelOpened', {
                elementId,
                element
            });
            
            console.log('[PropertiesPanelIntegration] Panel shown for element:', elementId);
        }
        
        hidePanel() {
            if (!this.panel || !this.isVisible) return;
            
            this.panel.style.transform = `translateX(${this.position === 'right' ? '100%' : '-100%'})`;
            this.isVisible = false;
            this.currentElement = null;
            
            this.notifyListeners('panelClosed', {});
            
            console.log('[PropertiesPanelIntegration] Panel hidden');
        }
        
        updatePanelContent(element) {
            // تحديث معلومات العنصر
            this.updateElementInfo(element);
            
            // تحديث الخصائص
            this.updateGeneralProperties(element);
            this.updateStyleProperties(element);
            this.updateLayoutProperties(element);
        }
        
        updateElementInfo(element) {
            const typeElement = this.panel.querySelector('#current-element-type');
            const idElement = this.panel.querySelector('#current-element-id');
            
            if (typeElement) {
                const elementType = elementTypeRegistry.detectElementType(element);
                typeElement.textContent = elementType;
            }
            
            if (idElement) {
                idElement.textContent = element.id || 'غير محدد';
            }
        }
        
        updateGeneralProperties(element) {
            const container = this.panel.querySelector('#general-properties');
            container.innerHTML = '';
            
            const properties = [
                { name: 'المعرف', property: 'id', type: 'text' },
                { name: 'الفئة', property: 'className', type: 'text' },
                { name: 'النص', property: 'textContent', type: 'textarea', rows: 2 }
            ];
            
            properties.forEach(prop => {
                const value = prop.property === 'className' ? element.className : element[prop.property];
                const control = this.createPropertyControl(prop.name, prop.property, value, prop);
                container.appendChild(control);
            });
        }
        
        updateStyleProperties(element) {
            const container = this.panel.querySelector('#style-properties');
            container.innerHTML = '';
            
            const computedStyle = window.getComputedStyle(element);
            const styleProperties = [
                { name: 'اللون', property: 'color', type: 'color', value: this.rgbToHex(computedStyle.color) },
                { name: 'حجم الخط', property: 'fontSize', type: 'text', value: computedStyle.fontSize },
                { name: 'لون الخلفية', property: 'backgroundColor', type: 'color', value: this.rgbToHex(computedStyle.backgroundColor) },
                { name: 'عرض الحد', property: 'borderWidth', type: 'text', value: computedStyle.borderWidth },
                { name: 'لون الحد', property: 'borderColor', type: 'color', value: this.rgbToHex(computedStyle.borderColor) },
                { name: 'نصف قطر الحد', property: 'borderRadius', type: 'text', value: computedStyle.borderRadius },
                { name: 'الحشو', property: 'padding', type: 'text', value: computedStyle.padding },
                { name: 'الهامش', property: 'margin', type: 'text', value: computedStyle.margin }
            ];
            
            styleProperties.forEach(prop => {
                const control = this.createPropertyControl(prop.name, `style.${prop.property}`, prop.value, prop);
                container.appendChild(control);
            });
        }
        
        updateLayoutProperties(element) {
            const container = this.panel.querySelector('#layout-properties');
            container.innerHTML = '';
            
            const layoutProperties = [
                { name: 'العرض', property: 'width', type: 'text', value: element.style.width || 'auto' },
                { name: 'الارتفاع', property: 'height', type: 'text', value: element.style.height || 'auto' },
                { name: 'نوع العرض', property: 'display', type: 'select', value: element.style.display || 'block', options: [
                    { value: 'block', label: 'Block' },
                    { value: 'inline', label: 'Inline' },
                    { value: 'inline-block', label: 'Inline Block' },
                    { value: 'flex', label: 'Flex' },
                    { value: 'grid', label: 'Grid' },
                    { value: 'none', label: 'None' }
                ]},
                { name: 'المحاذاة الأفقية', property: 'textAlign', type: 'select', value: element.style.textAlign || 'left', options: [
                    { value: 'left', label: 'يسار' },
                    { value: 'center', label: 'وسط' },
                    { value: 'right', label: 'يمين' },
                    { value: 'justify', label: 'مبرر' }
                ]},
                { name: 'المحاذاة العمودية', property: 'verticalAlign', type: 'select', value: element.style.verticalAlign || 'baseline', options: [
                    { value: 'baseline', label: 'Baseline' },
                    { value: 'top', label: 'أعلى' },
                    { value: 'middle', label: 'وسط' },
                    { value: 'bottom', label: 'أسفل' }
                ]}
            ];
            
            layoutProperties.forEach(prop => {
                const control = this.createPropertyControl(prop.name, `style.${prop.property}`, prop.value, prop);
                container.appendChild(control);
            });
        }
        
        createPropertyControl(labelText, property, value, config) {
            const controlDiv = document.createElement('div');
            controlDiv.className = 'property-control';
            
            const label = document.createElement('label');
            label.textContent = labelText;
            
            let input;
            switch (config.type) {
                case 'textarea':
                    input = document.createElement('textarea');
                    input.rows = config.rows || 2;
                    input.value = value || '';
                    break;
                    
                case 'select':
                    input = document.createElement('select');
                    config.options.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.value;
                        optionElement.textContent = option.label;
                        input.appendChild(optionElement);
                    });
                    input.value = value || '';
                    break;
                    
                case 'color':
                    input = document.createElement('input');
                    input.type = 'color';
                    input.value = value || '#000000';
                    break;
                    
                default:
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = value || '';
            }
            
            // إضافة event listener للتغيير
            input.addEventListener('change', (e) => {
                this.handlePropertyChange(property, e.target.value, this.currentElement);
            });
            
            // إضافة styling
            input.style.width = '100%';
            input.style.padding = '6px 8px';
            input.style.border = '1px solid #ddd';
            input.style.borderRadius = '4px';
            input.style.fontSize = '13px';
            
            controlDiv.appendChild(label);
            controlDiv.appendChild(input);
            
            return controlDiv;
        }
        
        handlePropertyChange(property, value, element) {
            if (!element) return;
            
            // تطبيق الخاصية على العنصر
            if (property.startsWith('style.')) {
                const styleProperty = property.substring(6);
                element.style[styleProperty] = value;
            } else {
                element[property] = value;
            }
            
            // إشعار listeners
            this.notifyListeners('propertyChanged', {
                elementId: element.id,
                property,
                value,
                element
            });
            
            console.log(`[PropertiesPanelIntegration] Property changed: ${property} = ${value}`);
        }
        
        rgbToHex(rgb) {
            if (!rgb || !rgb.startsWith('rgb')) return '#000000';
            
            const values = rgb.replace(/[^\d,]/g, '').split(',');
            const r = parseInt(values[0]);
            const g = parseInt(values[1]);
            const b = parseInt(values[2]);
            
            return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
        }
        
        onPanelOpened(callback) {
            this.listeners.panelOpened.push(callback);
        }
        
        onPanelClosed(callback) {
            this.listeners.panelClosed.push(callback);
        }
        
        onElementChanged(callback) {
            this.listeners.elementChanged.push(callback);
        }
        
        onPropertyChanged(callback) {
            this.listeners.propertyChanged.push(callback);
        }
        
        notifyListeners(event, data) {
            if (this.listeners[event]) {
                this.listeners[event].forEach(callback => {
                    try {
                        callback(data);
                    } catch (error) {
                        console.error('[PropertiesPanelIntegration] Error in listener:', error);
                    }
                });
            }
        }
        
        isPanelVisible() {
            return this.isVisible;
        }
        
        getCurrentElement() {
            return this.currentElement;
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
    let flexboxPreviewData = null;
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
        
        // Initialize Advanced Properties Panel System
        initializeAdvancedPropertiesPanelSystem();
        
        // Initialize Flexbox System
        initializeFlexboxSystem();
        
        console.log('[BlocVibe] ✅ Canvas interaction fully initialized with Smart Positioning & Advanced Properties Panel');
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
    
    function initializeAdvancedPropertiesPanelSystem() {
        try {
            console.log('[Properties Panel] 🔧 Initializing Advanced Properties Panel System...');
            
            // Initialize Properties Panel Managers
            elementTypeRegistry = new ElementTypeRegistry();
            propertyManager = new PropertyManager({
                enableCaching: true,
                maxCacheSize: 200,
                validationEnabled: true
            });
            
            // Initialize Properties Panel UI
            const propertiesPanelContainer = document.getElementById('properties-panel') || document.body;
            dynamicPropertiesUI = new DynamicPropertiesUI(propertiesPanelContainer);
            
            // Initialize Real-time Property Sync
            realTimePropertySync = new RealTimePropertySync({
                syncDelay: 50,
                batchSize: 10,
                enableBatching: true
            });
            
            // Initialize Property Validation Engine
            propertyValidationEngine = new PropertyValidationEngine({
                strictMode: false,
                autoCorrect: true,
                warningLevel: 'medium'
            });
            
            // Initialize Properties Panel Integration
            propertiesPanelIntegration = new PropertiesPanelIntegration({
                panelContainer: propertiesPanelContainer,
                animationDuration: 300,
                enableAnimations: true
            });
            
            console.log('[Properties Panel] ✅ Advanced Properties Panel System initialized successfully');
        } catch (error) {
            console.error('[Properties Panel] ❌ Failed to initialize Advanced Properties Panel System:', error);
        }
    }
    
    function initializeFlexboxSystem() {
        try {
            console.log('[Flexbox System] 🔧 Initializing Advanced Flexbox System...');
            
            // Add Flexbox System CSS
            addFlexboxSystemStyles();
            
            // Initialize Flexbox Managers
            flexboxManagerAdvanced = new FlexboxManagerAdvanced({
                autoFlex: true,
                optimizationLevel: 'high'
            });
            
            flexboxPreviewSystem = new FlexboxPreviewSystem();
            flexboxDirectionIndicators = new FlexboxDirectionIndicators();
            flexboxAutoLayout = new FlexboxAutoLayout();
            
            // Setup Flexbox Event Listeners
            setupFlexboxEventListeners();
            
            console.log('[Flexbox System] ✅ Advanced Flexbox System initialized successfully');
        } catch (error) {
            console.error('[Flexbox System] ❌ Failed to initialize Flexbox System:', error);
        }
    }
    
    function addFlexboxSystemStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flexboxPreviewPulse {
                0%, 100% { opacity: 0.7; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.02); }
            }
            
            @keyframes directionIndicatorSlide {
                from { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(-10px); 
                }
                to { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0); 
                }
            }
            
            .flexbox-preview-overlay {
                pointer-events: none;
            }
            
            .flexbox-direction-indicator {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                letter-spacing: 0.5px;
            }
            
            .flexbox-preview-container {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }
            
            .flexbox-preview-container h3 {
                font-family: inherit;
            }
            
            .smart-nested-container {
                animation: nestedContainerPulse 0.5s ease;
            }
            
            @keyframes nestedContainerPulse {
                0% { transform: scale(0.95); opacity: 0.8; }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); opacity: 1; }
            }
            
            .smart-flex-container {
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }
            
            .smart-flex-container:hover {
                box-shadow: 0 4px 12px rgba(13, 110, 253, 0.15);
            }
        `;
        
        document.head.appendChild(style);
    }
    
    function setupFlexboxEventListeners() {
        // Setup listeners for Flexbox System
        flexboxManagerAdvanced.onFlexboxSuggested((data) => {
            notifyJavaFlexboxConversionSuggested(data.element.id, data.suggestions, data.analysis.confidence);
        });
        
        flexboxManagerAdvanced.onFlexboxLayoutGenerated((data) => {
            notifyJavaFlexboxLayoutGenerated(data);
        });
        
        flexboxManagerAdvanced.onFlexboxPreviewShown((data) => {
            notifyJavaFlexboxPreviewShown(data.element.id, data.properties);
        });
        
        flexboxManagerAdvanced.onFlexboxApplied((data) => {
            notifyJavaFlexboxApplied(data.element.id, data.properties, data.direction);
        });
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
    
    // ==================== FLEXBOX ANDROID BRIDGE ====================
    
    function notifyJavaFlexboxConversionSuggested(elementId, suggestions, confidence) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onFlexboxConversionSuggested) {
                    AndroidBridge.onFlexboxConversionSuggested(
                        elementId,
                        JSON.stringify(suggestions),
                        confidence
                    );
                }
                console.log('[Flexbox System] 📤 Flexbox conversion suggested:', elementId, confidence);
            } catch (error) {
                logError('flexbox_notification', error.message);
            }
        }
    }
    
    function notifyJavaFlexboxLayoutGenerated(layoutData) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onFlexboxLayoutGenerated) {
                    AndroidBridge.onFlexboxLayoutGenerated(JSON.stringify(layoutData));
                }
                console.log('[Flexbox System] 📤 Flexbox layout generated:', layoutData);
            } catch (error) {
                logError('flexbox_notification', error.message);
            }
        }
    }
    
    function notifyJavaFlexboxPreviewShown(elementId, properties) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onFlexboxPreviewShown) {
                    AndroidBridge.onFlexboxPreviewShown(
                        elementId,
                        JSON.stringify(properties)
                    );
                }
                console.log('[Flexbox System] 📤 Flexbox preview shown:', elementId);
            } catch (error) {
                logError('flexbox_notification', error.message);
            }
        }
    }
    
    function notifyJavaFlexboxApplied(elementId, properties, direction) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                if (AndroidBridge.onFlexboxApplied) {
                    AndroidBridge.onFlexboxApplied(
                        elementId,
                        JSON.stringify(properties),
                        direction
                    );
                }
                console.log('[Flexbox System] 📤 Flexbox applied:', elementId, direction);
            } catch (error) {
                logError('flexbox_notification', error.message);
            }
        }
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
            
            // Open properties panel for single element selection
            try {
                // تحديد نوع العنصر
                const elementType = elementTypeRegistry.detectElementType(element);
                
                // عرض لوحة الخصائص
                propertiesPanelIntegration.showPanel(element.id);
                
                // إشعار Java layer بفتح لوحة الخصائص
                if (typeof AndroidBridge !== 'undefined') {
                    try {
                        if (AndroidBridge.onPropertiesPanelRequested) {
                            AndroidBridge.onPropertiesPanelRequested(element.id);
                        }
                    } catch (error) {
                        console.error('[Properties Panel] ❌ Failed to notify Java layer:', error);
                    }
                }
                
                console.log('[Properties Panel] 🎨 Properties panel opened for:', element.id, '(', elementType, ')');
            } catch (error) {
                console.error('[Properties Panel] ❌ Error opening properties panel:', error);
            }
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
    
        // ==================== FLEXBOX SYSTEM API ====================
        
        // Flexbox Managers
        flexboxManagerAdvanced: null,
        flexboxPreviewSystem: null,
        flexboxDirectionIndicators: null,
        flexboxAutoLayout: null,
        
        // Flexbox Operations
        convertToFlexbox: (elementId, direction, options) => {
            return flexboxManagerAdvanced.convertToFlexbox(elementId, direction, options);
        },
        
        optimizeFlexbox: (elementId) => {
            return flexboxManagerAdvanced.optimizeFlexbox(elementId);
        },
        
        generateAutoLayout: (elementIds, strategy, options) => {
            return flexboxManagerAdvanced.generateAutoLayout(elementIds, strategy, options);
        },
        
        previewFlexboxChanges: (elementId, properties) => {
            return flexboxManagerAdvanced.previewFlexboxChanges(elementId, properties);
        },
        
        hideFlexboxPreview: (elementId) => {
            return flexboxManagerAdvanced.hideFlexboxPreview(elementId);
        },
        
        // Flexbox Detection
        detectFlexContainerOpportunities: () => {
            return flexboxManagerAdvanced.detectFlexContainerOpportunities();
        },
        
        suggestFlexboxConversion: (elementId) => {
            return flexboxManagerAdvanced.suggestFlexboxConversion(elementId);
        },
        
        showFlexboxPreviewDuringDrag: (draggedElement, containerElement) => {
            return flexboxManagerAdvanced.showFlexboxPreviewDuringDrag(draggedElement, containerElement);
        },
        
        // Flexbox Preview System
        createFlexboxPreview: (containerElement, properties, animation) => {
            return flexboxPreviewSystem.createFlexboxPreview(containerElement, properties, animation);
        },
        
        closeFlexboxPreview: (previewId) => {
            return flexboxPreviewSystem.closeFlexboxPreview(previewId);
        },
        
        closeAllFlexboxPreviews: () => {
            return flexboxPreviewSystem.closeAllPreviews();
        },
        
        updateFlexboxPreview: (previewId, newProperties) => {
            return flexboxPreviewSystem.updateFlexboxPreview(previewId, newProperties);
        },
        
        // Flexbox Direction Indicators
        showDirectionIndicator: (containerElement, direction) => {
            return flexboxDirectionIndicators.showDirectionIndicator(containerElement, direction);
        },
        
        hideDirectionIndicator: (indicatorId) => {
            return flexboxDirectionIndicators.hideDirectionIndicator(indicatorId);
        },
        
        showAllDirectionIndicators: (containerElements) => {
            return flexboxDirectionIndicators.showAllDirectionIndicators(containerElements);
        },
        
        hideAllDirectionIndicators: () => {
            return flexboxDirectionIndicators.hideAllDirectionIndicators();
        },
        
        updateDirectionIndicator: (indicatorId, newDirection) => {
            return flexboxDirectionIndicators.updateDirectionIndicator(indicatorId, newDirection);
        },
        
        // Flexbox Auto Layout
        optimizeLayoutForContainer: (containerElement, elements) => {
            return flexboxAutoLayout.optimizeLayoutForContainer(containerElement, elements);
        },
        
        // Flexbox Event Listeners
        onFlexboxConversionSuggested: (callback) => {
            flexboxManagerAdvanced.onFlexboxSuggested((data) => {
                notifyJavaFlexboxConversionSuggested(data.element.id, data.suggestions, data.analysis.confidence);
                callback?.(data);
            });
        },
        
        onFlexboxLayoutGenerated: (callback) => {
            flexboxManagerAdvanced.onFlexboxLayoutGenerated((data) => {
                notifyJavaFlexboxLayoutGenerated(data);
                callback?.(data);
            });
        },
        
        onFlexboxPreviewShown: (callback) => {
            flexboxManagerAdvanced.onFlexboxPreviewShown((data) => {
                notifyJavaFlexboxPreviewShown(data.element.id, data.properties);
                callback?.(data);
            });
        },
        
        onFlexboxApplied: (callback) => {
            flexboxManagerAdvanced.onFlexboxApplied((data) => {
                notifyJavaFlexboxApplied(data.element.id, data.properties, data.direction);
                callback?.(data);
            });
        },
        
        // Flexbox Cache Management
        clearFlexboxCache: () => {
            flexboxManagerAdvanced.clearCache();
            flexboxAutoLayout.clearCache();
        },
        
        getFlexboxCacheSize: () => {
            return {
                flexboxManager: flexboxManagerAdvanced.flexboxCache.size,
                autoLayout: flexboxAutoLayout.cache.size
            };
        },

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
        
        // Flexbox System Managers
        flexboxManagerAdvanced: () => flexboxManagerAdvanced,
        flexboxPreviewSystem: () => flexboxPreviewSystem,
        flexboxDirectionIndicators: () => flexboxDirectionIndicators,
        flexboxAutoLayout: () => flexboxAutoLayout,
        
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
        },
        
        // ==================== ADVANCED PROPERTIES PANEL API ====================
        
        // Core Properties Panel Functions
        onPropertyChanged: onPropertyChanged,
        validatePropertyChange: validatePropertyChange,
        applyPropertyChange: applyPropertyChange,
        syncPropertyWithDOM: syncPropertyWithDOM,
        
        // UI Integration
        showPropertyEditor: showPropertyEditor,
        updatePropertyControls: updatePropertyControls,
        togglePropertiesPanel: togglePropertiesPanel,
        
        // Properties Panel Managers
        propertyManager: propertyManager,
        elementTypeRegistry: elementTypeRegistry,
        dynamicPropertiesUI: dynamicPropertiesUI,
        realTimePropertySync: realTimePropertySync,
        propertyValidationEngine: propertyValidationEngine,
        propertiesPanelIntegration: propertiesPanelIntegration,
        
        // Properties Panel Status
        isPropertiesPanelVisible: () => propertiesPanelIntegration.isPanelVisible(),
        getCurrentElement: () => propertiesPanelIntegration.getCurrentElement(),
        getSelectedElementType: () => {
            const currentElement = propertiesPanelIntegration.getCurrentElement();
            return currentElement ? elementTypeRegistry.detectElementType(currentElement) : null;
        },
        
        // Properties Panel Control
        openPropertiesPanel: (elementId) => {
            return togglePropertiesPanel(elementId);
        },
        closePropertiesPanel: () => {
            propertiesPanelIntegration.hidePanel();
            return true;
        },
        refreshPropertiesPanel: (elementId) => {
            const element = document.getElementById(elementId);
            if (element && propertiesPanelIntegration.getCurrentElement()?.id === elementId) {
                propertiesPanelIntegration.updatePanelContent(element);
                return true;
            }
            return false;
        },
        
        // Properties Panel Events
        onPropertiesPanelRequested: (callback) => {
            propertiesPanelIntegration.onPanelOpened(callback);
        },
        onPropertyUpdateComplete: (callback) => {
            realTimePropertySync.onPropertySynced(callback);
        },
        onPropertyValidationFailed: (callback) => {
            propertyValidationEngine.onValidationFailed(callback);
        }
    };
    
    // ==================== ENHANCED INITIALIZATION ====================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('[BlocVibe] 🎉 Ultra-Advanced Canvas System v3.0 with Advanced Properties Panel loaded successfully!');
    console.log('[Smart Positioning] ✨ Smart Positioning System ready:', {
        layoutDetection: '✅',
        smartNesting: '✅',
        flexContainerManagement: '✅',
        layoutHints: '✅',
        cacheSystem: '✅'
    });
    console.log('[Properties Panel] 🎨 Advanced Properties Panel System ready:', {
        propertyManager: '✅',
        elementTypeRegistry: '✅',
        dynamicPropertiesUI: '✅',
        realTimePropertySync: '✅',
        propertyValidationEngine: '✅',
        propertiesPanelIntegration: '✅',
        defaultElementTypes: '✅',
        validationRules: '✅'
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
                        'layout_hints',
                        'advanced_properties_panel',
                        'property_management',
                        'element_type_registry',
                        'dynamic_properties_ui',
                        'real_time_property_sync',
                        'property_validation_engine',
                        'properties_panel_integration'
                    ],
                    smartPositioning: {
                        layoutDetectionEngine: layoutDetectionEngine ? 'enabled' : 'disabled',
                        smartNestingManager: smartNestingManager ? 'enabled' : 'disabled',
                        flexContainerManager: flexContainerManager ? 'enabled' : 'disabled',
                        layoutHintSystem: layoutHintSystem ? 'enabled' : 'disabled'
                    },
                    propertiesPanel: {
                        propertyManager: propertyManager ? 'enabled' : 'disabled',
                        elementTypeRegistry: elementTypeRegistry ? 'enabled' : 'disabled',
                        dynamicPropertiesUI: dynamicPropertiesUI ? 'enabled' : 'disabled',
                        realTimePropertySync: realTimePropertySync ? 'enabled' : 'disabled',
                        propertyValidationEngine: propertyValidationEngine ? 'enabled' : 'disabled',
                        propertiesPanelIntegration: propertiesPanelIntegration ? 'enabled' : 'disabled'
                    }
                };
                
                if (AndroidBridge.onPageReadyEnhanced) {
                    AndroidBridge.onPageReadyEnhanced(JSON.stringify(initMetrics));
                } else {
                    AndroidBridge.onPageReady();
                }
                
                console.log('[BlocVibe] 📢 Enhanced page ready notification with Advanced Properties Panel sent to Android');
            } catch (error) {
                console.error('[BlocVibe] ❌ Failed to send enhanced page ready:', error);
            }
        });
    }
    
    // ==================== ADVANCED PROPERTIES PANEL FUNCTIONS ====================
    
    /**
     * إعداد مستمعات الأحداث للـ Properties Panel
     */
    function setupPropertiesPanelEventListeners() {
        try {
            // مستمع تغيير الخصائص
            propertyManager.onPropertyChanged((data) => {
                console.log('[Properties Panel] 🔄 Property changed:', data);
                
                // تطبيق التغيير على DOM
                const element = document.getElementById(data.elementId);
                if (element) {
                    applyPropertyChange(data.elementId, data.property, data.newValue);
                    
                    // إشعار Java layer
                    if (typeof AndroidBridge !== 'undefined') {
                        try {
                            if (AndroidBridge.onPropertyChanged) {
                                AndroidBridge.onPropertyChanged(
                                    data.elementId, 
                                    data.property, 
                                    JSON.stringify(data.newValue)
                                );
                            }
                        } catch (error) {
                            console.error('[Properties Panel] ❌ Failed to notify Java layer:', error);
                        }
                    }
                }
            });
            
            // مستمعات لوحة الخصائص
            propertiesPanelIntegration.onPanelOpened((data) => {
                console.log('[Properties Panel] 📖 Panel opened for element:', data.elementId);
                
                // إشعار Java layer
                if (typeof AndroidBridge !== 'undefined') {
                    try {
                        if (AndroidBridge.onPropertiesPanelRequested) {
                            AndroidBridge.onPropertiesPanelRequested(data.elementId);
                        }
                    } catch (error) {
                        console.error('[Properties Panel] ❌ Failed to notify Java layer:', error);
                    }
                }
            });
            
            propertiesPanelIntegration.onPanelClosed(() => {
                console.log('[Properties Panel] 📕 Panel closed');
                
                // إزالة تحديد العنصر
                clearSelections();
            });
            
            propertiesPanelIntegration.onPropertyChanged((data) => {
                console.log('[Properties Panel] ✏️ Property updated via panel:', data);
                
                // مزامنة فورية مع DOM
                realTimePropertySync.queueSync(
                    data.elementId, 
                    data.property, 
                    data.value, 
                    'properties_panel'
                );
                
                // التحقق من صحة البيانات
                const validationResult = propertyValidationEngine.validate(
                    data.elementId,
                    data.property,
                    data.value
                );
                
                if (!validationResult.isValid) {
                    console.warn('[Properties Panel] ⚠️ Property validation failed:', validationResult.errors);
                    
                    // إشعار Java layer بفشل التحقق
                    if (typeof AndroidBridge !== 'undefined') {
                        try {
                            if (AndroidBridge.onPropertyValidationFailed) {
                                AndroidBridge.onPropertyValidationFailed(
                                    data.elementId,
                                    JSON.stringify(validationResult.errors)
                                );
                            }
                        } catch (error) {
                            console.error('[Properties Panel] ❌ Failed to notify validation failure:', error);
                        }
                    }
                }
            });
            
            // مزامنة فورية
            realTimePropertySync.onPropertySynced((data) => {
                console.log('[Properties Panel] ⚡ Property synced:', data.elementId, data.properties);
                
                // إشعار Java layer بالانتهاء
                if (typeof AndroidBridge !== 'undefined') {
                    try {
                        if (AndroidBridge.onPropertyUpdateComplete) {
                            AndroidBridge.onPropertyUpdateComplete(
                                data.elementId,
                                true
                            );
                        }
                    } catch (error) {
                        console.error('[Properties Panel] ❌ Failed to notify update completion:', error);
                    }
                }
            });
            
            console.log('[Properties Panel] ✅ Event listeners setup completed');
        } catch (error) {
            console.error('[Properties Panel] ❌ Failed to setup event listeners:', error);
        }
    }
    
    /**
     * تسجيل أنواع العناصر الافتراضية
     */
    function registerDefaultElementTypes() {
        try {
            // نص
            elementTypeRegistry.registerType('text', {
                category: 'content',
                properties: {
                    content: { type: 'string', label: 'المحتوى' },
                    color: { type: 'color', label: 'اللون' },
                    fontSize: { type: 'string', label: 'حجم الخط' },
                    fontWeight: { type: 'select', label: 'وزن الخط', options: [
                        { value: 'normal', label: 'عادي' },
                        { value: 'bold', label: 'عريض' },
                        { value: 'lighter', label: 'خفيف' }
                    ]},
                    textAlign: { type: 'select', label: 'المحاذاة', options: [
                        { value: 'left', label: 'يسار' },
                        { value: 'center', label: 'وسط' },
                        { value: 'right', label: 'يمين' },
                        { value: 'justify', label: 'مبرر' }
                    ]}
                },
                validation: {
                    content: { required: false, maxLength: 1000 },
                    fontSize: { type: 'cssLength' }
                },
                ui: {
                    icon: 'text',
                    color: '#333333'
                }
            });
            
            // صورة
            elementTypeRegistry.registerType('image', {
                category: 'media',
                properties: {
                    src: { type: 'url', label: 'رابط الصورة' },
                    alt: { type: 'string', label: 'النص البديل' },
                    width: { type: 'string', label: 'العرض' },
                    height: { type: 'string', label: 'الارتفاع' },
                    objectFit: { type: 'select', label: 'طريقة العرض', options: [
                        { value: 'cover', label: 'تغطية' },
                        { value: 'contain', label: 'احتواء' },
                        { value: 'fill', label: 'تملأ' },
                        { value: 'scale-down', label: 'تصغير' },
                        { value: 'none', label: 'بدون' }
                    ]}
                },
                validation: {
                    src: { required: true, type: 'url' },
                    alt: { maxLength: 100 },
                    width: { type: 'cssLength' },
                    height: { type: 'cssLength' }
                },
                ui: {
                    icon: 'image',
                    color: '#007bff'
                }
            });
            
            // زر
            elementTypeRegistry.registerType('button', {
                category: 'interactive',
                properties: {
                    text: { type: 'string', label: 'نص الزر' },
                    backgroundColor: { type: 'color', label: 'لون الخلفية' },
                    color: { type: 'color', label: 'لون النص' },
                    border: { type: 'string', label: 'الحدود' },
                    borderRadius: { type: 'string', label: 'نصف قطر الحدود' },
                    padding: { type: 'string', label: 'الحشو' },
                    fontSize: { type: 'string', label: 'حجم الخط' },
                    disabled: { type: 'boolean', label: 'معطل' }
                },
                validation: {
                    text: { required: true, maxLength: 100 },
                    fontSize: { type: 'cssLength' },
                    padding: { type: 'cssLength' },
                    borderRadius: { type: 'cssLength' }
                },
                ui: {
                    icon: 'button',
                    color: '#28a745'
                }
            });
            
            // حاوية
            elementTypeRegistry.registerType('container', {
                category: 'layout',
                properties: {
                    display: { type: 'select', label: 'نوع العرض', options: [
                        { value: 'block', label: 'Block' },
                        { value: 'inline-block', label: 'Inline Block' },
                        { value: 'flex', label: 'Flex' },
                        { value: 'grid', label: 'Grid' }
                    ]},
                    backgroundColor: { type: 'color', label: 'لون الخلفية' },
                    padding: { type: 'string', label: 'الحشو' },
                    margin: { type: 'string', label: 'الهامش' },
                    border: { type: 'string', label: 'الحدود' },
                    borderRadius: { type: 'string', label: 'نصف قطر الحدود' }
                },
                validation: {
                    padding: { type: 'cssLength' },
                    margin: { type: 'cssLength' },
                    borderRadius: { type: 'cssLength' }
                },
                ui: {
                    icon: 'container',
                    color: '#6f42c1'
                }
            });
            
            console.log('[Properties Panel] ✅ Default element types registered');
        } catch (error) {
            console.error('[Properties Panel] ❌ Failed to register default element types:', error);
        }
    }
    
    /**
     * إعداد قواعد التحقق من صحة البيانات
     */
    function setupPropertyValidationRules() {
        try {
            // قواعد عامة للخصائص
            propertyValidationEngine.addValidationRule('style.color', {
                type: 'color',
                required: false,
                custom: (value) => {
                    if (value && !/^#([0-9A-F]{3}){1,2}$/i.test(value)) {
                        return { error: 'Invalid color format. Use hex format like #ffffff' };
                    }
                    return null;
                }
            });
            
            propertyValidationEngine.addValidationRule('style.fontSize', {
                type: 'cssLength',
                required: false,
                custom: (value) => {
                    if (value && !/^\d+(px|em|rem|%|vh|vw)$/.test(value)) {
                        return { error: 'Invalid font size format. Use units like px, em, rem' };
                    }
                    return null;
                }
            });
            
            propertyValidationEngine.addValidationRule('style.width', {
                type: 'cssLength',
                required: false,
                custom: (value) => {
                    if (value && !/^\d+(px|em|rem|%|vh|vw|auto)$/.test(value)) {
                        return { error: 'Invalid width format' };
                    }
                    return null;
                }
            });
            
            propertyValidationEngine.addValidationRule('style.height', {
                type: 'cssLength',
                required: false,
                custom: (value) => {
                    if (value && !/^\d+(px|em,rem|%|vh|vw|auto)$/.test(value)) {
                        return { error: 'Invalid height format' };
                    }
                    return null;
                }
            });
            
            propertyValidationEngine.addValidationRule('content', {
                type: 'string',
                required: false,
                maxLength: 2000,
                custom: (value) => {
                    if (value && value.length > 2000) {
                        return { warning: 'Content is very long, consider shortening it' };
                    }
                    return null;
                }
            });
            
            propertyValidationEngine.addValidationRule('src', {
                type: 'url',
                required: true,
                custom: (value) => {
                    if (!value) {
                        return { error: 'Image source URL is required' };
                    }
                    if (!/^https?:\/\/.+/.test(value)) {
                        return { error: 'Please provide a valid HTTP/HTTPS URL' };
                    }
                    return null;
                }
            });
            
            console.log('[Properties Panel] ✅ Property validation rules setup completed');
        } catch (error) {
            console.error('[Properties Panel] ❌ Failed to setup property validation rules:', error);
        }
    }
    
    /**
     * معالجة تغيير خصائص العنصر
     */
    function onPropertyChanged(elementId, property, value) {
        try {
            console.log('[Properties Panel] 📝 Property change requested:', { elementId, property, value });
            
            // التحقق من صحة البيانات
            const validationResult = validatePropertyChange(elementId, property, value);
            if (!validationResult.isValid) {
                console.warn('[Properties Panel] ⚠️ Property validation failed:', validationResult.errors);
                return { success: false, errors: validationResult.errors };
            }
            
            // تطبيق التغيير
            const applyResult = applyPropertyChange(elementId, property, value);
            
            if (applyResult.success) {
                // مزامنة مع DOM
                syncPropertyWithDOM(elementId, property, value);
                
                console.log('[Properties Panel] ✅ Property changed successfully');
                return { success: true };
            } else {
                console.error('[Properties Panel] ❌ Failed to apply property change:', applyResult.error);
                return { success: false, errors: [applyResult.error] };
            }
            
        } catch (error) {
            console.error('[Properties Panel] ❌ Error in property change:', error);
            return { success: false, errors: [error.message] };
        }
    }
    
    /**
     * التحقق من صحة تغيير الخاصية
     */
    function validatePropertyChange(elementId, property, value) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                return { isValid: false, errors: ['Element not found'] };
            }
            
            // تحديد نوع العنصر
            const elementType = elementTypeRegistry.detectElementType(element);
            
            // التحقق من خلال Property Validation Engine
            const validationResult = propertyValidationEngine.validate(
                elementId, 
                property, 
                value,
                { elementType }
            );
            
            return validationResult;
            
        } catch (error) {
            console.error('[Properties Panel] ❌ Error in property validation:', error);
            return { isValid: false, errors: ['Validation error: ' + error.message] };
        }
    }
    
    /**
     * تطبيق تغيير الخاصية على العنصر
     */
    function applyPropertyChange(elementId, property, value) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                return { success: false, error: 'Element not found' };
            }
            
            // تطبيق الخاصية حسب نوعها
            if (property.startsWith('style.')) {
                const styleProperty = property.substring(6);
                element.style[styleProperty] = value;
            } else if (property.startsWith('attribute.')) {
                const attributeName = property.substring(10);
                if (value === null || value === undefined || value === '') {
                    element.removeAttribute(attributeName);
                } else {
                    element.setAttribute(attributeName, value);
                }
            } else {
                // خصائص مباشرة
                element[property] = value;
            }
            
            // تحديث cache الخصائص
            const elementType = elementTypeRegistry.detectElementType(element);
            propertyManager.updateProperty(elementId, property, value, elementType);
            
            return { success: true };
            
        } catch (error) {
            console.error('[Properties Panel] ❌ Error applying property change:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * مزامنة الخاصية مع DOM
     */
    function syncPropertyWithDOM(elementId, property, value) {
        try {
            // إضافة للمزامنة الفورية
            realTimePropertySync.queueSync(elementId, property, value, 'property_change');
            
        } catch (error) {
            console.error('[Properties Panel] ❌ Error syncing property with DOM:', error);
        }
    }
    
    /**
     * عرض محرر الخصائص للعنصر
     */
    function showPropertyEditor(elementType) {
        try {
            if (!propertiesPanelIntegration) {
                console.warn('[Properties Panel] Panel integration not available');
                return false;
            }
            
            const typeConfig = elementTypeRegistry.getType(elementType);
            if (!typeConfig) {
                console.warn('[Properties Panel] Element type not registered:', elementType);
                return false;
            }
            
            // إظهار محرر الخصائص
            console.log('[Properties Panel] 🎨 Showing property editor for type:', elementType);
            return true;
            
        } catch (error) {
            console.error('[Properties Panel] ❌ Error showing property editor:', error);
            return false;
        }
    }
    
    /**
     * تحديث عناصر تحكم الخصائص
     */
    function updatePropertyControls(elementId, properties) {
        try {
            const element = document.getElementById(elementId);
            if (!element) {
                console.warn('[Properties Panel] Element not found for controls update:', elementId);
                return false;
            }
            
            // تحديث لوحة الخصائص
            if (propertiesPanelIntegration.getCurrentElement()?.id === elementId) {
                propertiesPanelIntegration.updatePanelContent(element);
                console.log('[Properties Panel] 🔄 Property controls updated for:', elementId);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('[Properties Panel] ❌ Error updating property controls:', error);
            return false;
        }
    }
    
    /**
     * فتح/إغلاق لوحة الخصائص
     */
    function togglePropertiesPanel(elementId) {
        try {
            if (propertiesPanelIntegration.isPanelVisible()) {
                // إغلاق اللوحة
                propertiesPanelIntegration.hidePanel();
                console.log('[Properties Panel] 📕 Panel closed');
                return false;
            } else {
                // فتح اللوحة
                propertiesPanelIntegration.showPanel(elementId);
                console.log('[Properties Panel] 📖 Panel opened for element:', elementId);
                return true;
            }
        } catch (error) {
            console.error('[Properties Panel] ❌ Error toggling properties panel:', error);
            return false;
        }
    }

    // ==================== FLEXBOX SYSTEM INTEGRATION ====================

    /**
     * تحليل فرص Flexbox في الحاوية
     */
    function analyzeFlexboxOpportunities(containerId, options = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error('Container not found: ' + containerId);
            }

            // استخدام FlexboxManagerAdvanced للتحليل
            if (window.FlexboxManagerAdvanced) {
                const analysis = window.FlexboxManagerAdvanced.analyzeFlexboxOpportunities(container, options);
                
                // إشعار Java layer
                notifyJavaFlexboxAnalysisComplete(containerId, analysis);
                
                return analysis;
            }

            return { success: false, error: 'FlexboxManagerAdvanced not available' };

        } catch (error) {
            console.error('[Flexbox System] ❌ Error analyzing flexbox opportunities:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تطبيق Flexbox على الحاوية
     */
    function applyFlexboxToContainer(containerId, properties = {}) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error('Container not found: ' + containerId);
            }

            // استخدام FlexboxManagerAdvanced للتطبيق
            if (window.FlexboxManagerAdvanced) {
                const result = window.FlexboxManagerAdvanced.convertToFlexbox(container, properties);
                
                // إشعار Java layer
                notifyJavaFlexboxApplied(containerId, result);
                
                return result;
            }

            return { success: false, error: 'FlexboxManagerAdvanced not available' };

        } catch (error) {
            console.error('[Flexbox System] ❌ Error applying flexbox:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تفعيل معاينة Flexbox
     */
    function enableFlexboxPreview(containerId = null) {
        try {
            if (window.FlexboxPreviewSystem) {
                if (containerId) {
                    const container = document.getElementById(containerId);
                    window.FlexboxPreviewSystem.showContainerPreview(container);
                } else {
                    window.FlexboxPreviewSystem.enablePreviewMode();
                }
                
                // إشعار Java layer
                notifyJavaFlexboxPreviewToggled(true, containerId);
                
                return true;
            }

            return false;

        } catch (error) {
            console.error('[Flexbox System] ❌ Error enabling flexbox preview:', error);
            return false;
        }
    }

    /**
     * إلغاء تفعيل معاينة Flexbox
     */
    function disableFlexboxPreview() {
        try {
            if (window.FlexboxPreviewSystem) {
                window.FlexboxPreviewSystem.disablePreviewMode();
                
                // إشعار Java layer
                notifyJavaFlexboxPreviewToggled(false, null);
                
                return true;
            }

            return false;

        } catch (error) {
            console.error('[Flexbox System] ❌ Error disabling flexbox preview:', error);
            return false;
        }
    }

    /**
     * تحديث معاينة Flexbox
     */
    function updateFlexboxPreview(containerId) {
        try {
            if (window.FlexboxPreviewSystem && containerId) {
                const container = document.getElementById(containerId);
                window.FlexboxPreviewSystem.updatePreview(container);
                return true;
            }

            return false;

        } catch (error) {
            console.error('[Flexbox System] ❌ Error updating flexbox preview:', error);
            return false;
        }
    }

    /**
     * استرجاع Flexbox إلى الحالة الأصلية
     */
    function revertFlexbox(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error('Container not found: ' + containerId);
            }

            if (window.FlexboxManagerAdvanced) {
                const result = window.FlexboxManagerAdvanced.revertFlexbox(container);
                
                // إشعار Java layer
                notifyJavaFlexboxReverted(containerId, result);
                
                return result;
            }

            return { success: false, error: 'FlexboxManagerAdvanced not available' };

        } catch (error) {
            console.error('[Flexbox System] ❌ Error reverting flexbox:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تحسين تخطيط Flexbox الموجود
     */
    function optimizeFlexboxLayout(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error('Container not found: ' + containerId);
            }

            if (window.FlexboxManagerAdvanced) {
                const result = window.FlexboxManagerAdvanced.optimizeFlexboxLayout(container);
                
                // إشعار Java layer
                notifyJavaFlexboxOptimized(containerId, result);
                
                return result;
            }

            return { success: false, error: 'FlexboxManagerAdvanced not available' };

        } catch (error) {
            console.error('[Flexbox System] ❌ Error optimizing flexbox layout:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * تصدير إعدادات Flexbox
     */
    function exportFlexboxConfiguration(containerId) {
        try {
            const container = document.getElementById(containerId);
            if (!container) {
                throw new Error('Container not found: ' + containerId);
            }

            if (window.FlexboxManagerAdvanced) {
                const config = window.FlexboxManagerAdvanced.exportFlexboxConfiguration(container);
                
                // إشعار Java layer
                notifyJavaFlexboxConfigurationExported(containerId, config);
                
                return config;
            }

            return { success: false, error: 'FlexboxManagerAdvanced not available' };

        } catch (error) {
            console.error('[Flexbox System] ❌ Error exporting flexbox configuration:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على تقرير أداء Flexbox
     */
    function getFlexboxPerformanceReport() {
        try {
            if (window.FlexboxManagerAdvanced && window.FlexboxPreviewSystem) {
                const flexboxReport = window.FlexboxManagerAdvanced.getPerformanceReport();
                const previewReport = window.FlexboxPreviewSystem.getPerformanceReport();
                
                return {
                    flexbox: flexboxReport,
                    preview: previewReport,
                    timestamp: new Date().toISOString()
                };
            }

            return { success: false, error: 'Flexbox systems not available' };

        } catch (error) {
            console.error('[Flexbox System] ❌ Error getting flexbox performance report:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * دوال إشعار Java layer بـ Flexbox Events
     */
    function notifyJavaFlexboxAnalysisComplete(containerId, analysis) {
        try {
            if (window.AndroidBridge && typeof window.AndroidBridge.onFlexboxAnalysisComplete === 'function') {
                window.AndroidBridge.onFlexboxAnalysisComplete(
                    containerId,
                    JSON.stringify(analysis),
                    analysis.score,
                    analysis.recommendations?.join(';') || ''
                );
            }
        } catch (error) {
            console.error('[Flexbox System] ❌ Error notifying flexbox analysis complete:', error);
        }
    }

    function notifyJavaFlexboxApplied(containerId, result) {
        try {
            if (window.AndroidBridge && typeof window.AndroidBridge.onFlexboxApplied === 'function') {
                window.AndroidBridge.onFlexboxApplied(
                    containerId,
                    JSON.stringify(result.properties),
                    result.conversionTime,
                    result.success
                );
            }
        } catch (error) {
            console.error('[Flexbox System] ❌ Error notifying flexbox applied:', error);
        }
    }

    function notifyJavaFlexboxPreviewToggled(enabled, containerId) {
        try {
            if (window.AndroidBridge && typeof window.AndroidBridge.onFlexboxPreviewToggled === 'function') {
                window.AndroidBridge.onFlexboxPreviewToggled(enabled, containerId || '');
            }
        } catch (error) {
            console.error('[Flexbox System] ❌ Error notifying flexbox preview toggled:', error);
        }
    }

    function notifyJavaFlexboxReverted(containerId, result) {
        try {
            if (window.AndroidBridge && typeof window.AndroidBridge.onFlexboxReverted === 'function') {
                window.AndroidBridge.onFlexboxReverted(containerId, result.success);
            }
        } catch (error) {
            console.error('[Flexbox System] ❌ Error notifying flexbox reverted:', error);
        }
    }

    function notifyJavaFlexboxOptimized(containerId, result) {
        try {
            if (window.AndroidBridge && typeof window.AndroidBridge.onFlexboxOptimized === 'function') {
                window.AndroidBridge.onFlexboxOptimized(
                    containerId,
                    result.optimizationsApplied,
                    JSON.stringify(result.improvements)
                );
            }
        } catch (error) {
            console.error('[Flexbox System] ❌ Error notifying flexbox optimized:', error);
        }
    }

    function notifyJavaFlexboxConfigurationExported(containerId, config) {
        try {
            if (window.AndroidBridge && typeof window.AndroidBridge.onFlexboxConfigurationExported === 'function') {
                window.AndroidBridge.onFlexboxConfigurationExported(
                    containerId,
                    JSON.stringify(config)
                );
            }
        } catch (error) {
            console.error('[Flexbox System] ❌ Error notifying flexbox configuration exported:', error);
        }
    }
    
    // ==================== PUBLIC API UPDATES ====================
    
    // تحديث BlocVibeCanvas API لتشمل نظام Flexbox
    window.BlocVibeCanvas = window.BlocVibeCanvas || {};
    
    // Flexbox System API
    Object.assign(window.BlocVibeCanvas, {
        // تحليل فرص Flexbox
        analyzeFlexboxOpportunities: analyzeFlexboxOpportunities,
        
        // تطبيق Flexbox
        applyFlexboxToContainer: applyFlexboxToContainer,
        
        // معاينة Flexbox
        enableFlexboxPreview: enableFlexboxPreview,
        disableFlexboxPreview: disableFlexboxPreview,
        updateFlexboxPreview: updateFlexboxPreview,
        
        // إدارة Flexbox
        revertFlexbox: revertFlexbox,
        optimizeFlexboxLayout: optimizeFlexboxLayout,
        
        // تصدير واستيراد
        exportFlexboxConfiguration: exportFlexboxConfiguration,
        
        // تقارير الأداء
        getFlexboxPerformanceReport: getFlexboxPerformanceReport,
        
        // المانجرز المباشرة
        get flexboxManager() {
            return window.FlexboxManagerAdvanced || null;
        },
        
        get flexboxPreview() {
            return window.FlexboxPreviewSystem || null;
        },
        
        get bottomSheetDrag() {
            return window.BottomSheetDragSystem || null;
        }
    });

    // ==================== BOTTOM SHEET DRAG INTEGRATION ====================

    /**
     * دمج BottomSheetDragSystem مع canvas system
     */
    function integrateBottomSheetDragSystem() {
        try {
            // التأكد من تحميل BottomSheetDragSystem
            if (!window.BottomSheetDragSystem) {
                console.warn('[Canvas Integration] BottomSheetDragSystem not found');
                return false;
            }
            
            const dragSystem = window.BottomSheetDragSystem;
            
            // إضافة مستمعي الأحداث
            document.addEventListener('bottomSheetDragStart', (event) => {
                const { session } = event.detail;
                console.log('[Canvas Integration] Drag started:', session.elementType);
                
                // إشعار Android layer
                if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDragStart === 'function') {
                    window.AndroidBridge.onBottomSheetDragStart(
                        session.elementType,
                        session.startPoint.x,
                        session.startPoint.y
                    );
                }
            });
            
            document.addEventListener('bottomSheetDragMove', (event) => {
                const { session, point } = event.detail;
                
                // إشعار Android layer
                if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDragMove === 'function') {
                    window.AndroidBridge.onBottomSheetDragMove(
                        session.elementType,
                        point.x,
                        point.y
                    );
                }
            });
            
            document.addEventListener('bottomSheetDragEnd', (event) => {
                const { session, dropZone, success, error } = event.detail;
                console.log('[Canvas Integration] Drag ended:', session.elementType, success);
                
                // إشعار Android layer
                if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDragEnd === 'function') {
                    window.AndroidBridge.onBottomSheetDragEnd(
                        session.elementType,
                        success,
                        error || '',
                        dropZone ? dropZone.element.id : 'canvas'
                    );
                }
            });
            
            // دالة التعامل مع الإسقاط من Android
            window.handleBottomSheetDrop = function(elementType, containerId, x, y) {
                console.log('[Canvas Integration] Handling drop from Android:', elementType, containerId, x, y);
                return dragSystem.handleBottomSheetDrop(elementType, containerId, x, y);
            };
            
            console.log('[Canvas Integration] BottomSheetDragSystem integrated successfully');
            return true;
            
        } catch (error) {
            console.error('[Canvas Integration] Error integrating BottomSheetDragSystem:', error);
            return false;
        }
    }

    /**
     * بدء جلسة سحب محسنة
     */
    function startEnhancedDragSession(elementType, startPoint) {
        try {
            if (window.BottomSheetDragSystem) {
                const session = window.BottomSheetDragSystem.startDragSession(
                    elementType, 
                    startPoint, 
                    startPoint
                );
                
                console.log('[Canvas Integration] Enhanced drag session started:', session);
                return session;
            }
            
            console.warn('[Canvas Integration] BottomSheetDragSystem not available');
            return null;
            
        } catch (error) {
            console.error('[Canvas Integration] Error starting enhanced drag session:', error);
            return null;
        }
    }

    /**
     * تحديث جلسة السحب
     */
    function updateDragSessionPosition(point) {
        try {
            if (window.BottomSheetDragSystem && window.BottomSheetDragSystem.isDragging()) {
                window.BottomSheetDragSystem.updateDragSession(point);
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('[Canvas Integration] Error updating drag session position:', error);
            return false;
        }
    }

    /**
     * إنهاء جلسة السحب
     */
    function endDragSession(point) {
        try {
            if (window.BottomSheetDragSystem && window.BottomSheetDragSystem.isDragging()) {
                const result = window.BottomSheetDragSystem.endDragSession(point);
                console.log('[Canvas Integration] Drag session ended:', result);
                return result;
            }
            
            console.warn('[Canvas Integration] No active drag session to end');
            return { success: false, error: 'No active drag session' };
            
        } catch (error) {
            console.error('[Canvas Integration] Error ending drag session:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * الحصول على حالة السحب النشطة
     */
    function getActiveDragSession() {
        try {
            if (window.BottomSheetDragSystem) {
                return window.BottomSheetDragSystem.getActiveDragSession();
            }
            return null;
            
        } catch (error) {
            console.error('[Canvas Integration] Error getting active drag session:', error);
            return null;
        }
    }

    /**
     * الحصول على إحصائيات أداء السحب
     */
    function getDragPerformanceMetrics() {
        try {
            if (window.BottomSheetDragSystem) {
                return window.BottomSheetDragSystem.getPerformanceMetrics();
            }
            
            return {
                totalDrags: 0,
                averageDragTime: 0,
                successRate: 0,
                performanceMode: false
            };
            
        } catch (error) {
            console.error('[Canvas Integration] Error getting drag performance metrics:', error);
            return null;
        }
    }

    /**
     * إعداد إعدادات السحب المحسن
     */
    function setupEnhancedDragConfig(config) {
        try {
            if (window.BottomSheetDragSystem && config) {
                window.BottomSheetDragSystem.setConfig(config);
                console.log('[Canvas Integration] Enhanced drag config updated');
                return true;
            }
            return false;
            
        } catch (error) {
            console.error('[Canvas Integration] Error setting up enhanced drag config:', error);
            return false;
        }
    }
    
    // ==================== INITIALIZATION ====================
    
    // تشغيل تكامل Bottom Sheet Drag عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            integrateBottomSheetDragSystem();
        }, 500); // تأخير صغير لضمان تحميل جميع الأنظمة
    });
    
    // ==================== CLEANUP ON UNLOAD ====================
    window.addEventListener('beforeunload', cleanup);
    
})();