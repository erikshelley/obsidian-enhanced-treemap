import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, FileSystemAdapter} from 'obsidian';
import EnhancedTreeMap from './enhancedtreemap';

interface EnhancedTreemapSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: EnhancedTreemapSettings = {
	mySetting: 'default'
}

export default class EnhancedTreemapPlugin extends Plugin {
	settings: EnhancedTreemapSettings;
    enhancedtreemap: EnhancedTreeMap;

    postprocessor = async (element: HTMLElement, context: MarkdownPostProcessorContext) => {
        // only create the tree if there is a code block containing the expected text
        var codeblock = element.querySelector("code");
        if (codeblock == null) return;

        var data = codeblock.textContent;
        if (data.match(/"type": "enhancedtreemap"/)) {
            await this.enhancedtreemap.renderEnhancedTreeMap(element, context);
        }
    }

	async onload() {
		await this.loadSettings();

        this.enhancedtreemap = new EnhancedTreeMap(this);

        this.registerMarkdownPostProcessor((el, ctx) => this.postprocessor(el, ctx));

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		//this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
		//	console.log('click', evt);
		//});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		//this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
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

