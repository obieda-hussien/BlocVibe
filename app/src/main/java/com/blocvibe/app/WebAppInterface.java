package com.blocvibe.app;

import android.webkit.JavascriptInterface;

public class WebAppInterface {
    EditorActivity activity;

    WebAppInterface(EditorActivity activity) {
        this.activity = activity;
    }

    // This is called by JS when an element is clicked
    @JavascriptInterface
    public void onElementSelected(String elementId) {
        activity.runOnUiThread(() -> activity.handleElementSelection(elementId));
    }

    // NEW: Called by JS after *any* drag/drop operation (add, move, reorder)
    @JavascriptInterface
    public void onDomUpdated(String elementsJson) {
        activity.runOnUiThread(() -> activity.handleDomUpdate(elementsJson));
    }
}
