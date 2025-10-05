// Copy this ENTIRE file and replace your existing JavaScript

function text_to_html(html)
{
	if (html.search(/^-/m) != -1)
	{
		html = html.replace(/^-(.*)$/m, '<ul><li>$1</li>')
		html = html.replace(/^-(.*)$/gm, '<li>$1</li>')
		index = html.lastIndexOf("</li>") + 5
		html = html.substring(0, index) + "</ul>" + html.substring(index)
	}
	
	html = html.replace(/\bd4\b/g, '<c>4</c>')
	html = html.replace(/\bd6\b/g, '<c>6</c>')
	html = html.replace(/\bd8\b/g, '<c>8</c>')
	html = html.replace(/\bd10\b/g, '<c>0</c>')
	html = html.replace(/\bd12\b/g, '<c>2</c>')
	html = html.replace(/\bPP\b/g, '<pp></pp>')
	html = html.replace(/\n/g, '<br>')
	html = html.replace(/\<\/li\>\<br\>/g, '</li>')
	html = html.replace(/\<\/li\>\<br\>/g, '</li>')
	html = html.replace(/\<\/ul\>\<br\>/g, '</ul>')
	html = html.replace(/&nbsp;/g, ' ')
	html = html.replace(/\[([^\[\]]*)]/g, '<ref>$1</ref>')

	return html
}	
function html_to_text(text)
{
	text = text.replace(/<c>4<\/c>/g, 'd4')
	text = text.replace(/<c>6<\/c>/g, 'd6')
	text = text.replace(/<c>8<\/c>/g, 'd8')
	text = text.replace(/<c>0<\/c>/g, 'd10')
	text = text.replace(/<c>2<\/c>/g, 'd12')
	text = text.replace(/<pp><\/pp>/g, 'PP')
	text = text.replace(/<br>/g, '\n')
	text = text.replace(/<ul>/g, '')
	text = text.replace(/<\/ul>/g, '')
	text = text.replace(/<li>/g, '- ')
	text = text.replace(/<\/li>/g, '\n')
	text = text.replace(/&nbsp;/g, ' ')
	text = text.replace(/<ref>([^<]*)<\/ref>/g, '[$1]')
	
	return text
}

function add_event_handlers(editable)
{
	editable.addEventListener("blur",function (event)
	{
		event.target.innerHTML = text_to_html(event.target.innerText)
		// ADDED: Rescan headers after content changes
		setTimeout(() => scanExistingHeaders(), 50);
	})
	editable.addEventListener("focus",function (event)
	{
		event.target.innerText = html_to_text(event.target.innerHTML)
	})
	
	if (editable.classList.contains("header"))
	{
		editable.addEventListener("keydown", function(event)
		{
			if (event.key != 'Enter') return;

			event.preventDefault();
			event.target.blur();
		})
	}
}
function init_event_handlers(parent)
{
	var editables = parent.querySelectorAll('div[contenteditable]')
	for (var e=0; e<editables.length; e++)
	{
		var editable = editables[e]
		add_event_handlers(editable)
	}
}

function get_parent_with_class(element, c)
{
	if (element === null)
	{
		return null;
	}

	if (element.classList.contains(c))
	{
		return element;
	}
	
	return get_parent_with_class(element.parentElement, c)
}

