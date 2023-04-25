import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, MarkdownRenderChild } from 'obsidian';
import { d3Template } from 'd3-template.js';

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

export class EnhancedTreeMap extends MarkdownRenderChild {
    text: string;

    constructor(containerEl: HTMLElement, text: string) {
        super(containerEl);
        this.text = text;
    }

    onload() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("viewBox", "0 0 400 250");
        svg.setAttribute("name", "enhancedtreemap");
        svg.classList.add("enhancedtreemap");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
        radialGradient.setAttribute("id", "radialgradient");
        radialGradient.setAttribute("cx", "25%");
        radialGradient.setAttribute("cy", "25%");
        radialGradient.setAttribute("r", "100%");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "hsla(0, 0%, 80%, 10%)");
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "hsla(0, 0%, 20%, 10%)");
        radialGradient.appendChild(stop1);
        radialGradient.appendChild(stop2);
        defs.appendChild(radialGradient);
        svg.appendChild(defs);

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow");
        filter.setAttribute("color-interpolation-filters", "sRGB");

        const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        feDropShadow.setAttribute("dx", "2");
        feDropShadow.setAttribute("dy", "2");
        feDropShadow.setAttribute("stdDeviation", "3");
        feDropShadow.setAttribute("flood-opacity", "0.5");
        filter.appendChild(feDropShadow);
        svg.append(filter);
        wrapper.append(svg);
        this.containerEl.parentElement.replaceWith(wrapper);
    }
}

export default class EnhancedTreemapPlugin extends Plugin {
	settings: EnhancedTreemapSettings;

    newpostprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        const codeblocks = element.querySelectorAll("code");

        for (let index = 0; index < codeblocks.length; index++) {
            const codeblock = codeblocks.item(index);
            const alltext = context.getSectionInfo(codeblock).text;
            if (alltext.match("```json\n\"type\": \"enhancedtreemap\",")) {

                // add class to parent element so d3.selectAll can find the right svgs to update
                element.classList.add('active-enhancedtreemap');

                const innertext = codeblock.innerText.trim();

                // the await is needed otherwise the globalEval may run too soon
                await context.addChild(new EnhancedTreeMap(codeblock, innertext));

                globalEval('data = {' + innertext + '};\n' + d3Template());

                // remove class from parent element when done
                element.classList.remove('active-enhancedtreemap');
            }
        }
    }

    oldpostprocessor = async (content: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
        // add class to parent element so d3.selectAll can find the right svgs to update
        el.classList.add('active-enhancedtreemap');

        const svg = `
            <svg width="100%" viewbox="0 0 400 250" class="enhancedtreemap" name="enhancedtreemap">
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

        globalEval('data = {' + content + '};\n' + d3Template());

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
        //this.registerMarkdownCodeBlockProcessor('json', this.oldpostprocessor);
        this.registerMarkdownPostProcessor((el, ctx) => this.newpostprocessor(el, ctx));

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

