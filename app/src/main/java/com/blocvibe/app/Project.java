package com.blocvibe.app;

import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

@Entity(tableName = "projects")
public class Project {
    @PrimaryKey(autoGenerate = true)
    public long id;
    
    @ColumnInfo(name = "project_name")
    public String name;
    
    @ColumnInfo(name = "html_content")
    public String htmlContent;
    
    @ColumnInfo(name = "css_content")
    public String cssContent;
    
    @ColumnInfo(name = "js_content")
    public String jsContent;
    
    @ColumnInfo(name = "last_modified")
    public long lastModified;

    public Project() {
        // Default constructor for Room
        this.htmlContent = "";
        this.cssContent = "";
        this.jsContent = "";
        this.lastModified = System.currentTimeMillis();
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastModified() {
        // Format timestamp for display
        long diffMs = System.currentTimeMillis() - lastModified;
        long diffSec = diffMs / 1000;
        long diffMin = diffSec / 60;
        long diffHours = diffMin / 60;
        long diffDays = diffHours / 24;
        
        if (diffDays > 0) {
            if (diffDays == 1) {
                return "Last modified: Yesterday";
            } else if (diffDays < 7) {
                return "Last modified: " + diffDays + " days ago";
            } else if (diffDays < 30) {
                long weeks = diffDays / 7;
                return "Last modified: " + weeks + (weeks == 1 ? " week ago" : " weeks ago");
            } else {
                return "Last modified: Over a month ago";
            }
        } else if (diffHours > 0) {
            return "Last modified: " + diffHours + (diffHours == 1 ? " hour ago" : " hours ago");
        } else if (diffMin > 0) {
            return "Last modified: " + diffMin + (diffMin == 1 ? " minute ago" : " minutes ago");
        } else {
            return "Last modified: Just now";
        }
    }

    public void setLastModified(String lastModified) {
        // This method is kept for compatibility but not used
    }
}
