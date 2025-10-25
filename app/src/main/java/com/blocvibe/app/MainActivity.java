package com.blocvibe.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.blocvibe.app.databinding.ActivityMainBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import java.util.ArrayList;
import java.util.List;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;
    private ProjectAdapter adapter;
    private List<Project> projects;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Set up toolbar
        setSupportActionBar(binding.mainToolbar);

        // Initialize sample projects
        projects = new ArrayList<>();
        projects.add(new Project("My First Website", "Last modified: 2 hours ago"));
        projects.add(new Project("Portfolio Page", "Last modified: Yesterday"));
        projects.add(new Project("Landing Page", "Last modified: 3 days ago"));
        projects.add(new Project("Blog Template", "Last modified: 1 week ago"));

        // Set up RecyclerView
        adapter = new ProjectAdapter(projects, new ProjectAdapter.OnProjectClickListener() {
            @Override
            public void onProjectClick(Project project) {
                openEditor(project.getName());
            }

            @Override
            public void onProjectMenuClick(Project project) {
                Toast.makeText(MainActivity.this, "Menu for: " + project.getName(), 
                        Toast.LENGTH_SHORT).show();
            }
        });
        binding.projectsRecyclerView.setAdapter(adapter);

        // Set up FAB
        binding.fabNewProject.setOnClickListener(v -> showNewProjectDialog());
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        getMenuInflater().inflate(R.menu.menu_main, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == R.id.action_settings) {
            Toast.makeText(this, "Settings clicked", Toast.LENGTH_SHORT).show();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void showNewProjectDialog() {
        EditText input = new EditText(this);
        input.setHint(R.string.enter_project_name);
        input.setPadding(48, 24, 48, 24);

        new MaterialAlertDialogBuilder(this)
                .setTitle(R.string.new_project)
                .setView(input)
                .setPositiveButton(R.string.create, (dialog, which) -> {
                    String projectName = input.getText().toString().trim();
                    if (!projectName.isEmpty()) {
                        openEditor(projectName);
                    } else {
                        Toast.makeText(MainActivity.this, "Project name cannot be empty", 
                                Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void openEditor(String projectName) {
        Intent intent = new Intent(this, EditorActivity.class);
        intent.putExtra("project_name", projectName);
        startActivity(intent);
    }
}
