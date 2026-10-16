# Troubleshooting

## A tool appears stuck

- Check the file count, aggregate size, and per-image pixel limit shown on the tool page.
- Use **Cancel** for long batches. Cancellation is cooperative and takes effect at safe processing checkpoints; a browser decoder or canvas operation already in progress cannot always be interrupted immediately.
- If the page reloads or closes, browser computation stops. Reopen the same tool: when local recovery is enabled and browser storage remains available, PRISM restores files and settings so you can rerun the task.
- Try fewer/smaller files or a supported format. Corrupt files and unusually complex PDFs may fail with a visible message.

## A file is rejected

Confirm the extension and actual file type match the page's accepted formats. Rename alone does not convert a file. Check the displayed per-file and aggregate limits. For image processing, reduce dimensions below 40 megapixels.

## Output looks different

Canvas-based image operations can flatten animation and may change color profile/transparency when re-encoding. PDF and DOCX workflows have documented feature limits. Preview the output and compare it with the original before sharing or relying on it.

## Recovery or downloads unavailable

Private browsing modes, storage quotas, browser policy, or device space can block IndexedDB recovery. The page will report when recovery storage is unavailable; you can still work during the current visit. Browser download settings control final save location.

## Report a problem

Open [GitHub Issues](https://github.com/nullinam/Prism/issues/new) and include tool name/ID, browser and OS, input type/size, exact steps, and expected versus actual result. Use a synthetic file or sanitized text. Never share passwords, private documents, personal information, or file contents you are not authorized to disclose.
