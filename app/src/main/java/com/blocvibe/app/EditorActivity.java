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
import android.view.ViewGroup;
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
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Pattern;

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
    
    // ===== خصائص لوحة الخصائص المتقدمة =====
    private boolean propertiesPanelVisible = false;
    private String currentElementId = null;
    private AtomicBoolean isPropertyUpdateInProgress = new AtomicBoolean(false);
    private final String PROPERTIES_PANEL_TAG = "PropertiesPanel";
    
    // Property validation patterns
    private static final Pattern HEX_COLOR_PATTERN = Pattern.compile("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$");
    private static final Pattern CSS_DIMENSION_PATTERN = Pattern.compile("^(auto|inherit|(\\d+(\\.\\d+)?)(px|em|rem|%|vh|vw))$");
    private static final Pattern CSS_VALUE_PATTERN = Pattern.compile("^[a-zA-Z0-9\\s,#().%-]+$");
    
    // Property change listeners
    private List<PropertyChangeListener> propertyChangeListeners = new ArrayList<>();

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
                
                // Initialize BottomSheetDragManager for enhanced drag & drop
                initializeBottomSheetDragManager();
                
                if (getSupportActionBar() != null) {
                    getSupportActionBar().setTitle(project.name);
                }
                renderCanvas();
            }
        });

        // Set up enhanced drag listener on WebView
        binding.canvasWebview.setOnDragListener(new View.OnDragListener() {
            private android.graphics.Point dragPoint = null;
            
            @Override
            public boolean onDrag(View v, DragEvent event) {
                switch (event.getAction()) {
                    case DragEvent.ACTION_DRAG_STARTED:
                        android.util.Log.d("EditorActivity", "Drag started on WebView");
                        dragPoint = new android.graphics.Point((int) event.getX(), (int) event.getY());
                        return true;
                        
                    case DragEvent.ACTION_DRAG_LOCATION:
                        dragPoint = new android.graphics.Point((int) event.getX(), (int) event.getY());
                        return true;
                        
                    case DragEvent.ACTION_DRAG_ENTERED:
                        android.util.Log.d("EditorActivity", "Drag entered WebView");
                        // إضافة تأثير بصري للمنطقة المستهدفة
                        binding.canvasWebview.setBackgroundColor(android.graphics.Color.parseColor("#F0F8FF"));
                        return true;
                        
                    case DragEvent.ACTION_DRAG_EXITED:
                        android.util.Log.d("EditorActivity", "Drag exited WebView");
                        // إزالة التأثير البصري
                        binding.canvasWebview.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                        return true;
                        
                    case DragEvent.ACTION_DROP:
                        android.util.Log.d("EditorActivity", "Drop on WebView");
                        // إزالة التأثير البصري
                        binding.canvasWebview.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                        
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
                                
                                // حساب الموقع الأمثل للعنصر الجديد
                                if (dragPoint != null) {
                                    android.util.Log.d("EditorActivity", "Drop position: (" + dragPoint.x + ", " + dragPoint.y + ")");
                                }
                                
                                // Check for nesting: add to selected element or root
                                if (currentSelectedElement != null) {
                                    currentSelectedElement.children.add(newElement);
                                    android.util.Log.d("EditorActivity", "Added " + tag + " to parent: " + currentSelectedElement.tag);
                                } else {
                                    elementTree.add(newElement);
                                    android.util.Log.d("EditorActivity", "Added " + tag + " to root");
                                }
                                
                                // إعادة رسم Canvas مع إشعار المستخدم
                                renderCanvas();
                                Snackbar.make(binding.getRoot(), "تم إضافة " + tag + " بنجاح", Snackbar.LENGTH_SHORT).show();
                            }
                        }
                        return true;
                        
                    case DragEvent.ACTION_DRAG_ENDED:
                        android.util.Log.d("EditorActivity", "Drag ended");
                        // إزالة التأثير البصري
                        binding.canvasWebview.setBackgroundColor(android.graphics.Color.TRANSPARENT);
                        dragPoint = null;
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
        
        // ===== إعداد مستمعي تغييرات الخصائص المتقدمة =====
        setupAdvancedPropertyListeners();

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
        
        // تنظيف مستمعي تغييرات الخصائص
        clearPropertyChangeListeners();
        
        // إيقاف ExecutorService
        executorService.shutdown();
        
        android.util.Log.d("BlocVibe", "🧹 EditorActivity destroyed - cleanup complete");
    }
    
    // ===== الدوال الأساسية لإدارة لوحة الخصائص المتقدمة =====
    
    /**
     * معالجة طلب عرض لوحة الخصائص للعنصر المحدد
     * @param elementId معرف العنصر المراد عرض خصائصه
     */
    public void handlePropertiesPanelRequested(String elementId) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "طلب عرض لوحة الخصائص للعنصر: " + elementId);
        
        if (elementId == null || elementId.trim().isEmpty()) {
            android.util.Log.w(PROPERTIES_PANEL_TAG, "معرف العنصر غير صالح");
            return;
        }
        
        // البحث عن العنصر في الشجرة
        BlocElement element = findElementById(elementTree, elementId);
        if (element == null) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "لم يتم العثور على العنصر بالمعرف: " + elementId);
            showErrorMessage("لم يتم العثور على العنصر المحدد");
            return;
        }
        
        // عرض لوحة الخصائص
        showPropertiesPanel(elementId);
        
        // تحديث العناصر المرئية
        updatePropertiesDisplay(elementId);
        
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تم عرض لوحة الخصائص بنجاح للعنصر: " + elementId);
    }
    
    /**
     * معالجة اكتمال تحديث الخاصية
     * @param elementId معرف العنصر
     * @param success نجح التحديث أم لا
     */
    public void handlePropertyUpdateComplete(String elementId, boolean success) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "اكتمال تحديث الخاصية للعنصر: " + elementId + " - النتيجة: " + success);
        
        isPropertyUpdateInProgress.set(false);
        
        if (success) {
            // حفظ المشروع وتحديث العرض
            saveProjectInBackground();
            scheduleCanvasRender();
            
            // إشعار المستخدمين بالنجاح
            showSuccessMessage("تم حفظ التغييرات بنجاح");
        } else {
            showErrorMessage("فشل في حفظ التغييرات");
        }
    }
    
    /**
     * معالجة فشل التحقق من صحة الخاصية
     * @param elementId معرف العنصر
     * @param errors رسائل الخطأ
     */
    public void handlePropertyValidationFailed(String elementId, String errors) {
        android.util.Log.w(PROPERTIES_PANEL_TAG, "فشل التحقق من صحة الخصائص للعنصر: " + elementId + " - الأخطاء: " + errors);
        
        isPropertyUpdateInProgress.set(false);
        
        // عرض رسائل الخطأ للمستخدم
        showValidationErrorMessage("أخطاء في البيانات المدخلة:\n" + errors);
    }
    
    /**
     * معالجة تغيير خاصية العنصر
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @param value القيمة الجديدة
     */
    public void handleElementPropertyChanged(String elementId, String property, String value) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تغيير خاصية العنصر: " + elementId + " - " + property + " = " + value);
        
        if (elementId == null || property == null) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "معرف العنصر أو اسم الخاصية فارغ");
            return;
        }
        
        // التحقق من صحة التغيير
        String validationResult = validatePropertyChange(elementId, property, value);
        if (validationResult == null || validationResult.isEmpty()) {
            android.util.Log.w(PROPERTIES_PANEL_TAG, "فشل التحقق من صحة التغيير");
            return;
        }
        
        // تحليل نتيجة التحقق من JSON
        try {
            JSONObject result = new JSONObject(validationResult);
            boolean isValid = result.getBoolean("valid");
            if (!isValid) {
                JSONArray errors = result.getJSONArray("errors");
                StringBuilder errorMessage = new StringBuilder();
                for (int i = 0; i < errors.length(); i++) {
                    if (i > 0) errorMessage.append("\n");
                    errorMessage.append("- ").append(errors.getString(i));
                }
                android.util.Log.w(PROPERTIES_PANEL_TAG, "فشل التحقق من صحة التغيير: " + errorMessage.toString());
                showValidationErrorMessage(errorMessage.toString());
                return;
            }
        } catch (JSONException e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في معالجة نتيجة التحقق", e);
            return;
        }
        
        // تحديث الخاصية
        updateElementProperty(elementId, property, value);
    }
    
    // ===== دوال إدارة الخصائص =====
    
    /**
     * إعداد مستمعي تغييرات الخصائص المتقدمة للوحة الخصائص
     */
    private void setupAdvancedPropertyListeners() {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تم إعداد مستمعي تغييرات الخصائص المتقدمة");
    }
    
    /**
     * طلب خصائص العنصر
     * @param elementId معرف العنصر
     */
    public void requestElementProperties(String elementId) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "طلب خصائص العنصر: " + elementId);
        
        BlocElement element = findElementById(elementTree, elementId);
        if (element != null) {
            populatePropertyControls(element);
            android.util.Log.d(PROPERTIES_PANEL_TAG, "تم تحميل خصائص العنصر: " + elementId);
        } else {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "لم يتم العثور على العنصر: " + elementId);
        }
    }
    
    /**
     * تحديث خاصية العنصر
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @param value القيمة الجديدة
     */
    public void updateElementProperty(String elementId, String property, String value) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تحديث خاصية العنصر: " + elementId + " - " + property + " = " + value);
        
        BlocElement element = findElementById(elementTree, elementId);
        if (element == null) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "لم يتم العثور على العنصر: " + elementId);
            return;
        }
        
        isPropertyUpdateInProgress.set(true);
        
        executorService.execute(() -> {
            try {
                // تحديد نوع الخاصية وتحديثها
                if (property.equals("id") || property.equals("class") || property.equals("href") || property.equals("src")) {
                    // خاصية attribute
                    element.attributes.put(property, value);
                } else {
                    // خاصية style
                    element.styles.put(property, value);
                }
                
                // إشعار المستمعين
                notifyPropertyChangeListeners(elementId, property, value);
                
                // إكمال العملية
                runOnUiThread(() -> handlePropertyUpdateComplete(elementId, true));
                
            } catch (Exception e) {
                android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في تحديث الخاصية", e);
                runOnUiThread(() -> handlePropertyUpdateComplete(elementId, false));
            }
        });
    }
    
    /**
     * التحقق من صحة تغيير الخاصية
     * @param elementId معرف العنصر
     * @param property اسم الخاصية
     * @param value القيمة الجديدة
     * @return JSON string مع نتيجة التحقق
     */
    public String validatePropertyChange(String elementId, String property, String value) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "التحقق من صحة التغيير: " + property + " = " + value);
        
        try {
            JSONObject result = new JSONObject();
            JSONArray errors = new JSONArray();
            
            boolean isValid = true;
            
            // التحقق من القيم الفارغة
            if (value == null || value.trim().isEmpty()) {
                errors.put("يجب إدخال قيمة");
                isValid = false;
            }
            
            // التحقق من صحة قيم CSS
            if (property.equals("color") || property.equals("background-color") || property.equals("border-color")) {
                if (!value.equals("inherit") && !value.equals("transparent") && !HEX_COLOR_PATTERN.matcher(value).matches()) {
                    errors.put("قيمة اللون غير صحيحة (استخدم formato hex مثل #FF0000)");
                    isValid = false;
                }
            }
            
            // التحقق من قيم الأبعاد
            if (property.equals("width") || property.equals("height") || property.equals("padding") || property.equals("margin")) {
                if (!CSS_DIMENSION_PATTERN.matcher(value).matches() && !value.equals("0")) {
                    errors.put("قيمة الأبعاد غير صحيحة (مثال: 100px, 50%, auto)");
                    isValid = false;
                }
            }
            
            // التحقق من قيم CSS العامة
            if (!CSS_VALUE_PATTERN.matcher(value).matches() && value.length() > 50) {
                errors.put("القيمة تحتوي على أحرف غير مسموحة");
                isValid = false;
            }
            
            // التحقق من قيم ID المميزة
            if (property.equals("id")) {
                if (value.contains(" ") || value.contains("#") || value.contains(".")) {
                    errors.put("معرف العنصر لا يمكن أن يحتوي على مسافات أو رموز خاصة");
                    isValid = false;
                }
                
                // التحقق من عدم تكرار المعرف
                if (isElementIdDuplicate(elementId, value)) {
                    errors.put("معرف العنصر مستخدم بالفعل");
                    isValid = false;
                }
            }
            
            // التحقق من قيم Class
            if (property.equals("class")) {
                if (value.contains("<") || value.contains(">") || value.contains("&") || value.contains("\"")) {
                    errors.put("اسم الفئة لا يمكن أن يحتوي على رموز HTML");
                    isValid = false;
                }
            }
            
            // إرجاع النتيجة
            result.put("valid", isValid);
            result.put("errors", errors);
            
            if (!isValid) {
                handlePropertyValidationFailed(elementId, errors.toString());
            }
            
            android.util.Log.d(PROPERTIES_PANEL_TAG, "التحقق من صحة التغيير نجح: " + isValid);
            return result.toString();
            
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في التحقق من صحة الخاصية: " + e.getMessage());
            try {
                JSONObject errorResult = new JSONObject();
                errorResult.put("valid", false);
                JSONArray errorArray = new JSONArray();
                errorArray.put("خطأ في التحقق: " + e.getMessage());
                errorResult.put("errors", errorArray);
                return errorResult.toString();
            } catch (JSONException e1) {
                return "{\"valid\": false, \"errors\": [\"خطأ في العملية\"]}";
            }
        }
    }
    
    /**
     * الحصول على نوع العنصر
     * @param elementId معرف العنصر
     * @return نوع العنصر أو null إذا لم يتم العثور عليه
     */
    public String getElementType(String elementId) {
        BlocElement element = findElementById(elementTree, elementId);
        return element != null ? element.tag : null;
    }
    
    // ===== دوال تحديث واجهة لوحة الخصائص =====
    
    /**
     * عرض لوحة الخصائص
     * @param elementId معرف العنصر
     */
    public void showPropertiesPanel(String elementId) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "عرض لوحة الخصائص للعنصر: " + elementId);
        
        currentElementId = elementId;
        propertiesPanelVisible = true;
        
        // التبديل إلى واجهة الخصائص
        binding.bottomSheetPalette.editorFlipper.setDisplayedChild(1);
        
        // إظهار إشعار
        runOnUiThread(() -> {
            Snackbar.make(binding.getRoot(), "تم فتح لوحة خصائص العنصر", Snackbar.LENGTH_SHORT).show();
        });
    }
    
    /**
     * إخفاء لوحة الخصائص
     */
    public void hidePropertiesPanel() {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "إخفاء لوحة الخصائص");
        
        propertiesPanelVisible = false;
        currentElementId = null;
        
        // التبديل إلى واجهة الـ palette
        binding.bottomSheetPalette.editorFlipper.setDisplayedChild(0);
        
        // إلغاء تحديد العنصر
        currentSelectedElement = null;
        renderCanvas();
    }
    
    /**
     * تحديث عرض الخصائص
     * @param elementId معرف العنصر
     */
    public void updatePropertiesDisplay(String elementId) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تحديث عرض خصائص العنصر: " + elementId);
        
        BlocElement element = findElementById(elementTree, elementId);
        if (element != null) {
            populatePropertyControls(element);
        }
    }
    
    /**
     * ملء عناصر تحكم الخصائص
     * @param element العنصر المراد ملء خصائصه
     */
    public void populatePropertyControls(BlocElement element) {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "ملء عناصر تحكم خصائص العنصر: " + element.tag);
        
        if (element == null) return;
        
        runOnUiThread(() -> {
            try {
                View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
                
                // العثور على عناصر التحكم
                TextView label = propertiesView.findViewById(R.id.selected_element_label);
                TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
                TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
                TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
                TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);
                
                // تحديث النصوص
                label.setText("تحرير: <" + element.tag + ">");
                editId.setText(getAttributeValue(element, "id"));
                editClass.setText(getAttributeValue(element, "class"));
                editWidth.setText(getStyleValue(element, "width"));
                editColor.setText(getStyleValue(element, "color"));
                
                // إضافة فاصل منطقي حسب نوع العنصر
                updateAdvancedPropertyControls(element, propertiesView);
                
            } catch (Exception e) {
                android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في ملء عناصر التحكم", e);
            }
        });
    }
    
    /**
     * تحديث عناصر التحكم المتقدمة حسب نوع العنصر
     * @param element العنصر
     * @param propertiesView واجهة الخصائص
     */
    private void updateAdvancedPropertyControls(BlocElement element, View propertiesView) {
        try {
            // إظهار/إخفاء عناصر التحكم حسب نوع العنصر
            View contentGroup = propertiesView.findViewById(R.id.content_controls_group);
            View linkGroup = propertiesView.findViewById(R.id.link_controls_group);
            View imageGroup = propertiesView.findViewById(R.id.image_controls_group);
            View layoutGroup = propertiesView.findViewById(R.id.layout_controls_group);
            
            // إخفاء جميع المجموعات أولاً
            if (contentGroup != null) contentGroup.setVisibility(View.GONE);
            if (linkGroup != null) linkGroup.setVisibility(View.GONE);
            if (imageGroup != null) imageGroup.setVisibility(View.GONE);
            if (layoutGroup != null) layoutGroup.setVisibility(View.GONE);
            
            // إظهار المجموعة المناسبة حسب نوع العنصر
            switch (element.tag.toLowerCase()) {
                case "button":
                case "p":
                case "h1":
                case "h2":
                case "h3":
                    if (contentGroup != null) contentGroup.setVisibility(View.VISIBLE);
                    break;
                    
                case "a":
                    if (linkGroup != null) linkGroup.setVisibility(View.VISIBLE);
                    if (contentGroup != null) contentGroup.setVisibility(View.VISIBLE);
                    break;
                    
                case "img":
                    if (imageGroup != null) imageGroup.setVisibility(View.VISIBLE);
                    break;
                    
                case "div":
                case "section":
                case "article":
                    if (layoutGroup != null) layoutGroup.setVisibility(View.VISIBLE);
                    break;
            }
            
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في تحديث عناصر التحكم المتقدمة", e);
        }
    }
    
    // ===== دوال مساعدة للتحقق والعرض =====
    
    /**
     * التحقق من تكرار معرف العنصر
     * @param currentElementId معرف العنصر الحالي
     * @param newId المعرف الجديد
     * @return true إذا كان المعرف مكرراً
     */
    private boolean isElementIdDuplicate(String currentElementId, String newId) {
        for (BlocElement element : elementTree) {
            if (isElementIdDuplicateRecursive(element, currentElementId, newId)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * التحقق المتكرر من تكرار معرف العنصر
     */
    private boolean isElementIdDuplicateRecursive(BlocElement element, String currentElementId, String newId) {
        String elementId = element.attributes.get("id");
        
        // تجاهل العنصر الحالي في التحقق
        if (element.elementId.equals(currentElementId)) {
            return false;
        }
        
        // التحقق من التطابق
        if (newId != null && newId.equals(elementId)) {
            return true;
        }
        
        // التحقق من العناصر الفرعية
        for (BlocElement child : element.children) {
            if (isElementIdDuplicateRecursive(child, currentElementId, newId)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * الحصول على قيمة خاصية العنصر
     */
    private String getAttributeValue(BlocElement element, String attribute) {
        return element.attributes.get(attribute) != null ? element.attributes.get(attribute) : "";
    }
    
    /**
     * الحصول على قيمة خاصية التصميم
     */
    private String getStyleValue(BlocElement element, String style) {
        return element.styles.get(style) != null ? element.styles.get(style) : "";
    }
    
    /**
     * إشعار مستمعي تغيير الخصائص
     */
    private void notifyPropertyChangeListeners(String elementId, String property, String value) {
        for (PropertyChangeListener listener : propertyChangeListeners) {
            try {
                listener.onPropertyChanged(elementId, property, value);
            } catch (Exception e) {
                android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في إشعار المستمع", e);
            }
        }
    }
    
    // ===== دوال إظهار الرسائل للمستخدم =====
    
    /**
     * عرض رسالة نجاح
     */
    private void showSuccessMessage(String message) {
        runOnUiThread(() -> {
            Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_SHORT)
                .setBackgroundTint(android.graphics.Color.parseColor("#4CAF50"))
                .show();
        });
    }
    
    /**
     * عرض رسالة خطأ
     */
    private void showErrorMessage(String message) {
        runOnUiThread(() -> {
            Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_LONG)
                .setBackgroundTint(android.graphics.Color.parseColor("#F44336"))
                .setAction("إعادة المحاولة", v -> {
                    // إعادة محاولة العملية
                    if (currentSelectedElement != null) {
                        updatePropertiesDisplay(currentSelectedElement.elementId);
                    }
                })
                .show();
        });
    }
    
    /**
     * عرض رسالة خطأ التحقق من صحة البيانات
     */
    private void showValidationErrorMessage(String message) {
        runOnUiThread(() -> {
            new androidx.appcompat.app.AlertDialog.Builder(this)
                .setTitle("خطأ في البيانات")
                .setMessage(message)
                .setPositiveButton("حسناً", (dialog, which) -> dialog.dismiss())
                .setIcon(android.R.drawable.ic_dialog_alert)
                .show();
        });
    }
    
    // ===== تحسين الأداء وتجربة المستخدم =====
    
    /**
     * تحسين عملية تحديث الخصائص لتجنب التجمد
     */
    private void optimizePropertyUpdate(Runnable updateTask) {
        // استخدام thread منفصل للعمليات الثقيلة
        executorService.execute(() -> {
            try {
                // إجراء التحديث
                updateTask.run();
                
                // تحديث الواجهة في main thread
                runOnUiThread(() -> {
                    renderCanvas();
                    if (currentSelectedElement != null) {
                        updatePropertiesDisplay(currentSelectedElement.elementId);
                    }
                });
                
            } catch (Exception e) {
                android.util.Log.e(PROPERTIES_PANEL_TAG, "خطأ في تحديث الخاصية المحسن", e);
                runOnUiThread(() -> showErrorMessage("خطأ في تحديث الخاصية"));
            }
        });
    }
    
    /**
     * حفظ تلقائي للخصائص المحدثة
     */
    private void autoSaveProperties() {
        // تأخير الحفظ التلقائي لتجنب الحفظ المتكرر
        renderHandler.postDelayed(new Runnable() {
            @Override
            public void run() {
                saveProjectInBackground();
                android.util.Log.d(PROPERTIES_PANEL_TAG, "تم الحفظ التلقائي للخصائص");
            }
        }, 2000); // حفظ بعد ثانيتين من آخر تعديل
    }
    
    /**
     * واجهة مستمعي تغييرات الخصائص المتقدمة
     */
    public interface PropertyChangeListener {
        void onPropertyChanged(String elementId, String property, String value);
        void onPropertyValidationFailed(String elementId, String property, String value, String error);
        void onPropertyUpdateComplete(String elementId, String property, boolean success);
    }
    
    /**
     * إضافة مستمع تغييرات الخصائص
     */
    public void addPropertyChangeListener(PropertyChangeListener listener) {
        if (listener != null && !propertyChangeListeners.contains(listener)) {
            propertyChangeListeners.add(listener);
            android.util.Log.d(PROPERTIES_PANEL_TAG, "تم إضافة مستمع جديد لتغييرات الخصائص");
        }
    }
    
    /**
     * إزالة مستمع تغييرات الخصائص
     */
    public void removePropertyChangeListener(PropertyChangeListener listener) {
        if (listener != null) {
            propertyChangeListeners.remove(listener);
            android.util.Log.d(PROPERTIES_PANEL_TAG, "تم إزالة مستمع تغييرات الخصائص");
        }
    }
    
    /**
     * تنظيف مستمعي تغييرات الخصائص
     */
    public void clearPropertyChangeListeners() {
        propertyChangeListeners.clear();
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تم تنظيف جميع مستمعي تغييرات الخصائص");
    }
    
    /**
     * الحصول على حالة لوحة الخصائص
     */
    public boolean isPropertiesPanelVisible() {
        return propertiesPanelVisible;
    }
    
    /**
     * الحصول على معرف العنصر الحالي في لوحة الخصائص
     */
    public String getCurrentElementIdInProperties() {
        return currentElementId;
    }
    
    /**
     * معالجة طلب عرض لوحة الخصائص
     */
    public void handlePropertiesPanelRequest(String elementId) {
        handlePropertiesPanelRequested(elementId);
    }
    
    /**
     * الحصول على خصائص العنصر
     */
    public String getElementProperties(String elementId) {
        try {
            BlocElement element = findElementById(elementTree, elementId);
            if (element == null) {
                return "{}";
            }
            
            JSONObject properties = new JSONObject();
            properties.put("id", element.attributes.get("id"));
            properties.put("class", element.attributes.get("class"));
            properties.put("tag", element.tag);
            properties.put("textContent", element.textContent);
            
            // Add styles
            JSONObject styles = new JSONObject();
            for (Map.Entry<String, String> entry : element.styles.entrySet()) {
                styles.put(entry.getKey(), entry.getValue());
            }
            properties.put("styles", styles);
            
            // Add attributes
            JSONObject attributes = new JSONObject();
            for (Map.Entry<String, String> entry : element.attributes.entrySet()) {
                attributes.put(entry.getKey(), entry.getValue());
            }
            properties.put("attributes", attributes);
            
            return properties.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error getting element properties: " + e.getMessage());
            return "{}";
        }
    }
    
    /**
     * الحصول على الخصائص المتاحة للعنصر
     */
    public String getAvailableProperties(String elementId, String elementType) {
        try {
            JSONObject available = new JSONObject();
            
            // Basic properties
            JSONArray basic = new JSONArray();
            basic.put("id");
            basic.put("class");
            basic.put("width");
            basic.put("height");
            basic.put("color");
            basic.put("background-color");
            basic.put("padding");
            basic.put("margin");
            available.put("basic", basic);
            
            // Type-specific properties
            if (elementType != null) {
                JSONArray specific = new JSONArray();
                switch (elementType.toLowerCase()) {
                    case "a":
                        specific.put("href");
                        specific.put("target");
                        break;
                    case "img":
                        specific.put("src");
                        specific.put("alt");
                        specific.put("width");
                        specific.put("height");
                        break;
                    case "button":
                        specific.put("type");
                        specific.put("disabled");
                        break;
                    case "div":
                    case "section":
                    case "article":
                        specific.put("display");
                        specific.put("flex-direction");
                        specific.put("justify-content");
                        specific.put("align-items");
                        break;
                }
                available.put("specific", specific);
            }
            
            return available.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error getting available properties: " + e.getMessage());
            return "{}";
        }
    }
    
    /**
     * حفظ خصائص متعددة للعنصر
     */
    public String saveMultipleProperties(String elementId, String propertiesJson) {
        try {
            JSONObject result = new JSONObject();
            result.put("success", false);
            
            BlocElement element = findElementById(elementTree, elementId);
            if (element == null) {
                result.put("message", "العنصر غير موجود");
                return result.toString();
            }
            
            JSONObject properties = new JSONObject(propertiesJson);
            Iterator<String> keys = properties.keys();
            
            while (keys.hasNext()) {
                String key = keys.next();
                String value = properties.getString(key);
                
                // Update based on property type
                if (key.equals("id") || key.equals("class")) {
                    element.attributes.put(key, value);
                } else {
                    element.styles.put(key, value);
                }
            }
            
            result.put("success", true);
            result.put("message", "تم حفظ الخصائص بنجاح");
            
            // Save and re-render
            saveProjectInBackground();
            scheduleCanvasRender();
            
            return result.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error saving multiple properties: " + e.getMessage());
            JSONObject result = new JSONObject();
            try {
                result.put("success", false);
                result.put("message", "خطأ في حفظ الخصائص: " + e.getMessage());
            } catch (JSONException e1) {
                return "{\"success\": false, \"message\": \"خطأ في العملية\"}";
            }
            return result.toString();
        }
    }
    
    /**
     * إعادة تعيين خاصية للعنصر إلى قيمتها الافتراضية
     */
    public String resetPropertyToDefault(String elementId, String property) {
        try {
            JSONObject result = new JSONObject();
            result.put("success", false);
            
            BlocElement element = findElementById(elementTree, elementId);
            if (element == null) {
                result.put("message", "العنصر غير موجود");
                return result.toString();
            }
            
            // Remove property based on type
            if (property.equals("id") || property.equals("class")) {
                element.attributes.remove(property);
            } else {
                element.styles.remove(property);
            }
            
            result.put("success", true);
            result.put("message", "تم إعادة تعيين الخاصية");
            
            // Save and re-render
            saveProjectInBackground();
            scheduleCanvasRender();
            
            return result.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error resetting property: " + e.getMessage());
            JSONObject result = new JSONObject();
            try {
                result.put("success", false);
                result.put("message", "خطأ في إعادة التعيين: " + e.getMessage());
            } catch (JSONException e1) {
                return "{\"success\": false, \"message\": \"خطأ في العملية\"}";
            }
            return result.toString();
        }
    }
    
    /**
     * نسخ خصائص من عنصر إلى آخر
     */
    public String copyProperties(String sourceElementId, String targetElementId, String propertiesJson) {
        try {
            JSONObject result = new JSONObject();
            result.put("success", false);
            
            BlocElement sourceElement = findElementById(elementTree, sourceElementId);
            BlocElement targetElement = findElementById(elementTree, targetElementId);
            
            if (sourceElement == null || targetElement == null) {
                result.put("message", "أحد العناصر غير موجود");
                return result.toString();
            }
            
            JSONArray properties = new JSONArray(propertiesJson);
            
            for (int i = 0; i < properties.length(); i++) {
                String property = properties.getString(i);
                
                // Copy based on property type
                if (property.equals("id") || property.equals("class")) {
                    if (sourceElement.attributes.containsKey(property)) {
                        targetElement.attributes.put(property, sourceElement.attributes.get(property));
                    }
                } else {
                    if (sourceElement.styles.containsKey(property)) {
                        targetElement.styles.put(property, sourceElement.styles.get(property));
                    }
                }
            }
            
            result.put("success", true);
            result.put("message", "تم نسخ الخصائص بنجاح");
            
            // Save and re-render
            saveProjectInBackground();
            scheduleCanvasRender();
            
            return result.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error copying properties: " + e.getMessage());
            JSONObject result = new JSONObject();
            try {
                result.put("success", false);
                result.put("message", "خطأ في نسخ الخصائص: " + e.getMessage());
            } catch (JSONException e1) {
                return "{\"success\": false, \"message\": \"خطأ في العملية\"}";
            }
            return result.toString();
        }
    }
    
    /**
     * تصدير خصائص العنصر
     */
    public String exportProperties(String elementId, boolean includeSystemProperties) {
        try {
            BlocElement element = findElementById(elementTree, elementId);
            if (element == null) {
                return "{}";
            }
            
            JSONObject export = new JSONObject();
            export.put("id", element.attributes.get("id"));
            export.put("class", element.attributes.get("class"));
            export.put("tag", element.tag);
            export.put("textContent", element.textContent);
            
            // Add styles
            JSONObject styles = new JSONObject();
            for (Map.Entry<String, String> entry : element.styles.entrySet()) {
                if (includeSystemProperties || !entry.getKey().startsWith("system-")) {
                    styles.put(entry.getKey(), entry.getValue());
                }
            }
            export.put("styles", styles);
            
            // Add selected attributes
            JSONObject attributes = new JSONObject();
            for (Map.Entry<String, String> entry : element.attributes.entrySet()) {
                if (includeSystemProperties || !entry.getKey().startsWith("system-")) {
                    attributes.put(entry.getKey(), entry.getValue());
                }
            }
            export.put("attributes", attributes);
            
            return export.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error exporting properties: " + e.getMessage());
            return "{}";
        }
    }
    
    /**
     * استيراد خصائص للعنصر
     */
    public String importProperties(String elementId, String propertiesJson) {
        try {
            JSONObject result = new JSONObject();
            result.put("success", false);
            
            BlocElement element = findElementById(elementTree, elementId);
            if (element == null) {
                result.put("message", "العنصر غير موجود");
                return result.toString();
            }
            
            JSONObject importData = new JSONObject(propertiesJson);
            
            // Import styles
            if (importData.has("styles")) {
                JSONObject styles = importData.getJSONObject("styles");
                Iterator<String> keys = styles.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    element.styles.put(key, styles.getString(key));
                }
            }
            
            // Import attributes
            if (importData.has("attributes")) {
                JSONObject attributes = importData.getJSONObject("attributes");
                Iterator<String> keys = attributes.keys();
                while (keys.hasNext()) {
                    String key = keys.next();
                    element.attributes.put(key, attributes.getString(key));
                }
            }
            
            result.put("success", true);
            result.put("message", "تم استيراد الخصائص بنجاح");
            
            // Save and re-render
            saveProjectInBackground();
            scheduleCanvasRender();
            
            return result.toString();
        } catch (Exception e) {
            android.util.Log.e(PROPERTIES_PANEL_TAG, "Error importing properties: " + e.getMessage());
            JSONObject result = new JSONObject();
            try {
                result.put("success", false);
                result.put("message", "خطأ في استيراد الخصائص: " + e.getMessage());
            } catch (JSONException e1) {
                return "{\"success\": false, \"message\": \"خطأ في العملية\"}";
            }
            return result.toString();
        }
    }
    
    /**
     * التحقق من وجود عملية تحديث جارية
     */
    public boolean isPropertyUpdateInProgress() {
        return isPropertyUpdateInProgress.get();
    }
    
    /**
     * الحصول على عدد مستمعي تغييرات الخصائص
     */
    public int getPropertyChangeListenerCount() {
        return propertyChangeListeners.size();
    }
    
    /**
     * سجل مفصل لحالات لوحة الخصائص
     */
    private void logPropertiesPanelState() {
        android.util.Log.d(PROPERTIES_PANEL_TAG, "=== حالة لوحة الخصائص ===");
        android.util.Log.d(PROPERTIES_PANEL_TAG, "مرئية: " + propertiesPanelVisible);
        android.util.Log.d(PROPERTIES_PANEL_TAG, "العنصر الحالي: " + currentElementId);
        android.util.Log.d(PROPERTIES_PANEL_TAG, "تحديث جاري: " + isPropertyUpdateInProgress.get());
        android.util.Log.d(PROPERTIES_PANEL_TAG, "عدد المستمعين: " + propertyChangeListeners.size());
        android.util.Log.d(PROPERTIES_PANEL_TAG, "===========================");
    }

    // ==================== FLEXBOX SYSTEM HANDLERS ====================
    // معالجات نظام Flexbox المتقدم

    /**
     * معالجة اكتمال تحليل Flexbox
     */
    public void handleFlexboxAnalysisComplete(String containerId, String analysisJson, double score, String recommendations) {
        try {
            android.util.Log.d("FlexboxSystem", "تحليل Flexbox اكتمل للحاوية: " + containerId + " (النتيجة: " + score + ")");
            
            // تحديث واجهة المستخدم بعرض التحليل
            runOnUiThread(() -> {
                Toast.makeText(this, "تم تحليل Flexbox - النتيجة: " + String.format("%.1f", score), Toast.LENGTH_SHORT).show();
                
                // تحديث لوحة التحكم بالنتائج
                updateFlexboxAnalysisDisplay(containerId, analysisJson, score);
            });

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في معالجة اكتمال تحليل Flexbox: " + e.getMessage());
        }
    }

    /**
     * معالجة تطبيق Flexbox على الحاوية
     */
    public void handleFlexboxApplied(String containerId, String propertiesJson, double conversionTime, boolean success) {
        try {
            android.util.Log.d("FlexboxSystem", "تطبيق Flexbox على: " + containerId + " (نجح: " + success + ")");
            
            runOnUiThread(() -> {
                if (success) {
                    Toast.makeText(this, "تم تطبيق Flexbox بنجاح في " + String.format("%.1f", conversionTime) + "ms", Toast.LENGTH_LONG).show();
                    
                    // تحديث حالة عنصر التحكم
                    updateFlexboxAppliedState(containerId, true, propertiesJson);
                } else {
                    Toast.makeText(this, "فشل في تطبيق Flexbox", Toast.LENGTH_SHORT).show();
                    updateFlexboxAppliedState(containerId, false, null);
                }
            });

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في معالجة تطبيق Flexbox: " + e.getMessage());
        }
    }

    /**
     * معالجة تبديل معاينة Flexbox
     */
    public void handleFlexboxPreviewToggled(boolean enabled, String containerId) {
        try {
            android.util.Log.d("FlexboxSystem", "تبديل معاينة Flexbox: " + (enabled ? "مفعل" : "معطل") + " للحاوية: " + containerId);
            
            runOnUiThread(() -> {
                String message = enabled ? "تم تفعيل معاينة Flexbox" : "تم إلغاء معاينة Flexbox";
                if (containerId != null && !containerId.isEmpty()) {
                    message += " للحاوية: " + containerId;
                }
                Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
                
                // تحديث حالة عنصر التحكم
                updateFlexboxPreviewState(enabled);
            });

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في معالجة تبديل معاينة Flexbox: " + e.getMessage());
        }
    }

    /**
     * معالجة استرجاع Flexbox
     */
    public void handleFlexboxReverted(String containerId, boolean success) {
        try {
            android.util.Log.d("FlexboxSystem", "استرجاع Flexbox للحاوية: " + containerId + " (نجح: " + success + ")");
            
            runOnUiThread(() -> {
                if (success) {
                    Toast.makeText(this, "تم استرجاع Flexbox بنجاح", Toast.LENGTH_SHORT).show();
                    updateFlexboxAppliedState(containerId, false, null);
                } else {
                    Toast.makeText(this, "فشل في استرجاع Flexbox", Toast.LENGTH_SHORT).show();
                }
            });

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في معالجة استرجاع Flexbox: " + e.getMessage());
        }
    }

    /**
     * معالجة تحسين Flexbox
     */
    public void handleFlexboxOptimized(String containerId, int optimizationsApplied, String improvementsJson) {
        try {
            android.util.Log.d("FlexboxSystem", "تحسين Flexbox للحاوية: " + containerId + " (عدد التحسينات: " + optimizationsApplied + ")");
            
            runOnUiThread(() -> {
                if (optimizationsApplied > 0) {
                    Toast.makeText(this, "تم تطبيق " + optimizationsApplied + " تحسين على Flexbox", Toast.LENGTH_LONG).show();
                } else {
                    Toast.makeText(this, "لا توجد تحسينات متاحة لـ Flexbox", Toast.LENGTH_SHORT).show();
                }
                
                // تحديث واجهة المستخدم بالتحسينات
                updateFlexboxOptimizationDisplay(containerId, improvementsJson);
            });

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في معالجة تحسين Flexbox: " + e.getMessage());
        }
    }

    /**
     * معالجة تصدير إعدادات Flexbox
     */
    public void handleFlexboxConfigurationExported(String containerId, String configurationJson) {
        try {
            android.util.Log.d("FlexboxSystem", "تصدير إعدادات Flexbox للحاوية: " + containerId);
            
            runOnUiThread(() -> {
                Toast.makeText(this, "تم تصدير إعدادات Flexbox", Toast.LENGTH_SHORT).show();
                
                // حفظ الإعدادات أو عرضها
                saveFlexboxConfiguration(containerId, configurationJson);
            });

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في معالجة تصدير إعدادات Flexbox: " + e.getMessage());
        }
    }

    // ==================== FLEXBOX CONTROL METHODS ====================
    // طرق التحكم في نظام Flexbox

    /**
     * طلب تحليل فرص Flexbox
     */
    public String requestFlexboxAnalysis(String containerId, String optionsJson) {
        try {
            android.util.Log.d("FlexboxSystem", "طلب تحليل Flexbox للحاوية: " + containerId);
            
            if (binding.canvasWebview != null) {
                String script = "window.BlocVibeCanvas.analyzeFlexboxOpportunities('" + containerId + "', " + optionsJson + ");";
                binding.canvasWebview.evaluateJavascript(script, value -> {
                    android.util.Log.d("FlexboxSystem", "تم إرسال طلب تحليل Flexbox");
                });
                return "{\"success\": true, \"message\": \"تم إرسال طلب التحليل\"}";
            } else {
                return "{\"success\": false, \"message\": \"WebView غير متاح\"}";
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في طلب تحليل Flexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تطبيق Flexbox على الحاوية
     */
    public String applyFlexbox(String containerId, String propertiesJson) {
        try {
            android.util.Log.d("FlexboxSystem", "تطبيق Flexbox على الحاوية: " + containerId);
            
            if (binding.canvasWebview != null) {
                String script = "window.BlocVibeCanvas.applyFlexboxToContainer('" + containerId + "', " + propertiesJson + ");";
                binding.canvasWebview.evaluateJavascript(script, value -> {
                    android.util.Log.d("FlexboxSystem", "تم إرسال طلب تطبيق Flexbox");
                });
                return "{\"success\": true, \"message\": \"تم إرسال طلب التطبيق\"}";
            } else {
                return "{\"success\": false, \"message\": \"WebView غير متاح\"}";
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تطبيق Flexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تبديل معاينة Flexbox
     */
    public String toggleFlexboxPreview(String containerId) {
        try {
            android.util.Log.d("FlexboxSystem", "تبديل معاينة Flexbox للحاوية: " + containerId);
            
            if (binding.canvasWebview != null) {
                String script = "if (window.BlocVibeCanvas.flexboxPreview && window.BlocVibeCanvas.flexboxPreview.isPreviewMode) {" +
                               "    window.BlocVibeCanvas.disableFlexboxPreview();" +
                               "} else {" +
                               "    window.BlocVibeCanvas.enableFlexboxPreview('" + containerId + "');" +
                               "}";
                binding.canvasWebview.evaluateJavascript(script, value -> {
                    android.util.Log.d("FlexboxSystem", "تم إرسال طلب تبديل معاينة Flexbox");
                });
                return "{\"success\": true, \"message\": \"تم إرسال طلب تبديل المعاينة\"}";
            } else {
                return "{\"success\": false, \"message\": \"WebView غير متاح\"}";
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تبديل معاينة Flexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * استرجاع Flexbox للحاوية
     */
    public String revertFlexbox(String containerId) {
        try {
            android.util.Log.d("FlexboxSystem", "استرجاع Flexbox للحاوية: " + containerId);
            
            if (binding.canvasWebview != null) {
                String script = "window.BlocVibeCanvas.revertFlexbox('" + containerId + "');";
                binding.canvasWebview.evaluateJavascript(script, value -> {
                    android.util.Log.d("FlexboxSystem", "تم إرسال طلب استرجاع Flexbox");
                });
                return "{\"success\": true, \"message\": \"تم إرسال طلب الاسترجاع\"}";
            } else {
                return "{\"success\": false, \"message\": \"WebView غير متاح\"}";
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في استرجاع Flexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * تحسين تخطيط Flexbox
     */
    public String optimizeFlexboxLayout(String containerId) {
        try {
            android.util.Log.d("FlexboxSystem", "تحسين تخطيط Flexbox للحاوية: " + containerId);
            
            if (binding.canvasWebview != null) {
                String script = "window.BlocVibeCanvas.optimizeFlexboxLayout('" + containerId + "');";
                binding.canvasWebview.evaluateJavascript(script, value -> {
                    android.util.Log.d("FlexboxSystem", "تم إرسال طلب تحسين Flexbox");
                });
                return "{\"success\": true, \"message\": \"تم إرسال طلب التحسين\"}";
            } else {
                return "{\"success\": false, \"message\": \"WebView غير متاح\"}";
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تحسين Flexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    /**
     * الحصول على تقرير أداء Flexbox
     */
    public String getFlexboxPerformanceReport() {
        try {
            android.util.Log.d("FlexboxSystem", "الحصول على تقرير أداء Flexbox");
            
            if (binding.canvasWebview != null) {
                binding.canvasWebview.evaluateJavascript("window.BlocVibeCanvas.getFlexboxPerformanceReport();", value -> {
                    android.util.Log.d("FlexboxSystem", "تم الحصول على تقرير أداء Flexbox");
                });
                return "{\"success\": true, \"message\": \"تم إرسال طلب التقرير\"}";
            } else {
                return "{\"success\": false, \"message\": \"WebView غير متاح\"}";
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في الحصول على تقرير Flexbox: " + e.getMessage());
            return "{\"success\": false, \"message\": \"خطأ: " + e.getMessage() + "\"}";
        }
    }

    // ==================== FLEXBOX UI UPDATE METHODS ====================
    // طرق تحديث واجهة المستخدم لـ Flexbox

    /**
     * تحديث عرض تحليل Flexbox
     */
    private void updateFlexboxAnalysisDisplay(String containerId, String analysisJson, double score) {
        try {
            // تحديث عناصر واجهة المستخدم ببيانات التحليل
            if (findViewById(R.id.tvFlexboxAnalysisScore) != null) {
                TextView scoreView = findViewById(R.id.tvFlexboxAnalysisScore);
                scoreView.setText("النتيجة: " + String.format("%.1f", score));
            }
            
            // تفعيل زر التطبيق إذا كانت النتيجة جيدة
            if (score > 0.6 && findViewById(R.id.btnApplyFlexbox) != null) {
                MaterialButton applyButton = findViewById(R.id.btnApplyFlexbox);
                applyButton.setEnabled(true);
                applyButton.setText("تطبيق Flexbox (النتيجة: " + String.format("%.1f", score) + ")");
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تحديث عرض تحليل Flexbox: " + e.getMessage());
        }
    }

    /**
     * تحديث حالة تطبيق Flexbox
     */
    private void updateFlexboxAppliedState(String containerId, boolean applied, String propertiesJson) {
        try {
            if (findViewById(R.id.btnApplyFlexbox) != null && findViewById(R.id.btnRevertFlexbox) != null) {
                MaterialButton applyButton = findViewById(R.id.btnApplyFlexbox);
                MaterialButton revertButton = findViewById(R.id.btnRevertFlexbox);
                
                applyButton.setEnabled(!applied);
                applyButton.setText(applied ? "Flexbox مطبق" : "تطبيق Flexbox");
                
                revertButton.setEnabled(applied);
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تحديث حالة تطبيق Flexbox: " + e.getMessage());
        }
    }

    /**
     * تحديث حالة معاينة Flexbox
     */
    private void updateFlexboxPreviewState(boolean enabled) {
        try {
            if (findViewById(R.id.btnPreviewToggle) != null) {
                MaterialButton previewButton = findViewById(R.id.btnPreviewToggle);
                previewButton.setText(enabled ? "إخفاء المعاينة" : "إظهار المعاينة");
            }

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تحديث حالة معاينة Flexbox: " + e.getMessage());
        }
    }

    /**
     * تحديث عرض تحسينات Flexbox
     */
    private void updateFlexboxOptimizationDisplay(String containerId, String improvementsJson) {
        try {
            // تحديث عرض التحسينات المطبقة
            android.util.Log.d("FlexboxSystem", "تحسينات Flexbox المطبقة: " + improvementsJson);

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في تحديث عرض تحسينات Flexbox: " + e.getMessage());
        }
    }

    /**
     * حفظ إعدادات Flexbox
     */
    private void saveFlexboxConfiguration(String containerId, String configurationJson) {
        try {
            // حفظ إعدادات Flexbox في قاعدة البيانات أو الملفات
            android.util.Log.d("FlexboxSystem", "حفظ إعدادات Flexbox للحاوية: " + containerId);
            
            // يمكن هنا حفظ الإعدادات في SharedPreferences أو قاعدة البيانات

        } catch (Exception e) {
            android.util.Log.e("FlexboxSystem", "خطأ في حفظ إعدادات Flexbox: " + e.getMessage());
        }
    }

    // ==================== BOTTOM SHEET DRAG MANAGER ====================
    // Enhanced Bottom Sheet Drag & Drop System

    private BottomSheetDragManager bottomSheetDragManager;

    /**
     * تهيئة BottomSheetDragManager
     */
    private void initializeBottomSheetDragManager() {
        try {
            // العثور على containers
            ViewGroup bottomSheetContainer = findViewById(R.id.bottom_sheet_palette);
            ViewGroup canvasContainer = findViewById(R.id.canvas_webview);
            
            if (bottomSheetContainer != null && canvasContainer != null) {
                bottomSheetDragManager = new BottomSheetDragManager(
                    this, this, bottomSheetContainer, canvasContainer
                );
                
                // إضافة callbacks
                bottomSheetDragManager.addDragCallback(new BottomSheetDragManager.DragCallback() {
                    @Override
                    public void onDragStart(String elementType, android.graphics.Point position) {
                        android.util.Log.d("BottomSheetDrag", "Drag started: " + elementType);
                    }

                    @Override
                    public void onDragMove(String elementType, android.graphics.Point position, BottomSheetDragManager.DropZone hoverZone) {
                        // معالجة الحركة
                    }

                    @Override
                    public void onDragEnd(String elementType, android.graphics.Point position, BottomSheetDragManager.DropZone dropZone, boolean success) {
                        if (success) {
                            runOnUiThread(() -> {
                                Toast.makeText(EditorActivity.this, "تم إضافة " + elementType + " بنجاح", Toast.LENGTH_SHORT).show();
                            });
                        }
                    }

                    @Override
                    public void onDragCancelled(String elementType, android.graphics.Point position) {
                        runOnUiThread(() -> {
                            Toast.makeText(EditorActivity.this, "تم إلغاء السحب", Toast.LENGTH_SHORT).show();
                        });
                    }

                    @Override
                    public void onDropZoneDetected(List<BottomSheetDragManager.DropZone> zones) {
                        android.util.Log.d("BottomSheetDrag", "Detected " + zones.size() + " drop zones");
                    }

                    @Override
                    public void onAutoPositioningApplied(BottomSheetDragManager.DropZone zone, android.graphics.Point position) {
                        android.util.Log.d("BottomSheetDrag", "Auto-positioning applied for zone: " + zone.id);
                    }

                    @Override
                    public void onBottomSheetDragStart(String elementType, int x, int y) {
                        android.util.Log.d("BottomSheetDrag", "Bottom sheet drag start: " + elementType + " at (" + x + "," + y + ")");
                    }

                    @Override
                    public void onBottomSheetDragMove(String elementType, int x, int y) {
                        // معالجة الحركة في Bottom Sheet
                    }

                    @Override
                    public void onBottomSheetDragEnd(String elementType, boolean success, String error, String containerId) {
                        android.util.Log.d("BottomSheetDrag", "Bottom sheet drag end: " + elementType + " - " + (success ? "SUCCESS" : "FAILED"));
                    }

                    @Override
                    public void onAutoPositioningAppliedFromJS(String elementType, String containerId, String positionJson, String propertiesJson) {
                        android.util.Log.d("BottomSheetDrag", "Auto-positioning from JS: " + elementType);
                    }
                });
                
                android.util.Log.d("BottomSheetDrag", "BottomSheetDragManager initialized successfully");
            } else {
                android.util.Log.w("BottomSheetDrag", "Failed to find required containers");
            }
            
        } catch (Exception e) {
            android.util.Log.e("BottomSheetDrag", "Error initializing BottomSheetDragManager: " + e.getMessage());
        }
    }

    /**
     * الحصول على WebView reference
     */
    public WebView getWebView() {
        return binding != null ? binding.canvasWebview : null;
    }

    /**
     * معالجة Bottom Sheet Drag Events من JavaScript
     */
    public void handleBottomSheetDragStart(String elementType, int x, int y) {
        runOnUiThread(() -> {
            Toast.makeText(this, "بدء سحب: " + elementType, Toast.LENGTH_SHORT).show();
        });
    }

    public void handleBottomSheetDragMove(String elementType, int x, int y) {
        // معالجة الحركة (يمكن تحسين الأداء هنا)
    }

    public void handleBottomSheetDragEnd(String elementType, boolean success, String error, String containerId) {
        runOnUiThread(() -> {
            if (success) {
                Toast.makeText(this, "تم إضافة " + elementType + " في " + containerId, Toast.LENGTH_LONG).show();
            } else {
                Toast.makeText(this, "فشل في إضافة " + elementType + ": " + error, Toast.LENGTH_LONG).show();
            }
        });
    }

    public void handleAutoPositioningAppliedFromJS(String elementType, String containerId, String positionJson, String propertiesJson) {
        android.util.Log.d("BottomSheetDrag", "Auto-positioning applied from JS");
        
        runOnUiThread(() -> {
            Toast.makeText(this, "تم تطبيق الموقع الذكي لـ " + elementType, Toast.LENGTH_SHORT).show();
        });
    }

    /**
     * الحصول على BottomSheetDragManager
     */
    public BottomSheetDragManager getBottomSheetDragManager() {
        return bottomSheetDragManager;
    }
}
