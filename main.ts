import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface EnhancedTreemapSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: EnhancedTreemapSettings = {
	mySetting: 'default'
}

function addScript(src) {
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');

        s.setAttribute('src', src);
        s.addEventListener('load', resolve);
        s.addEventListener('error', reject);

        document.body.appendChild(s);
    });
}

var globalEval = function globalEval(src) {
    if (window.execScript) {
        window.execScript(src);
        return;
    }
    var fn = function() {
        window.eval.call(window,src);
    };
    fn();
};


// https://d3-graph-gallery.com/graph/treemap_custom.html - beautiful example
// https://www.d3indepth.com/hierarchies/ - good information breakdown
var d3Template = `
    function wrap(text) {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\\s+/).reverse(),
                word,
                longline,
                splits,
                i,
                line = [],
                lineNumber = 0,
                lineHeight = 1.1, // ems
                x = text.attr("x"),
                y = text.attr("y"),
                //width = text.attr("width"),
                width = parseFloat(text.attr("width")),
                height = parseFloat(text.attr("height")),
                fontsize = parseFloat(text.attr("font-size").substring(0, text.attr("font-size").length - 2)),
                dy = 0, //parseFloat(text.attr("dy")),
                tspan = text.text(null)
                            .append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", dy + "em");
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if ((lineNumber + 2) * lineHeight * fontsize >= height) {
                    tspan.text("...");
                }
                else if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));

                    // if a single word is too long, break it in half
                    if (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                        longline = tspan.text();
                        splits = 1;
                        while (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                            splits++;
                            tspan.text(longline.substring(0, longline.length/splits) + "-");
                        }
                        for (i=2; i<=splits; i++) {
                            if ((lineNumber + 2) * lineHeight * fontsize >= height) {
                                tspan.text("...");
                            }
                            else {
                                tspan = text.append("tspan")
                                            .attr("x", x)
                                            .attr("y", y)
                                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                            .text(longline.substring((i - 1) * longline.length / splits, i * longline.length / splits) + (i < splits ? "-" : ""));
                            }
                        }
                    }

                    line = [word];
                    tspan = text.append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                .text(word);

                    // if last word is too long, break it in half
                    if (words.length == 0 && tspan.node().getComputedTextLength() > width) {
                        longline = tspan.text();
                        splits = 1;
                        while (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                            splits++;
                            tspan.text(longline.substring(0, longline.length/splits) + "-");
                        }
                        for (i=2; i<=splits; i++) {
                            if ((lineNumber + 2) * lineHeight * fontsize >= height) {
                                tspan.text("...");
                            }
                            else {
                                tspan = text.append("tspan")
                                            .attr("x", x)
                                            .attr("y", y)
                                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                            .text(longline.substring((i - 1) * longline.length / splits, i * longline.length / splits) + (i < splits ? "-" : ""));
                            }
                        }
                    }
                }
            }
            if (lineNumber > 0) {
                const startDy = -(lineNumber * (lineHeight / 2));
                text.selectAll("tspan").attr("dy", (d, i) => startDy + lineHeight * i + "em");
            }
        });
    };

    function ellipse(text) {
        text.each(function() {
            var text = d3.select(this);
            var width = parseFloat(text.attr("width"));
            var original = text.text();
            var tspan = text.text("").append("tspan").text(original);
            if (tspan.node().getComputedTextLength() <= width) return;
            tspan.text(original + "...");
            while (tspan.node().getComputedTextLength() > width & tspan.text().length > 3) {
                tspan.text(tspan.text().substring(0, tspan.text().length - 4) + "...");
            }
        });
    }

    function ellipsebyword(text) {
        text.each(function() {
            var text = d3.select(this);
            var words = text.text().split(/\\s+/);
            
            var ellipsis = text.text("").append("tspan").text("...");
            var width = parseFloat(text.attr("width")) - ellipsis.node().getComputedTextLength();
            var numWords = words.length;
            
            var tspan = text.insert("tspan", ":first-child").text(words.join(" "));
            
            // Try the whole line
            // While it's too long, and we have words left, keep removing words
            while (tspan.node().getComputedTextLength() > width && words.length) {
                words.pop();
                tspan.text(words.join(" "));
            }
            
            if (words.length === numWords) {
                ellipsis.remove();
            }
        });
    }

    // load json data into hierarchy of nodes
    // the ||!d.children adds a default value of 1 for any leaf nodes (no children) with no value
    var nodes = d3.hierarchy(data).sum(function(d) { return d.value||!d.children; });

    var svg = d3.select(".active-enhancedtreemap .enhancedtreemap").append("g");

    var padding = 4;
    var fontsize = 8;

    // add positions to the nodes using the treemap layout
    var treemapLayout = d3.treemap().size([400, 500]).paddingOuter(padding).paddingTop(fontsize + 2.5 * padding).paddingInner(padding)(nodes);

    // decendants instead of leaves shows all nodes, not just the leaves
    svg.selectAll("rect").data(nodes.descendants()).enter()
        .append("rect")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("stroke", "hsla(0, 0%, 0%, 50%)")
            .attr("fill", function(d) { return d3.hsl(d.data.h||0, d.data.s||0, d.data.l||0.25); })
            .attr("filter", "url(#shadow)");

    svg.selectAll("highlight").data(nodes.descendants()).enter()
        .append("rect")
            .attr("x", function(d) { return d.x0; })
            .attr("y", function(d) { return d.y0; })
            .attr("width", function(d) { return d.x1 - d.x0; })
            .attr("height", function(d) { return d.y1 - d.y0; })
            .attr("fill", "url(#radialgradient)");

    svg.selectAll("text").data(nodes.leaves()).enter()
        .append("text")
            .attr("x", function(d) { return d.x0 + 0.5 * (d.x1 - d.x0); })
            .attr("y", function(d) { return d.y0 + 0.5 * (d.y1 - d.y0) + 0.25 * fontsize; })
            .attr("left", function(d) { return d.x0; })
            .attr("top", function(d) { return d.y0; })
            .attr("width", function(d) { return d.x1 - d.x0 - 2 * padding; })
            .attr("height", function(d) { return d.y1 - d.y0 - 2 * padding; })
            .attr("text-anchor", "middle")
            .attr("font-size", fontsize + "px")
            .attr("fill", "rgb(224, 224, 224)")
            .text(function(d) { return d.data.name; })
            .call(wrap);

    // label instead of text otherwise it doesn't work
    // use the filter at the end otherwise the previous one doesn't work
    svg.selectAll("label").data(nodes.descendants().filter(function(d) { return d.children; })).enter()
        .append("text")
            .attr("x", function(d) { return d.x0 + 0.5 * (d.x1 - d.x0); })
            .attr("y", function(d) { return d.y0 + fontsize + padding; })
            .attr("width", function(d) { return d.x1 - d.x0 - 2 * padding; })
            .attr("text-anchor", "middle")
            .attr("font-size", fontsize + "px")
            //.attr("font-weight", "bold")
            .attr("fill", "rgb(224, 224, 224)")
            .text(function(d) { return d.data.name; })
            .call(ellipse);

`;

