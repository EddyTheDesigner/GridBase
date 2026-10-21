# GridBase 1.2

Dockable grid manager for **EffectCraft 0.11.1**, with native grouped effect controls. An independent implementation inspired by Grid Builder.

## Install

1. Download [GridBase.jsx](dist/GridBase.jsx) using GitHub’s **Download raw file** button.
2. In EffectCraft, choose **File → Scripts → Install ScriptUI Panel…** and select the downloaded file.
3. Open **Window → GridBase.jsx**. If it was already open, close and reopen the panel after installing an update.

No companion packages are required. This project was validated on EffectCraft 0.11.1; newer versions may require compatibility checks.

## Start here

1. Open **Window → GridBase.jsx**.
2. Select artwork in the timeline and click **+ Grid from selected layers**.
3. Choose a layout. Layout dimensions and spacing are edited in Effect Controls; the manager omits these duplicate fields. Proximity values still support horizontal dragging and click-to-type entry (Shift: fine; Alt: coarse).
4. Click **Edit controls**. The controller's single **GridBase** effect contains collapsible layout, transform, scale-distribution, and randomization groups. Native values support dragging, text entry, and keyframes. Changes update the grid immediately, even with GridBase closed.
5. **Name & presets…** opens a management dialog. **Keyframe edits** creates keys at the playhead; animated controls update their key at the playhead.

## Selecting, swapping, replacing

- Click a row to select it. Ctrl-click toggles rows; Shift-click selects a range. **All** and **Clear** include offscreen rows. List selection leaves the timeline selection alone.
- Drag a row onto another to swap their grid slots. Other slots retain their order. Drag the scrollbar to browse; moving a dragged row near the top/bottom scrolls the list. One Undo restores a swap.
- Select **one artwork layer outside this grid in the timeline**, select the desired slots in GridBase, then click **Replace**. Each slot receives an independent duplicate of the source, including its artwork and animation. The old slot layers are removed, the source stays untouched, and one Undo restores the complete replacement. Use **All** to replace the entire grid.
- **Add selected** adds timeline artwork. **Remove** releases all selected slots, preserving their artwork and underlying animation. **Release grid** releases the whole rig.

EffectCraft 0.11.1 currently records several Undo steps during a native Effect Controls drag. GridBase panel scrubs, swaps, and replacements each undo in one step. The generic native **Reset** does not reset this preset-defined control tree; use **Name & presets… → Reset numeric controls**. This resets numeric values at the playhead, retaining existing animation keys.

## Existing projects and demo

Older grids continue to work. Click **Upgrade to grouped controls**, or **Edit controls**, to convert their separate sliders. The undoable conversion preserves control values, keys/easing, member order, and artwork animation. Refresh alone retains the old rig format.

A self-contained example is included at [examples/GridBase Demo.ecproj](examples/GridBase%20Demo.ecproj). It uses generated tiles and does not require external media.

Use **Refresh** after switching compositions or undoing membership changes. The panel reads current native values when you move the pointer over it, without rewriting the project or inserting Undo steps. This avoids reliance on repeating script timers, which do not run in the installed desktop build. Native rigs require no Refresh after effect edits and render without the panel open.

## Performance and compatibility

The expression adapter batches independent EffectCraft property reads and specializes work by transform and layout. Native controls stay live without the old expensive chain of nested effect lookups or background expression recompilation. The adapter targets EffectCraft 0.11's expression host and stable property IDs; it is verified on installed 0.11.1. Use GridBase's **Duplicate** button for independent rigs.

Detailed measurements are in **tests/performance-v12.md**. Large grids and complex proximity setups cost more than the tested 12-layer demo.

## Morph and focus

Layout numbers are **1 Rectangle, 2 Radial, 3 Path, 4 Sphere**. Key integer endpoints: keys from 1 to 4 blend directly between rectangle and sphere, without detouring through radial and path. The scalar control's interpolation determines the blend. Unkeyed fractional layout values round to the nearest mode; use keys for morphing.

Sphere **Focus Target** is a one-based member index; 0 disables focus. Keys between targets follow a shortest-arc rotation. Ripple Focus also interpolates directly between the keyed member locations.

## Custom paths

EffectCraft 0.11.1 does not expose a mask collection on Null layers. **Edit mask guide** therefore creates a separate, disabled guide solid, parents it to the controller, and links it using **GridBase → Path → Path Source**. Edit the first mask's path on that guide. You can enable the guide while editing; its Guide Layer switch keeps it out of final renders. Calling the button again selects the existing guide.

