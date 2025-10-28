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

    private List<BlocElement> elementTree;
    private BlocElement currentSelectedElement;
    private Gson gson = new Gson();

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

        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);
        binding.canvasWebview.getSettings().setDomStorageEnabled(true);
        binding.canvasWebview.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

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

        binding.canvasWebview.setOnDragListener((v, event) -> {
            final int action = event.getAction();
            String clipDataTag = "Unknown";

            // Try to get clip description (for logging)
            if (event.getClipDescription() != null && event.getClipDescription().getLabel() != null) {
                clipDataTag = event.getClipDescription().getLabel().toString();
            }

            switch (action) {
                case DragEvent.ACTION_DRAG_STARTED:
                    android.util.Log.d("BlocVibeDrag", "ACTION_DRAG_STARTED. Clip: " + clipDataTag);
                    // CRITICAL: We must return true here if we accept the drop.
                    // We accept if the clip is our "COMPONENT".
                    if ("COMPONENT".equals(clipDataTag)) {
                        android.util.Log.d("BlocVibeDrag", "-> Accepting drop.");
                        return true; // Yes, we can accept this type of data
                    } else {
                        android.util.Log.d("BlocVibeDrag", "-> Rejecting drop (ClipData mismatch).");
                        return false; // Rejecting
                    }

                case DragEvent.ACTION_DRAG_ENTERED:
                    android.util.Log.d("BlocVibeDrag", "ACTION_DRAG_ENTERED");
                    // Optional: Show a visual cue in WebView (e.g., change border)
                    // binding.canvasWebview.evaluateJavascript("document.body.style.border='2px solid #0D6EFD';", null);
                    return true; // Required to receive ACTION_DROP

                case DragEvent.ACTION_DRAG_LOCATION:
                    // Log.d("BlocVibeDrag", "ACTION_DRAG_LOCATION: X=" + event.getX() + ", Y=" + event.getY());
                    return true; // Required

                case DragEvent.ACTION_DRAG_EXITED:
                    android.util.Log.d("BlocVibeDrag", "ACTION_DRAG_EXITED");
                    // Optional: Remove visual cue
                    // binding.canvasWebview.evaluateJavascript("document.body.style.border='none';", null);
                    return true;

                case DragEvent.ACTION_DROP:
                    android.util.Log.d("BlocVibeDrag", "ACTION_DROP DETECTED!");

                    // 1. Get the tag (e.g., "div", "h2")
                    String tag = event.getClipData().getItemAt(0).getText().toString();

                    // 2. Get drop coordinates
                    float x = event.getX();
                    float y = event.getY();

                    // 3. Convert Android DP to WebView CSS pixels
                    float density = binding.canvasWebview.getResources().getDisplayMetrics().density;
                    float cssX = x / density;
                    float cssY = y / density;

                    // 4. Call the JS function
                    String jsCall = String.format("javascript:handleAndroidDrop('%s', %f, %f);", tag, cssX, cssY);
                    android.util.Log.d("BlocVibeDrag", "-> Calling JS: " + jsCall);
                    binding.canvasWebview.evaluateJavascript(jsCall, null);

                    return true; // We handled the drop!

                case DragEvent.ACTION_DRAG_ENDED:
                    android.util.Log.d("BlocVibeDrag", "ACTION_DRAG_ENDED");
                    // Optional: Remove visual cue
                    // binding.canvasWebview.evaluateJavascript("document.body.style.border='none';", null);
                    return true;

                default:
                    android.util.Log.d("BlocVibeDrag", "Unknown drag action: " + action);
                    return false;
            }
        });

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

        setupPropertyEditors();
        setupCodeEditorResultLauncher();
    }

    private void setupPropertyEditors() {
        View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
        TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
        TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
        TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
        TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);
        MaterialButton backBtn = propertiesView.findViewById(R.id.back_to_palette_btn);

        editId.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String newId = s.toString();
                    // Note: Changing the ID in JS is complex as it's the main selector.
                    // For now, we update the model. A full re-render would be needed to reflect in JS.
                    currentSelectedElement.attributes.put("id", newId);
                    // To prevent breaking selectors, we might need to tell JS to update its internal ID
                    // and then re-highlight. For now, we'll just save.
                }
            }
        });

        editClass.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override public void afterTextChanged(Editable s) {
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
            @Override public void afterTextChanged(Editable s) {
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
            @Override public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String color = s.toString();
                    currentSelectedElement.styles.put("color", color);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.color = '" + color + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        backBtn.setOnClickListener(v -> {
            handleElementSelection(null); // Deselect
        });
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
                        saveProject();
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
                String generatedHtml = buildHtmlRecursive(elementTree);
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

        String generatedHtml = buildHtmlRecursive(elementTree);

        String jsInterfaceScript =
            "<script>" +
            "   let currentSelectedId = null;" +
            "   function handleAndroidDrop(tag, x, y) {" +
            "       console.log('JS: handleAndroidDrop received: ' + tag + ' at ' + x + ',' + y);" + // <-- ADD THIS LINE
            "       const newElement = document.createElement(tag);" +
            "       const newId = 'bloc-' + Math.random().toString(36).substr(2, 8);" +
            "       newElement.setAttribute('id', newId);" +
            "       if(tag === 'button') { newElement.innerText = 'Click Me'; }" +
            "       else if(tag === 'p') { newElement.innerText = 'Lorem ipsum...'; }" +
            "       else if(tag === 'h2') { newElement.innerText = 'Heading'; }" +
            "       else if(tag === 'a') { newElement.innerText = 'Link'; newElement.href='#'; }" +
            "       else if(tag === 'img') { newElement.src = 'https://via.placeholder.com/150'; }" +
            "       const target = document.elementFromPoint(x, y) || document.body;" +
            "       const droppableTarget = target.closest('body, div, .container');" +
            "       if (droppableTarget) {" +
            "           droppableTarget.appendChild(newElement);" +
            "       } else {" +
            "           document.body.appendChild(newElement);" +
            "       }" +
            "       sendDomUpdate();" +
            "   }" +
            "   function highlightElement(elementId) {" +
            "       if (currentSelectedId) {" +
            "           const oldSelected = document.getElementById(currentSelectedId);" +
            "           if (oldSelected) { oldSelected.style.outline = 'none'; }" +
            "       }" +
            "       if (elementId) {" +
            "           const newSelected = document.getElementById(elementId);" +
            "           if (newSelected) { newSelected.style.outline = '2px dashed #0D6EFD'; }" +
            "           currentSelectedId = elementId;" +
            "       } else { currentSelectedId = null; }" +
            "   }" +
            "   function buildModel(element) {" +
            "       let children = [];" +
            "       for (const child of element.children) {" +
            "           if (child.id && child.id.startsWith('bloc-')) {" +
            "               children.push(buildModel(child));" +
            "           }" +
            "       }" +
            "       let styleMap = {};" +
            "       for(let i=0; i < element.style.length; i++) {" +
            "           const key = element.style[i];" +
            "           styleMap[key] = element.style[key];" +
            "       }" +
            "       let attrMap = {};" +
            "       for (const attr of element.attributes) {" +
            "           if(attr.name !== 'style' && attr.name !== 'id') { attrMap[attr.name] = attr.value; }" +
            "       }" +
            "       return {" +
            "           elementId: element.id," +
            "           tag: element.tagName.toLowerCase()," +
            "           textContent: (element.children.length === 0 && !['img', 'div', 'body'].includes(element.tagName.toLowerCase())) ? element.innerText : ''," +
            "           styles: styleMap," +
            "           attributes: attrMap," +
            "           children: children" +
            "       };" +
            "   }" +
            "   function sendDomUpdate() {" +
            "       let model = [];" +
            "       for (const el of document.body.children) {" +
            "           if (el.id && el.id.startsWith('bloc-')) {" +
            "               model.push(buildModel(el));" +
            "           }" +
            "       }" +
            "       AndroidBridge.onDomUpdated(JSON.stringify(model));" +
            "   }" +
            "   document.addEventListener('DOMContentLoaded', function() {" +
            "       initCustomDragDrop();" +
            "       document.body.addEventListener('click', (e) => {" +
            "           let target = e.target.closest('[id^=\"bloc-\"]');" +
            "           if (target && target.id) {" +
            "               AndroidBridge.onElementSelected(target.id);" +
            "           } else {" +
            "               AndroidBridge.onElementSelected(null);" +
            "           }" +
            "       }, true);" +
            "   });" +
            "   let draggedElement = null;" +
            "   let ghostElement = null;" +
            "   let dropIndicator = null;" +
            "   let longPressTimer = null;" +
            "   let startX, startY;" +
            "   function initCustomDragDrop() {" +
            "       const body = document.body;" +
            "       body.addEventListener('touchstart', handleTouchStart, { passive: false });" +
            "       body.addEventListener('touchmove', handleTouchMove, { passive: false });" +
            "       body.addEventListener('touchend', handleTouchEnd, { passive: false });" +
            "       dropIndicator = document.createElement('div');" +
            "       dropIndicator.className = 'drop-indicator';" +
            "       document.body.appendChild(dropIndicator);" +
            "   }" +
            "   function handleTouchStart(e) {" +
            "       const target = e.target.closest('[id^=\"bloc-\"]');" +
            "       if (!target) return;" +
            "       e.preventDefault();" +
            "       const touch = e.touches[0];" +
            "       startX = touch.clientX;" +
            "       startY = touch.clientY;" +
            "       longPressTimer = setTimeout(() => {" +
            "           draggedElement = target;" +
            "           createGhostElement(draggedElement, touch);" +
            "       }, 500);" +
            "   }" +
            "   function handleTouchMove(e) {" +
            "       if (!draggedElement) {" +
            "           clearTimeout(longPressTimer);" +
            "           return;" +
            "       }" +
            "       e.preventDefault();" +
            "       const touch = e.touches[0];" +
            "       if (ghostElement) {" +
            "           ghostElement.style.top = (touch.clientY - 30) + 'px';" +
            "           ghostElement.style.left = (touch.clientX - (ghostElement.offsetWidth / 2)) + 'px';" +
            "       }" +
            "       updateDropIndicator(touch.clientX, touch.clientY);" +
            "   }" +
            "   function handleTouchEnd(e) {" +
            "       clearTimeout(longPressTimer);" +
            "       if (!draggedElement) return;" +
            "       if (dropIndicator.style.display === 'block') {" +
            "           const targetElement = dropIndicator.nextSibling;" +
            "           if (targetElement) {" +
            "               dropIndicator.parentNode.insertBefore(draggedElement, targetElement);" +
            "           } else {" +
            "               dropIndicator.parentNode.appendChild(draggedElement);" +
            "           }" +
            "           sendDomUpdate();" +
            "       }" +
            "       cleanupDragDrop();" +
            "   }" +
            "   function createGhostElement(original, touch) {" +
            "       ghostElement = original.cloneNode(true);" +
            "       ghostElement.classList.add('ghost-element');" +
            "       document.body.appendChild(ghostElement);" +
            "       ghostElement.style.top = (touch.clientY - 30) + 'px';" +
            "       ghostElement.style.left = (touch.clientX - (ghostElement.offsetWidth / 2)) + 'px';" +
            "       original.style.opacity = '0.4';" +
            "   }" +
            "   function updateDropIndicator(x, y) {" +
            "       const dropTarget = getDropTarget(x, y);" +
            "       if (dropTarget) {" +
            "           const rect = dropTarget.element.getBoundingClientRect();" +
            "           if (dropTarget.position === 'before') {" +
            "               dropIndicator.style.top = rect.top + 'px';" +
            "           } else {" +
            "               dropIndicator.style.top = rect.bottom + 'px';" +
            "           }" +
            "           dropIndicator.style.left = rect.left + 'px';" +
            "           dropIndicator.style.width = rect.width + 'px';" +
            "           dropIndicator.style.display = 'block';" +
            "       } else {" +
            "           dropIndicator.style.display = 'none';" +
            "       }" +
            "   }" +
            "   function getDropTarget(x, y) {" +
            "       ghostElement.style.display = 'none';" +
            "       const elementUnder = document.elementFromPoint(x, y);" +
            "       ghostElement.style.display = '';" +
            "       const closestBloc = elementUnder ? elementUnder.closest('[id^=\"bloc-\"]') : null;" +
            "       if (closestBloc && closestBloc !== draggedElement) {" +
            "           const rect = closestBloc.getBoundingClientRect();" +
            "           const isAfter = y > rect.top + rect.height / 2;" +
            "           return { element: closestBloc, position: isAfter ? 'after' : 'before' };" +
            "       }" +
            "       return null;" +
            "   }" +
            "   function cleanupDragDrop() {" +
            "       if (draggedElement) {" +
            "           draggedElement.style.opacity = '1';" +
            "       }" +
            "       if (ghostElement && ghostElement.parentNode) {" +
            "           ghostElement.parentNode.removeChild(ghostElement);" +
            "       }" +
            "       dropIndicator.style.display = 'none';" +
            "       draggedElement = null;" +
            "       ghostElement = null;" +
            "   }" +
            "</script>";

        String fullHtml = "<html><head><style>" +
                          "body { min-height: 100vh; font-family: sans-serif; }" +
                          "[id^='bloc-'] { padding: 4px; }" +
                          "img { max-width: 100%; height: auto; }" +
                          ".ghost-element { opacity: 0.7; position: absolute; pointer-events: none; z-index: 1000; }" +
                          ".drop-indicator { position: absolute; height: 2px; background-color: #0D6EFD; z-index: 1001; display: none; }" +
                          (currentProject.cssContent != null ? currentProject.cssContent : "") +
                          "</style></head>" +
                          "<body>" + generatedHtml + "</body>" + jsInterfaceScript + "</html>";

        binding.canvasWebview.loadDataWithBaseURL(null, fullHtml, "text/html", "UTF-8", null);
    }

    private String buildHtmlRecursive(List<BlocElement> elements) {
        if (elements == null) return "";
        StringBuilder html = new StringBuilder();
        for (BlocElement el : elements) {
            html.append(el.toHtml());
        }
        return html.toString();
    }

    private void saveProject() {
        if (currentProject == null) return;
        currentProject.elementsJson = gson.toJson(elementTree);
        currentProject.lastModified = System.currentTimeMillis();
        executorService.execute(() -> {
            db.projectDao().updateProject(currentProject);
            runOnUiThread(() -> Snackbar.make(binding.getRoot(), "Project Saved", Snackbar.LENGTH_SHORT).show());
        });
    }

    public void handleDomUpdate(String elementsJson) {
        if (elementsJson == null || elementsJson.isEmpty()) return;
        Type type = new TypeToken<ArrayList<BlocElement>>(){}.getType();
        this.elementTree = gson.fromJson(elementsJson, type);
        saveProject();
    }

    public void handleElementSelection(String elementId) {
        // Tell JS to highlight/unhighlight
        String jsCall = "javascript:highlightElement(" + (elementId != null ? "'" + elementId + "'" : "null") + ");";
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
            TextView label = propertiesView.findViewById(R.id.selected_element_label);
            TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
            TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
            TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
            TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);

            label.setText("Editing: <" + currentSelectedElement.tag + ">");
            editId.setText(currentSelectedElement.elementId); // Use elementId which is the real ID
            editClass.setText(currentSelectedElement.attributes.get("class"));
            editWidth.setText(currentSelectedElement.styles.get("width"));
            editColor.setText(currentSelectedElement.styles.get("color"));
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
}
