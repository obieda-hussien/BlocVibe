package com.blocvibe.app;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONException;

/**
 * WebAppInterface - JavaScript Bridge for WebView communication
 * This class provides methods that can be called from JavaScript in the WebView
 * to communicate back to the Java/Android application.
 * 
 * NEW FEATURES:
 * - Enhanced Internal Drag System with detailed callbacks
 * - Advanced position calculation and visual feedback
 * - Drop zone activation system
 * - Comprehensive error handling and logging
 * - Advanced Properties Panel System with callbacks
 * - Property management methods and validation
 * - Enhanced error handling for property operations
 */
public class WebAppInterface {
    private static final String TAG = "WebAppInterface";
    private EditorActivity activity;

    public WebAppInterface(EditorActivity activity) {
        this.activity = activity;
        Log.d(TAG, "WebAppInterface initialized");
    }

    /**
     * Called from JavaScript when an element is clicked/selected in the WebView
     * @param elementId The unique ID of the selected element
     */
    @JavascriptInterface
    public void onElementSelected(String elementId) {
        try {
            Log.d(TAG, "Element selected: " + elementId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementSelection(elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementSelected: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when an element's text content is changed
     * @param elementId The unique ID of the element
     * @param newText The new text content
     */
    @JavascriptInterface
    public void onElementTextChanged(String elementId, String newText) {
        try {
            Log.d(TAG, "Element text changed: " + elementId + " -> " + newText);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementTextChange(elementId, newText);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementTextChanged: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript to log messages to Android console
     * @param message The message to log
     */
    @JavascriptInterface
    public void log(String message) {
        try {
            Log.d(TAG, "JS Log: " + message);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    Toast.makeText(activity, "JS: " + message, Toast.LENGTH_SHORT).show();
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in log method: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when the page is fully loaded
     * Enhanced version with system readiness check
     */
    @JavascriptInterface
    public void onPageReadyEnhanced() {
        try {
            Log.d(TAG, "Page ready enhanced called");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.onWebViewPageReady();
                    Log.d(TAG, "Enhanced page ready processed");
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onPageReadyEnhanced: " + e.getMessage());
        }
    }
    
    /**
     * Legacy method for backward compatibility
     */
    @JavascriptInterface
    public void onPageReady() {
        onPageReadyEnhanced();
    }

    /**
     * Called from JavaScript when an element is moved (drag & drop)
     * @param elementId The ID of the moved element
     * @param newParentId The ID of the new parent (or "root")
     * @param index The new position index
     */
    @JavascriptInterface
    public void onElementMoved(String elementId, String newParentId, int index) {
        try {
            Log.d(TAG, "Element moved: " + elementId + " to parent: " + newParentId + " at index: " + index);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementMove(elementId, newParentId, index);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementMoved: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when an element should be moved up
     * @param elementId The ID of the element to move
     */
    @JavascriptInterface
    public void onElementMoveUp(String elementId) {
        try {
            Log.d(TAG, "Element move up: " + elementId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementMoveUp(elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementMoveUp: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when an element should be moved down
     * @param elementId The ID of the element to move
     */
    @JavascriptInterface
    public void onElementMoveDown(String elementId) {
        try {
            Log.d(TAG, "Element move down: " + elementId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementMoveDown(elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementMoveDown: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when an element should be deleted
     * @param elementId The ID of the element to delete
     */
    @JavascriptInterface
    public void onElementDelete(String elementId) {
        try {
            Log.d(TAG, "Element delete: " + elementId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementDelete(elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementDelete: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when an element should be duplicated
     * @param elementId The ID of the element to duplicate
     */
    @JavascriptInterface
    public void onElementDuplicate(String elementId) {
        try {
            Log.d(TAG, "Element duplicate: " + elementId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementDuplicate(elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementDuplicate: " + e.getMessage());
        }
    }

    /**
     * Called from JavaScript when multiple elements should be wrapped in a div
     * @param elementIdsJson JSON array of element IDs to wrap
     */
    @JavascriptInterface
    public void onElementsWrapInDiv(String elementIdsJson) {
        try {
            Log.d(TAG, "Elements wrap in div: " + elementIdsJson);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementsWrapInDiv(elementIdsJson);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementsWrapInDiv: " + e.getMessage());
        }
    }
    
    // ============================================
    // INTERNAL DRAG SYSTEM - NEW FEATURES
    // ============================================
    
    /**
     * Called when internal drag operation starts
     * @param elementId The ID of the element being dragged
     * @param elementType Type of element (text, image, container, etc.)
     */
    @JavascriptInterface
    public void onInternalDragStart(String elementId, String elementType) {
        try {
            Log.d(TAG, "Internal drag start: " + elementId + " (type: " + elementType + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // TODO: Implement internal drag start handling
                    Log.d(TAG, "Internal drag start processed for: " + elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onInternalDragStart: " + e.getMessage());
        }
    }
    
    /**
     * Called during internal drag operation
     * @param elementId The ID of the element being dragged
     * @param newPosition JSON string containing new position coordinates
     * @param dragType Type of drag operation (move, resize, etc.)
     */
    @JavascriptInterface
    public void onInternalDragMove(String elementId, String newPosition, String dragType) {
        try {
            Log.d(TAG, "Internal drag move: " + elementId + " at " + newPosition + " (type: " + dragType + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // TODO: Implement internal drag move handling
                    Log.d(TAG, "Internal drag move processed for: " + elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onInternalDragMove: " + e.getMessage());
        }
    }
    
    /**
     * Called when internal drag operation ends
     * @param elementId The ID of the element that was dragged
     * @param success Whether the drag operation was successful
     * @param finalPosition JSON string containing final position coordinates
     */
    @JavascriptInterface
    public void onInternalDragEnd(String elementId, boolean success, String finalPosition) {
        try {
            Log.d(TAG, "Internal drag end: " + elementId + " (success: " + success + " at " + finalPosition + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // TODO: Implement internal drag end handling
                    Log.d(TAG, "Internal drag end processed for: " + elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onInternalDragEnd: " + e.getMessage());
        }
    }
    
    /**
     * Called when a drop zone becomes active
     * @param zoneType Type of drop zone (container, position, etc.)
     * @param targetElementId ID of the target element for the drop
     */
    @JavascriptInterface
    public void onDropZoneActivated(String zoneType, String targetElementId) {
        try {
            Log.d(TAG, "Drop zone activated: " + zoneType + " (target: " + targetElementId + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // TODO: Implement drop zone activation handling
                    Log.d(TAG, "Drop zone activation processed: " + zoneType);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onDropZoneActivated: " + e.getMessage());
        }
    }
    
    /**
     * Called when optimal position is calculated for an element
     * @param elementId The ID of the element
     * @param optimalPosition JSON string containing calculated optimal position
     * @param layoutHint Hint about the layout (grid, flex, absolute, etc.)
     */
    @JavascriptInterface
    public void onPositionCalculated(String elementId, String optimalPosition, String layoutHint) {
        try {
            Log.d(TAG, "Position calculated for " + elementId + ": " + optimalPosition + " (hint: " + layoutHint + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // TODO: Implement position calculation handling
                    Log.d(TAG, "Position calculation processed for: " + elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onPositionCalculated: " + e.getMessage());
        }
    }
    
    /**
     * Called to update visual feedback during drag operations
     * @param feedbackType Type of visual feedback (highlight, ghost, snap-line, etc.)
     * @param elementId The ID of the element the feedback applies to
     * @param state Current state of the visual feedback (active, inactive, hover, etc.)
     */
    @JavascriptInterface
    public void onVisualFeedbackUpdate(String feedbackType, String elementId, String state) {
        try {
            Log.d(TAG, "Visual feedback update: " + feedbackType + " for " + elementId + " (state: " + state + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    // TODO: Implement visual feedback handling
                    Log.d(TAG, "Visual feedback processed: " + feedbackType);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onVisualFeedbackUpdate: " + e.getMessage());
        }
    }
    
    /**
     * Enhanced error logging and reporting method
     * @param errorType Type of error that occurred
     * @param errorMessage Detailed error message
     * @param context Additional context information
     */
    @JavascriptInterface
    public void reportError(String errorType, String errorMessage, String context) {
        try {
            String fullErrorMsg = String.format("Error [%s]: %s | Context: %s", errorType, errorMessage, context);
            Log.e(TAG, fullErrorMsg);
            
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    Toast.makeText(activity, "Error: " + errorMessage, Toast.LENGTH_LONG).show();
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Critical error in reportError: " + e.getMessage());
        }
    }
    
    /**
     * Debug information method for development
     * @param debugInfo JSON string containing debug information
     */
    @JavascriptInterface
    public void debugInfo(String debugInfo) {
        try {
            Log.d(TAG, "Debug info: " + debugInfo);
        } catch (Exception e) {
            Log.e(TAG, "Error in debugInfo: " + e.getMessage());
        }
    }
    
    /**
     * Performance monitoring method
     * @param operationName Name of the operation being monitored
     * @param duration Duration in milliseconds
     * @param success Whether the operation was successful
     */
    @JavascriptInterface
    public void performanceLog(String operationName, long duration, boolean success) {
        try {
            String result = success ? "SUCCESS" : "FAILURE";
            Log.d(TAG, String.format("Performance [%s]: %dms - %s", operationName, duration, result));
        } catch (Exception e) {
            Log.e(TAG, "Error in performanceLog: " + e.getMessage());
        }
    }
    
    // ============================================
    // ADVANCED PROPERTIES PANEL SYSTEM
    // ============================================
    
    /**
     * استدعاء من JavaScript عندما يتم طلب فتح لوحة الخصائص لعنصر معين
     * Called from JavaScript when Properties Panel is requested for an element
     * @param elementId معرف العنصر المراد عرض خصائصه
     */
    @JavascriptInterface
    public void onPropertiesPanelRequested(String elementId) {
        try {
            Log.d(TAG, "Properties panel requested for element: " + elementId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handlePropertiesPanelRequest(elementId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onPropertiesPanelRequested: " + e.getMessage());
            reportError("PROPERTIES_PANEL_ERROR", "خطأ في طلب لوحة الخصائص: " + e.getMessage(), "onPropertiesPanelRequested");
        }
    }
    
    /**
     * استدعاء من JavaScript عند اكتمال تحديث خاصية عنصر
     * Called from JavaScript when element property update is complete
     * @param elementId معرف العنصر الذي تم تحديثه
     * @param success حالة نجاح العملية
     */
    @JavascriptInterface
    public void onPropertyUpdateComplete(String elementId, boolean success) {
        try {
            String result = success ? "نجح" : "فشل";
            Log.d(TAG, "Property update complete for " + elementId + ": " + result);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handlePropertyUpdateComplete(elementId, success);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onPropertyUpdateComplete: " + e.getMessage());
        }
    }
    
    /**
     * استدعاء من JavaScript عند فشل التحقق من صحة خاصية
     * Called from JavaScript when property validation fails
     * @param elementId معرف العنصر
     * @param errors رسائل الأخطاء مفصولة بفواصل
     */
    @JavascriptInterface
    public void onPropertyValidationFailed(String elementId, String errors) {
        try {
            Log.w(TAG, "Property validation failed for " + elementId + ": " + errors);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handlePropertyValidationFailed(elementId, errors);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onPropertyValidationFailed: " + e.getMessage());
        }
    }
    
    /**
     * استدعاء من JavaScript عند تغيير خاصية عنصر
     * Called from JavaScript when element property is changed
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @param value القيمة الجديدة
     */
    @JavascriptInterface
    public void onElementPropertyChanged(String elementId, String property, String value) {
        try {
            Log.d(TAG, "Element property changed: " + elementId + "." + property + " = " + value);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleElementPropertyChanged(elementId, property, value);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onElementPropertyChanged: " + e.getMessage());
            reportError("PROPERTY_CHANGE_ERROR", "خطأ في تغيير الخاصية: " + e.getMessage(), "onElementPropertyChanged");
        }
    }
    
    // ============================================
    // PROPERTY MANAGEMENT METHODS
    // ============================================
    
    /**
     * طلب خصائص عنصر محدد من التطبيق
     * Request properties for a specific element from the app
     * @param elementId معرف العنصر
     * @return JSON string containing element properties or empty string on error
     */
    @JavascriptInterface
    public String requestElementProperties(String elementId) {
        try {
            Log.d(TAG, "Requesting properties for element: " + elementId);
            if (activity != null) {
                return activity.getElementProperties(elementId);
            } else {
                Log.w(TAG, "Activity is null in requestElementProperties");
                return "";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in requestElementProperties: " + e.getMessage());
            return "";
        }
    }
    
    /**
     * تحديث خاصية عنصر محدد
     * Update a specific property for an element
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @param value القيمة الجديدة
     * @return true if update was initiated successfully, false otherwise
     */
    @JavascriptInterface
    public boolean updateElementProperty(String elementId, String property, String value) {
        try {
            Log.d(TAG, "Updating property: " + elementId + "." + property + " = " + value);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.updateElementProperty(elementId, property, value);
                });
                return true;
            } else {
                Log.w(TAG, "Activity is null in updateElementProperty");
                return false;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in updateElementProperty: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * التحقق من صحة تغيير خاصية قبل التطبيق
     * Validate a property change before applying
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @param value القيمة المراد التحقق منها
     * @return JSON string with validation result {valid: boolean, errors: []}
     */
    @JavascriptInterface
    public String validatePropertyChange(String elementId, String property, String value) {
        try {
            Log.d(TAG, "Validating property change: " + elementId + "." + property + " = " + value);
            if (activity != null) {
                return activity.validatePropertyChange(elementId, property, value);
            } else {
                Log.w(TAG, "Activity is null in validatePropertyChange");
                return "{\"valid\": false, \"errors\": [\"النشاط غير متاح\"]}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in validatePropertyChange: " + e.getMessage());
            return "{\"valid\": false, \"errors\": [\"خطأ في التحقق: " + e.getMessage() + "\"]}";
        }
    }
    
    /**
     * الحصول على نوع عنصر محدد
     * Get the type of a specific element
     * @param elementId معرف العنصر
     * @return نوع العنصر أو سلسلة فارغة في حالة الخطأ
     */
    @JavascriptInterface
    public String getElementType(String elementId) {
        try {
            Log.d(TAG, "Getting element type for: " + elementId);
            if (activity != null) {
                return activity.getElementType(elementId);
            } else {
                Log.w(TAG, "Activity is null in getElementType");
                return "";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in getElementType: " + e.getMessage());
            return "";
        }
    }
    
    /**
     * الحصول على قائمة بجميع الخصائص المتاحة لعنصر معين
     * Get list of all available properties for an element
     * @param elementId معرف العنصر
     * @param elementType نوع العنصر (اختياري)
     * @return JSON string with available properties and their configurations
     */
    @JavascriptInterface
    public String getAvailableProperties(String elementId, String elementType) {
        try {
            Log.d(TAG, "Getting available properties for: " + elementId + " (type: " + elementType + ")");
            if (activity != null) {
                return activity.getAvailableProperties(elementId, elementType);
            } else {
                Log.w(TAG, "Activity is null in getAvailableProperties");
                return "{}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in getAvailableProperties: " + e.getMessage());
            return "{}";
        }
    }
    
    /**
     * حفظ خصائص متعددة لعنصر في عملية واحدة
     * Save multiple properties for an element in one operation
     * @param elementId معرف العنصر
     * @param propertiesJson JSON string containing properties to update
     * @return JSON string with save operation result
     */
    @JavascriptInterface
    public String saveMultipleProperties(String elementId, String propertiesJson) {
        try {
            Log.d(TAG, "Saving multiple properties for: " + elementId + ", properties: " + propertiesJson);
            if (activity != null) {
                return activity.saveMultipleProperties(elementId, propertiesJson);
            } else {
                Log.w(TAG, "Activity is null in saveMultipleProperties");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in saveMultipleProperties: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في الحفظ: " + e.getMessage() + "\"}";
        }
    }
    
    /**
     * إعادة تعيين خاصية عنصر إلى قيمتها الافتراضية
     * Reset an element property to its default value
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @return JSON string with reset operation result
     */
    @JavascriptInterface
    public String resetPropertyToDefault(String elementId, String property) {
        try {
            Log.d(TAG, "Resetting property to default: " + elementId + "." + property);
            if (activity != null) {
                return activity.resetPropertyToDefault(elementId, property);
            } else {
                Log.w(TAG, "Activity is null in resetPropertyToDefault");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in resetPropertyToDefault: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في إعادة التعيين: " + e.getMessage() + "\"}";
        }
    }
    
    /**
     * نسخ خصائص من عنصر إلى آخر
     * Copy properties from one element to another
     * @param sourceElementId معرف العنصر المصدر
     * @param targetElementId معرف العنصر الهدف
     * @param propertiesJson قائمة الخصائص المراد نسخها (JSON array)
     * @return JSON string with copy operation result
     */
    @JavascriptInterface
    public String copyProperties(String sourceElementId, String targetElementId, String propertiesJson) {
        try {
            Log.d(TAG, "Copying properties from " + sourceElementId + " to " + targetElementId);
            if (activity != null) {
                return activity.copyProperties(sourceElementId, targetElementId, propertiesJson);
            } else {
                Log.w(TAG, "Activity is null in copyProperties");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in copyProperties: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في النسخ: " + e.getMessage() + "\"}";
        }
    }
    
    /**
     * تصدير خصائص عنصر بصيغة JSON
     * Export element properties to JSON format
     * @param elementId معرف العنصر
     * @param includeSystemProperties تضمين خصائص النظام
     * @return JSON string with exported properties
     */
    @JavascriptInterface
    public String exportProperties(String elementId, boolean includeSystemProperties) {
        try {
            Log.d(TAG, "Exporting properties for: " + elementId + " (include system: " + includeSystemProperties + ")");
            if (activity != null) {
                return activity.exportProperties(elementId, includeSystemProperties);
            } else {
                Log.w(TAG, "Activity is null in exportProperties");
                return "{}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in exportProperties: " + e.getMessage());
            return "{}";
        }
    }
    
    /**
     * استيراد خصائص عنصر من JSON
     * Import element properties from JSON format
     * @param elementId معرف العنصر
     * @param propertiesJson JSON string with properties to import
     * @return JSON string with import operation result
     */
    @JavascriptInterface
    public String importProperties(String elementId, String propertiesJson) {
        try {
            Log.d(TAG, "Importing properties for: " + elementId);
            if (activity != null) {
                return activity.importProperties(elementId, propertiesJson);
            } else {
                Log.w(TAG, "Activity is null in importProperties");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in importProperties: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في الاستيراد: " + e.getMessage() + "\"}";
        }
    }

    // ==================== FLEXBOX SYSTEM CALLBACKS ====================
    // Callbacks للتواصل مع نظام Flexbox المتقدم

    /**
     * إشعار اكتمال تحليل Flexbox
     * Flexbox analysis completed notification
     */
    @JavascriptInterface
    public void onFlexboxAnalysisComplete(String containerId, String analysisJson, double score, String recommendations) {
        try {
            Log.d(TAG, "Flexbox analysis complete for: " + containerId + " (score: " + score + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleFlexboxAnalysisComplete(containerId, analysisJson, score, recommendations);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFlexboxAnalysisComplete: " + e.getMessage());
        }
    }

    /**
     * إشعار تطبيق Flexbox على الحاوية
     * Flexbox applied to container notification
     */
    @JavascriptInterface
    public void onFlexboxApplied(String containerId, String propertiesJson, double conversionTime, boolean success) {
        try {
            Log.d(TAG, "Flexbox applied to: " + containerId + " (success: " + success + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleFlexboxApplied(containerId, propertiesJson, conversionTime, success);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFlexboxApplied: " + e.getMessage());
        }
    }

    /**
     * إشعار تبديل معاينة Flexbox
     * Flexbox preview toggle notification
     */
    @JavascriptInterface
    public void onFlexboxPreviewToggled(boolean enabled, String containerId) {
        try {
            Log.d(TAG, "Flexbox preview " + (enabled ? "enabled" : "disabled") + " for: " + containerId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleFlexboxPreviewToggled(enabled, containerId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFlexboxPreviewToggled: " + e.getMessage());
        }
    }

    /**
     * إشعار استرجاع Flexbox
     * Flexbox revert notification
     */
    @JavascriptInterface
    public void onFlexboxReverted(String containerId, boolean success) {
        try {
            Log.d(TAG, "Flexbox reverted for: " + containerId + " (success: " + success + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleFlexboxReverted(containerId, success);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFlexboxReverted: " + e.getMessage());
        }
    }

    /**
     * إشعار تحسين Flexbox
     * Flexbox optimization notification
     */
    @JavascriptInterface
    public void onFlexboxOptimized(String containerId, int optimizationsApplied, String improvementsJson) {
        try {
            Log.d(TAG, "Flexbox optimized for: " + containerId + " (optimizations: " + optimizationsApplied + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleFlexboxOptimized(containerId, optimizationsApplied, improvementsJson);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFlexboxOptimized: " + e.getMessage());
        }
    }

    /**
     * إشعار تصدير إعدادات Flexbox
     * Flexbox configuration exported notification
     */
    @JavascriptInterface
    public void onFlexboxConfigurationExported(String containerId, String configurationJson) {
        try {
            Log.d(TAG, "Flexbox configuration exported for: " + containerId);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleFlexboxConfigurationExported(containerId, configurationJson);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onFlexboxConfigurationExported: " + e.getMessage());
        }
    }

    // ==================== FLEXBOX CONTROL METHODS ====================
    // Methods called from Android to control Flexbox system

    /**
     * طلب تحليل فرص Flexbox من JavaScript
     * Request Flexbox opportunity analysis from JavaScript
     */
    @JavascriptInterface
    public String requestFlexboxAnalysis(String containerId, String optionsJson) {
        try {
            Log.d(TAG, "Requesting flexbox analysis for: " + containerId);
            if (activity != null) {
                return activity.requestFlexboxAnalysis(containerId, optionsJson);
            } else {
                Log.w(TAG, "Activity is null in requestFlexboxAnalysis");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in requestFlexboxAnalysis: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في التحليل: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تطبيق Flexbox على الحاوية من Android
     * Apply Flexbox to container from Android
     */
    @JavascriptInterface
    public String applyFlexbox(String containerId, String propertiesJson) {
        try {
            Log.d(TAG, "Applying flexbox to: " + containerId);
            if (activity != null) {
                return activity.applyFlexbox(containerId, propertiesJson);
            } else {
                Log.w(TAG, "Activity is null in applyFlexbox");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in applyFlexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في التطبيق: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تفعيل/إلغاء تفعيل معاينة Flexbox
     * Enable/disable Flexbox preview
     */
    @JavascriptInterface
    public String toggleFlexboxPreview(String containerId) {
        try {
            Log.d(TAG, "Toggling flexbox preview for: " + containerId);
            if (activity != null) {
                return activity.toggleFlexboxPreview(containerId);
            } else {
                Log.w(TAG, "Activity is null in toggleFlexboxPreview");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in toggleFlexboxPreview: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في المعاينة: " + e.getMessage() + "\"}";
        }
    }

    /**
     * استرجاع Flexbox للحاوية
     * Revert Flexbox for container
     */
    @JavascriptInterface
    public String revertFlexbox(String containerId) {
        try {
            Log.d(TAG, "Reverting flexbox for: " + containerId);
            if (activity != null) {
                return activity.revertFlexbox(containerId);
            } else {
                Log.w(TAG, "Activity is null in revertFlexbox");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in revertFlexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في الاسترجاع: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تحسين تخطيط Flexbox
     * Optimize Flexbox layout
     */
    @JavascriptInterface
    public String optimizeFlexboxLayout(String containerId) {
        try {
            Log.d(TAG, "Optimizing flexbox layout for: " + containerId);
            if (activity != null) {
                return activity.optimizeFlexboxLayout(containerId);
            } else {
                Log.w(TAG, "Activity is null in optimizeFlexboxLayout");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in optimizeFlexboxLayout: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في التحسين: " + e.getMessage() + "\"}";
        }
    }

    /**
     * الحصول على تقرير أداء Flexbox
     * Get Flexbox performance report
     */
    @JavascriptInterface
    public String getFlexboxPerformanceReport() {
        try {
            Log.d(TAG, "Getting flexbox performance report");
            if (activity != null) {
                return activity.getFlexboxPerformanceReport();
            } else {
                Log.w(TAG, "Activity is null in getFlexboxPerformanceReport");
                return "{\"success\": false, \"message\": \"النشاط غير متاح\"}";
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in getFlexboxPerformanceReport: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ في التقرير: " + e.getMessage() + "\"}";
        }
    }

    // ==================== BOTTOM SHEET DRAG CALLBACKS ====================
    // Callbacks للـ Enhanced Bottom Sheet Drag & Drop System

    /**
     * إشعار بدء السحب من Bottom Sheet
     * Bottom sheet drag start notification
     */
    @JavascriptInterface
    public void onBottomSheetDragStart(String elementType, int x, int y) {
        try {
            Log.d(TAG, "Bottom sheet drag started: " + elementType + " at (" + x + "," + y + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleBottomSheetDragStart(elementType, x, y);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onBottomSheetDragStart: " + e.getMessage());
        }
    }

    /**
     * إشعار حركة السحب من Bottom Sheet
     * Bottom sheet drag move notification
     */
    @JavascriptInterface
    public void onBottomSheetDragMove(String elementType, int x, int y) {
        try {
            Log.d(TAG, "Bottom sheet drag move: " + elementType + " at (" + x + "," + y + ")");
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleBottomSheetDragMove(elementType, x, y);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onBottomSheetDragMove: " + e.getMessage());
        }
    }

    /**
     * إشعار انتهاء السحب من Bottom Sheet
     * Bottom sheet drag end notification
     */
    @JavascriptInterface
    public void onBottomSheetDragEnd(String elementType, boolean success, String error, String containerId) {
        try {
            Log.d(TAG, "Bottom sheet drag ended: " + elementType + " - " + (success ? "SUCCESS" : "FAILED"));
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleBottomSheetDragEnd(elementType, success, error, containerId);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onBottomSheetDragEnd: " + e.getMessage());
        }
    }

    /**
     * إشعار تطبيق Auto-positioning من JavaScript
     * Auto-positioning applied from JavaScript notification
     */
    @JavascriptInterface
    public void onAutoPositioningApplied(String elementType, String containerId, String positionJson, String propertiesJson) {
        try {
            Log.d(TAG, "Auto-positioning applied from JS for: " + elementType);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.handleAutoPositioningAppliedFromJS(elementType, containerId, positionJson, propertiesJson);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in onAutoPositioningApplied: " + e.getMessage());
        }
    }

    // ==================== BOTTOM SHEET DRAG CONTROL METHODS ====================
    // Methods called from Android to control Bottom Sheet Drag system

    /**
     * بدء سحب من Bottom Sheet من Android
     * Start drag from bottom sheet from Android
     */
    @JavascriptInterface
    public String startBottomSheetDrag(String elementType, int startX, int startY) {
        try {
            Log.d(TAG, "Starting bottom sheet drag for: " + elementType);
            if (activity != null) {
                BottomSheetDragManager dragManager = activity.getBottomSheetDragManager();
                if (dragManager != null) {
                    dragManager.startEnhancedDrag(
                        new android.graphics.Point(startX, startY),
                        elementType,
                        new android.graphics.Point(startX, startY)
                    );
                    return "{\"success\": true, \"message\": \"تم بدء السحب\"}";
                }
            }
            return "{\"success\": false, \"message\": \"BottomSheetDragManager غير متاح\"}";
        } catch (Exception e) {
            Log.e(TAG, "Error in startBottomSheetDrag: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تحديث موضع السحب من Bottom Sheet
     * Update drag position from bottom sheet
     */
    @JavascriptInterface
    public String updateBottomSheetDrag(String elementType, int x, int y) {
        try {
            Log.d(TAG, "Updating bottom sheet drag for: " + elementType);
            if (activity != null) {
                BottomSheetDragManager dragManager = activity.getBottomSheetDragManager();
                if (dragManager != null) {
                    dragManager.updateDragPosition(new android.graphics.Point(x, y));
                    return "{\"success\": true, \"message\": \"تم تحديث الموضع\"}";
                }
            }
            return "{\"success\": false, \"message\": \"BottomSheetDragManager غير متاح\"}";
        } catch (Exception e) {
            Log.e(TAG, "Error in updateBottomSheetDrag: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * إنهاء سحب من Bottom Sheet
     * End drag from bottom sheet
     */
    @JavascriptInterface
    public String endBottomSheetDrag(String elementType, int x, int y) {
        try {
            Log.d(TAG, "Ending bottom sheet drag for: " + elementType);
            if (activity != null) {
                BottomSheetDragManager dragManager = activity.getBottomSheetDragManager();
                if (dragManager != null) {
                    dragManager.endDrag();
                    return "{\"success\": true, \"message\": \"تم إنهاء السحب\"}";
                }
            }
            return "{\"success\": false, \"message\": \"BottomSheetDragManager غير متاح\"}";
        } catch (Exception e) {
            Log.e(TAG, "Error in endBottomSheetDrag: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * إلغاء سحب من Bottom Sheet
     * Cancel drag from bottom sheet
     */
    @JavascriptInterface
    public String cancelBottomSheetDrag(String reason) {
        try {
            Log.d(TAG, "Cancelling bottom sheet drag: " + reason);
            if (activity != null) {
                BottomSheetDragManager dragManager = activity.getBottomSheetDragManager();
                if (dragManager != null) {
                    dragManager.cancelDrag(reason);
                    return "{\"success\": true, \"message\": \"تم إلغاء السحب\"}";
                }
            }
            return "{\"success\": false, \"message\": \"BottomSheetDragManager غير متاح\"}";
        } catch (Exception e) {
            Log.e(TAG, "Error in cancelBottomSheetDrag: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * مزامنة elementTree مع تغييرات DOM من JavaScript
     * تُستدعى عندما يضيف JavaScript عنصراً جديداً في DOM
     * Sync elementTree with DOM changes from JavaScript
     * Called when JavaScript adds a new element to DOM
     * @param elementDataJson JSON string containing element data
     */
    @JavascriptInterface
    public void syncElementTreeFromDOM(String elementDataJson) {
        try {
            Log.d(TAG, "Syncing elementTree from DOM: " + elementDataJson);
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    activity.syncElementTreeFromDOM(elementDataJson);
                });
            }
        } catch (Exception e) {
            Log.e(TAG, "Error in syncElementTreeFromDOM: " + e.getMessage());
            reportError("ELEMENT_SYNC_ERROR", "خطأ في مزامنة elementTree: " + e.getMessage(), "syncElementTreeFromDOM");
        }
    }

    /**
     * الحصول على حالة Bottom Sheet Drag
     * Get bottom sheet drag state
     */
    @JavascriptInterface
    public String getBottomSheetDragState() {
        try {
            if (activity != null) {
                BottomSheetDragManager dragManager = activity.getBottomSheetDragManager();
                if (dragManager != null) {
                    BottomSheetDragManager.DragState state = dragManager.getCurrentState();
                    BottomSheetDragManager.DragMetrics metrics = dragManager.getCurrentMetrics();
                    
                    String stateJson = String.format(
                        "{\"state\": \"%s\", \"isDragging\": %s, \"performanceMode\": %s, \"metrics\": %s}",
                        state.name(),
                        state != BottomSheetDragManager.DragState.IDLE,
                        dragManager.isPerformanceMode(),
                        metrics != null ? String.format(
                            "{\"startTime\": %d, \"dragDistance\": %d, \"duration\": %d}",
                            metrics.startTime, metrics.dragDistance, metrics.getDuration()
                        ) : "null"
                    );
                    
                    return stateJson;
                }
            }
            return "{\"state\": \"UNKNOWN\", \"isDragging\": false, \"performanceMode\": false, \"metrics\": null}";
        } catch (Exception e) {
            Log.e(TAG, "Error in getBottomSheetDragState: " + e.getMessage());
            return "{\"error\": \"" + e.getMessage() + "\"}";
        }
    }
}
