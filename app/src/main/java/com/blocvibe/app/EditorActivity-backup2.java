package com.blocvibe.app;

import android.content.ClipData;
import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.DragEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebView;
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
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EditorActivity extends AppCompatActivity {

    private ActivityEditorBinding binding;
    private BottomSheetBehavior<com.google.android.material.card.MaterialCardView> bottomSheetBehavior;
    private Project currentProject;
    private AppDatabase db;
    private long currentProjectId;
    
    // Phase 3: New structured data model fields
    private List<BlocElement> elementTree;  // Main data model
    private BlocElement currentSelectedElement;
    private Gson gson = new Gson();
    private ElementManager elementManager;  // Advanced element management
    
    // Debouncing system for canvas rendering
    private android.os.Handler renderHandler = new android.os.Handler(android.os.Looper.getMainLooper());
    private Runnable pendingRenderTask = null;
    private static final long RENDER_DEBOUNCE_DELAY_MS = 500; // 500ms delay
    
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

        // Initialize WebView with JavaScript Bridge
        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);
        binding.canvasWebview.getSettings().setDomStorageEnabled(true);
        binding.canvasWebview.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

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
                
                // Initialize ElementManager
                elementManager = new ElementManager(elementTree);
                
                if (getSupportActionBar() != null) {
                    getSupportActionBar().setTitle(project.name);
                }
                renderCanvas();
            }
        });

        // Set up drag listener on WebView
        binding.canvasWebview.setOnDragListener(new View.OnDragListener() {
            @Override
            public boolean onDrag(View v, DragEvent event) {
                switch (event.getAction()) {
                    case DragEvent.ACTION_DRAG_STARTED:
                        return true;
                    case DragEvent.ACTION_DRAG_ENTERED:
                        return true;
                    case DragEvent.ACTION_DROP:
                        ClipData clipData = event.getClipData();
                        if (clipData != null && clipData.getItemCount() > 0) {
                            String droppedHtml = clipData.getItemAt(0).getText().toString();
                            
                            // Extract tag from dropped component HTML
                            String tag = extractTagFromHtml(droppedHtml);
                            if (tag != null) {
                                BlocElement newElement = new BlocElement(tag);
                                
                                // Set default text content based on tag
                                if (tag.equals("button")) {
                                    newElement.textContent = "Click Me";
                                } else if (tag.equals("p")) {
                                    newElement.textContent = "Lorem ipsum dolor sit amet.";
                                } else if (tag.equals("h2")) {
                                    newElement.textContent = "Heading";
                                } else if (tag.equals("a")) {
                                    newElement.textContent = "Link";
                                    newElement.attributes.put("href", "#");
                                } else if (tag.equals("div")) {
                                    newElement.textContent = "Container";
                                    newElement.styles.put("padding", "10px");
                                    newElement.styles.put("border", "1px solid #ccc");
                                }
                                
                                // Check for nesting: add to selected element or root
                                if (currentSelectedElement != null) {
                                    currentSelectedElement.children.add(newElement);
                                } else {
                                    elementTree.add(newElement);
                                }
                                
                                renderCanvas();
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
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String newId = s.toString();
                    currentSelectedElement.attributes.put("id", newId);
                    // Update element ID in the WebView
                    String js = "var el = document.getElementById('" + currentSelectedElement.elementId + "');" +
                               "if(el) { el.setAttribute('id', '" + newId + "'); }";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editClass.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String className = s.toString();
                    currentSelectedElement.attributes.put("class", className);
                    // Live-update the WebView
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').className = '" + className + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editWidth.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String width = s.toString();
                    currentSelectedElement.styles.put("width", width);
                    // Live-update the WebView
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.width = '" + width + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        editColor.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String color = s.toString();
                    currentSelectedElement.styles.put("color", color);
                    // Live-update the WebView
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

        // Set up element management buttons
        MaterialButton btnMoveUp = propertiesView.findViewById(R.id.btn_move_up);
        MaterialButton btnMoveDown = propertiesView.findViewById(R.id.btn_move_down);
        MaterialButton btnDuplicate = propertiesView.findViewById(R.id.btn_duplicate);
        MaterialButton btnDelete = propertiesView.findViewById(R.id.btn_delete);
        MaterialButton btnWrapInDiv = propertiesView.findViewById(R.id.btn_wrap_in_div);

        btnMoveUp.setOnClickListener(v -> {
            if (currentSelectedElement != null) {
                handleElementMoveUp(currentSelectedElement.elementId);
            }
        });

        btnMoveDown.setOnClickListener(v -> {
            if (currentSelectedElement != null) {
                handleElementMoveDown(currentSelectedElement.elementId);
            }
        });

        btnDuplicate.setOnClickListener(v -> {
            if (currentSelectedElement != null) {
                handleElementDuplicate(currentSelectedElement.elementId);
            }
        });

        btnDelete.setOnClickListener(v -> {
            if (currentSelectedElement != null) {
                handleElementDelete(currentSelectedElement.elementId);
            }
        });

        btnWrapInDiv.setOnClickListener(v -> {
            if (currentSelectedElement != null) {
                List<String> ids = new ArrayList<>();
                ids.add(currentSelectedElement.elementId);
                String json = gson.toJson(ids);
                handleElementsWrapInDiv(json);
            }
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
                            // Update global CSS and JS
                            currentProject.cssContent = data.getStringExtra("CSS_RESULT");
                            currentProject.jsContent = data.getStringExtra("JS_RESULT");
                            
                            // Note: HTML editing is now handled through element tree
                            // For backwards compatibility, we parse the HTML if provided
                            String htmlResult = data.getStringExtra("HTML_RESULT");
                            if (htmlResult != null && !htmlResult.isEmpty()) {
                                // Could parse and update element tree here
                                // For now, just refresh
                            }
                            
                            renderCanvas();
                            saveProject();
                        }
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
            saveProject();
            return true;
        } else if (id == R.id.action_run) {
            renderCanvas();
            Snackbar.make(binding.getRoot(), "Preview refreshed", Snackbar.LENGTH_SHORT).show();
            return true;
        } else if (id == R.id.action_view_code) {
            if (currentProject != null) {
                Intent intent = new Intent(this, CodeEditorActivity.class);
                // Generate HTML from element tree
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

        // 1. Build HTML from the elementTree
        String generatedHtml = buildHtmlRecursive(elementTree);

        // 2. Load canvas interaction script from assets
        String canvasScript = "";
        try {
            java.io.InputStream is = getAssets().open("canvas-interaction.js");
            byte[] buffer = new byte[is.available()];
            is.read(buffer);
            is.close();
            canvasScript = new String(buffer, "UTF-8");
        } catch (Exception e) {
            android.util.Log.e("BlocVibe", "Error loading canvas script", e);
        }

        // 3. Build the enhanced JS injection script
        String jsInjectorScript = 
            " <script>" + canvasScript + "</script>" +
            " <script>" +
            "   // Highlight selected element" +
            (currentSelectedElement != null ? 
            "   setTimeout(function() {" +
            "     var selected = document.getElementById('" + currentSelectedElement.elementId + "');" +
            "     if(selected) {" +
            "       selected.style.outline = '2px solid #0D6EFD';" +
            "       selected.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';" +
            "       selected.scrollIntoView({ behavior: 'smooth', block: 'center' });" +
            "     }" +
            "   }, 100);" : "") +
            " </script>";

        // 4. Combine and load
        String fullHtml = "<!DOCTYPE html><html><head>" +
                          "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
                          "<style>" + currentProject.cssContent + 
                          " body { padding: 10px; } " +
                          " .bloc-dragging { opacity: 0.5; } " +
                          " .bloc-selected { outline: 2px solid #0D6EFD !important; } " +
                          "</style></head>" +
                          "<body>" + generatedHtml + "</body>" + 
                          jsInjectorScript + 
                          "</html>";

        binding.canvasWebview.loadDataWithBaseURL(null, fullHtml, "text/html", "UTF-8", null);
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

            html.append(">"); // Close start tag

            // Add text content
            if (el.textContent != null && !el.textContent.isEmpty()) {
                html.append(el.textContent);
            }

            // Recursively add children
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
        
        // Serialize element tree to JSON
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
        // Extract tag name from HTML (e.g., "<h2>..." -> "h2")
        if (html.startsWith("<")) {
            int endIndex = html.indexOf('>');
            if (endIndex > 0) {
                String tagPart = html.substring(1, endIndex);
                // Remove attributes if any
                int spaceIndex = tagPart.indexOf(' ');
                if (spaceIndex > 0) {
                    return tagPart.substring(0, spaceIndex);
                }
                return tagPart;
            }
        }
        return null;
    }
    
    /**
     * Generate HTML from element tree for code editor
     */
    private String generateHtmlFromElements() {
        StringBuilder html = new StringBuilder();
        for (BlocElement element : elementTree) {
            html.append(element.toHtml()).append("\n");
        }
        return html.toString();
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

        // Find the element in our tree (needs a recursive helper function)
        currentSelectedElement = findElementById(elementTree, elementId);

        if (currentSelectedElement != null) {
            // 1. Switch to properties panel
            binding.bottomSheetPalette.editorFlipper.setDisplayedChild(1); 

            // 2. Populate the fields (using the inflated view)
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

            // 3. Re-render canvas to show highlight
            renderCanvas(); 
        }
    }

    private BlocElement findElementById(List<BlocElement> elements, String id) {
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
        // Called when WebView page is fully loaded
        Toast.makeText(this, "Canvas ready", Toast.LENGTH_SHORT).show();
    }

    /**
     * Advanced element management handlers
     */
    public void handleElementMove(String elementId, String newParentId, int index) {
        android.util.Log.d("BlocVibe", "🎯 handleElementMove: " + elementId + " -> " + newParentId + " @ " + index);
        
        if (elementManager != null) {
            // تحديث شجرة العناصر فوراً
            boolean success = elementManager.moveElementToParent(elementId, newParentId, index);
            
            if (success) {
                // حفظ المشروع في الخلفية
                saveProjectInBackground();
                
                // تأخير إعادة رسم Canvas لتجنب التجميد أثناء drag
                scheduleCanvasRender();
                
                android.util.Log.d("BlocVibe", "✅ Element moved successfully - render scheduled");
            } else {
                android.util.Log.e("BlocVibe", "❌ Failed to move element");
            }
        }
    }
    
    /**
     * جدولة إعادة رسم Canvas مع تأخير ذكي (debouncing)
     * هذا يمنع إعادة الرسم المتكررة أثناء drag operations
     */
    private void scheduleCanvasRender() {
        // إلغاء أي عملية رسم معلقة
        if (pendingRenderTask != null) {
            renderHandler.removeCallbacks(pendingRenderTask);
        }
        
        // جدولة عملية رسم جديدة
        pendingRenderTask = new Runnable() {
            @Override
            public void run() {
                android.util.Log.d("BlocVibe", "🎨 Executing scheduled canvas render");
                renderCanvas();
                Snackbar.make(binding.getRoot(), "تم تحديث العرض", Snackbar.LENGTH_SHORT).show();
                pendingRenderTask = null;
            }
        };
        
        renderHandler.postDelayed(pendingRenderTask, RENDER_DEBOUNCE_DELAY_MS);
        android.util.Log.d("BlocVibe", "⏰ Canvas render scheduled in " + RENDER_DEBOUNCE_DELAY_MS + "ms");
    }
    
    /**
     * حفظ المشروع في الخلفية بدون blocking
     */
    private void saveProjectInBackground() {
        if (currentProject == null) return;
        
        // Serialize element tree to JSON
        currentProject.elementsJson = gson.toJson(elementTree);
        currentProject.lastModified = System.currentTimeMillis();
        
        executorService.execute(() -> {
            db.projectDao().updateProject(currentProject);
            android.util.Log.d("BlocVibe", "💾 Project saved in background");
        });
    }

    public void handleElementMoveUp(String elementId) {
        if (elementManager != null) {
            boolean success = elementManager.moveElementUp(elementId);
            if (success) {
                saveProject();
                renderCanvas();
                Snackbar.make(binding.getRoot(), "Element moved up", Snackbar.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Cannot move up - already at top", Toast.LENGTH_SHORT).show();
            }
        }
    }

    public void handleElementMoveDown(String elementId) {
        if (elementManager != null) {
            boolean success = elementManager.moveElementDown(elementId);
            if (success) {
                saveProject();
                renderCanvas();
                Snackbar.make(binding.getRoot(), "Element moved down", Snackbar.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Cannot move down - already at bottom", Toast.LENGTH_SHORT).show();
            }
        }
    }

    public void handleElementDelete(String elementId) {
        if (elementManager != null) {
            boolean success = elementManager.deleteElement(elementId);
            if (success) {
                currentSelectedElement = null;
                binding.bottomSheetPalette.editorFlipper.setDisplayedChild(0); // Back to palette
                saveProject();
                renderCanvas();
                Snackbar.make(binding.getRoot(), "Element deleted", Snackbar.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Failed to delete element", Toast.LENGTH_SHORT).show();
            }
        }
    }

    public void handleElementDuplicate(String elementId) {
        if (elementManager != null) {
            BlocElement duplicate = elementManager.duplicateElement(elementId);
            if (duplicate != null) {
                saveProject();
                renderCanvas();
                Snackbar.make(binding.getRoot(), "Element duplicated", Snackbar.LENGTH_SHORT).show();
            } else {
                Toast.makeText(this, "Failed to duplicate element", Toast.LENGTH_SHORT).show();
            }
        }
    }

    public void handleElementsWrapInDiv(String elementIdsJson) {
        if (elementManager != null) {
            try {
                Type listType = new TypeToken<List<String>>(){}.getType();
                List<String> elementIds = gson.fromJson(elementIdsJson, listType);
                
                BlocElement wrapper = elementManager.wrapElementsInDiv(elementIds);
                if (wrapper != null) {
                    saveProject();
                    renderCanvas();
                    Snackbar.make(binding.getRoot(), "Elements wrapped in container", 
                        Snackbar.LENGTH_SHORT).show();
                    
                    // Select the wrapper
                    currentSelectedElement = wrapper;
                    handleElementSelection(wrapper.elementId);
                } else {
                    Toast.makeText(this, "Failed to wrap elements", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception e) {
                android.util.Log.e("BlocVibe", "Error wrapping elements", e);
                Toast.makeText(this, "Error wrapping elements", Toast.LENGTH_SHORT).show();
            }
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        
        // إلغاء أي عمليات render معلقة
        if (pendingRenderTask != null) {
            renderHandler.removeCallbacks(pendingRenderTask);
            pendingRenderTask = null;
        }
        
        // إيقاف ExecutorService
        executorService.shutdown();
        
        android.util.Log.d("BlocVibe", "🧹 EditorActivity destroyed - cleanup complete");
    }
}
