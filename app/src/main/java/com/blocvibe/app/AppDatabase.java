package com.blocvibe.app;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.migration.Migration;
import androidx.sqlite.db.SupportSQLiteDatabase;

@Database(entities = {Project.class}, version = 2, exportSchema = false)
public abstract class AppDatabase extends RoomDatabase {
    private static AppDatabase instance;
    
    public abstract ProjectDao projectDao();
    
    // Migration from version 1 to 2
    static final Migration MIGRATION_1_2 = new Migration(1, 2) {
        @Override
        public void migrate(SupportSQLiteDatabase database) {
            // Add new column for elements_json
            database.execSQL("ALTER TABLE projects ADD COLUMN elements_json TEXT DEFAULT '[]'");
            
            // Optional: Migrate existing htmlContent to elements_json
            // For now, we just set it to empty array and remove htmlContent column
            // Note: SQLite doesn't support DROP COLUMN, so we'll keep it for backwards compatibility
        }
    };
    
    public static synchronized AppDatabase getInstance(Context context) {
        if (instance == null) {
            instance = Room.databaseBuilder(
                context.getApplicationContext(),
                AppDatabase.class,
                "blocvibe_database"
            )
            .addMigrations(MIGRATION_1_2)
            .fallbackToDestructiveMigration()  // For development, recreate DB if migration fails
            .build();
        }
        return instance;
    }
}
