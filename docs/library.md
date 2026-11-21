# Built-in library

Besides the four hand-written basics, the studio ships 31 more flow diagrams (`core/src/library.js`). They were converted once, read-only,
from the flow configs of a larger demo: boxes, arrows, labels, groups and step cards are kept; the per-step mock token and wire detail is not.
Group colours were mapped to the nearest studio colour. The result is plain data, validated by the same rules as anything you import.
They are read-only like the basics: use **Save a copy** to change one. The conversion script is not part of this repo.

## Converted pages (index)

Forty more diagrams were converted, again once and read-only, from the demo family's diagram pages: 29 box-and-arrow flow configs and 11 Mermaid `sequenceDiagram` sources
(drawn here as lifeline sequences). Hosts become `example.com`, internal service names become generic ones, ids, tokens and emails become placeholders, and customer-specific
pages are not shipped. Each diagram records which page it came from in `core/src/sections.js` (`DIAGRAM_ROUTES`, used only to choose its section on the All diagrams page; no route is shown or linked).
