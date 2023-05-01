# Enhanced Treemap Settings

```json
{
"type": "enhancedtreemap",
"name": "Enhanced Treemap Settings", "fill": { "s": 0, "l": 0.2 }, "text_size": 16, "halign": "center",
"settings": [
	{ "aspect_ratio": "1:1" },
	{ "fixed_width": true },
	{ "width": 800 },
	{ "sort_by_value": false },
	{ "cell_padding": 6 },
	{ "text_padding": 6 },
	{ "h_text_padding": 8 },
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
				{ "name": "aspect_ratio",   "fill": { "h": 60 }, "children": [ { "name": "\"1:1\"" } ] },
				{ "name": "fixed_width",    "fill": { "h": 60 }, "children": [ { "name": "true" } ] },
				{ "name": "width",          "fill": { "h": 60 }, "children": [ { "name": "800" } ] },
				{ "name": "show_headers",   "fill": { "h": 60 }, "children": [ { "name": "true" } ] },
				{ "name": "show_values",    "fill": { "h": 60 }, "children": [ { "name": "false" } ] },
				{ "name": "sort_by_value",  "fill": { "h": 60 }, "children": [ { "name": "true" } ] },
				{ "name": "h_text_size",    "fill": { "h": 120 }, "children": [ { "name": "16" } ] },
				{ "name": "text_size",      "fill": { "h": 180 }, "children": [ { "name": "13" } ] }
			] },
			{ "name": "Padding", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "cell_padding",   "fill": { "h": 60 }, "children": [ { "name": "8" } ] },
				{ "name": "h_text_padding", "fill": { "h": 60 }, "children": [ { "name": "8" } ] },
				{ "name": "text_padding",   "fill": { "h": 180 }, "children": [ { "name": "8" } ] }
			] },
			{ "name": "Shading & Shadows", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "h_shadow_size",  "fill": { "h": 60 }, "children": [ { "name": "4" } ] },
				{ "name": "shadow_size",    "fill": { "h": 60 }, "children": [ { "name": "4" } ] },
				{ "name": "h_shading",      "fill": { "h": 120 }, "children": [ { "name": "true" } ] },
				{ "name": "shading",        "fill": { "h": 180 }, "children": [ { "name": "true" } ] },
				{ "name": "h_shadow",       "fill": { "h": 120 }, "children": [ { "name": "true" } ] },
				{ "name": "shadow",         "fill": { "h": 180 }, "children": [ { "name": "true" } ] }
			] },
			{ "name": "Color", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "h_border_color", "fill": { "h": 120 }, "children": [ { "name": "hue:0 saturation:0 lightness:0 alpha:0.5" } ] },
				{ "name": "border_color",   "fill": { "h": 180 }, "children": [ { "name": "hue:0 saturation:0 lightness:0 alpha:0.5" } ] },
				{ "name": "h_fill",         "fill": { "h": 120 }, "children": [ { "name": "hue:0 saturation:0 lightness:0.3 alpha:1" } ] },
				{ "name": "fill",           "fill": { "h": 180 }, "children": [ { "name": "hue:0 saturation:0 lightness:0.3 alpha:1" } ] },
				{ "name": "h_text_color",   "fill": { "h": 120 }, "children": [ { "name": "hue:0 saturation:0 lightness:0.9 alpha:1" } ] },
				{ "name": "text_color",     "fill": { "h": 180 }, "children": [ { "name": "hue:0 saturation:0 lightness:0.8 alpha:1" } ] }
			] },
			{ "name": "Alignment", "text_size": 13, "fill": { "s": 0 }, "children": [ 
				{ "name": "h_halign",       "fill": { "h": 120 }, "children": [ { "name": "\"left\"" } ] },
				{ "name": "halign",         "fill": { "h": 180 }, "children": [ { "name": "\"left\"" } ] },
				{ "name": "valign",         "fill": { "h": 180 }, "children": [ { "name": "\"top\"" } ] }
			] }
		]
	},
	{ "fill": { "a": 0 }, "border_color": { "a": 0 },
		"children": [
			{ "name": "Defaults",      "text_size": 13, "fill": { "s": 0, "a": 1 }, "children": [ { "value": 2.25,
				"name": "This treemap shows the defaults for all available settings for the Enhanced Treemap plugin. These defaults can be changed in the settings panel for the plugin." } ] },
			{ "name": "Gold Shading",  "text_size": 13, "fill": { "h": 60, "s": 0.2, "a": 1 }, "children": [ { "value": 2.25,
				"name": "These settings can be changed in the \"settings\" section of a treemap to override the plugin defaults. They cannot be changed within individual headers or cells." } ] },
			{ "name": "Green Shading", "text_size": 13, "fill": { "h": 120 }, "children": [ { "value": 2.25,
				"name": "These settings can be changed in the \"settings\" section of a treemap to override the plugin defaults. They can also be changed within individual headers to override both the plugin defaults and the treemap settings. Within individual headers remove the \"h_\" prefix." } ] },
			{ "name": "Blue Shading",  "text_size": 13, "fill": { "h": 180 }, "children": [ { "value": 2.25,
				"name": "These settings can be changed in the \"settings\" section of a treemap to override the plugin defaults. They can also be changed within individual cells to override both the plugin defaults and the treemap settings." } ] }
		]
	}
]
}
```

