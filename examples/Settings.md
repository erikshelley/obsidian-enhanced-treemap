# Enhanced Treemaps
## Settings

```json
{
"type": "enhancedtreemap",
"name": "Enhanced Treemap Settings", "fill": { "s": 0, "l": 0.2 }, "text_size": 18, "halign": "center",
"settings": [
	{ "aspect_ratio": "1:1" },
	{ "fixed_width": true },
	{ "width": 800 },
	{ "sort_by_value": false },
	{ "outer_padding": 6 },
	{ "text_padding": 0 },
	{ "h_text_padding": 7 },
	{ "text_size": 11 },
	{ "h_text_size": 11 },
	{ "text_color": { "l": 0.7 } },
	{ "shading": false },
	{ "h_shading": false },
	{ "shadow": false },
	{ "h_shadow": true },
	{ "h_shadow_size": 3 },
	{ "border_color": { "a": 0 } },
	{ "h_border_color": { "a": 0 } },
	{ "h_fill": { "s": 0.2 } },
	{ "fill": { "a": 0 } }
],
"children": [
	{ "fill": { "a": 0 }, "border_color": { "a": 0 },
		"children": [
			{ "name": "Size & Shape", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "aspect_ratio",   "fill": { "h": 60 }, "children": [ 
					{ "name": "Set the width:height ratio for the treemap. Default=\"1:1\"" } ] },
				{ "name": "fixed_width",    "fill": { "h": 60 }, "children": [ 
					{ "name": "Set whether the treemap has a fixed width (vs automatic width). Default=true" } ] },
				{ "name": "width",          "fill": { "h": 60 }, "children": [ 
					{ "name": "Set the width of the treemap (if it is using a fixed width). Default=800" } ] },
				{ "name": "show_headers",   "fill": { "h": 60 }, "children": [ 
					{ "name": "Set whether headers are shown in the treemap. Default=true" } ] },
				{ "name": "show_values",    "fill": { "h": 60 }, "children": [ 
					{ "name": "Set whether values are shown in the cells. Default=false" } ] },
				{ "name": "sort_by_value",  "fill": { "h": 60 }, "children": [ 
					{ "name": "Set whether cells are sorted by value (vs code block order). Default=true" } ] },
				{ "name": "h_text_size",    "fill": { "h": 120 }, "children": [ 
					{ "name": "Set font size for header text. Default=16" } ] },
				{ "name": "text_size",      "fill": { "h": 180 }, "children": [ 
					{ "name": "Set font size for cell text. Default=13" } ] }
			] },
			{ "name": "Padding", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "outer_padding",  "fill": { "h": 60 }, "children": [ 
					{ "name": "Set the padding around headers and cells. Default=8" } ] },
				{ "name": "h_text_padding", "fill": { "h": 60 }, "children": [ 
					{ "name": "Set the padding around header text. Default=8" } ] },
				{ "name": "text_padding",   "fill": { "h": 180 }, "children": [ 
					{ "name": "Set the padding around cell text. Default=8" } ] }
			] },
			{ "name": "Shading & Shadows", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "h_shading",      "fill": { "h": 120 }, "children": [ 
					{ "name": "Set whether headers have shading. Default=true" } ] },
				{ "name": "shading",        "fill": { "h": 180 }, "children": [ 
					{ "name": "Set whether cells have shading. Default=true" } ] },
				{ "name": "h_shadow",       "fill": { "h": 120 }, "children": [ 
					{ "name": "Set whether headers have drop shadows. Default=true" } ] },
				{ "name": "shadow",         "fill": { "h": 180 }, "children": [ 
					{ "name": "Set whether cells have drop shadows. Default=true" } ] },
				{ "name": "h_shadow_size",  "fill": { "h": 60 }, "children": [ 
					{ "name": "Set size of header drop shadows. Default=4" } ] },
				{ "name": "shadow_size",    "fill": { "h": 60 }, "children": [ 
					{ "name": "Set size of cell drop shadows. Default=4" } ] }
			] },
			{ "name": "Color", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "h_border_color", "fill": { "h": 120 }, "children": [ 
					{ "name": "Set hue, saturation, lightness & alpha for header borders. Default=0,0,0,0.5" } ] },
				{ "name": "border_color",   "fill": { "h": 180 }, "children": [ 
					{ "name": "Set hue, saturation, lightness & alpha for cell borders. Default=0,0,0,0.5" } ] },
				{ "name": "h_fill",         "fill": { "h": 120 }, "children": [ 
					{ "name": "Set hue, saturation, lightness & alpha for filling headers. Default=0,0,0.3,1" } ] },
				{ "name": "fill",           "fill": { "h": 180 }, "children": [ 
					{ "name": "Set hue, saturation, lightness & alpha for filling cells. Default=0,0,0.3,1" } ] },
				{ "name": "h_text_color",   "fill": { "h": 120 }, "children": [ 
					{ "name": "Set hue, saturation, lightness & alpha for header text. Default=0,0,0.9,1" } ] },
				{ "name": "text_color",     "fill": { "h": 180 }, "children": [ 
					{ "name": "Set hue, saturation, lightness & alpha for cell text. Default=0,0,0.8,1" } ] }
			] },
			{ "name": "Alignment", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "h_halign",       "fill": { "h": 120 }, "children": [ 
					{ "name": "Set horizontal alignment for header text. Default=\"left\"" } ] },
				{ "name": "halign",         "fill": { "h": 180 }, "children": [ 
					{ "name": "Set horizontal alignment for cell text. Default=\"left\"" } ] },
				{ "name": "valign",         "fill": { "h": 180 }, "children": [ 
					{ "name": "Set vertical alignment for cell text. Default=\"top\"" } ] }
			] }
		]
	},
	{ "fill": { "a": 0 }, "border_color": { "a": 0 },
		"children": [
			{ "name": "About this Treemap",      "text_size": 13, "fill": { "s": 0, "a": 1 }, "children": [ { "value": 2.25,
				"name": "This treemap shows all available settings for the Enhanced Treemap plugin. Defaults can be changed in the settings panel for the plugin." } ] },
			{ "name": "Gold Settings",  "text_size": 13, "fill": { "h": 60, "s": 0.2, "a": 1 }, "children": [ { "value": 2.25,
				"name": "These settings can be changed in the \"settings\" section of a treemap to override the plugin defaults. They cannot be changed within individual headers or cells." } ] },
			{ "name": "Green Settings", "text_size": 13, "fill": { "h": 120 }, "children": [ { "value": 2.25,
				"name": "These settings can be changed in the \"settings\" section of a treemap to override the plugin defaults. They can also be changed within individual headers to override both the plugin defaults and the treemap settings. Within individual headers remove the \"h_\" prefix." } ] },
			{ "name": "Blue Settings",  "text_size": 13, "fill": { "h": 180 }, "children": [ { "value": 2.25,
				"name": "These settings can be changed in the \"settings\" section of a treemap to override the plugin defaults. They can also be changed within individual cells to override both the plugin defaults and the treemap settings." } ] }
		]
	}
]
}
```

