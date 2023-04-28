import { MarkdownRenderChild } from 'obsidian';
import * as d3 from 'd3';

export default class EnhancedTreeMap {
    plugin: ChartPlugin;

    constructor(plugin: ChartPlugin) {
        this.plugin = plugin;
    }

    async renderEnhancedTreeMap(element: HTMLElement, ctx: MarkdownPostProcessorContext) {
        var renderer;

        // need this "await" on adding the svg to the DOM before adding the text otherwise getComputedTextLenght does not work
        await this.plugin.app.workspace.onLayoutReady(() => {
            renderer = new EnhancedTreeMapRenderChild(element, this, ctx, this.plugin.settings);
            ctx.addChild(renderer);
        });

        this.plugin.app.workspace.onLayoutReady(() => {
            renderer.renderEnhancedTreeMap();
        });
    }
}

class EnhancedTreeMapRenderChild extends MarkdownRenderChild {
    ctx:                  string;
    data:                 string;
    uuid:                 float;
    element:              HTMLElement;
    enhancedtreemap:      EnhancedTreeMap;
    error:                bool;
    svg:                  HTMLElement;
    svg_height:           float;
    svg_id:               string;
    svg_width:            float;

    // Size & Shape Options
    aspect:               float;
    aspect_w:             float;
    aspect_h:             float;
    fixed_width:          bool;
    width:                float;
    padding:              float;
    text_size:            float;
    header_size:          float;
    sort:                 bool;

    // Alignment Options
    horizontal_alignment: string;
    vertical_alignment:   string;
    header_alignment:     string;

    // Color Options
    border_h:             float;
    border_s:             float;
    border_l:             float;
    border_a:             float;
    fill_h:               float;
    fill_s:               float;
    fill_l:               float;
    fill_a:               float;
    text_h:               float;
    text_s:               float;
    text_l:               float;
    text_a:               float;
    header_h:             float;
    header_s:             float;
    header_l:             float;
    header_a:             float;

    // Other Styling Options
    shading:              bool;
    shadow:               bool;
    shadow_size:          float;
    show_headers:         bool;

    constructor(element: HTMLElement, enhancedtreemap: EnhancedTreeMap, ctx: MarkdownPostProcessorContext, settings: array) {
        super(element);
        this.ctx                  = ctx;
        this.element              = element;
        this.enhancedtreemap      = enhancedtreemap;
        this.error                = false;
        this.svg_id               = "enhancedtreemap";
        this.svg_height           = 10;
        this.svg_width            = 10;

        // Size & Shape Options
        this.aspect               = settings.aspect;
        this.aspect_w             = settings.aspect_w;
        this.aspect_h             = settings.aspect_h;
        this.fixed_width          = settings.fixed_width;
        this.width                = settings.width;
        this.header_size          = settings.header_size;
        this.padding              = settings.padding;
        this.text_size            = settings.text_size;
        this.sort                 = settings.sort;

        // Alignment Options
        this.horizontal_alignment = settings.horizontal_alignment;
        this.vertical_alignment   = settings.vertical_alignment;
        this.header_alignment     = settings.header_alignment;

        // Color Options
        this.border_h             = settings.border_h;
        this.border_s             = settings.border_s;
        this.border_l             = settings.border_l;
        this.border_a             = settings.border_a;
        this.fill_h               = settings.fill_h;
        this.fill_s               = settings.fill_s;
        this.fill_l               = settings.fill_l;
        this.fill_a               = settings.fill_a;
        this.text_h               = settings.text_h;
        this.text_s               = settings.text_s;
        this.text_l               = settings.text_l;
        this.text_a               = settings.text_a;
        this.header_h             = settings.header_h;
        this.header_s             = settings.header_s;
        this.header_l             = settings.header_l;
        this.header_a             = settings.header_a;

        // Other Styling Options
        this.shading              = settings.shading;
        this.shadow               = settings.shadow;
        this.shadow_size          = settings.shadow_size;
        this.show_headers         = settings.show_headers;

    }

