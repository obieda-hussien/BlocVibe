/**
 * BlocVibe Editor Helper
 * This file contains the complete JavaScript logic for the visual editor,
 * including the synchronization engine and custom drag-and-drop implementation.
 */

class EditorSyncEngine {
    constructor() {
        this.syncStatus = 'synced'; // synced, syncing, failed
        this.lastSyncedState = null;
        this.pendingChanges = false;
        this.syncTimeout = null;
        this.draggedElement = null;
        this.ghostElement = null;
        this.dropIndicator = null;
        this.longPressTimer = null;

        this.debouncedSync = this.debounce(() => {
            this.sendDomUpdate();
        }, 300);

        this.observer = new MutationObserver(this.handleMutation.bind(this));

        console.log("✅ EditorSyncEngine initialized");
    }

    startObserving() {
        const targetNode = document.body;
        const config = { attributes: true, childList: true, subtree: true, characterData: true };
        this.observer.observe(targetNode, config);
        this.lastSyncedState = JSON.stringify(this.serializeDOM(document.body));
        console.log("👀 MutationObserver is now watching the DOM.");
        this.initDragAndDrop();
    }

    stopObserving() {
        this.observer.disconnect();
        console.log("🛑 MutationObserver has stopped watching.");
    }

    handleMutation(mutationsList) {
        const isInternalMutation = mutationsList.some(mutation =>
            (mutation.target.classList && (mutation.target.classList.contains('bv-highlight') || mutation.target.classList.contains('ghost-element'))) ||
            (mutation.addedNodes.length > 0 && mutation.addedNodes[0].classList && (mutation.addedNodes[0].classList.contains('bv-highlight') || mutation.addedNodes[0].classList.contains('ghost-element') || mutation.addedNodes[0].classList.contains('drop-indicator')))
        );

        if (isInternalMutation) return;

        console.log('DOM mutation detected, triggering debounced sync...');
        this.setStatus('syncing');
        this.debouncedSync();
    }

