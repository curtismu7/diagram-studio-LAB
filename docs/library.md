# Built-in library

Besides the four hand-written basics, the studio ships 31 more flow diagrams (`core/src/library.js`). They were converted once, read-only,
from the flow configs of a larger demo: boxes, arrows, labels, groups and step cards are kept; the per-step mock token and wire detail is not.
Group colours were mapped to the nearest studio colour. The result is plain data, validated by the same rules as anything you import.
They are read-only like the basics: use **Save a copy** to change one. The conversion script is not part of this repo.
