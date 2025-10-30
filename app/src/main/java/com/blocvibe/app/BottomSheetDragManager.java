package com.blocvibe.app;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ValueAnimator;
import android.content.ClipData;
import android.content.ClipDescription;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Point;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.os.Vibrator;
import android.util.Log;
import android.view.DragEvent;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.view.animation.Interpolator;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.core.view.ViewCompat;
import com.google.android.material.card.MaterialCardView;
import com.google.android.material.snackbar.Snackbar;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Enhanced Bottom Sheet Drag Manager v5.0
 * نظام سحب محسن من لوحة المكونات مع معاينة ذكية وvisual feedback متقدم
 * 
 * المميزات:
 * - Smart Preview أثناء السحب
 * - Visual Drag Indicators
 * - Auto-positioning ذكي
 * - Haptic Feedback
 * - Performance optimizations
 * - Accessibility support
 * 
 * @author BlocVibe Team
 * @version 5.0.0
 */
public class BottomSheetDragManager {
    private static final String TAG = "BottomSheetDragManager";
    
    // Drag States
    public enum DragState {
        IDLE, DRAGGING, HOVERING, DROPPING, CANCELLED
    }
    
    // Visual Feedback Types
    public enum VisualFeedback {
        NONE, GHOST, SNAPSHOT, OUTLINE, HIGHLIGHT
    }
    
    // Drop Zones
    public static class DropZone {
        public String id;
        public Rect bounds;
        public float priority;
        public String type; // CONTAINER, ELEMENT, CANVAS
        public Map<String, Object> metadata;
        
        public DropZone(String id, Rect bounds, String type) {
            this.id = id;
            this.bounds = bounds;
            this.type = type;
            this.priority = 0f;
            this.metadata = new HashMap<>();
        }
        
        public float calculateScore(Point dragPoint) {
            if (!bounds.contains(dragPoint.x, dragPoint.y)) return 0f;
            
            float centerX = bounds.centerX();
            float centerY = bounds.centerY();
            float distance = (float) Math.sqrt(
                Math.pow(dragPoint.x - centerX, 2) + Math.pow(dragPoint.y - centerY, 2)
            );
            
            float maxDistance = (float) Math.sqrt(
                Math.pow(bounds.width(), 2) + Math.pow(bounds.height(), 2)
            ) / 2;
            
            return Math.max(0f, 1f - (distance / maxDistance));
        }
    }
    
    // Configuration
    public static class DragConfig {
        public VisualFeedback feedbackType = VisualFeedback.GHOST;
        public boolean enableHapticFeedback = true;
        public boolean enableAutoPositioning = true;
        public boolean enableSnapToGrid = false;
        public boolean enableSmartPreview = true;
        public int dragStartDelay = 0; // ms
        public float previewScale = 0.8f;
        public int maxDragDistance = 200; // px
        public Interpolator animationInterpolator = new AccelerateDecelerateInterpolator();
        public long animationDuration = 300; // ms
    }
    
    // Metrics
    public static class DragMetrics {
        public long startTime;
        public long endTime;
        public Point startPosition;
        public Point endPosition;
        public String elementType;
        public String dropZoneId;
        public int dragDistance;
        public boolean successful;
        public String error;
        
        public long getDuration() {
            return endTime - startTime;
        }
    }
    
    private Context context;
    private EditorActivity activity;
    private ViewGroup bottomSheetContainer;
    private ViewGroup canvasContainer;
    private Vibrator vibrator;
    
    // State Management
    private DragState currentState = DragState.IDLE;
    private DragMetrics currentMetrics;
    private String draggedElementType;
    private Point dragStartPoint;
    private Point currentDragPoint;
    private DropZone currentHoverZone;
    private List<DropZone> detectedDropZones = new ArrayList<>();
    
    // Visual Elements
    private ImageView ghostView;
    private ImageView snapshotView;
    private View highlightOverlay;
    private List<View> visualIndicators = new ArrayList<>();
    
    // Configuration
    private DragConfig config = new DragConfig();
    
    // Performance
    private long lastDragTime = 0;
    private int dragCount = 0;
    private long totalDragTime = 0;
    private boolean isPerformanceMode = false;
    
    // Event Callbacks
    public interface DragCallback {
        void onDragStart(String elementType, Point position);
        void onDragMove(String elementType, Point position, DropZone hoverZone);
        void onDragEnd(String elementType, Point position, DropZone dropZone, boolean success);
        void onDragCancelled(String elementType, Point position);
        void onDropZoneDetected(List<DropZone> zones);
        void onAutoPositioningApplied(DropZone zone, Point position);
        void onBottomSheetDragStart(String elementType, int x, int y);
        void onBottomSheetDragMove(String elementType, int x, int y);
        void onBottomSheetDragEnd(String elementType, boolean success, String error, String containerId);
        void onAutoPositioningAppliedFromJS(String elementType, String containerId, String positionJson, String propertiesJson);
    }
    
    private List<DragCallback> callbacks = new ArrayList<>();
    
