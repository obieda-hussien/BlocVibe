package com.blocvibe.app;

import android.content.Context;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

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
}
