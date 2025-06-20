# DESIGN_GUIDE

## General Principles
- Mobile-first, fully responsive design using Tailwind CSS and custom media queries.
- Minimalist, user-friendly UI with clear separation between alert list and details.
- Accessibility: readable font sizes, sufficient color contrast, and keyboard navigation support.

## Layout
- Sidebar for feed selection (hidden or stacked on mobile).
- Filters section always visible at the top, scrollable on mobile for usability.
- Alerts list and alert details panel are side-by-side on desktop, stacked vertically on mobile.
- On mobile, alert details panel is fixed at the bottom for quick access.

## Components
- **Filters:** Compact, scrollable on mobile, always visible.
- **Alerts List:** Scrollable, supports infinite scroll to the last database entry.
- **Alert Details:** Shows transcript and audio player; sticky/fixed at the bottom on mobile.
- **Audio Player:** Uses `<video>` for audio playback, compact and responsive.

## User Management (Future)
- Add authentication UI (login, register, profile, etc.)
- Admins can view/edit/delete users and assign roles.
- All user management features should be accessible and mobile-friendly.

## Best Practices
- Remove debug code and unused UI elements before production.
- Use semantic HTML and ARIA attributes where appropriate.
- Test all features on multiple device sizes.

---