    async onload() {
        try {
            this.data = JSON.parse(this.element.querySelector("code").textContent);
            this.parseOptions();
            if (!this.error) {
                var parentDiv = this.element.querySelector("pre");
                parentDiv.replaceWith(this.emptySVG());
                this.svg = this.element.querySelector("svg");
            }
        } catch(e) {
            this.handleError(e);
        }
    }

    handleError(message) {
        this.error = true;
        const wrapper = document.createElement("div");
        wrapper.textContent = message;
        wrapper.setAttribute("style", "color: red");
        var parentDiv = this.element.querySelector("pre");
        parentDiv.replaceWith(wrapper);
    }

    verifyOption(value, option, type, low, high, value_list) {
        if (type == "float") {
            var output = parseFloat(value);
            if (Number.isNaN(output)) this.handleError(option + " must be a number!");
            if (low != null && value < low) this.handleError(option + " must be >= " + low);
            if (high != null && value > high) this.handleError(option + " must be <= " + high);
            return output;
        }
        if (type == "bool") {
            if (typeof value != "boolean") this.handleError(option + " must be true or false (no quotes)!");
        }
        if (type == "string") {
            if (!value_list.includes(value)) this.handleError(option + "must be in this list: " + value_list);
        }
        return value;
    }

    parseOptions() {
        var options = this.data.options;
        if (options) {
            options.forEach(option => {
                if (option.text_size != null) 
                    this.text_size = this.verifyOption(option.text_size, "text_size", "float", 1, null, null); 
                if (option.text_color != null) {
                    if (option.text_color.h != null) 
                        this.text_h = this.verifyOption(option.text_color.h, "text_color h", "float", 0, 360, null);
                    if (option.text_color.s != null) 
                        this.text_s = this.verifyOption(option.text_color.s, "text_color s", "float", 0, 1, null);
                    if (option.text_color.l != null) 
                        this.text_l = this.verifyOption(option.text_color.l, "text_color l", "float", 0, 1, null);
                    if (option.text_color.a != null) 
                        this.text_a = this.verifyOption(option.text_color.a, "text_color a", "float", 0, 1, null);
                }

                if (option.header_size != null) 
                    this.header_size = this.verifyOption(option.header_size, "header_size", "float", 0, null, null);
                if (option.header_color != null) {
                    if (option.header_color.h != null) 
                        this.header_h = this.verifyOption(option.header_color.h, "header h", "float", 0, 360, null);
                    if (option.header_color.s != null) 
                        this.header_s = this.verifyOption(option.header_color.s, "header s", "float", 0, 1, null);
                    if (option.header_color.l != null) 
                        this.header_l = this.verifyOption(option.header_color.l, "header l", "float", 0, 1, null);
                    if (option.header_color.a != null) 
                        this.header_a = this.verifyOption(option.header_color.a, "header a", "float", 0, 1, null);
                }
                if (option.fill != null) {
                    if (option.fill.h != null) 
                        this.fill_h = this.verifyOption(option.fill.h, "fill h", "float", 0, 360, null);
                    if (option.fill.s != null) 
                        this.fill_s = this.verifyOption(option.fill.s, "fill s", "float", 0, 1, null);
                    if (option.fill.l != null) 
                        this.fill_l = this.verifyOption(option.fill.l, "fill l", "float", 0, 1, null);
                    if (option.fill.a != null) 
                        this.fill_a = this.verifyOption(option.fill.a, "fill a", "float", 0, 1, null);
                }

                if (option.shading != null) 
                    this.shading = this.verifyOption(option.shading, "shading", "bool", null, null, null);

                if (option.shadow != null) 
                    this.shadow = this.verifyOption(option.shadow, "shadow", "bool", null, null, null);
                if (option.shadow_size != null) 
                    this.shadow_size = this.verifyOption(option.shadow_size, "shadow_size", "float", 0, null, null);

                if (option.border_color != null) {
                    if (option.border_color.h != null) this.border_h = this.verifyOption(option.border_color.h, "border h", "float", 0, 360, null);
                    if (option.border_color.s != null) this.border_s = this.verifyOption(option.border_color.s, "border s", "float", 0, 1, null);
                    if (option.border_color.l != null) this.border_l = this.verifyOption(option.border_color.l, "border l", "float", 0, 1, null);
                    if (option.border_color.a != null) this.border_a = this.verifyOption(option.border_color.a, "border a", "float", 0, 1, null);
                }

                if (option.show_headers != null) 
                    this.show_headers = this.verifyOption(option.show_headers, "show_headers", "bool", null, null, null);
                if (this.show_headers == false) 
                    this.header_size = 0;

                if (option.padding != null) 
                    this.padding = this.verifyOption(option.padding, "padding", "float", 0, null, null);

                if (option.aspect_ratio != null) {
                    var aspect = 1;
                    var ratio = option.aspect_ratio.split(":");
                    if (ratio[0] == 0 || ratio[1] == 0) this.handleError("aspect_ratio cannot include any zeros");
                    else aspect = ratio[0] / ratio[1];
                    this.aspect = this.verifyOption(aspect, "aspect_ratio", "float", 0, null, null);
                    this.aspect_w = ratio[0];
                    this.aspect_h = ratio[1];
                }
                
                if (option.vertical_alignment != null) 
                    this.vertical_alignment = this.verifyOption(option.vertical_alignment, "vertical_alignment", "string", null, null, ["top", "center", "bottom"]);
                if (option.horizontal_alignment != null) 
                    this.horizontal_alignment = this.verifyOption(option.horizontal_alignment, "horizontal_alignment", "string", null, null, ["left", "center", "right"]);
                if (option.header_alignment != null) 
                    this.header_alignment = this.verifyOption(option.header_alignment, "header_alignment", "string", null, null, ["left", "center", "right"]);

                if (option.fixed_width != null) {
                    this.fixed_width = option.fixed_width;
                }
                if (option.width != null) {
                    this.width = this.verifyOption(option.width, "width", "float", 1, null, null);
                }

                if (option.sort != null) 
                    this.sort = this.verifyOption(option.sort, "sort", "bool", null, null, null);
            });
        }
    }

