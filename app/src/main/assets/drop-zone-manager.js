/**
 * BlocVibe DropZoneManager v4.0 - SMART DROP ZONES
 * ================================================
 * نظام إدارة مناطق الإسقاط الذكية المتقدمة مع Visual Feedback
 * يحسب ويعرض أماكن الإسقاط المتاحة مع مؤشرات بصرية متطورة
 * 
 * أنواع Drop Zones المدعومة:
 * - INSERTION: إدراج بين العناصر
 * - ABOVE/BELOW/LEFT/RIGHT: وضع relative للعناصر مع Smart Sizing
 * - CONTAINER: إسقاط داخل containers مع Auto-Detection
 * - BOUNDARY: مناطق حدود الـ Canvas
 * - ELEMENT_SPECIFIC: مناطق خاصة حسب نوع العنصر
 * - ALIGNMENT: zones المحاذاة (left/center/right)
 * - MOMENTUM: zones تعتمد على حركة المؤشر
 */

(function() {
    'use strict';
    
    // ==================== ENUMS & CONSTANTS ====================
    
    /**
     * أنواع Drop Zones المتطورة
     */
    const DropZoneType = Object.freeze({
        INSERTION: 'insertion',        // إدراج بين عناصر
        ABOVE: 'above',               // فوق عنصر معين
        BELOW: 'below',               // تحت عنصر معين
        LEFT: 'left',                 // يسار عنصر معين
        RIGHT: 'right',               // يمين عنصر معين
        CONTAINER: 'container',        // داخل container
        REPLACEMENT: 'replacement',    // استبدال عنصر
        BOUNDARY: 'boundary',          // zones حدود الـ Canvas
        ELEMENT_SPECIFIC: 'element_specific', // zones خاصة حسب نوع العنصر
        ALIGNMENT_LEFT: 'alignment_left',     // محاذاة يسار
        ALIGNMENT_CENTER: 'alignment_center', // محاذاة وسط
        ALIGNMENT_RIGHT: 'alignment_right',   // محاذاة يمين
        MOMENTUM_ZONE: 'momentum_zone',       // zone تعتمد على الزخم
        SNAP_TO_GRID: 'snap_to_grid'          // zone شبكية
    });
    
    /**
     * حالات Drop Zone
     */
    const ZoneState = Object.freeze({
        INACTIVE: 'inactive',
        HOVER: 'hover',
        HIGHLIGHTED: 'highlighted',
        ACTIVE: 'active',
        ACCEPTING: 'accepting',
        REJECTING: 'rejecting'
    });
    
    /**
     * إعدادات Visual Feedback المتطورة
     */
    const VISUAL_CONFIG = {
        INSERTION_HEIGHT: 4,          // ارتفاع insertion indicator
        POSITIONING_ZONE_SIZE: 25,    // حجم positioning zones الأساسي
        SMART_ZONE_SIZE: {
            MIN: 20,                  // الحد الأدنى للحجم
            MAX: 80,                  // الحد الأقصى للحجم
            SCALE_FACTOR: 0.1         // عامل التدرج حسب حجم العنصر
        },
        MOMENTUM: {
            SPEED_THRESHOLD: 2,       // عتبة السرعة للتفعيل
            DECAY_RATE: 0.9,          // معدل تلاشي الزخم
            SIZING_MULTIPLIER: 1.5    // مضاعف الحجم للزخم العالي
        },
        VISUAL_FEEDBACK: {
            IDLE_OPACITY: 0.3,
            HOVER_OPACITY: 0.6,
            ACTIVE_OPACITY: 0.9,
            HIGHLIGHT_SCALE: 1.05,
            ANIMATION_DURATION: 200
        },
        CONTAINER_CAPACITY: {
            MIN_VISIBLE_ELEMENTS: 3,   // عدد العناصر الأدنى للظهور
            OVERFLOW_THRESHOLD: 0.8,   // عتبة الامتلاء للتحذير
            AUTO_DETECTION: true
        },
        SNAP_TO_GRID: {
            ENABLED: true,
            GRID_SIZE: 8,             // حجم الشبكة بالبكسل
            MAGNETIC_DISTANCE: 15     // مسافة الانجذاب
        },
        FEEDBACK_COLORS: {
            ACCEPT: '#0D6EFD',        // أزرق للقبول
            REJECT: '#DC3545',        // أحمر للرفض
            HIGHLIGHT: '#FFC107',     // أصفر للتمييز
            CONTAINER_OVERFLOW: '#FD7E14', // برتقالي للامتلاء
            BOUNDARY: '#6F42C1',      // بنفسجي للحدود
            ALIGNMENT: '#20C997',     // أخضر للمحاذاة
            MOMENTUM: '#E83E8C',      // وردي للزخم
            ELEMENT_SPECIFIC: '#17A2B8' // سماوي للعناصر الخاصة
        },
        Z_INDEX: {
            DROP_ZONE: 9998,
            INSERTION_INDICATOR: 9999,
            POSITIONING_INDICATOR: 10000,
            SMART_ZONES: 9997,
            CONTEXTUAL_ZONES: 9996,
            OVERFLOW_INDICATORS: 10001
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
            
            // Smart Features
            this.momentumTracker = {
                positions: [],
                timestamp: 0,
                velocity: { x: 0, y: 0 },
                acceleration: { x: 0, y: 0 }
            };
            this.canvasBounds = null;               // حدود الـ Canvas
            this.containerCapacities = new Map();   // سعة الـ Containers
            this.alignmentZones = [];               // zones المحاذاة
            this.snapToGridEnabled = VISUAL_CONFIG.SNAP_TO_GRID.ENABLED;
            
            // Event callbacks
            this.onZoneHighlightCallbacks = [];
            this.onZoneActivateCallbacks = [];
            this.onDropCallbacks = [];
            
            this.init();
        }
        
        // ==================== INITIALIZATION ====================
        
        init() {
            console.log('[DropZoneManager] 🎯 Initializing Smart Drop Zone Management System v4.0...');
            this.setupIntersectionObserver();
            this.detectCanvasBounds();
            this.createBaseIndicators();
            this.createSmartVisualIndicators();
            this.injectAdvancedStyles();
            console.log('[DropZoneManager] ✅ Smart Drop zone system ready');
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
        
        detectCanvasBounds() {
            // تحديد حدود الـ Canvas
            const canvas = document.querySelector('.canvas-container, .webview-container');
            if (canvas) {
                this.canvasBounds = canvas.getBoundingClientRect();
                console.log('[DropZoneManager] 📐 Canvas bounds detected:', this.canvasBounds);
            }
        }
        
        createBaseIndicators() {
            // إنشاء العناصر الأساسية للمؤشرات البصرية
            this.insertionIndicator = this.createInsertionIndicator();
            this.positioningIndicator = this.createPositioningIndicator();
            
            // إضافة CSS styles
            this.injectStyles();
        }
        
        createSmartVisualIndicators() {
            // إنشاء المؤشرات الذكية المتقدمة
            this.momentumIndicator = this.createMomentumIndicator();
            this.overflowIndicator = this.createOverflowIndicator();
            this.boundaryIndicator = this.createBoundaryIndicator();
            this.alignmentIndicator = this.createAlignmentIndicator();
            this.snapGridIndicator = this.createSnapGridIndicator();
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
        
        // ============ SMART VISUAL INDICATORS ============
        
        createMomentumIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-momentum-indicator';
            indicator.style.cssText = `
                position: absolute;
                background: linear-gradient(45deg, ${VISUAL_CONFIG.FEEDBACK_COLORS.MOMENTUM}, ${VISUAL_CONFIG.FEEDBACK_COLORS.HIGHLIGHT});
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.SMART_ZONES};
                border-radius: 50%;
                opacity: 0.7;
                transition: all 150ms ease-out;
                will-change: transform, opacity, width, height;
            `;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        createOverflowIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-overflow-indicator';
            indicator.style.cssText = `
                position: absolute;
                background: ${VISUAL_CONFIG.FEEDBACK_COLORS.CONTAINER_OVERFLOW};
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.OVERFLOW_INDICATORS};
                border: 2px solid #fff;
                border-radius: 4px;
                opacity: 0.8;
                animation: blocOverflowPulse 2s infinite;
            `;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        createBoundaryIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-boundary-indicator';
            indicator.style.cssText = `
                position: absolute;
                background: ${VISUAL_CONFIG.FEEDBACK_COLORS.BOUNDARY};
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.CONTEXTUAL_ZONES};
                border: 2px dashed rgba(255,255,255,0.6);
                opacity: 0.5;
                transition: all 200ms ease-out;
            `;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        createAlignmentIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-alignment-indicator';
            indicator.style.cssText = `
                position: absolute;
                background: ${VISUAL_CONFIG.FEEDBACK_COLORS.ALIGNMENT};
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.CONTEXTUAL_ZONES};
                border: 2px solid #fff;
                border-radius: 2px;
                opacity: 0.6;
                transition: all 150ms ease-out;
            `;
            document.body.appendChild(indicator);
            return indicator;
        }
        
        createSnapGridIndicator() {
            const indicator = document.createElement('div');
            indicator.className = 'bloc-snap-grid-indicator';
            indicator.style.cssText = `
                position: absolute;
                pointer-events: none;
                display: none;
                z-index: ${VISUAL_CONFIG.Z_INDEX.CONTEXTUAL_ZONES};
                background-image: 
                    linear-gradient(to right, rgba(13, 110, 253, 0.3) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(13, 110, 253, 0.3) 1px, transparent 1px);
                background-size: ${VISUAL_CONFIG.SNAP_TO_GRID.GRID_SIZE}px ${VISUAL_CONFIG.SNAP_TO_GRID.GRID_SIZE}px;
                opacity: 0.4;
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
                
                .bloc-drop-zone.idle {
                    opacity: ${VISUAL_CONFIG.VISUAL_FEEDBACK.IDLE_OPACITY};
                    transform: scale(0.95);
                }
                
                .bloc-drop-zone.hover {
                    opacity: ${VISUAL_CONFIG.VISUAL_FEEDBACK.HOVER_OPACITY};
                    transform: scale(1.0);
                }
                
                .bloc-drop-zone.highlighted {
                    background: rgba(13, 110, 253, 0.15);
                    border: 2px dashed ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT};
                    animation: blocZonePulse 1s infinite;
                    opacity: ${VISUAL_CONFIG.VISUAL_FEEDBACK.HIGHLIGHT_SCALE};
                }
                
                .bloc-drop-zone.active {
                    opacity: ${VISUAL_CONFIG.VISUAL_FEEDBACK.ACTIVE_OPACITY};
                    transform: scale(${VISUAL_CONFIG.VISUAL_FEEDBACK.HIGHLIGHT_SCALE});
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
                
                /* Smart Sizing Zones */
                .bloc-smart-zone {
                    transition: all ${VISUAL_CONFIG.VISUAL_FEEDBACK.ANIMATION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(4px);
                    border: 2px solid transparent;
                }
                
                .bloc-smart-zone.momentum {
                    border-color: ${VISUAL_CONFIG.FEEDBACK_COLORS.MOMENTUM};
                    box-shadow: 0 0 15px rgba(232, 62, 140, 0.6);
                }
                
                /* Container Overflow */
                .bloc-container-overflow {
                    background: rgba(253, 126, 20, 0.1);
                    border: 2px solid ${VISUAL_CONFIG.FEEDBACK_COLORS.CONTAINER_OVERFLOW};
                    animation: blocOverflowPulse 2s infinite;
                }
                
                /* Boundary Zones */
                .bloc-boundary-zone {
                    background: rgba(111, 66, 193, 0.1);
                    border: 2px dashed ${VISUAL_CONFIG.FEEDBACK_COLORS.BOUNDARY};
                    position: relative;
                }
                
                .bloc-boundary-zone::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    background: linear-gradient(45deg, ${VISUAL_CONFIG.FEEDBACK_COLORS.BOUNDARY}, transparent, ${VISUAL_CONFIG.FEEDBACK_COLORS.BOUNDARY});
                    border-radius: inherit;
                    opacity: 0.3;
                    z-index: -1;
                }
                
                /* Alignment Zones */
                .bloc-alignment-zone {
                    background: rgba(32, 201, 151, 0.1);
                    border: 2px solid ${VISUAL_CONFIG.FEEDBACK_COLORS.ALIGNMENT};
                    position: relative;
                }
                
                .bloc-alignment-zone.left::after {
                    content: '←';
                    position: absolute;
                    left: 4px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: ${VISUAL_CONFIG.FEEDBACK_COLORS.ALIGNMENT};
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .bloc-alignment-zone.center::after {
                    content: '↕';
                    position: absolute;
                    top: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    color: ${VISUAL_CONFIG.FEEDBACK_COLORS.ALIGNMENT};
                    font-weight: bold;
                    font-size: 12px;
                }
                
                .bloc-alignment-zone.right::after {
                    content: '→';
                    position: absolute;
                    right: 4px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: ${VISUAL_CONFIG.FEEDBACK_COLORS.ALIGNMENT};
                    font-weight: bold;
                    font-size: 12px;
                }
                
                /* Element Specific Zones */
                .bloc-element-specific-zone {
                    background: rgba(23, 162, 184, 0.1);
                    border: 2px solid ${VISUAL_CONFIG.FEEDBACK_COLORS.ELEMENT_SPECIFIC};
                }
                
                /* Animations */
                @keyframes blocZonePulse {
                    0%, 100% { opacity: 0.6; transform: scale(1); }
                    50% { opacity: 0.9; transform: scale(${VISUAL_CONFIG.VISUAL_FEEDBACK.HIGHLIGHT_SCALE}); }
                }
                
                @keyframes blocZoneShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-3px); }
                    75% { transform: translateX(3px); }
                }
                
                @keyframes blocOverflowPulse {
                    0%, 100% { 
                        opacity: 0.6;
                        box-shadow: 0 0 10px rgba(253, 126, 20, 0.4);
                    }
                    50% { 
                        opacity: 0.9;
                        box-shadow: 0 0 20px rgba(253, 126, 20, 0.8);
                    }
                }
                
                /* Snap to Grid */
                .bloc-snap-zone {
                    background-image: 
                        linear-gradient(to right, ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT}20 1px, transparent 1px),
                        linear-gradient(to bottom, ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT}20 1px, transparent 1px);
                    background-size: ${VISUAL_CONFIG.SNAP_TO_GRID.GRID_SIZE}px ${VISUAL_CONFIG.SNAP_TO_GRID.GRID_SIZE}px;
                    position: relative;
                }
                
                .bloc-container-highlight {
                    outline: 3px dashed ${VISUAL_CONFIG.FEEDBACK_COLORS.ACCEPT};
                    outline-offset: -3px;
                    background: rgba(13, 110, 253, 0.05);
                    transition: all 200ms ease;
                }
                
                .bloc-container-overflow-warning {
                    outline: 3px solid ${VISUAL_CONFIG.FEEDBACK_COLORS.CONTAINER_OVERFLOW};
                    background: rgba(253, 126, 20, 0.1);
                }
                
                /* Momentum Effects */
                .bloc-high-momentum {
                    animation: blocHighMomentumGlow 1s infinite;
                }
                
                @keyframes blocHighMomentumGlow {
                    0%, 100% { 
                        box-shadow: 0 0 5px ${VISUAL_CONFIG.FEEDBACK_COLORS.MOMENTUM}40;
                    }
                    50% { 
                        box-shadow: 0 0 20px ${VISUAL_CONFIG.FEEDBACK_COLORS.MOMENTUM}80, 0 0 30px ${VISUAL_CONFIG.FEEDBACK_COLORS.MOMENTUM}40;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        injectAdvancedStyles() {
            // Inject additional advanced styles if needed
            console.log('[DropZoneManager] 🎨 Advanced styles injected');
        }
        
        // ==================== DROP ZONE CREATION ====================
        
        /**
         * إنشاء drop zones للعنصر المسحوب مع Smart Features
         */
        createDropZonesForDrag(draggedElement, mode = 'INTERNAL') {
            this.clearAllZones();
            this.draggedElement = draggedElement;
            
            // تحديث momentum tracking
            this.resetMomentumTracking();
            
            const containers = this.findPotentialContainers(draggedElement);
            const zones = [];
            
            for (const container of containers) {
                zones.push(...this.createZonesForContainer(container, draggedElement, mode));
            }
            
            // إنشاء positioning zones للعناصر المجاورة مع Smart Sizing
            if (mode === 'INTERNAL' || mode === 'POSITIONING') {
                zones.push(...this.createSmartPositioningZones(draggedElement));
            }
            
            // إنشاء Contextual Zones
            zones.push(...this.createBoundaryZones(draggedElement));
            zones.push(...this.createAlignmentZones(draggedElement));
            zones.push(...this.createElementSpecificZones(draggedElement));
            
            // إنشاء Snap to Grid Zones
            if (this.snapToGridEnabled) {
                zones.push(...this.createSnapToGridZones(draggedElement));
            }
            
            // تفعيل Zones
            this.activateZones(zones);
            
            console.log(`[DropZoneManager] 🎯 Created ${zones.length} smart drop zones`);
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
            const children = Array.from(container.children).filter(child => \n                child !== draggedElement && \n                !child.classList.contains('bloc-insertion-indicator') &&\n                !child.classList.contains('bloc-positioning-indicator')\n            );\n            \n            // Container drop zone (للإسقاط داخل container)\n            if (this.canAcceptChild(container, draggedElement)) {\n                zones.push(this.createContainerZone(container, draggedElement));\n            }\n            \n            // Insertion zones (بين العناصر)\n            for (let i = 0; i <= children.length; i++) {\n                const insertionZone = this.createInsertionZone(container, i, children, draggedElement);\n                if (insertionZone) {\n                    zones.push(insertionZone);\n                }\n            }\n            \n            return zones;\n        }\n        \n        /**\n         * إنشاء positioning zones (above/below/left/right)\n         */\n        createPositioningZones(draggedElement) {\n            const zones = [];\n            const siblings = this.getSiblingElements(draggedElement);\n            \n            siblings.forEach(sibling => {\n                zones.push(...this.createPositioningZonesForElement(sibling, draggedElement));\n            });\n            \n            return zones;\n        }\n        \n        createPositioningZonesForElement(targetElement, draggedElement) {\n            const zones = [];\n            const rect = targetElement.getBoundingClientRect();\n            const zoneSize = VISUAL_CONFIG.POSITIONING_ZONE_SIZE;\n            \n            // Above zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.ABOVE,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left,\n                    y: rect.top - zoneSize,\n                    width: rect.width,\n                    height: zoneSize\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'above'),\n                state: ZoneState.INACTIVE\n            });\n            \n            // Below zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.BELOW,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left,\n                    y: rect.bottom,\n                    width: rect.width,\n                    height: zoneSize\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'below'),\n                state: ZoneState.INACTIVE\n            });\n            \n            // Left zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.LEFT,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left - zoneSize,\n                    y: rect.top,\n                    width: zoneSize,\n                    height: rect.height\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'left'),\n                state: ZoneState.INACTIVE\n            });\n            \n            // Right zone\n            zones.push({\n                id: this.generateZoneId(),\n                type: DropZoneType.RIGHT,\n                targetElement: targetElement,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.right,\n                    y: rect.top,\n                    width: zoneSize,\n                    height: rect.height\n                },\n                isValid: this.canPositionRelative(draggedElement, targetElement, 'right'),\n                state: ZoneState.INACTIVE\n            });\n            \n            return zones.filter(zone => zone.isValid);\n        }\n        \n        createContainerZone(container, draggedElement) {\n            const rect = container.getBoundingClientRect();\n            \n            return {\n                id: this.generateZoneId(),\n                type: DropZoneType.CONTAINER,\n                targetElement: container,\n                draggedElement: draggedElement,\n                bounds: {\n                    x: rect.left,\n                    y: rect.top,\n                    width: rect.width,\n                    height: rect.height\n                },\n                isValid: this.canAcceptChild(container, draggedElement),\n                state: ZoneState.INACTIVE\n            };\n        }\n        \n        createInsertionZone(container, index, children, draggedElement) {\n            const containerRect = container.getBoundingClientRect();\n            let bounds;\n            \n            if (children.length === 0) {\n                // Empty container\n                bounds = {\n                    x: containerRect.left + 5,\n                    y: containerRect.top + 5,\n                    width: containerRect.width - 10,\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            } else if (index === 0) {\n                // Before first child\n                const firstChild = children[0].getBoundingClientRect();\n                bounds = {\n                    x: firstChild.left,\n                    y: firstChild.top - VISUAL_CONFIG.INSERTION_HEIGHT / 2,\n                    width: firstChild.width,\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            } else if (index === children.length) {\n                // After last child\n                const lastChild = children[children.length - 1].getBoundingClientRect();\n                bounds = {\n                    x: lastChild.left,\n                    y: lastChild.bottom + VISUAL_CONFIG.INSERTION_HEIGHT / 2,\n                    width: lastChild.width,\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            } else {\n                // Between children\n                const prevChild = children[index - 1].getBoundingClientRect();\n                const nextChild = children[index].getBoundingClientRect();\n                bounds = {\n                    x: Math.min(prevChild.left, nextChild.left),\n                    y: (prevChild.bottom + nextChild.top) / 2 - VISUAL_CONFIG.INSERTION_HEIGHT / 2,\n                    width: Math.max(prevChild.width, nextChild.width),\n                    height: VISUAL_CONFIG.INSERTION_HEIGHT\n                };\n            }\n            \n            return {\n                id: this.generateZoneId(),\n                type: DropZoneType.INSERTION,\n                targetElement: container,\n                draggedElement: draggedElement,\n                insertionIndex: index,\n                bounds: bounds,\n                isValid: this.canInsertAtIndex(container, draggedElement, index),\n                state: ZoneState.INACTIVE\n            };\n        }\n        \n        // ==================== ZONE MANAGEMENT ====================\n        \n        activateZones(zones) {\n            zones.forEach(zone => {\n                this.activeZones.set(zone.id, zone);\n                this.createZoneVisualElement(zone);\n            });\n        }\n        \n        createZoneVisualElement(zone) {\n            const element = document.createElement('div');\n            element.className = 'bloc-drop-zone';\n            element.dataset.zoneId = zone.id;\n            element.dataset.zoneType = zone.type;\n            \n            // تطبيق موقع وحجم\n            element.style.cssText = `\n                left: ${zone.bounds.x}px;\n                top: ${zone.bounds.y}px;\n                width: ${zone.bounds.width}px;\n                height: ${zone.bounds.height}px;\n                z-index: ${VISUAL_CONFIG.Z_INDEX.DROP_ZONE};\n            `;\n            \n            // إضافة للـ observer\n            this.intersectionObserver.observe(element);\n            \n            document.body.appendChild(element);\n            this.visualIndicators.set(zone.id, element);\n        }\n        \n        clearAllZones() {\n            // إزالة Visual elements\n            this.visualIndicators.forEach(element => {\n                this.intersectionObserver.unobserve(element);\n                element.remove();\n            });\n            \n            this.visualIndicators.clear();\n            this.activeZones.clear();\n            this.highlightedZone = null;\n            \n            // إخفاء indicators\n            this.hideAllIndicators();\n        }\n        \n        // ==================== SMART METHODS ====================
        
        /**
         * إعادة تعيين momentum tracking
         */
        resetMomentumTracking() {
            this.momentumTracker = {
                positions: [],
                timestamp: performance.now(),
                velocity: { x: 0, y: 0 },
                acceleration: { x: 0, y: 0 }
            };
        }
        
        /**
         * تحديث momentum tracking
         */
        updateMomentumTracking(x, y) {
            const now = performance.now();
            const deltaTime = now - this.momentumTracker.timestamp;
            
            // إضافة الموقع الجديد
            this.momentumTracker.positions.push({ x, y, timestamp: now });
            
            // الاحتفاظ بآخر 5 مواقع فقط
            if (this.momentumTracker.positions.length > 5) {
                this.momentumTracker.positions.shift();
            }
            
            // حساب السرعة
            if (this.momentumTracker.positions.length >= 2) {
                const last = this.momentumTracker.positions[this.momentumTracker.positions.length - 1];
                const secondLast = this.momentumTracker.positions[this.momentumTracker.positions.length - 2];
                
                const deltaX = last.x - secondLast.x;
                const deltaY = last.y - secondLast.y;
                const deltaTimeSec = deltaTime / 1000;
                
                this.momentumTracker.velocity.x = deltaX / deltaTimeSec;
                this.momentumTracker.velocity.y = deltaY / deltaTimeSec;
            }
            
            this.momentumTracker.timestamp = now;
            
            // حساب التسارع
            this.updateAcceleration();
        }
        
        /**
         * تحديث التسارع
         */
        updateAcceleration() {
            if (this.momentumTracker.positions.length >= 3) {
                const last = this.momentumTracker.positions[this.momentumTracker.positions.length - 1];
                const secondLast = this.momentumTracker.positions[this.momentumTracker.positions.length - 2];
                const thirdLast = this.momentumTracker.positions[this.momentumTracker.positions.length - 3];
                
                const v1 = {
                    x: (secondLast.x - thirdLast.x) / (secondLast.timestamp - thirdLast.timestamp),
                    y: (secondLast.y - thirdLast.y) / (secondLast.timestamp - thirdLast.timestamp)
                };
                
                const v2 = {
                    x: (last.x - secondLast.x) / (last.timestamp - secondLast.timestamp),
                    y: (last.y - secondLast.y) / (last.timestamp - secondLast.timestamp)
                };
                
                this.momentumTracker.acceleration.x = (v2.x - v1.x) / (last.timestamp - thirdLast.timestamp) * 1000;
                this.momentumTracker.acceleration.y = (v2.y - v1.y) / (last.timestamp - thirdLast.timestamp) * 1000;
            }
        }
        
        /**
         * حساب السرعة الإجمالية
         */
        getMomentumSpeed() {
            const v = this.momentumTracker.velocity;
            return Math.sqrt(v.x * v.x + v.y * v.y);
        }
        
        /**
         * التحقق من وجود زخم عالي
         */
        hasHighMomentum() {
            return this.getMomentumSpeed() > VISUAL_CONFIG.MOMENTUM.SPEED_THRESHOLD;
        }
        
        // ==================== SMART POSITIONING ZONES ====================
        
        /**
         * إنشاء Smart Positioning Zones مع Smart Sizing
         */
        createSmartPositioningZones(draggedElement) {
            const zones = [];
            const siblings = this.getSiblingElements(draggedElement);
            
            siblings.forEach(sibling => {
                zones.push(...this.createSmartPositioningZonesForElement(sibling, draggedElement));
            });
            
            return zones;
        }
        
        createSmartPositioningZonesForElement(targetElement, draggedElement) {
            const zones = [];
            const rect = targetElement.getBoundingClientRect();
            const momentumSpeed = this.getMomentumSpeed();
            
            // حساب Smart Zone Size
            const baseSize = VISUAL_CONFIG.POSITIONING_ZONE_SIZE;
            const targetSize = rect.width * VISUAL_CONFIG.SMART_ZONE_SIZE.SCALE_FACTOR;
            const dynamicSize = Math.max(VISUAL_CONFIG.SMART_ZONE_SIZE.MIN, 
                                       Math.min(VISUAL_CONFIG.SMART_ZONE_SIZE.MAX, targetSize));
            
            // تعديل الحجم حسب الزخم
            let finalSize = dynamicSize;
            if (this.hasHighMomentum()) {
                finalSize = dynamicSize * VISUAL_CONFIG.MOMENTUM.SIZING_MULTIPLIER;
            }
            
            // Above zone مع Smart Sizing
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.ABOVE,
                targetElement: targetElement,
                draggedElement: draggedElement,
                bounds: {
                    x: rect.left,
                    y: rect.top - finalSize,
                    width: rect.width,
                    height: finalSize
                },
                smartSize: finalSize,
                momentumEnhanced: this.hasHighMomentum(),
                isValid: this.canPositionRelative(draggedElement, targetElement, 'above'),
                state: ZoneState.INACTIVE
            });
            
            // Below zone
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.BELOW,
                targetElement: targetElement,
                draggedElement: draggedElement,
                bounds: {
                    x: rect.left,
                    y: rect.bottom,
                    width: rect.width,
                    height: finalSize
                },
                smartSize: finalSize,
                momentumEnhanced: this.hasHighMomentum(),
                isValid: this.canPositionRelative(draggedElement, targetElement, 'below'),
                state: ZoneState.INACTIVE
            });
            
            // Left zone
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.LEFT,
                targetElement: targetElement,
                draggedElement: draggedElement,
                bounds: {
                    x: rect.left - finalSize,
                    y: rect.top,
                    width: finalSize,
                    height: rect.height
                },
                smartSize: finalSize,
                momentumEnhanced: this.hasHighMomentum(),
                isValid: this.canPositionRelative(draggedElement, targetElement, 'left'),
                state: ZoneState.INACTIVE
            });
            
            // Right zone
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.RIGHT,
                targetElement: targetElement,
                draggedElement: draggedElement,
                bounds: {
                    x: rect.right,
                    y: rect.top,
                    width: finalSize,
                    height: rect.height
                },
                smartSize: finalSize,
                momentumEnhanced: this.hasHighMomentum(),
                isValid: this.canPositionRelative(draggedElement, targetElement, 'right'),
                state: ZoneState.INACTIVE
            });
            
            return zones.filter(zone => zone.isValid);
        }
        
        // ==================== CONTEXTUAL ZONES ====================
        
        /**
         * إنشاء Boundary Zones عند حدود الـ Canvas
         */
        createBoundaryZones(draggedElement) {
            const zones = [];
            
            if (!this.canvasBounds) {
                this.detectCanvasBounds();
            }
            
            if (!this.canvasBounds) return zones;
            
            const margin = 20; // هامش من حدود الـ Canvas
            const { left, top, right, bottom, width, height } = this.canvasBounds;
            
            // Top Boundary
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.BOUNDARY,
                position: 'top',
                draggedElement: draggedElement,
                bounds: {
                    x: left,
                    y: top,
                    width: width,
                    height: margin
                },
                isValid: true,
                state: ZoneState.INACTIVE
            });
            
            // Bottom Boundary
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.BOUNDARY,
                position: 'bottom',
                draggedElement: draggedElement,
                bounds: {
                    x: left,
                    y: bottom - margin,
                    width: width,
                    height: margin
                },
                isValid: true,
                state: ZoneState.INACTIVE
            });
            
            // Left Boundary
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.BOUNDARY,
                position: 'left',
                draggedElement: draggedElement,
                bounds: {
                    x: left,
                    y: top,
                    width: margin,
                    height: height
                },
                isValid: true,
                state: ZoneState.INACTIVE
            });
            
            // Right Boundary
            zones.push({
                id: this.generateZoneId(),
                type: DropZoneType.BOUNDARY,
                position: 'right',
                draggedElement: draggedElement,
                bounds: {
                    x: right - margin,
                    y: top,
                    width: margin,
                    height: height
                },
                isValid: true,
                state: ZoneState.INACTIVE
            });
            
            return zones;
        }
        
        /**
         * إنشاء Alignment Zones
         */
        createAlignmentZones(draggedElement) {
            const zones = [];
            const siblings = this.getSiblingElements(draggedElement);
            
            siblings.forEach(sibling => {
                const rect = sibling.getBoundingClientRect();
                
                // Left Alignment
                zones.push({
                    id: this.generateZoneId(),
                    type: DropZoneType.ALIGNMENT_LEFT,
                    targetElement: sibling,
                    draggedElement: draggedElement,
                    bounds: {
                        x: rect.left - 2,
                        y: rect.top,
                        width: 4,
                        height: rect.height
                    },
                    isValid: this.canAlignWithElement(draggedElement, sibling, 'left'),
                    state: ZoneState.INACTIVE
                });
                
                // Center Alignment
                const centerX = rect.left + rect.width / 2;
                zones.push({
                    id: this.generateZoneId(),
                    type: DropZoneType.ALIGNMENT_CENTER,
                    targetElement: sibling,
                    draggedElement: draggedElement,
                    bounds: {
                        x: centerX - 2,
                        y: rect.top,
                        width: 4,
                        height: rect.height
                    },
                    isValid: this.canAlignWithElement(draggedElement, sibling, 'center'),
                    state: ZoneState.INACTIVE
                });
                
                // Right Alignment
                zones.push({
                    id: this.generateZoneId(),
                    type: DropZoneType.ALIGNMENT_RIGHT,
                    targetElement: sibling,
                    draggedElement: draggedElement,
                    bounds: {
                        x: rect.right - 2,
                        y: rect.top,
                        width: 4,
                        height: rect.height
                    },
                    isValid: this.canAlignWithElement(draggedElement, sibling, 'right'),
                    state: ZoneState.INACTIVE
                });
            });
            
            return zones.filter(zone => zone.isValid);
        }
        
        /**
         * إنشاء Element-Specific Zones حسب نوع العنصر
         */
        createElementSpecificZones(draggedElement) {
            const zones = [];
            const targetType = draggedElement.tagName.toLowerCase();
            
            // تخصيص zones حسب نوع العنصر
            switch (targetType) {
                case 'img':
                    zones.push(...this.createImageZones(draggedElement));
                    break;
                case 'button':
                    zones.push(...this.createButtonZones(draggedElement));
                    break;
                case 'input':
                    zones.push(...this.createInputZones(draggedElement));
                    break;
                case 'video':
                case 'audio':
                    zones.push(...this.createMediaZones(draggedElement));
                    break;
                default:
                    zones.push(...this.createGenericElementZones(draggedElement));
            }
            
            return zones;
        }
        
        /**
         * إنشاء Snap to Grid Zones
         */
        createSnapToGridZones(draggedElement) {
            const zones = [];
            const gridSize = VISUAL_CONFIG.SNAP_TO_GRID.GRID_SIZE;
            
            if (!this.canvasBounds) {
                this.detectCanvasBounds();
            }
            
            if (!this.canvasBounds) return zones;
            
            const { left, top, width, height } = this.canvasBounds;
            
            // إنشاء grid points
            for (let x = left; x <= left + width; x += gridSize) {
                for (let y = top; y <= top + height; y += gridSize) {
                    zones.push({
                        id: this.generateZoneId(),
                        type: DropZoneType.SNAP_TO_GRID,
                        draggedElement: draggedElement,
                        bounds: {
                            x: x - gridSize / 4,
                            y: y - gridSize / 4,
                            width: gridSize / 2,
                            height: gridSize / 2
                        },
                        snapPoint: { x, y },
                        isValid: true,
                        state: ZoneState.INACTIVE
                    });
                }
            }
            
            return zones;
        }
        
        // ==================== ELEMENT SPECIFIC HELPERS ====================
        
        createImageZones(draggedElement) {
            // zones خاصة بالصور
            return [];
        }
        
        createButtonZones(draggedElement) {
            // zones خاصة بالأزرار
            return [];
        }
        
        createInputZones(draggedElement) {
            // zones خاصة بالمدخلات
            return [];
        }
        
        createMediaZones(draggedElement) {
            // zones خاصة بملفات الوسائط
            return [];
        }
        
        createGenericElementZones(draggedElement) {
            // zones عامة للعناصر
            return [];
        }
        
        canAlignWithElement(draggedElement, targetElement, alignment) {
            // التحقق من إمكانية المحاذاة
            return draggedElement !== targetElement;
        }
        
        // ==================== ENHANCED CONTAINER METHODS ====================
        
        createZonesForContainer(container, draggedElement, mode) {
            const zones = [];
            const containerRect = container.getBoundingClientRect();
            const children = Array.from(container.children).filter(child => 
                child !== draggedElement && 
                !child.classList.contains('bloc-insertion-indicator') &&
                !child.classList.contains('bloc-positioning-indicator')
            );
            
            // Container drop zone مع Auto-Detection للـ capacity
            if (this.canAcceptChild(container, draggedElement)) {
                zones.push(this.createEnhancedContainerZone(container, draggedElement));
            }
            
            // Insertion zones (بين العناصر)
            for (let i = 0; i <= children.length; i++) {
                const insertionZone = this.createInsertionZone(container, i, children, draggedElement);
                if (insertionZone) {
                    zones.push(insertionZone);
                }
            }
            
            return zones;
        }
        
        /**
         * إنشاء Container Zone مع Auto-Detection
         */
        createEnhancedContainerZone(container, draggedElement) {
            const rect = container.getBoundingClientRect();
            
            // حساب سعة الـ container
            const capacityInfo = this.calculateContainerCapacity(container);
            
            return {
                id: this.generateZoneId(),
                type: DropZoneType.CONTAINER,
                targetElement: container,
                draggedElement: draggedElement,
                bounds: {
                    x: rect.left,
                    y: rect.top,
                    width: rect.width,
                    height: rect.height
                },
                capacityInfo: capacityInfo,
                isValid: this.canAcceptChild(container, draggedElement),
                state: ZoneState.INACTIVE
            };
        }
        
        /**
         * حساب سعة الـ Container
         */
        calculateContainerCapacity(container) {
            const children = Array.from(container.children).filter(child => 
                !child.classList.contains('bloc-insertion-indicator') &&
                !child.classList.contains('bloc-positioning-indicator')
            );
            
            const containerRect = container.getBoundingClientRect();
            const containerArea = containerRect.width * containerRect.height;
            
            let totalChildrenArea = 0;
            children.forEach(child => {
                const childRect = child.getBoundingClientRect();
                totalChildrenArea += childRect.width * childRect.height;
            });
            
            const utilization = children.length === 0 ? 0 : totalChildrenArea / containerArea;
            
            return {
                totalChildren: children.length,
                utilization: utilization,
                isNearOverflow: utilization > VISUAL_CONFIG.CONTAINER_CAPACITY.OVERFLOW_THRESHOLD,
                remainingSpace: containerArea - totalChildrenArea,
                canAcceptMore: children.length < 100 // حد أقصى عشوائي
            };
        }\n        \n        /**\n         * معالجة حركة المؤشر لتحديد Zone المناسب\n         */\n        handlePointerMove(x, y) {\n            const now = performance.now();\n            if (now - this.lastCalculationTime < this.calculationThrottle) {\n                return; // Throttle للأداء\n            }\n            this.lastCalculationTime = now;\n            \n            const zone = this.findZoneAtPoint(x, y);\n            \n            if (zone !== this.highlightedZone) {\n                if (this.highlightedZone) {\n                    this.unhighlightZone(this.highlightedZone);\n                }\n                \n                if (zone) {\n                    this.highlightZone(zone);\n                }\n                \n                this.highlightedZone = zone;\n            }\n        }\n        \n        findZoneAtPoint(x, y) {\n            let bestZone = null;\n            let bestScore = -1;\n            \n            this.activeZones.forEach(zone => {\n                if (!zone.isVisible) return;\n                \n                const bounds = zone.bounds;\n                if (x >= bounds.x && x <= bounds.x + bounds.width &&\n                    y >= bounds.y && y <= bounds.y + bounds.height) {\n                    \n                    // تحديد أولوية الـ zones\n                    const score = this.calculateZonePriority(zone, x, y);\n                    if (score > bestScore) {\n                        bestScore = score;\n                        bestZone = zone;\n                    }\n                }\n            });\n            \n            return bestZone;\n        }\n        \n        calculateZonePriority(zone, x, y) {\n            // Insertion zones لها أولوية أعلى\n            if (zone.type === DropZoneType.INSERTION) return 10;\n            \n            // Positioning zones لها أولوية متوسطة\n            if ([DropZoneType.ABOVE, DropZoneType.BELOW, DropZoneType.LEFT, DropZoneType.RIGHT].includes(zone.type)) {\n                return 8;\n            }\n            \n            // Container zones لها أولوية منخفضة\n            if (zone.type === DropZoneType.CONTAINER) return 5;\n            \n            return 1;\n        }\n        \n        highlightZone(zone) {\n            if (!zone || !zone.isValid) return;\n            \n            zone.state = ZoneState.HIGHLIGHTED;\n            \n            const visualElement = this.visualIndicators.get(zone.id);\n            if (visualElement) {\n                visualElement.classList.add('highlighted');\n            }\n            \n            // إظهار indicator مناسب\n            this.showIndicatorForZone(zone);\n            \n            // إشعار callbacks\n            this.notifyZoneHighlight(zone);\n            \n            console.log(`[DropZoneManager] 🔆 Highlighted zone: ${zone.type}`);\n        }\n        \n        unhighlightZone(zone) {\n            if (!zone) return;\n            \n            zone.state = ZoneState.INACTIVE;\n            \n            const visualElement = this.visualIndicators.get(zone.id);\n            if (visualElement) {\n                visualElement.classList.remove('highlighted', 'accepting', 'rejecting');\n            }\n            \n            this.hideAllIndicators();\n        }\n        \n        showIndicatorForZone(zone) {\n            this.hideAllIndicators();\n            \n            switch (zone.type) {\n                case DropZoneType.INSERTION:\n                    this.showInsertionIndicator(zone);\n                    break;\n                    \n                case DropZoneType.ABOVE:\n                case DropZoneType.BELOW:\n                case DropZoneType.LEFT:\n                case DropZoneType.RIGHT:\n                    this.showPositioningIndicator(zone);\n                    break;\n                    \n                case DropZoneType.CONTAINER:\n                    this.showContainerIndicator(zone);\n                    break;\n            }\n        }\n        \n        showInsertionIndicator(zone) {\n            const indicator = this.insertionIndicator;\n            indicator.style.left = zone.bounds.x + 'px';\n            indicator.style.top = zone.bounds.y + 'px';\n            indicator.style.width = zone.bounds.width + 'px';\n            indicator.style.display = 'block';\n            \n            // Animation\n            indicator.style.transform = 'scaleX(0)';\n            requestAnimationFrame(() => {\n                indicator.style.transform = 'scaleX(1)';\n            });\n        }\n        \n        showPositioningIndicator(zone) {\n            const indicator = this.positioningIndicator;\n            indicator.style.left = zone.bounds.x + 'px';\n            indicator.style.top = zone.bounds.y + 'px';\n            indicator.style.width = zone.bounds.width + 'px';\n            indicator.style.height = zone.bounds.height + 'px';\n            indicator.style.display = 'block';\n            \n            // تغيير لون حسب الاتجاه\n            const colors = {\n                above: '#FF6B6B',\n                below: '#4ECDC4',\n                left: '#45B7D1',\n                right: '#FFA07A'\n            };\n            indicator.style.background = colors[zone.type] || VISUAL_CONFIG.FEEDBACK_COLORS.HIGHLIGHT;\n        }\n        \n        showContainerIndicator(zone) {\n            const container = zone.targetElement;\n            container.classList.add('bloc-container-highlight');\n            \n            // إزالة التمييز بعد فترة\n            setTimeout(() => {\n                container.classList.remove('bloc-container-highlight');\n            }, 2000);\n        }\n        \n        hideAllIndicators() {\n            this.insertionIndicator.style.display = 'none';\n            this.positioningIndicator.style.display = 'none';\n            \n            // إزالة container highlights\n            document.querySelectorAll('.bloc-container-highlight').forEach(el => {\n                el.classList.remove('bloc-container-highlight');\n            });\n        }\n        \n        // ==================== DROP HANDLING ====================\n        \n        /**\n         * معالجة عملية الإسقاط\n         */\n        handleDrop(x, y) {\n            const zone = this.findZoneAtPoint(x, y);\n            \n            if (!zone || !zone.isValid) {\n                this.showDropRejection();\n                return null;\n            }\n            \n            // تطبيق drop animation\n            this.showDropAcceptance(zone);\n            \n            // إشعار callbacks\n            this.notifyDrop(zone);\n            \n            console.log(`[DropZoneManager] 🎯 Drop completed on zone: ${zone.type}`);\n            \n            return {\n                zone: zone,\n                position: this.calculateDropPosition(zone),\n                metadata: this.generateDropMetadata(zone)\n            };\n        }\n        \n        calculateDropPosition(zone) {\n            switch (zone.type) {\n                case DropZoneType.INSERTION:\n                    return {\n                        parentId: zone.targetElement.id || zone.targetElement.dataset.blocId,\n                        index: zone.insertionIndex,\n                        type: 'insertion'\n                    };\n                    \n                case DropZoneType.ABOVE:\n                case DropZoneType.BELOW:\n                case DropZoneType.LEFT:\n                case DropZoneType.RIGHT:\n                    return {\n                        targetElementId: zone.targetElement.id || zone.targetElement.dataset.blocId,\n                        position: zone.type,\n                        type: 'positioning'\n                    };\n                    \n                case DropZoneType.CONTAINER:\n                    return {\n                        parentId: zone.targetElement.id || zone.targetElement.dataset.blocId,\n                        index: -1, // آخر موضع\n                        type: 'container'\n                    };\n            }\n        }\n        \n        generateDropMetadata(zone) {\n            return {\n                zoneId: zone.id,\n                zoneType: zone.type,\n                timestamp: Date.now(),\n                draggedElementId: zone.draggedElement.id || zone.draggedElement.dataset.blocId,\n                targetElementId: zone.targetElement.id || zone.targetElement.dataset.blocId\n            };\n        }\n        \n        showDropAcceptance(zone) {\n            const visualElement = this.visualIndicators.get(zone.id);\n            if (visualElement) {\n                visualElement.classList.add('accepting');\n                \n                setTimeout(() => {\n                    visualElement.classList.remove('accepting');\n                }, 500);\n            }\n        }\n        \n        showDropRejection() {\n            if (this.highlightedZone) {\n                const visualElement = this.visualIndicators.get(this.highlightedZone.id);\n                if (visualElement) {\n                    visualElement.classList.add('rejecting');\n                    \n                    setTimeout(() => {\n                        visualElement.classList.remove('rejecting');\n                    }, 500);\n                }\n            }\n        }\n        \n        // ==================== VALIDATION METHODS ====================\n        \n        canAcceptChild(container, child) {\n            // Basic validation\n            if (!container || !child) return false;\n            if (container === child) return false;\n            if (this.isDescendantOf(container, child)) return false;\n            \n            // Type-specific validation\n            const containerTag = container.tagName.toLowerCase();\n            const childTag = child.tagName.toLowerCase();\n            \n            // Prevent invalid nesting\n            if (containerTag === 'button' && ['button', 'a'].includes(childTag)) return false;\n            if (containerTag === 'a' && ['button', 'a'].includes(childTag)) return false;\n            \n            return true;\n        }\n        \n        canInsertAtIndex(container, element, index) {\n            return this.canAcceptChild(container, element);\n        }\n        \n        canPositionRelative(element, targetElement, position) {\n            if (!element || !targetElement) return false;\n            if (element === targetElement) return false;\n            \n            const parent = targetElement.parentElement;\n            if (!parent) return false;\n            \n            // تحقق من إمكانية positioning\n            if (['left', 'right'].includes(position)) {\n                // يحتاج horizontal layout\n                return parent.style.display === 'flex' || parent.classList.contains('flex-container');\n            }\n            \n            return true;\n        }\n        \n        isDescendantOf(ancestor, descendant) {\n            let current = descendant.parentElement;\n            while (current) {\n                if (current === ancestor) return true;\n                current = current.parentElement;\n            }\n            return false;\n        }\n        \n        getSiblingElements(element) {\n            const parent = element.parentElement;\n            if (!parent) return [];\n            \n            return Array.from(parent.children).filter(child => \n                child !== element && \n                !child.classList.contains('bloc-insertion-indicator') &&\n                !child.classList.contains('bloc-positioning-indicator')\n            );\n        }\n        \n        // ==================== UTILITY METHODS ====================\n        \n        generateZoneId() {\n            return `zone-${++this.zoneCounter}-${Date.now()}`;\n        }\n        \n        // ==================== CALLBACK MANAGEMENT ====================\n        \n        onZoneHighlight(callback) {\n            this.onZoneHighlightCallbacks.push(callback);\n        }\n        \n        onZoneActivate(callback) {\n            this.onZoneActivateCallbacks.push(callback);\n        }\n        \n        onDrop(callback) {\n            this.onDropCallbacks.push(callback);\n        }\n        \n        notifyZoneHighlight(zone) {\n            this.onZoneHighlightCallbacks.forEach(callback => {\n                try {\n                    callback(zone);\n                } catch (error) {\n                    console.error('[DropZoneManager] Error in zone highlight callback:', error);\n                }\n            });\n        }\n        \n        notifyDrop(zone) {\n            this.onDropCallbacks.forEach(callback => {\n                try {\n                    callback(zone);\n                } catch (error) {\n                    console.error('[DropZoneManager] Error in drop callback:', error);\n                }\n            });\n        }\n        \n        // ==================== PUBLIC API ====================\n        \n        getActiveZones() {\n            return Array.from(this.activeZones.values());\n        }\n        \n        getHighlightedZone() {\n            return this.highlightedZone;\n        }\n        \n        forceHighlightZone(zoneId) {\n            const zone = this.activeZones.get(zoneId);\n            if (zone) {\n                this.highlightZone(zone);\n                this.highlightedZone = zone;\n            }\n        }\n        \n        getPerformanceInfo() {\n            return {\n                activeZonesCount: this.activeZones.size,\n                lastCalculationTime: this.lastCalculationTime,\n                throttleInterval: this.calculationThrottle\n            };\n        }\n        \n        // Debug methods\n        debugShowAllZones() {\n            this.activeZones.forEach(zone => {\n                const element = this.visualIndicators.get(zone.id);\n                if (element) {\n                    element.style.background = 'rgba(255, 0, 0, 0.3)';\n                    element.style.border = '1px solid red';\n                    element.style.pointerEvents = 'none';\n                }\n            });\n        }\n        \n        debugHideAllZones() {\n            this.clearAllZones();\n        }\n    }\n    \n    // ==================== GLOBAL EXPORT ====================\n    \n    // إنشاء instance عام\n    window.BlocVibeDropZoneManager = new DropZoneManager();\n    \n    // تصدير الأنواع للاستخدام في ملفات أخرى\n    window.BlocVibeDropZoneType = DropZoneType;\n    window.BlocVibeZoneState = ZoneState;\n    \n    console.log('[DropZoneManager] 🌟 DropZoneManager loaded and ready!');\n    \n})();        
        // ==================== SMART ZONES ENHANCEMENT METHODS ====================
        
        /**
         * تطبيق Snap to Grid
         */
        applySnapToGrid(x, y) {
            const gridSize = VISUAL_CONFIG.SNAP_TO_GRID.GRID_SIZE;
            const magneticDistance = VISUAL_CONFIG.SNAP_TO_GRID.MAGNETIC_DISTANCE;
            
            let snappedX = x;
            let snappedY = y;
            
            // البحث عن أقرب grid point
            let closestDistance = Infinity;
            
            this.activeZones.forEach(zone => {
                if (zone.type === DropZoneType.SNAP_TO_GRID) {
                    const snapPoint = zone.snapPoint;
                    const distance = Math.sqrt(
                        Math.pow(x - snapPoint.x, 2) + Math.pow(y - snapPoint.y, 2)
                    );
                    
                    if (distance < magneticDistance && distance < closestDistance) {
                        closestDistance = distance;
                        snappedX = snapPoint.x;
                        snappedY = snapPoint.y;
                    }
                }
            });
            
            return { x: snappedX, y: snappedY };
        }
        
        /**
         * تحديث Advanced Visual Feedback
         */
        updateAdvancedVisualFeedback(x, y) {
            // إظهار momentum indicator إذا كان هناك زخم عالي
            if (this.hasHighMomentum()) {
                this.showMomentumIndicator(x, y);
            } else {
                this.hideMomentumIndicator();
            }
            
            // إظهار snap grid indicator
            if (this.snapToGridEnabled) {
                this.showSnapGridIndicator();
            }
        }
        
        /**
         * إظهار Momentum Indicator
         */
        showMomentumIndicator(x, y) {
            if (!this.momentumIndicator) return;
            
            const speed = this.getMomentumSpeed();
            const size = Math.min(60, speed * 10);
            
            this.momentumIndicator.style.left = (x - size/2) + 'px';
            this.momentumIndicator.style.top = (y - size/2) + 'px';
            this.momentumIndicator.style.width = size + 'px';
            this.momentumIndicator.style.height = size + 'px';
            this.momentumIndicator.style.display = 'block';
            this.momentumIndicator.classList.add('bloc-high-momentum');
        }
        
        /**
         * إخفاء Momentum Indicator
         */
        hideMomentumIndicator() {
            if (this.momentumIndicator) {
                this.momentumIndicator.style.display = 'none';
                this.momentumIndicator.classList.remove('bloc-high-momentum');
            }
        }
        
        /**
         * إظهار Overflow Indicator
         */
        showOverflowIndicator(zone) {
            if (!this.overflowIndicator || !zone.capacityInfo) return;
            
            const { bounds, capacityInfo } = zone;
            
            if (capacityInfo.isNearOverflow) {
                this.overflowIndicator.style.left = bounds.x + 'px';
                this.overflowIndicator.style.top = bounds.y + 'px';
                this.overflowIndicator.style.width = bounds.width + 'px';
                this.overflowIndicator.style.height = bounds.height + 'px';
                this.overflowIndicator.style.display = 'block';
                
                // إضافة تحذير للـ container
                if (zone.targetElement) {
                    zone.targetElement.classList.add('bloc-container-overflow-warning');
                }
            }
        }
        
        /**
         * إخفاء Overflow Indicator
         */
        hideOverflowIndicator() {
            if (this.overflowIndicator) {
                this.overflowIndicator.style.display = 'none';
            }
            
            // إزالة تحذيرات overflow
            document.querySelectorAll('.bloc-container-overflow-warning').forEach(el => {
                el.classList.remove('bloc-container-overflow-warning');
            });
        }
        
        /**
         * إظهار Boundary Indicator
         */
        showBoundaryIndicator(zone) {
            if (!this.boundaryIndicator) return;
            
            const { bounds } = zone;
            this.boundaryIndicator.style.left = bounds.x + 'px';
            this.boundaryIndicator.style.top = bounds.y + 'px';
            this.boundaryIndicator.style.width = bounds.width + 'px';
            this.boundaryIndicator.style.height = bounds.height + 'px';
            this.boundaryIndicator.style.display = 'block';
        }
        
        /**
         * إخفاء Boundary Indicator
         */
        hideBoundaryIndicator() {
            if (this.boundaryIndicator) {
                this.boundaryIndicator.style.display = 'none';
            }
        }
        
        /**
         * إظهار Alignment Indicator
         */
        showAlignmentIndicator(zone) {
            if (!this.alignmentIndicator) return;
            
            const { bounds, type } = zone;
            this.alignmentIndicator.style.left = bounds.x + 'px';
            this.alignmentIndicator.style.top = bounds.y + 'px';
            this.alignmentIndicator.style.width = bounds.width + 'px';
            this.alignmentIndicator.style.height = bounds.height + 'px';
            this.alignmentIndicator.style.display = 'block';
            
            // إضافة class للـ alignment type
            this.alignmentIndicator.className = 'bloc-alignment-indicator';
            if (type === DropZoneType.ALIGNMENT_LEFT) {
                this.alignmentIndicator.classList.add('left');
            } else if (type === DropZoneType.ALIGNMENT_CENTER) {
                this.alignmentIndicator.classList.add('center');
            } else if (type === DropZoneType.ALIGNMENT_RIGHT) {
                this.alignmentIndicator.classList.add('right');
            }
        }
        
        /**
         * إخفاء Alignment Indicator
         */
        hideAlignmentIndicator() {
            if (this.alignmentIndicator) {
                this.alignmentIndicator.style.display = 'none';
                this.alignmentIndicator.className = 'bloc-alignment-indicator';
            }
        }
        
        /**
         * إظهار Snap Grid Indicator
         */
        showSnapGridIndicator() {
            if (!this.snapGridIndicator || !this.canvasBounds) return;
            
            const { left, top, width, height } = this.canvasBounds;
            this.snapGridIndicator.style.left = left + 'px';
            this.snapGridIndicator.style.top = top + 'px';
            this.snapGridIndicator.style.width = width + 'px';
            this.snapGridIndicator.style.height = height + 'px';
            this.snapGridIndicator.style.display = 'block';
        }
        
        /**
         * إخفاء Snap Grid Indicator
         */
        hideSnapGridIndicator() {
            if (this.snapGridIndicator) {
                this.snapGridIndicator.style.display = 'none';
            }
        }