/**
 * BlocVibe Advanced Canvas Interaction System
 * Ultra-powerful drag & drop with ghost elements, smooth animations,
 * and intelligent synchronization
 */

(function() {
    'use strict';
    
    // ==================== STATE MANAGEMENT ====================
    let selectedElements = [];
    let draggedElement = null;
    let dragGhost = null;
    let isDragging = false;
    let dropIndicator = null;
    let multiSelectMode = false;
    let operationQueue = [];
    let isProcessingQueue = false;
    let lastRenderTime = 0;
    const RENDER_DEBOUNCE_MS = 500; // تأخير ذكي لإعادة الرسم
    
    // ==================== INITIALIZATION ====================
    function init() {
        console.log('[BlocVibe] 🚀 Initializing Advanced Canvas System...');
        
        setupDropIndicator();
        setupDragGhost();
        setupEventListeners();
        makeElementsInteractive();
        startQueueProcessor();
        
        console.log('[BlocVibe] ✅ Canvas interaction fully initialized');
    }
    
    // ==================== VISUAL COMPONENTS SETUP ====================
    
    /**
     * إنشاء مؤشر Drop متقدم مع تأثيرات بصرية
     */
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
            transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        document.body.appendChild(dropIndicator);
    }
    
    /**
     * إنشاء Ghost Element للسحب البصري
     */
    function setupDragGhost() {
        dragGhost = document.createElement('div');
        dragGhost.id = 'drag-ghost';
        dragGhost.style.cssText = `
            position: fixed;
            pointer-events: none;
            display: none;
            z-index: 10000;
            opacity: 0.8;
            transform: rotate(2deg);
            transition: transform 0.15s ease;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3),
                        0 2px 8px rgba(0,0,0,0.2);
            border: 2px solid #0D6EFD;
            border-radius: 6px;
            background: white;
            padding: 8px;
            max-width: 300px;
        `;
        document.body.appendChild(dragGhost);
    }
    
    // ==================== EVENT LISTENERS ====================
    
    function setupEventListeners() {
        document.addEventListener('click', handleElementClick);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
        
        // منع التصرف الافتراضي للسحب على الصفحة بأكملها
        document.addEventListener('dragover', function(e) {
            if (isDragging) {
                e.preventDefault();
            }
        });
        
        document.addEventListener('drop', function(e) {
            if (isDragging) {
                e.preventDefault();
            }
        });
    }
    
    // ==================== MAKE ELEMENTS INTERACTIVE ====================
    
    function makeElementsInteractive() {
        const elements = document.querySelectorAll('body [id^="bloc-"]');
        console.log(`[BlocVibe] 🎯 Making ${elements.length} elements interactive`);
        
        elements.forEach(el => {
            enableDragging(el);
            enableSelection(el);
        });
    }
    
    // ==================== DRAG & DROP SYSTEM ====================
    
    /**
     * تفعيل نظام السحب والإفلات المتقدم للعنصر
     */
    function enableDragging(element) {
        element.setAttribute('draggable', 'true');
        
        // ========== DRAG START ==========
        element.addEventListener('dragstart', function(e) {
            draggedElement = element;
            isDragging = true;
            
            // إخفاء العنصر الأصلي مؤقتاً بشفافية
            element.style.opacity = '0.3';
            element.style.transform = 'scale(0.95)';
            element.classList.add('bloc-dragging');
            
            // إنشاء ghost بصري
            createDragGhost(element, e);
            
            // إعداد بيانات النقل
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', element.id);
            
            // إخفاء الصورة الافتراضية للسحب
            if (e.dataTransfer.setDragImage) {
                const emptyImg = document.createElement('img');
                e.dataTransfer.setDragImage(emptyImg, 0, 0);
            }
            
            console.log('[BlocVibe] 🎬 Drag started:', element.id);
        });
        
        // ========== DRAG ==========
        element.addEventListener('drag', function(e) {
            if (!isDragging || !dragGhost) return;
            
            // تحريك Ghost مع المؤشر
            updateDragGhost(e);
        });
        
        // ========== DRAG END ==========
        element.addEventListener('dragend', function(e) {
            console.log('[BlocVibe] 🏁 Drag ended');
            
            // استعادة العنصر الأصلي
            element.style.opacity = '1';
            element.style.transform = 'scale(1)';
            element.classList.remove('bloc-dragging');
            
            // إخفاء المكونات البصرية
            hideDragGhost();
            hideDropIndicator();
            
            // إعادة تعيين الحالة
            isDragging = false;
            draggedElement = null;
        });
        
        // ========== DRAG OVER ==========
        element.addEventListener('dragover', function(e) {
            if (!isDragging || !draggedElement || draggedElement === element) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            
            // حساب موضع الإسقاط (قبل أو بعد)
            const rect = element.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const dropBefore = e.clientY < midpoint;
            
            // عرض مؤشر الإسقاط
            showDropIndicator(element, dropBefore);
            
            // تأثير hover على العنصر المستهدف
            element.style.background = 'rgba(13, 110, 253, 0.05)';
        });
        
        // ========== DRAG LEAVE ==========
        element.addEventListener('dragleave', function(e) {
            element.style.background = '';
        });
        
        // ========== DROP ==========
        element.addEventListener('drop', function(e) {
            if (!isDragging || !draggedElement || draggedElement === element) {
                return;
            }
            
            e.preventDefault();
            e.stopPropagation();
            
            // إزالة تأثير hover
            element.style.background = '';
            
            console.log('[BlocVibe] 📍 Drop detected on:', element.id);
            
            // حساب موضع الإسقاط
            const rect = element.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const dropBefore = e.clientY < midpoint;
            
            // تنفيذ عملية الإسقاط
            performDrop(draggedElement, element, dropBefore);
        });
    }
    
    // ==================== DRAG GHOST FUNCTIONS ====================
    
    function createDragGhost(element, event) {
        if (!dragGhost) return;
        
        // نسخ محتوى العنصر
        const clone = element.cloneNode(true);
        clone.style.margin = '0';
        clone.style.maxWidth = '280px';
        clone.style.overflow = 'hidden';
        
        dragGhost.innerHTML = '';
        dragGhost.appendChild(clone);
        
        // عرض Ghost
        dragGhost.style.display = 'block';
        updateDragGhost(event);
    }
    
    function updateDragGhost(event) {
        if (!dragGhost || !event.clientX) return;
        
        const x = event.clientX + 15;
        const y = event.clientY + 15;
        
        dragGhost.style.left = x + 'px';
        dragGhost.style.top = y + 'px';
    }
    
    function hideDragGhost() {
        if (dragGhost) {
            dragGhost.style.display = 'none';
            dragGhost.innerHTML = '';
        }
    }
    
    // ==================== DROP INDICATOR FUNCTIONS ====================
    
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
    
    /**
     * تنفيذ عملية الإسقاط بشكل ذكي
     */
    function performDrop(draggedEl, targetEl, dropBefore) {
        console.log('[BlocVibe] 🎯 Performing drop:', {
            dragged: draggedEl.id,
            target: targetEl.id,
            dropBefore: dropBefore
        });
        
        // التحقق من صحة العملية
        if (!draggedEl || !targetEl) {
            console.error('[BlocVibe] ❌ Invalid drop operation');
            return;
        }
        
        // منع إسقاط عنصر على نفسه أو على أحد أطفاله
        if (isDescendant(targetEl, draggedEl)) {
            console.warn('[BlocVibe] ⚠️ Cannot drop element into its own descendant');
            showNotification('لا يمكن نقل العنصر داخل عنصر تابع له', 'warning');
            return;
        }
        
        const parent = targetEl.parentNode;
        if (!parent) {
            console.error('[BlocVibe] ❌ Target has no parent');
            return;
        }
        
        // تنفيذ الحركة في DOM محلياً (فوراً للاستجابة السريعة)
        try {
            if (dropBefore) {
                parent.insertBefore(draggedEl, targetEl);
            } else {
                parent.insertBefore(draggedEl, targetEl.nextSibling);
            }
            
            // تأثير بصري للنجاح
            draggedEl.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            draggedEl.style.transform = 'scale(1.05)';
            setTimeout(() => {
                draggedEl.style.transform = 'scale(1)';
            }, 300);
            
            // حساب البيانات للإرسال إلى Java
            const newIndex = Array.from(parent.children).indexOf(draggedEl);
            const parentId = parent.id || 'body';
            
            console.log('[BlocVibe] ✅ Drop successful - notifying Android:', {
                elementId: draggedEl.id,
                parentId: parentId,
                index: newIndex
            });
            
            // إضافة العملية إلى Queue بدلاً من الإرسال المباشر
            queueOperation({
                type: 'move',
                elementId: draggedEl.id,
                parentId: parentId,
                index: newIndex
            });
            
            showNotification('تم نقل العنصر بنجاح', 'success');
            
        } catch (error) {
            console.error('[BlocVibe] ❌ Drop failed:', error);
            showNotification('فشل نقل العنصر', 'error');
        }
    }
    
    // ==================== OPERATION QUEUE SYSTEM ====================
    
    /**
     * نظام Queue متقدم لمعالجة العمليات بشكل متزامن
     */
    function queueOperation(operation) {
        operationQueue.push(operation);
        console.log('[BlocVibe] 📝 Operation queued:', operation.type, '- Queue size:', operationQueue.length);
    }
    
    function startQueueProcessor() {
        setInterval(processQueue, RENDER_DEBOUNCE_MS);
    }
    
    function processQueue() {
        if (isProcessingQueue || operationQueue.length === 0 || isDragging) {
            return;
        }
        
        isProcessingQueue = true;
        console.log('[BlocVibe] ⚙️ Processing operation queue:', operationQueue.length, 'operations');
        
        // معالجة جميع العمليات دفعة واحدة
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
        
        // تأثير hover
        element.addEventListener('mouseenter', function() {
            if (!isDragging && !selectedElements.includes(element)) {
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
    
    function handleElementClick(e) {
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
    
    // ==================== UTILITY FUNCTIONS ====================
    
    /**
     * التحقق من أن عنصر هو تابع لعنصر آخر
     */
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
    
    /**
     * عرض إشعار بصري
     */
    function showNotification(message, type = 'info') {
        console.log(`[BlocVibe] 💬 ${type.toUpperCase()}: ${message}`);
        
        // يمكن إضافة toast notification هنا إذا لزم الأمر
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
        processQueue: processQueue
    };
    
    // ==================== AUTO-INITIALIZATION ====================
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
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