    async sendDomUpdate() {
        this.stopObserving();
        const currentStateJson = JSON.stringify(this.serializeDOM(document.body));

        if (currentStateJson === this.lastSyncedState) {
            console.log("No changes detected. Skipping sync.");
            this.startObserving();
            return;
        }

        this.setStatus('syncing');

        const MAX_RETRIES = 4;
        let attempt = 0;
        let success = false;

        while (attempt < MAX_RETRIES && !success) {
            try {
                if (window.AndroidBridge && typeof window.AndroidBridge.onDomUpdated === 'function') {
                    console.log(`Sync attempt #${attempt + 1}...`);
                    success = await this.sendToAndroid(currentStateJson);
                } else {
                    throw new Error("AndroidBridge is not available.");
                }

                if (success) {
                    this.lastSyncedState = currentStateJson;
                    this.setStatus('synced');
                    console.log(`✅ Sync successful on attempt #${attempt + 1}.`);
                }
            } catch (error) {
                console.error(`Error during sync attempt #${attempt + 1}:`, error);
            }

            if (!success) {
                attempt++;
                if (attempt < MAX_RETRIES) {
                    const delay = (2 ** attempt) * 100;
                    console.log(`Sync failed. Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        if (!success) {
            this.setStatus('failed');
            console.error(`❌ Sync failed after ${MAX_RETRIES} attempts. Rolling back UI.`);
            alert("Failed to save changes. Please check your connection and try again. Your latest changes have been temporarily stored and will be restored if you reload.");
            localStorage.setItem('blocvibe_unsynced_changes', currentStateJson);
            this.rollback();
        } else {
            localStorage.removeItem('blocvibe_unsynced_changes');
        }

        this.startObserving();
    }

    sendToAndroid(jsonPayload) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error("Sync timed out. No response from Android."));
            }, 5000);

            try {
                const result = window.AndroidBridge.onDomUpdated(jsonPayload);
                clearTimeout(timeout);
                resolve(result);
            } catch (err) {
                clearTimeout(timeout);
                reject(err);
            }
        });
    }

    serializeDOM(node) {
        let elementTree = [];
        const children = Array.from(node.children);

        for (const child of children) {
            if (child.tagName === 'SCRIPT' || child.classList.contains('bv-internal') || child.classList.contains('ghost-element') || child.classList.contains('drop-indicator')) {
                continue;
            }

            const attributes = {};
            for (const attr of child.attributes) {
                attributes[attr.name] = attr.value;
            }

            if (!child.id) {
                child.id = `bv_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
                attributes['id'] = child.id;
            }

            const styles = {};
            if (child.style.width) styles.width = child.style.width;
            if (child.style.height) styles.height = child.style.height;
            if (child.style.color) styles.color = child.style.color;
            if (child.style.backgroundColor) styles.backgroundColor = child.style.backgroundColor;

            let blocElement = {
                elementId: child.id,
                tag: child.tagName.toLowerCase(),
                content: this.getElementContent(child),
                attributes: attributes,
                styles: styles,
                children: this.serializeDOM(child)
            };
            elementTree.push(blocElement);
        }
        return elementTree;
    }

    getElementContent(element) {
        let content = '';
        if (element.hasChildNodes()) {
            for (const node of element.childNodes) {
                if (node.nodeType === Node.TEXT_NODE) {
                    content += node.textContent.trim();
                }
            }
        }
        return content;
    }

    debounce(func, delay) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    setStatus(status) {
        this.syncStatus = status;
        console.log(`Sync status changed to: ${status}`);
    }

    rollback() {
        this.stopObserving();
        console.log("Rolling back DOM to last synced state.");
        if (this.lastSyncedState) {
            const lastGoodState = JSON.parse(this.lastSyncedState);
            this.rebuildDOM(document.body, lastGoodState);
        } else {
            document.body.innerHTML = '';
        }
        this.startObserving();
    }

    rebuildDOM(parentNode, elementTree) {
        parentNode.innerHTML = '';
        for (const elementData of elementTree) {
            const el = document.createElement(elementData.tag);
            el.id = elementData.elementId;

            if (elementData.attributes) {
                for (const [key, value] of Object.entries(elementData.attributes)) {
                    el.setAttribute(key, value);
                }
            }
            if (elementData.styles) {
                for (const [key, value] of Object.entries(elementData.styles)) {
                    el.style[key] = value;
                }
            }
            if (elementData.content) {
                el.appendChild(document.createTextNode(elementData.content));
            }
            if (elementData.children && elementData.children.length > 0) {
                this.rebuildDOM(el, elementData.children);
            }
            parentNode.appendChild(el);
        }
    }

    updateElementAttribute(elementId, attribute, value) {
        const el = document.getElementById(elementId);
        if (el) el.setAttribute(attribute, value);
    }

    updateElementStyle(elementId, prop, value) {
        const el = document.getElementById(elementId);
        if (el) el.style[prop] = value;
    }

    highlightElement(elementId) {
       document.querySelectorAll('.bv-highlight').forEach(el => el.classList.remove('bv-highlight'));
       if (elementId) {
           const el = document.getElementById(elementId);
           if (el) el.classList.add('bv-highlight');
       }
    }

    handleAndroidDrop(tag, x, y) {
        const newElement = document.createElement(tag);
        newElement.id = `bv_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;
        newElement.innerText = `New ${tag}`;

        // Find the element at the drop coordinates
        const dropTarget = document.elementFromPoint(x, y);

        // Determine the actual container to drop into
        let container = document.body;
        if (dropTarget) {
            // If the target is a container (e.g., div), drop inside it.
            // Otherwise, drop into its parent.
            if (['div', 'section', 'article', 'main', 'body'].includes(dropTarget.tagName.toLowerCase())) {
                container = dropTarget;
            } else {
                container = dropTarget.parentElement || document.body;
            }
        }

        container.appendChild(newElement);
        console.log(`Dropped new <${tag}> into <${container.tagName}>`);
    }

    initDragAndDrop() {
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleTouchStart(e) {
        const target = e.target.closest('body > *'); // Only allow dragging top-level elements for now
        if (!target) return;

        e.preventDefault();
        this.longPressTimer = setTimeout(() => {
            this.draggedElement = target;
            this.createGhostElement();
            this.createDropIndicator();
        }, 200); // 200ms for long press
    }

    handleTouchMove(e) {
        if (!this.draggedElement) return;

        e.preventDefault();
        const touch = e.touches[0];

        // Move ghost
        this.ghostElement.style.left = `${touch.clientX - (this.ghostElement.offsetWidth / 2)}px`;
        this.ghostElement.style.top = `${touch.clientY - (this.ghostElement.offsetHeight / 2)}px`;

        // Update drop indicator position
        this.updateDropIndicator(touch.clientX, touch.clientY);
    }

    handleTouchEnd() {
        clearTimeout(this.longPressTimer);
        if (!this.draggedElement || !this.dropIndicator.style.display || this.dropIndicator.style.display === 'none') {
            // If drag never really started or ended in an invalid spot, cleanup and exit.
            if (this.ghostElement) this.ghostElement.remove();
            if (this.dropIndicator) this.dropIndicator.remove();
            this.draggedElement = null;
            return;
        }

        const container = this.dropIndicator.parentElement;
        const insertBeforeElement = this.dropIndicator.nextSibling;

        // Don't drop an element inside itself
        if (this.draggedElement.contains(container)) {
            console.warn("Cannot drop an element into itself.");
        } else {
            container.insertBefore(this.draggedElement, insertBeforeElement);
        }

        // Cleanup
        this.ghostElement.remove();
        this.dropIndicator.remove();
        this.draggedElement = null;
        this.ghostElement = null;
        this.dropIndicator = null;
    }

    createGhostElement() {
        this.ghostElement = this.draggedElement.cloneNode(true);
        this.ghostElement.classList.add('ghost-element');
        document.body.appendChild(this.ghostElement);
    }

    createDropIndicator() {
        this.dropIndicator = document.createElement('div');
        this.dropIndicator.className = 'drop-indicator';
        document.body.appendChild(this.dropIndicator);
    }

    updateDropIndicator(clientX, clientY) {
        // Hide indicator by default
        this.dropIndicator.style.display = 'none';
        this.ghostElement.style.pointerEvents = 'none'; // Temporarily disable pointer events on ghost
        const dropTarget = document.elementFromPoint(clientX, clientY);
        this.ghostElement.style.pointerEvents = 'auto'; // Re-enable

        if (!dropTarget || dropTarget === this.draggedElement || this.draggedElement.contains(dropTarget)) {
            return;
        }

        const isContainer = ['div', 'section', 'article', 'main', 'body'].includes(dropTarget.tagName.toLowerCase());
        const container = isContainer ? dropTarget : dropTarget.parentElement;

        if (!container || this.draggedElement.contains(container)) return;

        const children = Array.from(container.children).filter(c => c !== this.draggedElement && !c.classList.contains('ghost-element') && !c.classList.contains('drop-indicator'));

        // Scenario 1: Drop into an empty container
        if (children.length === 0 && isContainer) {
            container.appendChild(this.dropIndicator);
            this.dropIndicator.style.display = 'block';
            this.dropIndicator.style.position = 'relative';
            this.dropIndicator.style.width = '100%';
            this.dropIndicator.style.height = '4px'; // Make it visible
        }
        // Scenario 2: Find the correct sibling to insert before
        else {
            let insertBefore = null;
            for (const child of children) {
                const rect = child.getBoundingClientRect();
                if (clientY < rect.top + (rect.height / 2)) {
                    insertBefore = child;
                    break;
                }
            }
            container.insertBefore(this.dropIndicator, insertBefore);
            this.dropIndicator.style.display = 'block';
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.editor = new EditorSyncEngine();
    const unsyncedChanges = localStorage.getItem('blocvibe_unsynced_changes');
    if (unsyncedChanges) {
        console.log("Unsynced changes found in localStorage. Restoring...");
        const unsyncedTree = JSON.parse(unsyncedChanges);
        window.editor.rebuildDOM(document.body, unsyncedTree);
    }
    window.editor.startObserving();
    if (unsyncedChanges) {
        setTimeout(() => {
            console.log("Attempting to sync restored changes...");
            window.editor.debouncedSync();
        }, 100);
    }
});
