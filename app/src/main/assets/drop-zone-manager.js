/**
 * BlocVibe DropZoneManager v3.0
 * ==============================
 * نظام إدارة مناطق الإسقاط الذكية مع Visual Feedback
 * يحسب ويعرض أماكن الإسقاط المتاحة مع مؤشرات بصرية متقدمة
 * 
 * أنواع Drop Zones المدعومة:
 * - INSERTION: إدراج بين العناصر
 * - POSITIONING: وضع relative للعناصر (above/below/left/right)
 * - CONTAINER: إسقاط داخل containers
 * - REPLACEMENT: استبدال عنصر بآخر
 */

(function() {
    'use strict';
    
    // ==================== ENUMS & CONSTANTS ====================
    
    /**
     * أنواع Drop Zones
     */
    const DropZoneType = Object.freeze({
        INSERTION: 'insertion',        // إدراج بين عناصر
        ABOVE: 'above',               // فوق عنصر معين
        BELOW: 'below',               // تحت عنصر معين
        LEFT: 'left',                 // يسار عنصر معين
        RIGHT: 'right',               // يمين عنصر معين
        CONTAINER: 'container',        // داخل container
        REPLACEMENT: 'replacement'     // استبدال عنصر
    });
    
    /**
     * حالات Drop Zone
     */
    const ZoneState = Object.freeze({
        INACTIVE: 'inactive',
        HIGHLIGHTED: 'highlighted',
        ACCEPTING: 'accepting',
        REJECTING: 'rejecting'
    });
    
    /**
     * إعدادات Visual Feedback
     */
    const VISUAL_CONFIG = {
        INSERTION_HEIGHT: 4,          // ارتفاع insertion indicator
        POSITIONING_ZONE_SIZE: 25,    // حجم positioning zones
        HIGHLIGHT_ANIMATION_DURATION: 200,
        FEEDBACK_COLORS: {
            ACCEPT: '#0D6EFD',        // أزرق للقبول
            REJECT: '#DC3545',        // أحمر للرفض
            HIGHLIGHT: '#FFC107'      // أصفر للتمييز
        },
        Z_INDEX: {
            DROP_ZONE: 9998,
            INSERTION_INDICATOR: 9999,
            POSITIONING_INDICATOR: 10000
        }
    };
    
    // ==================== CLASS DEFINITION ====================
    
    class DropZoneManager {
        constructor() {
            this.activeZones = new Map();           // Zone ID → Zone Object
            this.highlightedZone = null;            // Current highlighted zone
            this.draggedElement = null;             // Current dragged element
            this.targetContainer = null;            // Current target container
            this.visualIndicators = new Map();     // Visual feedback elements
            this.zoneCounter = 0;                   // Unique zone ID generator
            
            // Performance optimization
            this.lastCalculationTime = 0;
            this.calculationThrottle = 16;          // ~60 FPS
            this.intersectionObserver = null;
            
            // Event callbacks
            this.onZoneHighlightCallbacks = [];
            this.onZoneActivateCallbacks = [];
            this.onDropCallbacks = [];
            
            this.init();
        }
        
        // ==================== INITIALIZATION ====================
        
        init() {
            console.log('[DropZoneManager] 🎯 Initializing Drop Zone Management System...');
            this.setupIntersectionObserver();
            this.createBaseIndicators();
            console.log('[DropZoneManager] ✅ Drop zone system ready');
        }
        
        setupIntersectionObserver() {
            // لمراقبة رؤية Drop Zones للأداء
            this.intersectionObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const zoneId = entry.target.dataset.zoneId;
                    const zone = this.activeZones.get(zoneId);
                    if (zone) {
                        zone.isVisible = entry.isIntersecting;
                    }
                });
            }, {
                threshold: 0.1,
                rootMargin: '50px'
            });
        }
        
        createBaseIndicators() {
            // إنشاء العناصر الأساسية للمؤشرات البصرية
            this.insertionIndicator = this.createInsertionIndicator();
            this.positioningIndicator = this.createPositioningIndicator();
            
            // إضافة CSS styles
            this.injectStyles();
        }
        
        createInsertionIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-insertion-indicator';
            indicator.style.cssText = `
                position: absolute;
                height: ${VISUAL_CONFIG.INSERTION_HEIGHT}px;
                background: linear-gradient(90deg, ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT}, #0984e3);
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.INSERTION_INDICATOR};
                border-radius: 2px;
                box-shadow: 0 0 15px rgba(13, 110, 253, 0.8);
                transition: all ${VISUAL_CONFIG.HIGHLIGHT_ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
                will-change: transform, opacity, width;
            `;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        createPositioningIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-positioning-indicator';
            indicator.style.cssText = `
                position: absolute;
                background: ${VISUAL_CONFIG.FEEDBACK_COLORS.HIGHLIGHT};
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.POSITIONING_INDICATOR};
                border: 2px dashed #fff;
                border-radius: 4px;
                opacity: 0.8;
                transition: all ${VISUAL_CONFIG.HIGHLIGHT_ANIMATION_DURATION}ms ease-out;
                will-change: transform, opacity;
            `;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        injectStyles() {
            if (document.getElementById('bloc-dropzone-styles')) return;
            
            const styles = document.createElement('style');
            styles.id = 'bloc-dropzone-styles';
            styles.textContent = `
                .bloc-drop-zone {
                    position: absolute;
                    pointer-events: none;
                    transition: all 150ms ease-out;
                    border-radius: 3px;
                }
                
                .bloc-drop-zone.highlighted {
                    background: rgba(13, 110, 253, 0.15);
                    border: 2px dashed ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT};
                    animation: blocZonePulse 1s infinite;
                }
                
                .bloc-drop-zone.accepting {
                    background: rgba(13, 110, 253, 0.25);
                    border-color: ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT};
                    box-shadow: 0 0 20px rgba(13, 110, 253, 0.4);
                }
                
                .bloc-drop-zone.rejecting {
                    background: rgba(220, 53, 69, 0.15);
                    border-color: ${VISUAL_CONFIG.FEEDBACK_COLORS.REJECT};
                    animation: blocZoneShake 0.5s;
                }
                
                @keyframes blocZonePulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(1.02); }
                }
                
                @keyframes blocZoneShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                }
                
                .bloc-container-highlight {
                    outline: 3px dashed ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT};
                    outline-offset: -3px;
                    background: rgba(13, 110, 253, 0.05);
                }
            `;
            document.head.appendChild(styles);
        }
        
        // ==================== DROP ZONE CREATION ====================
        
        /**
         * إنشاء drop zones للعنصر المسحوب
         */
        createDropZonesForDrag(draggedElement, mode = 'INTERNAL') {
            this.clearAllZones();
            this.draggedElement = draggedElement;
            
            const containers = this.findPotentialContainers(draggedElement);
            const zones = [];
            
            for (const container of containers) {
                zones.push(...this.createZonesForContainer(container, draggedElement, mode));
            }
            
            // إنشاء positioning zones للعناصر المجاورة
            if (mode === 'INTERNAL' || mode === 'POSITIONING') {
                zones.push(...this.createPositioningZones(draggedElement));
            }
            
            // تفعيل Zones
            this.activateZones(zones);
            
            console.log(`[DropZoneManager] 🎯 Created ${zones.length} drop zones`);
            return zones;
        }
        
        /**
         * العثور على Containers المحتملة للإسقاط
         */
        findPotentialContainers(draggedElement) {
            const containers = [];
            
            // البحث في الـ Canvas
            const canvasContainers = document.querySelectorAll('.canvas-container, .webview-container, [data-bloc-id]');
            canvasContainers.forEach(container => {
                // تجنب إسقاط العنصر في نفسه أو في أطفاله
                if (!this.isDescendantOf(container, draggedElement) && container !== draggedElement) {
                    containers.push(container);
                }
            });
            
            // إضافة DIV containers
            const divContainers = document.querySelectorAll('div[data-bloc-id], .flex-container');
            divContainers.forEach(container => {
                if (!this.isDescendantOf(container, draggedElement) && container !== draggedElement) {
                    containers.push(container);
                }
            });
            
            return Array.from(new Set(containers)); // إزالة التكرار
        }
        
        /**
         * إنشاء zones لـ container محدد
         */
        createZonesForContainer(container, draggedElement, mode) {
            const zones = [];
            const containerRect = container.getBoundingClientRect();
            const children = Array.from(container.children).filter(child => \n                child !== draggedElement && \n                !child.classList.contains('bloc-insertion-indicator') &&\n                !child.classList.contains('bloc-positioning-indicator')\n            );\n            \n            // Container drop zone (للإسقاط داخل container)\n            if (this.canAcceptChild(container, draggedElement)) {\n                zones.push(this.createContainerZone(container, draggedElement));\n            }\n            \n            // Insertion zones (بين العناصر)\n            for (let i = 0; i <= children.length; i++) {\n                const insertionZone = this.createInsertionZone(container, i, children, draggedElement);\n                if (insertionZone) {\n                    zones.push(insertionZone);\n                }\n            }\n            \n            return zones;\n        }\n        \n        /**\n         * إنشاء positioning zones (above/below/left/right)\n         */\n        createPositioningZones(draggedElement) {\n            const zones = [];\n            const siblings = this.getSiblingElements(draggedElement);\n            \n            siblings.forEach(sibling => {\n                zones.push(...this.createPositioningZonesForElement(sibling, draggedElement));\n            });\n            \n            return zones;\n        }\n        \n        createPositioningZonesForElement(targetElement, draggedElement) {\n            const zones = [];\n            const rect = targetElement.getBoundingClientRect();\n            const zoneSize = VISUAL_CONFIG.POSITIONING_ZONE_SIZE;\n            \n            // Above zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.ABOVE,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left,\n                    y: rect.top - zoneSize,\n                    width: rect.width,\n                    height: zoneSize\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'above'),\n                state: ZoneState.INACTIVE\n            });\n            \n            // Below zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.BELOW,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left,\n                    y: rect.bottom,\n                    width: rect.width,\n                    height: zoneSize\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'below'),\n                state: ZoneState.INACTIVE\n            });\n            \n            // Left zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.LEFT,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left - zoneSize,\n                    y: rect.top,\n                    width: zoneSize,\n                    height: rect.height\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'left'),\n                state: ZoneState.INACTIVE\n            });\n            \n            // Right zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.RIGHT,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.right,\n                    y: rect.top,\n                    width: zoneSize,\n                    height: rect.height\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'right'),\n                state: ZoneState.INACTIVE\n            });\n            \n            return zones.filter(zone => zone.isValid);\n        }\n        \n        createContainerZone(container, draggedElement) {\n            const rect = container.getBoundingClientRect();\n            \n            return {\n                id: this.generateZoneId(),\n                type: DropZoneType.CONTAINER,\n                targetElement: container,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left,\n                    y: rect.top,\n                    width: rect.width,\n                    height: rect.height\n                },\n                isValid: this.canAcceptChild(container, draggedElement),\n                state: ZoneState.INACTIVE\n            };\n        }\n        \n        createInsertionZone(container, index, children, draggedElement) {\n            const containerRect = container.getBoundingClientRect();\n            let bounds;\n            \n            if (children.length === 0) {\n                // Empty container\n                bounds = {\n                    x: containerRect.left + 5,\n                    y: containerRect.top + 5,\n                    width: containerRect.width - 10,\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            } else if (index === 0) {\n                // Before first child\n                const firstChild = children[0].getBoundingClientRect();\n                bounds = {\n                    x: firstChild.left,\n                    y: firstChild.top - VISUAL_CONFIG.INSERTION_HEIGHT / 2,\n                    width: firstChild.width,\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            } else if (index === children.length) {\n                // After last child\n                const lastChild = children[children.length - 1].getBoundingClientRect();\n                bounds = {\n                    x: lastChild.left,\n                    y: lastChild.bottom + VISUAL_CONFIG.INSERTION_HEIGHT / 2,\n                    width: lastChild.width,\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            } else {\n                // Between children\n                const prevChild = children[index - 1].getBoundingClientRect();\n                const nextChild = children[index].getBoundingClientRect();\n                bounds = {\n                    x: Math.min(prevChild.left, nextChild.left),\n                    y: (prevChild.bottom + nextChild.top) / 2 - VISUAL_CONFIG.INSERTION_HEIGHT / 2,\n                    width: Math.max(prevChild.width, nextChild.width),\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            }\n            \n            return {\n                id: this.generateZoneId(),\n                type: DropZoneType.INSERTION,\n                targetElement: container,\n                draggedElement: draggedElement,\n                insertionIndex: index,\n                bounds: bounds,\n                isValid: this.canInsertAtIndex(container, draggedElement, index),\n                state: ZoneState.INACTIVE\n            };\n        }\n        \n        // ==================== ZONE MANAGEMENT ====================\n        \n        activateZones(zones) {\n            zones.forEach(zone => {\n                this.activeZones.set(zone.id, zone);\n                this.createZoneVisualElement(zone);\n            });\n        }\n        \n        createZoneVisualElement(zone) {\n            const element = document.createElement('div');\n            element.className = 'bloc-drop-zone';\n            element.dataset.zoneId = zone.id;\n            element.dataset.zoneType = zone.type;\n            \n            // تطبيق موقع وحجم\n            element.style.cssText = `\n                left: ${zone.bounds.x}px;\n                top: ${zone.bounds.y}px;\n                width: ${zone.bounds.width}px;\n                height: ${zone.bounds.height}px;\n                z-index: ${VISUAL_CONFIG.Z_INDEX.DROP_ZONE};\n            `;\n            \n            // إضافة للـ observer\n            this.intersectionObserver.observe(element);\n            \n            document.body.appendChild(element);\n            this.visualIndicators.set(zone.id, element);\n        }\n        \n        clearAllZones() {\n            // إزالة Visual elements\n            this.visualIndicators.forEach(element => {\n                this.intersectionObserver.unobserve(element);\n                element.remove();\n            });\n            \n            this.visualIndicators.clear();\n            this.activeZones.clear();\n            this.highlightedZone = null;\n            \n            // إخفاء indicators\n            this.hideAllIndicators();\n        }\n        \n        // ==================== INTERACTION HANDLING ====================\n        \n        /**\n         * معالجة حركة المؤشر لتحديد Zone المناسب\n         */\n        handlePointerMove(x, y) {\n            const now = performance.now();\n            if (now - this.lastCalculationTime < this.calculationThrottle) {\n                return; // Throttle للأداء\n            }\n            this.lastCalculationTime = now;\n            \n            const zone = this.findZoneAtPoint(x, y);\n            \n            if (zone !== this.highlightedZone) {\n                if (this.highlightedZone) {\n                    this.unhighlightZone(this.highlightedZone);\n                }\n                \n                if (zone) {\n                    this.highlightZone(zone);\n                }\n                \n                this.highlightedZone = zone;\n            }\n        }\n        \n        findZoneAtPoint(x, y) {\n            let bestZone = null;\n            let bestScore = -1;\n            \n            this.activeZones.forEach(zone => {\n                if (!zone.isVisible) return;\n                \n                const bounds = zone.bounds;\n                if (x >= bounds.x && x <= bounds.x + bounds.width &&\n                    y >= bounds.y && y <= bounds.y + bounds.height) {\n                    \n                    // تحديد أولوية الـ zones\n                    const score = this.calculateZonePriority(zone, x, y);\n                    if (score > bestScore) {\n                        bestScore = score;\n                        bestZone = zone;\n                    }\n                }\n            });\n            \n            return bestZone;\n        }\n        \n        calculateZonePriority(zone, x, y) {\n            // Insertion zones لها أولوية أعلى\n            if (zone.type === DropZoneType.INSERTION) return 10;\n            \n            // Positioning zones لها أولوية متوسطة\n            if ([DropZoneType.ABOVE, DropZoneType.BELOW, DropZoneType.LEFT, DropZoneType.RIGHT].includes(zone.type)) {\n                return 8;\n            }\n            \n            // Container zones لها أولوية منخفضة\n            if (zone.type === DropZoneType.CONTAINER) return 5;\n            \n            return 1;\n        }\n        \n        highlightZone(zone) {\n            if (!zone || !zone.isValid) return;\n            \n            zone.state = ZoneState.HIGHLIGHTED;\n            \n            const visualElement = this.visualIndicators.get(zone.id);\n            if (visualElement) {\n                visualElement.classList.add('highlighted');\n            }\n            \n            // إظهار indicator مناسب\n            this.showIndicatorForZone(zone);\n            \n            // إشعار callbacks\n            this.notifyZoneHighlight(zone);\n            \n            console.log(`[DropZoneManager] 🔆 Highlighted zone: ${zone.type}`);\n        }\n        \n        unhighlightZone(zone) {\n            if (!zone) return;\n            \n            zone.state = ZoneState.INACTIVE;\n            \n            const visualElement = this.visualIndicators.get(zone.id);\n            if (visualElement) {\n                visualElement.classList.remove('highlighted', 'accepting', 'rejecting');\n            }\n            \n            this.hideAllIndicators();\n        }\n        \n        showIndicatorForZone(zone) {\n            this.hideAllIndicators();\n            \n            switch (zone.type) {\n                case DropZoneType.INSERTION:\n                    this.showInsertionIndicator(zone);\n                    break;\n                    \n                case DropZoneType.ABOVE:\n                case DropZoneType.BELOW:\n                case DropZoneType.LEFT:\n                case DropZoneType.RIGHT:\n                    this.showPositioningIndicator(zone);\n                    break;\n                    \n                case DropZoneType.CONTAINER:\n                    this.showContainerIndicator(zone);\n                    break;\n            }\n        }\n        \n        showInsertionIndicator(zone) {\n            const indicator = this.insertionIndicator;\n            indicator.style.left = zone.bounds.x + 'px';\n            indicator.style.top = zone.bounds.y + 'px';\n            indicator.style.width = zone.bounds.width + 'px';\n            indicator.style.display = 'block';\n            \n            // Animation\n            indicator.style.transform = 'scaleX(0)';\n            requestAnimationFrame(() => {\n                indicator.style.transform = 'scaleX(1)';\n            });\n        }\n        \n        showPositioningIndicator(zone) {\n            const indicator = this.positioningIndicator;\n            indicator.style.left = zone.bounds.x + 'px';\n            indicator.style.top = zone.bounds.y + 'px';\n            indicator.style.width = zone.bounds.width + 'px';\n            indicator.style.height = zone.bounds.height + 'px';\n            indicator.style.display = 'block';\n            \n            // تغيير لون حسب الاتجاه\n            const colors = {\n                above: '#FF6B6B',\n                below: '#4ECDC4',\n                left: '#45B7D1',\n                right: '#FFA07A'\n            };\n            indicator.style.background = colors[zone.type] || VISUAL_CONFIG.FEEDBACK_COLORS.HIGHLIGHT;\n        }\n        \n        showContainerIndicator(zone) {\n            const container = zone.targetElement;\n            container.classList.add('bloc-container-highlight');\n            \n            // إزالة التمييز بعد فترة\n            setTimeout(() => {\n                container.classList.remove('bloc-container-highlight');\n            }, 2000);\n        }\n        \n        hideAllIndicators() {\n            this.insertionIndicator.style.display = 'none';\n            this.positioningIndicator.style.display = 'none';\n            \n            // إزالة container highlights\n            document.querySelectorAll('.bloc-container-highlight').forEach(el => {\n                el.classList.remove('bloc-container-highlight');\n            });\n        }\n        \n        // ==================== DROP HANDLING ====================\n        \n        /**\n         * معالجة عملية الإسقاط\n         */\n        handleDrop(x, y) {\n            const zone = this.findZoneAtPoint(x, y);\n            \n            if (!zone || !zone.isValid) {\n                this.showDropRejection();\n                return null;\n            }\n            \n            // تطبيق drop animation\n            this.showDropAcceptance(zone);\n            \n            // إشعار callbacks\n            this.notifyDrop(zone);\n            \n            console.log(`[DropZoneManager] 🎯 Drop completed on zone: ${zone.type}`);\n            \n            return {\n                zone: zone,\n                position: this.calculateDropPosition(zone),\n                metadata: this.generateDropMetadata(zone)\n            };\n        }\n        \n        calculateDropPosition(zone) {\n            switch (zone.type) {\n                case DropZoneType.INSERTION:\n                    return {\n                        parentId: zone.targetElement.id || zone.targetElement.dataset.blocId,\n                        index: zone.insertionIndex,\n                        type: 'insertion'\n                    };\n                    \n                case DropZoneType.ABOVE:\n                case DropZoneType.BELOW:\n                case DropZoneType.LEFT:\n                case DropZoneType.RIGHT:\n                    return {\n                        targetElementId: zone.targetElement.id || zone.targetElement.dataset.blocId,\n                        position: zone.type,\n                        type: 'positioning'\n                    };\n                    \n                case DropZoneType.CONTAINER:\n                    return {\n                        parentId: zone.targetElement.id || zone.targetElement.dataset.blocId,\n                        index: -1, // آخر موضع\n                        type: 'container'\n                    };\n            }\n        }\n        \n        generateDropMetadata(zone) {\n            return {\n                zoneId: zone.id,\n                zoneType: zone.type,\n                timestamp: Date.now(),\n                draggedElementId: zone.draggedElement.id || zone.draggedElement.dataset.blocId,\n                targetElementId: zone.targetElement.id || zone.targetElement.dataset.blocId\n            };\n        }\n        \n        showDropAcceptance(zone) {\n            const visualElement = this.visualIndicators.get(zone.id);\n            if (visualElement) {\n                visualElement.classList.add('accepting');\n                \n                setTimeout(() => {\n                    visualElement.classList.remove('accepting');\n                }, 500);\n            }\n        }\n        \n        showDropRejection() {\n            if (this.highlightedZone) {\n                const visualElement = this.visualIndicators.get(this.highlightedZone.id);\n                if (visualElement) {\n                    visualElement.classList.add('rejecting');\n                    \n                    setTimeout(() => {\n                        visualElement.classList.remove('rejecting');\n                    }, 500);\n                }\n            }\n        }\n        \n        // ==================== VALIDATION METHODS ====================\n        \n        canAcceptChild(container, child) {\n            // Basic validation\n            if (!container || !child) return false;\n            if (container === child) return false;\n            if (this.isDescendantOf(container, child)) return false;\n            \n            // Type-specific validation\n            const containerTag = container.tagName.toLowerCase();\n            const childTag = child.tagName.toLowerCase();\n            \n            // Prevent invalid nesting\n            if (containerTag === 'button' && ['button', 'a'].includes(childTag)) return false;\n            if (containerTag === 'a' && ['button', 'a'].includes(childTag)) return false;\n            \n            return true;\n        }\n        \n        canInsertAtIndex(container, element, index) {\n            return this.canAcceptChild(container, element);\n        }\n        \n        canPositionRelative(element, targetElement, position) {\n            if (!element || !targetElement) return false;\n            if (element === targetElement) return false;\n            \n            const parent = targetElement.parentElement;\n            if (!parent) return false;\n            \n            // تحقق من إمكانية positioning\n            if (['left', 'right'].includes(position)) {\n                // يحتاج horizontal layout\n                return parent.style.display === 'flex' || parent.classList.contains('flex-container');\n            }\n            \n            return true;\n        }\n        \n        isDescendantOf(ancestor, descendant) {\n            let current = descendant.parentElement;\n            while (current) {\n                if (current === ancestor) return true;\n                current = current.parentElement;\n            }\n            return false;\n        }\n        \n        getSiblingElements(element) {\n            const parent = element.parentElement;\n            if (!parent) return [];\n            \n            return Array.from(parent.children).filter(child => \n                child !== element && \n                !child.classList.contains('bloc-insertion-indicator') &&\n                !child.classList.contains('bloc-positioning-indicator')\n            );\n        }\n        \n        // ==================== UTILITY METHODS ====================\n        \n        generateZoneId() {\n            return `zone-${++this.zoneCounter}-${Date.now()}`;\n        }\n        \n        // ==================== CALLBACK MANAGEMENT ====================\n        \n        onZoneHighlight(callback) {\n            this.onZoneHighlightCallbacks.push(callback);\n        }\n        \n        onZoneActivate(callback) {\n            this.onZoneActivateCallbacks.push(callback);\n        }\n        \n        onDrop(callback) {\n            this.onDropCallbacks.push(callback);\n        }\n        \n        notifyZoneHighlight(zone) {\n            this.onZoneHighlightCallbacks.forEach(callback => {\n                try {\n                    callback(zone);\n                } catch (error) {\n                    console.error('[DropZoneManager] Error in zone highlight callback:', error);\n                }\n            });\n        }\n        \n        notifyDrop(zone) {\n            this.onDropCallbacks.forEach(callback => {\n                try {\n                    callback(zone);\n                } catch (error) {\n                    console.error('[DropZoneManager] Error in drop callback:', error);\n                }\n            });\n        }\n        \n        // ==================== PUBLIC API ====================\n        \n        getActiveZones() {\n            return Array.from(this.activeZones.values());\n        }\n        \n        getHighlightedZone() {\n            return this.highlightedZone;\n        }\n        \n        forceHighlightZone(zoneId) {\n            const zone = this.activeZones.get(zoneId);\n            if (zone) {\n                this.highlightZone(zone);\n                this.highlightedZone = zone;\n            }\n        }\n        \n        getPerformanceInfo() {\n            return {\n                activeZonesCount: this.activeZones.size,\n                lastCalculationTime: this.lastCalculationTime,\n                throttleInterval: this.calculationThrottle\n            };\n        }\n        \n        // Debug methods\n        debugShowAllZones() {\n            this.activeZones.forEach(zone => {\n                const element = this.visualIndicators.get(zone.id);\n                if (element) {\n                    element.style.background = 'rgba(255, 0, 0, 0.3)';\n                    element.style.border = '1px solid red';\n                    element.style.pointerEvents = 'none';\n                }\n            });\n        }\n        \n        debugHideAllZones() {\n            this.clearAllZones();\n        }\n    }\n    \n    // ==================== GLOBAL EXPORT ====================\n    \n    // إنشاء instance عام\n    window.BlocVibeDropZoneManager = new DropZoneManager();\n    \n    // تصدير الأنواع للاستخدام في ملفات أخرى\n    window.BlocVibeDropZoneType = DropZoneType;\n    window.BlocVibeZoneState = ZoneState;\n    \n    console.log('[DropZoneManager] 🌟 DropZoneManager loaded and ready!');\n    \n})();