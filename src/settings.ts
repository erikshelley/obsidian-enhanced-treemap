import { App, PluginSettingTab, Setting } from 'obsidian';

export interface EnhancedTreemapSettings {
    aspect_w:       float;
    aspect_h:       float;

    // Treemap Settings
    aspect_ratio:   float;
    cell_padding:   float;
    fixed_width:    bool;
    h_shadow_size:  float;
    h_text_padding: float;
    shadow_size:    float;
    show_headers:   bool;
    show_values:    bool;
    sort_by_value:  bool;
    width:          float;

    // Header Settings
    h_border_color: Array<float>;
    h_fill:         Array<float>;
    h_halign:       string;
    h_shading:      bool;
    h_shadow:       bool;
    h_text_color:   Array<float>;
    h_text_size:    float;

    // Cell Settings
    border_color:   Array<float>;
    fill:           Array<float>;
    halign:         string;
    shading:        bool;
    shadow:         bool;
    text_color:     Array<float>;
    text_padding:   float;
    text_size:      float;
    valign:         string;

}

export const DEFAULT_SETTINGS: EnhancedTreemapSettings = {
    // Size & Shape Settings
    aspect_w:       1,
    aspect_h:       1,

    // Treemap Settings
    aspect_ratio:   1,
    cell_padding:   8,
    fixed_width:    true,
    h_shadow_size:  4,
    h_text_padding: 8,
    shadow_size:    4,
    show_headers:   true,
    show_values:    false,
    sort_by_value:  true,
    width:          800,

    // Header Settings
    h_border_color: [0, 0, 0, 0.5],
    h_fill:         [0, 0, 0.3, 1],
    h_halign:       "left",
    h_shading:      true,
    h_shadow:       true,
    h_text_color:   [0, 0, 0.9, 1],
    h_text_size:    16,

    // Cell Settings
    border_color:   [0, 0, 0, 0.5],
    fill:           [0, 0, 0.3, 1],
    halign:         "left",
    shading:        true,
    shadow:         true,
    text_color:     [0, 0, 0.9, 1],
    text_padding:   8,
    text_size:      13,
    valign:         "top"

}

export class SettingTab extends PluginSettingTab {
    plugin: EnhancedTreemapPlugin;

