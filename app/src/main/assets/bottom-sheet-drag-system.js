/**
 * BlocVibe Ultra-Advanced Bottom Sheet Drag System v5.0
 * نظام سحب متقدم من لوحة المكونات مع معاينة ذكية وتحسين الأداء
 * 
 * المميزات:
 * - Smart Preview أثناء السحب
 * - Visual Drag Indicators
 * - Auto-positioning ذكي
 * - Performance optimizations
 * - Accessibility support
 * 
 * @author BlocVibe Team
 * @version 5.0.0
 */

class BottomSheetDragSystem {
    constructor() {
        this.activeDragSession = null;
        this.dragHistory = [];
        this.previewElements = new Map();
        this.dropZoneAnalyzers = new Map();
        this.performanceMetrics = {
            totalDrags: 0,
            averageDragTime: 0,
            successRate: 0,
            performanceMode: false
        };
        
        this.config = {
            previewDelay: 100,
            autoPositioningEnabled: true,
            snapToGridEnabled: false,
            gridSize: 10,
            dragThreshold: 20,
            animationDuration: 300,
            hapticFeedbackEnabled: true,
            visualFeedbackEnabled: true,
            smartPreviewEnabled: true
        };
        
        this.observers = new Map();
        this.setupEventListeners();
        this.initializeDropZoneAnalyzers();
        this.startPerformanceMonitoring();
    }

    /**
     * إعداد مستمعي الأحداث
     */
    setupEventListeners() {
        // مراقبة أحداث اللمس
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // مراقبة أحداث الماوس
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // مراقبة تغييرات DOM
        this.setupDOMObserver();
    }

    /**
     * إعداد مراقب DOM
     */
    setupDOMObserver() {
        this.observer = new MutationObserver((mutations) => {
            let shouldUpdate = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    shouldUpdate = true;
                }
            });
            
