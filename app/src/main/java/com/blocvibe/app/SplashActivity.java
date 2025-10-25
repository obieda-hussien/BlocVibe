package com.blocvibe.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.content.Intent;
import androidx.appcompat.app.AppCompatActivity;
import com.blocvibe.app.databinding.ActivitySplashBinding;

public class SplashActivity extends AppCompatActivity {
    
    private ActivitySplashBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySplashBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Navigate to MainActivity after 2500ms
        new Handler(Looper.getMainLooper()).postDelayed(() -> {
            Intent intent = new Intent(SplashActivity.this, MainActivity.class);
            startActivity(intent);
            finish();
        }, 2500);
    }
}
