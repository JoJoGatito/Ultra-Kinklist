# Ultra Kinklist

A modern, mobile-friendly kink listing and sharing app that allows users to select and share their preferences.

## Features

- Responsive design works on both mobile and desktop
- Color-coded selection system:
  - Blank (no answer)
  - Red (no)
  - Pink (maybe)
  - Yellow (indifferent)
  - Green (like)
  - Blue (favorite)
- Tooltip descriptions for kinks
- Collapsible categories for easy navigation
- Persistent settings via localStorage
- Export functionality to save completed kinklist as a JPG image

## How to Use

1. Open `index.html` in your web browser
2. Click the colored circles to indicate your preferences for each kink
3. Hover over the info icon (ℹ️) to see descriptions
4. Use the collapsible category headers to navigate the form
5. Click the "Export as Image" button when finished to download your kinklist as a JPG

## How to Edit the Kinklist Content (classic.txt)

The app loads its content from the `classic.txt` file, which contains all categories, kinks, and descriptions. You can easily modify this file to customize your kinklist or add new options.

### File Format Structure

The `classic.txt` file follows a specific structure:

1. **Category Headers** - Lines starting with `#` define a new category section
   ```
   #Bodies
   ```

2. **Column Type** - Immediately after a category header, a line in parentheses defines the type of options for this category
   ```
   (General)
   ```
   
   Valid column types include:
   - `(General)` - Shows a single column of options
   - `(Giving, Receiving)` - Shows two columns of options
   - `(Self, Partner)` - Shows two columns of options
   - `(As Dominant, As Submissive)` - Shows two columns of options
   - `(Aggressor, Target)` - Shows two columns of options
   - `(Actor, Subject)` - Shows two columns of options
   
   You can also create your own custom column labels by using a comma-separated list:
   ```
   (Custom1, Custom2)
   ```

3. **Kink Items** - Lines starting with `*` define individual kinks within a category
   ```
   * Skinny
   ```

4. **Descriptions** - Lines starting with `?` provide a description for the preceding kink
   ```
   ? Expresses an interest in characters that are waifish, thin, or slender.
   ```

### How the Data is Parsed

1. The app loads the `classic.txt` file using a fetch request
2. The content is parsed line by line:
   - When a line starting with `#` is found, a new category is created
   - When a line with parentheses is found, it's set as the column type for the current category
   - When a line starting with `*` is found, a new kink is added to the current category
   - When a line starting with `?` is found, it's set as the description for the most recently added kink

3. Categories are rendered in the order they appear in the file
4. Kinks within each category are displayed in the order they appear under their respective category

### Example of Adding a New Category

To add a new category with kinks:

```
#My New Category
(Option1, Option2)
* First Kink
? Description of the first kink
* Second Kink
? Description of the second kink
```

### Example of Adding New Kinks to an Existing Category

To add a new kink to an existing category, locate the category in the file and add your new kink entries with their descriptions:

```
* New Kink Item
? Description of the new kink
```

### Tips for Editing

1. Keep an empty line between categories for readability
2. Make sure each kink has a description (lines starting with `?`), or the app may not display properly
3. Be consistent with your column types within each category
4. Avoid special characters in category and kink names that might cause issues with the data-attributes
5. After editing, save the file and reload the page to see your changes

## Technical Details

This app uses vanilla JavaScript, HTML, and CSS. The image export functionality uses the html2canvas library, which is loaded from a CDN.