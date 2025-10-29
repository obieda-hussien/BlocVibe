package com.blocvibe.app;

import android.content.ClipData;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.blocvibe.app.databinding.ListItemPaletteBinding;
import java.util.List;

public class PaletteAdapter extends RecyclerView.Adapter<PaletteAdapter.PaletteViewHolder> {

    private List<ComponentItem> items;

    public PaletteAdapter(List<ComponentItem> items) {
        this.items = items;
    }

    @NonNull
    @Override
    public PaletteViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ListItemPaletteBinding binding = ListItemPaletteBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new PaletteViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull PaletteViewHolder holder, int position) {
        ComponentItem item = items.get(position);
        holder.bind(item);
    }

    @Override
    public int getItemCount() {
        return items.size();
    }

    static class PaletteViewHolder extends RecyclerView.ViewHolder {
        private ListItemPaletteBinding binding;

        public PaletteViewHolder(ListItemPaletteBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        public void bind(ComponentItem item) {
            binding.paletteItemText.setText(item.getName());
            
            // Set up long click listener for drag-and-drop
            binding.getRoot().setOnLongClickListener(v -> {
                ClipData.Item clipItem = new ClipData.Item(item.getHtmlTag());
                ClipData dragData = new ClipData("COMPONENT", new String[]{"text/plain"}, clipItem);
                View.DragShadowBuilder shadowBuilder = new View.DragShadowBuilder(v);
                v.startDragAndDrop(dragData, shadowBuilder, v, 0);
                return true;
            });
        }
    }
}
