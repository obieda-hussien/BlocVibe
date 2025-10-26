package com.blocvibe.app;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import androidx.activity.OnBackPressedCallback;
import androidx.appcompat.app.AppCompatActivity;
import com.blocvibe.app.databinding.ActivityCodeEditorBinding;
import com.google.android.material.tabs.TabLayout;

public class CodeEditorActivity extends AppCompatActivity {

    private ActivityCodeEditorBinding binding;
    private String htmlContent;
    private String cssContent;
    private String jsContent;
    private int currentTab = 0; // 0 = HTML, 1 = CSS, 2 = JS

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityCodeEditorBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Set up toolbar
        setSupportActionBar(binding.codeToolbar);
        if (getSupportActionBar() != null) {
            getSupportActionBar().setDisplayHomeAsUpEnabled(true);
        }

        // Get content from intent
        htmlContent = getIntent().getStringExtra("HTML");
        cssContent = getIntent().getStringExtra("CSS");
        jsContent = getIntent().getStringExtra("JS");

        if (htmlContent == null) htmlContent = "";
        if (cssContent == null) cssContent = "";
        if (jsContent == null) jsContent = "";

        // Set initial content (HTML tab)
        binding.codeEditText.setText(htmlContent);

        // Set up tab listener
        binding.codeTabs.addOnTabSelectedListener(new TabLayout.OnTabSelectedListener() {
            @Override
            public void onTabSelected(TabLayout.Tab tab) {
                // Save current content before switching
                saveCurrentTabContent();
                
                // Switch to new tab
                currentTab = tab.getPosition();
                switch (currentTab) {
                    case 0: // HTML
                        binding.codeEditText.setText(htmlContent);
                        break;
                    case 1: // CSS
                        binding.codeEditText.setText(cssContent);
                        break;
                    case 2: // JS
                        binding.codeEditText.setText(jsContent);
                        break;
                }
            }

            @Override
            public void onTabUnselected(TabLayout.Tab tab) {
                // Nothing needed here
            }

            @Override
            public void onTabReselected(TabLayout.Tab tab) {
                // Nothing needed here
            }
        });

        // Handle back button press
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                saveAndFinish();
            }
        });
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_code_editor, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        int id = item.getItemId();
        
        if (id == android.R.id.home) {
            saveAndFinish();
            return true;
        } else if (id == R.id.action_save_code) {
            saveAndFinish();
            return true;
        }
        
        return super.onOptionsItemSelected(item);
    }

    private void saveCurrentTabContent() {
        String currentContent = binding.codeEditText.getText().toString();
        switch (currentTab) {
            case 0:
                htmlContent = currentContent;
                break;
            case 1:
                cssContent = currentContent;
                break;
            case 2:
                jsContent = currentContent;
                break;
        }
    }

    private void saveAndFinish() {
        // Save current tab content
        saveCurrentTabContent();
        
        // Create result intent
        Intent resultIntent = new Intent();
        resultIntent.putExtra("HTML_RESULT", htmlContent);
        resultIntent.putExtra("CSS_RESULT", cssContent);
        resultIntent.putExtra("JS_RESULT", jsContent);
        
        setResult(Activity.RESULT_OK, resultIntent);
        finish();
    }
}
