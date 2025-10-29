package com.blocvibe.app;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

public class WebAppInterface {
    private static final String TAG = "WebAppInterface";
    private final EditorActivity activity;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    public WebAppInterface(EditorActivity activity) {
        this.activity = activity;
    }

    @JavascriptInterface
    public void onElementSelected(String elementId) {
        if (activity == null) return;
        mainHandler.post(() -> activity.handleElementSelection(elementId));
    }

    @JavascriptInterface
    public void onElementTextChanged(String elementId, String newText) {
        if (activity == null) return;
        mainHandler.post(() -> activity.handleElementTextChange(elementId, newText));
    }

    @JavascriptInterface
    public void log(String message) {
        if (activity == null) return;
        Log.d(TAG, "JS Log: " + message);
        mainHandler.post(() ->
            Toast.makeText(activity, "JS: " + message, Toast.LENGTH_SHORT).show()
        );
    }

    @JavascriptInterface
    public String ping() {
        return "pong";
    }

    /**
     * CRITICAL: Called from JavaScript when DOM structure changes
     * @param elementsJson Serialized DOM tree as JSON
     */
    @JavascriptInterface
    public void onDomUpdated(String elementsJson) {
        if (activity == null) {
            Log.e(TAG, "onDomUpdated called but activity is null");
            return;
        }

        Log.d(TAG, "📩 Received DOM update, length: " +
            (elementsJson != null ? elementsJson.length() : 0));

        mainHandler.post(() -> {
            boolean success = activity.handleDomUpdate(elementsJson);

            // Send ACK/NACK to JavaScript
            String ackJs = success ?
                "window.EditorCore && window.EditorCore.onSyncSuccess();" :
                "window.EditorCore && window.EditorCore.onSyncFailure();";

            activity.getBinding().canvasWebview.evaluateJavascript(ackJs, value -> {
                Log.d(TAG, success ? "✅ ACK sent" : "❌ NACK sent");
            });
        });
    }

    @JavascriptInterface
    public void onPageReady() {
        if (activity == null) return;
        mainHandler.post(() -> {
            Log.d(TAG, "WebView page ready");
            activity.onWebViewPageReady();
        });
    }
}