    constructor(app: App, plugin: EnhancedTreemapPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h1', { text: 'Enhanced Treemap Settings' } );
        containerEl.createEl('h2', { text: 'Size & Shape' } );

        new Setting(containerEl)
            .setName('Aspect Ratio')
            .setDesc('Default Aspect Ratio (width:height)')
            .addText(text => text
                .setValue(this.plugin.settings.aspect_w.toString() + ":" + this.plugin.settings.aspect_h.toString())
                .onChange(async (value) => {
                    var ratio = value.split(":");
                    if (ratio[0] > 0 && ratio[1] > 0) {
                        this.plugin.settings.aspect_w = ratio[0];
                        this.plugin.settings.aspect_h = ratio[1];
                        this.plugin.settings.aspect = ratio[0] / ratio[1];
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Fixed Width")
            .setDesc("Fixed Width or Adpative Width by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.fixed_width).onChange(async (v) => {
                    this.plugin.settings.fixed_width = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Treemap Width')
            .setDesc('Default Treemap Width (if Using Fixed Width)')
            .addText(text => text
                .setValue(this.plugin.settings.width.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.width = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Show Headers")
            .setDesc("Show Headers by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.show_headers).onChange(async (v) => {
                    this.plugin.settings.show_headers = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Show Values")
            .setDesc("Show Values by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.show_values).onChange(async (v) => {
                    this.plugin.settings.show_values = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Sort by Value")
            .setDesc("Sort by Value or No Sort by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.sort_by_value).onChange(async (v) => {
                    this.plugin.settings.sort_by_value = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName('Header Text Size')
            .setDesc('Default Header Text Size')
            .addText(text => text
                .setValue(this.plugin.settings.h_text_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.h_text_size = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Text Size')
            .setDesc('Default Cell Text Size')
            .addText(text => text
                .setValue(this.plugin.settings.text_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.text_size = value;
                        await this.plugin.saveSettings();
                    }
                }));


        containerEl.createEl('br');
        containerEl.createEl('h2', {text: 'Shading & Shadows'});

        new Setting(containerEl)
            .setName('Header Shadow Size')
            .setDesc('Default Header Shadow Size')
            .addText(text => text
                .setValue(this.plugin.settings.h_shadow_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.h_shadow_size = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Shadow Size')
            .setDesc('Default Cell Shadow Size')
            .addText(text => text
                .setValue(this.plugin.settings.shadow_size.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.shadow_size = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName("Header Shading")
            .setDesc("Add Header Shading by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.h_shading).onChange(async (v) => {
                    this.plugin.settings.h_shading = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Shading")
            .setDesc("Add Cell Shading by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.shading).onChange(async (v) => {
                    this.plugin.settings.shading = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Shadows")
            .setDesc("Add Drop Shadows to Headers by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.h_shadow).onChange(async (v) => {
                    this.plugin.settings.h_shadow = v;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Shadows")
            .setDesc("Add Cell Shadows by Default")
            .addToggle((t) => {
                t.setValue(this.plugin.settings.shadow).onChange(async (v) => {
                    this.plugin.settings.shadow = v;
                    await this.plugin.saveSettings();
                });
            });


        containerEl.createEl('br');
        containerEl.createEl('h2', { text: 'Color' } );

        new Setting(containerEl)
            .setName("Header Border Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Header Borders")
            .addText((text) => {
                var hsla = this.plugin.settings.h_border_color[0] + ", ";
                hsla += this.plugin.settings.h_border_color[1] + ", ";
                hsla += this.plugin.settings.h_border_color[2] + ", ";
                hsla += this.plugin.settings.h_border_color[3];
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.h_border_color[0] = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.h_border_color[1] = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.h_border_color[2] = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.h_border_color[3] = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Border Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Cell Borders")
            .addText((text) => {
                var hsla = this.plugin.settings.border_color[0] + ", ";
                hsla += this.plugin.settings.border_color[1] + ", ";
                hsla += this.plugin.settings.border_color[2] + ", ";
                hsla += this.plugin.settings.border_color[3];
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.border_color[0] = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.border_color[1] = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.border_color[2] = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.border_color[3] = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Fill Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Filling Headers")
            .addText((text) => {
                var hsla = this.plugin.settings.h_fill[0] + ", ";
                hsla += this.plugin.settings.h_fill[1] + ", ";
                hsla += this.plugin.settings.h_fill[2] + ", ";
                hsla += this.plugin.settings.h_fill[3];
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.h_fill[0] = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.h_fill[1] = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.h_fill[2] = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.h_fill[3] = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Fill Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Filling Cells")
            .addText((text) => {
                var hsla = this.plugin.settings.fill[0] + ", ";
                hsla += this.plugin.settings.fill[1] + ", ";
                hsla += this.plugin.settings.fill[2] + ", ";
                hsla += this.plugin.settings.fill[3];
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.fill[0] = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.fill[1] = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.fill[2] = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.fill[3] = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Header Text Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Header Text")
            .addText((text) => {
                var hsla = this.plugin.settings.h_text_color[0] + ", ";
                hsla += this.plugin.settings.h_text_color[1] + ", ";
                hsla += this.plugin.settings.h_text_color[2] + ", ";
                hsla += this.plugin.settings.h_text_color[3];
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.h_text_color[0] = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.h_text_color[1] = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.h_text_color[2] = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.h_text_color[3] = values[3];
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Text Color")
            .setDesc("Default Hue, Saturation, Lightness and Alpha (Transparency) for Cell Text")
            .addText((text) => {
                var hsla = this.plugin.settings.text_color[0] + ", ";
                hsla += this.plugin.settings.text_color[1] + ", ";
                hsla += this.plugin.settings.text_color[2] + ", ";
                hsla += this.plugin.settings.text_color[3];
                text.setValue(hsla).onChange(async (v) => {
                    var values = v.split(", ");
                    if (values[0] >= 0 && values[0] <= 360) this.plugin.settings.text_color[0] = values[0];
                    if (values[1] >= 0 && values[1] <= 1) this.plugin.settings.text_color[1] = values[1];
                    if (values[2] >= 0 && values[2] <= 1) this.plugin.settings.text_color[2] = values[2];
                    if (values[3] >= 0 && values[3] <= 1) this.plugin.settings.text_color[3] = values[3];
                    await this.plugin.saveSettings();
                });
            });


        containerEl.createEl('br');
        containerEl.createEl('h2', { text: 'Padding' } );

        new Setting(containerEl)
            .setName('Cell Padding')
            .setDesc('Default Padding Size Around Cells')
            .addText(text => text
                .setValue(this.plugin.settings.cell_padding.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.cell_padding = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Header Text Padding')
            .setDesc('Default Padding Size Around Header Text')
            .addText(text => text
                .setValue(this.plugin.settings.h_text_padding.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.h_text_padding = value;
                        await this.plugin.saveSettings();
                    }
                }));

        new Setting(containerEl)
            .setName('Cell Text Padding')
            .setDesc('Default Padding Size Around Cell Text')
            .addText(text => text
                .setValue(this.plugin.settings.text_padding.toString())
                .onChange(async (value) => {
                    if (value > 0) {
                        this.plugin.settings.text_padding = value;
                        await this.plugin.saveSettings();
                    }
                }));

        containerEl.createEl('br');
        containerEl.createEl('h2', { text: 'Alignment' } );

        new Setting(containerEl)
            .setName("Header Horizontal Alignment")
            .setDesc("Default Horizontal Alignment for Header Text")
            .addDropdown((d) => {
                d.addOption("left", "Left");
                d.addOption("center", "Center");
                d.addOption("right", "Right");
                d.setValue(this.plugin.settings.h_halign);
                d.onChange(async (v) => {
                    this.plugin.settings.h_halign = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Horizontal Alignment")
            .setDesc("Default Cell Text Horizontal Alignment")
            .addDropdown((d) => {
                d.addOption("left", "Left");
                d.addOption("center", "Center");
                d.addOption("right", "Right");
                d.setValue(this.plugin.settings.halign);
                d.onChange(async (v) => {
                    this.plugin.settings.halign = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

        new Setting(containerEl)
            .setName("Cell Vertical Alignment")
            .setDesc("Default Cell Text Vertical Alignment")
            .addDropdown((d) => {
                d.addOption("top", "Top");
                d.addOption("center", "Center");
                d.addOption("bottom", "Bottom");
                d.setValue(this.plugin.settings.valign);
                d.onChange(async (v) => {
                    this.plugin.settings.valign = d.getValue() as string;
                    await this.plugin.saveSettings();
                });
            });

    }
}

