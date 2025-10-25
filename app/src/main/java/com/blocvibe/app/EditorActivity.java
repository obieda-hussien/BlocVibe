package com.blocvibe.app;

import android.content.ClipData;
import android.content.Intent;
import android.os.Bundle;
import android.view.DragEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.view.View;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.activity.result.ActivityResult;
import androidx.activity.result.ActivityResultCallback;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import com.blocvibe.app.databinding.ActivityEditorBinding;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import com.google.android.material.snackbar.Snackbar;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class EditorActivity extends AppCompatActivity {

    private ActivityEditorBinding binding;
    private BottomSheetBehavior<com.google.android.material.card.MaterialCardView> bottomSheetBehavior;
    private Project currentProject;
    private AppDatabase db;
    private long currentProjectId;
    private StringBuilder htmlBuilder;
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

        // Initialize WebView
        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);

        // Load project data
        db.projectDao().getProjectById(currentProjectId).observe(this, project -> {
            if (project != null) {
                this.currentProject = project;
                this.htmlBuilder = new StringBuilder(project.htmlContent);
                if (getSupportActionBar() != null) {
                    getSupportActionBar().setTitle(project.name);
                }
                refreshWebView();
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
                            htmlBuilder.append(droppedHtml);
                            if (currentProject != null) {
                                currentProject.htmlContent = htmlBuilder.toString();
                                refreshWebView();
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


        // Register for activity result from CodeEditorActivity
        codeEditorResultLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            new ActivityResultCallback<ActivityResult>() {
                @Override
                public void onActivityResult(ActivityResult result) {
                    if (result.getResultCode() == RESULT_OK && result.getData() != null) {
                        Intent data = result.getData();
                        if (currentProject != null) {
                            currentProject.htmlContent = data.getStringExtra("HTML_RESULT");
                            currentProject.cssContent = data.getStringExtra("CSS_RESULT");
                            currentProject.jsContent = data.getStringExtra("JS_RESULT");
                            htmlBuilder = new StringBuilder(currentProject.htmlContent);
                            refreshWebView();
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
            refreshWebView();
            Snackbar.make(binding.getRoot(), "Preview refreshed", Snackbar.LENGTH_SHORT).show();
            return true;
        } else if (id == R.id.action_view_code) {
            if (currentProject != null) {
                Intent intent = new Intent(this, CodeEditorActivity.class);
                intent.putExtra("HTML", currentProject.htmlContent);
                intent.putExtra("CSS", currentProject.cssContent);
                intent.putExtra("JS", currentProject.jsContent);
                codeEditorResultLauncher.launch(intent);
            }
            return true;
        }
        
        return super.onOptionsItemSelected(item);
    }

    private void refreshWebView() {
        if (currentProject == null) return;
        
        String fullHtml = "<html><head><style>" + 
            currentProject.cssContent + 
            "</style></head><body>" + 
            currentProject.htmlContent + 
            "<script>" + 
            currentProject.jsContent + 
            "</script></body></html>";
        
        binding.canvasWebview.loadDataWithBaseURL(null, fullHtml, "text/html", "UTF-8", null);
    }

    private void saveProject() {
        if (currentProject == null) return;
        
        currentProject.lastModified = System.currentTimeMillis();
        executorService.execute(() -> {
            db.projectDao().updateProject(currentProject);
            runOnUiThread(() -> {
                Snackbar.make(binding.getRoot(), "Project Saved", Snackbar.LENGTH_SHORT).show();
            });
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
