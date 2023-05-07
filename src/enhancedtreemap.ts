import { ButtonComponent, MarkdownPostProcessorContext, MarkdownRenderChild, setIcon } from 'obsidian';
import EnhancedTreemapPlugin from './main';
import { EnhancedTreemapSettings } from './settings';
import * as d3 from 'd3';
const d3ToPng = require('d3-svg-to-png');

// extend workspace with refresh event
declare module "obsidian" {
	interface Workspace {
		on(name: "enhancedtreemap:refresh", callback: () => void, ctx?: any): EventRef;
	}
}

export default class EnhancedTreemap {
    plugin: EnhancedTreemapPlugin;

    constructor(plugin: EnhancedTreemapPlugin) {
        this.plugin = plugin;
    }

    async renderEnhancedTreemap(element: HTMLElement, ctx: MarkdownPostProcessorContext) {
        var renderer: EnhancedTreemapRenderChild;

        // need this "await" on adding the svg to the DOM before adding the text otherwise getComputedTextLength does not work
        await this.plugin.app.workspace.onLayoutReady(() => {
            renderer = new EnhancedTreemapRenderChild(element, this, ctx, this.plugin.settings);
            ctx.addChild(renderer);
        });
    }
}

class EnhancedTreemapRenderChild extends MarkdownRenderChild {
    basePath:             string;
    ctx:                  MarkdownPostProcessorContext;
    data:                 any;
    uuid:                 number;
    previous_uuid:        number;
    element:              HTMLElement;
    enhancedtreemap:      EnhancedTreemap;
    error:                boolean;
    pluginsettings:       EnhancedTreemapSettings;
    settings:             EnhancedTreemapSettings;
    svg:                  SVGSVGElement|null;
    svg_height:           number;
    svg_id:               string;
    svg_width:            number;

    constructor(element: HTMLElement, enhancedtreemap: EnhancedTreemap, ctx: MarkdownPostProcessorContext, settings: EnhancedTreemapSettings) {
        super(element);
        this.ctx                  = ctx;
        this.element              = element;
        this.enhancedtreemap      = enhancedtreemap;
        this.error                = false;
        this.svg_id               = "enhancedtreemap";
        this.svg_height           = 10;
        this.svg_width            = 10;
        this.pluginsettings       = settings;
    }

    async onload() {
        this.registerEvent(
            this.enhancedtreemap.plugin.app.workspace.on(
                "enhancedtreemap:refresh",
                this.refresh));
        this.render();
    }

    refresh = () => { this.render(); };

    loadSettings() {
        this.settings = JSON.parse(JSON.stringify(this.pluginsettings));
    }

    async render() {
        this.loadSettings();
        this.verifyJSON();
        this.parseSettings();
        this.addEmptySVG();
        await this.enhancedtreemap.plugin.app.workspace.onLayoutReady(() => {
            this.renderEnhancedTreemap();
        });
    }

    verifyJSON() {
        var code = this.element.querySelector("code");
        if (code != null) {
            var json = code.textContent;
            if (json != null) {
                try {
                    this.data = JSON.parse(json);
                } catch(e) {
                    this.handleError(e);
                }
            }
        }
    }

    addEmptySVG() {
        if (this.error) return;
        var svg = this.emptySVG();
        if (svg != null) {
            var parentDiv = this.element.querySelector("pre");
            if (parentDiv != null) {
                parentDiv.replaceWith(svg);
                this.svg = this.element.querySelector("#enhancedtreemap_" + this.uuid);
            }
            else {
                var buttonEl = this.element.querySelector(".save_as_png_button");
                if (buttonEl != null) {
                    buttonEl.remove();
                }
                var svgEl = this.element.querySelector("#enhancedtreemap_" + this.previous_uuid);
                if (svgEl != null) {
                    svgEl.replaceWith(svg);
                    this.svg = this.element.querySelector("#enhancedtreemap_" + this.uuid);
                }
            }
        }
    }

    handleError(message: string) {
        this.error = true;
        const wrapper = document.createElement("div");
        wrapper.textContent = message;
        wrapper.setAttribute("style", "color: red");
        var parentDiv = this.element.querySelector("pre");
        if (parentDiv != null) parentDiv.replaceWith(wrapper);
    }

