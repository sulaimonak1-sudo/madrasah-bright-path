# Mobile staff dashboard layout fix

## Changes
- Prevent the staff dashboard shell and page content from creating horizontal scrolling on narrow phones.
- Make the top workspace area, campus selector, performance panel, task list, statistic tiles, and academic-cycle row resize or wrap cleanly.
- Reduce mobile spacing and type sizes where needed while preserving the existing tablet and desktop layout.
- Keep the bottom navigation within the phone width and safe-area bounds.

## Verification
- Confirm the project builds without errors.
- Check the dashboard at a 393 × 822 phone viewport and identify any remaining elements wider than the screen.

## Technical note
The connected authentication service cannot be automatically signed into from this environment, so authenticated visual checks will use source-level overflow inspection plus the available build and runtime diagnostics.
