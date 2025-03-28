document.addEventListener('DOMContentLoaded', () => {
    // Load and parse the classic.txt file
    fetch('classic.txt')
        .then(response => response.text())
        .then(text => {
            const kinklists = parseKinklistFile(text);
            renderKinklist(kinklists);
            setupTooltips();
            setupExportButton();
            setupCategoryControls();
        })
        .catch(error => {
            console.error('Error loading kinklist:', error);
            document.getElementById('kinklist-container').innerHTML = 
                `<p>Error loading kinklist: ${error.message}. Please check the console for details.</p>`;
        });
});

function parseKinklistFile(text) {
    const lines = text.split('\n');
    const categories = [];
    let currentCategory = null;
    let currentColumnType = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) continue;
        
        // Category header
        if (line.startsWith('#')) {
            const categoryName = line.substring(1).trim();
            currentCategory = {
                name: categoryName,
                columnType: null,
                kinks: []
            };
            categories.push(currentCategory);
        }
        // Column type
        else if (line.startsWith('(') && line.endsWith(')') && currentCategory) {
            currentColumnType = line.substring(1, line.length - 1).trim();
            currentCategory.columnType = currentColumnType;
        }
        // Kink
        else if (line.startsWith('*') && currentCategory) {
            const kinkName = line.substring(1).trim();
            const kink = {
                name: kinkName,
                description: null
            };
            currentCategory.kinks.push(kink);
        }
        // Description
        else if (line.startsWith('?') && currentCategory && currentCategory.kinks.length > 0) {
            const description = line.substring(1).trim();
            currentCategory.kinks[currentCategory.kinks.length - 1].description = description;
        }
    }
    
    return categories;
}

