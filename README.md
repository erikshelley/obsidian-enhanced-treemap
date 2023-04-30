# Obsidian Enhanced TreeMap Plugin

This is a data visualization plugin for [Obsidian](https://obsidian.md), based on [D3.js](https://d3js.org), that allows for the creation of [Nested Treemaps](https://observablehq.com/@d3/nested-treemap).

- [Simple Example](#simple-example)
- [Complex Example](#complex-example)
- [Options](#options)
    - [Size & Shape Settings](#size--shape-settings)
    - [Alignment Settings](#alignment-settings)
    - [Color Settings](#color-settings)
    - [Other Styling Settings](#other-styling-settings)

## Simple Example

After installing and enabling the plugin, treemaps can be added to notes by creating json code blocks.
- Only json code blocks are checked.
- The first two rows inside the code block must be exactly as shown below.
- Each cell must have a **"name"** element. The value for this element will be shown as the text for the cell.
- The children for a cell must be contained in a **"children"** array.

<pre>
```json
{
"type": "enhancedtreemap",
"name": "Simple Example",
"children": [
    { "name": "Item 1" },
    { "name": "Item 2" }
]
}
```
</pre>

![Simple Example](./images/Simple-Example.png)

## Complex Example


## Options

Treemaps can be customized in the plugins settings, in the options section within a treemap and in individual treemap cells.

| Option              | Plugin Settings | Treemap Options | Treemap Cell |
| ------------------- | --------------- | --------------- | ------------ |
| Aspect Ratio        | X               | X               |              |
| Fixed Width         | X               | X               |              |
| Treemap Width       | X               | X               |              |
| Header Text Size    | X               | X               | X            |
| Cell Text Size      | X               | X               | X            |
| Header Padding Size | X               | X               |              |
| Text Padding Size   | X               | X               |              |
| Cell Padding Size   | X               | X               |              |
| Sort Cells by Size  | X               | X               |              |


### Size & Shape Settings
#### Treemap Aspect Ratio & Width
#### Header Text Size
#### Cell Text Size
#### Header Padding Size
#### Text Padding Size
#### Cell Padding Size
#### Sort Cells by Size

## Alignment Settings

## Color Settings

## Other Styling Settings

## Releasing new releases

- Update your `manifest.json` with your new version number, such as `1.0.1`, and the minimum Obsidian version required for your latest release.
- Update your `versions.json` file with `"new-plugin-version": "minimum-obsidian-version"` so older versions of Obsidian can download an older version of your plugin that's compatible.
- Create new GitHub release using your new version number as the "Tag version". Use the exact version number, don't include a prefix `v`. See here for an example: https://github.com/obsidianmd/obsidian-sample-plugin/releases
- Upload the files `manifest.json`, `main.js`, `styles.css` as binary attachments. Note: The manifest.json file must be in two places, first the root path of your repository and also in the release.
- Publish the release.

> You can simplify the version bump process by running `npm version patch`, `npm version minor` or `npm version major` after updating `minAppVersion` manually in `manifest.json`.
> The command will bump version in `manifest.json` and `package.json`, and add the entry for the new version to `versions.json`

## Adding your plugin to the community plugin list

- Check https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