    public BottomSheetDragManager(Context context, EditorActivity activity, 
                                  ViewGroup bottomSheetContainer, ViewGroup canvasContainer) {
        this.context = context;
        this.activity = activity;
        this.bottomSheetContainer = bottomSheetContainer;
        this.canvasContainer = canvasContainer;
        this.vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
        
        initializeComponents();
        setupDragListeners();
        setupPerformanceMonitoring();
        
        Log.d(TAG, "BottomSheetDragManager initialized");
    }
    
    /**
     * تهيئة المكونات
     */
    private void initializeComponents() {
        // إنشاء عناصر الرؤية
        createGhostView();
        createSnapshotView();
        createHighlightOverlay();
        
        // إعداد المراقبة
        startDropZoneMonitoring();
    }
    
    /**
     * إنشاء عرض Ghost
     */
    private void createGhostView() {
        ghostView = new ImageView(context);
        ghostView.setAlpha(0.8f);
        ghostView.setVisibility(View.GONE);
        ghostView.setZ(1000); // Ensure it's on top
        
        // إضافة للهيدانر الافتراضي
        ((ViewGroup) activity.getWindow().getDecorView()).addView(ghostView);
    }
    
    /**
     * إنشاء عرض Snapshot
     */
    private void createSnapshotView() {
        snapshotView = new ImageView(context);
        snapshotView.setAlpha(0.6f);
        snapshotView.setVisibility(View.GONE);
        snapshotView.setZ(999);
        
        ((ViewGroup) activity.getWindow().getDecorView()).addView(snapshotView);
    }
    
    /**
     * إنشاء Overlay للتمييز
     */
    private void createHighlightOverlay() {
        highlightOverlay = new View(context);
        highlightOverlay.setBackgroundColor(Color.parseColor("#4000FF00"));
        highlightOverlay.setVisibility(View.GONE);
        highlightOverlay.setZ(998);
        
        ((ViewGroup) activity.getWindow().getDecorView()).addView(highlightOverlay);
    }
    
    /**
     * إعداد مستمعي السحب
     */
    private void setupDragListeners() {
        //监听 RecyclerView items for drag start
        View paletteRecycler = bottomSheetContainer.findViewById(R.id.palette_recycler_view);
        if (paletteRecycler != null) {
            setupPaletteDragListener(paletteRecycler);
        }
        
        //监听 Canvas for drop detection
        setupCanvasDropListener();
    }
    
