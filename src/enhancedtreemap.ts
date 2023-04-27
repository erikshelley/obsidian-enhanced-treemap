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
            renderer = new EnhancedTreeMapRenderChild(element, this, ctx);
            ctx.addChild(renderer);
        });

        this.plugin.app.workspace.onLayoutReady(() => {
            renderer.renderEnhancedTreeMap();
        });
    }
}

class EnhancedTreeMapRenderChild extends MarkdownRenderChild {
    svg: HTMLElement;
    ctx: string;
    data: string;
    sort: bool;
    element: HTMLElement;
    text_h: float;
    text_s: float;
    text_l: float;
    text_a: float;
    fill_h: float;
    fill_s: float;
    fill_l: float;
    fill_a: float;
    aspect: float;
    svg_id: string;
    shading: bool;
    shadows: bool;
    padding: float;
    header_h: float;
    header_s: float;
    header_l: float;
    header_a: float;
    border_h: float;
    border_s: float;
    border_l: float;
    border_a: float;
    text_size: float;
    svg_width: float;
    svg_height: float;
    fixed_width: float;
    header_size: float;
    show_headers: bool;
    header_alignment: string;
    vertical_alignment: string;
    horizontal_alignment: string;
    enhancedtreemap: EnhancedTreeMap;

    constructor(element: HTMLElement, enhancedtreemap: EnhancedTreeMap, ctx: MarkdownPostProcessorContext) {
        super(element);
        this.element = element;
        this.enhancedtreemap = enhancedtreemap;
        this.svg_id = "enhancedtreemap";
        this.svg_width = 10;
        this.svg_height = 10;
        this.ctx = ctx;
        this.sort = true;
        this.text_h = 0;
        this.text_s = 0;
        this.text_l = 0.8;
        this.text_a = 1;
        this.fill_h = 0;
        this.fill_s = 0;
        this.fill_l = 0.25;
        this.fill_a = 1;
        this.aspect = 1;
        this.shading = true;
        this.shadows = true;
        this.padding = 4;
        this.fixed_width = null;
        this.header_h = this.text_h;
        this.header_s = this.text_s;
        this.header_l = this.text_l;
        this.header_a = this.text_a;
        this.border_h = 0;
        this.border_s = 0;
        this.border_l = 0;
        this.border_a = 0.5;
        this.text_size = 12;
        this.header_size = this.text_size;
        this.show_headers = true;
        this.header_alignment = "center";
        this.vertical_alignment = "center";
        this.horizontal_alignment = "center";
    }

    async onload() {
        this.data = JSON.parse(this.element.querySelector("code").textContent);
        this.parseOptions();
        var parentDiv = this.element.querySelector("pre");
        parentDiv.replaceWith(this.emptySVG());
        this.svg = this.element.querySelector("svg");
    }

    parseOptions() {
        var options = this.data.options;
        if (options) {
            options.forEach(option => {
                if (option.text_size != null) this.text_size = option.text_size;
                if (option.text_color != null) {
                    if (option.text_color.h != null) this.text_h = option.text_color.h;
                    if (option.text_color.s != null) this.text_s = option.text_color.s;
                    if (option.text_color.l != null) this.text_l = option.text_color.l;
                    if (option.text_color.a != null) this.text_a = option.text_color.a;
                }
                if (option.fill != null) {
                    if (option.fill.h != null) this.fill_h = option.fill.h;
                    if (option.fill.s != null) this.fill_s = option.fill.s;
                    if (option.fill.l != null) this.fill_l = option.fill.l;
                    if (option.fill.a != null) this.fill_a = option.fill.a;
                }
                if (option.shading != null) this.shading = option.shading;
                if (option.shadows != null) this.shadows = option.shadows;
                if (option.header_size != null) this.header_size = option.header_size;
                if (option.header_color != null) {
                    if (option.header_color.h != null) this.header_h = option.header_color.h;
                    if (option.header_color.s != null) this.header_s = option.header_color.s;
                    if (option.header_color.l != null) this.header_l = option.header_color.l;
                    if (option.header_color.a != null) this.header_a = option.header_color.a;
                }
                if (option.border_color != null) {
                    if (option.border_color.h != null) this.border_h = option.border_color.h;
                    if (option.border_color.s != null) this.border_s = option.border_color.s;
                    if (option.border_color.l != null) this.border_l = option.border_color.l;
                    if (option.border_color.a != null) this.border_a = option.border_color.a;
                }
                if (option.show_headers != null) this.show_headers = option.show_headers;
                if (this.show_headers == false) this.header_size = 0;
                if (option.padding != null) this.padding = option.padding;
                if (option.aspect != null) {
                    var ratio = option.aspect.split(":");
                    this.aspect = ratio[0] / ratio[1];
                }
                if (option.vertical_alignment != null) this.vertical_alignment = option.vertical_alignment;
                if (option.horizontal_alignment != null) this.horizontal_alignment = option.horizontal_alignment;
                if (option.header_alignment != null) this.header_alignment = option.header_alignment;
                if (option.width != null) this.fixed_width = option.width;
                if (option.sort != null) this.sort = option.sort;
            });
        }
    }

    emptySVG() {
        const wrapper = document.createElement("div");
        wrapper.classList.add("block-language-json");

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        const svg_id = "enhancedtreemap_" + Math.floor(Math.random() * 100000);
        this.svg_id = svg_id;
        svg.setAttribute("id", svg_id);
        if (this.fixed_width == null) { svg.setAttribute("width", "100%"); }
        else { svg.setAttribute("width", this.fixed_width); }
        svg.setAttribute("viewBox", "0 0 " + this.svg_width + " " + this.svg_height);
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
        return wrapper;
    }

