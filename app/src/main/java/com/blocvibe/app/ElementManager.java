package com.blocvibe.app;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * ElementManager - Advanced element management system
 * Handles operations like moving, deleting, wrapping elements in div, multi-selection
 */
public class ElementManager {
    private List<BlocElement> elementTree;
    private List<BlocElement> selectedElements;
    
    // تحسين الأداء للعمليات المتكررة
    private Map<String, BlocElement> elementCache;
    private Set<String> invalidationFlags;
    private long lastCacheUpdateTime;
    
    public ElementManager(List<BlocElement> elementTree) {
        this.elementTree = elementTree;
        this.selectedElements = new ArrayList<>();
        this.elementCache = new HashMap<>();
        this.invalidationFlags = new HashSet<>();
        this.lastCacheUpdateTime = System.currentTimeMillis();
        invalidateCache();
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
     * Enhanced with better validation and edge case handling
     */
    public boolean moveElementToParent(String elementId, String newParentId, int index) {
        android.util.Log.d("ElementManager", "📍 moveElementToParent: " + elementId + " -> " + newParentId + " @ " + index);
        
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) {
            android.util.Log.e("ElementManager", "❌ Element not found: " + elementId);
            return false;
        }
        
        // منع نقل عنصر إلى نفسه أو إلى أحد أطفاله
        if (elementId.equals(newParentId)) {
            android.util.Log.e("ElementManager", "❌ Cannot move element to itself");
            return false;
        }
        
        if (isDescendant(elementId, newParentId)) {
            android.util.Log.e("ElementManager", "❌ Cannot move element to its own descendant");
            return false;
        }
        
        // Remove from current parent
        String oldParentId = element.parentId;
        if (element.parentId == null) {
            elementTree.remove(element);
            android.util.Log.d("ElementManager", "📤 Removed from root");
        } else {
            BlocElement oldParent = findElementInTree(elementTree, element.parentId);
            if (oldParent != null) {
                oldParent.children.remove(element);
                android.util.Log.d("ElementManager", "📤 Removed from parent: " + oldParent.elementId);
            }
        }
        
        // Add to new parent
        // Handle both "root" and "body" as root level
        if (newParentId == null || newParentId.equals("root") || newParentId.equals("body")) {
            // Move to root
            element.parentId = null;
            if (index >= 0 && index < elementTree.size()) {
                elementTree.add(index, element);
                android.util.Log.d("ElementManager", "📥 Added to root at index: " + index);
            } else {
                elementTree.add(element);
                android.util.Log.d("ElementManager", "📥 Added to root at end");
            }
        } else {
            // Move to new parent
            BlocElement newParent = findElementInTree(elementTree, newParentId);
            if (newParent != null) {
                element.parentId = newParent.elementId;
                
                // التأكد من صحة الـ index
                int safeIndex = Math.max(0, Math.min(index, newParent.children.size()));
                newParent.children.add(safeIndex, element);
                
                android.util.Log.d("ElementManager", "📥 Added to parent: " + newParent.elementId + " at index: " + safeIndex);
            } else {
                android.util.Log.e("ElementManager", "❌ New parent not found: " + newParentId);
                
                // استعادة إلى المكان القديم في حالة الفشل
                restoreElementPosition(element, oldParentId);
                return false;
            }
        }
        
        android.util.Log.d("ElementManager", "✅ Element moved successfully");
        return true;
    }
    
    /**
     * التحقق من أن عنصر هو تابع لعنصر آخر
     */
    private boolean isDescendant(String potentialDescendantId, String ancestorId) {
        BlocElement ancestor = findElementInTree(elementTree, ancestorId);
        if (ancestor == null) return false;
        
        return checkDescendantRecursive(ancestor.children, potentialDescendantId);
    }
    
