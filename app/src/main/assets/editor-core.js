/**
 * EditorCore: Robust sync engine for BlocVibe visual editor
 * Features:
 * - MutationObserver for DOM change detection
 * - Sortable.js integration for drag-and-drop
 * - Batched sync with debouncing (150ms)
 * - ACK/NACK confirmation system
 * - Retry logic with exponential backoff
 * - Heartbeat health check
 */

(function() {
    'use strict';

    const CONFIG = {
        BRIDGE_NAME: 'AndroidBridge',  // ⚠️ Must match Java addJavascriptInterface
        CANVAS_ROOT_ID: 'canvas-root',
        BATCH_DELAY_MS: 150,
        ACK_TIMEOUT_MS: 2000,
        MAX_RETRIES: 3,
        HEARTBEAT_INTERVAL_MS: 1000
    };

    const BRIDGE = window[CONFIG.BRIDGE_NAME];

    if (!BRIDGE) {
        console.error('❌ AndroidBridge not found! Check addJavascriptInterface name.');
        return;
    }

    class EditorSyncEngine {
        constructor() {
            this.pendingTimer = null;
            this.lastSnapshot = null;
            this.isSyncing = false;
            this.retryCount = 0;
            this.ackResolver = null;
            this.observer = null;
            this.sortables = [];

            this.init();
        }

        init() {
            console.log('🚀 EditorCore initializing...');
            this.installMutationObserver();
            this.installSortable();
            this.installHeartbeat();
            this.logToBridge('EditorCore initialized successfully');
        }

        /**
         * Set up MutationObserver to watch all DOM changes
         */
        installMutationObserver() {
            const root = document.getElementById(CONFIG.CANVAS_ROOT_ID) || document.body;

            this.observer = new MutationObserver((mutations) => {
                console.log('🔵 DOM mutation detected:', mutations.length, 'changes');
                this.queueSync();
            });

            this.observer.observe(root, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true,
                attributeOldValue: false,
                characterDataOldValue: false
            });

            console.log('✅ MutationObserver installed on', root.id || 'body');
        }

        /**
         * Initialize Sortable.js for drag-and-drop
         */
        installSortable() {
            if (typeof Sortable === 'undefined') {
                console.warn('⚠️ Sortable.js not found - drag-and-drop disabled');
                return;
            }

            const root = document.getElementById(CONFIG.CANVAS_ROOT_ID) || document.body;

            const sortableOptions = {
                animation: 150,
                group: 'blocvibe-elements',
                ghostClass: 'sortable-ghost',
                chosenClass: 'sortable-chosen',
                dragClass: 'sortable-drag',
                fallbackTolerance: 5,
                forceFallback: true,

                onAdd: (evt) => {
                    console.log('➕ Element added:', evt.item);
                    this.queueSync();
                },
                onUpdate: (evt) => {
                    console.log('🔄 Element reordered:', evt.item);
                    this.queueSync();
                },
                onRemove: (evt) => {
                    console.log('➖ Element removed:', evt.item);
                    this.queueSync();
                },
                onEnd: (evt) => {
                    console.log('🏁 Drag ended');
                    this.queueSync();
                }
            };

            this.sortables.push(Sortable.create(root, sortableOptions));
            console.log('✅ Sortable.js initialized on', root.id || 'body');
        }

        /**
         * Heartbeat to check bridge connectivity
         */
        installHeartbeat() {
            setInterval(() => {
                try {
                    const pong = BRIDGE.ping && BRIDGE.ping();
                    if (pong !== 'pong') {
                        console.warn('⚠️ Heartbeat failed: unexpected response');
                    }
                } catch (e) {
                    console.error('❌ Heartbeat error:', e);
                }
            }, CONFIG.HEARTBEAT_INTERVAL_MS);
        }

        /**
         * Queue a sync operation with debouncing
         */
        queueSync() {
            if (this.isSyncing) {
                console.log('⏳ Sync already in progress, queuing...');
                return;
            }

            clearTimeout(this.pendingTimer);
            this.pendingTimer = setTimeout(() => {
                this.executeSync();
            }, CONFIG.BATCH_DELAY_MS);
        }

        /**
         * Execute sync: serialize DOM and send to Android
         */
        async executeSync() {
            if (this.isSyncing) return;

            console.log('🔄 Starting sync...');
            this.isSyncing = true;

            try {
                this.lastSnapshot = this.serializeDOM();
                const json = JSON.stringify(this.lastSnapshot);

                console.log('📤 Sending to Android, size:', json.length, 'bytes');
                await this.sendWithAck(json);

                this.retryCount = 0;
                console.log('✅ Sync successful');
                this.showSyncStatus('success');

            } catch (error) {
                console.error('❌ Sync failed:', error.message);
                this.showSyncStatus('error');

                if (++this.retryCount <= CONFIG.MAX_RETRIES) {
                    const delay = 200 * Math.pow(2, this.retryCount - 1);
                    console.log(`🔁 Retry ${this.retryCount}/${CONFIG.MAX_RETRIES} in ${delay}ms`);
                    setTimeout(() => this.executeSync(), delay);
                } else {
                    console.error('💥 Sync failed after maximum retries');
                    this.logToBridge('Sync failed after ' + CONFIG.MAX_RETRIES + ' retries');
                }
            } finally {
                this.isSyncing = false;
            }
        }

        /**
         * Serialize DOM tree to JSON
         */
        serializeDOM() {
            const root = document.getElementById(CONFIG.CANVAS_ROOT_ID) || document.body;
            return this.serializeElement(root);
        }

        /**
         * Recursively serialize a DOM element
         */
        serializeElement(el) {
            if (el.nodeType === Node.TEXT_NODE) {
                const text = (el.nodeValue || '').trim();
                return text ? { node: 'text', text } : null;
            }

            if (el.nodeType !== Node.ELEMENT_NODE) {
                return null;
            }

            const obj = {
                node: 'element',
                tag: el.tagName.toLowerCase(),
                id: el.id || '',
                classes: el.className ? el.className.split(/\s+/).filter(Boolean) : [],
                attrs: {},
                styles: {},
                children: []
            };

            // Serialize attributes
            if (el.attributes) {
                for (let i = 0; i < el.attributes.length; i++) {
                    const attr = el.attributes[i];
                    if (attr.name !== 'style' && attr.name !== 'class' && attr.name !== 'id') {
                        obj.attrs[attr.name] = attr.value;
                    }
                }
            }

            // Serialize inline styles only
            if (el.style && el.style.length > 0) {
                for (let i = 0; i < el.style.length; i++) {
                    const prop = el.style[i];
                    obj.styles[prop] = el.style.getPropertyValue(prop);
                }
            }

            // Serialize children recursively
            for (let child of el.childNodes) {
                const serialized = this.serializeElement(child);
                if (serialized) {
                    obj.children.push(serialized);
                }
            }

            return obj;
        }

        /**
         * Send JSON to Android with ACK/NACK confirmation
         */
        sendWithAck(json) {
            return new Promise((resolve, reject) => {
                let settled = false;

                const timeout = setTimeout(() => {
                    if (!settled) {
                        settled = true;
                        reject(new Error('ACK timeout'));
                    }
                }, CONFIG.ACK_TIMEOUT_MS);

                try {
                    if (!BRIDGE || !BRIDGE.onDomUpdated) {
                        clearTimeout(timeout);
                        return reject(new Error('Bridge or onDomUpdated not available'));
                    }

                    this.ackResolver = (success) => {
                        if (!settled) {
                            clearTimeout(timeout);
                            settled = true;
                            success ? resolve() : reject(new Error('NACK from Android'));
                        }
                    };

                    BRIDGE.onDomUpdated(json);

                } catch (e) {
                    clearTimeout(timeout);
                    reject(e);
                }
            });
        }

        /**
         * Called by Android as ACK (success)
         */
        onSyncSuccess() {
            console.log('✅ Received ACK from Android');
            if (this.ackResolver) {
                this.ackResolver(true);
                this.ackResolver = null;
            }
        }

        /**
         * Called by Android as NACK (failure)
         */
        onSyncFailure() {
            console.error('❌ Received NACK from Android');
            if (this.ackResolver) {
                this.ackResolver(false);
                this.ackResolver = null;
            }
        }

        /**
         * Show sync status indicator
         */
        showSyncStatus(status) {
            let indicator = document.getElementById('__sync_indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.id = '__sync_indicator';
                indicator.style.cssText = `
                    position: fixed;
                    bottom: 16px;
                    right: 16px;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font: 12px sans-serif;
                    color: white;
                    z-index: 999999;
                    opacity: 0.9;
                    transition: background 0.3s;
                `;
                document.body.appendChild(indicator);
            }

            const configs = {
                success: { text: '✓ Saved', bg: '#2e7d32' },
                error: { text: '✗ Sync Failed', bg: '#c62828' },
                syncing: { text: '⏳ Saving...', bg: '#1976d2' }
            };

            const config = configs[status] || configs.syncing;
            indicator.textContent = config.text;
            indicator.style.background = config.bg;
        }

        /**
         * Log message to Android
         */
        logToBridge(message) {
            try {
                if (BRIDGE && BRIDGE.log) {
                    BRIDGE.log(message);
                }
            } catch (e) {
                console.error('Failed to log to bridge:', e);
            }
        }
    }

    /**
     * Fallback for Android drag-and-drop
     */
    window.handleAndroidDrop = function(tag, cssX, cssY) {
        try {
            const targetEl = document.elementFromPoint(cssX, cssY);
            const container = targetEl?.closest('#' + CONFIG.CANVAS_ROOT_ID) ||
                            document.getElementById(CONFIG.CANVAS_ROOT_ID) ||
                            document.body;

            const newElement = document.createElement(tag);
            newElement.textContent = tag.toUpperCase();
            newElement.style.minHeight = '32px';
            newElement.style.minWidth = '64px';
            newElement.style.padding = '8px';
            newElement.style.border = '1px solid #ddd';
            newElement.setAttribute('data-blocvibe', 'true');

            container.appendChild(newElement);

            console.log('➕ Added from Android drop:', tag);
            window.EditorCore.queueSync();

        } catch (e) {
            console.error('❌ handleAndroidDrop error:', e);
        }
    };

    // Initialize globally
    window.EditorCore = new EditorSyncEngine();

    console.log('🎉 EditorCore ready!');

})();
