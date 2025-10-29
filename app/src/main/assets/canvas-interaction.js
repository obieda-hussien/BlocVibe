/**
 * BlocVibe Advanced Canvas Interaction Script
 * Provides drag & drop, multi-selection, and real-time element manipulation
 */

(function() {
    'use strict';
    
    let selectedElements = [];
    let draggedElement = null;
    let isDragging = false;
    let dropIndicator = null;
    let multiSelectMode = false;
    
    // Initialize when document is ready
    function init() {
        setupDropIndicator();
        setupEventListeners();
        makeElementsInteractive();
        console.log('[BlocVibe] Canvas interaction initialized');
    }
    
    // Create drop indicator
    function setupDropIndicator() {
        dropIndicator = document.createElement('div');
        dropIndicator.id = 'drop-indicator';
        dropIndicator.style.cssText = `
            position: absolute;
            height: 3px;
            background: #0D6EFD;
            pointer-events: none;
            display: none;
            z-index: 9999;
            box-shadow: 0 0 5px rgba(13, 110, 253, 0.5);
        `;
        document.body.appendChild(dropIndicator);
    }
    
    // Setup event listeners
    function setupEventListeners() {
        document.addEventListener('click', handleElementClick);
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keyup', handleKeyUp);
    }
    
    // Make all body elements interactive
    function makeElementsInteractive() {
        const elements = document.querySelectorAll('body [id^="bloc-"]');
        elements.forEach(el => {
            enableDragging(el);
            enableSelection(el);
        });
    }
    
    // Enable dragging for element
    function enableDragging(element) {
        element.setAttribute('draggable', 'true');
        
        element.addEventListener('dragstart', function(e) {
            draggedElement = element;
            isDragging = true;
            element.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', element.outerHTML);
            
            // Add dragging class for styling
            element.classList.add('bloc-dragging');
            
            console.log('[BlocVibe] Drag started:', element.id);
        });
        
        element.addEventListener('dragend', function(e) {
            element.style.opacity = '1';
            element.classList.remove('bloc-dragging');
            dropIndicator.style.display = 'none';
            isDragging = false;
            draggedElement = null;
        });
        
        element.addEventListener('dragover', function(e) {
            if (!isDragging || !draggedElement) return;
            
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Show drop indicator
            const rect = element.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const dropBefore = e.clientY < midpoint;
            
            showDropIndicator(element, dropBefore);
        });
        
        element.addEventListener('drop', function(e) {
            if (!isDragging || !draggedElement) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            // Determine drop position
            const rect = element.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            const dropBefore = e.clientY < midpoint;
            
            // Check if dropping into a container (div with children)
            const isContainer = element.tagName.toLowerCase() === 'div' && 
                               element.children.length > 0;
            
            if (isContainer && element !== draggedElement) {
                // Drop inside container
                element.appendChild(draggedElement);
                console.log('[BlocVibe] Dropped inside container:', element.id);
                notifyElementMoved(draggedElement.id, element.id, element.children.length - 1);
            } else {
                // Drop before/after element
                if (element.parentNode && draggedElement !== element) {
                    if (dropBefore) {
                        element.parentNode.insertBefore(draggedElement, element);
                    } else {
                        element.parentNode.insertBefore(draggedElement, element.nextSibling);
                    }
                    
                    const newIndex = Array.from(element.parentNode.children).indexOf(draggedElement);
                    const parentId = element.parentNode.id || 'root';
                    
                    console.log('[BlocVibe] Dropped at position:', newIndex);
                    notifyElementMoved(draggedElement.id, parentId, newIndex);
                }
            }
            
            dropIndicator.style.display = 'none';
        });
    }
    
    // Enable selection for element
    function enableSelection(element) {
        element.style.cursor = 'pointer';
        
        // Add hover effect
        element.addEventListener('mouseenter', function() {
            if (!isDragging) {
                element.style.outline = '1px dashed #0D6EFD';
            }
        });
        
        element.addEventListener('mouseleave', function() {
            if (!selectedElements.includes(element)) {
                element.style.outline = 'none';
            }
        });
    }
    
    // Handle element click
    function handleElementClick(e) {
        const element = e.target.closest('[id^="bloc-"]');
        if (!element) return;
        
        e.stopPropagation();
        
        if (multiSelectMode) {
            // Multi-select mode
            toggleSelection(element);
        } else {
            // Single select mode - clear others first
            clearSelections();
            selectElement(element);
        }
        
        // Notify Android
        if (typeof AndroidBridge !== 'undefined') {
            AndroidBridge.onElementSelected(element.id);
        }
    }
    
    // Handle keyboard shortcuts
    function handleKeyDown(e) {
        // Ctrl/Cmd for multi-select
        if (e.ctrlKey || e.metaKey) {
            multiSelectMode = true;
        }
        
        // Delete key
        if (e.key === 'Delete' && selectedElements.length > 0) {
            e.preventDefault();
            const elementIds = selectedElements.map(el => el.id);
            console.log('[BlocVibe] Delete elements:', elementIds);
            
            if (typeof AndroidBridge !== 'undefined') {
                elementIds.forEach(id => AndroidBridge.onElementDelete(id));
            }
        }
        
        // Arrow keys for moving elements
        if (selectedElements.length === 1) {
            if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (typeof AndroidBridge !== 'undefined') {
                    AndroidBridge.onElementMoveUp(selectedElements[0].id);
                }
            } else if (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (typeof AndroidBridge !== 'undefined') {
                    AndroidBridge.onElementMoveDown(selectedElements[0].id);
                }
            }
        }
        
        // Ctrl+D for duplicate
        if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedElements.length === 1) {
            e.preventDefault();
            if (typeof AndroidBridge !== 'undefined') {
                AndroidBridge.onElementDuplicate(selectedElements[0].id);
            }
        }
        
        // Ctrl+G for wrapping in div
        if ((e.ctrlKey || e.metaKey) && e.key === 'g' && selectedElements.length > 0) {
            e.preventDefault();
            const elementIds = selectedElements.map(el => el.id);
            if (typeof AndroidBridge !== 'undefined') {
                AndroidBridge.onElementsWrapInDiv(JSON.stringify(elementIds));
            }
        }
    }
    
    function handleKeyUp(e) {
        if (!e.ctrlKey && !e.metaKey) {
            multiSelectMode = false;
        }
    }
    
    // Show drop indicator
    function showDropIndicator(targetElement, before) {
        const rect = targetElement.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        
        dropIndicator.style.display = 'block';
        dropIndicator.style.left = (rect.left + scrollX) + 'px';
        dropIndicator.style.width = rect.width + 'px';
        
        if (before) {
            dropIndicator.style.top = (rect.top + scrollY - 2) + 'px';
        } else {
            dropIndicator.style.top = (rect.bottom + scrollY - 1) + 'px';
        }
    }
    
    // Selection functions
    function selectElement(element) {
        if (selectedElements.includes(element)) return;
        
        selectedElements.push(element);
        element.classList.add('bloc-selected');
        element.style.outline = '2px solid #0D6EFD';
        element.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
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
    
    // Notify Android of element movement
    function notifyElementMoved(elementId, newParentId, index) {
        if (typeof AndroidBridge !== 'undefined') {
            AndroidBridge.onElementMoved(elementId, newParentId, index);
        }
    }
    
    // Public API
    window.BlocVibeCanvas = {
        init: init,
        makeElementsInteractive: makeElementsInteractive,
        clearSelections: clearSelections,
        getSelectedElements: () => selectedElements.map(el => el.id)
    };
    
    // Auto-initialize when loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

// Notify Android that page is ready
if (typeof AndroidBridge !== 'undefined') {
    window.addEventListener('load', function() {
        AndroidBridge.onPageReady();
    });
}