function renderKinklist(categories) {
    const container = document.getElementById('kinklist-container');
    const isMobile = window.innerWidth <= 768;
    
    categories.forEach(category => {
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        
        // Category title - make it collapsible
        const titleDiv = document.createElement('div');
        titleDiv.className = 'category-title';
        
        // Add a collapse/expand indicator
        const indicator = document.createElement('span');
        indicator.className = 'collapse-indicator';
        indicator.textContent = '▼'; // Down arrow indicates expanded
        indicator.style.marginRight = '8px';
        indicator.style.cursor = 'pointer';
        titleDiv.appendChild(indicator);
        
        // Add the category name in a span
        const titleText = document.createElement('span');
        titleText.textContent = category.name;
        titleDiv.appendChild(titleText);
        
        // Make the entire title clickable
        titleDiv.style.cursor = 'pointer';
        
        // Add click event to toggle collapse/expand
        titleDiv.addEventListener('click', () => {
            const content = categoryDiv.querySelector('.category-content');
            const isCollapsed = content.style.display === 'none';
            
            // Toggle visibility - check if we're on mobile
            if (isCollapsed) {
                if (window.innerWidth <= 768) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'grid';
                }
            } else {
                content.style.display = 'none';
            }
            
            // Update indicator
            indicator.textContent = isCollapsed ? '▼' : '▶';
            
            // Store collapsed state in localStorage
            const categoryKey = `category_${category.name.replace(/\s+/g, '_')}_collapsed`;
            if (isCollapsed) {
                localStorage.removeItem(categoryKey);
            } else {
                localStorage.setItem(categoryKey, 'true');
            }
        });
        
        categoryDiv.appendChild(titleDiv);
        
        // Create grid container for category content
        const categoryContent = document.createElement('div');
        categoryContent.className = 'category-content';
        
        // Check if this category was collapsed previously
        const categoryKey = `category_${category.name.replace(/\s+/g, '_')}_collapsed`;
        const wasCollapsed = localStorage.getItem(categoryKey) === 'true';
        
        if (wasCollapsed) {
            categoryContent.style.display = 'none';
            indicator.textContent = '▶'; // Right arrow for collapsed
        }
        
        categoryDiv.appendChild(categoryContent);
        
        // Determine column names based on category type
        const columnNames = getColumnNames(category.columnType);
        
        // Column headers
        const kinkHeaderDiv = document.createElement('div');
        kinkHeaderDiv.className = 'column-header';
        kinkHeaderDiv.textContent = 'Kink';
        categoryContent.appendChild(kinkHeaderDiv);
        
        if (columnNames.length === 2) {
            const givingHeaderDiv = document.createElement('div');
            givingHeaderDiv.className = 'column-header giving-header';
            givingHeaderDiv.textContent = columnNames[0];
            categoryContent.appendChild(givingHeaderDiv);
            
            const receivingHeaderDiv = document.createElement('div');
            receivingHeaderDiv.className = 'column-header receiving-header';
            receivingHeaderDiv.textContent = columnNames[1];
            categoryContent.appendChild(receivingHeaderDiv);
        } else {
            const generalHeaderDiv = document.createElement('div');
            generalHeaderDiv.className = 'column-header giving-header';
            generalHeaderDiv.textContent = columnNames[0];
            categoryContent.appendChild(generalHeaderDiv);
            
            // Empty cell for the third column
            const emptyCell = document.createElement('div');
            emptyCell.className = 'column-header';
            categoryContent.appendChild(emptyCell);
        }
        
        // Kinks
        category.kinks.forEach(kink => {
            // Create name cell
            const kinkNameDiv = document.createElement('div');
            kinkNameDiv.className = 'kink-name';
            kinkNameDiv.textContent = kink.name;
            
            if (kink.description) {
                const infoIcon = document.createElement('span');
                infoIcon.className = 'info-icon';
                infoIcon.textContent = 'ℹ️';
                infoIcon.dataset.description = kink.description;
                kinkNameDiv.appendChild(infoIcon);
            }
            
            categoryContent.appendChild(kinkNameDiv);
            
            // For mobile, create a container for option buttons
            let optionsContainer;
            if (isMobile) {
                optionsContainer = document.createElement('div');
                optionsContainer.className = 'kink-options-container';
                categoryContent.appendChild(optionsContainer);
            }
            
            // Create button cells based on category type
            if (columnNames.length === 2) {
                const givingDiv = document.createElement('div');
                givingDiv.className = 'kink-giving';
                givingDiv.dataset.type = columnNames[0].charAt(0); // First character of column name
                const givingButton = createRadioGroup('giving', `${category.name}-${kink.name}`);
                givingDiv.appendChild(givingButton);
                
                const receivingDiv = document.createElement('div');
                receivingDiv.className = 'kink-receiving';
                receivingDiv.dataset.type = columnNames[1].charAt(0); // First character of column name
                const receivingButton = createRadioGroup('receiving', `${category.name}-${kink.name}`);
                receivingDiv.appendChild(receivingButton);
                
                if (isMobile) {
                    // On mobile, add both options to the container
                    optionsContainer.appendChild(givingDiv);
                    optionsContainer.appendChild(receivingDiv);
                } else {
                    // On desktop, add directly to the grid
                    categoryContent.appendChild(givingDiv);
                    categoryContent.appendChild(receivingDiv);
                }
            } else {
                const generalDiv = document.createElement('div');
                generalDiv.className = 'kink-giving';
                generalDiv.dataset.type = columnNames[0].charAt(0); // First character of column name
                const generalButton = createRadioGroup('general', `${category.name}-${kink.name}`);
                generalDiv.appendChild(generalButton);
                
                if (isMobile) {
                    // On mobile, add to the container
                    optionsContainer.appendChild(generalDiv);
                } else {
                    // On desktop, add directly to the grid
                    categoryContent.appendChild(generalDiv);
                    
                    // Empty cell for the third column
                    const emptyCell = document.createElement('div');
                    categoryContent.appendChild(emptyCell);
                }
            }
        });
        
        container.appendChild(categoryDiv);
    });
}

function getColumnNames(columnType) {
    if (!columnType) return ['General'];
    
    const columns = columnType.split(',').map(col => col.trim());
    return columns;
}

