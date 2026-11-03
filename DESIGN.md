# Documentation design

Extend the familiar VitePress reading and navigation patterns. Keep a quiet reading surface and put character into typography, the task index, precise rules, and the actual LVCE workspace.

Use Public Sans, self-hosted, with a clear weight hierarchy. Prose stays around 70 characters wide. Code uses the platform monospace stack. Headings use short lines and slightly tightened tracking; controls keep normal tracking.

The light palette pairs blue-black ink with cool white and muted teal. Dark mode uses deep blue-gray surfaces and a brighter teal. Use accent color for links, selection, and focus. Use thin separators and open lists rather than a grid of feature cards.

The homepage introduces LVCE briefly, then offers two task indexes: Use LVCE and Build extensions. A real editable example demonstrates the editor below those routes. Guides retain the standard sidebar, outline, search, and previous/next navigation.

Playgrounds have a compact frame with a filename and source/preview labels, a visible reset action, and an expansion action. Their initial content is real build-time-rendered LVCE DOM. A narrow layout shows one IDE at a time using labeled tabs.

Focus rings, text selection, hover states, errors, and dark mode use the same palette. Avoid decorative page-load motion; use short transitions only to explain a state change. Respect reduced motion.

Use the existing LVCE mark from `lvce-editor/static/icons/icon.svg` beside the documentation wordmark.