function save_character(e)
{
	var file = {}
	var data = {}
	file.version = 2;
	inputs = document.querySelectorAll('input, textarea, img, div[contenteditable], h2[contenteditable], c[contenteditable], span[contenteditable]')
	for (var i=0; i<inputs.length; i++)
	{
		var input = inputs[i]
		if (input.classList.contains('non-serialized') || input.classList.contains('no-print') || input.classList.contains('template'))
		{
			continue;
		}
		var non_serialized_parent = get_parent_with_class(input.parentElement, "non-serialized") || get_parent_with_class(input.parentElement, "no-print") || get_parent_with_class(input.parentElement, "template")
		if (non_serialized_parent)
		{
			continue;
		}
		
		id = input.id
		var spell_parent = get_parent_with_class(input.parentElement, "spell")
		if (spell_parent && spell_parent.classList.contains("template"))
		{
			continue
		}
		if (spell_parent !== null)
		{
			id = path_to(input.parentElement, "spells") + "/" + input.id
		}
		else if (input.parentElement.id == "talent" || input.parentElement.id == "weapon" || input.parentElement.id == "ability" || input.parentElement.id == "critical-injury")
		{
			id = input.parentElement.parentElement.id + "/" + Array.prototype.indexOf.call(input.parentElement.parentElement.children, input.parentElement) + "/" + input.id
		}
		if (input.id === '')
		{
			var elem = input
			var path = ''
			while (id === '' && elem.parentElement != null)
			{
				id = elem.parentElement.id
				path = Array.prototype.indexOf.call(elem.parentElement.children, elem) + "/" + path
				elem = elem.parentElement
			}
			id = id + "/" + path.slice(0, -1)
		}
		
		if (input.getAttribute("type") == "checkbox")
		{
			data[id] = input.checked
		}
		else if (input.tagName == "IMG")
		{
			data[id] = input.src
		}
		else if (input.tagName == "DIV" || input.tagName == "H2" || input.tagName == "C" || input.tagName == "SPAN")
		{
			data[id] = html_to_text(input.innerHTML)
		}
		else
		{
			data[id] = input.value
		}
		if (input.getAttribute("data-x") !== null)
		{
			data[id] = { value: data[id] }
			data[id].x = input.getAttribute("data-x")
			data[id].y = input.getAttribute("data-y")
			data[id].zoom = input.getAttribute("data-zoom")
		}
		if (input.getAttribute("data-style") !== null)
		{
			data[id] = { value: data[id] }
			data[id].style = input.getAttribute("data-style")
		}
	}
	file.data = data;
	
	var styles = {};
	styled_divs = document.querySelectorAll('div[data-style]')
	for (var i=0; i<styled_divs.length; i++)
	{
		var elem = styled_divs[i];
		var style = elem.getAttribute("data-style");
		var id = elem.id;
		var path = ''
		while (id === '' && elem.parentElement != null)
		{
			id = elem.parentElement.id
			path = Array.prototype.indexOf.call(elem.parentElement.children, elem) + "/" + path
			elem = elem.parentElement
		}
		id = id + "/" + path.slice(0, -1)
		styles[id] = style;
	}	
	if (Object.keys(styles).length)
	{
		file.styles = styles;
	}
	
	var uri = encodeURI("data:application/json;charset=utf-8," + JSON.stringify(file));
	uri = uri.replace(/#/g, '%23')
	var link = document.createElement("a");
	link.setAttribute("href", uri);
	var character_name = document.getElementById("character-name").innerText
	if (character_name == '') character_name = "unnamed"
	link.setAttribute("download", character_name + ".json");
	document.body.appendChild(link); // Required for FF
	link.click();
	link.remove();
}

function get_children(elem, i, version)
{	
	// Hack to remain backwards compatible
	var index = 0;
	for (var ip=0; ip<=i && index<elem.children.length; index++)
	{
		//if (elem.children[index].classList.contains('no-print')) continue;
		if (version === undefined && (elem.children[index].id == "remove-item" || elem.children[index].id == "context-menu-button")) continue;
		if (ip == i) break;
		
		ip++;
	}
	
	if (index == elem.children.length) return null

	return elem.children[index];
}

function get_element_from_path(i, version)
{
	var parts = i.split("/")
	var current = document.querySelector("div#" + parts[0])
	for (var p=1; p<parts.length; p++)
	{
		try
		{
			current = current.querySelector("#" + parts[p])
		}
		catch
		{
			current = get_children(current, parts[p], version);
		}
		if (current.getAttribute("data-onload") !== null)
		{
			window[current.getAttribute("data-onload")]({target: current})
			p = p - 1;
			current = current.parentElement;
		}
	}
	return current
}

function load_character(file)
{
	var version = file.version
	
	var data = file
	if (version >= 2)
	{
		data = file.data
	}
	
	for (var i in data)
	{
		var element = null
		var value = (typeof(data[i]) == 'object') ? data[i].value : data[i]
		if (!i.includes('/'))
		{
			element = document.getElementById(i)
		}
		else
		{
			var element = get_element_from_path(i, version);
		}
		
		if (element == null) continue;
		
		if (element.getAttribute("type") == "checkbox")
		{
			element.checked = value
		}
		else if (element.tagName == "IMG")
		{
			element.src = value
		}
		else if (element.tagName == "DIV" || element.tagName == "H2" || element.tagName == "C" || element.tagName == "SPAN")
		{
			element.innerHTML = text_to_html(value)
		}
		else
		{
			element.value = value
		}			
		if (typeof(data[i]) == 'object')
		{
			if (data[i].style != null)
			{
				element.setAttribute("data-style", data[i].style);
				element.classList.add(data[i].style);
			}
			if (data[i].x != null)
			{
				element.setAttribute("data-x", data[i].x)
				element.setAttribute("data-y", data[i].y)
				element.setAttribute("data-zoom", data[i].zoom)
				element.style.transform = 'translate(' + data[i].x + 'cm, ' + data[i].y + 'cm) scale(' + data[i].zoom + ', ' + data[i].zoom +')'
			}
		}
		if (element.onblur != null)
		{
			element.onblur({target: element})
		}
	}
	
	if (version >= 2 && file.styles != null)
	{
		for (var i in file.styles)
		{
			var elem = get_element_from_path(i, version);
			var style = file.styles[i];
			reset_trait_group(elem);
			elem.setAttribute("data-style", style);
			elem.classList.add(style);
		}		
	}
	
	// ADDED: Rescan headers after loading
	setTimeout(() => scanExistingHeaders(), 200);
}

function on_drag_enter(e)
{
	e.preventDefault()
	e.stopPropagation()
}
function on_drag_leave(e)
{
	e.preventDefault();
	e.stopPropagation();
}

function on_drop(e)
{
	on_drag_leave(e);
	
	e.preventDefault()
	e.stopPropagation()

   var blob = e.dataTransfer.files[0];
    var reader = new FileReader();
    reader.addEventListener("loadend", function()
    {
        var text = reader.result;
		var data = JSON.parse(text)
		load_character(data)
    });
    reader.readAsText(blob)
}

function add_group(e, class_name)
{
	var template = document.querySelector("." + class_name + ".template")
	new_group = template.cloneNode(true);
	new_group.classList.remove("template")
	e.target.parentElement.insertBefore(new_group, e.target)
	init_event_handlers(new_group)
	// ADDED: Rescan after adding new group
	setTimeout(() => scanExistingHeaders(), 50);
}

function add_trait_group(e)
{
	add_group(e, "trait-group")
}

function add_trait(e)
{
	add_group(e, "trait")
}
function update_attribute_positions()
{
	var attributes = document.querySelectorAll(".attribute:not(.template)")

	document.getElementById("attribute-curve").style.display = (attributes.length <= 1) ? "none" : "block";
	
    if (attributes.length == 1)
    {
        var a = attributes[0]
        a.style.left = ((115 + 176) * 0.5 + 3.5) + "mm"        
        a.style.top = "120mm"
		a.classList.remove("vertical");
		a.parentElement.classList.remove("vertical");
        return
    }

    for (var i=0; i<attributes.length; i++)
    {
        var a = attributes[i]
        var alpha = i / (attributes.length-1)

		var left = 115;
		var right = 176;
		var height = 10;
		var top = 107.5;
		
		if (attributes.length > 5)
		{
			a.classList.add("vertical");
			a.parentElement.classList.add("vertical");
		}
		else
		{
			a.classList.remove("vertical");
			a.parentElement.classList.remove("vertical");
		}
		
        var x = (right - left) * alpha + left + 3.5
        a.style.left = x + "mm"
        
        var y =  Math.sin(alpha * 3.1415926535) * height + top - 3
        a.style.top = y + "mm"
    }
}
function add_attribute(e)
{
	add_group(e, "attribute")
	update_attribute_positions();
	// ADDED: Rescan after adding attribute (FIX #2)
	setTimeout(() => scanExistingHeaders(), 50);
}
function remove_attribute(e)
{
	remove_item(e)
	update_attribute_positions();
}

function reset_trait_group(elem)
{
	elem.classList.remove("roles");
	elem.classList.remove("signature-asset");
	elem.classList.remove("abilities");
	elem.classList.remove("milestones");
	elem.classList.remove("values");
	elem.classList.remove("detailed-values");
	elem.classList.remove("stress");
	elem.removeAttribute("data-style");
}

function set_trait_group_name(e)
{
	if (e.target.parentElement.getAttribute("data-style") != null) return;

    reset_trait_group(e.target.parentElement);

	if (e.target.innerText.toLowerCase() == "roles")
	{
		e.target.parentElement.classList.add("values");
	}
	else if (e.target.innerText.toLowerCase() == "signature asset" || e.target.innerText.toLowerCase() == "signature assets")
	{
		e.target.parentElement.classList.add("signature-asset");
	}
	else if (e.target.innerText.toLowerCase() == "milestones")
	{
		e.target.parentElement.classList.add("milestones");
	}
	else if (e.target.innerText.toLowerCase() == "values")
	{
		e.target.parentElement.classList.add("values");
	}
	else if (e.target.innerText.toLowerCase() == "emotions")
	{
		e.target.parentElement.classList.add("values");
	}
	else if (e.target.innerText.toLowerCase() == "skills")
	{
		e.target.parentElement.classList.add("values");
	}
	else if (e.target.innerText.toLowerCase() == "specialties")
	{
		e.target.parentElement.classList.add("values");
	}
	else if (e.target.innerText.toLowerCase() == "resource")
	{
		e.target.parentElement.classList.add("resources");
	}
	else if (e.target.innerText.toLowerCase() == "resources")
	{
		e.target.parentElement.classList.add("resources");
	}
	else if (e.target.innerText.toLowerCase() == "stress")
	{
		e.target.parentElement.classList.add("stress");
	}
}

g_dragging = false;
g_drag_x = 0
g_drag_y = 0
function start_drag(e)
{
	g_dragging = true
	e.target.setPointerCapture(e.pointerId)
	g_drag_x = e.pageX
	g_drag_y = e.pageY
	if (e.ctrlKey)
	{
		g_drag_y -= (e.target.getAttribute('data-zoom') - 1.0) * -500.0
	}
	else
	{
		g_drag_x -= e.target.getAttribute('data-x') * 96.0 / 2.54
		g_drag_y -= e.target.getAttribute('data-y') * 96.0 / 2.54
	}
}
function end_drag(e)
{
	g_dragging = false
	e.target.releasePointerCapture(e.pointerId)
	e.preventDefault()
	e.stopPropagation()
}
function drag_move(e)
{
	if (!g_dragging) return;
	
	var x = (e.pageX - g_drag_x)
	var y = (e.pageY - g_drag_y)
	if (e.ctrlKey)
	{
		var zoom = y / -500.0 + 1.0
		x = parseFloat(e.target.getAttribute('data-x'))
		y = parseFloat(e.target.getAttribute('data-y'))
		e.target.setAttribute('data-zoom', zoom)
		e.target.style.transform = 'translate(' + x + 'cm, ' + y + 'cm) scale(' + zoom + ', ' + zoom +')'
	}
	else
	{
		x *= 2.54 / 96.0
		y *= 2.54 / 96.0
		var zoom = e.target.getAttribute('data-zoom')
		e.target.setAttribute('data-x', x)
		e.target.setAttribute('data-y', y)
		e.target.style.transform = 'translate(' + x + 'cm, ' + y + 'cm) scale(' + zoom + ', ' + zoom +')'
	}
}

g_modal_callback = null
function close_modal(e)
{
	var modals = document.querySelectorAll(".modal")
	for (var m=0; m<modals.length; m++)
	{
		modals[m].style.display = 'none'
	}
	var bg = document.getElementById("modal-bg")
	bg.style.display = 'none'
	if (g_modal_callback != null)
	{
		g_modal_callback()
		g_modal_callback = null
	}
}
function show_modal(id, left, top, callback)
{
	g_modal_callback = callback
	var bg = document.getElementById("modal-bg")
	bg.style.display = 'block'
	var modal = document.getElementById(id)
	modal.style.display = 'block'
	modal.style.left = left
	modal.style.top = top
	var input = modal.querySelector("input");
	if (input != null)
	{
		modal.querySelector("input").select()
	}
}

function change_image_url(e)
{
	var url = document.querySelector("#url-modal input")
	var img = e.target.parentElement.querySelector("img")
	url.value = img.src
	show_modal("url-modal", e.pageX, e.pageY, function()
	{
		img.src = url.value
		img.setAttribute("data-x", 0)
		img.setAttribute("data-y", 0)
		img.setAttribute("data-zoom", 1)
		img.style.transform = 'translate(0, 0) scale(1)'
	})
}
function show_help(e)
{
	show_modal("help-modal", e.pageX, e.pageY, function()
	{
	});
}

function remove_item(elem)
{
	var item = elem.target.parentElement
	item.parentElement.removeChild(item)
}

var g_context_target = null;
function show_context_menu(e)
{
	g_context_target = e.target;

	var rect = e.target.getBoundingClientRect();
	var x = rect.left + "px";
	var y = rect.top + "px";
	
	var menu = document.getElementById("context-menu");
	var styles = document.querySelectorAll("#context-menu #styles input");
	var found = false;
	for (var i=0; i<styles.length; i++)
	{
		var style = styles[i].getAttribute("data-style");
		var checked = e.target.parentElement.classList.contains(style);
		styles[i].checked = checked
		found = found || checked
	}
	if (!found)
	{
		document.getElementById("style-default").checked = true;
	}
	
	show_modal("context-menu", x, y, function()
	{
		var menu = document.getElementById("context-menu");
		menu.style.display = 'none'
	});
}

function set_style(e)
{
	reset_trait_group(g_context_target.parentElement);
	var style = e.target.getAttribute("data-style");
	if (style != null)
	{
		g_context_target.parentElement.classList.add(style);
		g_context_target.parentElement.setAttribute("data-style", style);
	}
	g_context_target = null;
	close_modal(null);
}

function context_menu_remove_item(e)
{
	remove_item({target: g_context_target});
	g_context_target = null;
	close_modal(null);
}

window.onload = function()
{
	document.addEventListener("keydown", function(e)
	{
		if ((window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) && e.keyCode == 83)
		{
			e.preventDefault()
			save_character(e)
		}
	}, false);

	init_event_handlers(document)
}

// ============================================================================
// DICE POOL SYSTEM - COMPLETE WITH ALL FIXES
// ============================================================================

let dicePool = [];
let dicePoolPanel = null;
let rollHistory = [];

// Convert <c> value to die notation
function getDieFromCValue(cValue) {
    const val = parseInt(cValue);
    switch(val) {
        case 4: return "d4";
        case 6: return "d6";
        case 8: return "d8";
        case 0: return "d10";
        case 2: return "d12";
        default: return null;
    }
}

// Get die value from header at the moment of clicking
function getDieFromHeader(header) {
    // Check if this is part of an attribute (header is actually the nameDiv in attributes)
    const parentAttribute = header.closest('.attribute');
    if (parentAttribute) {
        return getDieFromAttribute(parentAttribute);
    }
    
    // Otherwise it's a regular h2 header with <c> inside
    let cTag = header.querySelector('c');
    
    if (!cTag) {
        console.log("No <c> tag found for this header");
        return null;
    }
    
    const cValue = cTag.innerText || cTag.textContent;
    const dieValue = getDieFromCValue(cValue);
    console.log("Found die value:", dieValue, "from <c> tag:", cValue);
    return dieValue;
}

// Store reference to header element
function attachDiceIcon(header) {
    const existingIcon = header.querySelector(".dice-icon");
    if (existingIcon) {
        existingIcon.remove();
    }
    
    const cTag = header.querySelector('c');
    if (!cTag) {
        return;
    }

    const icon = document.createElement("span");
    icon.classList.add("dice-icon");
    // Use SVG instead of emoji for better aesthetics
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 20 20" style="vertical-align: middle;">
        <rect x="2" y="2" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="6" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
    </svg>`;
    icon.style.cursor = "pointer";
    icon.style.marginLeft = "5px";
    icon.style.display = "inline-block";
    icon.style.userSelect = "none";
    icon.style.color = "#C50852";

    icon.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const dieValue = getDieFromHeader(header);
        console.log("Dice icon clicked for header:", header.innerText, "Die:", dieValue);
        
        if (!dieValue) {
            console.warn("No die value found for this header");
            return;
        }

        // Get the name from the previous sibling h2 if it exists (for distinctions/traits)
        let nameElement = header;
        const prevSibling = header.previousElementSibling;
        if (prevSibling && prevSibling.tagName === 'H2' && prevSibling.classList.contains('inline')) {
            nameElement = prevSibling;
        }

        dicePool.push({ 
            header: header,
            nameElement: nameElement,
            value: dieValue, 
            selected: false 
        });
        
        if (!dicePoolPanel) createDicePoolPanel();
        updateDicePoolPanel();
    });

    header.appendChild(icon);
}

// Scan all headers and attach dice icons
function scanExistingHeaders() {
    console.log("Scanning for headers with dice values...");
    
    document.querySelectorAll(".dice-icon").forEach(icon => icon.remove());
    
    let headersFound = 0;
    
    // Handle trait-groups and traits (h2 with <c> inside)
    const h2Selectors = [
        ".trait-group h2:not(.template h2)",
        ".trait h2:not(.template h2)"
    ];
    
    h2Selectors.forEach(selector => {
        const headers = document.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${headers.length} headers`);
        
        headers.forEach(header => {
            if (header.querySelector('c')) {
                attachDiceIcon(header);
                headersFound++;
            }
        });
    });
    
    // Handle attributes (different structure: <c> and <div> are siblings)
    const attributes = document.querySelectorAll('.attribute:not(.template)');
    console.log(`Found ${attributes.length} attributes`);
    
    attributes.forEach(attr => {
        const cTag = attr.querySelector('c');
        const nameDiv = attr.querySelector('div[contenteditable]');
        
        if (cTag && nameDiv) {
            attachDiceIconToAttribute(attr, nameDiv);
            headersFound++;
        }
    });
    
    console.log(`Total headers with dice icons: ${headersFound}`);
}

