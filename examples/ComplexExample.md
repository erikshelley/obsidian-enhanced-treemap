# Enhanced Treemaps
## Complex Example

```json
{
"type": "enhancedtreemap",
"name": "Major League Baseball - 2016 Season Wins (World Series Champion: Cubs)", 
"halign": "center", 
"fill": { "h": 220, "s": 0.4, "l": 0.15 }, 
"text_color": { "s": 1, "l": 0.9 },
"text_size": 22,
"settings": [
	{ "aspect_ratio": "3:1" },
	{ "outer_padding": 6 },
	{ "fixed_width": true },
	{ "h_text_padding": 16 },
	{ "show_headers": true },
	{ "sort_by_value": true },
	{ "width": 1400 },

	{ "h_halign": "left" },
	{ "h_text_color": { "h": 220, "s": 1, "l": 0.85 } },
	{ "h_text_size": 16 },

	{ "border_color": { "a": 0 } },
	{ "fill": { "h": 220, "s": 0.3, "l": 0.3, "a": 0.8 } },
	{ "halign": "left" },
	{ "h_shading": false },
	{ "shading": false },
	{ "shadow": true },
	{ "shadow_size": 3 },
	{ "show_values": true },
	{ "text_color": { "s": 0, "l": 0.7 } },
	{ "text_size": 12 },
	{ "text_padding": 4 },
	{ "valign": "top" }
],
"children": [
	{ "name": "American League (ALCS Champion: Indians)", "shadows": true,
		"children": [
			{ "name": "AL East", "shadows": true,
				"children": [
					{ "name": "Red Sox",   "value": 93, "fill": { "h": 86, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Orioles",   "value": 89, "fill": { "h": 78, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Blue Jays", "value": 89, "fill": { "h": 78, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Yankees",   "value": 84, "fill": { "h": 68 } },
					{ "name": "Rays",      "value": 68, "fill": { "h": 36 } }
				]
			},
			{ "name": "AL Central", "shadows": true,
				"children": [
					{ "name": "Indians",   "value": 94, "fill": { "h": 88, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Tigers",    "value": 86, "fill": { "h": 72 } },
					{ "name": "Royals",    "value": 81, "fill": { "h": 62 } },
					{ "name": "White Sox", "value": 78, "fill": { "h": 56 } },
					{ "name": "Twins",     "value": 59, "fill": { "h": 18 } }
				]
			},
			{ "name": "AL West", "shadows": true,
				"children": [
					{ "name": "Rangers",   "value": 95, "fill": { "h": 90, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Mariners",  "value": 86, "fill": { "h": 72 } },
					{ "name": "Astros",    "value": 84, "fill": { "h": 68 } },
					{ "name": "Angels",    "value": 74, "fill": { "h": 48 } },
					{ "name": "Athletics", "value": 69, "fill": { "h": 38 } }
				]
			}
		]
	},
	{ "name": "National League (NLCS Champion: Cubs)", "shadows": true,
		"children": [
			{ "name": "NL East", "shadows": true,
				"children": [
					{ "name": "Nationals", "value": 95, "fill": { "h": 90, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Mets",      "value": 87, "fill": { "h": 74, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Marlins",   "value": 79, "fill": { "h": 58 } },
					{ "name": "Phillies",  "value": 71, "fill": { "h": 42 } },
					{ "name": "Braves",    "value": 68, "fill": { "h": 36 } }
				]
			},
			{ "name": "NL Central", "shadows": true,
				"children": [
					{ "name": "Cubs",      "value": 103, "fill": { "h": 106, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Cardinals", "value": 86, "fill": { "h": 72 } },
					{ "name": "Pirates",   "value": 78, "fill": { "h": 56 } },
					{ "name": "Brewers",   "value": 73, "fill": { "h": 46 } },
					{ "name": "Reds",      "value": 68, "fill": { "h": 42 } }
				]
			},
			{ "name": "NL West", "shadows": true,
				"children": [
					{ "name": "Dodgers",      "value": 91, "fill": { "h": 82, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Giants",       "value": 87, "fill": { "h": 74, "l": 0.35, "a": 1 }, "text_color": { "l": 0.9 }, "shading": true, "shadows": true },
					{ "name": "Rockies",      "value": 75, "fill": { "h": 50 } }, 
					{ "name": "Diamondbacks", "value": 69, "fill": { "h": 38 } }, 
					{ "name": "Padres",       "value": 68, "fill": { "h": 36 } } 
				]
			}
		]
	}
]
}
```

