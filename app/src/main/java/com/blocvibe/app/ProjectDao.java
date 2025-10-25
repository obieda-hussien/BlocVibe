package com.blocvibe.app;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import java.util.List;

@Dao
public interface ProjectDao {
    @Insert
    long insertProject(Project project);
    
    @Update
    void updateProject(Project project);
    
    @Delete
    void deleteProject(Project project);
    
    @Query("SELECT * FROM projects ORDER BY last_modified DESC")
    LiveData<List<Project>> getAllProjects();
    
    @Query("SELECT * FROM projects WHERE id = :projectId")
    LiveData<Project> getProjectById(long projectId);
}
