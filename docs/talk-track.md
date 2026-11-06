# Talk track: Diagram Studio LAB

Each `##` heading is one presenter step. This is a Tool-tier offline studio: flow diagrams stored as data, with a walkthrough that walks the arrows in order. No tenant, no sign-in, no outbound request.

## What it is

Open the studio and say the pitch: diagrams are data (`diagram-studio/1` JSON), not drawings. Pick from the 35 built-in diagrams, drag boxes, press Simulate and the arrows walk in order. Everything runs on 127.0.0.1:6001.

## Pick a diagram and simulate

Choose a built-in diagram from the picker and press **Simulate**. The walkthrough highlights arrow by arrow, with **Pause / Resume / Prev / Next** and a **Speed** control. The current step panel says what happens and why it matters. **Reset** stops the walkthrough and puts every box back where it opened — your edits are kept.

## Drag to show it is live

Drag a box. Arrow labels follow, and the layout is yours. Undo/Redo (Ctrl/Cmd+Z, up to 100 steps) steps back through edits; a whole drag is one step. Press Tidy to lay the boxes out in columns by arrow direction — useful for imported or tangled diagrams, and one Undo takes it back.

## Edit a diagram

Enter **Edit** mode: Add box, click a box or arrow to rename or delete it, drag from a right dot to a left dot to add an arrow. The details editor manages title, groups and the steps — each step carries title, what, why it matters, a trace hop and which arrows it covers. A problem list appears if anything is invalid; Save stays off until it is fixed.

## Show the stories

Some steps link to story steps (Say / Tell / Why) from the four shipped stories. Click a step card that carries a story link to show it. A story id the studio does not ship shows as a plain label.

## Save a copy and start a new one

**Save a copy** of a built-in diagram — the built-ins are read-only, your copies live in `.data/diagrams/`. **New diagram** starts from a template (blank, client and server, request held for approval) with a title you type, and is saved straight away.

## Export for a deck

**Export SVG** and **Export PNG** draw what you see: current positions, light or dark, the focused arrow highlighted if a walkthrough is on. **Save as HTML** writes one self-contained file with Play/Pause/Prev/Next and the step panel baked in — email it, open it offline, no server needed. **Export/Import JSON** moves the data itself; a duplicate id is refused on import.

## Embed it in a demo page

Show the embed form: `/?embed=1&d=<id>` gives only the canvas and walkthrough controls, no editing or saving, framable only from loopback origins. Options cover theme, speed, autoplay and the step panel. This is how other standalone apps in the family draw their diagrams from this data.

## Presenter mode

Press **Present** (or `?present=1`): big type and canvas, edit and file controls hidden, the current step in a large panel. Drive it with keys — Space plays/pauses, arrows step, R resets, 1/2/3 set speed, Esc exits. Page Up/Down work with a clicker.

## Nothing leaves the machine

Close with the safety line: loopback-only bind, no sign-in, all text rendered inert, and an offline studio by design. **Reset** is the only cleanup — it restores box positions and stops the walkthrough; saved copies stay until you delete them.
