package com.blocvibe.app;

import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.WebView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.blocvibe.app.databinding.ActivityEditorBinding;
import com.google.android.material.bottomsheet.BottomSheetBehavior;
import java.util.Arrays;
import java.util.List;

public class EditorActivity extends AppCompatActivity {

    private ActivityEditorBinding binding;
    private BottomSheetBehavior<com.google.android.material.card.MaterialCardView> bottomSheetBehavior;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityEditorBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Get project name from intent
        String projectName = getIntent().getStringExtra("project_name");
        if (projectName == null) {
            projectName = "My Project";
        }

        // Set up toolbar
        setSupportActionBar(binding.editorToolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
            getSupportActionBar().setTitle(getString(R.string.editing, projectName));
        }

        // Initialize WebView
        binding.canvasWebview.getSettings().setJavaScriptEnabled(true);
        binding.canvasWebview.loadData(
                "<html><body style='margin:0; padding:20px; font-family: sans-serif;'>" +
                "<h1 style='color: #6750A4;'>Welcome to BlocVibe</h1>" +
                "<p>Start building your web page by dragging components from the palette below.</p>" +
                "</body></html>",
                "text/html", "UTF-8");

        // Initialize Bottom Sheet
        bottomSheetBehavior = BottomSheetBehavior.from(binding.bottomSheetPalette.getRoot());
        bottomSheetBehavior.setState(BottomSheetBehavior.STATE_COLLAPSED);

        // Set up palette RecyclerView
        List<String> paletteItems = Arrays.asList(
                "Button", "TextView", "ImageView", "EditText", "Card", "Container"
        );
        PaletteAdapter paletteAdapter = new PaletteAdapter(paletteItems);
        binding.bottomSheetPalette.paletteRecyclerView.setAdapter(paletteAdapter);
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
            Toast.makeText(this, "Project saved", Toast.LENGTH_SHORT).show();
            return true;
        } else if (id == R.id.action_run) {
            Toast.makeText(this, "Running preview...", Toast.LENGTH_SHORT).show();
            return true;
        } else if (id == R.id.action_view_code) {
            Toast.makeText(this, "View code", Toast.LENGTH_SHORT).show();
            return true;
        }
        
        return super.onOptionsItemSelected(item);
    }
}
