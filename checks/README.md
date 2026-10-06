# QuickBox verification

Run `npm ci`, then `npm run check`. jsdom is a development-only dependency. The checks use controlled local documents, not external websites, and do not execute imported scripts. They cover document replacement, validation, sanitization, undo/redo, drafts, saved state, and exported interactions. jsdom does not verify layout or native file pickers.

`npm run check` generates `checks/output/review-export.html`. Start `npm run dev` and open `http://127.0.0.1:5174/checks/output/review-export.html` to inspect it in Chrome. Output is ignored by Git.

## Browser checklist

- Create text, edit it, blur, Undo once, and Redo. Change font and palette, then Undo each.
- Drag a box, resize it, resize the header/footer, and resize the canvas. Each gesture must undo once. A click without movement must not add history.
- Edit a menu or accordion: Close discards the draft; Save commits once. Verify Undo/Redo after Save.
- Preview an element or region color: Cancel restores it, Apply commits once, and Undo restores the prior color.
- Open `fixtures/review.json`. Verify shared regions, page links, anchor navigation, escaped labels, formatted text, and accordion expansion.
- Open `fixtures/invalid.json` or malformed JSON. The existing document must remain intact.
- Save and reopen the mockup. Fonts, colors, geometry, media path, and links must survive. Undo must not cross the Open boundary.
- Create New from a document containing only header/footer content. Confirm the unsaved warning; all regions reset and Undo cannot restore the old document.
- Export a document with available and unavailable images. Confirm the missing-image list and placeholder choice. Cancellation and failure must re-enable Export HTML.
- Open the generated export directly, and verify page/menu/anchor links, nested dropdowns, accordion resizing, and footer positioning. Compare it with Navigate mode.

For automated uploads, enable **Allow access to file URLs** in Chrome's ChatGPT extension Details page. This is a user-controlled browser permission. Without it, run the file-picker checks manually. Do not disable browser security controls.

## Current verification

DOM checks pass for import failure preservation, the legacy `int_disect.json` sample, unsafe markup removal, menu drafts, style and region Undo, page/menu/anchor export links, accordion toggling, save/open, and New.

Chrome checks verify text Undo/Redo, global font/theme Undo, box dragging and resizing with one-step Undo, exported button and shared menu navigation, anchor highlighting, literal escaped labels, and expanded accordion layout. Native file-picker round-trip automation requires the extension permission described above. DOM checks are not evidence of layout correctness.
