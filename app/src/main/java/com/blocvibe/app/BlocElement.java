package com.blocvibe.app;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * BlocElement - Represents a structured element in the webpage.
 * This class replaces raw HTML strings with a structured data model,
 * allowing for selecting, editing, and nesting elements.
 */
public class BlocElement {
    // Core properties
    public String elementId;    // Unique ID (using UUID)
    public String tag;          // HTML tag (e.g., "div", "button", "p", "h1")
    public String textContent;  // Inner text content, if any
    
    // CSS & Attributes
    public Map<String, String> styles;      // Inline styles (e.g., {"color": "red", "padding": "10px"})
    public Map<String, String> attributes;  // HTML attributes (e.g., {"class": "btn", "id": "myButton"})
    
    // Hierarchy
    public List<BlocElement> children;  // Child elements for nesting
    public String parentId;             // Parent element ID for navigation
    
    // State
    public boolean isSelected;  // Whether this element is currently selected in the editor
    
    /**
     * Default constructor - creates an empty element
     */
    public BlocElement() {
        this.elementId = UUID.randomUUID().toString();
        this.tag = "div";
        this.textContent = "";
        this.styles = new HashMap<>();
        this.attributes = new HashMap<>();
        this.children = new ArrayList<>();
        this.parentId = null;
        this.isSelected = false;
    }
    
    /**
     * Constructor with tag
     */
    public BlocElement(String tag) {
        this();
        this.tag = tag;
    }
    
    /**
     * Constructor with tag and text content
     */
    public BlocElement(String tag, String textContent) {
        this(tag);
        this.textContent = textContent;
    }
    
    /**
     * Add a child element
     */
    public void addChild(BlocElement child) {
        if (child != null) {
            child.parentId = this.elementId;
            this.children.add(child);
        }
    }
    
    /**
     * Remove a child element
     */
    public void removeChild(BlocElement child) {
        if (child != null) {
            this.children.remove(child);
            child.parentId = null;
        }
    }
    
    /**
     * Add or update a style property
     */
    public void setStyle(String property, String value) {
        this.styles.put(property, value);
    }
    
    /**
     * Add or update an attribute
     */
    public void setAttribute(String name, String value) {
        this.attributes.put(name, value);
    }
    
    /**
     * Generate HTML string from this element and its children
     */
    public String toHtml() {
        StringBuilder html = new StringBuilder();
        
        // Opening tag
        html.append("<").append(tag);
        
        // Add attributes
        if (!attributes.isEmpty()) {
            for (Map.Entry<String, String> attr : attributes.entrySet()) {
                html.append(" ").append(attr.getKey()).append("=\"").append(attr.getValue()).append("\"");
            }
        }
        
        // Add inline styles
        if (!styles.isEmpty()) {
            html.append(" style=\"");
            for (Map.Entry<String, String> style : styles.entrySet()) {
                html.append(style.getKey()).append(": ").append(style.getValue()).append("; ");
            }
            html.append("\"");
        }
        
        html.append(">");
        
        // Add text content
        if (textContent != null && !textContent.isEmpty()) {
            html.append(textContent);
        }
        
        // Add children recursively
        for (BlocElement child : children) {
            html.append(child.toHtml());
        }
        
        // Closing tag
        html.append("</").append(tag).append(">");
        
        return html.toString();
    }
    
    /**
     * Find an element by ID in this element's tree
     */
    public BlocElement findById(String id) {
        if (this.elementId.equals(id)) {
            return this;
        }
        
        for (BlocElement child : children) {
            BlocElement found = child.findById(id);
            if (found != null) {
                return found;
            }
        }
        
        return null;
    }
    
    /**
     * Clone this element (deep copy)
     */
    public BlocElement clone() {
        BlocElement cloned = new BlocElement(this.tag, this.textContent);
        cloned.styles.putAll(this.styles);
        cloned.attributes.putAll(this.attributes);
        
        for (BlocElement child : this.children) {
            cloned.addChild(child.clone());
        }
        
        return cloned;
    }
    
    /**
     * Get a list of all elements in the tree (for selection/editing)
     */
    public List<BlocElement> getAllElements() {
        List<BlocElement> elements = new ArrayList<>();
        elements.add(this);
        
        for (BlocElement child : children) {
            elements.addAll(child.getAllElements());
        }
        
        return elements;
    }
    
    /**
     * Factory methods for common elements
     */
    public static BlocElement createHeading(String text, int level) {
        BlocElement heading = new BlocElement("h" + level, text);
        return heading;
    }
    
    public static BlocElement createParagraph(String text) {
        BlocElement paragraph = new BlocElement("p", text);
        return paragraph;
    }
    
    public static BlocElement createButton(String text) {
        BlocElement button = new BlocElement("button", text);
        return button;
    }
    
    public static BlocElement createDiv() {
        BlocElement div = new BlocElement("div");
        return div;
    }
    
    public static BlocElement createLink(String text, String href) {
        BlocElement link = new BlocElement("a", text);
        link.setAttribute("href", href);
        return link;
    }
    
    public static BlocElement createImage(String src, String alt) {
        BlocElement img = new BlocElement("img");
        img.setAttribute("src", src);
        img.setAttribute("alt", alt);
        return img;
    }
}