Path Shape 5 reads that mask; the other four path shapes need no guide. Custom paths support animated mask paths and open/closed paths. Progress wraps at the endpoints. If the source is missing, the current implementation falls back to a straight line. Only the first mask is used.

## Proximity

Create a group in the Proximity tab, then move its effector Null. The radius has full influence; Falloff adds a smooth outer band. Add more effectors to share that group's settings. Within a group, the strongest influence wins. Different groups multiply scale/opacity and add displacement/rotation. Attraction uses the nearest effector. Positive strength attracts; negative repels.

Distances are measured in **controller-local coordinates** against the original layout, before individual Position offsets and proximity displacement. This avoids feedback loops. Controller scale therefore changes the apparent world-space influence radius.

To link custom values, select numeric effect properties on grid members in the timeline and click **Link selected numeric properties**. Custom Outside and Custom Inside set absolute values. Vector channels all receive the same interpolated value. Removing the group restores their original values and keys by removing GridBase's expressions. Keep the linked effect/property order stable while these links are in use.

## Editing and releasing artwork

GridBase retains the underlying transform values and keyframes. Position is interpreted as an offset from its value when the layer joined the grid. Scale and opacity retain their original values as multipliers; rotations are additive. Members become 3D and are parented to the controller.

**Remove** (member) and **Release grid** removes GridBase's expressions and restores the original parent, 2D/3D state, and user comment. It preserves underlying animation and changes you made to those values. It does **not** bake the visible grid arrangement. Releasing a grid removes its controller and owned helpers, while retaining artwork.

Existing transform expressions, separated Position dimensions, locked layers, Nulls, cameras, and lights are rejected before grid creation. Use artwork duplicates or precomps where appropriate. Do not manually change a member's GridBase parent or delete/rename GridBase effect controls. Controller and artwork layer names can be changed safely. Use GridBase's Duplicate button to obtain independent rigs.


## Scope and development

Layouts, direct keyed morphing, custom paths, twists/stagger/depth, scale gradients, randomization, proximity, numeric property links, and presets remain available. Proximity retains its own tab and group controls. Naming and presets remain management actions. Complete Grid Builder parity, radius overlays, its shared-property browser, and exact easing conventions are not implemented.

- **dist/GridBase.jsx**: standalone export, with no companion packages or network dependency.
- **src/native.js**: native effect schema, migration, and property addressing.
- **src/expression.js**: layout/proximity math and batched expression compiler.
- **src/core.js**: membership, duplication, replacement, restoration, older-rig compatibility.
- **src/panel.js**: dockable interface and gestures.
- Run **node build.mjs** to build and **node tests/run.mjs** for the existing engine suite.
- **tests/features-v12-results.txt**: 51 additional feature assertions.
- **tests/migration-v12-results.txt**: 624 sampled animation components preserved.

## Research sources

Research preceded implementation and combined public documentation, source inspection, and probes against the installed 0.11.1 engine.

- [Grid Builder product and feature overview](https://aescripts.com/grid-builder/)
- [Grid Builder reference UI: manager and grouped controls](https://aescripts.com/media/author/author_media/rico-rambke/controls04.png)
- [Grid Builder documentation](https://jeratools.gitbook.io/gridbuilder)
- [Extension workflow](https://jeratools.gitbook.io/gridbuilder/documentation/grid-builder-overview/extension)
- [Layout and morph documentation index](https://jeratools.gitbook.io/gridbuilder/llms.txt)
- [Proximity controls](https://jeratools.gitbook.io/gridbuilder/documentation/proximity/proximity-controls)
- [Custom properties](https://jeratools.gitbook.io/gridbuilder/documentation/proximity/custom-properties)
- [EffectCraft repository](https://github.com/storytold/effectcraft)
- [EffectCraft plugin and ScriptUI documentation](https://github.com/storytold/effectcraft/blob/main/docs/plugins.md)
- [EffectCraft scripting model](https://github.com/storytold/effectcraft/blob/main/crates/script/src/prelude.js)
- [EffectCraft expression model](https://github.com/storytold/effectcraft/blob/main/crates/expr/src/prelude.js)
- [EffectCraft expression replay/runtime](https://github.com/storytold/effectcraft/blob/main/crates/expr/src/runtime.rs)
- [EffectCraft control protocol](https://github.com/storytold/effectcraft/blob/main/docs/control-protocol.md)

No Grid Builder proprietary code or media assets are included in GridBase. Local research downloads, working projects, caches, and temporary desktop test logs are excluded from this repository.