            if (shouldUpdate) {
                this.updateDropZones();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'id']
        });
    }

    /**
     * تهيئة محللات Drop Zones
     */
    initializeDropZoneAnalyzers() {
        this.dropZoneAnalyzers.set('container', this.createContainerAnalyzer());
        this.dropZoneAnalyzers.set('flex-container', this.createFlexContainerAnalyzer());
        this.dropZoneAnalyzers.set('canvas', this.createCanvasAnalyzer());
    }

    /**
     * إنشاء محللات الحاويات
     */
    createContainerAnalyzer() {
        return {
            analyze(element, dragPoint) {
                const rect = element.getBoundingClientRect();
                const score = this.calculateContainerScore(rect, dragPoint);
                
                return {
                    type: 'container',
                    element: element,
                    score: score,
                    optimalPosition: this.calculateOptimalPosition(rect, dragPoint),
                    suggestedProperties: this.suggestContainerProperties(element)
                };
            },
            
            calculateContainerScore(rect, dragPoint) {
                if (!rect || !dragPoint) return 0;
                
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const distance = Math.sqrt(Math.pow(dragPoint.x - centerX, 2) + Math.pow(dragPoint.y - centerY, 2));
                const maxDistance = Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2)) / 2;
                
                return Math.max(0, 1 - (distance / maxDistance));
            },
            
            calculateOptimalPosition(rect, dragPoint) {
                // تحديد الموقع الأمثل بناءً على نوع العنصر
                const padding = 20;
                
                let x = Math.max(rect.left + padding, Math.min(dragPoint.x, rect.right - padding));
                let y = Math.max(rect.top + padding, Math.min(dragPoint.y, rect.bottom - padding));
                
                return { x, y };
            },
            
            suggestContainerProperties(element) {
                const suggestions = [];
                
                // تحليل خصائص الحاوية الحالية
                const computedStyle = window.getComputedStyle(element);
                
                if (computedStyle.display === 'block') {
                    suggestions.push({ property: 'display', value: 'flex', reason: 'Better layout control' });
                }
                
                if (computedStyle.flexDirection === 'row' && this.hasVerticalContent(element)) {
                    suggestions.push({ property: 'flex-direction', value: 'column', reason: 'Content alignment' });
                }
                
                return suggestions;
            },
            
            hasVerticalContent(element) {
                const children = Array.from(element.children);
                return children.some(child => {
                    const style = window.getComputedStyle(child);
                    return style.display === 'block' || style.float !== 'none';
                });
            }
        };
    }

    /**
     * إنشاء محللات Flex Container
     */
    createFlexContainerAnalyzer() {
        return {
            analyze(element, dragPoint) {
                const rect = element.getBoundingClientRect();
                const score = this.calculateFlexContainerScore(rect, dragPoint, element);
                
                return {
                    type: 'flex-container',
                    element: element,
                    score: score,
                    optimalPosition: this.calculateFlexOptimalPosition(rect, dragPoint),
                    suggestedProperties: this.suggestFlexProperties(element)
                };
            },
            
            calculateFlexContainerScore(rect, dragPoint, element) {
                const baseScore = this.createContainerAnalyzer().calculateContainerScore(rect, dragPoint);
                const style = window.getComputedStyle(element);
                
                // تعديل النتيجة بناءً على خصائص Flexbox
                if (style.display === 'flex') {
                    return baseScore * 1.2; // bonus for existing flex
                }
                
                if (this.hasMultipleChildren(element)) {
                    return baseScore * 1.1; // bonus for multiple children
                }
                
                return baseScore;
            },
            
            calculateFlexOptimalPosition(rect, dragPoint) {
                const style = window.getComputedStyle(rect.element || {});
                const analyzer = this;
                
                // حساب الموقع بناءً على direction
                if (style.flexDirection === 'row') {
                    return this.calculateRowPosition(rect, dragPoint);
                } else {
                    return this.calculateColumnPosition(rect, dragPoint);
                }
            },
            
            calculateRowPosition(rect, dragPoint) {
                const gap = parseInt(window.getComputedStyle(rect.element).gap) || 0;
                const children = Array.from(rect.element.children);
                
                // العثور على أفضل position في الصف
                let bestIndex = Math.floor((dragPoint.x - rect.left) / (60 + gap));
                bestIndex = Math.max(0, Math.min(bestIndex, children.length));
                
                const x = rect.left + bestIndex * (60 + gap) + gap / 2;
                const y = rect.top + (rect.height - 40) / 2;
                
                return { x, y };
            },
            
            calculateColumnPosition(rect, dragPoint) {
                const gap = parseInt(window.getComputedStyle(rect.element).gap) || 0;
                const children = Array.from(rect.element.children);
                
                let bestIndex = Math.floor((dragPoint.y - rect.top) / (60 + gap));
                bestIndex = Math.max(0, Math.min(bestIndex, children.length));
                
                const x = rect.left + (rect.width - 120) / 2;
                const y = rect.top + bestIndex * (60 + gap) + gap / 2;
                
                return { x, y };
            },
            
            suggestFlexProperties(element) {
                const suggestions = [];
                const style = window.getComputedStyle(element);
                
                if (style.display !== 'flex') {
                    suggestions.push({ property: 'display', value: 'flex', reason: 'Enable flexbox layout' });
                }
                
                if (!style.flexDirection) {
                    const children = Array.from(element.children);
                    if (children.length > 0) {
                        const hasTextContent = children.some(child => child.textContent.trim());
                        suggestions.push({ 
                            property: 'flex-direction', 
                            value: hasTextContent ? 'row' : 'column', 
                            reason: 'Optimal content direction' 
                        });
                    }
                }
                
                return suggestions;
            },
            
            hasMultipleChildren(element) {
                return Array.from(element.children).length > 1;
            }
        };
    }

    /**
     * إنشاء محللات Canvas
     */
    createCanvasAnalyzer() {
        return {
            analyze(element, dragPoint) {
                const rect = element.getBoundingClientRect();
                const score = 0.8; // Canvas has default high score
                
                return {
                    type: 'canvas',
                    element: element,
                    score: score,
                    optimalPosition: { x: dragPoint.x, y: dragPoint.y },
                    suggestedProperties: []
                };
            }
        };
    }

    /**
     * بدء جلسة سحب جديدة
     */
    startDragSession(elementType, startPoint, currentPoint) {
        try {
            const session = {
                id: this.generateSessionId(),
                elementType: elementType,
                startTime: Date.now(),
                startPoint: startPoint,
                currentPoint: currentPoint,
                state: 'dragging',
                previewElement: null,
                dropZoneSuggestions: [],
                autoPositioningApplied: false
            };
            
            this.activeDragSession = session;
            this.performanceMetrics.totalDrags++;
            
            // إنشاء preview element
            if (this.config.smartPreviewEnabled) {
                session.previewElement = this.createSmartPreview(elementType, currentPoint);
            }
            
            // تحليل drop zones
            this.analyzeDropZones(currentPoint);
            
            // إشعار بدء السحب
            this.notifyDragStart(session);
            
            console.log(`[BottomSheetDrag] Started drag session for: ${elementType}`);
            return session;
            
        } catch (error) {
            console.error('[BottomSheetDrag] Error starting drag session:', error);
            return null;
        }
    }

    /**
     * إنشاء معاينة ذكية
     */
    createSmartPreview(elementType, position) {
        const preview = document.createElement('div');
        preview.className = `drag-preview drag-preview-${elementType}`;
        preview.style.cssText = `
            position: fixed;
            left: ${position.x - 60}px;
            top: ${position.y - 30}px;
            width: 120px;
            height: 60px;
            background: rgba(33, 150, 243, 0.8);
            border: 2px solid #2196F3;
            border-radius: 8px;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transform: scale(0.8);
            transition: all 0.2s ease-out;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        
        preview.textContent = this.getElementDisplayName(elementType);
        
        // إضافة الأنيميشن
        document.body.appendChild(preview);
        setTimeout(() => {
            preview.style.opacity = '1';
            preview.style.transform = 'scale(1)';
        }, 50);
        
        return preview;
    }

    /**
     * تحليل drop zones
     */
    analyzeDropZones(dragPoint) {
        const zones = [];
        const candidates = this.findDropZoneCandidates();
        
        candidates.forEach(candidate => {
            const analyzer = this.getAnalyzerForElement(candidate);
            if (analyzer) {
                const analysis = analyzer.analyze(candidate, dragPoint);
                if (analysis.score > 0.1) {
                    zones.push(analysis);
                }
            }
        });
        
        // ترتيب حسب النتيجة
        zones.sort((a, b) => b.score - a.score);
        
        if (this.activeDragSession) {
            this.activeDragSession.dropZoneSuggestions = zones;
        }
        
        console.log(`[BottomSheetDrag] Found ${zones.length} drop zone candidates`);
        
        // إشعار التحليل
        this.notifyDropZoneAnalysis(zones);
        
        return zones;
    }

    /**
     * العثور على مرشحي drop zones
     */
    findDropZoneCandidates() {
        const candidates = [];
        
        // إضافة Canvas كمرشح أساسي
        const canvas = document.querySelector('#canvas, .canvas, [data-role="canvas"]');
        if (canvas) {
            candidates.push(canvas);
        }
        
        // البحث عن الحاويات
        const containers = document.querySelectorAll('div, section, article, main, aside');
        containers.forEach(container => {
            if (this.isValidDropZone(container)) {
                candidates.push(container);
            }
        });
        
        return candidates;
    }

    /**
     * التحقق من صلاحية drop zone
     */
    isValidDropZone(element) {
        const style = window.getComputedStyle(element);
        
        // تجاهل العناصر المخفية
        if (style.display === 'none' || style.visibility === 'hidden') {
            return false;
        }
        
        // تجاهل العناصر الصغيرة جداً
        const rect = element.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) {
            return false;
        }
        
        // تجاهل العناصر غير التفاعلية
        if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
            return false;
        }
        
        return true;
    }

    /**
     * الحصول على المحلل المناسب للعنصر
     */
    getAnalyzerForElement(element) {
        const style = window.getComputedStyle(element);
        
        if (style.display === 'flex' || element.classList.contains('flex-container')) {
            return this.dropZoneAnalyzers.get('flex-container');
        }
        
        if (element.id === 'canvas' || element.classList.contains('canvas')) {
            return this.dropZoneAnalyzers.get('canvas');
        }
        
        return this.dropZoneAnalyzers.get('container');
    }

    /**
     * تحديث جلسة السحب
     */
    updateDragSession(currentPoint) {
        if (!this.activeDragSession || this.activeDragSession.state !== 'dragging') {
            return;
        }
        
        this.activeDragSession.currentPoint = currentPoint;
        
        // تحديث موضع preview
        if (this.activeDragSession.previewElement) {
            this.updatePreviewPosition(currentPoint);
        }
        
        // تحليل drop zones جديدة
        const newAnalysis = this.analyzeDropZones(currentPoint);
        this.updateDropZoneFeedback(newAnalysis);
        
        // إشعار التحديث
        this.notifyDragMove(this.activeDragSession, currentPoint);
    }

    /**
     * تحديث موضع المعاينة
     */
    updatePreviewPosition(position) {
        const preview = this.activeDragSession.previewElement;
        if (preview) {
            preview.style.left = `${position.x - 60}px`;
            preview.style.top = `${position.y - 30}px`;
        }
    }

    /**
     * تحديث تغذية راجعة drop zones
     */
    updateDropZoneFeedback(analysis) {
        const previousBest = this.activeDragSession.dropZoneSuggestions[0];
        const newBest = analysis[0];
        
        // إزالة feedback السابق
        this.clearDropZoneFeedback();
        
        // إضافة feedback جديد
        if (newBest) {
            this.showDropZoneFeedback(newBest);
            
            // تحديث نوع السحب إذا تغير الأفضل
            if (!previousBest || previousBest.element !== newBest.element) {
                this.activeDragSession.state = 'hovering';
                this.showHoverFeedback(newBest);
            }
        } else {
            this.activeDragSession.state = 'dragging';
        }
    }

    /**
     * عرض تغذية راجعة drop zone
     */
    showDropZoneFeedback(analysis) {
        const element = analysis.element;
        const originalBorder = element.style.border;
        const originalBoxShadow = element.style.boxShadow;
        
        // تطبيق highlight
        element.style.border = '3px dashed #4CAF50';
        element.style.boxShadow = '0 0 20px rgba(76, 175, 80, 0.5)';
        
        // حفظ للاسترجاع
        element.dataset.originalBorder = originalBorder;
        element.dataset.originalBoxShadow = originalBoxShadow;
    }

    /**
     * عرض feedback للـ hover
     */
    showHoverFeedback(analysis) {
        const element = analysis.element;
        
        // إضافة مؤشر للـ position الأمثل
        if (analysis.optimalPosition) {
            this.showPositionIndicator(analysis.optimalPosition, analysis.element);
        }
        
        // تطبيق auto-positioning إذا كان مفعل
        if (this.config.autoPositioningEnabled && analysis.score > 0.7) {
            this.applyAutoPositioning(analysis);
        }
    }

    /**
     * إظهار مؤشر الموقع
     */
    showPositionIndicator(position, container) {
        const indicator = document.createElement('div');
        indicator.className = 'position-indicator';
        indicator.style.cssText = `
            position: fixed;
            left: ${position.x - 5}px;
            top: ${position.y - 5}px;
            width: 10px;
            height: 10px;
            background: #FF9800;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 10001;
            pointer-events: none;
            animation: pulse 1s infinite;
        `;
        
        document.body.appendChild(indicator);
        
        // إزالة تلقائية
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 3000);
        
        // إضافة CSS للأنيميشن
        this.addAnimationStyles();
    }

    /**
     * تطبيق auto-positioning
     */
    applyAutoPositioning(analysis) {
        if (!this.activeDragSession.autoPositioningApplied) {
            this.activeDragSession.autoPositioningApplied = true;
            
            console.log('[BottomSheetDrag] Applying auto-positioning');
            
            // إشعار Java layer
            if (window.AndroidBridge && typeof window.AndroidBridge.onAutoPositioningApplied === 'function') {
                window.AndroidBridge.onAutoPositioningApplied(
                    this.activeDragSession.elementType,
                    analysis.element.id || 'unknown',
                    JSON.stringify(analysis.optimalPosition),
                    JSON.stringify(analysis.suggestedProperties)
                );
            }
        }
    }

    /**
     * مسح drop zone feedback
     */
    clearDropZoneFeedback() {
        const elements = document.querySelectorAll('[data-original-border]');
        elements.forEach(element => {
            element.style.border = element.dataset.originalBorder || '';
            element.style.boxShadow = element.dataset.originalBoxShadow || '';
            delete element.dataset.originalBorder;
            delete element.dataset.originalBoxShadow;
        });
        
        // إزالة المؤشرات
        const indicators = document.querySelectorAll('.position-indicator, .drop-zone-highlight');
        indicators.forEach(indicator => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        });
    }

    /**
     * إنهاء جلسة السحب
     */
    endDragSession(dropPoint) {
        if (!this.activeDragSession) {
            return { success: false, error: 'No active drag session' };
        }
        
        const session = this.activeDragSession;
        session.endTime = Date.now();
        session.dropPoint = dropPoint;
        session.state = 'dropped';
        
        let success = false;
        let error = null;
        let dropZone = null;
        
        try {
            // العثور على أفضل drop zone
            const bestZone = session.dropZoneSuggestions[0];
            if (bestZone && bestZone.score > 0.3) {
                dropZone = bestZone;
                success = this.performDrop(session, bestZone);
            } else {
                error = 'No valid drop zone found';
                success = false;
            }
        } catch (err) {
            error = `Drop failed: ${err.message}`;
            success = false;
            console.error('[BottomSheetDrag] Error during drop:', err);
        }
        
        // تنظيف المعاينة
        this.cleanupDragSession();
        
        // إشعار الانتهاء
        this.notifyDragEnd(session, dropZone, success, error);
        
        // حفظ في التاريخ
        this.dragHistory.push({
            sessionId: session.id,
            elementType: session.elementType,
            duration: session.endTime - session.startTime,
            success: success,
            dropZone: dropZone ? dropZone.element.tagName : null,
            error: error
        });
        
        console.log(`[BottomSheetDrag] Drop ${success ? 'SUCCESS' : 'FAILED'}: ${session.elementType}`);
        
        return { success, error, dropZone, session };
    }

    /**
     * تنفيذ الإسقاط
     */
    performDrop(session, dropZone) {
        try {
            // إنشاء العنصر الجديد
            const newElement = this.createElementFromType(session.elementType);
            
            // إضافة إلى drop zone
            if (dropZone.element.appendChild) {
                dropZone.element.appendChild(newElement);
            }
            
            // تطبيق الخصائص المقترحة
            if (dropZone.suggestedProperties && dropZone.suggestedProperties.length > 0) {
                this.applySuggestedProperties(newElement, dropZone.suggestedProperties);
            }
            
            // تطبيق auto-positioning إذا كان متاحاً
            if (session.autoPositioningApplied && dropZone.optimalPosition) {
                this.applyOptimalPosition(newElement, dropZone.optimalPosition);
            }
            
            // إشعار Java layer
            const dropPoint = session.endPoint || session.currentPoint || session.startPoint;
            if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDrop === 'function') {
                window.AndroidBridge.onBottomSheetDrop(
                    session.elementType,
                    dropZone.element.id || 'canvas',
                    dropPoint.x,
                    dropPoint.y
                );
            }
            
            console.log('[BottomSheetDrag] Element added successfully:', newElement);
            
            // إشعار Java عن إضافة العنصر للمزامنة مع elementTree
            this.notifyJavaOfElementAddition(newElement, zone);
            
            return true;
            
        } catch (error) {
            console.error('[BottomSheetDrag] Error performing drop:', error);
            return false;
        }
    }

    /**
     * إنشاء عنصر من النوع
     */
    createElementFromType(elementType) {
        let element;
        
        switch (elementType.toLowerCase()) {
            case 'text':
            case 'paragraph':
                element = document.createElement('p');
                element.textContent = 'نص جديد';
                element.style.cssText = 'margin: 10px; padding: 10px; border: 1px solid #ddd;';
                break;
                
            case 'button':
                element = document.createElement('button');
                element.textContent = 'زر جديد';
                element.style.cssText = 'margin: 10px; padding: 10px 20px; background: #2196F3; color: white; border: none; border-radius: 4px;';
                break;
                
            case 'image':
                element = document.createElement('img');
                element.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuKcgeWtouKcgeWMhzwvdGV4dD48L3N2Zz4=';
                element.style.cssText = 'margin: 10px; max-width: 200px; height: auto;';
                break;
                
            case 'div':
            case 'container':
            default:
                element = document.createElement('div');
                element.style.cssText = 'margin: 10px; padding: 15px; min-height: 100px; border: 2px dashed #ccc; background: #f9f9f9;';
                break;
        }
        
        // إضافة معرف فريد
        element.id = this.generateElementId(elementType);
        
        // إضافة click listener للاختيار
        element.addEventListener('click', (e) => {
            if (window.BlocVibeCanvas && typeof window.BlocVibeCanvas.selectElement === 'function') {
                window.BlocVibeCanvas.selectElement(element.id);
            }
            e.stopPropagation();
        });
        
        return element;
    }

    /**
     * تطبيق الخصائص المقترحة
     */
    applySuggestedProperties(element, properties) {
        properties.forEach(prop => {
            try {
                if (prop.property === 'style') {
                    // تطبيق CSS inline
                    Object.assign(element.style, prop.value);
                } else {
                    element.style[prop.property] = prop.value;
                }
            } catch (error) {
                console.warn('[BottomSheetDrag] Failed to apply property:', prop, error);
            }
        });
    }

    /**
     * تطبيق الموقع الأمثل
     */
    applyOptimalPosition(element, position) {
        // تطبيق الموقع بناءً على نوع العنصر
        if (element.style.position === 'absolute' || element.style.position === 'fixed') {
            element.style.left = `${position.x}px`;
            element.style.top = `${position.y}px`;
        } else {
            // للحاويات العادية، نطبق margins
            element.style.marginLeft = `${position.x - 50}px`;
            element.style.marginTop = `${position.y - 25}px`;
        }
    }

    /**
     * تنظيف جلسة السحب
     */
    cleanupDragSession() {
        if (this.activeDragSession) {
            // إزالة preview
            if (this.activeDragSession.previewElement) {
                const preview = this.activeDragSession.previewElement;
                if (preview.parentNode) {
                    preview.style.opacity = '0';
                    preview.style.transform = 'scale(0.8)';
                    setTimeout(() => {
                        preview.parentNode.removeChild(preview);
                    }, 200);
                }
            }
            
            // مسح feedback
            this.clearDropZoneFeedback();
        }
        
        this.activeDragSession = null;
    }

    /**
     * تحديث drop zones
     */
    updateDropZones() {
        if (this.activeDragSession) {
            this.analyzeDropZones(this.activeDragSession.currentPoint);
        }
    }

    /**
     * بدء مراقبة الأداء
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.updatePerformanceMetrics();
        }, 5000); // كل 5 ثواني
    }

    /**
     * تحديث مقاييس الأداء
     */
    updatePerformanceMetrics() {
        if (this.dragHistory.length > 0) {
            const totalTime = this.dragHistory.reduce((sum, drag) => sum + drag.duration, 0);
            this.performanceMetrics.averageDragTime = totalTime / this.dragHistory.length;
            
            const successfulDrags = this.dragHistory.filter(drag => drag.success).length;
            this.performanceMetrics.successRate = successfulDrags / this.dragHistory.length;
            
            // تفعيل وضع الأداء إذا كان الوقت طويل
            this.performanceMetrics.performanceMode = this.performanceMetrics.averageDragTime > 2000;
        }
    }

    // Event Handlers

    handleTouchStart(event) {
        if (this.config.smartPreviewEnabled) {
            // تأخير لإنشاء preview بذكاء
            setTimeout(() => {
                if (event.touches.length === 1) {
                    const touch = event.touches[0];
                    this.startDragSession('div', { x: touch.clientX, y: touch.clientY }, { x: touch.clientX, y: touch.clientY });
                }
            }, this.config.previewDelay);
        }
    }

    handleTouchMove(event) {
        if (this.activeDragSession && event.touches.length === 1) {
            event.preventDefault();
            const touch = event.touches[0];
            this.updateDragSession({ x: touch.clientX, y: touch.clientY });
        }
    }

    handleTouchEnd(event) {
        if (this.activeDragSession) {
            const touch = event.changedTouches[0];
            this.endDragSession({ x: touch.clientX, y: touch.clientY });
        }
    }

    handleMouseDown(event) {
        // يمكن هنا إضافة منطق للماوس
    }

    handleMouseMove(event) {
        if (this.activeDragSession) {
            this.updateDragSession({ x: event.clientX, y: event.clientY });
        }
    }

    handleMouseUp(event) {
        if (this.activeDragSession) {
            this.endDragSession({ x: event.clientX, y: event.clientY });
        }
    }

    // Notification Methods

    notifyDragStart(session) {
        const event = new CustomEvent('bottomSheetDragStart', {
            detail: { session }
        });
        document.dispatchEvent(event);
        
        if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDragStart === 'function') {
            window.AndroidBridge.onBottomSheetDragStart(
                session.elementType,
                session.startPoint.x,
                session.startPoint.y
            );
        }
    }

    notifyDragMove(session, point) {
        const event = new CustomEvent('bottomSheetDragMove', {
            detail: { session, point }
        });
        document.dispatchEvent(event);
        
        if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDragMove === 'function') {
            window.AndroidBridge.onBottomSheetDragMove(
                session.elementType,
                point.x,
                point.y
            );
        }
    }

    notifyDragEnd(session, dropZone, success, error) {
        const event = new CustomEvent('bottomSheetDragEnd', {
            detail: { session, dropZone, success, error }
        });
        document.dispatchEvent(event);
        
        if (window.AndroidBridge && typeof window.AndroidBridge.onBottomSheetDragEnd === 'function') {
            window.AndroidBridge.onBottomSheetDragEnd(
                session.elementType,
                success,
                error || '',
                dropZone ? dropZone.element.id : 'canvas'
            );
        }
    }

    notifyDropZoneAnalysis(zones) {
        const event = new CustomEvent('dropZoneAnalysis', {
            detail: { zones }
        });
        document.dispatchEvent(event);
    }

    // Utility Methods

    generateSessionId() {
        return 'drag_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateElementId(elementType) {
        return elementType + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    getElementDisplayName(elementType) {
        const names = {
            'text': 'النص',
            'button': 'الزر',
            'image': 'الصورة',
            'div': 'الحاوية',
            'container': 'الحاوية'
        };
        return names[elementType] || elementType;
    }

    addAnimationStyles() {
        if (!document.querySelector('#drag-animations')) {
            const style = document.createElement('style');
            style.id = 'drag-animations';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.7; }
                    100% { transform: scale(1); opacity: 1; }
                }
                
                .drop-zone-highlight {
                    animation: dropZoneGlow 1s ease-in-out;
                }
                
                @keyframes dropZoneGlow {
                    0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
                    50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8); }
                    100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // Public API

    handleBottomSheetDrop(elementType, containerId, x, y) {
        // دالة تستدعى من Android layer
        console.log(`[BottomSheetDrag] Handling drop from Android: ${elementType} at (${x}, ${y})`);
        
        const session = this.startDragSession(elementType, { x, y }, { x, y });
        if (session) {
            // البحث عن container بالإعتماد على ID
            const container = document.getElementById(containerId) || document.body;
            
            // تحليل drop zones في الموضع الجديد
            const analysis = this.analyzeDropZones({ x, y });
            const bestZone = analysis[0];
            
            if (bestZone) {
                // تنفيذ الإسقاط
                return this.performDrop(session, bestZone);
            }
        }
        
        return false;
    }

    getActiveDragSession() {
        return this.activeDragSession;
    }

    getDragHistory() {
        return [...this.dragHistory];
    }

    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }

    setConfig(config) {
        Object.assign(this.config, config);
    }

    getConfig() {
        return { ...this.config };
    }

    isDragging() {
        return this.activeDragSession !== null;
    }

    // Cleanup

    destroy() {
        // تنظيف event listeners
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        document.removeEventListener('mousedown', this.handleMouseDown);
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        
        // تنظيف observers
        if (this.observer) {
            this.observer.disconnect();
        }
        
        // تنظيف drag session
        this.cleanupDragSession();
        
        // تنظيف animations
        const animationStyles = document.querySelector('#drag-animations');
        if (animationStyles) {
            animationStyles.remove();
        }
        
        console.log('[BottomSheetDrag] System destroyed');
    }

    /**
     * إشعار Java عن إضافة عنصر جديد للمزامنة مع elementTree
     */
    notifyJavaOfElementAddition(element, zone) {
        try {
            // تجميع بيانات العنصر
            const elementData = {
                type: this.getElementType(element),
                id: element.id || this.generateElementId(),
                containerId: zone ? zone.id : 'body',
                properties: this.extractElementProperties(element)
            };
            
            // التأكد من وجود ID للعنصر
            if (!element.id) {
                element.id = elementData.id;
            }
            
            console.log('[BottomSheetDrag] Notifying Java of element addition:', elementData);
            
            // إرسال البيانات لـ Java
            if (window.AndroidBridge && window.AndroidBridge.syncElementTreeFromDOM) {
                window.AndroidBridge.syncElementTreeFromDOM(JSON.stringify(elementData));
            } else {
                console.warn('[BottomSheetDrag] AndroidBridge interface not available for element sync');
            }
            
        } catch (error) {
            console.error('[BottomSheetDrag] Error notifying Java:', error);
        }
    }

    /**
     * الحصول على نوع العنصر
     */
    getElementType(element) {
        const tagName = element.tagName.toLowerCase();
        switch (tagName) {
            case 'p': return 'paragraph';
            case 'button': return 'button';
            case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading';
            case 'div': return 'div';
            case 'img': return 'image';
            case 'a': return 'link';
            default: return tagName;
        }
    }

    /**
     * توليد ID فريد للعنصر
     */
    generateElementId() {
        return 'element_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * استخراج خصائص العنصر
     */
    extractElementProperties(element) {
        return {
            text: element.textContent || '',
            style: element.style.cssText || '',
            className: element.className || '',
            tagName: element.tagName.toLowerCase()
        };
    }
}

// إنشاء مثيل عام
window.BottomSheetDragSystem = new BottomSheetDragSystem();

// تصدير للاستخدام
window.BlocVibeCanvas = window.BlocVibeCanvas || {};
window.BlocVibeCanvas.bottomSheetDrag = window.BottomSheetDragSystem;