package com.blocvibe.app;

import android.content.Intent;
import android.os.Bundle;
import android.view.Menu;
import android.view.MenuItem;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.Observer;
import com.blocvibe.app.databinding.ActivityMainBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;
    private ProjectAdapter adapter;
    private AppDatabase db;
    private ExecutorService executorService;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Set up toolbar
        setSupportActionBar(binding.mainToolbar);

        // Initialize database and executor
        db = AppDatabase.getInstance(this);
        executorService = Executors.newSingleThreadExecutor();

        // Set up RecyclerView
        adapter = new ProjectAdapter(new ArrayList<>(), new ProjectAdapter.OnProjectClickListener() {
            @Override
            public void onProjectClick(Project project) {
                openEditor(project.id);
            }

            @Override
            public void onProjectMenuClick(Project project) {
                Toast.makeText(MainActivity.this, "Menu for: " + project.getName(), 
                        Toast.LENGTH_SHORT).show();
            }
        });
        binding.projectsRecyclerView.setAdapter(adapter);

        // Observe projects from database
        db.projectDao().getAllProjects().observe(this, new Observer<List<Project>>() {
            @Override
            public void onChanged(List<Project> projects) {
                adapter.updateProjects(projects);
            }
        });

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
                        createNewProject(projectName);
                    } else {
                        Toast.makeText(MainActivity.this, "Project name cannot be empty", 
                                Toast.LENGTH_SHORT).show();
                    }
                })
                .setNegativeButton(R.string.cancel, null)
                .show();
    }

    private void createNewProject(String projectName) {
        executorService.execute(() -> {
            Project newProject = new Project();
            newProject.name = projectName;
            newProject.htmlContent = "<h1>New Project</h1>";
            newProject.cssContent = "/* Add your CSS here */";
            newProject.jsContent = "// Add your JavaScript here";
            newProject.lastModified = System.currentTimeMillis();
            
            long newProjectId = db.projectDao().insertProject(newProject);
            
            runOnUiThread(() -> openEditor(newProjectId));
        });
    }

    private void openEditor(long projectId) {
        Intent intent = new Intent(this, EditorActivity.class);
        intent.putExtra("PROJECT_ID", projectId);
        startActivity(intent);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        executorService.shutdown();
    }
}