// https://github.com/stbowers/obsidian-codeblock-labels

export default class EnhancedTreemapPlugin extends Plugin {
	settings: EnhancedTreemapSettings;

    postprocessor = async (content: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        // add class to parent element so d3.selectAll can find the right svgs to update
        el.classList.add('active-enhancedtreemap');

        const svg = `
            <svg width="100%" viewbox="0 0 400 500" class="enhancedtreemap" name="enhancedtreemap">
                <defs>
                    <radialGradient id="radialgradient" cx="25%" cy="25%" r="100%">
                        <stop offset="0%" stop-color="hsla(0, 0%, 80%, 10%)"/>
                        <stop offset="100%" stop-color="hsla(0, 0%, 20%, 10%)"/>
                    </radialGradient>
                </defs>
                <filter id='shadow' color-interpolation-filters="sRGB">
                    <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/>
                </filter>
            </svg>`;
        await el.insertAdjacentHTML("beforeend", svg);

        globalEval('data = {' + content + '};\n' + d3Template);

        // https://forum.obsidian.md/t/svg-gradient-rendered-differently-in-live-preview-vs-preview/31593/7
        // markdown-source-view & markdown-reading-view
        // Rename the radialGradient in the source view so the svg in the reading view uses its own radialGradient that is not hidden
        document.querySelectorAll(".markdown-source-view svg[name='enhancedtreemap']").forEach((svg) => { 
            svg.querySelectorAll("[id]").forEach((el) => { 
                const id = el.id; 
                const randomInt = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER); 
                svg.innerHTML = svg.innerHTML.replaceAll(id, `${id}-${randomInt}`); 
            }) 
        });

        // remove class from parent element when done
        el.classList.remove('active-enhancedtreemap');
    }

	async onload() {
		await this.loadSettings();

        /*
        this.registerMarkdownCodeBlockProcessor("csv", (source, el, ctx) => {
            const rows = source.split("\n").filter((row) => row.length > 0);

            const table = el.createEl("table");
            const body = table.createEl("tbody");

            for (let i = 0; i < rows.length; i++) {
                const cols = rows[i].split(",");

                const row = body.createEl("tr");

                for (let j = 0; j < cols.length; j++) {
                    row.createEl("td", { text: cols[j] });
                }
            }
        });
        */

        try {
            await addScript('https://d3js.org/d3.v7.min.js');
        } catch (e) {
            console.log(e);
        }
        //const head = document.querySelector("head");
        //head.insertAdjacentHTML("beforeend", '<script src="https://d3js.org/d3.v7.min.js"></script>');
        this.registerMarkdownCodeBlockProcessor('enhancedtreemap', this.postprocessor);

        /*
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'insert-enhanced-treemap',
			name: 'Insert Enhanced Treemap',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('```\nTreemap Here\n```');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
        */

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

        /*
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
        */
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

/*
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
*/

class SampleSettingTab extends PluginSettingTab {
	plugin: EnhancedTreemapPlugin;

	constructor(app: App, plugin: EnhancedTreemapPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}