    emptySVG() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        this.uuid = Math.floor(Math.random() * 100000);
        const svg_id = "enhancedtreemap_" + this.uuid;
        this.svg_id = svg_id;
        svg.setAttribute("id", svg_id);

        if (this.fixed_width == false) { 
            svg.setAttribute("width", "100%"); 
            svg.setAttribute("viewBox", "0 0 " + this.svg_width + " " + this.svg_height);
        }
        else { 
            this.svg_width = this.width;
            this.svg_height = this.width / this.aspect;
            svg.setAttribute("width", this.svg_width); 
            svg.setAttribute("height", this.svg_height)
        }

        svg.setAttribute("name", "enhancedtreemap");
        svg.classList.add("enhancedtreemap");

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");

        const radialGradient = document.createElementNS("http://www.w3.org/2000/svg", "radialGradient");
        radialGradient.setAttribute("id", "radialgradient" + this.uuid);
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
        filter.setAttribute("id", "shadow" + this.uuid);
        filter.setAttribute("color-interpolation-filters", "sRGB");

        const feDropShadow = document.createElementNS("http://www.w3.org/2000/svg", "feDropShadow");
        feDropShadow.setAttribute("dx", this.shadow_size);
        feDropShadow.setAttribute("dy", this.shadow_size);
        feDropShadow.setAttribute("stdDeviation", "3");
        feDropShadow.setAttribute("flood-opacity", "0.5");
        filter.appendChild(feDropShadow);
        svg.append(filter);
        wrapper.append(svg);
        return wrapper;
    }

    renderEnhancedTreeMap() {
        if (this.error) return;
        var svg_element = document.getElementById(this.svg_id);
        var width = this.svg_width;
        var height = this.svg_height;
        var scale = 1;

        if (!this.fixed_width) {
            scale = this.aspect;
            width = svg_element.parentElement.offsetWidth * scale;
            height = svg_element.parentElement.offsetHeight;
            svg_element.setAttribute("viewBox", "0 0 " + width + " " + height);
        }

        var vertical_alignment = this.vertical_alignment; // this is needed to access them within wrap function
        var horizontal_alignment = this.horizontal_alignment; // this is needed to access them within wrap function

        // load json data into hierarchy of nodes
        // the ||!d.children adds a default value of 1 for any leaf nodes with no value
        var nodes;
        if (this.sort) {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; }).sort((a, b) => b.value - a.value);
        }
        else {
            nodes = d3.hierarchy(this.data).sum((d: any) => { return d.value||!d.children; });
        }

        var svg = d3.select(this.svg).append("g");

        var padding = this.padding * scale;
        var text_size = this.text_size * scale;
        var header_size = this.header_size * scale;

        // add positions to the nodes using the treemap layout
        var treemapLayout = d3.treemap()
            .tile(d3.treemapSquarify.ratio(1))
            .size([width, height])
            .paddingOuter(padding)
            .paddingTop(this.show_headers ? header_size + 4 * padding : padding)
            .paddingInner(padding)
            (nodes);

        // decendants instead of leaves shows all nodes, not just the leaves
        svg.selectAll("rect").data(nodes.descendants()).enter()
            .append("rect")
                .attr("x",      (d: any) => { return d.x0; })
                .attr("y",      (d: any) => { return d.y0; })
                .attr("width",  (d: any) => { return d.x1 - d.x0; })
                .attr("height", (d: any) => { return d.y1 - d.y0; })
                .attr("stroke", (d: any) => { return d.data.border_color == null ? 
                    d3.hsl(this.border_h, this.border_s, this.border_l, this.border_a) : 
                    d3.hsl(
                        d.data.border_color.h == null ? this.border_h : d.data.border_color.h, 
                        d.data.border_color.s == null ? this.border_s : d.data.border_color.s, 
                        d.data.border_color.l == null ? this.border_l : d.data.border_color.l, 
                        d.data.border_color.a == null ? this.border_a : d.data.border_color.a)
                })
                .attr("fill",   (d: any) => { return d.data.fill == null ? 
                    d3.hsl(this.fill_h, this.fill_s, this.fill_l, this.fill_a) : 
                    d3.hsl(
                        d.data.fill.h == null ? this.fill_h : d.data.fill.h, 
                        d.data.fill.s == null ? this.fill_s : d.data.fill.s, 
                        d.data.fill.l == null ? this.fill_l : d.data.fill.l, 
                        d.data.fill.a == null ? this.fill_a : d.data.fill.a)
                })
                .attr("filter", this.shadow ? "url(#shadow" + this.uuid + ")" : "");

        if (this.shading) {
            svg.selectAll("highlight").data(nodes.descendants()).enter()
                .append("rect")
                    .attr("x",      (d: any) => { return d.x0; })
                    .attr("y",      (d: any) => { return d.y0; })
                    .attr("width",  (d: any) => { return d.x1 - d.x0; })
                    .attr("height", (d: any) => { return d.y1 - d.y0; })
                    .attr("fill",   "url(#radialgradient" + this.uuid + ")")
                    .append("title").text((d: any) => { return d.data.name; });
        }

        svg.selectAll("text").data(nodes.leaves()).enter()
            .append("text")
                .attr("x",           (d: any) => { 
                        if (d.data.horizontal_alignment == "left"   || (d.data.horizontal_alignment == null && this.horizontal_alignment == "left"))   return d.x0 + padding; 
                        if (d.data.horizontal_alignment == "center" || (d.data.horizontal_alignment == null && this.horizontal_alignment == "center")) return d.x0 + 0.5 * (d.x1 - d.x0); 
                        if (d.data.horizontal_alignment == "right"  || (d.data.horizontal_alignment == null && this.horizontal_alignment == "right"))  return d.x1 - padding; 
                })
                .attr("y",           (d: any) => { 
                    if (d.data.vertical_alignment == "top"     || (d.data.vertical_alignment == null && this.vertical_alignment == "top"))    return d.y0 + padding + textsize(d, scale, text_size);
                    if (d.data.vertical_alignment == "center"  || (d.data.vertical_alignment == null && this.vertical_alignment == "center")) return d.y0 + 0.5 * (d.y1 - d.y0) + 0.3 * textsize(d, scale, text_size);
                    if (d.data.vertical_alignment == "bottom"  || (d.data.vertical_alignment == null && this.vertical_alignment == "bottom")) return d.y1 - padding;
                })
                .attr("v-align",     (d: any) => { return d.data.vertical_alignment })
                .attr("left",        (d: any) => { return d.x0; })
                .attr("top",         (d: any) => { return d.y0; })
                .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * padding; })
                .attr("height",      (d: any) => { return d.y1 - d.y0 - 2 * padding; })
                .attr("text-anchor", (d: any) => {
                      if (d.data.horizontal_alignment == "left"   || (d.data.horizontal_alignment == null && this.horizontal_alignment == "left"))   return "start";
                      if (d.data.horizontal_alignment == "center" || (d.data.horizontal_alignment == null && this.horizontal_alignment == "center")) return "middle";
                      if (d.data.horizontal_alignment == "right"  || (d.data.horizontal_alignment == null && this.horizontal_alignment == "right"))  return "end";
                })
                .attr("font-size",   (d: any) => { return textsize(d, scale, text_size) + "px" })
                .attr("fill",        (d: any) => { 
                    return d.data.text_color == null ? d3.hsl(this.text_h, this.text_s, this.text_l, this.text_a) : d3.hsl(
                        d.data.text_color.h == null ? this.text_h : d.data.text_color.h, 
                        d.data.text_color.s == null ? this.text_s : d.data.text_color.s, 
                        d.data.text_color.l == null ? this.text_l : d.data.text_color.l, 
                        d.data.text_color.a == null ? this.text_a : d.data.text_color.a)
                })
                .attr("opacity",     (d: any) => { return ((d.y1 - d.y0 < textsize(d, scale, text_size)) || (d.x1 - d.x0 < 2 * textsize(d, scale, text_size))) ? 0 : 1 })
                .text((d: any) => { return d.data.name; })
                .call(wrap)
                .append("title").text((d: any) => { return d.data.name; });

        // label instead of text otherwise it doesn't work
        // use the filter at the end otherwise the previous one doesn't work
        if (this.show_headers) {
            svg.selectAll("label").data(nodes.descendants().filter((d: any) => { return d.children; })).enter()
                .append("text")
                    .attr("x",           (d: any) => { 
                            if (d.data.header_alignment == "left"   || (d.data.header_alignment == null && this.header_alignment == "left"))   return d.x0 + 1.5 * padding; 
                            if (d.data.header_alignment == "center" || (d.data.header_alignment == null && this.header_alignment == "center")) return d.x0 + 0.5 * (d.x1 - d.x0); 
                            if (d.data.header_alignment == "right"  || (d.data.header_alignment == null && this.header_alignment == "right"))  return d.x1 - 1.5 * padding; 
                    })
                    .attr("y",           (d: any) => { return d.y0 + 2 * padding + 0.8 * textsize(d, scale, header_size) })
                    .attr("width",       (d: any) => { return d.x1 - d.x0 - 2 * padding; })
                    .attr("text-anchor", (d: any) => {
                          if (d.data.header_alignment == "left"   || (d.data.header_alignment == null && this.header_alignment == "left"))   return "start";
                          if (d.data.header_alignment == "center" || (d.data.header_alignment == null && this.header_alignment == "center")) return "middle";
                          if (d.data.header_alignment == "right"  || (d.data.header_alignment == null && this.header_alignment == "right"))  return "end";
                    })
                    .attr("font-size",   (d: any) => { return textsize(d, scale, header_size) + "px" })
                    .attr("fill",        (d: any) => { 
                        return d.data.text_color == null ? d3.hsl(this.header_h, this.header_s, this.header_l, this.header_a) : d3.hsl(
                            d.data.text_color.h == null ? this.header_h : d.data.text_color.h, 
                            d.data.text_color.s == null ? this.header_s : d.data.text_color.s, 
                            d.data.text_color.l == null ? this.header_s : d.data.text_color.l, 
                            d.data.text_color.a == null ? this.header_l : d.data.text_color.a)
                    })
                    .attr("opacity",     (d: any) => { return ((header_size + padding < textsize(d, scale, header_size)) || (d.x1 - d.x0 < textsize(d, scale, header_size))) ? 0 : 1 })
                    .text((d: any) => { return d.data.name; })
                    .call(ellipse)
                    .append("title").text((d: any) => { return d.data.name; });
        }

        function textsize(d, scale, fontsize) { 
            return d.data.text_size == null ? fontsize : scale * d.data.text_size; 
        }

        function wrap(text) {
            text.each(function() {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    longline,
                    fraction,
                    i,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    wordcount  = 0,
                    overflow   = false,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    v_align  = text.attr("v-align") == null ? vertical_alignment : text.attr("v-align"),
                    width    = parseFloat(text.attr("width")),
                    height   = parseFloat(text.attr("height")),
                    fontsize = parseFloat(text.attr("font-size").substring(0, text.attr("font-size").length - 2)),
                    dy = 0, 
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");

                while (word = words.pop()) {
                    // add a word to the line
                    line.push(word);
                    wordcount++;
                    
                    // only update the text if we haven't already exceeded the max rows that will fit
                    if (lineNumber * lineHeight * fontsize <= height && !overflow) {
                        tspan.text(line.join(" "));

                        // if the current line is too long to fit then remove the last word added
                        while (tspan.node().getComputedTextLength() > width && !overflow) {

                            // remove the word that made the line too long
                            line.pop();
                            wordcount--;
                            if (wordcount > 0) tspan.text(line.join(" "));

                            // if a single word is too long to fit, break it apart
                            if (wordcount == 0) {
                                longline = tspan.text();

                                // find the largest fraction of the word that will fit
                                fraction = 1;
                                while (tspan.node().getComputedTextLength() > width && tspan.text().length > 2) {
                                    fraction++;
                                    tspan.text(longline.substring(0, longline.length/fraction) + "-");
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
                                if (words.length == 0 && tspan.node().getComputedTextLength() > width) {
                                    longline = tspan.text();
                                    fraction = 1;
                                    while (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                                        fraction++;
                                        tspan.text(longline.substring(0, longline.length/fraction) + "-");
                                    }
                                    for (i=2; i <= fraction; i++) {
                                        if ((lineNumber + 1) * lineHeight * fontsize <= height) {
                                            tspan = text.append("tspan")
                                                        .attr("x", x)
                                                        .attr("y", y)
                                                        .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                                        .text(longline.substring((i - 1) * longline.length / fraction, i * longline.length / fraction) + (i < fraction ? "-" : ""));
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
                    var startDy;
                    if (v_align == "top") startDy = 0;
                    if (v_align == "center") startDy = -0.5 * lineNumber * lineHeight;
                    if (v_align == "bottom") startDy = -lineNumber * lineHeight;
                    text.selectAll("tspan").attr("dy", (d, i) => startDy + lineHeight * i + "em");
                }
            });
        }

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

    }

}