    verifyNumber(value: number, setting: string, low: number, high: number) {
        if (Number.isNaN(value)) this.handleError(setting + " must be a number!");
        if (low != null && value < low) this.handleError(setting + " must be >= " + low);
        if (high != null && value > high) this.handleError(setting + " must be <= " + high);
        return value;
    }

    verifyBoolean(value: boolean, setting: string) {
        if (typeof value != "boolean") this.handleError(setting + " must be true or false (no quotes)!");
        return value;
    }

    verifyString(value: string, setting: string, value_list: Array<string>) {
        if (!value_list.includes(value)) this.handleError(setting + "must be in this list: " + value_list);
        return value;
    }

    parseSettings() {
        if (this.data == null) return;
        if (this.error) return;
        var settings: Array<any>;
        settings = this.data.settings;
        if (settings) {
            settings.forEach(setting => {
                // Treemap Settings
                if (setting.aspect_ratio != null) {
                    var aspect = 1;
                    var ratio = setting.aspect_ratio.split(":");
                    if (ratio[0] == 0 || ratio[1] == 0) this.handleError("aspect_ratio cannot include any zeros");
                    else aspect = ratio[0] / ratio[1];
                    this.settings.aspect_ratio = this.verifyNumber(aspect, "aspect_ratio", 0, Number.MAX_SAFE_INTEGER);
                    this.settings.aspect_w = ratio[0];
                    this.settings.aspect_h = ratio[1];
                }
                if (setting.outer_padding != null)
                    this.settings.outer_padding = this.verifyNumber(setting.outer_padding, "outer_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.fixed_width != null)
                    this.settings.fixed_width = this.verifyBoolean(setting.fixed_width, "fixed_width");
                if (setting.h_shadow_size != null)
                    this.settings.h_shadow_size = this.verifyNumber(setting.h_shadow_size, "h_shadow_size", 0, Number.MAX_SAFE_INTEGER);
                if (setting.h_text_padding != null)
                    this.settings.h_text_padding = this.verifyNumber(setting.h_text_padding, "h_text_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.shadow_size != null)
                    this.settings.shadow_size = this.verifyNumber(setting.shadow_size, "shadow_size", 0, Number.MAX_SAFE_INTEGER);
                if (setting.show_headers != null)
                    this.settings.show_headers = this.verifyBoolean(setting.show_headers, "show_headers");
                if (setting.sort_by_value != null)
                    this.settings.sort_by_value = this.verifyBoolean(setting.sort_by_value, "sort_by_value");
                if (setting.width != null)
                    this.settings.width = this.verifyNumber(setting.width, "width", 1, Number.MAX_SAFE_INTEGER);

                // Header Settings
                if (setting.h_border_color != null) {
                    if (setting.h_border_color.h != null)
                        this.settings.h_border_color[0] = this.verifyNumber(setting.h_border_color.h, "h_border_color hue", 0, 360);
                    if (setting.h_border_color.s != null)
                        this.settings.h_border_color[1] = this.verifyNumber(setting.h_border_color.s, "h_border_color saturation", 0, 1);
                    if (setting.h_border_color.l != null)
                        this.settings.h_border_color[2] = this.verifyNumber(setting.h_border_color.l, "h_border_color lightness", 0, 1);
                    if (setting.h_border_color.a != null)
                        this.settings.h_border_color[3] = this.verifyNumber(setting.h_border_color.a, "h_border_color alpha", 0, 1);
                }
                if (setting.h_fill != null) {
                    if (setting.h_fill.h != null)
                        this.settings.h_fill[0] = this.verifyNumber(setting.h_fill.h, "h_fill hue", 0, 360);
                    if (setting.h_fill.s != null)
                        this.settings.h_fill[1] = this.verifyNumber(setting.h_fill.s, "h_fill saturation", 0, 1);
                    if (setting.h_fill.l != null)
                        this.settings.h_fill[2] = this.verifyNumber(setting.h_fill.l, "h_fill lightness", 0, 1);
                    if (setting.h_fill.a != null)
                        this.settings.h_fill[3] = this.verifyNumber(setting.h_fill.a, "h_fill alpha", 0, 1);
                }
                if (setting.h_halign != null)
                    this.settings.h_halign = this.verifyString(setting.h_halign, "h_halign", ["left", "center", "right"]);
                if (setting.h_shading != null)
                    this.settings.h_shading = this.verifyBoolean(setting.h_shading, "h_shading");
                if (setting.h_shadow != null)
                    this.settings.h_shadow = this.verifyBoolean(setting.h_shadow, "h_shadow");
                if (setting.h_text_color != null) {
                    if (setting.h_text_color.h != null)
                        this.settings.h_text_color[0] = this.verifyNumber(setting.h_text_color.h, "h_text_color hue", 0, 360);
                    if (setting.h_text_color.s != null)
                        this.settings.h_text_color[1] = this.verifyNumber(setting.h_text_color.s, "h_text_color saturation", 0, 1);
                    if (setting.h_text_color.l != null)
                        this.settings.h_text_color[2] = this.verifyNumber(setting.h_text_color.l, "h_text_color lightness", 0, 1);
                    if (setting.h_text_color.a != null)
                        this.settings.h_text_color[3] = this.verifyNumber(setting.h_text_color.a, "h_text_color alpha", 0, 1);
                }
                if (setting.h_text_size != null)
                    this.settings.h_text_size = this.verifyNumber(setting.h_text_size, "h_text_size", 1, Number.MAX_SAFE_INTEGER);
                if (this.settings.show_headers == false)
                    this.settings.h_text_size = 0;

                // Cell Settings
                if (setting.border_color != null) {
                    if (setting.border_color.h != null)
                        this.settings.border_color[0] = this.verifyNumber(setting.border_color.h, "border_color hue", 0, 360);
                    if (setting.border_color.s != null)
                        this.settings.border_color[1] = this.verifyNumber(setting.border_color.s, "border_color saturation", 0, 1);
                    if (setting.border_color.l != null)
                        this.settings.border_color[2] = this.verifyNumber(setting.border_color.l, "border_color lightness", 0, 1);
                    if (setting.border_color.a != null)
                        this.settings.border_color[3] = this.verifyNumber(setting.border_color.a, "border_color alpha", 0, 1);
                }
                if (setting.fill != null) {
                    if (setting.fill.h != null)
                        this.settings.fill[0] = this.verifyNumber(setting.fill.h, "fill hue", 0, 360);
                    if (setting.fill.s != null)
                        this.settings.fill[1] = this.verifyNumber(setting.fill.s, "fill saturation", 0, 1);
                    if (setting.fill.l != null)
                        this.settings.fill[2] = this.verifyNumber(setting.fill.l, "fill lightness", 0, 1);
                    if (setting.fill.a != null)
                        this.settings.fill[3] = this.verifyNumber(setting.fill.a, "fill alpha", 0, 1);
                }
                if (setting.halign != null)
                    this.settings.halign = this.verifyString(setting.halign, "halign", ["left", "center", "right"]);
                if (setting.shading != null)
                    this.settings.shading = this.verifyBoolean(setting.shading, "shading");
                if (setting.shadow != null)
                    this.settings.shadow = this.verifyBoolean(setting.shadow, "shadow");
                if (setting.show_values != null)
                    this.settings.show_values = this.verifyBoolean(setting.show_values, "show_values");
                if (setting.text_color != null) {
                    if (setting.text_color.h != null)
                        this.settings.text_color[0] = this.verifyNumber(setting.text_color.h, "text_color hue", 0, 360);
                    if (setting.text_color.s != null)
                        this.settings.text_color[1] = this.verifyNumber(setting.text_color.s, "text_color saturation", 0, 1);
                    if (setting.text_color.l != null)
                        this.settings.text_color[2] = this.verifyNumber(setting.text_color.l, "text_color lightness", 0, 1);
                    if (setting.text_color.a != null)
                        this.settings.text_color[3] = this.verifyNumber(setting.text_color.a, "text_color alpha", 0, 1);
                }
                if (setting.text_padding != null)
                    this.settings.text_padding = this.verifyNumber(setting.text_padding, "text_padding", 0, Number.MAX_SAFE_INTEGER);
                if (setting.text_size != null)
                    this.settings.text_size = this.verifyNumber(setting.text_size, "text_size", 1, Number.MAX_SAFE_INTEGER);
                if (setting.valign != null)
                    this.settings.valign = this.verifyString(setting.valign, "vertical_alignment", ["top", "center", "bottom"]);
            });
        }
    }

    emptySVG() {
        this.previous_uuid = this.uuid;
        this.uuid = Math.floor(Math.random() * 100000);
        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        if (this.settings.save_as_png) {
            let saveButton = new ButtonComponent(wrapper)
                .setButtonText("Save as PNG")
                //.setIcon("save") // https://lucide.dev/
                .setClass("save_as_png_button")
                .onClick(() => { 
                    d3ToPng("#enhancedtreemap_" + this.uuid, "filename", { scale: 2 });
                });
            const newline = document.createElement("br");
            wrapper.append(newline);
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        var svg_id = "enhancedtreemap_" + this.uuid;
        this.svg_id = svg_id;
        svg.setAttribute("id", svg_id);

        if (this.settings.fixed_width == false) {
            svg.setAttribute("width", "100%");
            svg.setAttribute("viewBox", "0 0 " + this.svg_width.toString() + " " + this.svg_height.toString());
        }
        else {
            this.svg_width = this.settings.width;
            this.svg_height = this.settings.width / this.settings.aspect_ratio;
            svg.setAttribute("width", this.svg_width.toString());
            svg.setAttribute("height", this.svg_height.toString())
        }

        svg.setAttribute("name", "enhancedtreemap");
        svg.classList.add("enhancedtreemap");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
        radialGradient.setAttribute("id", "radialgradient_" + this.uuid);
        radialGradient.setAttribute("cx", "25%");
        radialGradient.setAttribute("cy", "25%");
        radialGradient.setAttribute("r", "100%");

        const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop1.setAttribute("offset", "0%");
        stop1.setAttribute("stop-color", "hsla(0, 0%, 100%, 10%)");
        const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
        stop2.setAttribute("offset", "100%");
        stop2.setAttribute("stop-color", "hsla(0, 0%, 0%, 10%)");
        radialGradient.appendChild(stop1);
        radialGradient.appendChild(stop2);
        defs.appendChild(radialGradient);
        svg.appendChild(defs);

        const h_filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        h_filter.setAttribute("id", "h_shadow_" + this.uuid);
        h_filter.setAttribute("color-interpolation-filters", "sRGB");
        const h_feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        h_feDropShadow.setAttribute("dx", this.settings.h_shadow_size.toString());
        h_feDropShadow.setAttribute("dy", this.settings.h_shadow_size.toString());
        h_feDropShadow.setAttribute("stdDeviation", this.settings.h_shadow_size.toString());
        h_feDropShadow.setAttribute("flood-opacity", "0.5");
        h_filter.appendChild(h_feDropShadow);
        svg.append(h_filter);

        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "shadow_" + this.uuid);
        filter.setAttribute("color-interpolation-filters", "sRGB");
        const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        feDropShadow.setAttribute("dx", this.settings.shadow_size.toString());
        feDropShadow.setAttribute("dy", this.settings.shadow_size.toString());
        feDropShadow.setAttribute("stdDeviation", this.settings.shadow_size.toString());
        feDropShadow.setAttribute("flood-opacity", "0.5");
        filter.appendChild(feDropShadow);
        svg.append(filter);

        wrapper.append(svg);

        return wrapper;
    }

    async renderEnhancedTreemap() {
        if (this.error) return;

        var svg_element = document.getElementById(this.svg_id);

        // would be nice to have a better solution here, sometimes this function is called before the svg is in the DOM
        while (svg_element == null) {
            await new Promise(r => setTimeout(r, 100));
            svg_element = document.getElementById(this.svg_id);
        }

        var width = this.svg_width;
        var height = this.svg_height;
        var scale = 1;

        if (!this.settings.fixed_width) {
            scale = this.settings.aspect_ratio;
            if (svg_element.parentElement != null) {
                width = svg_element.parentElement.offsetWidth * scale;
                height = svg_element.parentElement.offsetHeight;
            }
            svg_element.setAttribute("viewBox", "0 0 " + width + " " + height);
        }

        var vertical_alignment = this.settings.valign; // this is needed to access them within wrap function
        var horizontal_alignment = this.settings.halign; // this is needed to access them within wrap function

        // load json data into hierarchy of nodes
        // the ||!d.children adds a default value of 1 for any leaf nodes with no value
        var nodes;
        if (this.settings.sort_by_value) {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; }).sort((a: any, b: any) => b.value - a.value);
        }
        else {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; });
        }

        var svg = d3.select(this.svg).append("g");

        var outer_padding  = this.settings.outer_padding * scale;
        var text_padding   = this.settings.text_padding * scale;
        var h_text_padding = this.settings.h_text_padding * scale;
        var text_size      = this.settings.text_size * scale;
        var h_text_size    = this.settings.h_text_size * scale;

        // add positions to the nodes using the treemap layout
        var treemapLayout = d3.treemap()
            .tile(d3.treemapSquarify.ratio(1))
            .size([width, height])
            .paddingOuter(outer_padding)
            .paddingTop(this.settings.show_headers ? h_text_size + 2 * h_text_padding : outer_padding)
            .paddingInner(outer_padding)
            (nodes);

        // decendants instead of leaves shows all nodes, not just the leaves
        svg.selectAll().data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("stroke", (d: any) => {
                    if (d.children) {
                        if (d.data.border_color == null) {
                            return d3.hsl(this.settings.h_border_color[0], this.settings.h_border_color[1], this.settings.h_border_color[2], this.settings.h_border_color[3]).toString();
                        }
                        else {
                            return d3.hsl(
                                d.data.border_color.h == null ? this.settings.h_border_color[0] : d.data.border_color.h,
                                d.data.border_color.s == null ? this.settings.h_border_color[1] : d.data.border_color.s,
                                d.data.border_color.l == null ? this.settings.h_border_color[2] : d.data.border_color.l,
                                d.data.border_color.a == null ? this.settings.h_border_color[3] : d.data.border_color.a).toString();
                        }
                    }
                    else {
                        if (d.data.border_color == null) {
                            return d3.hsl(this.settings.border_color[0], this.settings.border_color[1], this.settings.border_color[2], this.settings.border_color[3]).toString();
                        }
                        else {
                            return d3.hsl(
                                d.data.border_color.h == null ? this.settings.border_color[0] : d.data.border_color.h,
                                d.data.border_color.s == null ? this.settings.border_color[1] : d.data.border_color.s,
                                d.data.border_color.l == null ? this.settings.border_color[2] : d.data.border_color.l,
                                d.data.border_color.a == null ? this.settings.border_color[3] : d.data.border_color.a).toString();
                        }
                    }
                })
                .attr("fill",   (d: any) => {
                    if (d.children) {
                        if (d.data.fill == null) { return d3.hsl(this.settings.h_fill[0], this.settings.h_fill[1], this.settings.h_fill[2], this.settings.h_fill[3]).toString(); }
                        else {
                            return d3.hsl(
                                d.data.fill.h == null ? this.settings.h_fill[0] : d.data.fill.h,
                                d.data.fill.s == null ? this.settings.h_fill[1] : d.data.fill.s,
                                d.data.fill.l == null ? this.settings.h_fill[2] : d.data.fill.l,
                                d.data.fill.a == null ? this.settings.h_fill[3] : d.data.fill.a).toString();
                        }
                    }
                    else {
                        if (d.data.fill == null) { return d3.hsl(this.settings.fill[0], this.settings.fill[1], this.settings.fill[2], this.settings.fill[3]).toString(); }
                        else {
                            return d3.hsl(
                                d.data.fill.h == null ? this.settings.fill[0] : d.data.fill.h,
                                d.data.fill.s == null ? this.settings.fill[1] : d.data.fill.s,
                                d.data.fill.l == null ? this.settings.fill[2] : d.data.fill.l,
                                d.data.fill.a == null ? this.settings.fill[3] : d.data.fill.a).toString();
                        }
                    }
                })
                .attr("filter", (d: any) => {
                    if (d.children) {
                        if (d.data.shadow == null) { if (this.settings.h_shadow) { return "url(#h_shadow_" + this.uuid + ")"; } else return ""; }
                        else { if (d.data.shadow) { return "url(#h_shadow_" + this.uuid + ")"; } else return ""; }
                    }
                    else {
                        if (d.data.shadow == null) { if (this.settings.shadow) { return "url(#shadow_" + this.uuid + ")"; } else return ""; }
                        else { if (d.data.shadow) { return "url(#shadow_" + this.uuid + ")"; } else return ""; }
                    }
                });


        // Images
        var toDataURL = function(url: string, callback: any) {
            var xhr = new XMLHttpRequest();
            xhr.onload = function() {
                var reader = new FileReader();
                reader.onloadend = function() {
                    callback(reader.result);
                }
                reader.readAsDataURL(xhr.response);
            };
            xhr.open('GET', url);
            xhr.responseType = 'blob';
            xhr.send();
        };

        function base64Image(image: any) {
            image.each(function() {
                var img = d3.select(this);
                var url = img.attr("href");
                toDataURL(url, (imageData: any) => {
                    img.attr("href", imageData);
                });
            });
        }

        svg.selectAll().data(nodes.descendants().filter((d: any) => { return d.data.image; })).enter()
            .append("image")
                .attr("x",          (d: any) => { return d.x0; })
                .attr("y",          (d: any) => { return d.y0; })
                .attr("width",      (d: any) => { return d.x1 - d.x0; })
                .attr("height",     (d: any) => { return d.y1 - d.y0; })
                .attr("xlink:href", (d: any) => {
                    if (d.data.image.includes("://")) return d.data.image;
                    else return "app://local/" + this.settings.basePath + d.data.image; })
                .call(base64Image);


        // Shading rectangles
        svg.selectAll().data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("fill",   (d: any) => {
                    if (d.children) {
                        if (d.data.shading == null) {
                            return (this.settings.h_shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                        else {
                            return (d.data.shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                    }
                    else {
                        if (d.data.shading == null) {
                            return (this.settings.shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                        else {
                            return (d.data.shading ? "url(#radialgradient_" + this.uuid + ")" : d3.hsl(0, 0, 0, 0).toString());
                        }
                    }
                })
                .append("title").text((d: any) => { return d.data.name; });

        // Cell text
        svg.selectAll().data(nodes.leaves()).enter()
            .append("text")
                .attr("x",           (d: any) => {
                        if (d.data.halign == "left"   || (d.data.halign == null && this.settings.halign == "left"))   return d.x0 + textPadding(d, scale, text_padding);
                        if (d.data.halign == "center" || (d.data.halign == null && this.settings.halign == "center")) return d.x0 + 0.5 * (d.x1 - d.x0);
                        if (d.data.halign == "right"  || (d.data.halign == null && this.settings.halign == "right"))  return d.x1 - textPadding(d, scale, text_padding);
                })
                .attr("y",           (d: any) => {
                    if (d.data.valign == "top"     || (d.data.valign == null && this.settings.valign == "top"))    return d.y0 + textPadding(d, scale, text_padding) + textSize(d, scale, text_size);
                    if (d.data.valign == "center"  || (d.data.valign == null && this.settings.valign == "center")) return d.y0 + 0.5 * (d.y1 - d.y0) + 0.3 * textSize(d, scale, text_size);
                    if (d.data.valign == "bottom"  || (d.data.valign == null && this.settings.valign == "bottom")) return d.y1 - textPadding(d, scale, text_padding);
                })
                .attr("v-align",     (d: any) => { return d.data.valign })
                .attr("left",        (d: any) => { return d.x0; })
                .attr("top",         (d: any) => { return d.y0; })
                .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * textPadding(d, scale, text_padding); })
                .attr("height",      (d: any) => { return d.y1 - d.y0 - 2 * textPadding(d, scale, text_padding); })
                .attr("text-anchor", (d: any) => {
                      if (d.data.halign == "left"   || (d.data.halign == null && this.settings.halign == "left"))   return "start";
                      if (d.data.halign == "center" || (d.data.halign == null && this.settings.halign == "center")) return "middle";
                      if (d.data.halign == "right"  || (d.data.halign == null && this.settings.halign == "right"))  return "end";
                      return "start";
                })
                .attr("font-size",   (d: any) => { return textSize(d, scale, text_size) + "px" })
                .attr("fill",        (d: any) => {
                    return d.data.text_color == null ?
                        d3.hsl(this.settings.text_color[0], this.settings.text_color[1], this.settings.text_color[2], this.settings.text_color[3]).toString() :
                        d3.hsl(
                            d.data.text_color.h == null ? this.settings.text_color[0] : d.data.text_color.h,
                            d.data.text_color.s == null ? this.settings.text_color[1] : d.data.text_color.s,
                            d.data.text_color.l == null ? this.settings.text_color[2] : d.data.text_color.l,
                            d.data.text_color.a == null ? this.settings.text_color[3] : d.data.text_color.a).toString()
                })
                .attr("opacity",     (d: any) => { return ((d.y1 - d.y0 < textSize(d, scale, text_size)) || (d.x1 - d.x0 < 2 * textSize(d, scale, text_size))) ? 0 : 1 })
                .text((d: any) => { return this.settings.show_values ? (d.data.value || 1) + " " + d.data.name : d.data.name; })
                .call(wrap)
                .append("title").text((d: any) => { return d.data.name; });

        // Header text
        if (this.settings.show_headers) {
            svg.selectAll().data(nodes.descendants().filter((d: any) => { return d.children; })).enter()
                .append("text")
                    .attr("x",           (d: any) => {
                            if (d.data.halign == "left"   || (d.data.halign == null && this.settings.h_halign == "left"))   return d.x0 + 1.0 * h_text_padding;
                            if (d.data.halign == "center" || (d.data.halign == null && this.settings.h_halign == "center")) return d.x0 + 0.5 * (d.x1 - d.x0);
                            if (d.data.halign == "right"  || (d.data.halign == null && this.settings.h_halign == "right"))  return d.x1 - 1.0 * h_text_padding;
                            return "left";
                    })
                    .attr("y",           (d: any) => { return d.y0 + h_text_padding + 0.8 * textSize(d, scale, h_text_size) })
                    .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * h_text_padding; })
                    .attr("text-anchor", (d: any) => {
                          if (d.data.halign == "left"   || (d.data.halign == null && this.settings.h_halign == "left"))   return "start";
                          if (d.data.halign == "center" || (d.data.halign == null && this.settings.h_halign == "center")) return "middle";
                          if (d.data.halign == "right"  || (d.data.halign == null && this.settings.h_halign == "right"))  return "end";
                          return "start";
                    })
                    .attr("font-size",   (d: any) => { return textSize(d, scale, h_text_size) + "px" })
                    .attr("fill",        (d: any) => {
                        return d.data.text_color == null ?
                            d3.hsl(
                                this.settings.h_text_color[0],
                                this.settings.h_text_color[1],
                                this.settings.h_text_color[2],
                                this.settings.h_text_color[3]).toString() :
                            d3.hsl(
                                d.data.text_color.h == null ? this.settings.h_text_color[0] : d.data.text_color.h,
                                d.data.text_color.s == null ? this.settings.h_text_color[1] : d.data.text_color.s,
                                d.data.text_color.l == null ? this.settings.h_text_color[2] : d.data.text_color.l,
                                d.data.text_color.a == null ? this.settings.h_text_color[3] : d.data.text_color.a).toString()
                    })
                    .attr("opacity",     (d: any) => { return ((h_text_size + h_text_padding < textSize(d, scale, h_text_size)) || (d.x1 - d.x0 < textSize(d, scale, h_text_size))) ? 0 : 1 })
                    .text((d: any) => { return d.data.name; })
                    .call(ellipse)
                    .append("title").text((d: any) => { return d.data.name; });
        }

        function textPadding(d: any, scale: number, padding: number) {
            return d.data.text_padding == null ? padding : scale * d.data.text_padding;
        }

        function textSize(d: any, scale: number, fontsize: number) {
            return d.data.text_size == null ? fontsize : scale * d.data.text_size;
        }

        function checkWidth(tspan: any, width: number) {
            if (tspan.node() == null) return true;
            else return (tspan.node().getComputedTextLength() > width);
        }

        function wrap(text: any) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/([_-\s])/).reverse(),
                    word,
                    longline,
                    fraction,
                    i,
                    line: string[] = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    wordcount  = 0,
                    overflow   = false,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    valign   = text.attr("v-align") == null ? vertical_alignment : text.attr("v-align"),
                    width    = parseFloat(text.attr("width")),
                    height   = parseFloat(text.attr("height")),
                    fontsize = parseFloat(text.attr("font-size").substring(0, text.attr("font-size").length - 2)),
                    dy = 0,
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");

                words = words.filter(function(t) { return t != ""; });
                while (word = words.pop()) {
                    // add a word to the line
                    line.push(word);
                    wordcount++;

                    // only update the text if we haven't already exceeded the max rows that will fit
                    if (lineNumber * lineHeight * fontsize <= height && !overflow) {
                        tspan.text(line.join(""));

                        // if the current line is too long to fit then remove the last word added
                        while (checkWidth(tspan, width) && !overflow) {

                            // remove the word that made the line too long
                            line.pop();
                            wordcount--;
                            if (wordcount > 0) tspan.text(line.join(""));

                            // if a single word is too long to fit, break it apart
                            if (wordcount == 0) {
                                longline = tspan.text();

                                // find the largest fraction of the word that will fit
                                fraction = 1;
                                while (checkWidth(tspan, width) && tspan.text().length > 2) {
                                    fraction++;
                                    tspan.text(longline.substring(0, longline.length/fraction));
                                }

                                // set the remainder of the long word to be the next word
                                word = longline.substring(longline.length / fraction, longline.length);
                            }

                            // create a new line using the removed word
                            if ((lineNumber + 2) * lineHeight * fontsize <= height && !overflow) {
                                line = [word];
                                wordcount = 1;
                                tspan = text.append("tspan")
                                            .attr("x", x)
                                            .attr("y", y)
                                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                            .text(word);

                                // if we are on the last word and it is too long, break it apart
                                if (words.length == 0 && checkWidth(tspan, width)) {
                                    longline = tspan.text();
                                    fraction = 1;
                                    while (checkWidth(tspan, width) && tspan.text().length > 1) {
                                        fraction++;
                                        tspan.text(longline.substring(0, longline.length/fraction));
                                    }
                                    for (i=2; i <= fraction; i++) {
                                        if ((lineNumber + 2) * lineHeight * fontsize <= height) {
                                            tspan = text.append("tspan")
                                                        .attr("x", x)
                                                        .attr("y", y)
                                                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                                        .text(longline.substring((i - 1) * longline.length / fraction, i * longline.length / fraction));
                                        }
                                        else { overflow = true; }
                                    }
                                }
                            }
                            else { overflow = true; }
                        }
                    }
                }
                if (overflow == true) {
                    tspan.text(tspan.text() + "...");
                }
                if (lineNumber > 0) {
                    var startDy: number;
                    if (valign == "top") startDy = 0;
                    if (valign == "center") startDy = -0.5 * lineNumber * lineHeight;
                    if (valign == "bottom") startDy = -lineNumber * lineHeight;
                    text.selectAll("tspan").attr("dy", (d, i) => startDy + lineHeight * i + "em");
                }
            });
        }

        function ellipse(text: any) {
            text.each(function() {
                var text = d3.select(this);
                var width = parseFloat(text.attr("width"));
                var original = text.text();
                var tspan = text.text("").append("tspan").text(original);
                if (!checkWidth(tspan, width)) return;
                tspan.text(original + "...");
                while (checkWidth(tspan, width) && tspan.text().length > 3) {
                    tspan.text(tspan.text().substring(0, tspan.text().length - 4) + "...");
                }
            });
        }

    }

}

