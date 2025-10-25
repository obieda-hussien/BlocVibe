package com.blocvibe.app;

public class Project {
    private String name;
    private String lastModified;

    public Project(String name, String lastModified) {
        this.name = name;
        this.lastModified = lastModified;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastModified() {
        return lastModified;
    }

    public void setLastModified(String lastModified) {
        this.lastModified = lastModified;
    }
}