    renderEnhancedTreeMap() {
        var scale = this.aspect;
        var svg_element = document.getElementById(this.svg_id);
        var width = svg_element.parentElement.offsetWidth * scale;
        var height = svg_element.parentElement.offsetHeight;
        var vertical_alignment = this.vertical_alignment; // this is needed to access them within wrap function
        var horizontal_alignment = this.horizontal_alignment; // this is needed to access them within wrap function
        svg_element.setAttribute("viewBox", "0 0 " + width + " " + height);

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
                .attr("filter", this.shadows ? "url(#shadow)" : "");

        if (this.shading) {
            svg.selectAll("highlight").data(nodes.descendants()).enter()
                .append("rect")
                    .attr("x",      (d: any) => { return d.x0; })
                    .attr("y",      (d: any) => { return d.y0; })
                    .attr("width",  (d: any) => { return d.x1 - d.x0; })
                    .attr("height", (d: any) => { return d.y1 - d.y0; })
                    .attr("fill",   "url(#radialgradient)");
        }

        svg.selectAll("text").data(nodes.leaves()).enter()
            .append("text")
                .attr("x",           (d: any) => { 
                        if (d.data.horizontal_alignment == "left"   || (d.data.horizontal_alignment == null && this.horizontal_alignment == "left"))   return d.x0 + padding; 
                        if (d.data.horizontal_alignment == "center" || (d.data.horizontal_alignment == null && this.horizontal_alignment == "center")) return d.x0 + 0.5 * (d.x1 - d.x0); 
                        if (d.data.horizontal_alignment == "right"  || (d.data.horizontal_alignment == null && this.horizontal_alignment == "right"))  return d.x1 - padding; 
                })
                .attr("y",           (d: any) => { 
                    if (d.data.vertical_alignment == "left"   || (d.data.vertical_alignment == null && this.vertical_alignment == "top"))    return d.y0 + padding + textsize(d, scale, text_size);
                    if (d.data.vertical_alignment == "center" || (d.data.vertical_alignment == null && this.vertical_alignment == "center")) return d.y0 + 0.5 * (d.y1 - d.y0) + 0.3 * textsize(d, scale, text_size);
                    if (d.data.vertical_alignment == "right"  || (d.data.vertical_alignment == null && this.vertical_alignment == "bottom")) return d.y1 - padding;
                })
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
                    return d.data.text_color == null ? d3.hsl(this.text_h, this.text_s, this.text_l) : d3.hsl(
                        d.data.text_color.h == null ? this.text_h : d.data.text_color.h, 
                        d.data.text_color.s == null ? this.text_s : d.data.text_color.s, 
                        d.data.text_color.l == null ? this.text_l : d.data.text_color.l, 
                        d.data.text_color.a == null ? this.text_a : d.data.text_color.a)
                })
                .attr("opacity",     (d: any) => { return ((d.y1 - d.y0 < textsize(d, scale, text_size)) || (d.x1 - d.x0 < textsize(d, scale, text_size))) ? 0 : 1 })
                .text((d: any) => { return d.data.name; })
                .call(wrap);

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
                        return d.data.text_color == null ? d3.hsl(this.header_h, this.header_s, this.header_l) : d3.hsl(
                            d.data.text_color.h == null ? this.header_h : d.data.text_color.h, 
                            d.data.text_color.s == null ? this.header_s : d.data.text_color.s, 
                            d.data.text_color.l == null ? this.header_s : d.data.text_color.l, 
                            d.data.text_color.a == null ? this.header_l : d.data.text_color.a)
                    })
                    .attr("opacity",     (d: any) => { return ((header_size + padding < textsize(d, scale, header_size)) || (d.x1 - d.x0 < textsize(d, scale, header_size))) ? 0 : 1 })
                    .text((d: any) => { return d.data.name; })
                    .call(ellipse);
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
                    overflow = false,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    width = parseFloat(text.attr("width")),
                    height = parseFloat(text.attr("height")),
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
                    
                    // only update the text if we haven't already exceeded the max rows that will fit
                    if (lineNumber * lineHeight * fontsize <= height) {
                        tspan.text(line.join(" "));

                        // if the line is now too long to fit then remove the last added word
                        if (tspan.node().getComputedTextLength() > width) {
                            // remove the word that made it too long
                            line.pop();
                            tspan.text(line.join(" "));

                            // if a single word is too long to fit, break it apart
                            if (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                                longline = tspan.text();

                                // find the largest fraction of the word that will fit
                                fraction = 1;
                                while (tspan.node().getComputedTextLength() > width && tspan.text().length > 1) {
                                    fraction++;
                                    tspan.text(longline.substring(0, longline.length/fraction) + "-");
                                }

                                // create tspans for the remaining fractions of the word
                                for (i=2; i <= fraction; i++) {
                                    // add tspan if there is room
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

                            // create a new line using the removed word
                            if ((lineNumber + 1) * lineHeight * fontsize <= height) {
                                line = [word];
                                tspan = text.append("tspan")
                                            .attr("x", x)
                                            .attr("y", y)
                                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                                            .text(word);
                                
                                // if last word is too long, break it apart
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
                    if (vertical_alignment == "top") startDy = 0;
                    if (vertical_alignment == "center") startDy = -(lineNumber * (lineHeight / 2));
                    if (vertical_alignment == "bottom") startDy = -(lineNumber * lineHeight);
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

