Instruction for UI/UX Color Refinement (Project: Clarity Tarot)

Objective

Remove all grey-scale tones from the user interface to comply with specific brand constraints. Replace "unlucky" greys with a premium "Anti-Grey" palette consisting of Deep Charcoals, Rich Blacks, and Antique Gold accents.

1. Global Color Mapping

Please search the codebase for the following color patterns and apply these replacements:

A. Typography Greys

Light/Medium Greys (e.g., #666666, #888888, text-gray-500, text-slate-400):

REPLACE WITH: Antique Gold (#B8860B).

Context: Use this for small labels, sub-headers (like "Meet Your Guide"), and icons.

Dark Greys (e.g., #333333, #4A4A4A, text-gray-700, text-slate-800):

REPLACE WITH: Deep Charcoal Black (#1A1A1A).

Context: Use this for main body paragraphs and secondary headings.

Headline Black: - REPLACE WITH: Rich Pure Black (#111111 or #000000).

Context: Use for the main H1 "Clarity for the modern soul."

B. UI Elements (Borders & Backgrounds)

Dividers/Borders: - REPLACE WITH: 5% opacity black (rgba(0,0,0,0.05)) or thin Gold (#B8860B) lines.

Ghost Buttons: - If a button has a grey border, change the border to the primary text color (#111111).

Background Sections: - Any light-grey backgrounds (#F3F4F6) should be changed to a warm Cream/Off-white (#FCFAF8).

2. Tailwind Configuration (If applicable)

If there is a tailwind.config.js, update the theme colors:

Redefine colors.gray to point to a slightly warmer stone or zinc palette, OR

Create a new accent: '#B8860B' and dark: '#111111' key.

3. Image Components

For image placeholders or containers with grey backgrounds, change the background color to a soft tan or the warm off-white specified above.

4. Specific Component Checks

Navbar: Ensure navigation links are Deep Charcoal, not grey.

Footer: Ensure copyright text and secondary links are either the Deep Charcoal or the Antique Gold.

Hero Section: Change the "Tarot Reader & Intuitive Guide" sub-headline specifically to Antique Gold.

5. Quality Assurance

Ensure no text has a contrast ratio issue. The "Deep Charcoal" should appear black to the naked eye but feel "softer" than pure ink black. There should be ZERO instances of the word "gray" or "grey" in the final rendered CSS classes for text.