function createRadioGroup(type, kinkId) {
    const radioButton = document.createElement('div');
    radioButton.className = 'radio-button blank';
    radioButton.dataset.value = 'blank';
    radioButton.dataset.kinkId = kinkId;
    radioButton.dataset.type = type;
    
    const options = [
        { value: 'blank', color: 'transparent', label: 'No Answer' },
        { value: 'no', color: '#ff0000', label: 'No' },
        { value: 'maybe', color: '#ff69b4', label: 'Maybe' },
        { value: 'neutral', color: '#ffff00', label: 'Indifferent' },
        { value: 'yes', color: '#00ff00', label: 'Like' },
        { value: 'favorite', color: '#0000ff', label: 'Favorite' }
    ];
    
    radioButton.addEventListener('click', (e) => {
        showColorMenu(radioButton);
    });

    radioButton.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            showColorMenu(radioButton);
        }
    });

    // Make radio button focusable
    radioButton.tabIndex = 0;
function showColorMenu(radioButton) {
    // Close any other open menus
    document.querySelectorAll('.color-picker-menu').forEach(menu => {
        menu.remove();
    });
        
        // Create and show the color menu
        const menu = document.createElement('div');
        menu.className = 'color-picker-menu';
        
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = `color-option ${option.value}`;
            
            // Create a color circle
            const colorCircle = document.createElement('div');
            colorCircle.className = 'color-circle';
            optionElement.appendChild(colorCircle);
            
            // Add label
            const label = document.createElement('span');
            label.textContent = option.label;
            optionElement.appendChild(label);
            
            // Select color when clicked
            optionElement.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Remove all color classes
                radioButton.classList.remove('blank', 'no', 'maybe', 'neutral', 'yes', 'favorite');
                
                // Add the new color class
                radioButton.classList.add(option.value);
                radioButton.dataset.value = option.value;
                
                // Close the menu
                menu.remove();
            });
            
            menu.appendChild(optionElement);
        });
        
        // Position the menu properly
        const rect = radioButton.getBoundingClientRect();
        menu.style.position = 'absolute';
        
        // On mobile, use fixed positioning in the center of the screen
        if (window.innerWidth <= 768) {
            // Calculate position to ensure menu stays within viewport
            const viewportHeight = window.innerHeight;
            const menuHeight = 240; // Approximate height of the menu
            
            // Position menu in the middle of the screen, or higher if near bottom
            const topPosition = Math.min(
                rect.bottom + 5,
                viewportHeight - menuHeight - 20
            );
            
            menu.style.position = 'fixed';
            menu.style.top = `${topPosition}px`;
            menu.style.left = '50%';
            menu.style.transform = 'translateX(-50%)';
        } else {
            // Desktop positioning
            menu.style.top = `${rect.bottom + window.scrollY + 5}px`;
            menu.style.left = `${rect.left + window.scrollX - 5}px`;
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== radioButton) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
        
        document.body.appendChild(menu);
    }
    
    return radioButton;
}

function setupTooltips() {
    let currentTooltip = null;
    
    document.querySelectorAll('.info-icon').forEach(icon => {
        // For desktop: mouseenter/mouseleave
        icon.addEventListener('mouseenter', (e) => {
            showTooltip(e.target);
        });
        
        icon.addEventListener('mouseleave', () => {
            hideTooltip();
        });
        
        // For mobile: click
        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // If this icon already has a tooltip showing, hide it
            if (currentTooltip && e.target.dataset.tooltipActive === 'true') {
                hideTooltip();
                return;
            }
            
            // Otherwise show the tooltip for this icon
            showTooltip(e.target);
            e.target.dataset.tooltipActive = 'true';
        });
    });
    
    // Hide tooltip when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!e.target.classList.contains('info-icon')) {
            hideTooltip();
        }
    });
    
    // Helper functions
    function showTooltip(target) {
        // Remove existing tooltip if there is one
        hideTooltip();
        
        // Create new tooltip with close button
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.innerHTML = `
            <button class="tooltip-close">×</button>
            ${target.dataset.description}
        `;
        
        // Add close button handler
        tooltip.querySelector('.tooltip-close').addEventListener('click', hideTooltip);
        
        // Position tooltip near the icon
        const rect = target.getBoundingClientRect();
        tooltip.style.top = `${rect.bottom + window.scrollY + 5}px`;
        
        // On mobile (smaller screens), center the tooltip
        if (window.innerWidth <= 768) {
            tooltip.style.left = '50%';
            tooltip.style.transform = 'translateX(-50%)';
        } else {
            tooltip.style.left = `${rect.left + window.scrollX - 150}px`;
        }
        
        document.body.appendChild(tooltip);
        currentTooltip = tooltip;
        
        // Mark all icons as not having an active tooltip
        document.querySelectorAll('.info-icon').forEach(icon => {
            icon.dataset.tooltipActive = 'false';
        });
        
        // Mark this icon as having the active tooltip
        target.dataset.tooltipActive = 'true';
    }
    
    function hideTooltip() {
        if (currentTooltip) {
            document.body.removeChild(currentTooltip);
            currentTooltip = null;
        }
        
        // Mark all icons as not having an active tooltip
        document.querySelectorAll('.info-icon').forEach(icon => {
            icon.dataset.tooltipActive = 'false';
        });
    }
}