// Attach dice icon specifically for attributes
function attachDiceIconToAttribute(attributeElement, nameDiv) {
    const existingIcon = nameDiv.querySelector(".dice-icon");
    if (existingIcon) {
        existingIcon.remove();
    }

    const icon = document.createElement("span");
    icon.classList.add("dice-icon");
    // Use SVG instead of emoji
    icon.innerHTML = `<svg width="14" height="14" viewBox="0 0 20 20" style="vertical-align: middle;">
        <rect x="2" y="2" width="16" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/>
        <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="6" r="1.5" fill="currentColor"/>
        <circle cx="6" cy="14" r="1.5" fill="currentColor"/>
        <circle cx="14" cy="14" r="1.5" fill="currentColor"/>
    </svg>`;
    icon.style.cursor = "pointer";
    icon.style.marginLeft = "5px";
    icon.style.display = "inline-block";
    icon.style.userSelect = "none";
    icon.style.color = "#C50852";

    icon.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        const dieValue = getDieFromAttribute(attributeElement);
        console.log("Dice icon clicked for attribute, Die:", dieValue);
        
        if (!dieValue) {
            console.warn("No die value found for this attribute");
            return;
        }

        dicePool.push({ 
            header: nameDiv, 
            attributeElement: attributeElement,
            value: dieValue, 
            selected: false,
            isAttribute: true
        });
        
        if (!dicePoolPanel) createDicePoolPanel();
        updateDicePoolPanel();
    });

    nameDiv.appendChild(icon);
}

// Get die value from attribute element
function getDieFromAttribute(attributeElement) {
    const cTag = attributeElement.querySelector('c');
    
    if (!cTag) {
        console.log("No <c> tag found in attribute");
        return null;
    }
    
    const cValue = cTag.innerText || cTag.textContent;
    const dieValue = getDieFromCValue(cValue);
    console.log("Found die value:", dieValue, "from attribute <c> tag:", cValue);
    return dieValue;
}

// Observe for dynamically added content
let headerObserver = null;

function observeNewHeaders() {
    if (headerObserver) return;
    
    headerObserver = new MutationObserver((mutations) => {
        let shouldRescan = false;
        
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) {
                    if (node.matches && (node.matches('.trait-group') || node.matches('.attribute') || node.matches('.trait'))) {
                        shouldRescan = true;
                    }
                    
                    if (node.matches && node.matches('c')) {
                        shouldRescan = true;
                    }
                    
                    // FIX #2: Also watch for h2 tags (for attributes)
                    if (node.matches && node.matches('h2')) {
                        shouldRescan = true;
                    }
                    
                    if (node.querySelector) {
                        if (node.querySelector('.trait-group, .attribute, .trait, c, h2')) {
                            shouldRescan = true;
                        }
                    }
                }
            });
        });
        
        if (shouldRescan) {
            console.log("Content changed, rescanning headers...");
            setTimeout(() => scanExistingHeaders(), 100);
        }
    });
    
    headerObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });
}

// Create the dice pool panel
function createDicePoolPanel() {
    dicePoolPanel = document.createElement("div");
    dicePoolPanel.id = "dice-pool-panel";
    dicePoolPanel.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #fff;
        border: 2px solid #C50852;
        border-radius: 8px;
        padding: 15px;
        z-index: 10000;
        max-width: 300px;
        font-family: sans-serif;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    document.body.appendChild(dicePoolPanel);
}

// Update the dice pool panel display
function updateDicePoolPanel() {
    if (!dicePoolPanel) return;
    
    dicePoolPanel.innerHTML = "<div style='font-weight: bold; margin-bottom: 10px; font-size: 16px;'>🎲 Dice Pool</div>";

    if (dicePool.length === 0) {
        dicePoolPanel.innerHTML += "<div style='color: #666; font-style: italic;'>Click dice icons to add dice</div>";
    }

    const groupedDice = {};
    dicePool.forEach((die, index) => {
        // Re-read die value based on whether it's an attribute or regular header
        let currentDieValue;
        if (die.isAttribute && die.attributeElement) {
            currentDieValue = getDieFromAttribute(die.attributeElement);
        } else {
            currentDieValue = getDieFromHeader(die.header);
        }
        const dieKey = currentDieValue || die.value;
        
        if (!groupedDice[dieKey]) {
            groupedDice[dieKey] = [];
        }
        groupedDice[dieKey].push({ ...die, index, actualValue: dieKey });
    });

    Object.keys(groupedDice).sort().forEach(dieValue => {
        const diceGroup = groupedDice[dieValue];
        const count = diceGroup.length;
        
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "margin: 5px 0; display: flex; align-items: center; gap: 8px;";
        
        const span = document.createElement("span");
        span.style.cssText = `
            padding: 8px 14px;
            border: 2px solid #C50852;
            background: #fff;
            color: #000;
            display: inline-block;
            border-radius: 4px;
            font-weight: bold;
            min-width: 50px;
            text-align: center;
            font-size: 15px;
        `;
        
        const diceIcon = createDiceIcon(dieValue);
        span.innerHTML = count > 1 ? `${diceIcon} × ${count}` : diceIcon;
        
        const removeBtn = document.createElement("button");
        removeBtn.textContent = "×";
        removeBtn.style.cssText = `
            background: #ff4444;
            color: white;
            border: none;
            border-radius: 3px;
            width: 24px;
            height: 24px;
            cursor: pointer;
            font-size: 18px;
            line-height: 1;
            margin-left: auto;
        `;
        removeBtn.addEventListener("click", () => {
            const indexToRemove = diceGroup[0].index;
            dicePool.splice(indexToRemove, 1);
            if (dicePool.length === 0) {
                dicePoolPanel.remove();
                dicePoolPanel = null;
            } else {
                updateDicePoolPanel();
            }
        });

        wrapper.appendChild(span);
        wrapper.appendChild(removeBtn);
        dicePoolPanel.appendChild(wrapper);
    });

    const btnContainer = document.createElement("div");
    btnContainer.style.cssText = "margin-top: 15px; display: flex; gap: 8px;";
    
    const rollBtn = document.createElement("button");
    rollBtn.textContent = "Roll Dice";
    rollBtn.style.cssText = `
        flex: 1;
        background: #C50852;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    `;
    rollBtn.addEventListener("click", rollDicePool);
    
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear All";
    clearBtn.style.cssText = `
        background: #666;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 4px;
        cursor: pointer;
    `;
    clearBtn.addEventListener("click", () => {
        dicePool = [];
        dicePoolPanel.remove();
        dicePoolPanel = null;
    });
    
    btnContainer.appendChild(rollBtn);
    btnContainer.appendChild(clearBtn);
    dicePoolPanel.appendChild(btnContainer);
}

