/**
 * JavaScript class responsible for building, maintaining and adding functionality
 * to Selector areas, such as the Report Builder's component selector and report selector.
 * 
 * @author Jacob Brooker
 * @version 1.1.0 - April 28th, 2017
 */

class GroupSelector {

	/**
	 * Constructor for the Selector object. It sets up a selector area
	 * using very specific required parameters.
	 * @param {String} viewSelector - CSS selector for the root element.
	 * @param {Array} categories - List of all category objects.
	 * @param {Object} elObj - Contains all necessary DOM elements as properties.
 	 * @param {Array} itemNames - Array of every item's name.
	 */
	constructor(viewSelector, categories, elObj, itemNames){
		this.viewSelector = viewSelector;
		this.categories = categories;
		this.els = elObj;
		this.itemNames = itemNames;

		// Click event for the search button:
		var context = this;
		this.els.searchBtn.click(function(){
			context.els.searchForm.submit();
		});

		// Add the autocomplete search feature.
		setUpAutocomplete(this.els.searchInput, this.itemNames);

		// Hide the action buttons by default.
		this.els.deleteCategoryBtn.hide();
		this.els.deleteItemBtn.hide();

		setUpGroupSearchForm(this.els.searchForm, this.els.searchInput,
		this.viewSelector + ' .selector-item', function(compEl){
			// Select the parent category and extend it.
			var category = compEl.closest('.selector-category');
			groupSlideDown(category);
			// Select it.
			compEl.click();
			// Scroll to the result, but first wait a fraction of a second.
			setTimeout(function(){
				scrollContainerTo(cv.el.categoryListBox, compEl);
			}, 400);
		});
	}

	showCategories(){
		this.els.categoryLoadBox.hide();
		this.els.categoryListBox.show();
	}

	showLoading(){
		this.els.categoryListBox.hide();
		this.els.categoryLoadBox.show();
	}

	/**
	 * Returns a Category DOM element using a category ID and Name.
	 * @param {int} categoryID
	 * @param {String} categoryName
	 */
	createCategoryElement(categoryID, categoryName){
		// Create a list item with the necessary data for future reference.
		var li = $('<li></li>');
		li.attr('data-category-id', categoryID)
		li.attr('data-selected', false);
		li.addClass('selector-category');
		// Title container.
		var titleContainer = $('<div></div>').addClass('category-title');
		// Create the Caret.
		var caret = ('<span class="glyphicon glyphicon-chevron-down caret-drop"></span>');
		// Create a 'p' tag with the name of the component,
		// and make sure it is initially hidden.
		var p = $('<p style="display:inline;"> ' + categoryName + '<p>');
		// Create an unordered list within the category list item.
		var componentList = $('<ul></ul>').hide();
		// Append the components.
		titleContainer.append(caret).append(p);
		li.append(titleContainer).append(componentList);

		// Add the click event.
		var context = this;
		li.click(function(e){
			selectItem(li, context.els.categoryList);
			toggleGroupSlide(li);
			context.els.deleteItemBtn.hide();
			context.els.deleteCategoryBtn.show();
		});
		
		return li;
	}


	/**
	 * Adds a Category element to the selector.
	 * @param {DOM Element} categoryElement
	 */
	addCategoryElement(categoryElement){
		categoryElement.appendTo(this.els.categoryList);
	}


	/**
	 * Removes a Category element from the selector.
	 * @param {int} categoryID
	 */
	removeCategoryElement(categoryID){
		getElementsWithAttr(this.viewSelector + ' .selector-category',
			'data-category-id', categoryID).first().remove();
	}


	/**
	 * Returns an Item DOM element using an ID, category ID, and a Name.
	 * @param {int} entryID
	 * @param {int} categoryID
	 * @param {String} entryName
	 */
	createItemElement(entryID, categoryID, entryName){
		// Create a list item with the necessary data for future reference.
		var li = $('<li></li>');
		li.attr('data-item-id', entryID);
		li.attr('data-category-id', categoryID);
		li.attr('data-selected', false);
		li.addClass('selector-item');
		// Create a 'p' tag with the name of the component.
		var p = $('<p>' + entryName + '<p>');
		// Append the components.
		p.appendTo(li);
		
		// Add the appropriate events
		var context = this;
		li.click(function(e){
			e.stopPropagation();
			selectItem(li, context.els.categoryList);
			// Call Edit action
			context.els.deleteCategoryBtn.hide();
			context.els.deleteItemBtn.show();
		});
		
		return li;
	}


	/**
	 * Adds an Item element to the selector, within it's parent category.
	 * @param {DOM Element} itemElement
	 * @param {int} categoryID
	 */
	addItemElement(itemElement, categoryID){
		catElement = getElementsWithAttr(this.viewSelector + ' .selector-category',
			'data-category-id', categoryID).first();
		catElement.find("ul").append(itemElement);
	}


	/**
	 * Removes an Item element from the selector.
	 * @param {int} categoryID
	 */
	removeItemElement(itemID){
		var l = getElementsWithAttr(this.viewSelector + ' .selector-item',
			'data-item-id', itemID).first();
		console.log(l);
		l.remove();
	}


	/**
	 * Returns the ID of the selected Category.
	 */
	getSelectedCategoryID(){
		return getSelectedElements(this.viewSelector + ' .selector-category')
			.first().attr('data-category-id');
	}


	/**
	 * Returns the ID of the selected Item.
	 */
	getSelectedItemID(){
		return getSelectedElements(this.viewSelector + ' .selector-item')
			.first().attr('data-item-id');
	}

}