function setupExportButton() {
    const exportButton = document.getElementById('export-button');
    exportButton.addEventListener('click', () => {
        // Check if html2canvas is available
        if (typeof html2canvas === 'undefined') {
            alert('Export functionality requires the html2canvas library. Please check that you have an internet connection or try a different browser.');
            return;
        }
        
        // Add a loading state
        exportButton.textContent = 'Generating image...';
        exportButton.disabled = true;
        
        // Hide any tooltips and color pickers
        document.querySelectorAll('.tooltip, .color-picker-menu').forEach(el => el.remove());
        
        // Create an export version of the content with only answered kinks
        createExportView()
            .then(exportContainer => {
                // Use html2canvas to generate an image
                return html2canvas(exportContainer, {
                    backgroundColor: '#000',
                    allowTaint: true,
                    useCORS: true,
                    scale: window.devicePixelRatio
                });
            })
            .then(canvas => {
                // Convert canvas to image and download
                const image = canvas.toDataURL('image/jpeg', 0.95);
                const a = document.createElement('a');
                a.href = image;
                a.download = 'kinklist.jpg';
                a.click();
                
                // Reset button
                exportButton.textContent = 'Export as Image';
                exportButton.disabled = false;
                
                // Remove the temporary export container
                const exportContainer = document.getElementById('export-container');
                if (exportContainer) {
                    document.body.removeChild(exportContainer);
                }
            })
            .catch(error => {
                console.error('Error generating image:', error);
                alert('Error generating image. This might be caused by browser security restrictions. Try using the app on a different browser or device.');
                exportButton.textContent = 'Error - Try Again';
                exportButton.disabled = false;
                
                // Remove the temporary export container if it exists
                const exportContainer = document.getElementById('export-container');
                if (exportContainer) {
                    document.body.removeChild(exportContainer);
                }
            });
    });
}

function setupCategoryControls() {
    const expandAllButton = document.getElementById('expand-all');
    const collapseAllButton = document.getElementById('collapse-all');
    const isMobile = window.innerWidth <= 768;
    
    expandAllButton.addEventListener('click', () => {
        document.querySelectorAll('.category').forEach(category => {
            const content = category.querySelector('.category-content');
            const indicator = category.querySelector('.collapse-indicator');
            
            // Expand this category - check if we're on mobile
            content.style.display = window.innerWidth <= 768 ? 'block' : 'grid';
            indicator.textContent = '▼';
            
            // Update localStorage
            const categoryName = category.querySelector('.category-title span:last-child').textContent;
            const categoryKey = `category_${categoryName.replace(/\s+/g, '_')}_collapsed`;
            localStorage.removeItem(categoryKey);
        });
    });
    
    collapseAllButton.addEventListener('click', () => {
        document.querySelectorAll('.category').forEach(category => {
            const content = category.querySelector('.category-content');
            const indicator = category.querySelector('.collapse-indicator');
            
            // Collapse this category
            content.style.display = 'none';
            indicator.textContent = '▶';
            
            // Update localStorage
            const categoryName = category.querySelector('.category-title span:last-child').textContent;
            const categoryKey = `category_${categoryName.replace(/\s+/g, '_')}_collapsed`;
            localStorage.setItem(categoryKey, 'true');
        });
    });
}