function createDiceIcon(dieValue) {
    let number;
    switch(dieValue) {
        case 'd4': number = '4'; break;
        case 'd6': number = '6'; break;
        case 'd8': number = '8'; break;
        case 'd10': number = '0'; break;
        case 'd12': number = '2'; break;
        default: number = dieValue.replace('d', '');
    }
    
    return `<c style="display: inline-block;">${number}</c>`;
}

function rollDicePool() {
    if (dicePool.length === 0) {
        alert("Add some dice to the pool first!");
        return;
    }

    const results = dicePool.map(d => {
        // Get the current die value based on type
        let currentValue;
        if (d.isAttribute && d.attributeElement) {
            currentValue = getDieFromAttribute(d.attributeElement);
        } else {
            currentValue = getDieFromHeader(d.header);
        }
        currentValue = currentValue || d.value;
        
        let size = parseInt(currentValue.replace("d", ""));
        const roll = Math.floor(Math.random() * size) + 1;
        
        // Get clean header text without HTML
        let headerText;
        if (d.isAttribute && d.header) {
            // For attributes, clone the element and remove the dice icon before getting text
            const tempDiv = d.header.cloneNode(true);
            const icon = tempDiv.querySelector('.dice-icon');
            if (icon) icon.remove();
            headerText = tempDiv.textContent.trim();
        } else if (d.nameElement && d.nameElement !== d.header) {
            // Use the name element (previous sibling h2) if it exists
            headerText = d.nameElement.innerText.trim();
        } else {
            // Fallback to the header itself
            const tempHeader = d.header.cloneNode(true);
            const icon = tempHeader.querySelector('.dice-icon');
            if (icon) icon.remove();
            // Also remove the <c> tag to get just the name
            const cTag = tempHeader.querySelector('c');
            if (cTag) cTag.remove();
            headerText = tempHeader.textContent.trim();
        }
        
        return { 
            header: headerText, 
            die: currentValue, 
            roll: roll,
            size: size,
            id: Math.random()
        };
    });

    showRollResultsPanel(results);
}