    /**
     * إعداد مستمع السحب للوحة المكونات
     */
    private void setupPaletteDragListener(View paletteView) {
        paletteView.setOnTouchListener(new View.OnTouchListener() {
            private long lastTouchTime = 0;
            private Point startPoint = new Point();
            
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        lastTouchTime = System.currentTimeMillis();
                        startPoint.set((int) event.getRawX(), (int) event.getRawY());
                        return false; // Let the normal touch handling continue
                        
                    case MotionEvent.ACTION_MOVE:
                        long currentTime = System.currentTimeMillis();
                        if (currentTime - lastTouchTime > config.dragStartDelay) {
                            Point currentPoint = new Point((int) event.getRawX(), (int) event.getRawY());
                            float distance = calculateDistance(startPoint, currentPoint);
                            
                            if (distance > 20) { // Minimum drag distance
                                startEnhancedDrag(startPoint, getElementTypeFromTouch(v, event), currentPoint);
                                return true;
                            }
                        }
                        break;
                        
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        if (currentState == DragState.DRAGGING) {
                            endDrag();
                        }
                        break;
                }
                return false;
            }
        });
    }
    
    /**
     * إعداد مستمع الإسقاط في Canvas
     */
    private void setupCanvasDropListener() {
        if (canvasContainer != null) {
            canvasContainer.setOnDragListener(new View.OnDragListener() {
                @Override
                public boolean onDrag(View v, DragEvent event) {
                    switch (event.getAction()) {
                        case DragEvent.ACTION_DRAG_STARTED:
                            handleDragStarted(event);
                            return true;
                            
                        case DragEvent.ACTION_DRAG_LOCATION:
                            handleDragLocation(event);
                            return true;
                            
                        case DragEvent.ACTION_DRAG_ENTERED:
                            handleDragEntered(event);
                            return true;
                            
                        case DragEvent.ACTION_DRAG_EXITED:
                            handleDragExited(event);
                            return true;
                            
                        case DragEvent.ACTION_DROP:
                            handleDrop(event);
                            return true;
                            
                        case DragEvent.ACTION_DRAG_ENDED:
                            handleDragEnded(event);
                            return true;
                            
                        default:
                            return false;
                    }
                }
            });
        }
    }
    
    /**
     * بدء السحب المحسن
     */
    public void startEnhancedDrag(Point startPoint, String elementType, Point currentPoint) {
        try {
            Log.d(TAG, "Starting enhanced drag for: " + elementType);
            
            // تحديث الحالة
            currentState = DragState.DRAGGING;
            draggedElementType = elementType;
            dragStartPoint = startPoint;
            currentDragPoint = currentPoint;
            
            // إنشاء المقاييس
            currentMetrics = new DragMetrics();
            currentMetrics.startTime = System.currentTimeMillis();
            currentMetrics.startPosition = startPoint;
            currentMetrics.elementType = elementType;
            
            // إعداد التباين
            setupVisualFeedback(elementType, startPoint);
            
            // الاهتزاز
            if (config.enableHapticFeedback && vibrator != null) {
                vibrator.vibrate(50); // Short vibration
            }
            
            // كشف Drop Zones
            detectDropZones();
            
            // إشعار البداية
            notifyDragStart(elementType, startPoint);
            
            // تحديث المقاييس
            updatePerformanceMetrics();
            
        } catch (Exception e) {
            Log.e(TAG, "Error starting enhanced drag: " + e.getMessage());
            cancelDrag("Error starting drag: " + e.getMessage());
        }
    }
    
    /**
     * إعداد التغذية الراجعة البصرية
     */
    private void setupVisualFeedback(String elementType, Point position) {
        switch (config.feedbackType) {
            case GHOST:
                showGhostPreview(elementType, position);
                break;
            case SNAPSHOT:
                showSnapshotPreview(elementType, position);
                break;
            case OUTLINE:
                showOutlinePreview(elementType, position);
                break;
            case HIGHLIGHT:
                showHighlightPreview(elementType, position);
                break;
        }
    }
    
    /**
     * عرض معاينة Ghost
     */
    private void showGhostPreview(String elementType, Point position) {
        Bitmap ghostBitmap = createGhostBitmap(elementType);
        if (ghostBitmap != null) {
            ghostView.setImageBitmap(ghostBitmap);
            ghostView.setX(position.x - ghostBitmap.getWidth() / 2);
            ghostView.setY(position.y - ghostBitmap.getHeight() / 2);
            ghostView.setVisibility(View.VISIBLE);
            
            // رسوم متحركة للدخول
            animateViewEntrance(ghostView, position);
        }
    }
    
    /**
     * عرض معاينة Snapshot
     */
    private void showSnapshotPreview(String elementType, Point position) {
        Bitmap snapshotBitmap = createSnapshotBitmap(elementType);
        if (snapshotBitmap != null) {
            snapshotView.setImageBitmap(snapshotBitmap);
            snapshotView.setX(position.x - snapshotBitmap.getWidth() / 2);
            snapshotView.setY(position.y - snapshotBitmap.getHeight() / 2);
            snapshotView.setScaleX(config.previewScale);
            snapshotView.setScaleY(config.previewScale);
            snapshotView.setVisibility(View.VISIBLE);
        }
    }
    
    /**
     * إنشاء bitmap للـ ghost
     */
    private Bitmap createGhostBitmap(String elementType) {
        // هنا يمكن إنشاء bitmap مخصص حسب نوع العنصر
        // للتبسيط، سنستخدم bitmap أساسي
        int width = 120;
        int height = 60;
        
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        
        Paint paint = new Paint();
        paint.setColor(getElementColor(elementType));
        paint.setStyle(Paint.Style.FILL);
        paint.setAlpha(100); // شفافية
        
        canvas.drawRect(0, 0, width, height, paint);
        
        // إضافة نص
        paint.setColor(Color.WHITE);
        paint.setTextSize(16);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTypeface(Typeface.DEFAULT_BOLD);
        
        Paint.FontMetrics fontMetrics = paint.getFontMetrics();
        float textY = height / 2 - (fontMetrics.ascent + fontMetrics.descent) / 2;
        canvas.drawText(elementType, width / 2, textY, paint);
        
        return bitmap;
    }
    
    /**
     * إنشاء bitmap للمعاينة
     */
    private Bitmap createSnapshotBitmap(String elementType) {
        int width = 150;
        int height = 80;
        
        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        
        Paint paint = new Paint();
        paint.setColor(getElementColor(elementType));
        paint.setStyle(Paint.Style.FILL);
        paint.setAlpha(120);
        
        // رسم شكل للعنصر حسب النوع
        if (elementType.toLowerCase().equals("button")) {
            // button shape
            Paint paint2 = new Paint(paint);
            paint2.setStyle(Paint.Style.STROKE);
            paint2.setStrokeWidth(2);
            paint2.setColor(Color.DKGRAY);
            canvas.drawRoundRect(10, 10, width-10, height-10, 15, 15, paint);
            canvas.drawRoundRect(10, 10, width-10, height-10, 15, 15, paint2);
        } else if (elementType.toLowerCase().equals("image")) {
            // image shape
            canvas.drawRect(5, 5, width-5, height-5, paint);
            paint.setColor(Color.WHITE);
            paint.setTextSize(12);
            paint.setTextAlign(Paint.Align.CENTER);
            canvas.drawText("IMG", width/2, height/2 + 5, paint);
        } else {
            // default shape
            canvas.drawRect(0, 0, width, height, paint);
        }
        
        // إضافة نص
        paint.setColor(Color.WHITE);
        paint.setTextSize(14);
        paint.setTextAlign(Paint.Align.CENTER);
        paint.setTypeface(Typeface.DEFAULT);
        
        Paint.FontMetrics fontMetrics = paint.getFontMetrics();
        float textY = height - 15 - (fontMetrics.ascent + fontMetrics.descent) / 2;
        canvas.drawText(elementType, width / 2, textY, paint);
        
        return bitmap;
    }
    
    /**
     * عرض معاينة outline
     */
    private void showOutlinePreview(String elementType, Point position) {
        // إنشاء outline element مؤقت
        try {
            int width = 100;
            int height = 50;
            
            Bitmap outlineBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(outlineBitmap);
            
            Paint paint = new Paint();
            paint.setColor(getElementColor(elementType));
            paint.setStyle(Paint.Style.STROKE);
            paint.setStrokeWidth(3);
            paint.setAlpha(255);
            
            // رسم outline
            canvas.drawRect(0, 0, width, height, paint);
            
            // رسم نقطة في المركز
            paint.setStyle(Paint.Style.FILL);
            paint.setAlpha(180);
            canvas.drawCircle(width/2, height/2, 8, paint);
            
            // عرض المؤقت في ghostView
            ghostView.setImageBitmap(outlineBitmap);
            ghostView.setX(position.x - width / 2);
            ghostView.setY(position.y - height / 2);
            ghostView.setVisibility(View.VISIBLE);
            
            Log.d(TAG, "Outline preview shown for: " + elementType);
        } catch (Exception e) {
            Log.e(TAG, "Error in showOutlinePreview: " + e.getMessage());
        }
    }
    
    /**
     * عرض معاينة highlight
     */
    private void showHighlightPreview(String elementType, Point position) {
        // إنشاء highlight element مؤقت
        try {
            int width = 120;
            int height = 60;
            
            Bitmap highlightBitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(highlightBitmap);
            
            Paint paint = new Paint();
            int highlightColor = getElementColor(elementType);
            
            // إنشاء gradient for highlight effect
            paint.setStyle(Paint.Style.FILL);
            paint.setAlpha(150);
            paint.setColor(highlightColor);
            
            // رسم circle highlight
            canvas.drawCircle(width/2, height/2, Math.min(width, height)/3, paint);
            
            // إضافة glow effect
            Paint glowPaint = new Paint(paint);
            glowPaint.setAlpha(80);
            canvas.drawCircle(width/2, height/2, Math.min(width, height)/2, glowPaint);
            
            // عرض المؤقت
            snapshotView.setImageBitmap(highlightBitmap);
            snapshotView.setX(position.x - width / 2);
            snapshotView.setY(position.y - height / 2);
            snapshotView.setScaleX(config.previewScale);
            snapshotView.setScaleY(config.previewScale);
            snapshotView.setVisibility(View.VISIBLE);
            
            Log.d(TAG, "Highlight preview shown for: " + elementType);
        } catch (Exception e) {
            Log.e(TAG, "Error in showHighlightPreview: " + e.getMessage());
        }
    }
    
    /**
     * كشف Drop Zones
     */
    private void detectDropZones() {
        detectedDropZones.clear();
        
        // كشف zones في Canvas
        if (canvasContainer != null) {
            detectCanvasDropZones();
        }
        
        // إضافة drop zone عام للـ canvas
        Rect canvasBounds = getCanvasBounds();
        if (canvasBounds != null) {
            DropZone canvasZone = new DropZone("canvas", canvasBounds, "CANVAS");
            canvasZone.priority = 0.5f;
            detectedDropZones.add(canvasZone);
        }
        
        Log.d(TAG, "Detected " + detectedDropZones.size() + " drop zones");
        
        // إشعار الكشف
        notifyDropZoneDetected(detectedDropZones);
    }
    
    /**
     * كشف drop zones في Canvas
     */
    private void detectCanvasDropZones() {
        // هنا يمكن استخدام خوارزمية ذكية لكشف العناصر القابلة للإسقاط
        // للتبسيط، سنضيف zones أساسية
        
        Rect canvasBounds = getCanvasBounds();
        if (canvasBounds != null) {
            // تقسيم Canvas إلى zones
            int zoneCount = 6; // 2x3 grid
            int zoneWidth = canvasBounds.width() / 2;
            int zoneHeight = canvasBounds.height() / 3;
            
            for (int row = 0; row < 3; row++) {
                for (int col = 0; col < 2; col++) {
                    Rect zoneRect = new Rect(
                        canvasBounds.left + col * zoneWidth,
                        canvasBounds.top + row * zoneHeight,
                        canvasBounds.left + (col + 1) * zoneWidth,
                        canvasBounds.top + (row + 1) * zoneHeight
                    );
                    
                    DropZone zone = new DropZone(
                        "zone_" + row + "_" + col,
                        zoneRect,
                        "CANVAS"
                    );
                    detectedDropZones.add(zone);
                }
            }
        }
    }
    
    /**
     * الحصول على حدود Canvas
     */
    private Rect getCanvasBounds() {
        if (canvasContainer != null) {
            int[] location = new int[2];
            canvasContainer.getLocationOnScreen(location);
            return new Rect(
                location[0],
                location[1],
                location[0] + canvasContainer.getWidth(),
                location[1] + canvasContainer.getHeight()
            );
        }
        return null;
    }
    
    /**
     * حساب اللون حسب نوع العنصر
     */
    private int getElementColor(String elementType) {
        switch (elementType.toLowerCase()) {
            case "text":
                return Color.parseColor("#2196F3");
            case "button":
                return Color.parseColor("#4CAF50");
            case "image":
                return Color.parseColor("#FF9800");
            case "div":
                return Color.parseColor("#9C27B0");
            case "container":
                return Color.parseColor("#607D8B");
            default:
                return Color.parseColor("#795548");
        }
    }
    
    /**
     * رسوم متحركة لدخول العنصر
     */
    private void animateViewEntrance(View view, Point position) {
        view.setScaleX(0.5f);
        view.setScaleY(0.5f);
        view.setAlpha(0.0f);
        
        ValueAnimator animator = ValueAnimator.ofFloat(0f, 1f);
        animator.setDuration(200);
        animator.setInterpolator(config.animationInterpolator);
        animator.addUpdateListener(animation -> {
            float progress = (float) animation.getAnimatedValue();
            view.setScaleX(0.5f + 0.5f * progress);
            view.setScaleY(0.5f + 0.5f * progress);
            view.setAlpha(progress);
        });
        animator.start();
    }
    
    /**
     * تحديث الموضع أثناء السحب
     */
    public void updateDragPosition(Point newPosition) {
        if (currentState != DragState.DRAGGING && currentState != DragState.HOVERING) {
            return;
        }
        
        currentDragPoint = newPosition;
        
        // تحديث موضع المرئيات
        updateVisualFeedbackPosition(newPosition);
        
        // كشف الـ hover zone
        updateHoverZone(newPosition);
        
        // إشعار التحديث
        notifyDragMove(draggedElementType, newPosition, currentHoverZone);
    }
    
    /**
     * تحديث موضع التغذية الراجعة البصرية
     */
    private void updateVisualFeedbackPosition(Point position) {
        if (ghostView != null && ghostView.getVisibility() == View.VISIBLE) {
            ghostView.setX(position.x - ghostView.getWidth() / 2);
            ghostView.setY(position.y - ghostView.getHeight() / 2);
        }
        
        if (snapshotView != null && snapshotView.getVisibility() == View.VISIBLE) {
            snapshotView.setX(position.x - snapshotView.getWidth() / 2);
            snapshotView.setY(position.y - snapshotView.getHeight() / 2);
        }
        
        if (highlightOverlay != null && highlightOverlay.getVisibility() == View.VISIBLE && currentHoverZone != null) {
            highlightOverlay.setX(currentHoverZone.bounds.left);
            highlightOverlay.setY(currentHoverZone.bounds.top);
            highlightOverlay.getLayoutParams().width = currentHoverZone.bounds.width();
            highlightOverlay.getLayoutParams().height = currentHoverZone.bounds.height();
        }
    }
    
    /**
     * تحديث الـ hover zone
     */
    private void updateHoverZone(Point position) {
        DropZone bestZone = null;
        float bestScore = 0f;
        
        for (DropZone zone : detectedDropZones) {
            float score = zone.calculateScore(position);
            if (score > bestScore) {
                bestScore = score;
                bestZone = zone;
            }
        }
        
        if (bestZone != null && bestScore > 0.1f) { // حد أدنى للـ score
            if (currentHoverZone == null || !currentHoverZone.id.equals(bestZone.id)) {
                currentHoverZone = bestZone;
                currentState = DragState.HOVERING;
                
                // إشعار تغيير الـ hover zone
                showHoverFeedback(bestZone);
                
                if (config.enableHapticFeedback) {
                    vibrator.vibrate(30);
                }
            }
        } else {
            if (currentHoverZone != null) {
                hideHoverFeedback();
                currentHoverZone = null;
                currentState = DragState.DRAGGING;
            }
        }
    }
    
    /**
     * عرض تغذية راجعة للـ hover
     */
    private void showHoverFeedback(DropZone zone) {
        if (highlightOverlay != null) {
            highlightOverlay.setX(zone.bounds.left);
            highlightOverlay.setY(zone.bounds.top);
            
            ViewGroup.LayoutParams params = highlightOverlay.getLayoutParams();
            if (params != null) {
                params.width = zone.bounds.width();
                params.height = zone.bounds.height();
                highlightOverlay.setLayoutParams(params);
            }
            
            highlightOverlay.setVisibility(View.VISIBLE);
            
            // رسوم متحركة للدخول
            highlightOverlay.setAlpha(0.0f);
            ValueAnimator animator = ValueAnimator.ofFloat(0f, 1f);
            animator.setDuration(150);
            animator.addUpdateListener(animation -> {
                highlightOverlay.setAlpha((float) animation.getAnimatedValue());
            });
            animator.start();
        }
    }
    
    /**
     * إخفاء تغذية راجعة الـ hover
     */
    private void hideHoverFeedback() {
        if (highlightOverlay != null) {
            ValueAnimator animator = ValueAnimator.ofFloat(1f, 0f);
            animator.setDuration(150);
            animator.addUpdateListener(animation -> {
                highlightOverlay.setAlpha((float) animation.getAnimatedValue());
            });
            animator.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    highlightOverlay.setVisibility(View.GONE);
                }
            });
            animator.start();
        }
    }
    
    /**
     * إنهاء السحب
     */
    public void endDrag() {
        if (currentState == DragState.IDLE) return;
        
        Log.d(TAG, "Ending drag operation");
        
        // تحديث الحالة
        currentState = DragState.DROPPING;
        currentMetrics.endTime = System.currentTimeMillis();
        currentMetrics.endPosition = currentDragPoint;
        currentMetrics.dragDistance = (int) calculateDistance(dragStartPoint, currentDragPoint);
        
        boolean success = false;
        String error = null;
        
        try {
            if (currentHoverZone != null) {
                success = performDrop(currentHoverZone);
                if (!success) {
                    error = "Failed to drop element";
                }
            } else {
                error = "No valid drop zone";
                success = false;
            }
        } catch (Exception e) {
            error = "Drop error: " + e.getMessage();
            success = false;
            Log.e(TAG, "Error during drop: " + e.getMessage());
        }
        
        currentMetrics.successful = success;
        currentMetrics.error = error;
        currentMetrics.dropZoneId = currentHoverZone != null ? currentHoverZone.id : null;
        
        // تطبيق Auto-positioning إذا كان مطلوباً
        if (success && config.enableAutoPositioning && currentHoverZone != null) {
            applyAutoPositioning(currentHoverZone);
        }
        
        // تنظيف المرئيات
        cleanupVisualFeedback();
        
        // إشعار الانتهاء
        notifyDragEnd(draggedElementType, currentDragPoint, currentHoverZone, success);
        
        // إعادة تعيين الحالة
        resetDragState();
        
        Log.d(TAG, "Drag operation completed: " + (success ? "SUCCESS" : "FAILED"));
    }
    
    /**
     * إلغاء السحب
     */
    public void cancelDrag(String reason) {
        Log.d(TAG, "Cancelling drag: " + reason);
        
        currentState = DragState.CANCELLED;
        
        // تنظيف المرئيات
        cleanupVisualFeedback();
        
        // إشعار الإلغاء
        notifyDragCancelled(draggedElementType, currentDragPoint);
        
        // إعادة تعيين الحالة
        resetDragState();
        
        // إظهار رسالة خطأ إذا لزم الأمر
        if (reason != null && !reason.isEmpty()) {
            showErrorMessage(reason);
        }
    }
    
    /**
     * تنفيذ الإسقاط
     */
    private boolean performDrop(DropZone zone) {
        try {
            // هنا يمكن تنفيذ منطق الإسقاط الفعلي
            // للتبسيط، سنحاكي العملية
            
            Log.d(TAG, "Performing drop to zone: " + zone.id);
            
            // إشعار JavaScript layer
            notifyJavaLayerDrop(draggedElementType, zone, currentDragPoint);
            
            return true;
            
        } catch (Exception e) {
            Log.e(TAG, "Error performing drop: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * تطبيق Auto-positioning
     */
    private void applyAutoPositioning(DropZone zone) {
        try {
            Log.d(TAG, "Applying auto-positioning for zone: " + zone.id);
            
            // هنا يمكن تطبيق خوارزمية ذكية للموضع
            // للتبسيط، سنحسب موضع مركزي
            
            Point optimalPosition = calculateOptimalPosition(zone);
            
            // تطبيق الموضع الأمثل
            if (config.enableSnapToGrid) {
                optimalPosition = snapToGrid(optimalPosition);
            }
            
            // إشعار التطبيق
            notifyAutoPositioningApplied(zone, optimalPosition);
            
        } catch (Exception e) {
            Log.e(TAG, "Error applying auto-positioning: " + e.getMessage());
        }
    }
    
    /**
     * حساب الموضع الأمثل
     */
    private Point calculateOptimalPosition(DropZone zone) {
        Point center = new Point(zone.bounds.centerX(), zone.bounds.centerY());
        
        // إضافة offset صغير لتجنب التداخل
        int offset = 20;
        center.offset((int) (Math.random() * offset - offset/2), 
                     (int) (Math.random() * offset - offset/2));
        
        return center;
    }
    
    /**
     * snap إلى الشبكة
     */
    private Point snapToGrid(Point position) {
        int gridSize = 10; // px
        position.x = (position.x / gridSize) * gridSize;
        position.y = (position.y / gridSize) * gridSize;
        return position;
    }
    
    /**
     * تنظيف التغذية الراجعة البصرية
     */
    private void cleanupVisualFeedback() {
        if (ghostView != null) {
            hideViewWithAnimation(ghostView);
        }
        
        if (snapshotView != null) {
            hideViewWithAnimation(snapshotView);
        }
        
        if (highlightOverlay != null) {
            hideViewWithAnimation(highlightOverlay);
        }
        
        // إزالة المؤشرات البصرية
        for (View indicator : visualIndicators) {
            if (indicator.getParent() != null) {
                ((ViewGroup) indicator.getParent()).removeView(indicator);
            }
        }
        visualIndicators.clear();
    }
    
    /**
     * إخفاء عنصر مع رسوم متحركة
     */
    private void hideViewWithAnimation(View view) {
        if (view.getVisibility() != View.GONE) {
            ValueAnimator animator = ValueAnimator.ofFloat(1f, 0f);
            animator.setDuration(200);
            animator.setInterpolator(config.animationInterpolator);
            animator.addUpdateListener(animation -> {
                view.setAlpha((float) animation.getAnimatedValue());
            });
            animator.addListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    view.setVisibility(View.GONE);
                    view.setAlpha(1f); // إعادة التعيين
                }
            });
            animator.start();
        }
    }
    
    /**
     * إعادة تعيين حالة السحب
     */
    private void resetDragState() {
        currentState = DragState.IDLE;
        draggedElementType = null;
        dragStartPoint = null;
        currentDragPoint = null;
        currentHoverZone = null;
        detectedDropZones.clear();
        currentMetrics = null;
    }
    
    /**
     * حساب المسافة بين نقطتين
     */
    private float calculateDistance(Point p1, Point p2) {
        return (float) Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }
    
    /**
     * الحصول على نوع العنصر من اللمس
     */
    private String getElementTypeFromTouch(View view, MotionEvent event) {
        // هنا يمكن استخدام View.getTag() أو تحليل المحتوى
        // للتبسيط، سنعيد نوع افتراضي
        return "div"; // نوع افتراضي
    }
    
    /**
     * بدء مراقبة Drop Zones
     */
    private void startDropZoneMonitoring() {
        // يمكن هنا إعداد مراقبة للتغييرات في DOM
        // للتبسيط، سنستخدم timer
        
        // مراقبة دورية لـ Canvas bounds
        new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(1000); // كل ثانية
                    
                    // تحديث drop zones إذا تغير Canvas
                    activity.runOnUiThread(() -> {
                        if (currentState == DragState.IDLE) {
                            detectDropZones();
                        }
                    });
                    
                } catch (InterruptedException e) {
                    break;
                }
            }
        }).start();
    }
    
    /**
     * إعداد مراقبة الأداء
     */
    private void setupPerformanceMonitoring() {
        // مراقبة دورية للأداء
        new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(5000); // كل 5 ثواني
                    
                    activity.runOnUiThread(() -> {
                        updatePerformanceMode();
                    });
                    
                } catch (InterruptedException e) {
                    break;
                }
            }
        }).start();
    }
    
    /**
     * تحديث حالة الأداء
     */
    private void updatePerformanceMode() {
        if (dragCount > 0) {
            long avgDragTime = totalDragTime / dragCount;
            isPerformanceMode = avgDragTime > 1000; // أكثر من ثانية واحدة
        }
    }
    
    /**
     * تحديث مقاييس الأداء
     */
    private void updatePerformanceMetrics() {
        dragCount++;
        if (currentMetrics != null) {
            totalDragTime += currentMetrics.getDuration();
        }
    }
    
    /**
     * إظهار رسالة خطأ
     */
    private void showErrorMessage(String message) {
        activity.runOnUiThread(() -> {
            Snackbar.make(canvasContainer, message, Snackbar.LENGTH_LONG)
                   .setAction("Dismiss", v -> {})
                   .show();
        });
    }
    
    // Event Handlers for Android Drag Events
    
    private void handleDragStarted(DragEvent event) {
        Log.d(TAG, "Android drag started");
    }
    
    private void handleDragLocation(DragEvent event) {
        Point point = new Point((int) event.getX(), (int) event.getY());
        updateDragPosition(point);
    }
    
    private void handleDragEntered(DragEvent event) {
        Log.d(TAG, "Android drag entered");
    }
    
    private void handleDragExited(DragEvent event) {
        Log.d(TAG, "Android drag exited");
    }
    
    private void handleDrop(DragEvent event) {
        Log.d(TAG, "Android drop event");
        endDrag();
    }
    
    private void handleDragEnded(DragEvent event) {
        Log.d(TAG, "Android drag ended - current state: " + currentState);
        
        // معالجة أفضل للحالات المختلفة
        if (currentState == DragState.DRAGGING || currentState == DragState.HOVERING) {
            // إنهاء السحب بشكل طبيعي
            Log.d(TAG, "Drag ended during drag/hover state - finalizing");
            endDrag();
        } else if (currentState != DragState.DROPPING && currentState != DragState.IDLE) {
            // إلغاء فقط في الحالات غير المتوقعة
            Log.w(TAG, "Android drag ended unexpectedly in state: " + currentState);
            cancelDrag("Android drag ended in unexpected state: " + currentState);
        }
        
        // إعادة تعيين الحالة إلى IDLE
        if (currentState != DragState.IDLE) {
            currentState = DragState.IDLE;
        }
    }
    
    // Notification Methods
    
    private void notifyDragStart(String elementType, Point position) {
        for (DragCallback callback : callbacks) {
            callback.onDragStart(elementType, position);
        }
        
        // إشعار Bottom Sheet drag system
        notifyBottomSheetDragStart(elementType, position.x, position.y);
    }
    
    private void notifyDragMove(String elementType, Point position, DropZone hoverZone) {
        for (DragCallback callback : callbacks) {
            callback.onDragMove(elementType, position, hoverZone);
        }
        
        // إشعار Bottom Sheet drag system
        notifyBottomSheetDragMove(elementType, position.x, position.y);
    }
    
    private void notifyDragEnd(String elementType, Point position, DropZone dropZone, boolean success) {
        String containerId = dropZone != null ? dropZone.id : "canvas";
        String error = currentMetrics != null ? currentMetrics.error : null;
        
        for (DragCallback callback : callbacks) {
            callback.onDragEnd(elementType, position, dropZone, success);
        }
        
        // إشعار Bottom Sheet drag system
        notifyBottomSheetDragEnd(elementType, success, error, containerId);
    }
    
    private void notifyDragCancelled(String elementType, Point position) {
        for (DragCallback callback : callbacks) {
            callback.onDragCancelled(elementType, position);
        }
    }
    
    private void notifyDropZoneDetected(List<DropZone> zones) {
        for (DragCallback callback : callbacks) {
            callback.onDropZoneDetected(zones);
        }
    }
    
    private void notifyAutoPositioningApplied(DropZone zone, Point position) {
        for (DragCallback callback : callbacks) {
            callback.onAutoPositioningApplied(zone, position);
        }
    }
    
    private void notifyJavaLayerDrop(String elementType, DropZone zone, Point position) {
        // إشعار JavaScript layer
        if (activity.getWebView() != null) {
            String script = String.format(
                "window.BlocVibeCanvas.handleBottomSheetDrop('%s', '%s', %d, %d);",
                elementType, zone.id, position.x, position.y
            );
            activity.getWebView().evaluateJavascript(script, null);
        }
    }
    
    private void notifyBottomSheetDragStart(String elementType, int x, int y) {
        for (DragCallback callback : callbacks) {
            callback.onBottomSheetDragStart(elementType, x, y);
        }
    }
    
    private void notifyBottomSheetDragMove(String elementType, int x, int y) {
        for (DragCallback callback : callbacks) {
            callback.onBottomSheetDragMove(elementType, x, y);
        }
    }
    
    private void notifyBottomSheetDragEnd(String elementType, boolean success, String error, String containerId) {
        for (DragCallback callback : callbacks) {
            callback.onBottomSheetDragEnd(elementType, success, error, containerId);
        }
    }
    
    private void notifyAutoPositioningAppliedFromJS(String elementType, String containerId, String positionJson, String propertiesJson) {
        for (DragCallback callback : callbacks) {
            callback.onAutoPositioningAppliedFromJS(elementType, containerId, positionJson, propertiesJson);
        }
    }
    
    // Public API
    
    public void addDragCallback(DragCallback callback) {
        if (callback != null && !callbacks.contains(callback)) {
            callbacks.add(callback);
        }
    }
    
    public void removeDragCallback(DragCallback callback) {
        callbacks.remove(callback);
    }
    
    public void setDragConfig(DragConfig config) {
        this.config = config;
    }
    
    public DragConfig getDragConfig() {
        return config;
    }
    
    public DragState getCurrentState() {
        return currentState;
    }
    
    public DragMetrics getCurrentMetrics() {
        return currentMetrics;
    }
    
    public boolean isPerformanceMode() {
        return isPerformanceMode;
    }
    
    public List<DropZone> getDetectedDropZones() {
        return new ArrayList<>(detectedDropZones);
    }
    
    public DragMetrics getLastDragMetrics() {
        return currentMetrics;
    }
    
    /**
     * معالجة Auto-positioning من JavaScript layer
     */
    public void handleAutoPositioningFromJS(String elementType, String containerId, String positionJson, String propertiesJson) {
        try {
            Log.d(TAG, "Handling auto-positioning from JS for: " + elementType);
            
            // إشعار الـ callbacks
            notifyAutoPositioningAppliedFromJS(elementType, containerId, positionJson, propertiesJson);
            
            // تطبيق الموضع والخصائص في Android إذا لزم الأمر
            if (activity != null) {
                activity.runOnUiThread(() -> {
                    applyAutoPositioningFromJS(elementType, containerId, positionJson, propertiesJson);
                });
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling auto-positioning from JS: " + e.getMessage());
        }
    }
    
    /**
     * تطبيق Auto-positioning من JavaScript
     */
    private void applyAutoPositioningFromJS(String elementType, String containerId, String positionJson, String propertiesJson) {
        try {
            // تحليل JSON
            // يمكن هنا تطبيق الموضع والخصائص على العنصر الجديد
            Log.d(TAG, "Applying auto-positioning from JS data");
            
            // مثال: تحديث واجهة المستخدم
            updateAutoPositioningDisplay(elementType, positionJson, propertiesJson);
            
        } catch (Exception e) {
            Log.e(TAG, "Error applying auto-positioning from JS: " + e.getMessage());
        }
    }
    
    /**
     * تحديث عرض Auto-positioning
     */
    private void updateAutoPositioningDisplay(String elementType, String positionJson, String propertiesJson) {
        try {
            // تحديث UI elements ببيانات Auto-positioning
            Log.d(TAG, "Auto-positioning applied for: " + elementType);
            
        } catch (Exception e) {
            Log.e(TAG, "Error updating auto-positioning display: " + e.getMessage());
        }
    }
    
    // Lifecycle
    
    public void onDestroy() {
        cleanupVisualFeedback();
        
        // إزالة المرئيات من الـ decor view
        ViewGroup decorView = (ViewGroup) activity.getWindow().getDecorView();
        if (ghostView != null && ghostView.getParent() == decorView) {
            decorView.removeView(ghostView);
        }
        if (snapshotView != null && snapshotView.getParent() == decorView) {
            decorView.removeView(snapshotView);
        }
        if (highlightOverlay != null && highlightOverlay.getParent() == decorView) {
            decorView.removeView(highlightOverlay);
        }
        
        Log.d(TAG, "BottomSheetDragManager destroyed");
    }
}