function createExportView() {
    return new Promise(resolve => {
        // Create a container for the export view
        const exportContainer = document.createElement('div');
        exportContainer.id = 'export-container';
        exportContainer.style.position = 'absolute';
        exportContainer.style.left = '-9999px';
        exportContainer.style.backgroundColor = '#000';
        exportContainer.style.color = '#fff';
        exportContainer.style.padding = '20px';
        exportContainer.style.width = '1200px'; // Wide format
        exportContainer.style.boxSizing = 'border-box'; // Include padding in width calculation
        
        // Create header with title and legend
        const header = document.createElement('div');
        header.style.textAlign = 'center';
        header.style.marginBottom = '20px';
        
        const title = document.createElement('h1');
        title.textContent = 'Ultra Kinklist';
        title.style.fontSize = '24px';
        title.style.marginBottom = '15px';
        header.appendChild(title);
        
        // Add the legend
        const legend = document.querySelector('.legend').cloneNode(true);
        legend.style.justifyContent = 'center';
        legend.style.backgroundColor = '#111';
        legend.style.padding = '10px';
        legend.style.borderRadius = '5px';
        header.appendChild(legend);
        
        exportContainer.appendChild(header);
        
        // Create a columns container for the grid layout
        const columnsContainer = document.createElement('div');
        columnsContainer.style.display = 'grid';
        columnsContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
        columnsContainer.style.gap = '30px'; // Slightly more spacing between columns
        columnsContainer.style.width = '100%';
        
        const leftColumn = document.createElement('div');
        leftColumn.style.width = '100%';
        leftColumn.style.boxSizing = 'border-box';
        
        const rightColumn = document.createElement('div');
        rightColumn.style.width = '100%';
        rightColumn.style.boxSizing = 'border-box';
        
        // Collect all categories with selections
        const categoriesWithSelections = [];
        
        document.querySelectorAll('.category').forEach(category => {
            // Check if this category has any selected options
            const hasSelections = Array.from(category.querySelectorAll('.radio-button')).some(
                button => button.dataset.value !== 'blank'
            );
            
            if (!hasSelections) return; // Skip categories with no selections
            
            // Create a clone of this category for the export
            const categoryClone = document.createElement('div');
            categoryClone.style.marginBottom = '20px';
            
            // Add category title
            const categoryTitle = document.createElement('div');
            categoryTitle.textContent = category.querySelector('.category-title').textContent;
            categoryTitle.style.fontSize = '18px';
            categoryTitle.style.fontWeight = 'bold';
            categoryTitle.style.borderBottom = '1px solid #444';
            categoryTitle.style.paddingBottom = '5px';
            categoryTitle.style.marginBottom = '10px';
            categoryClone.appendChild(categoryTitle);
            
            // Create table for kinks
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.borderCollapse = 'collapse';
            table.style.tableLayout = 'fixed'; // Use fixed table layout for consistent column widths
            
            // Create table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            // Add kink header - make it wider than option columns
            const kinkHeader = document.createElement('th');
            kinkHeader.textContent = 'Kink';
            kinkHeader.style.textAlign = 'left';
            kinkHeader.style.padding = '5px';
            kinkHeader.style.borderBottom = '1px solid #333';
            kinkHeader.style.width = '70%'; // Set kink name column to 70% of the table width
            headerRow.appendChild(kinkHeader);
            
            // Add column headers
            const columnHeaders = category.querySelectorAll('.column-header');
            const optionCount = Math.max(0, columnHeaders.length - 1); // Number of option columns (excluding kink name)
            
            if (optionCount > 0) {
                const optionWidth = 30 / optionCount; // Distribute remaining 30% among option columns
                
                for (let i = 1; i < columnHeaders.length; i++) {
                    if (columnHeaders[i].textContent) {
                        const th = document.createElement('th');
                        th.textContent = columnHeaders[i].textContent;
                        th.style.textAlign = 'center';
                        th.style.padding = '5px';
                        th.style.borderBottom = '1px solid #333';
                        th.style.width = `${optionWidth}%`;
                        headerRow.appendChild(th);
                    }
                }
            }
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Create table body
            const tbody = document.createElement('tbody');
            let rowCount = 0;
            
            // Get all kink rows
            const kinkRows = [];
            const kinkNames = category.querySelectorAll('.kink-name');
            
            for (let i = 0; i < kinkNames.length; i++) {
                const kinkName = kinkNames[i];
                
                // Get all buttons in the same row as this kink
                const rowIndex = Array.from(category.querySelectorAll('.kink-name')).indexOf(kinkName);
                
                const givingButtonCell = category.querySelectorAll('.kink-giving')[rowIndex];
                const receivingButtonCell = category.querySelectorAll('.kink-receiving')[rowIndex];
                
                const buttons = [];
                if (givingButtonCell) {
                    const givingButton = givingButtonCell.querySelector('.radio-button');
                    if (givingButton) buttons.push(givingButton);
                }
                
                if (receivingButtonCell) {
                    const receivingButton = receivingButtonCell.querySelector('.radio-button');
                    if (receivingButton) buttons.push(receivingButton);
                }
                
                // Check if any buttons have a non-blank value
                const hasSelection = buttons.some(button => button.dataset.value !== 'blank');
                
                // Skip this row if all buttons are blank
                if (!hasSelection) continue;
                
                // Create row for this kink
                const tr = document.createElement('tr');
                rowCount++;
                
                // Add kink name
                const td = document.createElement('td');
                td.textContent = kinkName.textContent.replace('ℹ️', '').trim();
                td.style.padding = '5px';
                td.style.borderBottom = '1px solid #222';
                td.style.width = '70%'; // Match the header width
                tr.appendChild(td);
                
                // Add color cells
                const optionWidth = 30 / buttons.length; // Distribute remaining 30% among option columns
                
                buttons.forEach(button => {
                    const buttonTd = document.createElement('td');
                    buttonTd.style.textAlign = 'center';
                    buttonTd.style.padding = '5px';
                    buttonTd.style.borderBottom = '1px solid #222';
                    buttonTd.style.width = `${optionWidth}%`; // Match header width
                    
                    // Only add a color if the value is not blank
                    if (button.dataset.value !== 'blank') {
                        const colorCircle = document.createElement('div');
                        colorCircle.style.width = '20px';
                        colorCircle.style.height = '20px';
                        colorCircle.style.borderRadius = '50%';
                        colorCircle.style.margin = '0 auto';
                        colorCircle.style.border = '1px solid #555';
                        
                        // Set color based on value
                        switch(button.dataset.value) {
                            case 'no':
                                colorCircle.style.backgroundColor = '#ff0000';
                                break;
                            case 'maybe':
                                colorCircle.style.backgroundColor = '#ff69b4';
                                break;
                            case 'neutral':
                                colorCircle.style.backgroundColor = '#ffff00';
                                break;
                            case 'yes':
                                colorCircle.style.backgroundColor = '#00ff00';
                                break;
                            case 'favorite':
                                colorCircle.style.backgroundColor = '#0000ff';
                                break;
                        }
                        
                        buttonTd.appendChild(colorCircle);
                    }
                    
                    tr.appendChild(buttonTd);
                });
                
                tbody.appendChild(tr);
            }
            
            // Only add this category if it has rows with selections
            if (rowCount > 0) {
                table.appendChild(tbody);
                categoryClone.appendChild(table);
                categoriesWithSelections.push({
                    element: categoryClone,
                    rowCount: rowCount
                });
            }
        });
        
        // Distribute categories between columns
        let leftRowCount = 0;
        let rightRowCount = 0;
        
        categoriesWithSelections.forEach(category => {
            // Add to the column with fewer rows
            if (leftRowCount <= rightRowCount) {
                leftColumn.appendChild(category.element);
                leftRowCount += category.rowCount;
            } else {
                rightColumn.appendChild(category.element);
                rightRowCount += category.rowCount;
            }
        });
        
        columnsContainer.appendChild(leftColumn);
        columnsContainer.appendChild(rightColumn);
        exportContainer.appendChild(columnsContainer);
        
        // Add footer
        const footer = document.createElement('div');
        footer.style.textAlign = 'center';
        footer.style.marginTop = '20px';
        footer.style.fontSize = '12px';
        footer.style.color = '#888';
        
        const date = new Date();
        footer.textContent = `Generated on ${date.toLocaleDateString()}`;
        
        exportContainer.appendChild(footer);
        
        // Add to body and resolve
        document.body.appendChild(exportContainer);
        
        // Small delay to ensure rendering is complete
        setTimeout(() => {
            resolve(exportContainer);
        }, 100);
    });
}