function showRollResultsPanel(results) {
    const oldPanel = document.getElementById("roll-results-panel");
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement("div");
    panel.id = "roll-results-panel";
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 3px solid #C50852;
        border-radius: 10px;
        padding: 20px;
        z-index: 10001;
        min-width: 350px;
        max-width: 500px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        font-family: sans-serif;
    `;

    let selectedTotal = [];
    let selectedEffect = null;

    const hitches = results.filter(r => r.roll === 1);
    const selectableDice = results.filter(r => r.roll !== 1);
    
    // FIX #1: Auto-fill and auto-select when less than 3 dice
    let autoD4 = null;
    if (selectableDice.length < 3) {
        autoD4 = {
            header: "Plot Die",
            die: "d4",
            roll: 0,
            size: 4,
            id: 'auto-d4',
            isAutoD4: true
        };
        selectedEffect = 'auto-d4';
        selectedTotal = selectableDice.map(d => d.id);
    }

    const title = document.createElement("div");
    title.innerHTML = "<strong style='font-size: 18px;'>🎲 Roll Results - Select Dice</strong>";
    title.style.marginBottom = "15px";
    panel.appendChild(title);

    const instructions = document.createElement("div");
    instructions.style.cssText = "color: #666; margin-bottom: 15px; font-size: 13px; line-height: 1.4;";
    if (autoD4) {
        instructions.innerHTML = "Click to select <strong>up to 2 dice</strong> for your total<br><em>(Effect is automatically d4)</em>";
    } else {
        instructions.innerHTML = "Click to select:<br>• <strong>2 dice</strong> for your total<br>• <strong>1 die</strong> for effect";
    }
    panel.appendChild(instructions);

    if (!autoD4) {
        const autoButtonsDiv = document.createElement("div");
        autoButtonsDiv.style.cssText = "display: flex; gap: 8px; margin-bottom: 15px;";
        
        const maxTotalBtn = document.createElement("button");
        maxTotalBtn.textContent = "Max Total";
        maxTotalBtn.style.cssText = `
            flex: 1;
            background: #C50852;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
        `;
        maxTotalBtn.addEventListener("click", () => {
            // Sort by roll value descending, then by die size ascending (smaller dice first when tied)
            const sorted = [...selectableDice].sort((a, b) => {
                if (b.roll !== a.roll) {
                    return b.roll - a.roll; // Higher rolls first
                }
                return a.size - b.size; // If tied, smaller die first (better for effect)
            });
            selectedTotal = [sorted[0].id, sorted[1].id];
            selectedEffect = sorted[2] ? sorted[2].id : null;
            updateResultsDisplay();
        });
        
        const maxEffectBtn = document.createElement("button");
        maxEffectBtn.textContent = "Max Effect";
        maxEffectBtn.style.cssText = `
            flex: 1;
            background: #FFA500;
            color: white;
            border: none;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: bold;
        `;
        maxEffectBtn.addEventListener("click", () => {
            const maxSize = Math.max(...selectableDice.map(d => d.size));
            const maxSizeDice = selectableDice.filter(d => d.size === maxSize);
            const effectDie = maxSizeDice.sort((a, b) => a.roll - b.roll)[0];
            const remainingDice = selectableDice.filter(d => d.id !== effectDie.id);
            const totalDice = remainingDice.sort((a, b) => b.roll - a.roll).slice(0, 2);
            
            selectedEffect = effectDie.id;
            selectedTotal = totalDice.map(d => d.id);
            updateResultsDisplay();
        });
        
        autoButtonsDiv.appendChild(maxTotalBtn);
        autoButtonsDiv.appendChild(maxEffectBtn);
        panel.appendChild(autoButtonsDiv);
    }

    const resultsContainer = document.createElement("div");
    resultsContainer.style.marginBottom = "15px";

    function updateResultsDisplay() {
        resultsContainer.innerHTML = "";
        
        selectableDice.forEach(result => {
            const resultDiv = document.createElement("div");
            const isTotal = selectedTotal.includes(result.id);
            const isEffect = selectedEffect === result.id;
            
            let bgColor = "#f5f5f5";
            let borderColor = "#ccc";
            let textColor = "#000";
            let label = "";
            
            if (isTotal) {
                bgColor = "#90C490";
                borderColor = "#90C490";
                textColor = "#000";
                label = " 📊";
            } else if (isEffect) {
                bgColor = "#FFA500";
                borderColor = "#FFA500";
                textColor = "#fff";
                label = " ⭐";
            }
            
            resultDiv.style.cssText = `
                padding: 12px;
                margin: 8px 0;
                border: 2px solid ${borderColor};
                background: ${bgColor};
                color: ${textColor};
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 16px;
                transition: all 0.2s;
            `;
            
            const diceIcon = createDiceIcon(result.die);
            const rollDisplay = result.isAutoD4 ? '' : `: ${result.roll}`;
            resultDiv.innerHTML = `
                <span><strong>${diceIcon}</strong>${rollDisplay}</span>
                <span style="font-size: 14px;">${label}</span>
            `;
            
            resultDiv.addEventListener("click", () => {
                if (isTotal) {
                    selectedTotal = selectedTotal.filter(id => id !== result.id);
                } else if (isEffect) {
                    selectedEffect = null;
                } else {
                    if (result.isEffectOnly) {
                        selectedEffect = result.id;
                    } else {
                        if (selectedTotal.length < 2) {
                            selectedTotal.push(result.id);
                        } else if (selectedEffect === null) {
                            selectedEffect = result.id;
                        } else {
                            selectedEffect = result.id;
                        }
                    }
                }
                updateResultsDisplay();
            });
            
            resultsContainer.appendChild(resultDiv);
        });
        
        if (autoD4) {
            const d4Div = document.createElement("div");
            const isEffect = selectedEffect === autoD4.id;
            
            let bgColor = isEffect ? "#FFA500" : "#f5f5f5";
            let borderColor = isEffect ? "#FFA500" : "#ccc";
            let textColor = isEffect ? "#fff" : "#000";
            
            d4Div.style.cssText = `
                padding: 12px;
                margin: 8px 0;
                border: 2px solid ${borderColor};
                background: ${bgColor};
                color: ${textColor};
                border-radius: 6px;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 16px;
                transition: all 0.2s;
            `;
            
            const diceIcon = createDiceIcon(autoD4.die);
            d4Div.innerHTML = `
                <span><strong>${diceIcon}</strong> <em style="font-size: 13px;">(Effect only)</em></span>
                <span style="font-size: 14px;">${isEffect ? '⭐' : ''}</span>
            `;
            
            d4Div.addEventListener("click", () => {
                if (isEffect) {
                    selectedEffect = null;
                } else {
                    selectedEffect = autoD4.id;
                }
                updateResultsDisplay();
            });
            
            resultsContainer.appendChild(d4Div);
        }
        
        if (hitches.length > 0) {
            const hitchHeader = document.createElement("div");
            hitchHeader.style.cssText = "margin-top: 15px; margin-bottom: 5px; font-weight: bold; color: #666; font-size: 13px;";
            hitchHeader.textContent = "⚠️ HITCHES (Not Selectable)";
            resultsContainer.appendChild(hitchHeader);
            
            hitches.forEach(result => {
                const hitchDiv = document.createElement("div");
                hitchDiv.style.cssText = `
                    padding: 10px;
                    margin: 5px 0;
                    border: 2px solid #ffc107;
                    background: #fff3cd;
                    color: #856404;
                    border-radius: 6px;
                    font-size: 15px;
                    opacity: 0.7;
                `;
                
                const diceIcon = createDiceIcon(result.die);
                hitchDiv.innerHTML = `<strong>${diceIcon}</strong>: 1`;
                resultsContainer.appendChild(hitchDiv);
            });
        }
    }

    updateResultsDisplay();
    panel.appendChild(resultsContainer);

    const summaryDiv = document.createElement("div");
    summaryDiv.id = "roll-summary";
    summaryDiv.style.cssText = `
        background: #f9f9f9;
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 15px;
        min-height: 60px;
        border: 1px solid #ddd;
    `;
    panel.appendChild(summaryDiv);

    function updateSummary() {
        const totalDice = selectableDice.filter(r => selectedTotal.includes(r.id));
        let effectDie = selectableDice.find(r => selectedEffect === r.id);
        if (!effectDie && autoD4 && selectedEffect === autoD4.id) {
            effectDie = autoD4;
        }
        
        let summaryHTML = "";
        
        if (totalDice.length > 0) {
            const totalSum = totalDice.reduce((sum, d) => sum + d.roll, 0);
            summaryHTML += `<div style="margin-bottom: 8px;"><strong>📊 Total:</strong> ${totalSum}`;
            summaryHTML += ` <span style="color: #666; font-size: 13px;">(${totalDice.map(d => d.roll).join(" + ")})</span></div>`;
        }
        
        if (effectDie) {
            const effectIcon = createDiceIcon(effectDie.die);
            summaryHTML += `<div><strong>⭐ Effect:</strong> ${effectIcon}</div>`;
        }
        
        if (summaryHTML === "") {
            summaryHTML = "<em style='color: #999;'>Select your dice...</em>";
        }
        
        summaryDiv.innerHTML = summaryHTML;
    }

    const originalUpdate = updateResultsDisplay;
    updateResultsDisplay = function() {
        originalUpdate();
        updateSummary();
    };
    updateSummary();

    const btnContainer = document.createElement("div");
    btnContainer.style.cssText = "display: flex; gap: 10px;";
    
    const confirmBtn = document.createElement("button");
    confirmBtn.textContent = "Confirm";
    confirmBtn.style.cssText = `
        flex: 1;
        background: #28a745;
        color: white;
        border: none;
        padding: 12px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        font-size: 15px;
    `;
    confirmBtn.addEventListener("click", () => {
        if (selectedTotal.length === 0 && selectedEffect === null) {
            alert("Please select at least one die!");
            return;
        }
        
        const totalDice = selectableDice.filter(r => selectedTotal.includes(r.id));
        let effectDie = selectableDice.find(r => selectedEffect === r.id);
        if (!effectDie && autoD4 && selectedEffect === autoD4.id) {
            effectDie = autoD4;
        }
        const totalSum = totalDice.reduce((sum, d) => sum + d.roll, 0);
        
        const historyEntry = {
            timestamp: new Date(),
            allResults: results,
            totalDice: totalDice,
            effectDie: effectDie,
            totalSum: totalSum,
            hitches: hitches
        };
        
        rollHistory.unshift(historyEntry);
        if (rollHistory.length > 20) rollHistory.pop();
        
        // Post to Discord if enabled
        if (typeof window.postRollToDiscord === 'function') {
            window.postRollToDiscord(historyEntry);
        }
        
        panel.remove();
        dicePool = [];
        if (dicePoolPanel) {
            dicePoolPanel.remove();
            dicePoolPanel = null;
        }
    });
    
    const rerollBtn = document.createElement("button");
    rerollBtn.textContent = "Reroll";
    rerollBtn.style.cssText = `
        background: #007bff;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
    `;
    rerollBtn.addEventListener("click", () => {
        panel.remove();
        rollDicePool();
    });
    
    btnContainer.appendChild(confirmBtn);
    btnContainer.appendChild(rerollBtn);
    panel.appendChild(btnContainer);

    document.body.appendChild(panel);
}

function showRollHistory() {
    const oldPanel = document.getElementById("roll-history-panel");
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement("div");
    panel.id = "roll-history-panel";
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 3px solid #C50852;
        border-radius: 10px;
        padding: 20px;
        z-index: 10002;
        width: 450px;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        font-family: sans-serif;
    `;

    const title = document.createElement("div");
    title.innerHTML = "<strong style='font-size: 18px;'>📜 Roll History</strong>";
    title.style.marginBottom = "15px";
    panel.appendChild(title);

    if (rollHistory.length === 0) {
        const emptyMsg = document.createElement("div");
        emptyMsg.style.cssText = "color: #666; font-style: italic; text-align: center; padding: 20px;";
        emptyMsg.textContent = "No rolls yet. Roll some dice to see history!";
        panel.appendChild(emptyMsg);
    } else {
        rollHistory.forEach((entry, index) => {
            const entryDiv = document.createElement("div");
            entryDiv.style.cssText = `
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 12px;
                background: #f9f9f9;
            `;

            const timeDiv = document.createElement("div");
            timeDiv.style.cssText = "color: #666; font-size: 12px; margin-bottom: 8px;";
            const time = entry.timestamp;
            timeDiv.textContent = `${time.toLocaleTimeString()}`;
            entryDiv.appendChild(timeDiv);

            const allDiceDiv = document.createElement("div");
            allDiceDiv.style.cssText = "margin-bottom: 8px; font-size: 13px;";
            const diceList = entry.allResults.map(r => {
                const icon = createDiceIcon(r.die);
                return `${icon}: ${r.roll}`;
            }).join(", ");
            allDiceDiv.innerHTML = `<strong>Rolled:</strong> ${diceList}`;
            entryDiv.appendChild(allDiceDiv);

            if (entry.totalDice.length > 0) {
                const totalDiv = document.createElement("div");
                totalDiv.style.cssText = "margin-bottom: 4px; font-size: 14px;";
                const totalDiceStr = entry.totalDice.map(d => d.roll).join(" + ");
                totalDiv.innerHTML = `<strong>📊 Total:</strong> ${entry.totalSum} <span style="color: #666; font-size: 12px;">(${totalDiceStr})</span>`;
                entryDiv.appendChild(totalDiv);
            }

            if (entry.effectDie) {
                const effectDiv = document.createElement("div");
                effectDiv.style.cssText = "margin-bottom: 4px; font-size: 14px;";
                const effectIcon = createDiceIcon(entry.effectDie.die);
                effectDiv.innerHTML = `<strong>⭐ Effect:</strong> ${effectIcon}`;
                entryDiv.appendChild(effectDiv);
            }

            if (entry.hitches.length > 0) {
                const hitchDiv = document.createElement("div");
                hitchDiv.style.cssText = "font-size: 13px; color: #856404;";
                const hitchIcons = entry.hitches.map(h => createDiceIcon(h.die)).join(", ");
                hitchDiv.innerHTML = `<strong>⚠️ Hitches:</strong> ${hitchIcons}`;
                entryDiv.appendChild(hitchDiv);
            }

            panel.appendChild(entryDiv);
        });
    }

    const closeBtn = document.createElement("button");
    closeBtn.textContent = "Close";
    closeBtn.style.cssText = `
        width: 100%;
        background: #666;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        margin-top: 10px;
    `;
    closeBtn.addEventListener("click", () => panel.remove());
    panel.appendChild(closeBtn);

    if (rollHistory.length > 0) {
        const clearBtn = document.createElement("button");
        clearBtn.textContent = "Clear History";
        clearBtn.style.cssText = `
            width: 100%;
            background: #ff4444;
            color: white;
            border: none;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            margin-top: 8px;
        `;
        clearBtn.addEventListener("click", () => {
            if (confirm("Clear all roll history?")) {
                rollHistory = [];
                panel.remove();
            }
        });
        panel.appendChild(clearBtn);
    }

    document.body.appendChild(panel);
}

let diceSystemInitialized = false;

function initializeDiceSystem() {
    if (diceSystemInitialized) {
        console.log("Dice system already initialized");
        return;
    }
    diceSystemInitialized = true;
    
    console.log("Initializing dice pool system...");
    
    setTimeout(() => {
        scanExistingHeaders();
        observeNewHeaders();
        console.log("Dice system initialized successfully");
    }, 500);
}

const originalWindowOnload = window.onload;
window.onload = function() {
    if (originalWindowOnload) {
        originalWindowOnload();
    }
    
    initializeDiceSystem();
};

window.rescanDiceHeaders = function() {
    console.log("Manual rescan triggered");
    scanExistingHeaders();
};

