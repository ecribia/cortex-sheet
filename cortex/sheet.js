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
// DICE POOL SYSTEM - FIXED VERSION
// ============================================================================

let dicePool = [];
let dicePoolPanel = null;
let rollHistory = []; // Store roll history

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

// IMPROVED: Get die value from header at the moment of clicking
function getDieFromHeader(header) {
    // Look for <c> tag INSIDE this specific header (not in parent trait-group)
    let cTag = header.querySelector('c');
    
    if (!cTag) {
        console.log("No <c> tag found inside this header");
        return null;
    }
    
    const cValue = cTag.innerText || cTag.textContent;
    const dieValue = getDieFromCValue(cValue);
    console.log("Found die value:", dieValue, "from <c> tag:", cValue);
    return dieValue;
}

// Store reference to header element, not its text (so we can always re-read it)
function attachDiceIcon(header) {
    // Remove existing dice icon if present
    const existingIcon = header.querySelector(".dice-icon");
    if (existingIcon) {
        existingIcon.remove();
    }
    
    // IMPORTANT: Only attach icon if THIS header contains a <c> tag
    const cTag = header.querySelector('c');
    if (!cTag) {
        return; // Don't add icon if no die value in this header
    }

    const icon = document.createElement("span");
    icon.classList.add("dice-icon");
    icon.innerText = "🎲";
    icon.style.cursor = "pointer";
    icon.style.marginLeft = "5px";
    icon.style.display = "inline-block";
    icon.style.userSelect = "none";

    icon.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Read the die value AT CLICK TIME
        const dieValue = getDieFromHeader(header);
        console.log("Dice icon clicked for header:", header.innerText, "Die:", dieValue);
        
        if (!dieValue) {
            console.warn("No die value found for this header");
            return;
        }

        // Store reference to header element
        dicePool.push({ 
            header: header, 
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
    
    // Remove ALL existing dice icons first to prevent duplicates
    document.querySelectorAll(".dice-icon").forEach(icon => icon.remove());
    
    // Find all headers that might have dice
    const selectors = [
        ".trait-group h2:not(.template h2)",
        ".attribute h2:not(.template h2)",
        ".trait h2:not(.template h2)"
    ];
    
    let headersFound = 0;
    selectors.forEach(selector => {
        const headers = document.querySelectorAll(selector);
        console.log(`Selector "${selector}" found ${headers.length} headers`);
        
        headers.forEach(header => {
            // Only attach if THIS header contains a <c> tag
            if (header.querySelector('c')) {
                attachDiceIcon(header);
                headersFound++;
            }
        });
    });
    
    console.log(`Total headers with dice icons: ${headersFound}`);
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
                    // Check if trait-group or attribute was added
                    if (node.matches && (node.matches('.trait-group') || node.matches('.attribute') || node.matches('.trait'))) {
                        shouldRescan = true;
                    }
                    
                    // Check if a <c> tag was added
                    if (node.matches && node.matches('c')) {
                        shouldRescan = true;
                    }
                    
                    // Check inside added nodes
                    if (node.querySelector) {
                        if (node.querySelector('.trait-group, .attribute, .trait, c')) {
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

    // Group dice by their value (d8, d12, etc.)
    const groupedDice = {};
    dicePool.forEach((die, index) => {
        // Re-read the die value from the header
        const currentDieValue = getDieFromHeader(die.header);
        const dieKey = currentDieValue || die.value;
        
        if (!groupedDice[dieKey]) {
            groupedDice[dieKey] = [];
        }
        groupedDice[dieKey].push({ ...die, index, actualValue: dieKey });
    });

    // Display grouped dice
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
        
        // Use dice icon instead of text
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
            // Remove one die of this type
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

    // Add buttons container
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

// Helper function to create dice icon HTML matching the <c> tag style
function createDiceIcon(dieValue) {
    // Extract the number from d4, d6, d8, d10, d12
    let number;
    switch(dieValue) {
        case 'd4': number = '4'; break;
        case 'd6': number = '6'; break;
        case 'd8': number = '8'; break;
        case 'd10': number = '0'; break;
        case 'd12': number = '2'; break;
        default: number = dieValue.replace('d', '');
    }
    
    // Return HTML that mimics the <c> tag styling
    return `<c style="display: inline-block;">${number}</c>`;
}

// Roll the selected dice - CORTEX PRIME STYLE
function rollDicePool() {
    if (dicePool.length === 0) {
        alert("Add some dice to the pool first!");
        return;
    }

    // Roll ALL dice in the pool
    const results = dicePool.map(d => {
        // Re-read die value one more time before rolling
        const currentValue = getDieFromHeader(d.header) || d.value;
        let size = parseInt(currentValue.replace("d", ""));
        
        const roll = Math.floor(Math.random() * size) + 1;
        return { 
            header: d.header.innerText.trim(), 
            die: currentValue, 
            roll: roll,
            size: size,
            id: Math.random() // unique ID for selection
        };
    });

    // Show results in a selection panel
    showRollResultsPanel(results);
}

// Show roll results and let user pick total dice and effect die
function showRollResultsPanel(results) {
    // Remove old panel if exists
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

    // Separate hitches from selectable dice
    const hitches = results.filter(r => r.roll === 1);
    const selectableDice = results.filter(r => r.roll !== 1);
    
    // Auto-fill if less than 3 selectable dice - d4 is ONLY for effect, never shown in list
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
        // Auto-select the d4 as effect immediately
        selectedEffect = 'auto-d4';
    }

    // Title
    const title = document.createElement("div");
    title.innerHTML = "<strong style='font-size: 18px;'>🎲 Roll Results - Select Dice</strong>";
    title.style.marginBottom = "15px";
    panel.appendChild(title);

    // Instructions
    const instructions = document.createElement("div");
    instructions.style.cssText = "color: #666; margin-bottom: 15px; font-size: 13px; line-height: 1.4;";
    if (autoD4) {
        instructions.innerHTML = "Click to select <strong>up to 2 dice</strong> for your total<br><em>(Effect is automatically d4)</em>";
    } else {
        instructions.innerHTML = "Click to select:<br>• <strong>2 dice</strong> for your total<br>• <strong>1 die</strong> for effect";
    }
    panel.appendChild(instructions);

    // Auto-select buttons (only show if no auto-d4)
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
            // Sort by roll value descending
            const sorted = [...selectableDice].sort((a, b) => b.roll - a.roll);
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
            // Find the largest die size among selectable dice only (not auto-d4)
            const maxSize = Math.max(...selectableDice.map(d => d.size));
            
            // Get all dice with that size
            const maxSizeDice = selectableDice.filter(d => d.size === maxSize);
            
            // Among dice with max size, choose the one with LOWEST roll (to maximize total)
            const effectDie = maxSizeDice.sort((a, b) => a.roll - b.roll)[0];
            
            // For total, get the remaining dice and pick the 2 highest rolls
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

    // Results container
    const resultsContainer = document.createElement("div");
    resultsContainer.style.marginBottom = "15px";

    function updateResultsDisplay() {
        resultsContainer.innerHTML = "";
        
        // Show selectable dice first
        selectableDice.forEach(result => {
            const resultDiv = document.createElement("div");
            const isTotal = selectedTotal.includes(result.id);
            const isEffect = selectedEffect === result.id;
            
            let bgColor = "#f5f5f5";
            let borderColor = "#ccc";
            let textColor = "#000";
            let label = "";
            
            if (isTotal) {
                bgColor = "#90C490"; // Greenish color from background
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
                // If clicking an already selected die, deselect it
                if (isTotal) {
                    selectedTotal = selectedTotal.filter(id => id !== result.id);
                } else if (isEffect) {
                    selectedEffect = null;
                } else {
                    // Check if this is the effect-only d4
                    if (result.isEffectOnly) {
                        // Can only be effect
                        selectedEffect = result.id;
                    } else {
                        // Try to select this die for total or effect
                        if (selectedTotal.length < 2) {
                            selectedTotal.push(result.id);
                        } else if (selectedEffect === null) {
                            selectedEffect = result.id;
                        } else {
                            // Everything is selected, replace the effect die
                            selectedEffect = result.id;
                        }
                    }
                }
                updateResultsDisplay();
            });
            
            resultsContainer.appendChild(resultDiv);
        });
        
        // Show auto-d4 if present (effect only)
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
        
        // Show hitches separately (non-selectable)
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

    // Summary section
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

    // Update summary when selections change
    const originalUpdate = updateResultsDisplay;
    updateResultsDisplay = function() {
        originalUpdate();
        updateSummary();
    };
    updateSummary();

    // Buttons
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
        
        // Save to history before closing
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
        
        rollHistory.unshift(historyEntry); // Add to beginning
        if (rollHistory.length > 20) rollHistory.pop(); // Keep last 20 rolls
        
        panel.remove();
        // Clear the dice pool
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

// Initialize the dice system
let diceSystemInitialized = false;

function initializeDiceSystem() {
    if (diceSystemInitialized) {
        console.log("Dice system already initialized");
        return;
    }
    diceSystemInitialized = true;
    
    console.log("Initializing dice pool system...");
    
    // Wait for DOM to be fully ready
    setTimeout(() => {
        scanExistingHeaders();
        observeNewHeaders();
        console.log("Dice system initialized successfully");
    }, 500);
}

// Hook into window load
const originalWindowOnload = window.onload;
window.onload = function() {
    // Call original onload
    if (originalWindowOnload) {
        originalWindowOnload();
    }
    
    // Initialize dice system
    initializeDiceSystem();
};

// Manual rescan function for debugging
window.rescanDiceHeaders = function() {
    console.log("Manual rescan triggered");
    scanExistingHeaders();
};

// Show roll history panel
function showRollHistory() {
    // Remove old panel if exists
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

    // Title
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

            // Timestamp
            const timeDiv = document.createElement("div");
            timeDiv.style.cssText = "color: #666; font-size: 12px; margin-bottom: 8px;";
            const time = entry.timestamp;
            timeDiv.textContent = `${time.toLocaleTimeString()}`;
            entryDiv.appendChild(timeDiv);

            // All rolled dice
            const allDiceDiv = document.createElement("div");
            allDiceDiv.style.cssText = "margin-bottom: 8px; font-size: 13px;";
            const diceList = entry.allResults.map(r => {
                const icon = createDiceIcon(r.die);
                return `${icon}: ${r.roll}`;
            }).join(", ");
            allDiceDiv.innerHTML = `<strong>Rolled:</strong> ${diceList}`;
            entryDiv.appendChild(allDiceDiv);

            // Total
            if (entry.totalDice.length > 0) {
                const totalDiv = document.createElement("div");
                totalDiv.style.cssText = "margin-bottom: 4px; font-size: 14px;";
                const totalDiceStr = entry.totalDice.map(d => d.roll).join(" + ");
                totalDiv.innerHTML = `<strong>📊 Total:</strong> ${entry.totalSum} <span style="color: #666; font-size: 12px;">(${totalDiceStr})</span>`;
                entryDiv.appendChild(totalDiv);
            }

            // Effect
            if (entry.effectDie) {
                const effectDiv = document.createElement("div");
                effectDiv.style.cssText = "margin-bottom: 4px; font-size: 14px;";
                const effectIcon = createDiceIcon(entry.effectDie.die);
                effectDiv.innerHTML = `<strong>⭐ Effect:</strong> ${effectIcon}`;
                entryDiv.appendChild(effectDiv);
            }

            // Hitches
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

    // Close button
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

    // Clear history button
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

// Add roll history button to the page (you can call this on page load)
window.addEventListener("load", function() {
    // Wait a bit for the page to fully load
    setTimeout(() => {
        // Create a floating button that's always visible
        const historyBtn = document.createElement("button");
        historyBtn.id = "roll-history-btn";
        historyBtn.innerHTML = "📜";
        historyBtn.title = "Roll History";
        historyBtn.style.cssText = `
            position: fixed;
            left: 10px;
            top: 50%;
            transform: translateY(-50%);
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

// Also expose globally so it can be called manually
window.showRollHistory = showRollHistory;
