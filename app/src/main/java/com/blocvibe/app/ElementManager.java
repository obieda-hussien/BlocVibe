package com.blocvibe.app;

import java.util.ArrayList;
import java.util.List;

/**
 * ElementManager - Advanced element management system
 * Handles operations like moving, deleting, wrapping elements in div, multi-selection
 */
public class ElementManager {
    private List<BlocElement> elementTree;
    private List<BlocElement> selectedElements;
    
    public ElementManager(List<BlocElement> elementTree) {
        this.elementTree = elementTree;
        this.selectedElements = new ArrayList<>();
    }
    
    /**
     * Move element up in its parent's children list
     */
    public boolean moveElementUp(String elementId) {
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) return false;
        
        if (element.parentId == null) {
            // Root element - move in main list
            int index = findElementIndex(elementTree, element);
            if (index > 0) {
                elementTree.remove(index);
                elementTree.add(index - 1, element);
                return true;
            }
        } else {
            // Child element - move in parent's children
            BlocElement parent = findElementInTree(elementTree, element.parentId);
            if (parent != null) {
                int index = findElementIndex(parent.children, element);
                if (index > 0) {
                    parent.children.remove(index);
                    parent.children.add(index - 1, element);
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Move element down in its parent's children list
     */
    public boolean moveElementDown(String elementId) {
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) return false;
        
        if (element.parentId == null) {
            // Root element - move in main list
            int index = findElementIndex(elementTree, element);
            if (index >= 0 && index < elementTree.size() - 1) {
                elementTree.remove(index);
                elementTree.add(index + 1, element);
                return true;
            }
        } else {
            // Child element - move in parent's children
            BlocElement parent = findElementInTree(elementTree, element.parentId);
            if (parent != null) {
                int index = findElementIndex(parent.children, element);
                if (index >= 0 && index < parent.children.size() - 1) {
                    parent.children.remove(index);
                    parent.children.add(index + 1, element);
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * Delete element from tree
     */
    public boolean deleteElement(String elementId) {
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) return false;
        
        if (element.parentId == null) {
            // Root element
            return elementTree.remove(element);
        } else {
            // Child element
            BlocElement parent = findElementInTree(elementTree, element.parentId);
            if (parent != null) {
                return parent.children.remove(element);
            }
        }
        return false;
    }
    
    /**
     * Wrap selected elements in a div container
     */
    public BlocElement wrapElementsInDiv(List<String> elementIds) {
        if (elementIds.isEmpty()) return null;
        
        BlocElement wrapper = new BlocElement("div");
        wrapper.setStyle("padding", "10px");
        wrapper.setStyle("border", "1px dashed #999");
        wrapper.setStyle("margin", "5px");
        
        // Find all elements to wrap
        List<BlocElement> elementsToWrap = new ArrayList<>();
        for (String id : elementIds) {
            BlocElement element = findElementInTree(elementTree, id);
            if (element != null) {
                elementsToWrap.add(element);
            }
        }
        
        if (elementsToWrap.isEmpty()) return null;
        
        // Assume all elements are at the same level (root or same parent)
        BlocElement firstElement = elementsToWrap.get(0);
        int insertIndex;
        List<BlocElement> targetList;
        
        if (firstElement.parentId == null) {
            // Root elements
            targetList = elementTree;
            insertIndex = findElementIndex(elementTree, firstElement);
        } else {
            // Child elements
            BlocElement parent = findElementInTree(elementTree, firstElement.parentId);
            if (parent == null) return null;
            targetList = parent.children;
            insertIndex = findElementIndex(parent.children, firstElement);
            wrapper.parentId = parent.elementId;
        }
        
        // Remove elements from their current position and add to wrapper
        for (BlocElement element : elementsToWrap) {
            targetList.remove(element);
            wrapper.addChild(element);
        }
        
        // Insert wrapper at the position of first element
        if (insertIndex >= 0) {
            targetList.add(insertIndex, wrapper);
        } else {
            targetList.add(wrapper);
        }
        
        return wrapper;
    }
    
    /**
     * Duplicate element
     */
    public BlocElement duplicateElement(String elementId) {
        BlocElement original = findElementInTree(elementTree, elementId);
        if (original == null) return null;
        
        BlocElement duplicate = original.clone();
        
        if (original.parentId == null) {
            // Root element - add after original
            int index = findElementIndex(elementTree, original);
            elementTree.add(index + 1, duplicate);
        } else {
            // Child element - add after original in parent's children
            BlocElement parent = findElementInTree(elementTree, original.parentId);
            if (parent != null) {
                int index = findElementIndex(parent.children, original);
                parent.children.add(index + 1, duplicate);
                duplicate.parentId = parent.elementId;
            }
        }
        
        return duplicate;
    }
    
    /**
     * Move element to different parent (drag & drop within canvas)
     */
    public boolean moveElementToParent(String elementId, String newParentId, int index) {
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) return false;
        
        // Remove from current parent
        if (element.parentId == null) {
            elementTree.remove(element);
        } else {
            BlocElement oldParent = findElementInTree(elementTree, element.parentId);
            if (oldParent != null) {
                oldParent.children.remove(element);
            }
        }
        
        // Add to new parent
        if (newParentId == null || newParentId.equals("root")) {
            // Move to root
            element.parentId = null;
            if (index >= 0 && index < elementTree.size()) {
                elementTree.add(index, element);
            } else {
                elementTree.add(element);
            }
        } else {
            // Move to new parent
            BlocElement newParent = findElementInTree(elementTree, newParentId);
            if (newParent != null) {
                element.parentId = newParent.elementId;
                if (index >= 0 && index < newParent.children.size()) {
                    newParent.children.add(index, element);
                } else {
                    newParent.children.add(element);
                }
            } else {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Toggle element selection for multi-select
     */
    public void toggleElementSelection(String elementId) {
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element != null) {
            if (selectedElements.contains(element)) {
                selectedElements.remove(element);
                element.isSelected = false;
            } else {
                selectedElements.add(element);
                element.isSelected = true;
            }
        }
    }
    
    /**
     * Clear all selections
     */
    public void clearSelections() {
        for (BlocElement element : selectedElements) {
            element.isSelected = false;
        }
        selectedElements.clear();
    }
    
    /**
     * Get list of selected element IDs
     */
    public List<String> getSelectedElementIds() {
        List<String> ids = new ArrayList<>();
        for (BlocElement element : selectedElements) {
            ids.add(element.elementId);
        }
        return ids;
    }
    
    // Helper methods
    
    private BlocElement findElementInTree(List<BlocElement> elements, String id) {
        for (BlocElement el : elements) {
            if (el.elementId.equals(id)) {
                return el;
            }
            BlocElement found = findElementInTree(el.children, id);
            if (found != null) {
                return found;
            }
        }
        return null;
    }
    
    private int findElementIndex(List<BlocElement> list, BlocElement element) {
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).elementId.equals(element.elementId)) {
                return i;
            }
        }
        return -1;
    }
    
    public List<BlocElement> getElementTree() {
        return elementTree;
    }
    
    public void setElementTree(List<BlocElement> elementTree) {
        this.elementTree = elementTree;
    }
}