// FIX #1: Move history button below theme and discord buttons
window.addEventListener("load", function() {
    setTimeout(() => {
        const historyBtn = document.createElement("button");
        historyBtn.id = "roll-history-btn";
        historyBtn.innerHTML = "📜";
        historyBtn.title = "Roll History";
        historyBtn.style.cssText = `
            position: fixed;
            right: 20px;
            top: 140px;
            background: #C50852;
            color: white;
            border: none;
            width: 50px;
            height: 50px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 24px;
            z-index: 9999;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        historyBtn.addEventListener("click", showRollHistory);
        
        document.body.appendChild(historyBtn);
        console.log("Roll history button added!");
    }, 1000);
});

window.showRollHistory = showRollHistory;

// ============================================================================
// DISCORD WEBHOOK INTEGRATION
// Add this to the END of your sheet.js file
// ============================================================================

let discordWebhookUrl = null;
let discordEnabled = false;

// Create Discord settings panel
function createDiscordSettingsPanel() {
    // Add button to toggle Discord settings
    const discordBtn = document.createElement("button");
    discordBtn.id = "discord-settings-btn";
    discordBtn.innerHTML = "💬";
    discordBtn.title = "Discord Settings";
    discordBtn.style.cssText = `
        position: fixed;
        right: 20px;
        top: 20px;
        background: #5865F2;
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 24px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    discordBtn.addEventListener("click", showDiscordSettings);
    document.body.appendChild(discordBtn);
}

function showDiscordSettings() {
    const existingPanel = document.getElementById("discord-settings-panel");
    if (existingPanel) {
        existingPanel.remove();
        return;
    }

    const panel = document.createElement("div");
    panel.id = "discord-settings-panel";
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 3px solid #5865F2;
        border-radius: 10px;
        padding: 20px;
        z-index: 10003;
        width: 500px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        font-family: sans-serif;
    `;

    panel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 15px; font-size: 18px; color: #5865F2;">
            💬 Discord Integration
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                Discord Webhook URL:
            </label>
            <input type="text" id="discord-webhook-input" 
                   placeholder="https://discord.com/api/webhooks/..."
                   style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;"
                   value="${discordWebhookUrl || ''}">
            <div style="font-size: 12px; color: #666; margin-top: 5px;">
                Get this from Discord: Server Settings → Integrations → Webhooks → New Webhook
            </div>
        </div>
        
        <div style="margin-bottom: 15px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" id="discord-enabled-checkbox" ${discordEnabled ? 'checked' : ''}
                       style="margin-right: 8px; width: 18px; height: 18px; cursor: pointer;">
                <span style="font-weight: bold;">Enable Discord posting</span>
            </label>
        </div>
        
        <div style="background: #f0f0f0; padding: 12px; border-radius: 6px; margin-bottom: 15px; font-size: 13px;">
            <strong>How to set up:</strong>
            <ol style="margin: 8px 0; padding-left: 20px;">
                <li>In Discord, go to your server settings</li>
                <li>Click "Integrations" → "Webhooks"</li>
                <li>Click "New Webhook" or edit existing one</li>
                <li>Copy the webhook URL</li>
                <li>Paste it above and enable</li>
            </ol>
        </div>
        
        <div style="display: flex; gap: 10px;">
            <button id="discord-test-btn" style="
                flex: 1;
                background: #5865F2;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            ">Test Connection</button>
            
            <button id="discord-save-btn" style="
                flex: 1;
                background: #28a745;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            ">Save</button>
            
            <button id="discord-close-btn" style="
                background: #666;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                cursor: pointer;
            ">Close</button>
        </div>
    `;

    document.body.appendChild(panel);

    // Event listeners
    document.getElementById("discord-test-btn").addEventListener("click", testDiscordConnection);
    document.getElementById("discord-save-btn").addEventListener("click", saveDiscordSettings);
    document.getElementById("discord-close-btn").addEventListener("click", () => panel.remove());
}

function saveDiscordSettings() {
    const webhookInput = document.getElementById("discord-webhook-input");
    const enabledCheckbox = document.getElementById("discord-enabled-checkbox");
    
    discordWebhookUrl = webhookInput.value.trim();
    discordEnabled = enabledCheckbox.checked;
    
    // Save to localStorage
    localStorage.setItem('discord_webhook_url', discordWebhookUrl);
    localStorage.setItem('discord_enabled', discordEnabled ? 'true' : 'false');
    
    alert("Discord settings saved!");
}

function testDiscordConnection() {
    const webhookInput = document.getElementById("discord-webhook-input");
    const testUrl = webhookInput.value.trim();
    
    if (!testUrl) {
        alert("Please enter a webhook URL first!");
        return;
    }
    
    const characterName = document.getElementById("character-name")?.innerText.trim() || "Test Character";
    
    sendToDiscord(testUrl, {
        characterName: characterName,
        message: "Test connection successful! Your dice rolls will appear here.",
        isTest: true
    });
}

// Send roll results to Discord
function sendToDiscord(webhookUrl, data) {
    if (!webhookUrl) {
        console.error("No webhook URL provided");
        return;
    }
    
    let content = "";
    let embeds = [];
    
    if (data.isTest) {
        content = `🎲 **${data.characterName}** - ${data.message}`;
    } else {
        // Format the roll result
        const characterName = data.characterName || "Unknown Character";
        
        let description = `**All Dice Rolled:**\n${data.allDiceDetailed}\n`;
        
        if (data.total !== undefined) {
            description += `\n📊 **Total:** ${data.total}\n`;
        }
        
        if (data.effectDetailed) {
            description += `\n⭐ **Effect Die:** ${data.effectDetailed}\n`;
        }
        
        if (data.hitchesDetailed && data.hitchesDetailed.length > 0) {
            description += `\n⚠️ **Hitches:**\n${data.hitchesDetailed}\n`;
        }
        
        embeds.push({
            title: `🎲 ${characterName} rolled dice!`,
            description: description,
            color: 12853058, // Pink/red color
            timestamp: new Date().toISOString()
        });
    }
    
    const payload = {
        content: content,
        embeds: embeds.length > 0 ? embeds : undefined
    };
    
    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            console.log("Successfully sent to Discord");
            if (data.isTest) {
                alert("Test message sent successfully! Check your Discord channel.");
            }
        } else {
            console.error("Failed to send to Discord:", response.status);
            if (data.isTest) {
                alert("Failed to send test message. Check your webhook URL.");
            }
        }
    })
    .catch(error => {
        console.error("Error sending to Discord:", error);
        if (data.isTest) {
            alert("Error sending to Discord: " + error.message);
        }
    });
}

// Load Discord settings from localStorage
function loadDiscordSettings() {
    const savedUrl = localStorage.getItem('discord_webhook_url');
    const savedEnabled = localStorage.getItem('discord_enabled');
    
    if (savedUrl) {
        discordWebhookUrl = savedUrl;
    }
    
    if (savedEnabled) {
        discordEnabled = savedEnabled === 'true';
    }
}

// Initialize Discord integration
window.addEventListener("load", function() {
    setTimeout(() => {
        loadDiscordSettings();
        createDiscordSettingsPanel();
        console.log("Discord integration initialized!");
    }, 2000);
});

// Export function to be called when dice are rolled
window.postRollToDiscord = function(rollData) {
    if (!discordEnabled || !discordWebhookUrl) {
        console.log("Discord posting disabled or no webhook URL");
        return;
    }
    
    const characterName = document.getElementById("character-name")?.innerText.trim() || "Unknown Character";
    
    // Format all dice with their source names
    const allDiceDetailed = rollData.allResults.map(r => {
        const sourceName = r.header || "Unknown";
        return `• **${sourceName}** ${r.die} → ${r.roll}`;
    }).join("\n");
    
    // Format total breakdown with source names
    const totalBreakdownDetailed = rollData.totalDice.map(d => {
        const sourceName = d.header || "Unknown";
        return `• **${sourceName}** ${d.die} → ${d.roll}`;
    }).join("\n");
    
    // Format effect with just the die size
    let effectDetailed = null;
    if (rollData.effectDie) {
        effectDetailed = rollData.effectDie.die;
    }
    
    // Format hitches with source names
    let hitchesDetailed = null;
    if (rollData.hitches.length > 0) {
        hitchesDetailed = rollData.hitches.map(h => {
            const hitchSource = h.header || "Unknown";
            return `• **${hitchSource}** ${h.die} → 1`;
        }).join("\n");
    }
    
    const discordData = {
        characterName: characterName,
        allDiceDetailed: allDiceDetailed,
        total: rollData.totalSum,
        effectDetailed: effectDetailed,
        hitchesDetailed: hitchesDetailed,
        isTest: false
    };
    
    sendToDiscord(discordWebhookUrl, discordData);
};

// ============================================================================
// THEME SWITCHER SYSTEM
// Add this to the END of your sheet.js file
// ============================================================================

const themes = {
    classic: {
        name: "Classic (Red/White)",
        primary: "#C50852",
        background: "#FFFFFF",
        text: "#000000",
        secondaryText: "#666666",
        darkMode: {
            primary: "#E63960",
            background: "#1C1C1E",
            text: "#E5E5E7",
            secondaryText: "#A0A0A5"
        }
    },
    forest: {
        name: "Forest Green",
        primary: "#2D6A4F",
        background: "#F8F9FA",
        text: "#1B4332",
        secondaryText: "#52796F",
        darkMode: {
            primary: "#52B788",
            background: "#1A1C1B",
            text: "#E0E5E3",
            secondaryText: "#A5B5B0"
        }
    },
    ocean: {
        name: "Ocean Blue",
        primary: "#023E8A",
        background: "#F8F9FA",
        text: "#03045E",
        secondaryText: "#0077B6",
        darkMode: {
            primary: "#48CAE4",
            background: "#181A1C",
            text: "#E3EEF2",
            secondaryText: "#A8C8D5"
        }
    },
    sunset: {
        name: "Sunset Orange",
        primary: "#F77F00",
        background: "#FCFCFC",
        text: "#003049",
        secondaryText: "#D62828",
        darkMode: {
            primary: "#FFB347",
            background: "#1C1A18",
            text: "#E8E3DD",
            secondaryText: "#B8A695"
        }
    },
    purple: {
        name: "Royal Purple",
        primary: "#5A189A",
        background: "#F8F9FA",
        text: "#240046",
        secondaryText: "#7209B7",
        darkMode: {
            primary: "#C77DFF",
            background: "#1A181C",
            text: "#E8E3F0",
            secondaryText: "#B8A8C8"
        }
    }
};

