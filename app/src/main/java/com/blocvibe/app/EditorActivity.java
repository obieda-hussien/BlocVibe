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
    
    // Track if WebView page is loaded
    private boolean isWebViewReady = false;
    private boolean isJavaScriptReady = false;

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
        binding.canvasWebview.setVerticalScrollBarEnabled(true);
        binding.canvasWebview.setHorizontalScrollBarEnabled(true);
        
        // CRITICAL: Allow JavaScript to handle touch events
        binding.canvasWebview.requestDisallowInterceptTouchEvent(false);
        binding.canvasWebview.getSettings().setSupportZoom(false);
        binding.canvasWebview.getSettings().setBuiltInZoomControls(false);
        binding.canvasWebview.getSettings().setAllowFileAccess(true);
        binding.canvasWebview.getSettings().setAllowContentAccess(true);
        
        // Override touch event handling to allow JavaScript drag system
        binding.canvasWebview.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, android.view.MotionEvent event) {
                // Let WebView handle touch events normally, but log for debugging
                android.util.Log.d("EditorActivity", "Touch event: " + event.getAction() + " at (" + event.getX() + ", " + event.getY() + ")");
                
                // Return false to let WebView process the touch event
                // This allows JavaScript to receive touch events
                return false;
            }
        });
        
        binding.canvasWebview.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");
        
        // Enable WebView debugging for console.log
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }
        
        // Set WebChromeClient to capture console logs
        binding.canvasWebview.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                android.util.Log.d("WebView", consoleMessage.message() + " -- From line " +
                        consoleMessage.lineNumber() + " of " + consoleMessage.sourceId());
                return true;
            }
        });
        
        // Set WebViewClient to track page load
        binding.canvasWebview.setWebViewClient(new android.webkit.WebViewClient() {
            @Override
            public void onPageFinished(android.webkit.WebView view, String url) {
                super.onPageFinished(view, url);
                isWebViewReady = true;
                android.util.Log.d("EditorActivity", "WebView page finished loading");
                // Ping JavaScript to confirm it's ready
                view.evaluateJavascript("javascript:if(typeof AndroidBridge !== 'undefined' && typeof window.handleAndroidDrop === 'function') { AndroidBridge.confirmReady(); }", null);
            }
        });

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
                                
                                // Log the drop for debugging
                                android.util.Log.d("EditorActivity", "Dropping element: " + tag + " at (" + cssX + ", " + cssY + ")");
                                
                                // Use a robust approach: try JavaScript first, then fallback to Java
                                final String finalTag = tag;
                                
                                // Attempt 1: Try JavaScript with aggressive retry
                                Runnable dropAction = new Runnable() {
                                    int retries = 0;
                                    final int MAX_RETRIES = 20; // Increased from 10
                                    final int RETRY_DELAY_MS = 50; // Reduced from 100ms for faster response
                                    
                                    @Override
                                    public void run() {
                                        // Check if we should retry
                                        if (!isJavaScriptReady && retries < MAX_RETRIES) {
                                            retries++;
                                            android.util.Log.d("EditorActivity", "JS not ready, retry " + retries + "/" + MAX_RETRIES);
                                            binding.canvasWebview.postDelayed(this, RETRY_DELAY_MS);
                                            return;
                                        }
                                        
                                        // If JavaScript is ready, use it for intelligent placement
                                        if (isJavaScriptReady) {
                                            String jsCall = String.format(
                                                "(function() {" +
                                                "  try {" +
                                                "    if(typeof window.handleAndroidDrop === 'function') {" +
                                                "      window.handleAndroidDrop('%s', %f, %f);" +
                                                "      return 'SUCCESS';" +
                                                "    } else {" +
                                                "      return 'FUNCTION_NOT_FOUND';" +
                                                "    }" +
                                                "  } catch(e) {" +
                                                "    console.error('Drop error:', e);" +
                                                "    return 'ERROR: ' + e.message;" +
                                                "  }" +
                                                "})();", 
                                                finalTag, cssX, cssY);
                                            
                                            binding.canvasWebview.evaluateJavascript(jsCall, result -> {
                                                android.util.Log.d("EditorActivity", "JS drop result: " + result);
                                                // If JavaScript failed, use fallback
                                                if (result == null || !result.contains("SUCCESS")) {
                                                    android.util.Log.w("EditorActivity", "JS drop failed, using fallback");
                                                    fallbackAddElement(finalTag);
                                                }
                                            });
                                        } else {
                                            // JavaScript not ready after retries, use fallback
                                            android.util.Log.w("EditorActivity", "JS not ready after " + MAX_RETRIES + " retries, using fallback");
                                            fallbackAddElement(finalTag);
                                        }
                                    }
                                };
                                
                                // Start the drop action
                                binding.canvasWebview.post(dropAction);
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
        TextInputEditText editHeight = propertiesView.findViewById(R.id.edit_height);
        TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);
        TextInputEditText editFontSize = propertiesView.findViewById(R.id.edit_font_size);
        TextInputEditText editBackground = propertiesView.findViewById(R.id.edit_background);
        TextInputEditText editPadding = propertiesView.findViewById(R.id.edit_padding);
        TextInputEditText editMargin = propertiesView.findViewById(R.id.edit_margin);
        TextInputEditText editTranslateX = propertiesView.findViewById(R.id.edit_translate_x);
        TextInputEditText editTranslateY = propertiesView.findViewById(R.id.edit_translate_y);
        TextInputEditText editScaleX = propertiesView.findViewById(R.id.edit_scale_x);
        TextInputEditText editScaleY = propertiesView.findViewById(R.id.edit_scale_y);
        TextInputEditText editRotate = propertiesView.findViewById(R.id.edit_rotate);
        TextInputEditText editFlexDirection = propertiesView.findViewById(R.id.edit_flex_direction);
        TextInputEditText editJustifyContent = propertiesView.findViewById(R.id.edit_justify_content);
        TextInputEditText editAlignItems = propertiesView.findViewById(R.id.edit_align_items);
        MaterialButton backBtn = propertiesView.findViewById(R.id.back_to_palette_btn);

        // Add TextWatchers for attributes
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
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').className = '" + className + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        // Add TextWatchers for style properties
        editWidth.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("width", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.width = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editHeight.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("height", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.height = '" + value + "';";
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
                    String value = s.toString();
                    currentSelectedElement.styles.put("color", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.color = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editFontSize.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("fontSize", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.fontSize = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editBackground.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("background", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.background = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editPadding.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("padding", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.padding = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editMargin.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("margin", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.margin = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        // Add TextWatchers for flex layout properties
        editFlexDirection.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("display", "flex");
                    currentSelectedElement.styles.put("flexDirection", value);
                    String js = "var el = document.getElementById('" + currentSelectedElement.elementId + "');" +
                               "if(el) { el.style.display = 'flex'; el.style.flexDirection = '" + value + "'; }";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editJustifyContent.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("justifyContent", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.justifyContent = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });
        
        editAlignItems.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    String value = s.toString();
                    currentSelectedElement.styles.put("alignItems", value);
                    String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.alignItems = '" + value + "';";
                    binding.canvasWebview.evaluateJavascript(js, null);
                }
            }
        });

        // Add TextWatchers for transform properties
        TextWatcher transformWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {}
            @Override
            public void afterTextChanged(Editable s) {
                if (currentSelectedElement != null) {
                    updateTransform();
                }
            }
        };
        
        editTranslateX.addTextChangedListener(transformWatcher);
        editTranslateY.addTextChangedListener(transformWatcher);
        editScaleX.addTextChangedListener(transformWatcher);
        editScaleY.addTextChangedListener(transformWatcher);
        editRotate.addTextChangedListener(transformWatcher);

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
        
        // Reset ready flags
        isWebViewReady = false;
        isJavaScriptReady = false;

        // 1. Build HTML from the elementTree
        String generatedHtml = buildHtmlRecursive(elementTree);

        // 2. Build the comprehensive JS script with Sortable.js integration
        String jsInterfaceScript = 
            // INJECT SORTABLE.JS LIBRARY
            "<script>" + SortableJsProvider.SORTABLE_JS_MINIFIED + "</script>" +
            
            // INJECT OUR HELPER SCRIPT - Custom Drag System (Sketchware-inspired)
            "<script>" +
            "   var currentSelectedId = null;" +
            "   var draggedElement = null;" +
            "   var touchStartY = 0;" +
            "   var touchStartX = 0;" +
            "   var isDragging = false;" +
            "   var dragThreshold = 10;" + // Pixels to move before drag starts
            
            // --- A. Simple custom drag system without Sortable.js ---
            "   window.initializeDragSystem = function() {" +
            "       console.log('Initializing custom drag system');" +
            "       " +
            "       // Get all bloc elements" +
            "       const elements = document.querySelectorAll('[id^=\"bloc-\"]');" +
            "       " +
            "       elements.forEach(element => {" +
            "           // Add drag handle visual indicator" +
            "           if (!element.querySelector('.drag-handle')) {" +
            "               const handle = document.createElement('div');" +
            "               handle.className = 'drag-handle';" +
            "               handle.innerHTML = '⋮⋮';" + // Three dots handle
            "               handle.style.cssText = 'position:absolute;top:0;right:0;padding:5px;background:#2196F3;color:white;cursor:move;font-size:16px;z-index:1000;';" +
            "               element.style.position = 'relative';" +
            "               element.insertBefore(handle, element.firstChild);" +
            "           }" +
            "           " +
            "           const handle = element.querySelector('.drag-handle');" +
            "           " +
            "           // Touch start" +
            "           handle.addEventListener('touchstart', function(e) {" +
            "               e.preventDefault(); // CRITICAL: prevent default touch behavior" +
            "               e.stopPropagation();" +
            "               const touch = e.touches[0];" +
            "               touchStartX = touch.clientX;" +
            "               touchStartY = touch.clientY;" +
            "               draggedElement = element;" +
            "               element.style.opacity = '0.7';" +
            "               handle.style.background = '#1976D2'; // Visual feedback on touch" +
            "               console.log('Touch start on:', element.id, 'at', touchStartX, touchStartY);" +
            "           }, {passive: false});" + // MUST be false to allow preventDefault!
            "           " +
            "           // Touch move" +
            "           handle.addEventListener('touchmove', function(e) {" +
            "               if (!draggedElement) {" +
            "                   console.log('Touch move but no dragged element');" +
            "                   return;" +
            "               }" +
            "               e.preventDefault();" +
            "               e.stopPropagation();" +
            "               " +
            "               const touch = e.touches[0];" +
            "               const deltaX = touch.clientX - touchStartX;" +
            "               const deltaY = touch.clientY - touchStartY;" +
            "               " +
            "               // Start dragging if moved beyond threshold" +
            "               if (!isDragging && (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold)) {" +
            "                   isDragging = true;" +
            "                   draggedElement.classList.add('dragging');" +
            "                   console.log('Drag started - delta:', deltaX, deltaY);" +
            "               }" +
            "               " +
            "               if (isDragging) {" +
            "                   // Visual feedback - move element" +
            "                   draggedElement.style.transform = 'translate(' + deltaX + 'px, ' + deltaY + 'px) rotate(2deg)';" +
            "                   draggedElement.style.zIndex = '9999';" +
            "                   console.log('Dragging element, delta:', deltaX, deltaY);" +
            "                   " +
            "                   // Find element under touch" +
            "                   draggedElement.style.pointerEvents = 'none';" +
            "                   const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);" +
            "                   draggedElement.style.pointerEvents = 'auto';" +
            "                   " +
            "                   // Highlight drop target" +
            "                   document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));" +
            "                   if (elementBelow && elementBelow.id && elementBelow.id.startsWith('bloc-')) {" +
            "                       elementBelow.classList.add('drop-target');" +
            "                       console.log('Drop target:', elementBelow.id);" +
            "                   }" +
            "               }" +
            "           }, {passive: false});" +
            "           " +
            "           // Touch end" +
            "           handle.addEventListener('touchend', function(e) {" +
            "               if (!draggedElement) {" +
            "                   console.log('Touch end but no dragged element');" +
            "                   return;" +
            "               }" +
            "               e.preventDefault();" +
            "               e.stopPropagation();" +
            "               " +
            "               handle.style.background = '#2196F3'; // Reset handle color" +
            "               console.log('Touch end, isDragging:', isDragging);" +
            "               " +
            "               if (isDragging) {" +
            "                   const touch = e.changedTouches[0];" +
            "                   console.log('Touch ended at:', touch.clientX, touch.clientY);" +
            "                   " +
            "                   // Reset visual" +
            "                   draggedElement.style.transform = '';" +
            "                   draggedElement.style.zIndex = '';" +
            "                   draggedElement.style.opacity = '1';" +
            "                   draggedElement.classList.remove('dragging');" +
            "                   " +
            "                   // Find drop target" +
            "                   draggedElement.style.pointerEvents = 'none';" +
            "                   const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);" +
            "                   draggedElement.style.pointerEvents = 'auto';" +
            "                   " +
            "                   console.log('Drop target:', dropTarget ? dropTarget.tagName + ' #' + dropTarget.id : 'none');" +
            "                   " +
            "                   // Perform the drop" +
            "                   if (dropTarget && dropTarget !== draggedElement) {" +
            "                       if (dropTarget.id && dropTarget.id.startsWith('bloc-')) {" +
            "                           // Drop on another bloc element" +
            "                           if (dropTarget.tagName === 'DIV') {" +
            "                               // Drop inside container" +
            "                               dropTarget.appendChild(draggedElement);" +
            "                               console.log('✓ Dropped inside:', dropTarget.id);" +
            "                           } else {" +
            "                               // Drop after element" +
            "                               dropTarget.parentNode.insertBefore(draggedElement, dropTarget.nextSibling);" +
            "                               console.log('✓ Dropped after:', dropTarget.id);" +
            "                           }" +
            "                           " +
            "                           // Re-initialize drag system" +
            "                           setTimeout(initializeDragSystem, 100);" +
            "                           " +
            "                           // Sync to Java" +
            "                           sendDomUpdate();" +
            "                       } else if (dropTarget === document.body || dropTarget.parentNode === document.body) {" +
            "                           // Drop on body" +
            "                           document.body.appendChild(draggedElement);" +
            "                           console.log('Dropped on body');" +
            "                           setTimeout(initializeDragSystem, 100);" +
            "                           sendDomUpdate();" +
            "                       }" +
            "                   }" +
            "                   " +
            "                   // Clean up" +
            "                   document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));" +
            "               }" +
            "               " +
            "               draggedElement = null;" +
            "               isDragging = false;" +
            "           }, {passive: false});" +
            "       });" +
            "       " +
            "       console.log('Drag system initialized on', elements.length, 'elements');" +
            "   };" +
            
            // --- B. Handle new element dropped from Android Palette ---
            "   window.handleAndroidDrop = function(tag, x, y) {" +
            "       console.log('handleAndroidDrop called with tag:', tag, 'x:', x, 'y:', y);" +
            "       const newElement = document.createElement(tag);" +
            "       const newId = 'bloc-' + Math.random().toString(36).substr(2, 8);" +
            "       newElement.setAttribute('id', newId);" +
            "       if(tag === 'button') { newElement.innerText = 'Click Me'; }" +
            "       else if(tag === 'p') { newElement.innerText = 'Lorem ipsum dolor sit amet.'; }" +
            "       else if(tag === 'h2') { newElement.innerText = 'Heading'; }" +
            "       else if(tag === 'a') { newElement.innerText = 'Link'; newElement.href = '#'; }" +
            "       else if(tag === 'img') { newElement.src = 'https://via.placeholder.com/150'; newElement.alt = 'placeholder'; }" +
            "       else if(tag === 'div') { newElement.innerText = 'Container'; newElement.style.padding = '10px'; newElement.style.border = '1px solid #ccc'; newElement.style.minHeight = '50px'; }" +
            
            "       const target = document.elementFromPoint(x, y) || document.body;" +
            "       console.log('Target element:', target.tagName, target.id);" +
            "       if (target.tagName === 'BODY' || target.classList.contains('container') || target.tagName === 'DIV') {" +
            "           target.appendChild(newElement);" + // Drop inside
            "       } else {" +
            "           target.parentNode.insertBefore(newElement, target.nextSibling);" + // Drop after
            "       }" +
            "       initializeDragSystem();" + // Make the new element draggable
            "       sendDomUpdate();" + // Sync with Java
            "   };" +
            
            // --- C. Handle element selection/highlighting ---
            "   window.highlightElement = function(elementId) {" +
            "       if (currentSelectedId) {" +
            "           const oldSelected = document.getElementById(currentSelectedId);" +
            "           if (oldSelected) { oldSelected.style.outline = 'none'; }" +
            "       }" +
            "       if (elementId) {" +
            "           const newSelected = document.getElementById(elementId);" +
            "           if (newSelected) { newSelected.style.outline = '2px dashed #0D6EFD'; }" +
            "           currentSelectedId = elementId;" +
            "       }" +
            "   };" +
            
            // --- D. Recursive function to build JSON from the live DOM ---
            "   window.buildModel = function(element) {" +
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
            "   };" +
            
            // --- E. Main sync function (JS -> Java) ---
            "   window.sendDomUpdate = function() {" +
            "       let model = [];" +
            "       for (const el of document.body.children) {" +
            "           if (el.id && el.id.startsWith('bloc-')) {" +
            "               model.push(buildModel(el));" +
            "           }" +
            "       }" +
            "       AndroidBridge.onDomUpdated(JSON.stringify(model));" +
            "   };" +
            
            // --- F. Initialization - Run immediately and on DOMContentLoaded ---
            "   (function() {" +
            "       let isDragging = false;" +
            "       let dragStartTime = 0;" +
            "       " +
            "       function init() {" +
            "           initializeDragSystem();" +
            "           " +
            "           // Track dragging state to prevent click during drag" +
            "           document.body.addEventListener('mousedown', (e) => {" +
            "               isDragging = false;" +
            "               dragStartTime = Date.now();" +
            "           });" +
            "           " +
            "           document.body.addEventListener('mousemove', (e) => {" +
            "               if (Date.now() - dragStartTime > 100) {" + // If moving for > 100ms, it's a drag
            "                   isDragging = true;" +
            "               }" +
            "           });" +
            "           " +
            "           document.body.addEventListener('click', (e) => {" +
            "               // Don't select if we were dragging" +
            "               if (isDragging) {" +
            "                   console.log('Click ignored - was dragging');" +
            "                   isDragging = false;" +
            "                   return;" +
            "               }" +
            "               " +
            "               e.preventDefault();" +
            "               e.stopPropagation();" +
            "               let target = e.target;" +
            "               while(target && (!target.id || !target.id.startsWith('bloc-'))) {" + // Find parent
            "                   target = target.parentNode;" +
            "                   if (target === document.body) { target = null; break; }" +
            "               }" +
            "               if (target && target.id) {" +
            "                   console.log('Element selected:', target.id);" +
            "                   AndroidBridge.onElementSelected(target.id);" +
            "               } else {" +
            "                   AndroidBridge.onElementSelected(null);" + // Clicked on body
            "               }" +
            "           }, true);" + // Use capture phase
            "           " +
            "           // Set up MutationObserver to auto-initialize drag system on new elements" +
            "           const observer = new MutationObserver(function(mutations) {" +
            "               let shouldReinitialize = false;" +
            "               mutations.forEach(function(mutation) {" +
            "                   if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {" +
            "                       mutation.addedNodes.forEach(function(node) {" +
            "                           if (node.nodeType === 1 && node.id && node.id.startsWith('bloc-')) {" + // Bloc element added
            "                               shouldReinitialize = true;" +
            "                           }" +
            "                       });" +
            "                   }" +
            "               });" +
            "               if (shouldReinitialize) {" +
            "                   console.log('DOM changed, reinitializing drag system');" +
            "                   setTimeout(initializeDragSystem, 50);" + // Small delay to let DOM settle
            "               }" +
            "           });" +
            "           observer.observe(document.body, { childList: true, subtree: true });" +
            "           " +
            "           // Confirm to Java that JavaScript is ready" +
            "           setTimeout(function() {" +
            "               if (typeof AndroidBridge !== 'undefined' && typeof AndroidBridge.confirmReady === 'function') {" +
            "                   AndroidBridge.confirmReady();" +
            "                   console.log('JavaScript confirmed ready to Android');" +
            "               }" +
            "           }, 100);" + // Small delay to ensure everything is initialized
            "       }" +
            "       if (document.readyState === 'loading') {" +
            "           document.addEventListener('DOMContentLoaded', init);" +
            "       } else {" +
            "           init();" +
            "       }" +
            "   })();" +
            "</script>";

        // 3. Combine and load
        String fullHtml = "<html><head>" +
                          "<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'>" +
                          "<style>" +
                          "   * { -webkit-tap-highlight-color: transparent; }" +
                          "   body { " +
                          "       min-height: 100vh; " +
                          "       -webkit-user-select: none; " +
                          "       -webkit-touch-callout: none; " +
                          "   }" +
                          "   [id^='bloc-'] { " +
                          "       position: relative; " +
                          "       min-height: 30px; " +
                          "       min-width: 30px; " +
                          "       margin: 5px 0; " +
                          "       transition: all 0.2s ease;" +
                          "   }" +
                          "   [id^='bloc-']:hover { " +
                          "       outline: 1px dashed #999; " +
                          "   }" +
                          "   [style*='outline'] { box-shadow: 0 0 5px #0D6EFD; }" +
                          "   .drag-handle { " +
                          "       position: absolute !important; " +
                          "       top: 0 !important; " +
                          "       right: 0 !important; " +
                          "       padding: 10px 15px !important; " + // Larger touch target
                          "       background: #2196F3 !important; " +
                          "       color: white !important; " +
                          "       cursor: move !important; " +
                          "       font-size: 20px !important; " + // Larger text
                          "       font-weight: bold !important; " +
                          "       z-index: 1000 !important; " +
                          "       border-radius: 0 0 0 8px !important; " +
                          "       user-select: none !important; " +
                          "       -webkit-user-select: none !important; " +
                          "       touch-action: none !important; " + // CRITICAL for touch drag
                          "       min-width: 50px !important; " + // Minimum touch size
                          "       min-height: 40px !important; " +
                          "       display: flex !important; " +
                          "       align-items: center !important; " +
                          "       justify-content: center !important; " +
                          "   }" +
                          "   .drag-handle:active { " +
                          "       background: #1976D2 !important; " +
                          "   }" +
                          "   .dragging { " +
                          "       opacity: 0.7 !important; " +
                          "       z-index: 9999 !important; " +
                          "       box-shadow: 0 5px 15px rgba(0,0,0,0.3) !important; " +
                          "   }" +
                          "   .drop-target { " +
                          "       background: #E8F5E9 !important; " +
                          "       border: 2px dashed #4CAF50 !important; " +
                          "   }" +
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
            TextView containerLabel = propertiesView.findViewById(R.id.container_properties_label);
            
            TextInputEditText editId = propertiesView.findViewById(R.id.edit_id);
            TextInputEditText editClass = propertiesView.findViewById(R.id.edit_class);
            TextInputEditText editWidth = propertiesView.findViewById(R.id.edit_width);
            TextInputEditText editHeight = propertiesView.findViewById(R.id.edit_height);
            TextInputEditText editColor = propertiesView.findViewById(R.id.edit_color);
            TextInputEditText editFontSize = propertiesView.findViewById(R.id.edit_font_size);
            TextInputEditText editBackground = propertiesView.findViewById(R.id.edit_background);
            TextInputEditText editPadding = propertiesView.findViewById(R.id.edit_padding);
            TextInputEditText editMargin = propertiesView.findViewById(R.id.edit_margin);
            TextInputEditText editTranslateX = propertiesView.findViewById(R.id.edit_translate_x);
            TextInputEditText editTranslateY = propertiesView.findViewById(R.id.edit_translate_y);
            TextInputEditText editScaleX = propertiesView.findViewById(R.id.edit_scale_x);
            TextInputEditText editScaleY = propertiesView.findViewById(R.id.edit_scale_y);
            TextInputEditText editRotate = propertiesView.findViewById(R.id.edit_rotate);
            TextInputEditText editFlexDirection = propertiesView.findViewById(R.id.edit_flex_direction);
            TextInputEditText editJustifyContent = propertiesView.findViewById(R.id.edit_justify_content);
            TextInputEditText editAlignItems = propertiesView.findViewById(R.id.edit_align_items);

            label.setText("Editing: <" + currentSelectedElement.tag + ">");
            
            // Show/hide container properties based on element type
            boolean isContainer = currentSelectedElement.tag.equals("div");
            containerLabel.setVisibility(isContainer ? View.VISIBLE : View.GONE);
            propertiesView.findViewById(R.id.edit_flex_direction_layout).setVisibility(isContainer ? View.VISIBLE : View.GONE);
            propertiesView.findViewById(R.id.edit_justify_content_layout).setVisibility(isContainer ? View.VISIBLE : View.GONE);
            propertiesView.findViewById(R.id.edit_align_items_layout).setVisibility(isContainer ? View.VISIBLE : View.GONE);
            
            // Populate attribute fields
            editId.setText(currentSelectedElement.attributes.get("id"));
            editClass.setText(currentSelectedElement.attributes.get("class"));
            
            // Populate style fields
            editWidth.setText(currentSelectedElement.styles.get("width"));
            editHeight.setText(currentSelectedElement.styles.get("height"));
            editColor.setText(currentSelectedElement.styles.get("color"));
            editFontSize.setText(currentSelectedElement.styles.get("fontSize"));
            editBackground.setText(currentSelectedElement.styles.get("background"));
            editPadding.setText(currentSelectedElement.styles.get("padding"));
            editMargin.setText(currentSelectedElement.styles.get("margin"));
            editFlexDirection.setText(currentSelectedElement.styles.get("flexDirection"));
            editJustifyContent.setText(currentSelectedElement.styles.get("justifyContent"));
            editAlignItems.setText(currentSelectedElement.styles.get("alignItems"));
            
            // Parse transform property if exists
            String transform = currentSelectedElement.styles.get("transform");
            if (transform != null && !transform.isEmpty()) {
                parseTransform(transform, editTranslateX, editTranslateY, editScaleX, editScaleY, editRotate);
            } else {
                editTranslateX.setText("");
                editTranslateY.setText("");
                editScaleX.setText("");
                editScaleY.setText("");
                editRotate.setText("");
            }

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
    
    /**
     * Parse transform CSS property into individual components
     */
    private void parseTransform(String transform, TextInputEditText editTranslateX, 
                                TextInputEditText editTranslateY, TextInputEditText editScaleX,
                                TextInputEditText editScaleY, TextInputEditText editRotate) {
        // Parse transform string like "translateX(10px) translateY(20px) scaleX(1.5) scaleY(1.2) rotate(45deg)"
        if (transform.contains("translateX(")) {
            String val = transform.substring(transform.indexOf("translateX(") + 11);
            val = val.substring(0, val.indexOf(")"));
            editTranslateX.setText(val);
        }
        if (transform.contains("translateY(")) {
            String val = transform.substring(transform.indexOf("translateY(") + 11);
            val = val.substring(0, val.indexOf(")"));
            editTranslateY.setText(val);
        }
        if (transform.contains("scaleX(")) {
            String val = transform.substring(transform.indexOf("scaleX(") + 7);
            val = val.substring(0, val.indexOf(")"));
            editScaleX.setText(val);
        }
        if (transform.contains("scaleY(")) {
            String val = transform.substring(transform.indexOf("scaleY(") + 7);
            val = val.substring(0, val.indexOf(")"));
            editScaleY.setText(val);
        }
        if (transform.contains("rotate(")) {
            String val = transform.substring(transform.indexOf("rotate(") + 7);
            val = val.substring(0, val.indexOf(")"));
            editRotate.setText(val);
        }
    }
    
    /**
     * Update transform property from individual components
     */
    private void updateTransform() {
        if (currentSelectedElement == null) return;
        
        View propertiesView = binding.bottomSheetPalette.editorFlipper.getChildAt(1);
        TextInputEditText editTranslateX = propertiesView.findViewById(R.id.edit_translate_x);
        TextInputEditText editTranslateY = propertiesView.findViewById(R.id.edit_translate_y);
        TextInputEditText editScaleX = propertiesView.findViewById(R.id.edit_scale_x);
        TextInputEditText editScaleY = propertiesView.findViewById(R.id.edit_scale_y);
        TextInputEditText editRotate = propertiesView.findViewById(R.id.edit_rotate);
        
        StringBuilder transform = new StringBuilder();
        
        String translateX = editTranslateX.getText().toString();
        if (!translateX.isEmpty()) {
            transform.append("translateX(").append(translateX).append(") ");
        }
        
        String translateY = editTranslateY.getText().toString();
        if (!translateY.isEmpty()) {
            transform.append("translateY(").append(translateY).append(") ");
        }
        
        String scaleX = editScaleX.getText().toString();
        if (!scaleX.isEmpty()) {
            transform.append("scaleX(").append(scaleX).append(") ");
        }
        
        String scaleY = editScaleY.getText().toString();
        if (!scaleY.isEmpty()) {
            transform.append("scaleY(").append(scaleY).append(") ");
        }
        
        String rotate = editRotate.getText().toString();
        if (!rotate.isEmpty()) {
            transform.append("rotate(").append(rotate).append(")");
        }
        
        String transformValue = transform.toString().trim();
        currentSelectedElement.styles.put("transform", transformValue);
        
        // Update WebView
        String js = "document.getElementById('" + currentSelectedElement.elementId + "').style.transform = '" + transformValue + "';";
        binding.canvasWebview.evaluateJavascript(js, null);
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
    
    /**
     * Called from JavaScript bridge when JS functions are confirmed ready
     */
    public void onJavaScriptReady() {
        isJavaScriptReady = true;
        android.util.Log.d("EditorActivity", "JavaScript confirmed ready");
    }
    
    /**
     * Fallback method to add element directly to Java model when JavaScript fails
     */
    private void fallbackAddElement(String tag) {
        android.util.Log.d("EditorActivity", "Using fallback to add element: " + tag);
        runOnUiThread(() -> {
            // Create new element
            BlocElement newElement = new BlocElement(tag);
            
            // Set default content based on tag
            switch (tag) {
                case "button":
                    newElement.textContent = "Click Me";
                    break;
                case "p":
                    newElement.textContent = "Lorem ipsum dolor sit amet.";
                    break;
                case "h2":
                    newElement.textContent = "Heading";
                    break;
                case "a":
                    newElement.textContent = "Link";
                    newElement.attributes.put("href", "#");
                    break;
                case "img":
                    newElement.attributes.put("src", "https://via.placeholder.com/150");
                    newElement.attributes.put("alt", "placeholder");
                    break;
                case "div":
                    newElement.textContent = "Container";
                    newElement.styles.put("padding", "10px");
                    newElement.styles.put("border", "1px solid #ccc");
                    newElement.styles.put("min-height", "50px");
                    break;
            }
            
            // Add to element tree
            if (elementTree == null) {
                elementTree = new ArrayList<>();
            }
            elementTree.add(newElement);
            
            // Save and re-render
            saveProject();
            renderCanvas();
            
            // Show confirmation
            Toast.makeText(this, "Element added: " + tag, Toast.LENGTH_SHORT).show();
            android.util.Log.d("EditorActivity", "Element added via fallback, re-rendering canvas");
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
