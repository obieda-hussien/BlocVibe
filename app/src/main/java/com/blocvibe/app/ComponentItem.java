package com.blocvibe.app;

public class ComponentItem {
    private String name;
    private int iconRes;
    private String htmlTag;

    public ComponentItem(String name, int iconRes, String htmlTag) {
        this.name = name;
        this.iconRes = iconRes;
        this.htmlTag = htmlTag;
    }

    public String getName() {
        return name;
    }

    public int getIconRes() {
        return iconRes;
    }

    public String getHtmlTag() {
        return htmlTag;
    }
}
