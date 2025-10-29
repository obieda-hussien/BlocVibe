package com.blocvibe.app;

import android.content.ClipData;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.Log;
import android.view.DragEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.TextView;
import android.widget.Toast;

import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;

import com.blocvibe.app.databinding.ActivityEditorBinding;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.snackbar.Snackbar;
import com.google.android.material.textfield.TextInputEditText;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EditorActivity extends AppCompatActivity {

    private static final String TAG = "EditorActivity";

    private ActivityEditorBinding binding;
    private BottomSheetBehavior<com.google.android.material.card.MaterialCardView> bottomSheetBehavior;
    private Project currentProject;
    private AppDatabase db;
    private long currentProjectId;

    // Phase 3: New structured data model fields
    private List<BlocElement> elementTree;  // Main data model
    private BlocElement currentSelectedElement;
    private Gson gson = new Gson();

    private ExecutorService executorService;
    private ActivityResultLauncher<Intent> codeEditorResultLauncher;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditorBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Initialize database and executor
        db = AppDatabase.getInstance(this);
        executorService = Executors.newSingleThreadExecutor();

        // Get project ID from intent
        currentProjectId = getIntent().getLongExtra("PROJECT_ID", -1);
        if (currentProjectId == -1) {
            Toast.makeText(this, "Error: Invalid project", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // Set up toolbar
        setSupportActionBar(binding.editorToolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        // Initialize WebView + JS Bridge + inject assets after load
        setupWebViewBridge();

        // Load project data
        db.projectDao().getProjectById(currentProjectId).observe(this, project -> {
            if (project != null) {
                this.currentProject = project;

                // Deserialize element tree from JSON
                if (project.elementsJson != null && !project.elementsJson.isEmpty()) {
                    Type listType = new TypeToken<List<BlocElement>>(){}.getType();
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

        // Forward drag-and-drop to JS instead of creating elements in Android
        binding.canvasWebview.setOnDragListener(new View.OnDragListener() {
            @Override
            public boolean onDrag(View v, DragEvent event) {
                switch (event.getAction()) {
                    case DragEvent.ACTION_DRAG_STARTED:
                        return true;
                    case DragEvent.ACTION_DROP:
                        ClipData clipData = event.getClipData();
                        if (clipData != null && clipData.getItemCount() > 0) {
                            String droppedHtml = clipData.getItemAt(0).getText().toString();
                            String tag = extractTagFromHtml(droppedHtml);
                            if (tag != null) {
                                float x = event.getX();
                                float y = event.getY();
                                float density = binding.canvasWebview.getResources().getDisplayMetrics().density;
                                float cssX = x / density;
                                float cssY = y / density;

                                String js = String.format("javascript:window.handleAndroidDrop('%s', %f, %f);", tag, cssX, cssY);
                                binding.canvasWebview.evaluateJavascript(js, null);
                            }
                        }
                        return true;
                    default:
                        return true;
                }
            }
        });

        // Initialize Bottom Sheet - start hidden
        bottomSheetBehavior = BottomSheetBehavior.from(binding.bottomSheetPalette.getRoot());
        bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);

        // Set up palette RecyclerView with ComponentItems
        List<ComponentItem> paletteItems = new ArrayList<>();
        paletteItems.add(new ComponentItem("Heading", R.drawable.ic_code, "<h2>Heading</h2>"));
        paletteItems.add(new ComponentItem("Paragraph", R.drawable.ic_code, "<p>This is a paragraph.</p>"));
        paletteItems.add(new ComponentItem("Button", R.drawable.ic_code, "<button>Click Me</button>"));
        paletteItems.add(new ComponentItem("Image", R.drawable.ic_code, "<img src='https://via.placeholder.com/150' alt='placeholder' />"));
        paletteItems.add(new ComponentItem("Link", R.drawable.ic_code, "<a href='#'>Link</a>"));
        paletteItems.add(new ComponentItem("Div", R.drawable.ic_code, "<div style='padding: 10px; border: 1px solid #ccc;'>Container</div>"));

        PaletteAdapter paletteAdapter = new PaletteAdapter(paletteItems);
        binding.bottomSheetPalette.paletteRecyclerView.setAdapter(paletteAdapter);

        // Set up FAB to toggle palette
        binding.fabTogglePalette.setOnClickListener(v -> {
            if (bottomSheetBehavior.getState() == BottomSheetBehavior.STATE_HIDDEN) {
                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
                Toast.makeText(this, "Long press any component and drag to canvas",
                    Toast.LENGTH_SHORT).show();
            } else {
                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
            }
        });

        // Set up property editors for the second view in ViewFlipper
        View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
        TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
        TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
        TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
        TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);
        MaterialButton backBtn = propertiesView.findViewById(R.id.back_to_palette_btn);

        // Add TextWatchers for live property editing
        editId.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String newId = s.toString();
                    currentSelectedElement.attributes.put("id", newId);
                    String js = "var el = document.getElementById('" + currentSelectedElement.elementId + "');" +
                                "if(el) { el.setAttribute('id', '" + newId + "'); }";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editClass.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String className = s.toString();
                    currentSelectedElement.attributes.put("class", className);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').className = '" + className + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editWidth.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String width = s.toString();
                    currentSelectedElement.styles.put("width", width);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.width = '" + width + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editColor.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String color = s.toString();
                    currentSelectedElement.styles.put("color", color);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.color = '" + color + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        backBtn.setOnClickListener(v -> {
            currentSelectedElement = null;
            binding.bottomSheetPalette.editorFlipper.setDisplayedChild(0); // Show palette
            renderCanvas(); // Re-render to remove highlight
        });

        // Register for activity result from CodeEditorActivity
        codeEditorResultLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            new ActivityResultCallback<ActivityResult>() {
                @Override
                public void onActivityResult(ActivityResult result) {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Intent data = result.getData();
                        if (currentProject != null) {
                            currentProject.cssContent = data.getStringExtra("CSS_RESULT");
                            currentProject.jsContent = data.getStringExtra("JS_RESULT");

                            String htmlResult = data.getStringExtra("HTML_RESULT");
                            if (htmlResult != null && !htmlResult.isEmpty()) {
                                // Optional: parse back to elementTree if needed
                            }

                            renderCanvas();
                            saveProject();
                        }
                    }
                }
            }
        );
    }

    private void setupWebViewBridge() {
        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);
        binding.canvasWebview.getSettings().setDomStorageEnabled(true);
        binding.canvasWebview.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");
        binding.canvasWebview.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                injectEditorScripts();
            }
        });
    }

    private void injectEditorScripts() {
        // Load and execute Sortable + EditorCore from assets
        String sortableJs = loadStringFromAssets("sortable.min.js");
        if (sortableJs != null) {
            binding.canvasWebview.evaluateJavascript(sortableJs, null);
        } else {
            Log.w(TAG, "sortable.min.js not found in assets");
        }

        String editorCoreJs = loadStringFromAssets("editor-core.js");
        if (editorCoreJs != null) {
            binding.canvasWebview.evaluateJavascript(editorCoreJs, null);
        } else {
            Log.w(TAG, "editor-core.js not found in assets");
        }
    }

    private String loadStringFromAssets(String fileName) {
        try {
            AssetManager assetManager = getAssets();
            InputStream inputStream = assetManager.open(fileName);
            byte[] buffer = new byte[inputStream.available()];
            int read = inputStream.read(buffer);
            inputStream.close();
            return read > 0 ? new String(buffer) : "";
        } catch (IOException e) {
            Log.e(TAG, "Failed to load " + fileName + " from assets", e);
            return null;
        }
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_editor, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();

        if (id == android.R.id.home) {
            finish();
            return true;
        } else if (id == R.id.action_save) {
            saveProject();
            return true;
        } else if (id == R.id.action_run) {
            renderCanvas();
            Snackbar.make(binding.getRoot(), "Preview refreshed", Snackbar.LENGTH_SHORT).show();
            return true;
        } else if (id == R.id.action_view_code) {
            if (currentProject != null) {
                Intent intent = new Intent(this, CodeEditorActivity.class);
                String generatedHtml = generateHtmlFromElements();
                intent.putExtra("HTML", generatedHtml);
                intent.putExtra("CSS", currentProject.cssContent);
                intent.putExtra("JS", currentProject.jsContent);
                codeEditorResultLauncher.launch(intent);
            }
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    private void renderCanvas() {
        if (elementTree == null) elementTree = new ArrayList<>();
        if (currentProject == null) return;

        // Build HTML from the elementTree
        String generatedHtml = buildHtmlRecursive(elementTree);

        // Wrap with canvas-root so EditorCore targets it
        String fullHtml =
            "<html><head>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'/>" +
            "<style>" +
            (currentProject.cssContent != null ? currentProject.cssContent : "") +
            "body{min-height:100vh;font-family:sans-serif;}" +
            "</style></head>" +
            "<body>" +
            "<div id='canvas-root'>" + generatedHtml + "</div>" +
            "</body></html>";

        // Use assets base URL so relative asset loads (if added later) work
        binding.canvasWebview.loadDataWithBaseURL("file:///android_asset/", fullHtml, "text/html", "UTF-8", null);
    }

    private String buildHtmlRecursive(List<BlocElement> elements) {
        StringBuilder html = new StringBuilder();
        for (BlocElement el : elements) {
            // Start tag
            html.append("<").append(el.tag);

            // Add attributes (id, class, etc.)
            for (Map.Entry<String, String> attr : el.attributes.entrySet()) {
                html.append(" ").append(attr.getKey()).append("=\"").append(attr.getValue()).append("\"");
            }

            // Add inline styles
            StringBuilder styleString = new StringBuilder();
            for (Map.Entry<String, String> style : el.styles.entrySet()) {
                styleString.append(style.getKey()).append(":").append(style.getValue()).append(";");
            }
            if (styleString.length() > 0) {
                html.append(" style=\"").append(styleString.toString()).append("\"");
            }

            html.append(">");

            // Text content
            if (el.textContent != null && !el.textContent.isEmpty()) {
                html.append(el.textContent);
            }

            // Children
            if (!el.children.isEmpty()) {
                html.append(buildHtmlRecursive(el.children));
            }

            // End tag
            html.append("</").append(el.tag).append(">");
        }
        return html.toString();
    }

    private void saveProject() {
        if (currentProject == null) return;

        currentProject.elementsJson = gson.toJson(elementTree);
        currentProject.lastModified = System.currentTimeMillis();

        executorService.execute(() -> {
            db.projectDao().updateProject(currentProject);
            runOnUiThread(() -> {
                Snackbar.make(binding.getRoot(), "Project Saved", Snackbar.LENGTH_SHORT).show();
            });
        });
    }

    /**
     * Helper method to extract tag from HTML string
     */
    private String extractTagFromHtml(String html) {
        if (html == null) return null;
        html = html.trim();
        if (html.startsWith("<")) {
            int endIndex = html.indexOf('>');
            if (endIndex > 0) {
                String tagPart = html.substring(1, endIndex);
                int spaceIndex = tagPart.indexOf(' ');
                if (spaceIndex > 0) {
                    return tagPart.substring(0, spaceIndex);
                }
                return tagPart.replace("/", "").trim();
            }
        }
        return null;
    }

    /**
     * JS bridge callback to handle DOM sync from editor-core.js
     * Should be called by WebAppInterface.onDomUpdated(json)
     */
    public boolean handleDomUpdate(String elementsJson) {
        try {
            if (elementsJson == null || elementsJson.trim().isEmpty()) {
                Log.e(TAG, "Empty JSON received");
                binding.canvasWebview.evaluateJavascript("window.EditorCore.onSyncFailure()", null);
                return false;
            }
            Type type = new TypeToken<ArrayList<BlocElement>>(){}.getType();
            ArrayList<BlocElement> newTree = gson.fromJson(elementsJson, type);
            if (newTree == null) {
                Log.e(TAG, "Failed to parse JSON.");
                binding.canvasWebview.evaluateJavascript("window.EditorCore.onSyncFailure()", null);
                return false;
            }
            this.elementTree = newTree;
            saveProject();
            binding.canvasWebview.evaluateJavascript("window.EditorCore.onSyncSuccess()", null);
            return true;
        } catch (Exception e) {
            Log.e(TAG, "Sync failed: " + e.getMessage(), e);
            binding.canvasWebview.evaluateJavascript("window.EditorCore.onSyncFailure()", null);
            return false;
        }
    }

    /**
     * JavaScript bridge callback methods
     */
    public void handleElementSelection(String elementId) {
        if (elementId == null) {
            currentSelectedElement = null;
            binding.bottomSheetPalette.editorFlipper.setDisplayedChild(0); // Show palette
            return;
        }

        currentSelectedElement = findElementById(elementTree, elementId);

        if (currentSelectedElement != null) {
            binding.bottomSheetPalette.editorFlipper.setDisplayedChild(1);

            View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
            TextView label = propertiesView.findViewById(R.id.selected_element_label);
            TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
            TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
            TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
            TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);

            label.setText("Editing: <" + currentSelectedElement.tag + ">");
            editId.setText(currentSelectedElement.attributes.get("id"));
            editClass.setText(currentSelectedElement.attributes.get("class"));
            editWidth.setText(currentSelectedElement.styles.get("width"));
            editColor.setText(currentSelectedElement.styles.get("color"));

            renderCanvas(); // Re-render to show highlight if needed
        }
    }

    private BlocElement findElementById(List<BlocElement> elements, String id) {
        if (elements == null) return null;
        for (BlocElement el : elements) {
            if (el.elementId.equals(id)) {
                return el;
            }
            BlocElement found = findElementById(el.children, id);
            if (found != null) {
                return found;
            }
        }
        return null; // Not found
    }

    public void handleElementTextChange(String elementId, String newText) {
        for (BlocElement element : elementTree) {
            BlocElement found = element.findById(elementId);
            if (found != null) {
                found.textContent = newText;
                saveProject();
                break;
            }
        }
    }

    public void onWebViewPageReady() {
        Toast.makeText(this, "Page loaded", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
