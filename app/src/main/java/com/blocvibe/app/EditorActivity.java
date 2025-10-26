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
                                // Get drop coordinates
                                float x = event.getX();
                                float y = event.getY();
                                
                                // Convert Android DP coordinates to WebView's CSS pixels
                                float density = binding.canvasWebview.getResources().getDisplayMetrics().density;
                                float cssX = x / density;
                                float cssY = y / density;
                                
                                // Call JavaScript function to handle the drop intelligently
                                String jsCall = String.format("javascript:handleAndroidDrop('%s', %f, %f);", tag, cssX, cssY);
                                binding.canvasWebview.evaluateJavascript(jsCall, null);
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
            // Tell JS to clear highlight
            binding.canvasWebview.evaluateJavascript("javascript:highlightElement(null);", null);
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

        // 2. Build the comprehensive JS script with Sortable.js integration
        String jsInterfaceScript = 
            // INJECT SORTABLE.JS LIBRARY
            "<script>" + SortableJsProvider.SORTABLE_JS_MINIFIED + "</script>" +
            
            // INJECT OUR HELPER SCRIPT
            "<script>" +
            "   let currentSelectedId = null;" +
            
            // --- A. Initialize Sortable on all containers ---
            "   function initializeSortable() {" +
            "       const containers = document.querySelectorAll('body, div, .container');" +
            "       containers.forEach(container => {" +
            "           if (container._sortable) return;" + // Don't re-initialize
            "           container._sortable = new Sortable(container, {" +
            "               group: 'shared'," + // Allows nesting!
            "               animation: 150," +
            "               fallbackOnBody: true," +
            "               swapThreshold: 0.65," +
            "               onEnd: function (evt) {" + // Reordering existing element
            "                   sendDomUpdate();" +
            "               }," +
            "               onAdd: function (evt) {" + // Element dropped from another list (nesting)
            "                   sendDomUpdate();" +
            "               }" +
            "           });" +
            "       });" +
            "   }" +
            
            // --- B. Handle new element dropped from Android Palette ---
            "   function handleAndroidDrop(tag, x, y) {" +
            "       const newElement = document.createElement(tag);" +
            "       const newId = 'bloc-' + Math.random().toString(36).substr(2, 8);" +
            "       newElement.setAttribute('id', newId);" +
            "       if(tag === 'button') { newElement.innerText = 'Click Me'; }" +
            "       if(tag === 'p') { newElement.innerText = 'Lorem ipsum dolor sit amet.'; }" +
            "       if(tag === 'h2') { newElement.innerText = 'Heading'; }" +
            "       if(tag === 'a') { newElement.innerText = 'Link'; newElement.href = '#'; }" +
            "       if(tag === 'img') { newElement.src = 'https://via.placeholder.com/150'; newElement.alt = 'placeholder'; }" +
            "       if(tag === 'div') { newElement.innerText = 'Container'; newElement.style.padding = '10px'; newElement.style.border = '1px solid #ccc'; }" +
            
            "       const target = document.elementFromPoint(x, y) || document.body;" +
            "       if (target.tagName === 'BODY' || target.classList.contains('container') || target.tagName === 'DIV') {" +
            "           target.appendChild(newElement);" + // Drop inside
            "       } else {" +
            "           target.parentNode.insertBefore(newElement, target.nextSibling);" + // Drop after
            "       }" +
            "       initializeSortable();" + // Make the new element (and its children) draggable
            "       sendDomUpdate();" + // Sync with Java
            "   }" +
            
            // --- C. Handle element selection/highlighting ---
            "   function highlightElement(elementId) {" +
            "       if (currentSelectedId) {" +
            "           const oldSelected = document.getElementById(currentSelectedId);" +
            "           if (oldSelected) { oldSelected.style.outline = 'none'; }" +
            "       }" +
            "       if (elementId) {" +
            "           const newSelected = document.getElementById(elementId);" +
            "           if (newSelected) { newSelected.style.outline = '2px dashed #0D6EFD'; }" +
            "           currentSelectedId = elementId;" +
            "       }" +
            "   }" +
            
            // --- D. Recursive function to build JSON from the live DOM ---
            "   function buildModel(element) {" +
            "       let children = [];" +
            "       for (const child of element.children) {" +
            "           if (child.id && child.id.startsWith('bloc-')) {" + // Only process our elements
            "               children.push(buildModel(child));" +
            "           }" +
            "       }" +
            "       let styleMap = {};" + // Convert style attribute to map
            "       if(element.style) {" +
            "           for(let i=0; i < element.style.length; i++) {" +
            "               const key = element.style[i];" +
            "               styleMap[key] = element.style[key];" +
            "           }" +
            "       }" +
            "       let attrMap = {};" + // Get attributes
            "       for (const attr of element.attributes) {" +
            "           if(attr.name !== 'style') { attrMap[attr.name] = attr.value; }" +
            "       }" +
            "       return {" +
            "           elementId: element.id," +
            "           tag: element.tagName.toLowerCase()," +
            "           textContent: (element.children.length === 0 && element.tagName !== 'IMG') ? element.innerText : null," +
            "           styles: styleMap," +
            "           attributes: attrMap," +
            "           children: children" +
            "       };" +
            "   }" +
            
            // --- E. Main sync function (JS -> Java) ---
            "   function sendDomUpdate() {" +
            "       let model = [];" +
            "       for (const el of document.body.children) {" +
            "           if (el.id && el.id.startsWith('bloc-')) {" +
            "               model.push(buildModel(el));" +
            "           }" +
            "       }" +
            "       AndroidBridge.onDomUpdated(JSON.stringify(model));" +
            "   }" +
            
            // --- F. Initialization ---
            "   document.addEventListener('DOMContentLoaded', function() {" +
            "       initializeSortable();" +
            "       document.body.addEventListener('click', (e) => {" +
            "           e.preventDefault();" +
            "           e.stopPropagation();" +
            "           let target = e.target;" +
            "           while(target && (!target.id || !target.id.startsWith('bloc-'))) {" + // Find parent
            "               target = target.parentNode;" +
            "               if (target === document.body) { target = null; break; }" +
            "           }" +
            "           if (target && target.id) {" +
            "               AndroidBridge.onElementSelected(target.id);" +
            "           } else {" +
            "               AndroidBridge.onElementSelected(null);" + // Clicked on body
            "           }" +
            "       }, true);" + // Use capture phase
            "   });" +
            "</script>";

        // 3. Combine and load
        String fullHtml = "<html><head><style>" +
                          "   body { min-height: 100vh; }" + // Ensure body is droppable
                          "   [style*='outline'] { box-shadow: 0 0 5px #0D6EFD; }" + // Better highlight
                          "   .sortable-ghost { opacity: 0.4; background: #C8E6C9; }" + // Ghost class
                          currentProject.cssContent + 
                          "</style></head>" +
                          "<body>" + generatedHtml + "</body>" + jsInterfaceScript + "</html>";

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
    
    /**
     * Called by WebAppInterface when the DOM is updated in JavaScript
     * This receives the entire updated element tree from the WebView
     */
    public void handleDomUpdate(String elementsJson) {
        if (elementsJson == null || elementsJson.isEmpty()) return;
        
        try {
            // Update our Java data model from JSON
            Type type = new TypeToken<ArrayList<BlocElement>>(){}.getType();
            this.elementTree = gson.fromJson(elementsJson, type);
            
            // Save the new structure to the database (in background)
            saveProject();
        } catch (Exception e) {
            Toast.makeText(this, "Error updating DOM: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    public void handleElementSelection(String elementId) {
        if (elementId == null) {
            currentSelectedElement = null;
            binding.bottomSheetPalette.editorFlipper.setDisplayedChild(0); // Show palette
            // Tell JS to clear highlight
            binding.canvasWebview.evaluateJavascript("javascript:highlightElement(null);", null);
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

            // 3. Tell JS to highlight this element
            String jsCall = "javascript:highlightElement('" + currentSelectedElement.elementId + "');";
            binding.canvasWebview.evaluateJavascript(jsCall, null);
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
        Toast.makeText(this, "Page loaded", Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
