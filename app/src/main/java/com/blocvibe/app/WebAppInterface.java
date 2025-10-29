package com.blocvibe.app;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.webkit.JavascriptInterface;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * The WebAppInterface class is the bridge between the WebView's JavaScript and the Android Java code.
 * It exposes methods that can be called from JavaScript.
 */
public class WebAppInterface {
    private static final String TAG = "WebAppInterface";
    private final EditorActivity activity;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    // This flag prevents concurrent sync operations from overwriting each other.
    private final AtomicBoolean isSyncInProgress = new AtomicBoolean(false);

    WebAppInterface(EditorActivity activity) {
        this.activity = activity;
    }

    /**
     * Called from JavaScript when a user clicks on an element in the editor.
     * This triggers the properties panel to show up in the Android UI.
     * @param elementId The ID of the selected element.
     */
    @JavascriptInterface
    public void onElementSelected(String elementId) {
        // We must post UI updates to the main thread.
        mainHandler.post(() -> activity.handleElementSelection(elementId));
    }

    /**
     * This is the core synchronization method. It's called from JavaScript
     * when the DOM changes. It receives the entire element tree as a JSON string.
     *
     * IMPORTANT: This method is synchronous from JavaScript's perspective.
     * It returns true on success and false on failure, which allows the JS
     * side to use Promises (`await`) to wait for the result.
     *
     * @param elementsJson The JSON string representing the element tree.
     * @return true if the update was successfully processed and saved, false otherwise.
     */
    @JavascriptInterface
    public boolean onDomUpdated(String elementsJson) {
        Log.d(TAG, "📩 DOM update received from WebView.");

        // Prevent race conditions. If a sync is already running, reject this one.
        if (!isSyncInProgress.compareAndSet(false, true)) {
            Log.w(TAG, "Sync already in progress. Ignoring concurrent request.");
            return false; // NACK: Tell JS we are busy.
        }

        try {
            // The handleDomUpdate method in EditorActivity will parse, save, and
            // contains its own logic. It will return true or false based on its success.
            boolean success = activity.handleDomUpdate(elementsJson);

            if (success) {
                Log.d(TAG, "✅ Sync successful. Sending ACK (true).");
            } else {
                Log.e(TAG, "❌ Sync failed on Android side. Sending NACK (false).");
            }
            return success; // ACK or NACK
        } catch (Exception e) {
            Log.e(TAG, "An unexpected error occurred during DOM update", e);
            return false; // NACK on unexpected error
        } finally {
            // Always release the lock, whether it succeeded or failed.
            isSyncInProgress.set(false);
        }
    }

    /**
     * A simple health-check method to ensure the bridge is working.
     * @return The string "pong".
     */
    @JavascriptInterface
    public String ping() {
        Log.d(TAG, "Ping received from JS");
        return "pong";
    }
}
