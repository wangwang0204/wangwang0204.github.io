document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const suitsButton = document.getElementById('suits-button');
    const singleButton = document.getElementById('single-button');
    const typeSelect = document.getElementById('type-select');
    const searchInput = document.getElementById('search-input');
    const showMenuButton = document.getElementById('show-menu-button');

    // Containers for sections/modes
    const closetHeader = document.querySelector('.closet-header');
    const closetNavigation = document.querySelector('.closet-navigation');
    const closetContent = document.querySelector('.closet-content');

    const suitsSection = document.getElementById('suits-section');
    const singleSection = document.getElementById('single-section');
    const menuModeContainer = document.getElementById('menu-mode-container');
    const selectedModeContainer = document.getElementById('selected-mode-container');
    const comparingModeContainer = document.getElementById('comparing-mode-container');

    // Specific elements within modes
    const clothesCarousel = document.getElementById('clothes-carousel');
    const pantsCarousel = document.getElementById('pants-carousel');
    const singleCarousel = document.getElementById('single-carousel');
    const clothesCarouselItems = document.getElementById('clothes-items');
    const pantsCarouselItems = document.getElementById('pants-items');
    const singleCarouselItems = document.getElementById('single-items');
    const menuItemsGrid = document.getElementById('menu-items-grid');

    const itemInfoContent = document.getElementById('item-info-content');

    // Selected/Comparing Mode Elements
    const selectedItemDisplay = document.getElementById('selected-item-display');
    const compareButton = document.getElementById('selected-compare-button');
    const selectedTryOnButton = document.getElementById('selected-tryon-button');
    const closeSelectedModeButton = document.getElementById('close-selected-mode');

    const comparingLeft = document.querySelector('#comparing-mode-container .comparing-left');
    const comparingRightContent = document.querySelector('#comparing-mode-container .comparing-right .closet-content');

    // --- State Variables ---
    let currentView = 'suits';
    let currentDisplayMode = 'carousel'; // 'carousel', 'menu', 'selected', 'comparing'
    let selectedItem = null;
    let comparingItem = null;
    let clothesData = [];
    let clothesSelected = false;
    let pantsSelected = false;

    // --- Sample Data ---
    // Load clothing data from JSON file
    // Fetch the data from the sample_DB/db.json file
    fetch('sample_DB/db.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            clothesData = data;
            // Initialize the closet after data is loaded
            initializeCloset();
        })
        .catch(error => {
            console.error('Error loading clothing data:', error);
            // Fallback to sample data if fetch fails
            clothesData = [
                { id: 1, name: "Coffee T-shirt", type: "clothes", image: "sample_DB/clothes/pic1.jpg", description: "A comfy cotton t-shirt." },
                { id: 2, name: "Blue Jeans", type: "pants", image: "sample_DB/pants/pic1.jpg", description: "Classic blue denim jeans." }
            ];
            initializeCloset();
        });

    // --- Initialization ---
    function initializeCloset() {
        setupEventListeners();
        updateView();
        updateDisplayMode();
        filterAndDisplayItems();
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        suitsButton.addEventListener('click', () => switchView('suits'));
        singleButton.addEventListener('click', () => switchView('single'));
        typeSelect.addEventListener('change', filterAndDisplayItems);
        searchInput.addEventListener('input', handleSearch);
        showMenuButton.addEventListener('click', toggleMenuMode);

        // Carousel Arrows
        setupCarouselArrowListener(clothesCarousel, 'clothes');
        setupCarouselArrowListener(pantsCarousel, 'pants');
        setupCarouselArrowListener(singleCarousel, 'single');

        // Carousel Scroll with Infinite Loop Handling
        clothesCarouselItems.addEventListener('scroll', debounce(() => {
            handleInfiniteScroll(clothesCarouselItems, 'clothes');
            updateActiveCarouselItem(clothesCarouselItems, 'clothes');
        }, 100));
        pantsCarouselItems.addEventListener('scroll', debounce(() => {
            handleInfiniteScroll(pantsCarouselItems, 'pants');
            updateActiveCarouselItem(pantsCarouselItems, 'pants');
        }, 100));
        singleCarouselItems.addEventListener('scroll', debounce(() => {
            handleInfiniteScroll(singleCarouselItems, 'single');
            updateActiveCarouselItem(singleCarouselItems, 'single');
        }, 100));

        // Event delegation for item clicks/double-clicks
        closetContent.addEventListener('click', handleItemInteraction);
        closetContent.addEventListener('dblclick', handleItemInteraction);

        // Buttons in Selected/Comparing Mode
        if (compareButton) compareButton.addEventListener('click', enterComparingMode);
        if (selectedTryOnButton) selectedTryOnButton.addEventListener('click', () => handleTryOn(selectedItem));
        if (closeSelectedModeButton) closeSelectedModeButton.addEventListener('click', () => enterCarouselMode());
    }

    // Helper to setup arrow listeners
    function setupCarouselArrowListener(carouselElement, type) {
        if (!carouselElement) return;
        const leftArrow = carouselElement.querySelector('.carousel-arrow.left');
        const rightArrow = carouselElement.querySelector('.carousel-arrow.right');
        if (leftArrow) leftArrow.addEventListener('click', () => scrollCarouselNative(type, -1));
        if (rightArrow) rightArrow.addEventListener('click', () => scrollCarouselNative(type, 1));
    }

    // --- View & Mode Switching ---
    function switchView(newView) {
        if (newView === currentView && currentDisplayMode !== 'menu') return;
        currentView = newView;

        // initialize the type select = clothes
        if (currentView === 'single') {
            typeSelect.value = 'clothes';
        }

        updateView();

        if (currentDisplayMode !== 'carousel') {
            enterCarouselMode();
        } else {
            filterAndDisplayItems();
            updateDisplayMode();
        }
    }

    function updateView() {
        suitsButton.classList.toggle('active', currentView === 'suits');
        singleButton.classList.toggle('active', currentView === 'single');
        typeSelect.disabled = currentView === 'suits';
        updateDisplayMode();
    }

    function updateDisplayMode() {
        suitsSection.classList.add('hidden');
        singleSection.classList.add('hidden');
        if (menuModeContainer) menuModeContainer.classList.add('hidden');
        if (selectedModeContainer) selectedModeContainer.classList.add('hidden');
        if (comparingModeContainer) comparingModeContainer.classList.add('hidden');

        switch (currentDisplayMode) {
            case 'carousel':
                if (currentView === 'suits') {
                    suitsSection.classList.remove('hidden');
                } else {
                    singleSection.classList.remove('hidden');
                }
                showMenuButton.textContent = "Show Menu";
                break;
            case 'menu':
                if (menuModeContainer) menuModeContainer.classList.remove('hidden');
                showMenuButton.textContent = "Show Carousel";
                break;
            case 'selected':
                if (selectedModeContainer) selectedModeContainer.classList.remove('hidden');
                showMenuButton.textContent = "Show Menu";
                break;
            case 'comparing':
                if (comparingModeContainer) comparingModeContainer.classList.remove('hidden');
                showMenuButton.textContent = "Show Menu";
                break;
        }
    }

    // --- Item Filtering & Display ---
    function getFilteredData(forceType = null) {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedType = forceType || (currentView === 'single' ? typeSelect.value : 'all');

        return clothesData.filter(item => {
            const typeMatch = selectedType === 'all' || item.type === selectedType;
            const searchMatch = !searchTerm || item.name.toLowerCase().includes(searchTerm);
            return typeMatch && searchMatch;
        });
    }

    function filterAndDisplayItems() {
        if (currentDisplayMode === 'carousel') {
            if (currentView === 'suits') {
                displayItems(getFilteredData('clothes'), 'carousel', clothesCarouselItems, 'clothes');
                displayItems(getFilteredData('pants'), 'carousel', pantsCarouselItems, 'pants');
            } else {
                displayItems(getFilteredData(), 'carousel', singleCarouselItems, 'single');
            }
        } else if (currentDisplayMode === 'menu') {
            displayItems(getFilteredData(), 'menu', menuItemsGrid);
        } else if (currentDisplayMode === 'comparing') {
            displayItems(getFilteredData(), 'menu', comparingRightContent.querySelector('.menu-items-grid'));
        }
        updateDisplayMode();
    }

    function displayItems(items, mode, container, carouselType = null) {
        let targetContainer;
        let renderFunction;

        switch (mode) {
            case 'carousel':
                if (!container || !carouselType) return;
                targetContainer = container;
                renderFunction = createCarouselItemElement;
                resetCarousel(targetContainer);
                break;
            case 'menu':
                targetContainer = container || menuItemsGrid;
                if (!targetContainer) {
                    console.error("Menu target container not found.");
                    return;
                }
                targetContainer.innerHTML = '';
                renderFunction = createMenuItemElement;
                if (!targetContainer.classList.contains('menu-items-grid')) {
                    targetContainer.classList.add('menu-items-grid');
                }
                break;
            default:
                console.warn("Unsupported display mode for displayItems:", mode);
                return;
        }

        if (!targetContainer) {
            console.error("Target container not found for mode:", mode);
            return;
        }

        targetContainer.innerHTML = '';

        if (items.length === 0) {
            targetContainer.innerHTML = '<p style="text-align: center; color: #888; width: 100%;">No items found.</p>';
            if (mode === 'carousel') updateCarouselUI(container, carouselType, items);
            return;
        }

        // For carousel, duplicate items for infinite scrolling
        let displayItems = items;
        if (mode === 'carousel') {
            // Duplicate items at least twice to ensure seamless looping
            displayItems = [...items, ...items, ...items];
        }

        displayItems.forEach((item, index) => {
            const itemElement = renderFunction(item);
            itemElement.dataset.itemId = item.id;
            itemElement.dataset.itemType = item.type;
            // Add index to track original item in duplicated sets
            itemElement.dataset.index = index % items.length;
            targetContainer.appendChild(itemElement);
        });

        if (mode === 'carousel') {
            // Initialize scroll position to the start of the first real set
            resetCarousel(targetContainer);
            updateCarouselUI(container, carouselType, items);
        }
    }

    // --- Element Creation ---
    function createClosetItemElementBase(item) {
        const div = document.createElement('div');
        div.classList.add('closet-item');
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <span>${item.name}</span>
        `;
        return div;
    }

    function createCarouselItemElement(item) {
        return createClosetItemElementBase(item);
    }

    function createMenuItemElement(item) {
        const div = createClosetItemElementBase(item);
        div.classList.add('menu-item');
        return div;
    }

    // --- Carousel Logic (Infinite Scroll) ---
    function resetCarousel(container) {
        if (!container) return;
        // Scroll to the start of the first real set
        const items = container.querySelectorAll('.closet-item');
        if (items.length > 0) {
            const itemWidth = items[0].offsetWidth || 100;
            const gap = 15;
            container.scrollLeft = itemWidth * clothesData.length + gap * clothesData.length;
        }
        clothesSelected = false;
        pantsSelected = false;
        selectedItem = null;
    }

    function scrollCarouselNative(type, direction) {
        let container;
        if (type === 'clothes') container = clothesCarouselItems;
        else if (type === 'pants') container = pantsCarouselItems;
        else if (type === 'single') container = singleCarouselItems;
        else return;

        if (!container) return;

        const itemWidth = container.querySelector('.closet-item')?.offsetWidth || 100;
        const gap = 15;
        const scrollAmount = itemWidth + gap;

        container.scrollBy({
            left: scrollAmount * direction,
            behavior: 'smooth'
        });
    }

    function handleInfiniteScroll(container, type) {
        if (!container) return;
        const items = container.querySelectorAll('.closet-item');
        if (items.length === 0) return;

        const itemWidth = items[0].offsetWidth || 100;
        const gap = 15;
        const itemsPerSet = clothesData.filter(i => {
            const selectedType = type === 'single' ? typeSelect.value : type;
            return selectedType === 'all' || i.type === selectedType;
        }).length;
        const setWidth = (itemWidth + gap) * itemsPerSet;

        // Check if scrolled to the end or beginning
        const maxScroll = setWidth * 2; // Two sets for seamless looping
        const minScroll = setWidth; // Start of the first real set

        if (container.scrollLeft >= maxScroll - 10) {
            // Approaching end, reset to start of first set
            container.scrollLeft -= setWidth;
        } else if (container.scrollLeft <= minScroll + 10) {
            // Approaching start, jump to end of second set
            container.scrollLeft += setWidth;
        }
    }

    function updateCarouselUI(container, type, items) {
        if (!container) return;
        updateActiveCarouselItem(container, type);
        // Always show arrows for infinite scroll
        updateCarouselArrows(container, items, true);
    }

    function updateActiveCarouselItem(container, type) {
        if (!container) return;
        const itemsElements = container.querySelectorAll('.closet-item');
        if (itemsElements.length === 0) return;

        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;

        let closestItem = null;
        let minDistance = Infinity;

        itemsElements.forEach(item => {
            const itemRect = item.getBoundingClientRect();
            const itemCenter = itemRect.left + itemRect.width / 2;
            const distance = Math.abs(containerCenter - itemCenter);

            if (distance < minDistance) {
                minDistance = distance;
                closestItem = item;
            }
            item.classList.remove('active');
        });

        if (closestItem) {
            closestItem.classList.add('active');
        }
    }

    function updateCarouselArrows(container, items, alwaysShow = false) {
        if (!container) return;
        const carouselElement = container.closest('.carousel');
        if (!carouselElement) return;

        const leftArrow = carouselElement.querySelector('.carousel-arrow.left');
        const rightArrow = carouselElement.querySelector('.carousel-arrow.right');

        if (!leftArrow || !rightArrow) return;

        // For infinite scroll, always show arrows
        leftArrow.classList.toggle('hidden', !alwaysShow && items.length <= 1);
        rightArrow.classList.toggle('hidden', !alwaysShow && items.length <= 1);
    }

    // --- Menu Mode Logic ---
    function toggleMenuMode() {
        if (currentDisplayMode === 'menu') {
            enterCarouselMode();
        } else {
            enterMenuMode();
        }
    }

    function enterMenuMode() {
        currentDisplayMode = 'menu';
        searchInput.value = '';
        updateDisplayMode();
        filterAndDisplayItems();
    }

    function enterCarouselMode() {
        currentDisplayMode = 'carousel';
        updateDisplayMode();
        filterAndDisplayItems();
    }

    // --- Search Logic ---
    function handleSearch() {
        if (currentDisplayMode !== 'menu' && searchInput.value.length > 0) {
            enterMenuMode();
        } else if (currentDisplayMode === 'menu') {
            filterAndDisplayItems();
        }
    }

    // --- Item Interaction (Click/Double Click) ---
    function handleItemInteraction(event) {
        const itemElement = event.target.closest('.closet-item');
        if (!itemElement) return;

        const itemId = parseInt(itemElement.dataset.itemId, 10);
        const item = clothesData.find(i => i.id === itemId);
        if (!item) return;

        if (event.type === 'dblclick') {
            if (currentDisplayMode === 'comparing' && event.target.closest('.comparing-right')) {
            return;
            }
            
            // Toggle selection state if same item is clicked twice
            if ((item.type === 'clothes' && clothesSelected && selectedItem && selectedItem.id === item.id) ||
            (item.type === 'pants' && pantsSelected && selectedItem && selectedItem.id === item.id)) {
            // Deselect the item
            if (item.type === 'clothes') {
                clothesSelected = false;
            } else {
                pantsSelected = false;
            }
            
            // Remove border from this item
            document.querySelectorAll(`.carousel-items .closet-item[data-item-id="${item.id}"]`).forEach(el => {
                el.style.border = '';
            });
            
            // Update selected item if necessary
            selectedItem = clothesSelected || pantsSelected ? selectedItem : null;
            updateInfoArea(selectedItem);
            return;
            }
            
            selectedItem = item;
            
            // If item is not active, scroll it to center
            if (!itemElement.classList.contains('active')) {
            // Determine which carousel container to scroll
            let container;
            if (item.type === 'clothes' && currentView === 'suits') {
                container = clothesCarouselItems;
            } else if (item.type === 'pants' && currentView === 'suits') {
                container = pantsCarouselItems;
            } else if (currentView === 'single') {
                container = singleCarouselItems;
            }
            
            if (container) {
                // Calculate position to center the clicked item
                const containerWidth = container.clientWidth;
                const itemWidth = itemElement.offsetWidth;
                const itemRect = itemElement.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                const scrollOffset = container.scrollLeft + (itemRect.left - containerRect.left) - (containerWidth/2 - itemWidth/2);
                
                // Smooth scroll to center the item
                container.scrollTo({
                left: scrollOffset,
                behavior: 'smooth'
                });
            }
            }
            
            if (item.type === 'clothes') {
            clothesSelected = true;
            // Remove previous selection borders
            document.querySelectorAll('.carousel-items .closet-item').forEach(el => {
                if (el.dataset.itemType === 'clothes') {
                el.style.border = '';
                }
            });
            // Add border to selected clothes item
            document.querySelectorAll(`.carousel-items .closet-item[data-item-id="${item.id}"]`).forEach(el => {
                el.style.border = '2px solid #808080';
            });
            }
            else {
            pantsSelected = true;
            // Remove previous selection borders
            document.querySelectorAll('.carousel-items .closet-item').forEach(el => {
                if (el.dataset.itemType === 'pants') {
                el.style.border = '';
                }
            });
            // Add border to selected pants item
            document.querySelectorAll(`.carousel-items .closet-item[data-item-id="${item.id}"]`).forEach(el => {
                el.style.border = '2px solid #808080';
            });
            }
            if (currentView === 'single' || (currentView === 'suits' && clothesSelected && pantsSelected)) {
                enterSelectedMode(item);
            }
            else {
                updateInfoArea(item);
            }
            
        } else if (event.type === 'click') {
            if (currentDisplayMode === 'comparing' && event.target.closest('.comparing-right')) {
                if (itemElement.closest('#comparing-mode-container .comparing-right .closet-content')) {
                    selectItemForComparing(item);
                }
            }
        }
    }

    // --- Selected Mode Logic ---
    function enterSelectedMode(item) {
        selectedItem = item;
        currentDisplayMode = 'selected';

        if (selectedItemDisplay) {
            selectedItemDisplay.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
            `;
        } else {
            console.error("selectedItemDisplay not found");
        }

        updateInfoArea(item);
        updateDisplayMode();
    }

    // --- Comparing Mode Logic ---
    function enterComparingMode() {
        if (!selectedItem) return;
        currentDisplayMode = 'comparing';
        comparingItem = null;

        if (comparingLeft) {
            comparingLeft.innerHTML = `
                <div class="comparing-original-item">
                    <img src="${selectedItem.image}" alt="${selectedItem.name}">
                    <span>${selectedItem.name}</span>
                    <button id="comparing-original-tryon">Try On</button>
                </div>
            `;
            const originalTryonBtn = comparingLeft.querySelector('#comparing-original-tryon');
            if (originalTryonBtn) {
                originalTryonBtn.addEventListener('click', () => handleTryOn(selectedItem));
            } else {
                console.error("comparing-original-tryon button not found after creation");
            }
        } else {
            console.error("comparingLeft container not found");
        }

        if (comparingRightContent) {
            comparingRightContent.innerHTML = '<div id="menu-items-grid-comparing" class="menu-items-grid"></div>';
            const rightGrid = comparingRightContent.querySelector('#menu-items-grid-comparing');
            if (typeSelect.value === 'all' && currentView === 'single' && searchInput.value.length === 0) {
                displayItems(getFilteredData(selectedItem.type), 'menu', rightGrid);
            }
            else {
                displayItems(getFilteredData(), 'menu', rightGrid);
            }
        } else {
            console.error("comparingRightContent container not found");
        }

        updateInfoArea(selectedItem, null);
        updateDisplayMode();
    }

    function selectItemForComparing(item) {
        comparingItem = item;

        if (comparingRightContent) {
            comparingRightContent.innerHTML = `
                <div class="comparing-right-item">
                    <img src="${item.image}" alt="${item.name}">
                    <span>${item.name}</span>
                    <button id="comparing-new-tryon">Try On</button>
                </div>
            `;
            const newTryonBtn = comparingRightContent.querySelector('#comparing-new-tryon');
            if (newTryonBtn) {
                newTryonBtn.addEventListener('click', () => handleTryOn(comparingItem));
            } else {
                console.error("comparing-new-tryon button not found after creation");
            }
        } else {
            console.error("comparingRightContent container not found");
        }

        updateInfoArea(selectedItem, comparingItem);
    }

    // --- Info Area Update ---
    function updateInfoArea(item1, item2 = null) {
        if (!itemInfoContent) return;
        let infoHtml = "";
        if (item1) {
            infoHtml += `<div><strong>${item2 ? 'Original:' : 'Selected:'}</strong> ${item1.name}</div>`;
            infoHtml += `<div style="font-size:0.9em; color:#555;"><em>
            ${item1.description || 'No description.'}; Avaiable sizes: ${item1.available_sizes}</em></div>`;
        }
        if (item2) {
            infoHtml += `<hr style="margin: 5px 0; border: none; border-top: 1px solid #eee;">`;
            infoHtml += `<div><strong>Comparing:</strong> ${item2.name}</div>`;
            infoHtml += `<div style="font-size:0.9em; color:#555;"><em>
            ${item2.description || 'No description.'}; Avaiable sizes: ${item1.available_sizes}</em></div>`;
        }
        if (!item1 && !item2) {
            infoHtml = "<p>Double-click an item to see details or compare.</p>";
        }
        itemInfoContent.innerHTML = infoHtml;
    }

    // --- Try-On Placeholder ---
    function handleTryOn(item) {
        if (!item) return;
        console.log(`Placeholder: Trying on ${item.name} (ID: ${item.id})`);
        const tryingOnArea = document.getElementById('trying-on-area');
        if (tryingOnArea) tryingOnArea.textContent = `Trying on: ${item.name}`;
        const selectedOutfitArea = document.getElementById('selected-outfit');
        if (selectedOutfitArea) selectedOutfitArea.textContent = `Current Selection: ${item.name}`;
    }

    // --- Utility: Debounce ---
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // --- Start ---
    initializeCloset();
});