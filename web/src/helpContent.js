// What the Help dialog says. Plain, and as hedged as the rest of the lab (rule 2): what was measured, what is simulated, what is UNVERIFIED.
export const HELP_SECTIONS = [
  {
    heading: "What this lab is",
    body: [
      "A small offline studio for flow diagrams stored as data. Pick a built-in sample (or one you saved), drag the boxes, walk the arrows in order, edit boxes and arrows, and export or import the diagram as JSON. Diagrams are drawn with React Flow.",
      "It needs no tenant and makes no outbound network request. The server listens on loopback only. This is an authoring and walkthrough tool: it does not deploy anything and does not prove anything about the real systems a diagram depicts."
    ]
  },
  {
    heading: "Measured, simulated, UNVERIFIED",
    body: [
      "What is measured here is only the lab itself: the layouts, the walkthrough steps, the wire panels' example messages and tokens. Those are authored content, not captured traffic.",
      "Anything a diagram says about a real product or architecture is UNVERIFIED by this tool — the boxes and arrows describe claims, they do not test them. Where a step cites a source, use its links and check.",
      "In hosted-mock mode the banner says \"Hosted mock: sample data only, nothing leaves this server\": saving, importing and deleting are refused by the server."
    ]
  },
  {
    heading: "How to use the page",
    body: [
      "Top bar: \"All diagrams\" toggles the index of every diagram; \"Choose a diagram\" picks one. The header menu has the theme, font size, Present toggle, Talk track, Help and Reset.",
      "Walkthrough controls: Simulate starts the walk, then Pause / Resume / Prev / Next, Speed, and Reset. The caption line under the bar explains the arrow being shown; \"Not playing\" means no step is active.",
      "Edit bar: Edit toggles editing; then Add box, drag from a box's right dot to another's left dot (or use From / To and Add arrow), Rename and Delete in the Edit selection panel. Undo / Redo work per edit; Tidy lays boxes out left to right. New diagram creates from a template.",
      "File bar: Save (samples are read-only — use Save a copy), Export JSON, Export SVG, Export PNG, Save as HTML (one self-contained file for email or offline), Import JSON, Delete.",
      "Click any box or arrow to see a detail panel with its description, which numbered steps it is part of, and (where a step has one) \"Show the example messages and tokens\"."
    ]
  },
  {
    heading: "Presenting",
    body: [
      "Turn on Present in the top menu: the page mutes the edit bars and shows a \"What is happening\" panel that follows the walkthrough. Keyboard: Space plays or pauses, ← → or Page Up/Down step, R resets, 1 2 3 set speed, Esc exits. Reset in the header restores the saved layout."
    ]
  }
];
