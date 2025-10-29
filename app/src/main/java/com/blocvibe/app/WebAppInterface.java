package com.blocvibe.app;

import android.content.Context;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import android.util.Log;

/**
 * WebAppInterface - JavaScript Bridge for WebView communication
 * This class provides methods that can be called from JavaScript in the WebView
 * to communicate back to the Java/Android application.
 */
public class WebAppInterface {
    private static final String TAG = "WebAppInterface";
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
     * Called from JavaScript when the DOM is updated (for sync)
     * @param elementsJson JSON string representing the updated element tree
     */
    @JavascriptInterface
    public void onDomUpdated(String elementsJson) {
        if (activity != null) {
            activity.runOnUiThread(() -> {
                boolean success = activity.handleDomUpdate(elementsJson);
                Log.d(TAG, "DOM sync " + (success ? "succeeded" : "failed"));
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
            Log.d(TAG, "JS: " + message);
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
}
