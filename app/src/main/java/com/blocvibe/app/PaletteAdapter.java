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

        holder.itemView.setOnLongClickListener(view -> {
            // 1. Create the ClipData
            ClipData.Item clipItem = new ClipData.Item(item.getHtmlTag()); // e.g., "div"
            String[] mimeTypes = { "text/plain" };

            // CRITICAL FIX: Add the "COMPONENT" label here
            ClipData dragData = new ClipData(
                "COMPONENT", // This is the Label. Our OnDragListener checks for this.
                mimeTypes,
                clipItem
            );

            // 2. Create the shadow
            View.DragShadowBuilder shadowBuilder = new View.DragShadowBuilder(view);

            // 3. Start the drag
            view.startDragAndDrop(dragData, shadowBuilder, view, 0);

            return true;
        });
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
        }
    }
}