let currentTheme = 'classic';
let isDarkMode = false;

// Apply theme to the page
function applyTheme(themeName, darkModeEnabled = null) {
    const themeConfig = themes[themeName];
    if (!themeConfig) return;
    
    currentTheme = themeName;
    
    // If darkModeEnabled is explicitly passed, use it; otherwise use current state
    if (darkModeEnabled !== null) {
        isDarkMode = darkModeEnabled;
    }
    
    // Select light or dark mode colors
    const theme = isDarkMode ? themeConfig.darkMode : themeConfig;
    
    // Create or update style tag
    let styleTag = document.getElementById('dynamic-theme-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'dynamic-theme-styles';
        document.head.appendChild(styleTag);
    }
    
    styleTag.textContent = `
        /* Theme: ${theme.name} */
        body {
            background-color: ${theme.background};
            color: ${theme.text};
        }
        
        .page {
            background-color: ${theme.background};
        }
        
        /* Headers and titles */
        .title, h2, .header {
            color: ${theme.primary} !important;
        }
        
        /* Lines and borders */
        hr {
            border-color: ${theme.primary} !important;
            background-color: ${theme.primary} !important;
        }
        
        .ruler line {
            stroke: ${theme.primary} !important;
        }
        
        .ruler:before {
            color: ${theme.primary} !important;
        }
        
        /* Circles and curves */
        #circle {
            border-color: ${theme.primary} !important;
        }
        
        #attribute-curve path {
            stroke: ${theme.primary} !important;
        }
        
        /* Dice values <c> tags - these are font icons, color is the die color */
        c {
            color: ${theme.primary} !important;
        }
        
        /* Attribute text styling */
        #attributes div {
            color: ${theme.primary} !important;
        }
        
        /* Attribute <c> tags specifically - ensure they use theme color */
        #attributes div c {
            color: ${theme.primary} !important;
        }
        
        /* Distinction bullets */
        #distinctions li:before, li:before {
            color: ${theme.primary} !important;
        }
        
        /* Add-item buttons */
        .add-item:before {
            color: ${theme.primary} !important;
        }
        
        /* Remove-item buttons */
        #remove-item:before {
            color: ${theme.primary} !important;
        }
        
        /* Context menu button */
        #context-menu-button:before {
            color: ${theme.primary} !important;
        }
        
        /* Panel borders */
        #dice-pool-panel, #character-manager-panel, #roll-results-panel, 
        #roll-history-panel, #discord-settings-panel, #theme-selector-panel {
            border-color: ${theme.primary} !important;
            background: ${theme.background} !important;
        }
        
        /* Context menu */
        .context-menu {
            border-color: ${theme.primary} !important;
        }
        
        .context-menu li:hover,
        .context-menu input[type="radio"]:checked + label {
            background: ${theme.primary} !important;
        }
        
        .context-menu label:hover {
            background: ${theme.primary}3f !important;
        }
        
        .fa-ellipsis-v:before {
            color: ${theme.primary} !important;
        }
        
        /* Signature asset */
        .signature-asset {
            border-color: ${theme.primary} !important;
        }
        
        .signature-asset .header {
            background: ${theme.primary} !important;
        }
        
        /* Resources */
        .resources .header {
            color: ${theme.primary} !important;
            border-bottom-color: ${theme.primary} !important;
        }
        
        .resources .trait > div + h2:before {
            color: ${theme.primary} !important;
        }
        
        /* Text colors */
        .trait-group, .trait, .attribute {
            color: ${theme.text};
        }
        
        div[contenteditable] {
            color: ${theme.text};
        }
        
        /* Secondary text */
        .help-section-header, #legal {
            color: ${theme.secondaryText} !important;
        }
        
        /* Trait group header backgrounds in dark mode */
        .header {
            background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} !important;
        }
        
        /* Values/Roles header backgrounds */
        .values .header, .roles .header {
            background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'black'} !important;
            color: ${isDarkMode ? theme.primary : 'white'} !important;
        }
        
        /* Signature asset background */
        .signature-asset {
            background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)'} !important;
            border-color: ${theme.primary} !important;
        }
        
        /* Signature asset header */
        .signature-asset .header {
            background: ${theme.primary} !important;
            color: ${isDarkMode ? '#FFFFFF' : 'white'} !important;
        }
        
        /* PP (plot point) background */
        pp {
            background: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'} !important;
            border-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'} !important;
        }
        
        /* Help modal button */
        #help-modal #close button:hover {
            color: ${theme.primary} !important;
        }
        
        #help-modal #legal a {
            color: ${theme.primary} !important;
        }
        
        /* Stress section - fix colors */
        .stress h2 {
            color: ${theme.text} !important;
        }
        
        .stress .header {
            color: ${theme.primary} !important;
            background-color: ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'} !important;
        }
        
        .stress hr {
            border-color: ${theme.text} !important;
            background-color: ${theme.text} !important;
        }
        
        /* Stress dice icons - these are in ::before so harder to target */
        .stress div.trait {
            color: ${theme.text} !important;
        }
        
        /* Stress input fields - the white boxes with labels */
        .stress h2:nth-child(2) {
            background: transparent !important;
            color: ${theme.primary} !important;
            border: 1px solid ${theme.primary} !important;
        }
    `;
    
    // Save to localStorage
    localStorage.setItem('selected_theme', themeName);
    localStorage.setItem('dark_mode_enabled', isDarkMode ? 'true' : 'false');
}

// Create theme selector button
function createThemeSelectorButton() {
    const themeBtn = document.createElement("button");
    themeBtn.id = "theme-selector-btn";
    themeBtn.innerHTML = "🎨";
    themeBtn.title = "Change Theme";
    themeBtn.style.cssText = `
        position: fixed;
        right: 20px;
        top: 80px;
        background: #8B4789;
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 24px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    themeBtn.addEventListener("click", showThemeSelector);
    document.body.appendChild(themeBtn);
    console.log("Theme selector button created");
}

// Show theme selector panel
function showThemeSelector() {
    const existingPanel = document.getElementById("theme-selector-panel");
    if (existingPanel) {
        existingPanel.remove();
        return;
    }

    const panel = document.createElement("div");
    panel.id = "theme-selector-panel";
    panel.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 3px solid #666;
        border-radius: 10px;
        padding: 20px;
        z-index: 10004;
        width: 450px;
        box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        font-family: sans-serif;
    `;

    let themesHTML = `
        <div style="font-weight: bold; margin-bottom: 15px; font-size: 18px; color: #333; display: flex; justify-content: space-between; align-items: center;">
            <span>🎨 Choose Theme</span>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: normal; cursor: pointer;">
                <input type="checkbox" id="dark-mode-toggle" ${isDarkMode ? 'checked' : ''} 
                       style="width: 18px; height: 18px; cursor: pointer;">
                <span>Dark Mode</span>
            </label>
        </div>
        <div style="display: grid; gap: 10px;">
    `;

    for (const [key, themeConfig] of Object.entries(themes)) {
        const isActive = key === currentTheme;
        const theme = isDarkMode ? themeConfig.darkMode : themeConfig;
        
        themesHTML += `
            <div class="theme-option" data-theme="${key}" style="
                padding: 15px;
                border: 2px solid ${isActive ? theme.primary : '#ddd'};
                border-radius: 8px;
                cursor: pointer;
                background: ${theme.background};
                color: ${theme.text};
                transition: all 0.2s;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="font-weight: bold; margin-bottom: 5px;">${themeConfig.name}</div>
                    <div style="display: flex; gap: 5px;">
                        <div style="width: 30px; height: 20px; background: ${theme.primary}; border-radius: 3px;"></div>
                        <div style="width: 30px; height: 20px; background: ${theme.background}; border: 1px solid #ddd; border-radius: 3px;"></div>
                        <div style="width: 30px; height: 20px; background: ${theme.text}; border-radius: 3px;"></div>
                    </div>
                </div>
                ${isActive ? '<div style="font-size: 20px;">✓</div>' : ''}
            </div>
        `;
    }

    themesHTML += `
        </div>
        <div style="margin-top: 15px;">
            <button id="theme-close-btn" style="
                width: 100%;
                background: #666;
                color: white;
                border: none;
                padding: 10px;
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
            ">Close</button>
        </div>
    `;

    panel.innerHTML = themesHTML;
    document.body.appendChild(panel);

    // Dark mode toggle handler
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    darkModeToggle.addEventListener('change', (e) => {
        applyTheme(currentTheme, e.target.checked);
        panel.remove();
        showThemeSelector(); // Refresh the panel with new colors
    });

    // Add click handlers for theme options
    panel.querySelectorAll('.theme-option').forEach(option => {
        option.addEventListener('click', () => {
            const themeName = option.getAttribute('data-theme');
            applyTheme(themeName);
            panel.remove();
        });

        // Hover effect
        option.addEventListener('mouseenter', function() {
            if (this.getAttribute('data-theme') !== currentTheme) {
                this.style.transform = 'scale(1.02)';
                this.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
            }
        });
        option.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = 'none';
        });
    });

    document.getElementById("theme-close-btn").addEventListener("click", () => panel.remove());
}

