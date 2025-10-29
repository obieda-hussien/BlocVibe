package com.blocvibe.app;

import android.content.ClipData;
import android.content.Intent;
import android.content.res.AssetManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
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
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EditorActivity extends AppCompatActivity {

    private static final String TAG = "EditorActivity";
    private ActivityEditorBinding binding;
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

        setupWebViewBridge();

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

    private void setupWebViewBridge() {
        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);
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
        String sortableJs = loadStringFromAssets("sortable.min.js");
        if (sortableJs != null) {
            binding.canvasWebview.evaluateJavascript(sortableJs, null);
        }
        String editorCoreJs = loadStringFromAssets("editor-core.js");
        if (editorCoreJs != null) {
            binding.canvasWebview.evaluateJavascript(editorCoreJs, null);
        }
    }

    private String loadStringFromAssets(String fileName) {
        try {
            AssetManager assetManager = getAssets();
            InputStream inputStream = assetManager.open(fileName);
            byte[] buffer = new byte[inputStream.available()];
            inputStream.read(buffer);
            inputStream.close();
            return new String(buffer);
        } catch (IOException e) {
            Log.e(TAG, "Failed to load " + fileName + " from assets", e);
            return null;
        }
    }

    private void setupDragAndDrop() {
         binding.canvasWebview.setOnDragListener((v, event) -> {
            final int action = event.getAction();
            if (event.getClipDescription() == null) return false;
            String clipDataTag = event.getClipDescription().getLabel() != null ? event.getClipDescription().getLabel().toString() : "";

            switch (action) {
                case DragEvent.ACTION_DRAG_STARTED:
                    if ("COMPONENT".equals(clipDataTag)) {
                        Log.d("BlocVibeDrag", "-> Accepting drop.");
                        return true;
                    }
                    return false;

                case DragEvent.ACTION_DRAG_ENTERED:
                case DragEvent.ACTION_DRAG_LOCATION:
                case DragEvent.ACTION_DRAG_EXITED:
                    return true;

                case DragEvent.ACTION_DROP:
                    Log.d("BlocVibeDrag", "ACTION_DROP DETECTED!");
                    String tag = event.getClipData().getItemAt(0).getText().toString();
                    float x = event.getX();
                    float y = event.getY();
                    float density = binding.canvasWebview.getResources().getDisplayMetrics().density;
                    float cssX = x / density;
                    float cssY = y / density;

                    String jsCall = String.format("javascript:window.editor.handleAndroidDrop('%s', %f, %f);", tag, cssX, cssY);
                    binding.canvasWebview.evaluateJavascript(jsCall, null);
                    return true;

                case DragEvent.ACTION_DRAG_ENDED:
                    return true;

                default:
                    return false;
            }
        });
    }

    private void setupPalette() {
        bottomSheetBehavior = BottomSheetBehavior.from(binding.bottomSheetPalette.getRoot());
        bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);

        List<ComponentItem> paletteItems = new ArrayList<>();
        paletteItems.add(new ComponentItem("Heading", R.drawable.ic_code, "h2"));
        paletteItems.add(new ComponentItem("Paragraph", R.drawable.ic_code, "p"));
        paletteItems.add(new ComponentItem("Button", R.drawable.ic_code, "button"));
        paletteItems.add(new ComponentItem("Image", R.drawable.ic_code, "img"));
        paletteItems.add(new ComponentItem("Link", R.drawable.ic_code, "a"));
        paletteItems.add(new ComponentItem("Div", R.drawable.ic_code, "div"));

        PaletteAdapter paletteAdapter = new PaletteAdapter(paletteItems);
        binding.bottomSheetPalette.paletteRecyclerView.setAdapter(paletteAdapter);

        binding.fabTogglePalette.setOnClickListener(v -> {
            if (bottomSheetBehavior.getState() == BottomSheetBehavior.STATE_HIDDEN) {
                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
            } else {
                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_HIDDEN);
            }
        });
    }

    private void setupPropertyEditors() {
        View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
        TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
        TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
        TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
        TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);
        MaterialButton backBtn = propertiesView.findViewById(R.id.back_to_palette_btn);

        editClass.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String js = String.format("javascript:window.editor.updateElementAttribute('%s', 'class', '%s');", currentSelectedElement.elementId, s.toString());
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editWidth.addTextChangedListener(new TextWatcher() {
             @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String js = String.format("javascript:window.editor.updateElementStyle('%s', 'width', '%s');", currentSelectedElement.elementId, s.toString());
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editColor.addTextChangedListener(new TextWatcher() {
             @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String js = String.format("javascript:window.editor.updateElementStyle('%s', 'color', '%s');", currentSelectedElement.elementId, s.toString());
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        backBtn.setOnClickListener(v -> handleElementSelection(null));
    }

    private void setupCodeEditorResultLauncher() {
        codeEditorResultLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                    Intent data = result.getData();
                    if (currentProject != null) {
                        currentProject.cssContent = data.getStringExtra("CSS_RESULT");
                        currentProject.jsContent = data.getStringExtra("JS_RESULT");
                        renderCanvas();
                        saveProjectAsync();
                    }
                }
            }
        );
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
            saveProjectAsync();
            return true;
        } else if (id == R.id.action_run) {
            renderCanvas();
            return true;
        } else if (id == R.id.action_view_code) {
             if (currentProject != null) {
                Intent intent = new Intent(this, CodeEditorActivity.class);
                intent.putExtra("HTML", buildHtmlRecursive(elementTree));
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

        String generatedHtml = buildHtmlRecursive(elementTree);

        String fullHtml = "<html><head><style>" +
                          "body { min-height: 100vh; font-family: sans-serif; }" +
                          ".ghost-element { opacity: 0.7; position: absolute; pointer-events: none; z-index: 1000; }" +
                          ".drop-indicator { position: absolute; height: 2px; background-color: #0D6EFD; z-index: 1001; display: none; }" +
                          (currentProject.cssContent != null ? currentProject.cssContent : "") +
                          "</style></head>" +
                          "<body>" + generatedHtml + "</body>" +
                          "</html>";

        binding.canvasWebview.loadDataWithBaseURL("file:///android_asset/", fullHtml, "text/html", "UTF-8", null);
    }

    private String buildHtmlRecursive(List<BlocElement> elements) {
        if (elements == null) return "";
        StringBuilder html = new StringBuilder();
        for (BlocElement el : elements) {
            html.append(el.toHtml());
        }
        return html.toString();
    }

    public void saveProjectAsync() {
        if (currentProject == null) return;
        currentProject.elementsJson = gson.toJson(elementTree);
        currentProject.lastModified = System.currentTimeMillis();
        executorService.execute(() -> {
            db.projectDao().updateProject(currentProject);
            runOnUiThread(() -> Snackbar.make(binding.getRoot(), "Project Saved", Snackbar.LENGTH_SHORT).show());
        });
    }

    public boolean handleDomUpdate(String elementsJson) {
        try {
            if (elementsJson == null || elementsJson.trim().isEmpty()) {
                Log.e(TAG, "Empty JSON received");
                return false;
            }
            Type type = new TypeToken<ArrayList<BlocElement>>(){}.getType();
            ArrayList<BlocElement> newTree = gson.fromJson(elementsJson, type);
            if (newTree == null) { // GSON can return null for invalid JSON
                Log.e(TAG, "Failed to parse JSON.");
                return false;
            }
            this.elementTree = newTree;
            saveProjectAsync();
            Log.d(TAG, "✓ DOM synced successfully: " + newTree.size() + " elements");
            return true;
        } catch (Exception e) {
            Log.e(TAG, "✗ Sync failed: " + e.getMessage(), e);
            return false;
        }
    }

    public void handleElementSelection(String elementId) {
        String jsCall = "javascript:window.editor.highlightElement(" + (elementId != null ? "'" + elementId + "'" : "null") + ");";
        binding.canvasWebview.evaluateJavascript(jsCall, null);

        if (elementId == null) {
            currentSelectedElement = null;
            if (bottomSheetBehavior.getState() == BottomSheetBehavior.STATE_EXPANDED) {
                 binding.bottomSheetPalette.editorFlipper.setDisplayedChild(0);
            }
            return;
        }

        currentSelectedElement = findElementById(elementTree, elementId);

        if (currentSelectedElement != null) {
            binding.bottomSheetPalette.editorFlipper.setDisplayedChild(1);
            if (bottomSheetBehavior.getState() != BottomSheetBehavior.STATE_EXPANDED) {
                bottomSheetBehavior.setState(BottomSheetBehavior.STATE_EXPANDED);
            }

            View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
            ((TextView) propertiesView.findViewById(R.id.selected_element_label)).setText("Editing: <" + currentSelectedElement.tag + ">");
            ((TextInputEditText) propertiesView.findViewById(R.id.edit_id)).setText(currentSelectedElement.elementId);
            ((TextInputEditText) propertiesView.findViewById(R.id.edit_class)).setText(currentSelectedElement.attributes.get("class"));
            ((TextInputEditText) propertiesView.findViewById(R.id.edit_width)).setText(currentSelectedElement.styles.get("width"));
            ((TextInputEditText) propertiesView.findViewById(R.id.edit_color)).setText(currentSelectedElement.styles.get("color"));
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
        return null;
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }

    public ActivityEditorBinding getBinding() {
        return binding;
    }

    public void handleElementTextChange(String elementId, String newText) {
        // TODO: Implement logic to update text of an element
    }

    public void onWebViewPageReady() {
        // TODO: Implement logic to run when the web page is ready
    }
}
