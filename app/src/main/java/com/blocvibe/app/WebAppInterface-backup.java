package com.blocvibe.app;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

/**
 * WebAppInterface - JavaScript Bridge for WebView communication
 * This class provides methods that can be called from JavaScript in the WebView
 * to communicate back to the Java/Android application.
 */
public class WebAppInterface {
    private EditorActivity activity;

    public WebAppInterface(EditorActivity activity) {
        this.activity = activity;
    }

    /**
     * Called from JavaScript when an element is clicked/selected in the WebView
     * @param elementId The unique ID of the selected element
     */
    @JavascriptInterface
    public void onElementSelected(String elementId) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementSelection(elementId);
            });
        }
    }

    /**
     * Called from JavaScript when an element's text content is changed
     * @param elementId The unique ID of the element
     * @param newText The new text content
     */
    @JavascriptInterface
    public void onElementTextChanged(String elementId, String newText) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementTextChange(elementId, newText);
            });
        }
    }

    /**
     * Called from JavaScript to log messages to Android console
     * @param message The message to log
     */
    @JavascriptInterface
    public void log(String message) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                Toast.makeText(activity, "JS: " + message, Toast.LENGTH_SHORT).show();
            });
        }
    }

    /**
     * Called from JavaScript when the page is fully loaded
     */
    @JavascriptInterface
    public void onPageReady() {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.onWebViewPageReady();
            });
        }
    }

    /**
     * Called from JavaScript when an element is moved (drag & drop)
     * @param elementId The ID of the moved element
     * @param newParentId The ID of the new parent (or "root")
     * @param index The new position index
     */
    @JavascriptInterface
    public void onElementMoved(String elementId, String newParentId, int index) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementMove(elementId, newParentId, index);
            });
        }
    }

    /**
     * Called from JavaScript when an element should be moved up
     * @param elementId The ID of the element to move
     */
    @JavascriptInterface
    public void onElementMoveUp(String elementId) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementMoveUp(elementId);
            });
        }
    }

    /**
     * Called from JavaScript when an element should be moved down
     * @param elementId The ID of the element to move
     */
    @JavascriptInterface
    public void onElementMoveDown(String elementId) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementMoveDown(elementId);
            });
        }
    }

    /**
     * Called from JavaScript when an element should be deleted
     * @param elementId The ID of the element to delete
     */
    @JavascriptInterface
    public void onElementDelete(String elementId) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementDelete(elementId);
            });
        }
    }

    /**
     * Called from JavaScript when an element should be duplicated
     * @param elementId The ID of the element to duplicate
     */
    @JavascriptInterface
    public void onElementDuplicate(String elementId) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementDuplicate(elementId);
            });
        }
    }

    /**
     * Called from JavaScript when multiple elements should be wrapped in a div
     * @param elementIdsJson JSON array of element IDs to wrap
     */
    @JavascriptInterface
    public void onElementsWrapInDiv(String elementIdsJson) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                activity.handleElementsWrapInDiv(elementIdsJson);
            });
        }
    }
}