// Initialize theme system
window.addEventListener("load", function() {
    setTimeout(() => {
        // Load saved theme and dark mode preference
        const savedTheme = localStorage.getItem('selected_theme') || 'classic';
        const savedDarkMode = localStorage.getItem('dark_mode_enabled') === 'true';
        
        applyTheme(savedTheme, savedDarkMode);
        
        createThemeSelectorButton();
        console.log("Theme system initialized!");
    }, 2500);
});

// ============================================================================
// EDIT MODE TOGGLE SYSTEM
// Add this to the END of your sheet.js file
// ============================================================================

let editModeEnabled = true; // Start with editing enabled

// Create edit mode toggle button
function createEditModeToggle() {
    const editBtn = document.createElement("button");
    editBtn.id = "edit-mode-btn";
    editBtn.innerHTML = "🔒";
    editBtn.title = "Lock/Unlock Editing";
    editBtn.style.cssText = `
        position: fixed;
        right: 20px;
        top: 200px;
        background: #28a745;
        color: white;
        border: none;
        width: 50px;
        height: 50px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 24px;
        z-index: 9999;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: background-color 0.2s;
    `;
    editBtn.addEventListener("click", toggleEditMode);
    document.body.appendChild(editBtn);
    
    // Apply initial state
    applyEditMode();
}

// Toggle edit mode on/off
function toggleEditMode() {
    editModeEnabled = !editModeEnabled;
    applyEditMode();
    
    // Save preference
    localStorage.setItem('edit_mode_enabled', editModeEnabled ? 'true' : 'false');
}

// Apply edit mode state to the page
function applyEditMode() {
    const editBtn = document.getElementById("edit-mode-btn");
    
    // Create or update style tag for edit mode
    let styleTag = document.getElementById('edit-mode-styles');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'edit-mode-styles';
        document.head.appendChild(styleTag);
    }
    
    if (editModeEnabled) {
        // Edit mode ON - show all controls
        editBtn.innerHTML = "🔓";
        editBtn.title = "Lock Editing (Currently Unlocked)";
        editBtn.style.background = "#28a745";
        
        styleTag.textContent = `
            /* Show all edit controls */
            .add-item,
            #remove-item,
            #context-menu-button {
                display: block !important;
            }
        `;
    } else {
        // Edit mode OFF - hide all controls
        editBtn.innerHTML = "🔒";
        editBtn.title = "Unlock Editing (Currently Locked)";
        editBtn.style.background = "#dc3545";
        
        styleTag.textContent = `
            /* Hide all edit controls */
            .add-item,
            #remove-item,
            #context-menu-button {
                display: none !important;
            }
            
            /* Also hide the no-print class items when locked */
            .no-print:not(#edit-mode-btn):not(#discord-settings-btn):not(#theme-selector-btn):not(#roll-history-btn):not(#dice-pool-panel):not(#roll-results-panel):not(#roll-history-panel):not(#discord-settings-panel):not(#theme-selector-panel):not(#character-manager-panel) {
                display: none !important;
            }
        `;
    }
}

// Initialize edit mode toggle
window.addEventListener("load", function() {
    setTimeout(() => {
        // Load saved preference
        const savedMode = localStorage.getItem('edit_mode_enabled');
        if (savedMode !== null) {
            editModeEnabled = savedMode === 'true';
        }
        
        createEditModeToggle();
        console.log("Edit mode toggle initialized!");
    }, 2500);
});

// Also disable contenteditable when locked
document.addEventListener('focus', function(e) {
    if (!editModeEnabled && e.target.hasAttribute('contenteditable')) {
        // Allow reading but prevent editing
        e.target.blur();
    }
}, true);

// Prevent accidental edits in locked mode
document.addEventListener('keydown', function(e) {
    if (!editModeEnabled) {
        const target = e.target;
        if (target.hasAttribute('contenteditable') || 
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA') {
            // Allow Ctrl+C for copying, but block other edits
            if (!(e.ctrlKey && e.key === 'c') && 
                !(e.ctrlKey && e.key === 'a') &&
                e.key !== 'Tab') {
                e.preventDefault();
            }
        }
    }
}, true);

// ============================================================================
// STRESS SYSTEM - CLEAN SOLUTION
// Add this to your sheet.js - Replace all previous stress code with this
// ============================================================================

function initializeStressSystem() {
    console.log("Initializing stress system...");
    scanStressTraits();
}

function scanStressTraits() {
    const stressTraits = document.querySelectorAll('.stress .trait:not(.template)');
    
    stressTraits.forEach(trait => {
        if (!trait.querySelector('.stress-dice')) {
            addStressDice(trait);
        }
    });
}

function addStressDice(traitElement) {
    const diceContainer = document.createElement('div');
    diceContainer.className = 'stress-dice';
    
    const diceValues = ['4', '6', '8', '0', '2']; // d4, d6, d8, d10, d12
    const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12'];
    
    diceValues.forEach((value, index) => {
        const die = document.createElement('c');
        die.textContent = value;
        die.dataset.die = diceTypes[index];
        
        die.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            toggleStressDie(traitElement, diceTypes[index]);
        });
        
        diceContainer.appendChild(die);
    });
    
    traitElement.appendChild(diceContainer);
    
    // Load saved state
    const savedDie = traitElement.dataset.selectedStressDie;
    if (savedDie) {
        const dieElement = diceContainer.querySelector(`c[data-die="${savedDie}"]`);
        if (dieElement) {
            dieElement.classList.add('selected');
            dieElement.style.color = 'var(--theme-primary, #C50852)';
        }
    }
}

function toggleStressDie(traitElement, dieType) {
    const allDice = traitElement.querySelectorAll('.stress-dice c');
    const clickedDie = traitElement.querySelector(`.stress-dice c[data-die="${dieType}"]`);
    
    // Check if already selected
    const isSelected = clickedDie.classList.contains('selected');
    
    // Deselect all
    allDice.forEach(die => {
        die.classList.remove('selected');
        die.style.color = '';
    });
    
    // If wasn't selected, select it
    if (!isSelected) {
        clickedDie.classList.add('selected');
        clickedDie.style.color = 'var(--theme-primary, #C50852)';
        traitElement.dataset.selectedStressDie = dieType;
        
        // Send to Discord
        sendStressToDiscord(traitElement, dieType);
    } else {
        delete traitElement.dataset.selectedStressDie;
        
        // Send cleared stress to Discord
        sendStressToDiscord(traitElement, null);
    }
}

function sendStressToDiscord(traitElement, selectedDie) {
    // Check if Discord is enabled
    if (!discordEnabled || !discordWebhookUrl) {
        return;
    }
    
    const characterName = document.getElementById("character-name")?.innerText.trim() || "Unknown Character";
    const stressName = traitElement.querySelector('h2:nth-child(2)')?.innerText.trim() || "Unknown Stress";
    
    let content;
    
    if (selectedDie) {
        content = `💢 **${characterName}** took **${stressName}** stress: **${selectedDie.toUpperCase()}**`;
    } else {
        content = `✅ **${characterName}** cleared **${stressName}** stress`;
    }
    
    const payload = {
        content: content
    };
    
    fetch(discordWebhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        if (response.ok) {
            console.log("Stress update sent to Discord");
        } else {
            response.text().then(errorText => {
                console.error("Failed to send stress update to Discord:", response.status, errorText);
            });
        }
    })
    .catch(error => {
        console.error("Error sending stress update to Discord:", error);
    });
}

// Prevent dice icons from being added to stress traits
const originalScanHeaders = window.scanExistingHeaders;
window.scanExistingHeaders = function() {
    console.log("Scanning for headers with dice values...");
    document.querySelectorAll(".dice-icon").forEach(icon => icon.remove());
    
    let headersFound = 0;
    
    // Skip stress traits when adding dice icons
    const h2Selectors = [
        ".trait-group:not(.stress) h2:not(.template h2)",
        ".trait:not(.stress .trait) h2:not(.template h2)"
    ];
    
    h2Selectors.forEach(selector => {
        const headers = document.querySelectorAll(selector);
        headers.forEach(header => {
            if (header.querySelector('c')) {
                attachDiceIcon(header);
                headersFound++;
            }
        });
    });
    
    // Handle attributes
    const attributes = document.querySelectorAll('.attribute:not(.template)');
    attributes.forEach(attr => {
        const cTag = attr.querySelector('c');
        const nameDiv = attr.querySelector('div[contenteditable]');
        if (cTag && nameDiv) {
            attachDiceIconToAttribute(attr, nameDiv);
            headersFound++;
        }
    });
    
    console.log(`Total headers with dice icons: ${headersFound}`);
};

// Initialize
window.addEventListener("load", function() {
    setTimeout(() => {
        initializeStressSystem();
        
        // Watch for new stress traits
        const observer = new MutationObserver((mutations) => {
            let shouldRescan = false;
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.matches && 
                        (node.matches('.stress .trait') || node.querySelector('.stress .trait'))) {
                        shouldRescan = true;
                    }
                });
            });
            if (shouldRescan) {
                setTimeout(() => scanStressTraits(), 100);
            }
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
        
        console.log("Stress system initialized!");
    }, 3500);
});
