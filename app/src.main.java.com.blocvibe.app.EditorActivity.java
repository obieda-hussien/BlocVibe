package com.blocvibe.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.DragEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.blocvibe.app.databinding.ActivityEditorBinding;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.google.gson.reflect.TypeToken;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EditorActivity extends AppCompatActivity {

    private static final String TAG = "EditorActivity";
    private ActivityEditorBinding binding;
    public ActivityEditorBinding getBinding() { return binding; }

    private BottomSheetBehavior<com.google.android.material.card.MaterialCardView> bottomSheetBehavior;
    private Project currentProject;
    private AppDatabase db;
    private long currentProjectId;
    public List<BlocElement> elementTree;
    private BlocElement currentSelectedElement;
    public Gson gson = new Gson();
    private ExecutorService executorService;
    private ActivityResultLauncher<Intent> codeEditorResultLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditorBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        db = AppDatabase.getInstance(this);
        executorService = Executors.newSingleThreadExecutor();

        currentProjectId = getIntent().getLongExtra("PROJECT_ID", -1);
        if (currentProjectId == -1) {
            Toast.makeText(this, "Error: Invalid project", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        setSupportActionBar(binding.editorToolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        // WebView configuration
        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);
        binding.canvasWebview.getSettings().setDomStorageEnabled(true);

        // CRITICAL: Bridge name must match JavaScript usage
        binding.canvasWebview.addJavascriptInterface(
            new WebAppInterface(this),
            "AndroidBridge"  // ⚠️ Name must match window.AndroidBridge in JS
        );

        // Set WebViewClient to inject scripts after page load
        binding.canvasWebview.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                Log.d(TAG, "📄 Page loaded: " + url);
                injectEditorScripts();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
        });

        db.projectDao().getProjectById(currentProjectId).observe(this, project -> {
            if (project != null) {
                this.currentProject = project;
                if (project.elementsJson != null && !project.elementsJson.isEmpty()) {
                    Type listType = new TypeToken<ArrayList<BlocElement>>(){}.getType();
                    elementTree = gson.fromJson(project.elementsJson, listType);
                } else {
                    elementTree = new ArrayList<>();
                }
                if (getSupportActionBar() != null) {
                    getSupportActionBar().setTitle(project.name);
                }
                renderCanvas();
            }
        });

        setupDragAndDrop();
        setupPalette();
        setupPropertyEditors();
        setupCodeEditorResultLauncher();
    }

    /**
     * CRITICAL: Called by WebAppInterface when JavaScript sends DOM updates
     */
    public boolean handleDomUpdate(String elementsJson) {
        try {
            // 1. Validate input
            if (elementsJson == null || elementsJson.trim().isEmpty()) {
                Log.e(TAG, "❌ Empty JSON received from WebView");
                return false;
            }

            Log.d(TAG, "🔄 Processing DOM update: " + elementsJson.substring(0,
                Math.min(100, elementsJson.length())) + "...");

            // 2. Parse JSON to data model
            Type type = new TypeToken<List<BlocElement>>(){}.getType();
            List<BlocElement> newTree = null;

            // Handle both single object and array formats
            if (elementsJson.trim().startsWith("{")) {
                // Single root object - wrap in list
                BlocElement root = gson.fromJson(elementsJson, BlocElement.class);
                if (root != null) {
                    newTree = new ArrayList<>();
                    newTree.add(root);
                }
            } else if (elementsJson.trim().startsWith("[")) {
                // Array of elements
                newTree = gson.fromJson(elementsJson, type);
            }

            // 3. Validate parsed data
            if (newTree == null) {
                Log.e(TAG, "❌ Failed to parse JSON to BlocElement tree");
                return false;
            }

            // 4. Update in-memory model
            this.elementTree = newTree;
            Log.d(TAG, "✅ Updated elementTree: " + newTree.size() + " root elements");

            // 5. Persist to database asynchronously
            saveProjectAsync();

            // 6. Update code editor if visible
            updateCodeEditorIfVisible();

            return true;

        } catch (JsonSyntaxException e) {
            Log.e(TAG, "❌ JSON parsing error: " + e.getMessage(), e);
            return false;
        } catch (Exception e) {
            Log.e(TAG, "❌ handleDomUpdate failed: " + e.getMessage(), e);
            return false;
        }
    }

    /**
     * Inject JavaScript libraries and sync engine into WebView
     */
    private void injectEditorScripts() {
        Log.d(TAG, "🚀 Injecting editor scripts...");

        // 1. Inject Sortable.js
        String sortableJs = loadAssetAsString("sortable.min.js");
        if (sortableJs != null) {
            binding.canvasWebview.evaluateJavascript(sortableJs, value ->
                Log.d(TAG, "✅ Sortable.js injected")
            );
        } else {
            Log.e(TAG, "❌ Failed to load sortable.min.js");
        }

        // 2. Inject editor-core.js (sync engine)
        String editorCoreJs = loadAssetAsString("editor-core.js");
        if (editorCoreJs != null) {
            binding.canvasWebview.evaluateJavascript(editorCoreJs, value ->
                Log.d(TAG, "✅ editor-core.js injected")
            );
        } else {
            Log.e(TAG, "❌ Failed to load editor-core.js");
        }
    }

    /**
     * Load asset file as string
     */
    private String loadAssetAsString(String filename) {
        try {
            InputStream is = getAssets().open(filename);
            BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line).append('\n');
            }
            reader.close();
            return sb.toString();
        } catch (IOException e) {
            Log.e(TAG, "Error loading asset: " + filename, e);
            return null;
        }
    }

    /**
     * Save project to database asynchronously
     */
    private void saveProjectAsync() {
        if (currentProject == null) {
            Log.w(TAG, "⚠️ Cannot save: currentProject is null");
            return;
        }

        executorService.execute(() -> {
            try {
                // Serialize elementTree to JSON
                String json = gson.toJson(elementTree);
                currentProject.elementsJson = json;
                currentProject.lastModified = System.currentTimeMillis();

                // Update database
                db.projectDao().updateProject(currentProject);

                runOnUiThread(() -> {
                    Log.d(TAG, "💾 Project saved to database");
                    Snackbar.make(binding.getRoot(), "✓ Saved", Snackbar.LENGTH_SHORT).show();
                });
            } catch (Exception e) {
                Log.e(TAG, "❌ Save failed: " + e.getMessage(), e);
                runOnUiThread(() ->
                    Snackbar.make(binding.getRoot(), "✗ Save failed", Snackbar.LENGTH_SHORT).show()
                );
            }
        });
    }

    /**
     * Update code editor with latest element tree
     */
    private void updateCodeEditorIfVisible() {
        // TODO: If code editor view is visible, regenerate HTML/CSS
        // and update the editor content
    }

    private void renderCanvas() {
        if (elementTree == null) elementTree = new ArrayList<>();
        if (currentProject == null) return;

        // Build HTML with canvas-root container
        String html = "<!DOCTYPE html>" +
            "<html>" +
            "<head>" +
            "  <meta charset='UTF-8'>" +
            "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "  <style>" +
            "    * { box-sizing: border-box; }" +
            "    body { font-family: sans-serif; margin: 0; padding: 8px; }" +
            "    #canvas-root { " +
            "      min-height: 400px; " +
            "      border: 2px dashed #999; " +
            "      padding: 16px; " +
            "      background: #fafafa;" +
            "    }" +
            "    .sortable-ghost { opacity: 0.4; }" +
            "    .sortable-chosen { border: 2px solid #2196F3; }" +
            (currentProject.cssContent != null ? currentProject.cssContent : "") +
            "  </style>" +
            "</head>" +
            "<body>" +
            "  <div id='canvas-root'>" +
                buildHtmlRecursive(elementTree) +
            "  </div>" +
            "</body>" +
            "</html>";

        binding.canvasWebview.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
    }

    // Stubs for methods called by WebAppInterface that need to be present
    public void handleElementTextChange(String elementId, String newText) {
        // TODO: Implement logic to update text of an element
    }

    public void onWebViewPageReady() {
        // TODO: Implement any logic needed after the JS engine is ready
    }

    // --- Other existing methods ---

    private void setupDragAndDrop() {
        binding.canvasWebview.setOnDragListener((v, event) -> {
            if (event.getAction() == DragEvent.ACTION_DROP) {
                String tag = event.getClipData().getItemAt(0).getText().toString();
                float x = event.getX();
                float y = event.getY();
                float density = getResources().getDisplayMetrics().density;
                String js = String.format("window.handleAndroidDrop('%s', %f, %f);", tag, x / density, y / density);
                binding.canvasWebview.evaluateJavascript(js, null);
            }
            return true;
        });
    }

    private String buildHtmlRecursive(List<BlocElement> elements) {
        if (elements == null) return "";
        StringBuilder html = new StringBuilder();
        for (BlocElement el : elements) {
            html.append(el.toHtml());
        }
        return html.toString();
    }

    public void handleElementSelection(String elementId) {
        // This logic can be expanded or modified as needed
    }

    private void setupPalette() {
        // Existing implementation
    }

    private void setupPropertyEditors() {
        // Existing implementation
    }

    private void setupCodeEditorResultLauncher() {
        // Existing implementation
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_editor, menu);
        menu.add(0, 9999, 0, "🔍 Debug Sync").setOnMenuItemClickListener(item -> {
            binding.canvasWebview.evaluateJavascript(
                "window.EditorCore ? 'EditorCore: ✅' : 'EditorCore: ❌'",
                value -> {
                    Toast.makeText(this, value, Toast.LENGTH_LONG).show();
                    Log.d(TAG, "Debug check: " + value);
                }
            );
            return true;
        });
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();
        if (id == android.R.id.home) {
            finish();
            return true;
        } else if (id == R.id.action_save) {
            saveProjectAsync();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
