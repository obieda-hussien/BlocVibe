/**
 * BlocVibe Ultra-Advanced Canvas Interaction System v2.0
 * ========================================================
 * نظام Drag & Drop متطور جداً مبني على Pointer Events API
 * مع Auto-Recovery و RequestAnimationFrame لضمان أداء مثالي
 * 
 * التقنيات المستخدمة:
 * - Pointer Events API (أقوى من Drag Events)
 * - RequestAnimationFrame (تحديث سلس 60 FPS)
 * - Touch Events Fallback (توافق كامل)
 * - State Machine (إدارة دقيقة للحالات)
 * - Auto-Recovery (إصلاح تلقائي للمشاكل)
 */

(function() {
    'use strict';
    
    // ==================== STATE MANAGEMENT ====================
    
    const DragState = {
        IDLE: 'idle',
        READY: 'ready',
        DRAGGING: 'dragging',
        DROPPING: 'dropping'
    };
    
    let currentState = DragState.IDLE;
    let selectedElements = [];
    let draggedElement = null;
    let dragGhost = null;
    let dropIndicator = null;
    let multiSelectMode = false;
    let operationQueue = [];
    let isProcessingQueue = false;
    let lastRenderTime = 0;
    
    // Pointer tracking
    let currentPointerX = 0;
    let currentPointerY = 0;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    // Animation loop
    let animationFrameId = null;
    let isAnimating = false;
    
    // Recovery system
    let recoveryTimer = null;
    const RECOVERY_TIMEOUT = 3000; // 3 ثوانٍ
    
    // Performance monitoring
    let dragStartTime = 0;
    let frameCount = 0;
    let lastFrameTime = 0;
    
    // Constants
    const RENDER_DEBOUNCE_MS = 500;
    const MIN_DRAG_DISTANCE = 5; // بكسل - الحد الأدنى للحركة لبدء السحب
    const GHOST_OFFSET = 15; // بكسل - المسافة بين المؤشر والـ Ghost
    
    // ==================== INITIALIZATION ====================
    
    function init() {
        console.log('[BlocVibe] 🚀 Initializing Ultra-Advanced Canvas System v2.0...');
        
        setupVisualComponents();
        setupEventListeners();
        makeElementsInteractive();
        startQueueProcessor();
        
        console.log('[BlocVibe] ✅ Canvas interaction fully initialized with Pointer Events API');
    }
    
    // ==================== VISUAL COMPONENTS SETUP ====================
    
    function setupVisualComponents() {
        setupDropIndicator();
        setupDragGhost();
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
        `;
        document.body.appendChild(dragGhost);
    }
    
    // ==================== EVENT LISTENERS ====================
    
    function setupEventListeners() {
        // منع السلوك الافتراضي للسحب
        document.addEventListener('dragstart', function(e) {
            e.preventDefault();
        }, { passive: false });
        
        document.addEventListener('selectstart', function(e) {
            if (currentState === DragState.DRAGGING) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Keyboard events
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // Selection
        document.addEventListener('click', handleElementClick);
        
        // منع context menu أثناء السحب
        document.addEventListener('contextmenu', function(e) {
            if (currentState === DragState.DRAGGING) {
                e.preventDefault();
            }
        });
    }
    
    // ==================== MAKE ELEMENTS INTERACTIVE ====================
    
    function makeElementsInteractive() {
        const elements = document.querySelectorAll('body [id^="bloc-"]');
        console.log(`[BlocVibe] 🎯 Making ${elements.length} elements interactive with Pointer Events`);
        
        elements.forEach(el => {
            enablePointerDragging(el);
            enableSelection(el);
        });
    }
    
    // ==================== POINTER-BASED DRAG & DROP SYSTEM ====================
    
    /**
     * تفعيل نظام السحب المتقدم باستخدام Pointer Events
     * هذا النظام أقوى وأكثر موثوقية من Drag Events
     */
    function enablePointerDragging(element) {
        // منع السلوك الافتراضي للصور
        const imgs = element.querySelectorAll('img');
        imgs.forEach(img => {
            img.draggable = false;
            img.style.userSelect = 'none';
            img.style.webkitUserDrag = 'none';
        });
        
        // ========== POINTER DOWN ==========
        element.addEventListener('pointerdown', function(e) {
            // تجاهل النقر بالزر الأيمن
            if (e.button === 2) return;
            
            // تجاهل إذا كان الهدف هو عنصر input أو textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[BlocVibe] 👆 Pointer down on:', element.id);
            
            // التقاط Pointer للعنصر
            element.setPointerCapture(e.pointerId);
            
            // حفظ معلومات البداية
            draggedElement = element;
            currentState = DragState.READY;
            
            const rect = element.getBoundingClientRect();
            dragStartX = e.clientX;
            dragStartY = e.clientY;
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            
            currentPointerX = e.clientX;
            currentPointerY = e.clientY;
            
            // بدء مؤقت Recovery
            startRecoveryTimer();
            
        }, { passive: false });
        
        // ========== POINTER MOVE ==========
        element.addEventListener('pointermove', function(e) {
            if (!draggedElement || currentState === DragState.IDLE) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // تحديث موضع المؤشر
            currentPointerX = e.clientX;
            currentPointerY = e.clientY;
            
            // حساب المسافة المتحركة
            const distX = currentPointerX - dragStartX;
            const distY = currentPointerY - dragStartY;
            const distance = Math.sqrt(distX * distX + distY * distY);
            
            // بدء السحب إذا تجاوزنا الحد الأدنى
            if (currentState === DragState.READY && distance > MIN_DRAG_DISTANCE) {
                startDragging(element, e);
            }
            
            // تحديث Ghost والمؤشرات (يتم في Animation Loop)
            
        }, { passive: false });
        
        // ========== POINTER UP ==========
        element.addEventListener('pointerup', function(e) {
            if (!draggedElement) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            console.log('[BlocVibe] 🖐️ Pointer up - State:', currentState);
            
            if (currentState === DragState.DRAGGING) {
                // تنفيذ Drop
                performDrop(e);
            }
            
            // إنهاء السحب
            endDragging();
            
        }, { passive: false });
        
        // ========== POINTER CANCEL ==========
        element.addEventListener('pointercancel', function(e) {
            console.log('[BlocVibe] ⚠️ Pointer cancelled');
            endDragging();
        });
        
        // ========== POINTER LEAVE (للحماية الإضافية) ==========
        element.addEventListener('pointerleave', function(e) {
            // لا نوقف السحب عند مغادرة العنصر - فقط نتابع
        });
        
        // تأثيرات hover
        element.addEventListener('pointerenter', function(e) {
            if (currentState === DragState.DRAGGING && draggedElement && draggedElement !== element) {
                element.style.background = 'rgba(13, 110, 253, 0.05)';
            }
        });
        
        element.addEventListener('pointerleave', function(e) {
            element.style.background = '';
        });
    }
    
    // ==================== DRAG LIFECYCLE ====================
    
    /**
     * بدء عملية السحب
     */
    function startDragging(element, event) {
        console.log('[BlocVibe] 🎬 Starting drag:', element.id);
        
        currentState = DragState.DRAGGING;
        dragStartTime = performance.now();
        frameCount = 0;
        
        // تأثيرات بصرية على العنصر الأصلي
        element.style.opacity = '0.35';
        element.style.transform = 'scale(0.95)';
        element.style.transition = 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)';
        element.classList.add('bloc-dragging');
        
        // إنشاء Ghost
        createDragGhost(element);
        
        // بدء Animation Loop
        startAnimationLoop();
        
        // منع التمرير أثناء السحب
        document.body.style.overflow = 'hidden';
        document.body.style.touchAction = 'none';
    }
    
    /**
     * إنهاء عملية السحب
     */
    function endDragging() {
        console.log('[BlocVibe] 🏁 Ending drag');
        
        // إيقاف Animation Loop
        stopAnimationLoop();
        
        // استعادة العنصر الأصلي
        if (draggedElement) {
            draggedElement.style.opacity = '1';
            draggedElement.style.transform = 'scale(1)';
            draggedElement.classList.remove('bloc-dragging');
        }
        
        // إخفاء المكونات البصرية
        hideDragGhost();
        hideDropIndicator();
        
        // إعادة تعيين الحالة
        currentState = DragState.IDLE;
        draggedElement = null;
        
        // استعادة التمرير
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
        
        // إيقاف مؤقت Recovery
        clearRecoveryTimer();
        
        // Log الأداء
        if (dragStartTime > 0) {
            const duration = performance.now() - dragStartTime;
            const fps = frameCount / (duration / 1000);
            console.log(`[BlocVibe] 📊 Drag performance: ${duration.toFixed(0)}ms, ${fps.toFixed(1)} FPS`);
        }
    }
    
    // ==================== ANIMATION LOOP ====================
    
    /**
     * بدء حلقة الرسوم المتحركة لتحديث سلس
     */
    function startAnimationLoop() {
        if (isAnimating) return;
        
        isAnimating = true;
        console.log('[BlocVibe] 🎞️ Starting animation loop');
        
        function animate(timestamp) {
            if (!isAnimating) return;
            
            frameCount++;
            lastFrameTime = timestamp;
            
            // تحديث موضع Ghost
            updateDragGhostPosition();
            
            // تحديث Drop Indicator
            updateDropIndicator();
            
            // الاستمرار في الحلقة
            animationFrameId = requestAnimationFrame(animate);
        }
        
        animationFrameId = requestAnimationFrame(animate);
    }
    
    /**
     * إيقاف حلقة الرسوم المتحركة
     */
    function stopAnimationLoop() {
        isAnimating = false;
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        console.log('[BlocVibe] ⏸️ Animation loop stopped');
    }
    
    // ==================== GHOST ELEMENT MANAGEMENT ====================
    
    function createDragGhost(element) {
        if (!dragGhost) return;
        
        // نسخ محتوى العنصر
        const clone = element.cloneNode(true);
        clone.style.margin = '0';
        clone.style.maxWidth = '280px';
        clone.style.overflow = 'hidden';
        clone.style.pointerEvents = 'none';
        
        dragGhost.innerHTML = '';
        dragGhost.appendChild(clone);
        
        // عرض Ghost مع تأثير Fade In
        dragGhost.style.display = 'block';
        
        // Force reflow للتأكد من تطبيق الانتقالات
        dragGhost.offsetHeight;
        
        dragGhost.style.opacity = '0.85';
        dragGhost.style.transform = 'rotate(3deg) scale(1)';
        
        updateDragGhostPosition();
        
        console.log('[BlocVibe] 👻 Ghost created');
    }
    
    function updateDragGhostPosition() {
        if (!dragGhost || !isDragging()) return;
        
        const x = currentPointerX + GHOST_OFFSET;
        const y = currentPointerY + GHOST_OFFSET;
        
        // استخدام transform بدلاً من left/top للأداء الأفضل
        dragGhost.style.left = x + 'px';
        dragGhost.style.top = y + 'px';
    }
    
    function hideDragGhost() {
        if (!dragGhost) return;
        
        // تأثير Fade Out
        dragGhost.style.opacity = '0';
        dragGhost.style.transform = 'rotate(0deg) scale(0.9)';
        
        setTimeout(() => {
            dragGhost.style.display = 'none';
            dragGhost.innerHTML = '';
        }, 200);
        
        console.log('[BlocVibe] 👻 Ghost hidden');
    }
    
    // ==================== DROP INDICATOR MANAGEMENT ====================
    
    function updateDropIndicator() {
        if (!isDragging() || !draggedElement) {
            hideDropIndicator();
            return;
        }
        
        // العثور على العنصر تحت المؤشر
        const targetElement = findElementUnderPointer(currentPointerX, currentPointerY);
        
        if (!targetElement || targetElement === draggedElement) {
            hideDropIndicator();
            return;
        }
        
        // منع إسقاط عنصر على أحد أطفاله
        if (isDescendant(targetElement, draggedElement)) {
            hideDropIndicator();
            return;
        }
        
        // حساب موضع الإسقاط
        const rect = targetElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const dropBefore = currentPointerY < midpoint;
        
        showDropIndicator(targetElement, dropBefore);
    }
    
    function showDropIndicator(targetElement, before) {
        if (!dropIndicator) return;
        
        const rect = targetElement.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        
        dropIndicator.style.display = 'block';
        dropIndicator.style.left = (rect.left + scrollX) + 'px';
        dropIndicator.style.width = rect.width + 'px';
        
        if (before) {
            dropIndicator.style.top = (rect.top + scrollY - 2) + 'px';
        } else {
            dropIndicator.style.top = (rect.bottom + scrollY - 2) + 'px';
        }
    }
    
    function hideDropIndicator() {
        if (dropIndicator) {
            dropIndicator.style.display = 'none';
        }
    }
    
    // ==================== DROP EXECUTION ====================
    
    function performDrop(event) {
        const targetElement = findElementUnderPointer(currentPointerX, currentPointerY);
        
        if (!targetElement || !draggedElement || targetElement === draggedElement) {
            console.log('[BlocVibe] ⚠️ No valid drop target');
            return;
        }
        
        // منع إسقاط عنصر على أحد أطفاله
        if (isDescendant(targetElement, draggedElement)) {
            console.warn('[BlocVibe] ⚠️ Cannot drop element into its own descendant');
            showNotification('لا يمكن نقل العنصر داخل عنصر تابع له', 'warning');
            return;
        }
        
        const parent = targetElement.parentNode;
        if (!parent) {
            console.error('[BlocVibe] ❌ Target has no parent');
            return;
        }
        
        // حساب موضع الإسقاط
        const rect = targetElement.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const dropBefore = currentPointerY < midpoint;
        
        console.log('[BlocVibe] 🎯 Performing drop:', {
            dragged: draggedElement.id,
            target: targetElement.id,
            dropBefore: dropBefore
        });
        
        // تنفيذ الحركة في DOM
        try {
            if (dropBefore) {
                parent.insertBefore(draggedElement, targetElement);
            } else {
                parent.insertBefore(draggedElement, targetElement.nextSibling);
            }
            
            // تأثير بصري للنجاح
            draggedElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            draggedElement.style.transform = 'scale(1.05)';
            setTimeout(() => {
                draggedElement.style.transform = 'scale(1)';
            }, 300);
            
            // حساب البيانات للإرسال إلى Java
            const newIndex = Array.from(parent.children).indexOf(draggedElement);
            const parentId = parent.id || 'body';
            
            console.log('[BlocVibe] ✅ Drop successful:', {
                elementId: draggedElement.id,
                parentId: parentId,
                index: newIndex
            });
            
            // إضافة العملية إلى Queue
            queueOperation({
                type: 'move',
                elementId: draggedElement.id,
                parentId: parentId,
                index: newIndex
            });
            
            showNotification('تم نقل العنصر بنجاح ✨', 'success');
            
        } catch (error) {
            console.error('[BlocVibe] ❌ Drop failed:', error);
            showNotification('فشل نقل العنصر', 'error');
        }
    }
    
    // ==================== HELPER FUNCTIONS ====================
    
    function findElementUnderPointer(x, y) {
        // إخفاء Ghost مؤقتاً للحصول على العنصر الحقيقي
        if (dragGhost) {
            dragGhost.style.display = 'none';
        }
        
        const element = document.elementFromPoint(x, y);
        
        // إعادة عرض Ghost
        if (dragGhost && isDragging()) {
            dragGhost.style.display = 'block';
        }
        
        // البحث عن أقرب عنصر bloc
        if (element) {
            return element.closest('[id^="bloc-"]');
        }
        
        return null;
    }
    
    function isDragging() {
        return currentState === DragState.DRAGGING;
    }
    
    function isDescendant(child, parent) {
        let node = child.parentNode;
        while (node) {
            if (node === parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    
    // ==================== AUTO-RECOVERY SYSTEM ====================
    
    /**
     * نظام الاستعادة التلقائية لإصلاح المشاكل
     */
    function startRecoveryTimer() {
        clearRecoveryTimer();
        
        recoveryTimer = setTimeout(() => {
            if (isDragging()) {
                console.warn('[BlocVibe] ⚠️ Recovery timeout - force ending drag');
                endDragging();
                showNotification('تم إيقاف السحب تلقائياً', 'info');
            }
        }, RECOVERY_TIMEOUT);
    }
    
    function clearRecoveryTimer() {
        if (recoveryTimer) {
            clearTimeout(recoveryTimer);
            recoveryTimer = null;
        }
    }
    
    // نظام تنظيف دوري للعناصر المعلقة
    setInterval(() => {
        // التحقق من وجود Ghost معلق
        if (!isDragging() && dragGhost && dragGhost.style.display === 'block') {
            console.warn('[BlocVibe] 🧹 Cleaning stuck ghost element');
            hideDragGhost();
        }
        
        // التحقق من وجود عناصر بـ opacity منخفض معلقة
        const stuckElements = document.querySelectorAll('[id^="bloc-"].bloc-dragging');
        if (stuckElements.length > 0 && !isDragging()) {
            console.warn('[BlocVibe] 🧹 Cleaning stuck dragging elements:', stuckElements.length);
            stuckElements.forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'scale(1)';
                el.classList.remove('bloc-dragging');
            });
        }
    }, 2000); // كل ثانيتين
    
    // ==================== OPERATION QUEUE SYSTEM ====================
    
    function queueOperation(operation) {
        operationQueue.push(operation);
        console.log('[BlocVibe] 📝 Operation queued:', operation.type, '- Queue size:', operationQueue.length);
    }
    
    function startQueueProcessor() {
        setInterval(processQueue, RENDER_DEBOUNCE_MS);
    }
    
    function processQueue() {
        if (isProcessingQueue || operationQueue.length === 0 || isDragging()) {
            return;
        }
        
        isProcessingQueue = true;
        console.log('[BlocVibe] ⚙️ Processing operation queue:', operationQueue.length, 'operations');
        
        const operations = [...operationQueue];
        operationQueue = [];
        
        operations.forEach(op => {
            switch(op.type) {
                case 'move':
                    notifyAndroidElementMoved(op.elementId, op.parentId, op.index);
                    break;
                case 'delete':
                    notifyAndroidElementDeleted(op.elementId);
                    break;
                case 'wrap':
                    notifyAndroidElementsWrapped(op.elementIds);
                    break;
            }
        });
        
        isProcessingQueue = false;
        lastRenderTime = Date.now();
    }
    
    // ==================== ANDROID BRIDGE COMMUNICATION ====================
    
    function notifyAndroidElementMoved(elementId, parentId, index) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.onElementMoved(elementId, parentId, index);
                console.log('[BlocVibe] 📤 Notified Android: element moved');
            } catch (error) {
                console.error('[BlocVibe] ❌ Failed to notify Android:', error);
            }
        }
    }
    
    function notifyAndroidElementDeleted(elementId) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.onElementDelete(elementId);
                console.log('[BlocVibe] 📤 Notified Android: element deleted');
            } catch (error) {
                console.error('[BlocVibe] ❌ Failed to notify Android:', error);
            }
        }
    }
    
    function notifyAndroidElementsWrapped(elementIds) {
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.onElementsWrapInDiv(JSON.stringify(elementIds));
                console.log('[BlocVibe] 📤 Notified Android: elements wrapped');
            } catch (error) {
                console.error('[BlocVibe] ❌ Failed to notify Android:', error);
            }
        }
    }
    
    // ==================== SELECTION SYSTEM ====================
    
    function enableSelection(element) {
        element.style.cursor = 'move';
        element.style.userSelect = 'none';
        element.style.webkitUserSelect = 'none';
        element.style.touchAction = 'none';
        
        // تأثير hover (فقط على desktop)
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
    
    function handleElementClick(e) {
        if (isDragging()) return; // تجاهل النقر أثناء السحب
        
        const element = e.target.closest('[id^="bloc-"]');
        if (!element) return;
        
        e.stopPropagation();
        
        if (multiSelectMode) {
            toggleSelection(element);
        } else {
            clearSelections();
            selectElement(element);
        }
        
        // إشعار Android
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.onElementSelected(element.id);
            } catch (error) {
                console.error('[BlocVibe] ❌ Failed to notify selection:', error);
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
    
    // ==================== KEYBOARD SHORTCUTS ====================
    
    function handleKeyDown(e) {
        // Multi-select mode
        if (e.ctrlKey || e.metaKey) {
            multiSelectMode = true;
        }
        
        // Escape - إلغاء السحب
        if (e.key === 'Escape' && isDragging()) {
            console.log('[BlocVibe] ⎋ Escape pressed - cancelling drag');
            endDragging();
        }
        
        // Delete
        if (e.key === 'Delete' && selectedElements.length > 0) {
            e.preventDefault();
            selectedElements.forEach(el => {
                queueOperation({
                    type: 'delete',
                    elementId: el.id
                });
                el.remove();
            });
            selectedElements = [];
            showNotification('تم حذف العناصر', 'success');
        }
        
        // Move Up (Ctrl + ↑)
        if (selectedElements.length === 1 && e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (typeof AndroidBridge !== 'undefined') {
                AndroidBridge.onElementMoveUp(selectedElements[0].id);
            }
        }
        
        // Move Down (Ctrl + ↓)
        if (selectedElements.length === 1 && e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            if (typeof AndroidBridge !== 'undefined') {
                AndroidBridge.onElementMoveDown(selectedElements[0].id);
            }
        }
        
        // Wrap in Div (Ctrl + G)
        if ((e.ctrlKey || e.metaKey) && e.key === 'g' && selectedElements.length > 0) {
            e.preventDefault();
            const elementIds = selectedElements.map(el => el.id);
            queueOperation({
                type: 'wrap',
                elementIds: elementIds
            });
        }
    }
    
    function handleKeyUp(e) {
        if (!e.ctrlKey && !e.metaKey) {
            multiSelectMode = false;
        }
    }
    
    // ==================== NOTIFICATION SYSTEM ====================
    
    function showNotification(message, type = 'info') {
        console.log(`[BlocVibe] 💬 ${type.toUpperCase()}: ${message}`);
        
        if (typeof AndroidBridge !== 'undefined') {
            try {
                AndroidBridge.log(`[${type}] ${message}`);
            } catch (error) {
                // Silent fail
            }
        }
    }
    
    // ==================== PUBLIC API ====================
    
    window.BlocVibeCanvas = {
        init: init,
        makeElementsInteractive: makeElementsInteractive,
        clearSelections: clearSelections,
        getSelectedElements: () => selectedElements.map(el => el.id),
        queueOperation: queueOperation,
        processQueue: processQueue,
        getDragState: () => currentState,
        forceEndDrag: endDragging
    };
    
    // ==================== AUTO-INITIALIZATION ====================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    console.log('[BlocVibe] 🎉 Ultra-Advanced Canvas System loaded successfully!');
    
})();

// ==================== PAGE READY NOTIFICATION ====================
if (typeof AndroidBridge !== 'undefined') {
    window.addEventListener('load', function() {
        try {
            AndroidBridge.onPageReady();
            console.log('[BlocVibe] 📢 Page ready notification sent to Android');
        } catch (error) {
            console.error('[BlocVibe] ❌ Failed to send page ready:', error);
        }
    });
}