    private boolean checkDescendantRecursive(List<BlocElement> children, String targetId) {
        for (BlocElement child : children) {
            if (child.elementId.equals(targetId)) {
                return true;
            }
            if (checkDescendantRecursive(child.children, targetId)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * استعادة موضع العنصر في حالة فشل عملية النقل
     */
    private void restoreElementPosition(BlocElement element, String oldParentId) {
        if (oldParentId == null) {
            elementTree.add(element);
            element.parentId = null;
        } else {
            BlocElement oldParent = findElementInTree(elementTree, oldParentId);
            if (oldParent != null) {
                oldParent.children.add(element);
                element.parentId = oldParent.elementId;
            }
        }
        android.util.Log.d("ElementManager", "🔄 Element position restored");
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
    
    // ===== العمليات الجديدة للسحب والإفلات الداخلي =====
    
    /**
     * نقل عنصر داخل نفس العنصر الأب إلى موضع جديد
     */
    public boolean moveElementWithinParent(String elementId, int newIndex) {
        android.util.Log.d("ElementManager", "📍 moveElementWithinParent: " + elementId + " -> " + newIndex);
        
        if (!validateElementExists(elementId)) {
            return false;
        }
        
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) {
            android.util.Log.e("ElementManager", "❌ Element not found: " + elementId);
            return false;
        }
        
        List<BlocElement> parentList;
        if (element.parentId == null) {
            parentList = elementTree;
        } else {
            BlocElement parent = findElementInTree(elementTree, element.parentId);
            if (parent == null) {
                android.util.Log.e("ElementManager", "❌ Parent not found: " + element.parentId);
                return false;
            }
            parentList = parent.children;
        }
        
        int currentIndex = findElementIndex(parentList, element);
        if (currentIndex == -1) {
            android.util.Log.e("ElementManager", "❌ Element not found in parent list");
            return false;
        }
        
        // التحقق من صحة الموضع الجديد
        int safeNewIndex = Math.max(0, Math.min(newIndex, parentList.size() - 1));
        if (currentIndex == safeNewIndex) {
            android.util.Log.d("ElementManager", "ℹ️ Element already at target position");
            return true;
        }
        
        try {
            // إزالة من الموضع الحالي
            parentList.remove(currentIndex);
            // إضافة في الموضع الجديد
            parentList.add(safeNewIndex, element);
            
            invalidateCache();
            android.util.Log.d("ElementManager", "✅ Element moved within parent successfully");
            return true;
        } catch (Exception e) {
            android.util.Log.e("ElementManager", "❌ Error moving element within parent: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * إعادة ترتيب مجموعة من العناصر في نفس العنصر الأب
     */
    public boolean rearrangeElements(String parentId, List<String> elementIds) {
        android.util.Log.d("ElementManager", "📍 rearrangeElements: parent=" + parentId + ", count=" + elementIds.size());
        
        if (elementIds == null || elementIds.isEmpty()) {
            android.util.Log.e("ElementManager", "❌ Element IDs list is null or empty");
            return false;
        }
        
        // التحقق من وجود جميع العناصر
        for (String elementId : elementIds) {
            if (!validateElementExists(elementId)) {
                android.util.Log.e("ElementManager", "❌ Element not found: " + elementId);
                return false;
            }
        }
        
        List<BlocElement> parentList;
        if (parentId == null || parentId.equals("root")) {
            parentList = elementTree;
        } else {
            BlocElement parent = findElementInTree(elementTree, parentId);
            if (parent == null) {
                android.util.Log.e("ElementManager", "❌ Parent not found: " + parentId);
                return false;
            }
            parentList = parent.children;
        }
        
        // التحقق من أن جميع العناصر تنتمي لنفس العنصر الأب
        Set<String> parentIds = new HashSet<>();
        for (String elementId : elementIds) {
            BlocElement element = findElementInTree(elementTree, elementId);
            if (element != null) {
                parentIds.add(element.parentId);
            }
        }
        
        if (parentIds.size() > 1) {
            android.util.Log.e("ElementManager", "❌ Elements belong to different parents");
            return false;
        }
        
        try {
            // إزالة العناصر من قائمة الأساس
            List<BlocElement> elementsToMove = new ArrayList<>();
            for (String elementId : elementIds) {
                BlocElement element = findElementInTree(elementTree, elementId);
                if (element != null && parentList.contains(element)) {
                    parentList.remove(element);
                    elementsToMove.add(element);
                }
            }
            
            // إضافة العناصر بالترتيب الجديد
            for (int i = 0; i < elementsToMove.size() && i < parentList.size(); i++) {
                parentList.add(i, elementsToMove.get(i));
            }
            
            invalidateCache();
            android.util.Log.d("ElementManager", "✅ Elements rearranged successfully");
            return true;
        } catch (Exception e) {
            android.util.Log.e("ElementManager", "❌ Error rearranging elements: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * تبديل موضع عنصرين
     */
    public boolean swapElements(String element1Id, String element2Id) {
        android.util.Log.d("ElementManager", "📍 swapElements: " + element1Id + " <-> " + element2Id);
        
        if (element1Id == null || element2Id == null || element1Id.equals(element2Id)) {
            android.util.Log.e("ElementManager", "❌ Invalid element IDs for swap");
            return false;
        }
        
        BlocElement element1 = findElementInTree(elementTree, element1Id);
        BlocElement element2 = findElementInTree(elementTree, element2Id);
        
        if (element1 == null || element2 == null) {
            android.util.Log.e("ElementManager", "❌ One or both elements not found");
            return false;
        }
        
        // التحقق من أن العنصرين في نفس العنصر الأب
        if (!element1.parentId.equals(element2.parentId)) {
            android.util.Log.e("ElementManager", "❌ Elements have different parents");
            return false;
        }
        
        List<BlocElement> parentList;
        if (element1.parentId == null) {
            parentList = elementTree;
        } else {
            BlocElement parent = findElementInTree(elementTree, element1.parentId);
            if (parent == null) {
                android.util.Log.e("ElementManager", "❌ Parent not found: " + element1.parentId);
                return false;
            }
            parentList = parent.children;
        }
        
        try {
            int index1 = findElementIndex(parentList, element1);
            int index2 = findElementIndex(parentList, element2);
            
            if (index1 == -1 || index2 == -1) {
                android.util.Log.e("ElementManager", "❌ Could not find elements in parent list");
                return false;
            }
            
            // تبديل العناصر
            Collections.swap(parentList, index1, index2);
            
            invalidateCache();
            android.util.Log.d("ElementManager", "✅ Elements swapped successfully");
            return true;
        } catch (Exception e) {
            android.util.Log.e("ElementManager", "❌ Error swapping elements: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * الحصول على الموضع الأمثل لعنصر في العنصر الأب المستهدف
     */
    public int getOptimalPosition(String elementId, String targetParentId, String positionType) {
        android.util.Log.d("ElementManager", "📍 getOptimalPosition: " + elementId + " in " + targetParentId + " [" + positionType + "]");
        
        if (!validateElementExists(elementId)) {
            return -1;
        }
        
        BlocElement element = findElementInTree(elementTree, elementId);
        if (element == null) {
            return -1;
        }
        
        List<BlocElement> targetList;
        if (targetParentId == null || targetParentId.equals("root")) {
            targetList = elementTree;
        } else {
            BlocElement targetParent = findElementInTree(elementTree, targetParentId);
            if (targetParent == null) {
                android.util.Log.e("ElementManager", "❌ Target parent not found: " + targetParentId);
                return -1;
            }
            targetList = targetParent.children;
        }
        
        if (positionType == null) {
            return targetList.size(); // إضافة في النهاية افتراضياً
        }
        
        switch (positionType.toLowerCase()) {
            case "start":
            case "beginning":
            case "first":
                return 0;
            case "end":
            case "last":
            case "append":
                return targetList.size();
            case "middle":
            case "center":
                return targetList.size() / 2;
            case "before":
                // البحث عن العنصر المرجعي
                String refElementId = element.getProperty("beforeElementId");
                if (refElementId != null) {
                    BlocElement refElement = findElementInTree(elementTree, refElementId);
                    if (refElement != null && refElement.parentId != null && refElement.parentId.equals(targetParentId)) {
                        return findElementIndex(targetList, refElement);
                    }
                }
                return targetList.size() / 2;
            case "after":
                // البحث عن العنصر المرجعي
                refElementId = element.getProperty("afterElementId");
                if (refElementId != null) {
                    BlocElement refElement = findElementInTree(elementTree, refElementId);
                    if (refElement != null && refElement.parentId != null && refElement.parentId.equals(targetParentId)) {
                        int refIndex = findElementIndex(targetList, refElement);
                        return refIndex + 1;
                    }
                }
                return targetList.size();
            default:
                // محاولة تفسير الموضع كرقم
                try {
                    int position = Integer.parseInt(positionType);
                    return Math.max(0, Math.min(position, targetList.size()));
                } catch (NumberFormatException e) {
                    android.util.Log.e("ElementManager", "❌ Unknown position type: " + positionType);
                    return targetList.size();
                }
        }
    }
    
    /**
     * حساب التلميحات والتوجيهات للتخطيط
     */
    public Map<String, Object> calculateLayoutHints(List<String> elementIds) {
        android.util.Log.d("ElementManager", "📍 calculateLayoutHints for " + elementIds.size() + " elements");
        
        Map<String, Object> hints = new HashMap<>();
        if (elementIds == null || elementIds.isEmpty()) {
            android.util.Log.e("ElementManager", "❌ Element IDs list is null or empty");
            return hints;
        }
        
        List<BlocElement> elements = new ArrayList<>();
        for (String elementId : elementIds) {
            BlocElement element = findElementInTree(elementTree, elementId);
            if (element != null) {
                elements.add(element);
            }
        }
        
        if (elements.isEmpty()) {
            android.util.Log.e("ElementManager", "❌ No valid elements found");
            return hints;
        }
        
        // حساب الإحصائيات الأساسية
        hints.put("totalElements", elements.size());
        
        // تحليل أنواع العناصر
        Map<String, Integer> elementTypes = new HashMap<>();
        for (BlocElement element : elements) {
            String type = element.tag;
            elementTypes.put(type, elementTypes.getOrDefault(type, 0) + 1);
        }
        hints.put("elementTypes", elementTypes);
        
        // تحليل التخطيط الرأسي والأفقي
        boolean allHorizontal = true;
        boolean allVertical = true;
        
        for (BlocElement element : elements) {
            String display = element.getStyle("display");
            if (display != null) {
                allHorizontal = allHorizontal && display.equals("inline-block");
                allVertical = allVertical && (display.equals("block") || display.equals("flex"));
            }
        }
        
        hints.put("layoutType", allHorizontal ? "horizontal" : allVertical ? "vertical" : "mixed");
        hints.put("isConsistentLayout", allHorizontal || allVertical);
        
        // حساب المساحات والأبعاد
        int totalWidth = 0;
        int totalHeight = 0;
        int maxWidth = 0;
        int maxHeight = 0;
        
        for (BlocElement element : elements) {
            try {
                String width = element.getStyle("width");
                String height = element.getStyle("height");
                
                if (width != null) {
                    int w = parseCssValue(width);
                    totalWidth += w;
                    maxWidth = Math.max(maxWidth, w);
                }
                
                if (height != null) {
                    int h = parseCssValue(height);
                    totalHeight += h;
                    maxHeight = Math.max(maxHeight, h);
                }
            } catch (Exception e) {
                android.util.Log.w("ElementManager", "⚠️ Error parsing dimensions for element: " + element.elementId);
            }
        }
        
        hints.put("totalWidth", totalWidth);
        hints.put("totalHeight", totalHeight);
        hints.put("maxWidth", maxWidth);
        hints.put("maxHeight", maxHeight);
        hints.put("averageWidth", elements.size() > 0 ? totalWidth / elements.size() : 0);
        hints.put("averageHeight", elements.size() > 0 ? totalHeight / elements.size() : 0);
        
        // تحليل التخصصات (margins, paddings)
        int totalMargin = 0;
        int totalPadding = 0;
        
        for (BlocElement element : elements) {
            try {
                String margin = element.getStyle("margin");
                String padding = element.getStyle("padding");
                
                if (margin != null) {
                    totalMargin += parseCssValue(margin);
                }
                
                if (padding != null) {
                    totalPadding += parseCssValue(padding);
                }
            } catch (Exception e) {
                android.util.Log.w("ElementManager", "⚠️ Error parsing spacing for element: " + element.elementId);
            }
        }
        
        hints.put("totalMargin", totalMargin);
        hints.put("totalPadding", totalPadding);
        hints.put("averageMargin", elements.size() > 0 ? totalMargin / elements.size() : 0);
        hints.put("averagePadding", elements.size() > 0 ? totalPadding / elements.size() : 0);
        
        // اقتراحات للتخطيط الأمثل
        List<String> suggestions = new ArrayList<>();
        
        if (allHorizontal) {
            suggestions.add("Consider using flexbox for better horizontal alignment");
        }
        
        if (totalWidth > 1000) {
            suggestions.add("Total width is large, consider responsive design");
        }
        
        if (maxWidth > 500) {
            suggestions.add("Some elements have large width, check responsiveness");
        }
        
        if (totalPadding > 100) {
            suggestions.add("High padding detected, ensure mobile compatibility");
        }
        
        hints.put("suggestions", suggestions);
        hints.put("score", calculateLayoutScore(hints));
        
        android.util.Log.d("ElementManager", "✅ Layout hints calculated successfully");
        return hints;
    }
    
    // ===== أدوات حساب المواقع =====
    
    /**
     * حساب المسافة بين عنصرين
     */
    public int calculateDistance(String element1Id, String element2Id) {
        BlocElement element1 = findElementInTree(elementTree, element1Id);
        BlocElement element2 = findElementInTree(elementTree, element2Id);
        
        if (element1 == null || element2 == null) {
            return -1;
        }
        
        // حساب المسافة في الشجرة
        String lca = findLowestCommonAncestor(element1Id, element2Id);
        if (lca == null) {
            return -1;
        }
        
        int distance1 = getDepthFromAncestor(element1Id, lca);
        int distance2 = getDepthFromAncestor(element2Id, lca);
        
        return distance1 + distance2;
    }
    
    /**
     * العثور على أقرب جد مشترك لعنصرين
     */
    public String findLowestCommonAncestor(String element1Id, String element2Id) {
        Set<String> ancestors1 = getAllAncestors(element1Id);
        
        BlocElement element2 = findElementInTree(elementTree, element2Id);
        while (element2 != null) {
            if (ancestors1.contains(element2.elementId)) {
                return element2.elementId;
            }
            element2 = element2.parentId != null ? findElementInTree(elementTree, element2.parentId) : null;
        }
        
        return null;
    }
    
    /**
     * الحصول على عمق العنصر من جد معين
     */
    private int getDepthFromAncestor(String elementId, String ancestorId) {
        BlocElement element = findElementInTree(elementTree, elementId);
        int depth = 0;
        
        while (element != null && !element.elementId.equals(ancestorId)) {
            depth++;
            element = element.parentId != null ? findElementInTree(elementTree, element.parentId) : null;
        }
        
        return depth;
    }
    
    /**
     * الحصول على جميع الأجداد للعنصر
     */
    private Set<String> getAllAncestors(String elementId) {
        Set<String> ancestors = new HashSet<>();
        BlocElement element = findElementInTree(elementTree, elementId);
        
        while (element != null) {
            ancestors.add(element.elementId);
            element = element.parentId != null ? findElementInTree(elementTree, element.parentId) : null;
        }
        
        return ancestors;
    }
    
    // ===== طرق تحليل التخطيط =====
    
    /**
     * تحليل هيكل التخطيط الشجري
     */
    public Map<String, Object> analyzeLayoutStructure() {
        android.util.Log.d("ElementManager", "📍 Analyzing layout structure");
        
        Map<String, Object> analysis = new HashMap<>();
        
        // إحصائيات عامة
        int totalElements = countTotalElements(elementTree);
        int maxDepth = calculateMaxDepth(elementTree, 0);
        int elementTypes = calculateElementTypeCount();
        
        analysis.put("totalElements", totalElements);
        analysis.put("maxDepth", maxDepth);
        analysis.put("elementTypeCount", elementTypes);
        analysis.put("structureComplexity", calculateStructureComplexity(totalElements, maxDepth));
        
        // تحليل التوزيع
        Map<String, Integer> levelDistribution = analyzeLevelDistribution();
        analysis.put("levelDistribution", levelDistribution);
        
        // تحليل أنواع العناصر
        Map<String, Integer> typeDistribution = analyzeTypeDistribution();
        analysis.put("typeDistribution", typeDistribution);
        
        // التحقق من المشاكل
        List<String> issues = detectLayoutIssues();
        analysis.put("issues", issues);
        
        // حساب نقاط الهيكل
        analysis.put("structureScore", calculateStructureScore(totalElements, maxDepth, issues.size()));
        
        android.util.Log.d("ElementManager", "✅ Layout structure analyzed successfully");
        return analysis;
    }
    
    /**
     * تحليل توزيع المستويات في الشجرة
     */
    private Map<String, Integer> analyzeLevelDistribution() {
        Map<String, Integer> distribution = new HashMap<>();
        analyzeLevelRecursive(elementTree, 0, distribution);
        return distribution;
    }
    
    private void analyzeLevelRecursive(List<BlocElement> elements, int level, Map<String, Integer> distribution) {
        String levelKey = "level_" + level;
        distribution.put(levelKey, distribution.getOrDefault(levelKey, 0) + elements.size());
        
        for (BlocElement element : elements) {
            if (element.children != null && !element.children.isEmpty()) {
                analyzeLevelRecursive(element.children, level + 1, distribution);
            }
        }
    }
    
    /**
     * تحليل توزيع أنواع العناصر
     */
    private Map<String, Integer> analyzeTypeDistribution() {
        Map<String, Integer> distribution = new HashMap<>();
        analyzeTypeRecursive(elementTree, distribution);
        return distribution;
    }
    
    private void analyzeTypeRecursive(List<BlocElement> elements, Map<String, Integer> distribution) {
        for (BlocElement element : elements) {
            String type = element.tag;
            distribution.put(type, distribution.getOrDefault(type, 0) + 1);
            
            if (element.children != null && !element.children.isEmpty()) {
                analyzeTypeRecursive(element.children, distribution);
            }
        }
    }
    
    /**
     * كشف مشاكل التخطيط المحتملة
     */
    private List<String> detectLayoutIssues() {
        List<String> issues = new ArrayList<>();
        
        // فحص العناصر العميقة جداً
        int maxDepth = calculateMaxDepth(elementTree, 0);
        if (maxDepth > 10) {
            issues.add("Deep nesting detected (depth: " + maxDepth + ")");
        }
        
        // فحص العناصر ذات الكثير من الأطفال
        detectLargeFamilies(elementTree, issues);
        
        // فحص العناصر المتشابهة
        detectSimilarElements(elementTree, issues);
        
        return issues;
    }
    
    private void detectLargeFamilies(List<BlocElement> elements, List<String> issues) {
        for (BlocElement element : elements) {
            if (element.children != null && element.children.size() > 20) {
                issues.add("Element " + element.elementId + " has too many children (" + element.children.size() + ")");
            }
            
            if (element.children != null && !element.children.isEmpty()) {
                detectLargeFamilies(element.children, issues);
            }
        }
    }
    
    private void detectSimilarElements(List<BlocElement> elements, List<String> issues) {
        Map<String, Integer> typeCount = new HashMap<>();
        
        for (BlocElement element : elements) {
            String key = element.tag;
            typeCount.put(key, typeCount.getOrDefault(key, 0) + 1);
        }
        
        for (Map.Entry<String, Integer> entry : typeCount.entrySet()) {
            if (entry.getValue() > 10) {
                issues.add("Too many " + entry.getKey() + " elements (" + entry.getValue() + ")");
            }
        }
    }
    
    // ===== تحسينات الأداء والتحقق المحسن =====
    
    /**
     * التحقق من وجود العنصر مع تحسين الأداء
     */
    private boolean validateElementExists(String elementId) {
        if (elementId == null || elementId.trim().isEmpty()) {
            android.util.Log.e("ElementManager", "❌ Element ID is null or empty");
            return false;
        }
        
        return findElementInTree(elementTree, elementId) != null;
    }
    
    /**
     * إبطال التخزين المؤقت للتحديث
     */
    private void invalidateCache() {
        elementCache.clear();
        invalidationFlags.clear();
        lastCacheUpdateTime = System.currentTimeMillis();
        android.util.Log.d("ElementManager", "🔄 Cache invalidated");
    }
    
    /**
     * تحديث التخزين المؤقت
     */
    private void updateCache() {
        long currentTime = System.currentTimeMillis();
        if (currentTime - lastCacheUpdateTime > 5000) { // تحديث كل 5 ثوان
            elementCache.clear();
            buildCacheRecursive(elementTree);
            lastCacheUpdateTime = currentTime;
            android.util.Log.d("ElementManager", "🔄 Cache updated");
        }
    }
    
    private void buildCacheRecursive(List<BlocElement> elements) {
        for (BlocElement element : elements) {
            elementCache.put(element.elementId, element);
            if (element.children != null && !element.children.isEmpty()) {
                buildCacheRecursive(element.children);
            }
        }
    }
    
    /**
     * البحث المحسن عن العنصر باستخدام التخزين المؤقت
     */
    private BlocElement findElementOptimized(String elementId) {
        updateCache();
        return elementCache.get(elementId);
    }
    
    // Helper methods للتقييم والتحليل
    
    private int countTotalElements(List<BlocElement> elements) {
        int count = elements.size();
        for (BlocElement element : elements) {
            if (element.children != null) {
                count += countTotalElements(element.children);
            }
        }
        return count;
    }
    
    private int calculateMaxDepth(List<BlocElement> elements, int currentDepth) {
        int maxDepth = currentDepth;
        for (BlocElement element : elements) {
            if (element.children != null && !element.children.isEmpty()) {
                maxDepth = Math.max(maxDepth, calculateMaxDepth(element.children, currentDepth + 1));
            }
        }
        return maxDepth;
    }
    
    private int calculateElementTypeCount() {
        Set<String> types = new HashSet<>();
        calculateElementTypeCountRecursive(elementTree, types);
        return types.size();
    }
    
    private void calculateElementTypeCountRecursive(List<BlocElement> elements, Set<String> types) {
        for (BlocElement element : elements) {
            types.add(element.tag);
            if (element.children != null) {
                calculateElementTypeCountRecursive(element.children, types);
            }
        }
    }
    
    private double calculateStructureComplexity(int totalElements, int maxDepth) {
        if (totalElements == 0) return 0.0;
        return (double) totalElements / (maxDepth + 1);
    }
    
    private int calculateLayoutScore(Map<String, Object> hints) {
        int score = 100;
        
        // خصم نقاط للأداء الضعيف
        Boolean isConsistentLayout = (Boolean) hints.get("isConsistentLayout");
        if (isConsistentLayout != null && !isConsistentLayout) {
            score -= 20;
        }
        
        Integer totalWidth = (Integer) hints.get("totalWidth");
        if (totalWidth != null && totalWidth > 1000) {
            score -= 10;
        }
        
        List<String> suggestions = (List<String>) hints.get("suggestions");
        if (suggestions != null) {
            score -= suggestions.size() * 5;
        }
        
        return Math.max(0, score);
    }
    
    private double calculateStructureScore(int totalElements, int maxDepth, int issueCount) {
        double baseScore = 100.0;
        
        // خصم للعقد العميقة
        baseScore -= Math.max(0, maxDepth - 5) * 3;
        
        // خصم للمشاكل المكتشفة
        baseScore -= issueCount * 5;
        
        // مكافأة للتنوع المعقول
        if (totalElements > 0 && totalElements < 100) {
            baseScore += 10;
        }
        
        return Math.max(0.0, Math.min(100.0, baseScore));
    }
    
    private int parseCssValue(String value) {
        if (value == null || value.trim().isEmpty()) {
            return 0;
        }
        
        value = value.trim().toLowerCase();
        String numericPart = value.replaceAll("[^0-9.-]", "");
        
        if (numericPart.isEmpty()) {
            return 0;
        }
        
        try {
            return Integer.parseInt(numericPart);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
    
    // Helper methods
    
    private BlocElement findElementInTree(List<BlocElement> elements, String id) {
        // استخدام التخزين المؤقت للبحث المحسن
        BlocElement cached = findElementOptimized(id);
        if (cached != null) {
            return cached;
        }
        
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
        invalidateCache(); // إبطال التخزين المؤقت عند تحديث الشجرة
    }
    
    /**
     * تنظيف وإصلاح هيكل الشجرة
     */
    public void validateAndFixTreeStructure() {
        android.util.Log.d("ElementManager", "🔧 Validating and fixing tree structure");
        
        if (elementTree == null) {
            android.util.Log.e("ElementManager", "❌ Element tree is null");
            return;
        }
        
        validateAndFixRecursive(elementTree, null);
        invalidateCache();
        android.util.Log.d("ElementManager", "✅ Tree structure validated and fixed");
    }
    
    private void validateAndFixRecursive(List<BlocElement> elements, String parentId) {
        for (BlocElement element : elements) {
            // إصلاح مرجع العنصر الأب
            if (parentId != null && !parentId.equals(element.parentId)) {
                android.util.Log.d("ElementManager", "🔧 Fixing parent reference for " + element.elementId);
                element.parentId = parentId;
            }
            
            // التحقق من وجود جميع الأطفال في نفس القائمة
            if (element.children != null) {
                for (BlocElement child : element.children) {
                    if (child.parentId != null && !child.parentId.equals(element.elementId)) {
                        android.util.Log.d("ElementManager", "🔧 Fixing child parent reference for " + child.elementId);
                        child.parentId = element.elementId;
                    }
                }
                
                validateAndFixRecursive(element.children, element.elementId);
            }
        }
    }
    
    /**
     * استنساخ العنصر مع جميع أطفاله
     */
    public BlocElement deepCloneElement(String elementId) {
        BlocElement original = findElementInTree(elementTree, elementId);
        if (original == null) {
            android.util.Log.e("ElementManager", "❌ Element not found for deep clone: " + elementId);
            return null;
        }
        
        BlocElement clone = original.clone();
        clone.elementId = generateUniqueElementId();
        
        // استنساخ الأطفال بشكل متكرر
        if (original.children != null) {
            clone.children = new ArrayList<>();
            for (BlocElement child : original.children) {
                BlocElement clonedChild = deepCloneElementRecursive(child);
                clonedChild.parentId = clone.elementId;
                clone.children.add(clonedChild);
            }
        }
        
        android.util.Log.d("ElementManager", "✅ Element deep cloned: " + elementId + " -> " + clone.elementId);
        return clone;
    }
    
    private BlocElement deepCloneElementRecursive(BlocElement element) {
        BlocElement clone = element.clone();
        clone.elementId = generateUniqueElementId();
        
        if (element.children != null) {
            clone.children = new ArrayList<>();
            for (BlocElement child : element.children) {
                BlocElement clonedChild = deepCloneElementRecursive(child);
                clonedChild.parentId = clone.elementId;
                clone.children.add(clonedChild);
            }
        }
        
        return clone;
    }
    
    /**
     * إنشاء معرف فريد للعنصر
     */
    private String generateUniqueElementId() {
        return "element_" + System.currentTimeMillis() + "_" + (int)(Math.random() * 1000);
    }
    
    /**
     * البحث عن العناصر بواسطة النوع
     */
    public List<String> findElementsByType(String elementType) {
        List<String> foundIds = new ArrayList<>();
        if (elementType == null || elementType.trim().isEmpty()) {
            return foundIds;
        }
        
        findElementsByTypeRecursive(elementTree, elementType.trim(), foundIds);
        return foundIds;
    }
    
    private void findElementsByTypeRecursive(List<BlocElement> elements, String elementType, List<String> foundIds) {
        for (BlocElement element : elements) {
            if (element.tag != null && element.tag.equals(elementType)) {
                foundIds.add(element.elementId);
            }
            
            if (element.children != null) {
                findElementsByTypeRecursive(element.children, elementType, foundIds);
            }
        }
    }
    
    /**
     * البحث عن العناصر بواسطة خاصية
     */
    public List<String> findElementsByProperty(String propertyName, String propertyValue) {
        List<String> foundIds = new ArrayList<>();
        if (propertyName == null || propertyName.trim().isEmpty()) {
            return foundIds;
        }
        
        findElementsByPropertyRecursive(elementTree, propertyName.trim(), propertyValue, foundIds);
        return foundIds;
    }
    
    private void findElementsByPropertyRecursive(List<BlocElement> elements, String propertyName, String propertyValue, List<String> foundIds) {
        for (BlocElement element : elements) {
            String elementValue = element.getProperty(propertyName);
            if (propertyValue == null) {
                if (elementValue != null) {
                    foundIds.add(element.elementId);
                }
            } else if (propertyValue.equals(elementValue)) {
                foundIds.add(element.elementId);
            }
            
            if (element.children != null) {
                findElementsByPropertyRecursive(element.children, propertyName, propertyValue, foundIds);
            }
        }
    }
    
    /**
     * الحصول على إحصائيات مفصلة للعناصر
     */
    public Map<String, Object> getDetailedElementStatistics() {
        android.util.Log.d("ElementManager", "📊 Calculating detailed element statistics");
        
        Map<String, Object> stats = new HashMap<>();
        
        // إحصائيات أساسية
        int totalElements = countTotalElements(elementTree);
        int totalDepth = calculateMaxDepth(elementTree, 0);
        
        stats.put("totalElements", totalElements);
        stats.put("maxDepth", totalDepth);
        stats.put("averageDepth", calculateAverageDepth());
        
        // إحصائيات الأنواع
        Map<String, Integer> typeStats = new HashMap<>();
        Map<String, Integer> typeDepthStats = new HashMap<>();
        
        calculateTypeStatisticsRecursive(elementTree, 0, typeStats, typeDepthStats);
        stats.put("typeCounts", typeStats);
        stats.put("typeDepthAverages", typeDepthStats);
        
        // إحصائيات التوزيع
        stats.put("elementsPerLevel", analyzeLevelDistribution());
        stats.put("childrenDistribution", calculateChildrenDistribution());
        
        // مؤشرات الأداء
        stats.put("structureBalance", calculateStructureBalance());
        stats.put("redundancyScore", calculateRedundancyScore());
        
        android.util.Log.d("ElementManager", "✅ Detailed statistics calculated");
        return stats;
    }
    
    private double calculateAverageDepth() {
        return calculateAverageDepthRecursive(elementTree, 0) / (double) countTotalElements(elementTree);
    }
    
    private double calculateAverageDepthRecursive(List<BlocElement> elements, int currentDepth) {
        double total = elements.size() * currentDepth;
        for (BlocElement element : elements) {
            if (element.children != null) {
                total += calculateAverageDepthRecursive(element.children, currentDepth + 1);
            }
        }
        return total;
    }
    
    private void calculateTypeStatisticsRecursive(List<BlocElement> elements, int depth, 
                                                Map<String, Integer> typeCounts, 
                                                Map<String, Integer> typeDepthSum) {
        for (BlocElement element : elements) {
            // عدد الأنواع
            typeCounts.put(element.tag, typeCounts.getOrDefault(element.tag, 0) + 1);
            
            // مجموع العمق لكل نوع
            typeDepthSum.put(element.tag, typeDepthSum.getOrDefault(element.tag, 0) + depth);
            
            if (element.children != null) {
                calculateTypeStatisticsRecursive(element.children, depth + 1, typeCounts, typeDepthSum);
            }
        }
    }
    
    private Map<String, Integer> calculateChildrenDistribution() {
        Map<String, Integer> distribution = new HashMap<>();
        calculateChildrenDistributionRecursive(elementTree, distribution);
        return distribution;
    }
    
    private void calculateChildrenDistributionRecursive(List<BlocElement> elements, Map<String, Integer> distribution) {
        for (BlocElement element : elements) {
            int childCount = element.children != null ? element.children.size() : 0;
            String category;
            if (childCount == 0) {
                category = "leaf";
            } else if (childCount <= 3) {
                category = "small";
            } else if (childCount <= 10) {
                category = "medium";
            } else {
                category = "large";
            }
            
            distribution.put(category, distribution.getOrDefault(category, 0) + 1);
            
            if (element.children != null) {
                calculateChildrenDistributionRecursive(element.children, distribution);
            }
        }
    }
    
    private double calculateStructureBalance() {
        Map<String, Integer> levelDist = analyzeLevelDistribution();
        if (levelDist.isEmpty()) return 0.0;
        
        int total = 0;
        for (int count : levelDist.values()) {
            total += count;
        }
        
        double variance = 0.0;
        int levelCount = levelDist.size();
        
        if (levelCount == 0) return 0.0;
        
        double mean = total / (double) levelCount;
        
        for (int count : levelDist.values()) {
            variance += Math.pow(count - mean, 2);
        }
        
        variance /= levelCount;
        return Math.sqrt(variance) / mean; // معامل التباين النسبي
    }
    
    private double calculateRedundancyScore() {
        Map<String, List<String>> elementsByType = new HashMap<>();
        findElementsByTypeRecursiveForStats(elementTree, elementsByType);
        
        double totalRedundancy = 0.0;
        int typeCount = 0;
        
        for (Map.Entry<String, List<String>> entry : elementsByType.entrySet()) {
            int count = entry.getValue().size();
            if (count > 1) {
                totalRedundancy += (double) (count - 1) / count;
            }
            typeCount++;
        }
        
        return typeCount > 0 ? totalRedundancy / typeCount : 0.0;
    }
    
    private void findElementsByTypeRecursiveForStats(List<BlocElement> elements, Map<String, List<String>> typeMap) {
        for (BlocElement element : elements) {
            String type = element.tag;
            if (!typeMap.containsKey(type)) {
                typeMap.put(type, new ArrayList<>());
            }
            typeMap.get(type).add(element.elementId);
            
            if (element.children != null) {
                findElementsByTypeRecursiveForStats(element.children, typeMap);
            }
        }
    }
}
