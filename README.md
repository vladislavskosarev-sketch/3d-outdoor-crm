# 3D Printing & Outdoor Advertising CRM (3D & AD CRM)

A premium, visually stunning desktop CRM system tailored specifically for businesses specializing in 3D Printing and Outdoor Advertising. Built using React, Electron, and Supabase, it supports real-time synchronization, role-based workflows, and industry-specific pricing calculators.

---

## 🌟 Key Features

1. **Automatic Pricing Calculators**:
   * **3D Printing**: Calculates material cost, printer amortization (based on purchase price and lifespan), electricity cost (power wattage & kWh rate), labor, and applies custom markup presets (`25%`, `50%`, `75%`).
   * **Outdoor Advertising (Banners & Lightboxes)**:
     * **Banners**: Area banner material, edge welding/sewing per meter, eyelets count & rate, metal square tube frame, and flat mounting/design fees.
     * **Lightboxes**: Face material, border profiles, LED modules count, power supplies, metal pipe frame, and assembly fees.
2. **Linked Warehouse (Склад)**:
   * Manage filaments, banner rolls, profile tubes, LEDs, and power supplies directly.
   * Selecting materials in calculators dynamically pulls the current warehouse cost per unit.
3. **amoCRM-Style Kanban Board**:
   * Clean pipeline columns, drag-and-drop cards, and live filters.
   * Real-time sync ensures status modifications propagate to all connected clients instantly.
4. **Role-Based Access Control (RBAC)**:
   * Admin: Complete control, employee approval, and financial insights.
   * Manager: Client management, deal workflows, and pipeline task tracking.
   * Technician: Dedicated print queue and assembly jobs queue (without financial details).
5. **Auto-Updater Integration**:
   * Installed packages automatically check for updates against the GitHub releases page on launch.
   * Sleek progress overlays show download details and trigger automatic restarts to apply updates.

---

## 🛠️ Step-by-Step Installation & Setup

### 1. Database Configuration
1. Register a free account at [Supabase](https://supabase.com).
2. Create a new project (e.g., `CRM-3D-Outdoor`).
3. Open the **SQL Editor** in the Supabase Dashboard, create a new query, paste the contents of `supabase_schema.sql` and run it. This creates tables, security policies, triggers, and default materials.

### 2. Client Connection
1. Launch the CRM application.
2. Enter your **Supabase URL** and **Anon Key** (found in Project Settings → API).
3. Register your administrator account.

---

## 🚀 Development & Packaging

To run or build the application from source:

```bash
# Install dependencies
npm install

# Run in hot-reload development mode
npm run dev

# Package standard installer (NSIS Windows Setup .exe)
npm run package
```

---

## 🔄 Releasing Updates (Auto-Updater Workflow)

When you make modifications to the source code and want to distribute an update to your users:

1. Update the `"version"` field in `package.json` (e.g., from `1.0.0` to `1.0.1`).
2. Run `npm run package` to compile the assets.
3. Commit and push the code changes to GitHub.
4. Go to your GitHub repository -> **Releases** -> **Draft a new release**.
5. Tag the release exactly matching the version in `package.json` (e.g. `v1.0.1`).
6. Upload the generated files from the `release/` directory:
   * `3D & Outdoor CRM_Setup_1.0.1.exe`
   * `latest.yml` (Critical: the auto-updater reads this file to determine the latest available version!)
7. Publish the release.
8. Active users running older versions of the app will automatically get a popup notifying them of the update, which will download in the background and prompt them to restart.
