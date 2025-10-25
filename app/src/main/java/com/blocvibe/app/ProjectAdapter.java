package com.blocvibe.app;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageButton;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.blocvibe.app.databinding.ListItemProjectBinding;
import java.util.List;

public class ProjectAdapter extends RecyclerView.Adapter<ProjectAdapter.ProjectViewHolder> {

    private List<Project> projects;
    private OnProjectClickListener listener;

    public interface OnProjectClickListener {
        void onProjectClick(Project project);
        void onProjectMenuClick(Project project);
    }

    public ProjectAdapter(List<Project> projects, OnProjectClickListener listener) {
        this.projects = projects;
        this.listener = listener;
    }

    @NonNull
    @Override
    public ProjectViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ListItemProjectBinding binding = ListItemProjectBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ProjectViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ProjectViewHolder holder, int position) {
        Project project = projects.get(position);
        holder.bind(project, listener);
    }

    @Override
    public int getItemCount() {
        return projects.size();
    }

    static class ProjectViewHolder extends RecyclerView.ViewHolder {
        private ListItemProjectBinding binding;

        public ProjectViewHolder(ListItemProjectBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        public void bind(Project project, OnProjectClickListener listener) {
            binding.projectNameText.setText(project.getName());
            binding.projectModifiedText.setText(project.getLastModified());
            
            binding.getRoot().setOnClickListener(v -> {
                if (listener != null) {
                    listener.onProjectClick(project);
                }
            });
            
            binding.projectMenuButton.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onProjectMenuClick(project);
                }
            });
        }
    }
}
