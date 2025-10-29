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
     * أنواع السحب المدعومة
     */
    const DragMode = Object.freeze({
        EXTERNAL: 'external',      // من Bottom Sheet إلى Canvas
        INTERNAL: 'internal',      // داخل Canvas (element إلى element)
        POSITIONING: 'positioning', // positioning دقيق (above/below/left/right)
        DISABLED: 'disabled'       // السحب معطل
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
        
        // ==================== CORE DETECTION LOGIC ====================
        
        /**
         * كشف نوع السحب عند بداية الحدث
         */
        detectDragMode(event, sourceElement) {
            this.detectionStartTime = performance.now();
            this.systemState = SystemState.DETECTING;
            
            const source = this.identifyDragSource(sourceElement);
            const mode = this.determineDragMode(source, sourceElement, event);
            
            console.log(`[DragModeManager] 🔍 Detected: Source=${source}, Mode=${mode}`);
            
            return { mode, source };
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
        
        // ==================== MODE MANAGEMENT ====================
        
        /**
         * تغيير نوع السحب النشط
         */
        setDragMode(mode, source = null) {
            if (this.currentMode === mode) return;
            
            const previousMode = this.currentMode;
            this.modeTransitionTime = performance.now();
            
            // إيقاف النوع السابق
            if (previousMode !== DragMode.DISABLED) {
                this.modeHandlers[previousMode]?.deactivate();
            }
            
            // تفعيل النوع الجديد
            this.currentMode = mode;
            this.currentSource = source || this.currentSource;
            
            if (mode !== DragMode.DISABLED) {
                this.modeHandlers[mode]?.activate();
                this.systemState = SystemState.ACTIVE_DRAG;
            } else {
                this.systemState = SystemState.IDLE;
            }
            
            // إشعار المستمعين
            this.notifyModeChange(previousMode, mode);
            
            console.log(`[DragModeManager] 🔄 Mode changed: ${previousMode} → ${mode}`);
        }
        
        /**
         * إيقاف السحب وإعادة تعيين النظام
         */
        resetDragMode() {
            if (this.currentMode !== DragMode.DISABLED) {
                this.modeHandlers[this.currentMode]?.deactivate();
            }
            
            this.currentMode = DragMode.DISABLED;
            this.currentSource = DragSource.UNKNOWN;
            this.systemState = SystemState.IDLE;
            this.draggedElement = null;
            
            console.log('[DragModeManager] 🔄 Drag mode reset');
        }
        
        // ==================== EVENT HANDLERS ====================
        
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
        
        // Performance info
        getPerformanceInfo() {
            return {
                detectionTime: this.detectionStartTime ? performance.now() - this.detectionStartTime : 0,
                transitionTime: this.modeTransitionTime ? performance.now() - this.modeTransitionTime : 0,
                currentMode: this.currentMode,
                systemState: this.systemState
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
    
    // ==================== GLOBAL EXPORT ====================
    
    // إنشاء instance عام
    window.BlocVibeDragModeManager = new DragModeManager();
    
    // تصدير الأنواع للاستخدام في ملفات أخرى
    window.BlocVibeDragMode = DragMode;
    window.BlocVibeDragSource = DragSource;
    
    console.log('[DragModeManager] 🌟 DragModeManager loaded and ready!');
    
})();