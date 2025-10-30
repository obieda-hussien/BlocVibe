/**
 * BlocVibe DragModeManager v3.0
 * =================================
 * نظام إدارة أنواع السحب المختلفة (EXTERNAL vs INTERNAL)
 * يدير التبديل بين أنماط السحب ويضمن السلوك الصحيح لكل نوع
 * 
 * أنواع السحب المدعومة:
 * - EXTERNAL: من Bottom Sheet إلى Canvas (الموجود حالياً)
 * - INTERNAL: داخل Canvas نفسه (الجديد)
 * - POSITIONING: إعادة ترتيب relative للعناصر (الجديد)
 */

(function() {
    'use strict';
    
    // ==================== ENUMS & CONSTANTS ====================
    
    /**
     * أنواع السحب المدعومة مع الوصف المفصل
     */
    const DragMode = Object.freeze({
        EXTERNAL: 'external',      // سحب خارجي - من Bottom Sheet إلى Canvas
        INTERNAL: 'internal',      // سحب داخلي - نقل عناصر داخل Canvas
        POSITIONING: 'positioning', // تحديد موضع - إعادة ترتيب دقيق للعناصر
        IDLE: 'idle',             // حالة خاملة - لا يوجد سحب نشط
        DISABLED: 'disabled'       // السحب معطل مؤقتاً
    });
    
    /**
     * مصادر السحب المختلفة
     */
    const DragSource = Object.freeze({
        BOTTOM_SHEET: 'bottom-sheet',
        CANVAS_ELEMENT: 'canvas-element',
        PALETTE_COMPONENT: 'palette-component',
        UNKNOWN: 'unknown'
    });
    
    /**
     * حالات النظام
     */
    const SystemState = Object.freeze({
        IDLE: 'idle',
        DETECTING: 'detecting',
        ACTIVE_DRAG: 'active-drag',
        TRANSITIONING: 'transitioning'
    });
    
    // ==================== CLASS DEFINITION ====================
    
    class DragModeManager {
        constructor() {
            this.currentMode = DragMode.DISABLED;
            this.currentSource = DragSource.UNKNOWN;
            this.systemState = SystemState.IDLE;
            this.draggedElement = null;
            this.startCoordinates = { x: 0, y: 0 };
            this.currentCoordinates = { x: 0, y: 0 };
            
            // Event callbacks
            this.onModeChangeCallbacks = [];
            this.onDragStartCallbacks = [];
            this.onDragEndCallbacks = [];
            
            // Mode-specific handlers
            this.modeHandlers = {
                [DragMode.EXTERNAL]: new ExternalDragHandler(),
                [DragMode.INTERNAL]: new InternalDragHandler(),
                [DragMode.POSITIONING]: new PositioningDragHandler()
            };
            
            // Performance monitoring
            this.detectionStartTime = 0;
            this.modeTransitionTime = 0;
            
            this.init();
        }
        
        // ==================== INITIALIZATION ====================
        
        init() {
            console.log('[DragModeManager] 🚀 Initializing Drag Mode Management System...');
            this.setupGlobalListeners();
            this.systemState = SystemState.IDLE;
            console.log('[DragModeManager] ✅ System ready');
        }
        
        setupGlobalListeners() {
            // Listen for pointer events globally
            document.addEventListener('pointerdown', this.handleGlobalPointerDown.bind(this), true);
            document.addEventListener('pointermove', this.handleGlobalPointerMove.bind(this), true);
            document.addEventListener('pointerup', this.handleGlobalPointerUp.bind(this), true);
            
            // Listen for touch events as fallback
            document.addEventListener('touchstart', this.handleGlobalTouchStart.bind(this), { passive: false });
            document.addEventListener('touchmove', this.handleGlobalTouchMove.bind(this), { passive: false });
            document.addEventListener('touchend', this.handleGlobalTouchEnd.bind(this), { passive: false });
        }
        
        // ==================== ADVANCED DETECTION LOGIC ====================
        
        /**
         * تشخيص نوع السحب المتقدم مع تحليل السياق المفصل
         * @param {Event} event - حدث السحب
         * @param {Element} sourceElement - العنصر المصدر
         * @param {Object} additionalContext - سياق إضافي
         * @returns {Object} نتيجة التشخيص مع التفاصيل
         */
        diagnoseDragType(event, sourceElement, additionalContext = {}) {
            this.detectionStartTime = performance.now();
            this.systemState = SystemState.DETECTING;
            
            // تحليل المصدر والسياق
            const source = this.identifyDragSource(sourceElement);
            const context = this.analyzeDragContext(event, sourceElement, additionalContext);
            const mode = this.determineDragMode(source, sourceElement, event, context);
            const confidence = this.calculateDetectionConfidence(mode, source, context);
            
            const diagnosis = {
                mode,
                source,
                confidence,
                context,
                timestamp: Date.now(),
                coordinates: {
                    start: { ...this.startCoordinates },
                    current: { x: event.clientX, y: event.clientY }
                }
            };
            
            console.log(`[DragModeManager] 🔍 تشخيص متقدم:`, {
                mode,
                source,
                confidence: `${Math.round(confidence * 100)}%`,
                context
            });
            
            return diagnosis;
        }
        
        /**
         * تحليل سياق السحب للحصول على تفاصيل أكثر
         * @param {Event} event - حدث السحب
         * @param {Element} element - العنصر المصدر
         * @param {Object} additionalContext - سياق إضافي
         * @returns {Object} تحليل السياق
         */
        analyzeDragContext(event, element, additionalContext) {
            const context = {
                hasModifierKeys: {
                    shift: event.shiftKey,
                    ctrl: event.ctrlKey,
                    alt: event.altKey,
                    meta: event.metaKey
                },
                elementProperties: {
                    tagName: element.tagName,
                    className: element.className,
                    id: element.id,
                    hasDragAttr: element.hasAttribute('draggable'),
                    hasDataAttr: element.hasAttribute('data-bloc-id') || element.hasAttribute('data-component-type')
                },
                parentContext: {
                    isInCanvas: !!element.closest('.canvas-container'),
                    isInBottomSheet: !!element.closest('.bottom-sheet'),
                    isInPalette: !!element.closest('.component-palette'),
                    parentFlex: element.parentElement && (
                        element.parentElement.style.display === 'flex' || 
                        element.parentElement.classList.contains('flex-container')
                    )
                },
                ...additionalContext
            };
            
            return context;
        }
        
        /**
         * حساب مستوى الثقة في التشخيص
         * @param {string} mode - نوع السحب المُحدد
         * @param {string} source - مصدر السحب
         * @param {Object} context - السياق المحلل
         * @returns {number} مستوى الثقة (0-1)
         */
        calculateDetectionConfidence(mode, source, context) {
            let confidence = 0.5; // ثقة افتراضية
            
            // زيادة الثقة بناءً على وضوح المؤشرات
            if (source === DragSource.BOTTOM_SHEET && mode === DragMode.EXTERNAL) {
                confidence += 0.3; // مؤشر قوي
            }
            
            if (context.hasModifierKeys.shift && mode === DragMode.POSITIONING) {
                confidence += 0.2; // مؤشر قوي
            }
            
            if (context.parentContext.isInCanvas && context.parentContext.parentFlex) {
                confidence += 0.15; // مؤشر متوسط
            }
            
            if (context.elementProperties.hasDataAttr) {
                confidence += 0.1; // مؤشر ضعيف
            }
            
            return Math.min(confidence, 1.0); // عدم تجاوز 1
        }
        
        /**
         * كشف نوع السحب عند بداية الحدث (دالة محسّنة)
         */
        detectDragMode(event, sourceElement) {
            const diagnosis = this.diagnoseDragType(event, sourceElement);
            return { mode: diagnosis.mode, source: diagnosis.source };
        }
        
        /**
         * تحديد مصدر السحب
         */
        identifyDragSource(element) {
            if (!element) return DragSource.UNKNOWN;
            
            // Bottom Sheet elements
            if (element.closest('.bottom-sheet') || 
                element.closest('.component-palette') ||
                element.hasAttribute('data-component-type')) {
                return DragSource.BOTTOM_SHEET;
            }
            
            // Canvas elements
            if (element.closest('.canvas-container') || 
                element.closest('.webview-container') ||
                element.hasAttribute('data-bloc-id')) {
                return DragSource.CANVAS_ELEMENT;
            }
            
            // Palette components
            if (element.closest('.palette-component') ||
                element.classList.contains('draggable-component')) {
                return DragSource.PALETTE_COMPONENT;
            }
            
            return DragSource.UNKNOWN;
        }
        
        /**
         * تحديد نوع السحب بناءً على المصدر والسياق
         */
        determineDragMode(source, element, event) {
            switch (source) {
                case DragSource.BOTTOM_SHEET:
                case DragSource.PALETTE_COMPONENT:
                    return DragMode.EXTERNAL;
                    
                case DragSource.CANVAS_ELEMENT:
                    // تحديد نوع السحب الداخلي
                    return this.determineInternalDragMode(element, event);
                    
                default:
                    return DragMode.DISABLED;
            }
        }
        
        /**
         * تحديد نوع السحب الداخلي (INTERNAL vs POSITIONING)
         */
        determineInternalDragMode(element, event) {
            // إذا كان الuser يضغط مع Shift = positioning mode
            if (event.shiftKey) {
                return DragMode.POSITIONING;
            }
            
            // إذا كان العنصر داخل flex container = positioning mode
            const parent = element.parentElement;
            if (parent && (parent.style.display === 'flex' || parent.classList.contains('flex-container'))) {
                return DragMode.POSITIONING;
            }
            
            // افتراضياً = internal mode
            return DragMode.INTERNAL;
        }
        
        // ==================== ADVANCED MODE MANAGEMENT ====================
        
        /**
         * تفعيل نوع سحب جديد مع تطبيق السلوك المناسب
         * @param {string} mode - نوع السحب الجديد
         * @param {string} source - مصدر السحب
         * @param {Object} context - سياق إضافي
         * @returns {boolean} نجاح التفعيل
         */
        setDragMode(mode, source = null, context = {}) {
            if (!this.isValidMode(mode)) {
                console.warn(`[DragModeManager] ⚠️ نوع السحب غير صحيح: ${mode}`);
                return false;
            }
            
            if (this.currentMode === mode && this.currentSource === source) {
                return true; // لم يتغير شيء
            }
            
            const previousMode = this.currentMode;
            const previousSource = this.currentSource;
            this.modeTransitionTime = performance.now();
            
            console.log(`[DragModeManager] 🔄 تبديل نوع السحب:`, {
                من: `${previousMode} (${previousSource})`,
                إلى: `${mode} (${source || 'unknown'})`
            });
            
            // إنهاء النوع السابق بشكل آمن
            if (previousMode !== DragMode.IDLE && previousMode !== DragMode.DISABLED) {
                this.deactivateCurrentMode(previousMode, previousSource, context);
            }
            
            // تفعيل النوع الجديد
            this.currentMode = mode;
            this.currentSource = source || this.currentSource || DragSource.UNKNOWN;
            
            const success = this.activateNewMode(mode, this.currentSource, context);
            
            if (success) {
                // تطبيق السلوك المختلف لكل نوع
                this.applyModeSpecificBehavior(mode, context);
                
                // إشعار المستمعين
                this.notifyModeChange(previousMode, mode, {
                    source,
                    context,
                    transitionTime: performance.now() - this.modeTransitionTime
                });
            } else {
                // في حالة الفشل، إرجاع النوع السابق
                console.error(`[DragModeManager] ❌ فشل تفعيل نوع السحب: ${mode}`);
                this.currentMode = previousMode;
                this.currentSource = previousSource;
                return false;
            }
            
            return true;
        }
        
        /**
         * التحقق من صحة نوع السحب
         * @param {string} mode - نوع السحب المراد فحصه
         * @returns {boolean} صحة النوع
         */
        isValidMode(mode) {
            return Object.values(DragMode).includes(mode);
        }
        
        /**
         * تطبيق سلوك مختلف لكل نوع سحب
         * @param {string} mode - نوع السحب
         * @param {Object} context - السياق
         */
        applyModeSpecificBehavior(mode, context) {
            switch (mode) {
                case DragMode.EXTERNAL:
                    this.applyExternalDragBehavior(context);
                    break;
                case DragMode.INTERNAL:
                    this.applyInternalDragBehavior(context);
                    break;
                case DragMode.POSITIONING:
                    this.applyPositioningDragBehavior(context);
                    break;
                case DragMode.IDLE:
                    this.applyIdleBehavior(context);
                    break;
                default:
                    console.warn(`[DragModeManager] ⚠️ سلوك غير محدد للنوع: ${mode}`);
            }
        }
        
        /**
         * تطبيق سلوك السحب الخارجي
         */
        applyExternalDragBehavior(context) {
            console.log('[DragModeManager] 🟦 تطبيق سلوك السحب الخارجي');
            
            // تفعيل مناطق الإفلات
            this.updateDropZones(true);
            
            // إظهار مؤشرات السحب الخارجي
            this.showExternalDragVisualIndicators();
            
            // تطبيق حد السحب الخارجي
            this.setDragThreshold(10);
            
            // إيقاف تفاعل الكانفاس العادي
            this.disableCanvasDirectInteraction();
        }
        
        /**
         * تطبيق سلوك السحب الداخلي
         */
        applyInternalDragBehavior(context) {
            console.log('[DragModeManager] 🟩 تطبيق سلوك السحب الداخلي');
            
            // تفعيل مناطق الإفلات الداخلية
            this.updateDropZones(true, 'internal');
            
            // إظهار مؤشرات السحب الداخلي
            this.showInternalDragVisualIndicators();
            
            // تطبيق حد السحب الداخلي
            this.setDragThreshold(5);
            
            // السماح بتفاعل الكانفاس المحدود
            this.enableLimitedCanvasInteraction();
        }
        
        /**
         * تطبيق سلوك تحديد الموضع
         */
        applyPositioningDragBehavior(context) {
            console.log('[DragModeManager] 🟨 تطبيق سلوك تحديد الموضع');
            
            // إيقاف مناطق الإفلات
            this.updateDropZones(false);
            
            // إظهار شبكة المساعدة للموقع الدقيق
            this.showPositioningGrid();
            
            // تطبيق حد السحب الموضع
            this.setDragThreshold(2);
            
            // السماح بتفاعل الكانفاس الكامل
            this.enableFullCanvasInteraction();
            
            // تفعيل الsnap to grid إذا كان متوفراً
            if (context.snapToGrid) {
                this.enableSnapToGrid();
            }
        }
        
        /**
         * تطبيق السلوك الخامل
         */
        applyIdleBehavior(context) {
            console.log('[DragModeManager] ⚫ تطبيق السلوك الخامل');
            
            // إزالة جميع التأثيرات البصرية
            this.clearAllVisualEffects();
            
            // إيقاف مناطق الإفلات
            this.updateDropZones(false);
            
            // إعادة تعيين حد السحب
            this.setDragThreshold(5);
            
            // إعادة تفعيل تفاعل الكانفاس العادي
            this.enableFullCanvasInteraction();
        }
        
        /**
         * تفعيل النوع الجديد بشكل آمن
         */
        activateNewMode(mode, source, context) {
            try {
                if (mode !== DragMode.IDLE) {
                    const handler = this.modeHandlers[mode];
                    if (handler) {
                        handler.activate(context);
                        this.systemState = SystemState.ACTIVE_DRAG;
                    } else {
                        console.warn(`[DragModeManager] ⚠️ لم يتم العثور على handler للنوع: ${mode}`);
                    }
                } else {
                    this.systemState = SystemState.IDLE;
                }
                return true;
            } catch (error) {
                console.error(`[DragModeManager] ❌ خطأ في تفعيل النوع ${mode}:`, error);
                return false;
            }
        }
        
        /**
         * إلغاء تفعيل النوع السابق بشكل آمن
         */
        deactivateCurrentMode(mode, source, context) {
            try {
                const handler = this.modeHandlers[mode];
                if (handler) {
                    handler.deactivate(context);
                }
                
                // إزالة التأثيرات البصرية للنوع السابق
                this.removeModeVisualEffects(mode);
            } catch (error) {
                console.error(`[DragModeManager] ❌ خطأ في إلغاء تفعيل النوع ${mode}:`, error);
            }
        }
        
        /**
         * إيقاف السحب وإعادة تعيين النظام
         */
        resetDragMode() {
            console.log('[DragModeManager] 🔄 إعادة تعيين مدير أنواع السحب...');
            
            const previousMode = this.currentMode;
            const previousSource = this.currentSource;
            
            // إلغاء تفعيل النوع الحالي
            if (previousMode !== DragMode.IDLE) {
                this.deactivateCurrentMode(previousMode, previousSource, {});
            }
            
            // إعادة تعيين الحالة
            this.currentMode = DragMode.IDLE;
            this.currentSource = DragSource.UNKNOWN;
            this.systemState = SystemState.IDLE;
            this.draggedElement = null;
            
            // إزالة جميع التأثيرات البصرية
            this.clearAllVisualEffects();
            
            console.log(`[DragModeManager] ✅ تم إعادة التعيين من ${previousMode} إلى IDLE`);
            
            // إشعار المستمعين
            this.notifyModeChange(previousMode, DragMode.IDLE, {
                isReset: true,
                previousSource
            });
        }
        
        // ==================== VISUAL FEEDBACK & INDICATORS ====================
        
        /**
         * تحديث حالة مناطق الإفلات
         * @param {boolean} enabled - تفعيل أو إيقاف
         * @param {string} type - نوع مناطق الإفلات
         */
        updateDropZones(enabled, type = 'general') {
            const dropZones = document.querySelectorAll('.drop-zone');
            const targetType = type === 'internal' ? 'internal-drop-zone' : 'external-drop-zone';
            
            dropZones.forEach(zone => {
                if (enabled) {
                    zone.classList.add('drop-zone-enabled', targetType);
                    zone.setAttribute('data-drop-type', type);
                } else {
                    zone.classList.remove('drop-zone-enabled', 'external-drop-zone', 'internal-drop-zone');
                    zone.removeAttribute('data-drop-type');
                }
            });
            
            console.log(`[DragModeManager] 👁️ ${enabled ? 'تفعيل' : 'إيقاف'} مناطق الإفلات: ${type}`);
        }
        
        /**
         * إظهار مؤشرات السحب الخارجي
         */
        showExternalDragVisualIndicators() {
            document.body.classList.add('external-drag-mode');
            
            const dropZones = document.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                zone.classList.add('drop-zone-active', 'external-drop');
                this.addVisualPulse(zone);
            });
            
            console.log('[DragModeManager] 🔵 تم تفعيل مؤشرات السحب الخارجي');
        }
        
        /**
         * إظهار مؤشرات السحب الداخلي
         */
        showInternalDragVisualIndicators() {
            document.body.classList.add('internal-drag-mode');
            
            const dropZones = document.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                zone.classList.add('drop-zone-active', 'internal-drop');
                this.addVisualPulse(zone);
            });
            
            console.log('[DragModeManager] 🟢 تم تفعيل مؤشرات السحب الداخلي');
        }
        
        /**
         * إظهار شبكة المساعدة لتحديد الموضع
         */
        showPositioningGrid() {
            let gridOverlay = document.getElementById('positioning-grid-overlay');
            if (!gridOverlay) {
                gridOverlay = document.createElement('div');
                gridOverlay.id = 'positioning-grid-overlay';
                gridOverlay.className = 'positioning-grid-overlay';
                document.body.appendChild(gridOverlay);
            }
            
            gridOverlay.style.display = 'block';
            gridOverlay.classList.add('positioning-grid-visible');
            
            console.log('[DragModeManager] 📐 تم تفعيل شبكة تحديد الموضع');
        }
        
        /**
         * إزالة التأثيرات البصرية لنوع سحب معين
         */
        removeModeVisualEffects(mode) {
            switch (mode) {
                case DragMode.EXTERNAL:
                    this.removeExternalDragVisualEffects();
                    break;
                case DragMode.INTERNAL:
                    this.removeInternalDragVisualEffects();
                    break;
                case DragMode.POSITIONING:
                    this.removePositioningVisualEffects();
                    break;
            }
        }
        
        /**
         * إزالة مؤشرات السحب الخارجي
         */
        removeExternalDragVisualEffects() {
            document.body.classList.remove('external-drag-mode');
            this.removeDropZoneEffects('external');
        }
        
        /**
         * إزالة مؤشرات السحب الداخلي
         */
        removeInternalDragVisualEffects() {
            document.body.classList.remove('internal-drag-mode');
            this.removeDropZoneEffects('internal');
        }
        
        /**
         * إزالة مؤشرات تحديد الموضع
         */
        removePositioningVisualEffects() {
            this.hidePositioningGrid();
        }
        
        /**
         * إزالة تأثيرات مناطق الإفلات
         */
        removeDropZoneEffects(type) {
            const dropZones = document.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                zone.classList.remove('drop-zone-active', `${type}-drop`);
                this.removeVisualPulse(zone);
            });
        }
        
        /**
         * إخفاء شبكة تحديد الموضع
         */
        hidePositioningGrid() {
            const gridOverlay = document.getElementById('positioning-grid-overlay');
            if (gridOverlay) {
                gridOverlay.classList.remove('positioning-grid-visible');
                gridOverlay.style.display = 'none';
            }
        }
        
        /**
         * إزالة جميع التأثيرات البصرية
         */
        clearAllVisualEffects() {
            document.body.classList.remove('external-drag-mode', 'internal-drag-mode', 'positioning-drag-mode');
            
            const dropZones = document.querySelectorAll('.drop-zone');
            dropZones.forEach(zone => {
                zone.classList.remove('drop-zone-active', 'external-drop', 'internal-drop');
                this.removeVisualPulse(zone);
                zone.removeAttribute('data-drop-type');
            });
            
            this.hidePositioningGrid();
            
            console.log('[DragModeManager] 🎭 تم مسح جميع التأثيرات البصرية');
        }
        
        /**
         * إضافة نبضة بصرية لعنصر
         */
        addVisualPulse(element) {
            element.style.animation = 'dropZonePulse 1.5s ease-in-out infinite';
        }
        
        /**
         * إزالة النبضة البصرية من عنصر
         */
        removeVisualPulse(element) {
            element.style.animation = '';
        }
        
        handleGlobalPointerDown(event) {
            // تجاهل الأحداث الثانوية
            if (event.button !== 0) return;
            
            const target = event.target;
            this.startCoordinates = { x: event.clientX, y: event.clientY };
            this.currentCoordinates = { x: event.clientX, y: event.clientY };
            
            // كشف إمكانية السحب
            if (this.isElementDraggable(target)) {
                const detection = this.detectDragMode(event, target);
                
                if (detection.mode !== DragMode.DISABLED) {
                    this.draggedElement = target;
                    // لا نفعل النوع بعد، ننتظر حركة فعلية
                }
            }
        }
        
        handleGlobalPointerMove(event) {
            if (!this.draggedElement) return;
            
            this.currentCoordinates = { x: event.clientX, y: event.clientY };
            
            // حساب المسافة المقطوعة
            const distance = this.calculateDistance(this.startCoordinates, this.currentCoordinates);
            
            // إذا تجاوزنا العتبة الدنيا، نبدأ السحب
            if (distance > 5 && this.systemState === SystemState.DETECTING) {
                this.startActualDrag(event);
            }
            
            // إذا كان السحب نشطاً، نمرر الحدث للـ handler النشط
            if (this.systemState === SystemState.ACTIVE_DRAG) {
                this.modeHandlers[this.currentMode]?.handleMove(event, this.draggedElement);
            }
        }
        
        handleGlobalPointerUp(event) {
            if (this.systemState === SystemState.ACTIVE_DRAG) {
                this.modeHandlers[this.currentMode]?.handleEnd(event, this.draggedElement);
            }
            
            this.resetDragMode();
        }
        
        // Touch event handlers (fallback)
        handleGlobalTouchStart(event) {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const syntheticEvent = this.createSyntheticPointerEvent('pointerdown', touch);
                this.handleGlobalPointerDown(syntheticEvent);
            }
        }
        
        handleGlobalTouchMove(event) {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const syntheticEvent = this.createSyntheticPointerEvent('pointermove', touch);
                this.handleGlobalPointerMove(syntheticEvent);
            }
        }
        
        handleGlobalTouchEnd(event) {
            const syntheticEvent = this.createSyntheticPointerEvent('pointerup', event.changedTouches[0]);
            this.handleGlobalPointerUp(syntheticEvent);
        }
        
        // ==================== DRAG INITIATION ====================
        
        startActualDrag(event) {
            const detection = this.detectDragMode(event, this.draggedElement);
            this.setDragMode(detection.mode, detection.source);
            
            // إشعار بداية السحب
            this.notifyDragStart(this.draggedElement, detection.mode);
            
            // تمرير الحدث للـ handler المناسب
            this.modeHandlers[this.currentMode]?.handleStart(event, this.draggedElement);
        }
        
        // ==================== UTILITY METHODS ====================
        
        isElementDraggable(element) {
            if (!element) return false;
            
            // تحقق من الخصائص المختلفة للسحب
            return element.hasAttribute('draggable') ||
                   element.hasAttribute('data-bloc-id') ||
                   element.hasAttribute('data-component-type') ||
                   element.classList.contains('draggable') ||
                   element.classList.contains('draggable-component') ||
                   element.closest('.bottom-sheet') ||
                   element.closest('.canvas-container');
        }
        
        calculateDistance(point1, point2) {
            const dx = point2.x - point1.x;
            const dy = point2.y - point1.y;
            return Math.sqrt(dx * dx + dy * dy);
        }
        
        createSyntheticPointerEvent(type, touch) {
            return {
                type: type,
                clientX: touch.clientX,
                clientY: touch.clientY,
                target: touch.target,
                button: 0,
                preventDefault: () => {},
                stopPropagation: () => {}
            };
        }
        
        // ==================== CALLBACK MANAGEMENT ====================
        
        onModeChange(callback) {
            this.onModeChangeCallbacks.push(callback);
        }
        
        onDragStart(callback) {
            this.onDragStartCallbacks.push(callback);
        }
        
        onDragEnd(callback) {
            this.onDragEndCallbacks.push(callback);
        }
        
        notifyModeChange(previousMode, newMode) {
            this.onModeChangeCallbacks.forEach(callback => {
                try {
                    callback(previousMode, newMode, this.currentSource);
                } catch (error) {
                    console.error('[DragModeManager] Error in mode change callback:', error);
                }
            });
        }
        
        notifyDragStart(element, mode) {
            this.onDragStartCallbacks.forEach(callback => {
                try {
                    callback(element, mode, this.currentSource);
                } catch (error) {
                    console.error('[DragModeManager] Error in drag start callback:', error);
                }
            });
        }
        
        notifyDragEnd(element, mode, success) {
            this.onDragEndCallbacks.forEach(callback => {
                try {
                    callback(element, mode, this.currentSource, success);
                } catch (error) {
                    console.error('[DragModeManager] Error in drag end callback:', error);
                }
            });
        }
        
        // ==================== PUBLIC API ====================
        
        getCurrentMode() {
            return this.currentMode;
        }
        
        getCurrentSource() {
            return this.currentSource;
        }
        
        getSystemState() {
            return this.systemState;
        }
        
        isDragActive() {
            return this.systemState === SystemState.ACTIVE_DRAG;
        }
        
        getDraggedElement() {
            return this.draggedElement;
        }
        
        // Force mode for testing
        forceDragMode(mode, source = DragSource.UNKNOWN) {
            console.warn('[DragModeManager] ⚠️ Force setting drag mode to:', mode);
            this.setDragMode(mode, source);
        }
        
        // ==================== CANVAS INTERACTION MANAGEMENT ====================
        
        /**
         * تعطيل التفاعل المباشر مع الكانفاس
         */
        disableCanvasDirectInteraction() {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.style.pointerEvents = 'none';
                console.log('[DragModeManager] 🚫 تم تعطيل التفاعل المباشر مع الكانفاس');
            }
        }
        
        /**
         * السماح بتفاعل الكانفاس المحدود
         */
        enableLimitedCanvasInteraction() {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = 'grab';
                console.log('[DragModeManager] 🟡 تم السماح بتفاعل محدود مع الكانفاس');
            }
        }
        
        /**
         * السماح بتفاعل الكانفاس الكامل
         */
        enableFullCanvasInteraction() {
            const canvas = document.querySelector('canvas');
            if (canvas) {
                canvas.style.pointerEvents = 'auto';
                canvas.style.cursor = '';
                console.log('[DragModeManager] ✅ تم السماح بتفاعل كامل مع الكانفاس');
            }
        }
        
        /**
         * تفعيل الsnap to grid
         */
        enableSnapToGrid() {
            document.body.classList.add('snap-to-grid-enabled');
            console.log('[DragModeManager] 🧲 تم تفعيل الsnap to grid');
        }
        
        // ==================== PUBLIC API ENHANCEMENTS ====================
        
        /**
         * الحصول على تقرير حالة شامل
         * @returns {Object} تقرير حالة المدير
         */
        getStatusReport() {
            return {
                currentMode: this.currentMode,
                currentSource: this.currentSource,
                systemState: this.systemState,
                draggedElement: this.draggedElement ? {
                    tagName: this.draggedElement.tagName,
                    id: this.draggedElement.id,
                    className: this.draggedElement.className
                } : null,
                coordinates: {
                    start: { ...this.startCoordinates },
                    current: { ...this.currentCoordinates }
                },
                performance: this.getPerformanceInfo(),
                eventListenersCount: this.getEventListenersCount(),
                isDragActive: this.isDragActive(),
                modeConfig: this.getCurrentModeConfig()
            };
        }
        
        /**
         * الحصول على إعدادات النوع الحالي
         * @returns {Object} إعدادات النوع الحالي
         */
        getCurrentModeConfig() {
            const configs = {
                [DragMode.EXTERNAL]: {
                    enableDropZones: true,
                    allowCanvasInteraction: false,
                    visualFeedback: 'external',
                    threshold: 10,
                    description: 'سحب عناصر من مصادر خارجية'
                },
                [DragMode.INTERNAL]: {
                    enableDropZones: true,
                    allowCanvasInteraction: true,
                    visualFeedback: 'internal',
                    threshold: 5,
                    description: 'نقل عناصر داخل الكانفاس'
                },
                [DragMode.POSITIONING]: {
                    enableDropZones: false,
                    allowCanvasInteraction: true,
                    visualFeedback: 'positioning',
                    threshold: 2,
                    description: 'تحديد موضع دقيق للعناصر'
                },
                [DragMode.IDLE]: {
                    enableDropZones: false,
                    allowCanvasInteraction: true,
                    visualFeedback: 'none',
                    threshold: 5,
                    description: 'لا يوجد سحب نشط'
                }
            };
            
            return configs[this.currentMode] || configs[DragMode.IDLE];
        }
        
        /**
         * الحصول على عدد مستمعي الأحداث
         * @returns {Object} عدد المستمعين لكل حدث
         */
        getEventListenersCount() {
            return {
                modeChange: this.onModeChangeCallbacks.length,
                dragStart: this.onDragStartCallbacks.length,
                dragEnd: this.onDragEndCallbacks.length
            };
        }
        
        /**
         * التبديل السريع بين أنواع السحب
         * @param {string} targetMode - النوع المطلوب التبديل إليه
         * @param {Object} context - السياق الإضافي
         */
        switchToMode(targetMode, context = {}) {
            if (!this.isValidMode(targetMode)) {
                console.warn(`[DragModeManager] ⚠️ نوع سحب غير صحيح: ${targetMode}`);
                return false;
            }
            
            console.log(`[DragModeManager] 🔄 تبديل سريع إلى: ${targetMode}`);
            return this.setDragMode(targetMode, null, { ...context, manualSwitch: true });
        }
        
        /**
         * الحصول على معلومات تتبع المصدر
         * @returns {Object} معلومات المصدر
         */
        getSourceTrackingInfo() {
            return {
                currentSource: this.currentSource,
                dragSource: this.dragSource,
                sourceHistory: this.sourceHistory || [],
                lastSourceChange: this.lastSourceChange || null
            };
        }
        
        /**
         * التحقق من إمكانية السحب إلى هدف معين
         * @param {Element} target - العنصر المستهدف
         * @returns {Object} نتيجة التحقق
         */
        canDropTo(target) {
            if (!target) {
                return { canDrop: false, reason: 'هدف غير محدد' };
            }
            
            const config = this.getCurrentModeConfig();
            
            if (!config.enableDropZones) {
                return { 
                    canDrop: false, 
                    reason: `النوع ${this.currentMode} لا يدعم مناطق الإفلات` 
                };
            }
            
            const isDropZone = target.classList.contains('drop-zone') || 
                              target.classList.contains('drop-zone-enabled');
            
            if (!isDropZone) {
                return { 
                    canDrop: false, 
                    reason: 'الهدف ليس منطقة إفلات صالحة' 
                };
            }
            
            return { 
                canDrop: true, 
                reason: 'الهدف صالح للسحب',
                dropZoneType: target.getAttribute('data-drop-type') || 'general'
            };
        }
        
        // Performance info
        getPerformanceInfo() {
            return {
                detectionTime: this.detectionStartTime ? performance.now() - this.detectionStartTime : 0,
                transitionTime: this.modeTransitionTime ? performance.now() - this.modeTransitionTime : 0,
                currentMode: this.currentMode,
                systemState: this.systemState,
                uptime: Date.now() - (this.creationTime || Date.now())
            };
        }
    }
    
    // ==================== MODE HANDLERS (البداية) ====================
    
    /**
     * Handler للسحب الخارجي (من Bottom Sheet)
     */
    class ExternalDragHandler {
        activate() {
            console.log('[ExternalDragHandler] 🔵 External drag mode activated');
        }
        
        deactivate() {
            console.log('[ExternalDragHandler] 🔵 External drag mode deactivated');
        }
        
        handleStart(event, element) {
            console.log('[ExternalDragHandler] 🚀 Starting external drag:', element);
            // سيتم ربطه بالنظام الموجود في canvas-interaction.js
        }
        
        handleMove(event, element) {
            // سيتم تنفيذه لاحقاً
        }
        
        handleEnd(event, element) {
            console.log('[ExternalDragHandler] 🎯 Ending external drag');
        }
    }
    
    /**
     * Handler للسحب الداخلي
     */
    class InternalDragHandler {
        activate() {
            console.log('[InternalDragHandler] 🟢 Internal drag mode activated');
        }
        
        deactivate() {
            console.log('[InternalDragHandler] 🟢 Internal drag mode deactivated');
        }
        
        handleStart(event, element) {
            console.log('[InternalDragHandler] 🚀 Starting internal drag:', element);
        }
        
        handleMove(event, element) {
            // سيتم تنفيذه مع DropZoneManager
        }
        
        handleEnd(event, element) {
            console.log('[InternalDragHandler] 🎯 Ending internal drag');
        }
    }
    
    /**
     * Handler للـ positioning المتقدم
     */
    class PositioningDragHandler {
        activate() {
            console.log('[PositioningDragHandler] 🟡 Positioning drag mode activated');
        }
        
        deactivate() {
            console.log('[PositioningDragHandler] 🟡 Positioning drag mode deactivated');
        }
        
        handleStart(event, element) {
            console.log('[PositioningDragHandler] 🚀 Starting positioning drag:', element);
        }
        
        handleMove(event, element) {
            // سيتم تنفيذه مع PositionCalculator
        }
        
        handleEnd(event, element) {
            console.log('[PositioningDragHandler] 🎯 Ending positioning drag');
        }
    }
    
    // ==================== USAGE EXAMPLES ====================
    
    /**
     * أمثلة على الاستخدام المتقدم لـ DragModeManager
     */
    class DragModeExamples {
        
        /**
         * مثال 1: سحب من bottom-sheet (External Drag)
         */
        static exampleExternalDrag() {
            console.log('📖 مثال 1: سحب عنصر من Bottom Sheet');
            
            const manager = window.BlocVibeDragModeManager;
            
            // محاكاة سحب من bottom-sheet
            const mockEvent = {
                clientX: 100,
                clientY: 200,
                shiftKey: false,
                ctrlKey: false,
                altKey: false,
                target: document.createElement('div')
            };
            
            mockEvent.target.setAttribute('data-component-type', 'button');
            mockEvent.target.closest = () => ({ classList: { contains: () => true } });
            
            const diagnosis = manager.diagnoseDragType(mockEvent, mockEvent.target, {
                source: 'bottom-sheet',
                componentType: 'button'
            });
            
            console.log('نتيجة التشخيص:', diagnosis);
            console.log('نجح التطبيق:', diagnosis.mode === DragMode.EXTERNAL);
        }
        
        /**
         * مثال 2: سحب داخلي في Canvas
         */
        static exampleInternalDrag() {
            console.log('📖 مثال 2: سحب داخلي في Canvas');
            
            const manager = window.BlocVibeDragModeManager;
            
            // محاكاة سحب عنصر من canvas
            const mockEvent = {
                clientX: 150,
                clientY: 250,
                shiftKey: false,
                ctrlKey: false,
                altKey: false,
                target: document.createElement('div')
            };
            
            mockEvent.target.setAttribute('data-bloc-id', 'element123');
            mockEvent.closest = (selector) => {
                if (selector === '.canvas-container') {
                    return { classList: { contains: () => true } };
                }
                return null;
            };
            
            const diagnosis = manager.diagnoseDragType(mockEvent, mockEvent.target, {
                source: 'canvas-element',
                elementId: 'element123'
            });
            
            console.log('نتيجة التشخيص:', diagnosis);
            console.log('نوع السحب المتوقع:', diagnosis.mode);
        }
        
        /**
         * مثال 3: سحب لتحديد الموضع (Positioning)
         */
        static examplePositioningDrag() {
            console.log('📖 مثال 3: سحب لتحديد الموضع مع Shift');
            
            const manager = window.BlocVibeDragModeManager;
            
            // محاكاة سحب مع الضغط على Shift للموقع الدقيق
            const mockEvent = {
                clientX: 200,
                clientY: 300,
                shiftKey: true, // الضغط على Shift يحدد positioning mode
                ctrlKey: false,
                altKey: false,
                target: document.createElement('div')
            };
            
            mockEvent.target.setAttribute('data-bloc-id', 'flex-element');
            mockEvent.parentElement = {
                style: { display: 'flex' },
                classList: { contains: () => true }
            };
            mockEvent.closest = (selector) => {
                if (selector === '.canvas-container') {
                    return { classList: { contains: () => true } };
                }
                return null;
            };
            
            const diagnosis = manager.diagnoseDragType(mockEvent, mockEvent.target, {
                source: 'canvas-element',
                positioning: true,
                snapToGrid: true
            });
            
            console.log('نتيجة التشخيص:', diagnosis);
            console.log('مستوى الثقة:', `${Math.round(diagnosis.confidence * 100)}%`);
        }
        
        /**
         * مثال 4: التبديل بين أنواع السحب
         */
        static exampleModeSwitching() {
            console.log('📖 مثال 4: التبديل بين أنواع السحب المختلفة');
            
            const manager = window.BlocVibeDragModeManager;
            
            // إضافة مستمع للتغييرات
            manager.onModeChange((previousMode, newMode, context) => {
                console.log('🎯 تغيير نوع السحب:', {
                    من: previousMode,
                    إلى: newMode,
                    السياق: context
                });
            });
            
            console.log('🔄 بدء التبديل المتتالي بين الأنواع...');
            
            // التبديل إلى سحب خارجي
            setTimeout(() => {
                const success1 = manager.switchToMode(DragMode.EXTERNAL, {
                    reason: 'اختبار السحب الخارجي'
                });
                console.log('✅ تفعيل السحب الخارجي:', success1);
            }, 500);
            
            // التبديل إلى سحب داخلي
            setTimeout(() => {
                const success2 = manager.switchToMode(DragMode.INTERNAL, {
                    reason: 'اختبار السحب الداخلي'
                });
                console.log('✅ تفعيل السحب الداخلي:', success2);
            }, 1500);
            
            // التبديل إلى تحديد موضع
            setTimeout(() => {
                const success3 = manager.switchToMode(DragMode.POSITIONING, {
                    reason: 'اختبار تحديد الموضع',
                    snapToGrid: true
                });
                console.log('✅ تفعيل تحديد الموضع:', success3);
            }, 2500);
            
            // العودة للحالة الخاملة
            setTimeout(() => {
                manager.resetDragMode();
                console.log('🔄 تم العودة للحالة الخاملة');
            }, 3500);
        }
        
        /**
         * مثال 5: تشخيص متقدم مع تحليل السياق
         */
        static exampleAdvancedDiagnosis() {
            console.log('📖 مثال 5: تشخيص متقدم مع تحليل السياق المفصل');
            
            const manager = window.BlocVibeDragModeManager;
            
            // سيناريو معقد: عنصر في flex container مع modifier keys
            const mockEvent = {
                clientX: 300,
                clientY: 400,
                shiftKey: true,
                ctrlKey: true,
                altKey: false,
                metaKey: false,
                target: document.createElement('div')
            };
            
            mockEvent.target.className = 'bloc-element flex-container-item';
            mockEvent.target.id = 'advanced-element';
            mockEvent.setAttribute('data-bloc-id', 'advanced-123');
            
            mockEvent.parentElement = {
                style: { display: 'flex' },
                classList: { contains: (cls) => cls === 'flex-container' }
            };
            
            mockEvent.closest = (selector) => {
                return { classList: { contains: () => true } };
            };
            
            const context = {
                isComplexScenario: true,
                hasAdvancedFeatures: true,
                experimentalMode: true
            };
            
            const diagnosis = manager.diagnoseDragType(mockEvent, mockEvent.target, context);
            
            console.log('🔬 تحليل متقدم:', {
                result: diagnosis,
                modeSpecific: {
                    isExternal: diagnosis.mode === DragMode.EXTERNAL,
                    isInternal: diagnosis.mode === DragMode.INTERNAL,
                    isPositioning: diagnosis.mode === DragMode.POSITIONING
                },
                contextAnalysis: diagnosis.context,
                confidence: `${Math.round(diagnosis.confidence * 100)}%`
            });
        }
        
        /**
         * مثال 6: اختبار الأداء والمراقبة
         */
        static examplePerformanceMonitoring() {
            console.log('📖 مثال 6: مراقبة الأداء والإحصائيات');
            
            const manager = window.BlocVibeDragModeManager;
            
            // تشغيل عدة عمليات والسؤال عن الأداء
            const iterations = 5;
            
            console.log('🚀 بدء اختبار الأداء...');
            
            for (let i = 0; i < iterations; i++) {
                setTimeout(() => {
                    // محاكاة كشف سريع
                    const mockElement = document.createElement('div');
                    const mockEvent = {
                        clientX: Math.random() * 500,
                        clientY: Math.random() * 500,
                        shiftKey: Math.random() > 0.5,
                        target: mockElement
                    };
                    
                    const startTime = performance.now();
                    const diagnosis = manager.diagnoseDragType(mockEvent, mockElement);
                    const endTime = performance.now();
                    
                    console.log(`🏃‍♂️ تكرار ${i + 1}:`, {
                        time: `${(endTime - startTime).toFixed(2)}ms`,
                        mode: diagnosis.mode,
                        confidence: `${Math.round(diagnosis.confidence * 100)}%`
                    });
                    
                    if (i === iterations - 1) {
                        // إظهار التقرير النهائي
                        setTimeout(() => {
                            const report = manager.getStatusReport();
                            console.log('📊 التقرير النهائي:', report);
                        }, 100);
                    }
                }, i * 200);
            }
        }
        
        /**
         * تشغيل جميع الأمثلة
         */
        static runAllExamples() {
            console.log('🎯 تشغيل جميع أمثلة DragModeManager');
            console.log('=' * 50);
            
            this.exampleExternalDrag();
            
            setTimeout(() => this.exampleInternalDrag(), 1000);
            setTimeout(() => this.examplePositioningDrag(), 2000);
            setTimeout(() => this.exampleModeSwitching(), 3000);
            setTimeout(() => this.exampleAdvancedDiagnosis(), 6500);
            setTimeout(() => this.examplePerformanceMonitoring(), 8000);
            
            console.log('✅ تم جدولة تشغيل جميع الأمثلة');
        }
    }
    
    // ==================== GLOBAL EXPORT ====================
    
    // إنشاء instance عام
    window.BlocVibeDragModeManager = new DragModeManager();
    
    // تصدير الأنواع للاستخدام في ملفات أخرى
    window.BlocVibeDragMode = DragMode;
    window.BlocVibeDragSource = DragSource;
    
    // تصدير أمثلة الاستخدام
    window.DragModeExamples = DragModeExamples;
    
    console.log('[DragModeManager] 🌟 DragModeManager loaded and ready!');
    console.log('📚 لتشغيل أمثلة الاستخدام: DragModeExamples.runAllExamples()');
    console.log('🔍 لتشخيص سحب: BlocVibeDragModeManager.diagnoseDragType(event, element, context)');
    console.log('🔄 للتبديل بين الأنواع: BlocVibeDragModeManager.switchToMode(mode, context)');
    
})();