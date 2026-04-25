# Mobile Design Standards - ERP v4.0

## 1. Visibility & Content Prioritization
*   **Vertical Economy**: Mobile screens are narrow and short. Avoid stacking multiple horizontal bars or large panels (Categories, Vehicle Filters) at the top of the viewport.
*   **Contextual UI**: Only show advanced filters when the user explicitly requests them. 
*   **Search-First**: When a search query is active, prioritize the result grid or the "Empty State" message. Hide secondary exploration tools (like "Search by Vehicle" or "Categories") to avoid visual "contamination".
*   **Empty States**: The "No results" message must be immediate and clear, not buried under filter panels.

## 2. Interaction Design
*   **Filter Toggles**: Use a floating action button (FAB) or a clear "Filter" button in the header to show/hide advanced options.
*   **Active States**: If a filter is active, show a small badge or a "Clear all" tag, but don't keep the whole selection panel open.

## 3. Typography & Sizing
*   **Readability**: Use `text-brand-sm` (14px) for body and `text-brand-xs` (12px) for labels. Avoid anything smaller than 10px unless it's a decorative badge.
*   **Tap Targets**: Ensure buttons are at least 44x44px for easy interaction.

## 5. Implementation Examples
### Search & Results
*   **Problem**: Fixed filters at the top consume >40% of the viewport.
*   **Solution**: Collapsible "Advanced Filters" panel triggered by an icon (`AdjustmentsHorizontalIcon`). Focusing on the search input automatically collapses filters to maximize result visibility.
*   **Result**: The "No results" message is visible immediately without scrolling.

## 6. Performance & Hydration
*   **Smart Hydration**: Don't fetch and render huge lists of models/brands unless the user is interacting with the vehicle filter.
