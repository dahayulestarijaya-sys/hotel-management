# HotelsQuad Property Management System

A hotel property management system web app using ReactJS and Firebase. Hotel PMS is a business class
web application used to control and coordinate all the activities happening in a hotel from a single
point or platform. It provides so many features which will increase the growth of any hotel community
both socially and economically. The web application is built with React and Firebase: React hooks and
React-Redux power the frontend, Firebase (Firestore) is used as the backend.

## Prerequisites

- Node.js 18+ (tested with Node 20)
- npm 9+
- A code editor such as VS Code or WebStorm and basic knowledge of JavaScript, React hooks and Firebase

## Getting started

```bash
npm install
npm start
```

The development server runs on [http://localhost:3000](http://localhost:3000) with hot module
replacement. Deep links (e.g. `/dashboard`) are supported through the dev server history fallback.

## Available scripts

| Script               | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm start`          | Start the webpack dev server on port 3000        |
| `npm run build`      | Create a production build in `build/`            |
| `npm test`           | Run the Jest test suite                          |
| `npm run test:watch` | Run Jest in watch mode                           |
| `npm run seed:rooms` | Insert the sample rooms into Firestore           |
| `npm run seed:bookings` | Insert the sample bookings into Firestore     |
| `npm run seed:inventory` | Insert the sample inventory items into Firestore |

## Tech stack

- React 16 with hooks, `react-redux` 6 and `redux-saga` 1, `lucide-react` for icons
- `connected-react-router` 6 and `react-router-dom` 5
- Material UI 4 (`@material-ui/core`, icons and pickers) and `styled-components`
- `react-intl` 2 for translations (`translations/` + `i18n.js`)
- SCSS compiled with dart-sass
- Firebase 8 (Firestore)

## UI / design system

Every screen shares one visual language — navy + lavender surfaces, pill buttons, soft status
badges and **Lucide** icons:

- **Tokens** — `docs/css/mixin.scss` (`$navy`, `$bodyBg`, `$inputBg`, radii, shadows, breakpoints).
- **Global styles** — `docs/css/style.scss`: typography, filled/outlined fields, buttons
  (`.uiButton`, `.uiIconButton`), tables, soft badges, empty/error states.
- **MUI theme** — `material-theme.js` mirrors the tokens, so Material buttons, fields, menus, tabs
  and tooltips match the custom components.
- **App shell** — `containers/_PrivateRoute` (sidebar + top bar + breadcrumb + page heading),
  `components/SidebarNav` (grouped navigation with icons and the property card),
  `components/Header` (global search, quick check-in, live-data pill, currency, notifications and
  profile menu — all fed by Firestore),
- **Page header** — breadcrumb, page title, a short description per route, today's date and a live
  data pill. The copy lives in the `PAGE_META` map in `containers/_PrivateRoute/index.js`, so a new
  route only needs one entry.
- **Dashboard hero** — a navy gradient panel with the greeting, a sentence summarising today's
  arrivals/departures and two real percentages (checked in / checked out). The KPI row below uses
  tone-coded cards (`--bookings`, `--guests`, `--arrivals`, `--departures`) with a short live hint
  such as “3 confirmed” or “2 in-house”.
- **Charts** — Recharts bars use vertical gradients and rounded tops, the guests chart is a soft
  area chart, and both share the `.chartTooltip` card (label + colour dot + value). The status donut
  uses rounded slices and a recessed centre.
- **Icons** — `lucide-react` across the shell, page toolbars and table actions
  (`LayoutDashboard`, `CalendarCheck2`, `BedDouble`, `PackageSearch`, `BarChart3`, `Plus`,
  `Pencil`, `Trash2`, …).
- **Shared page pieces** — `.pageToolbar` (pill search field), `.uiPill`, `.pageActions`,
  `.pageMainValue`, `.pageSubValue`, `.pageState`, `.pageError` keep the booking, room and inventory
  lists identical.
- **Motion** — page content and cards use the shared `hqReveal` fade-up, the live dots pulse, and
  everything collapses to near-zero animation under `prefers-reduced-motion: reduce`.
- **Responsive** down to 390 px: the sidebar becomes an off-canvas drawer, tables scroll inside
  their card and the header hides secondary actions.

## Project structure

```
app.js                 Application entry point (store, router, i18n, render)
configureStore.js      Store factory with saga and router middleware
reducers.js            Root reducer (router + language)
i18n.js                react-intl locale data and translation messages
global-styles.js       Global SCSS / styles
components/            Reusable presentational components
containers/            Connected containers, pages and layouts
  __Routes/            Route table
  _PrivateRoute/       Application layout (sidebar, header, footer)
  Pages/               Booking, rooms, inventory, reports and profile pages
utils/                 Domain helpers (bookings, rooms, inventory, dashboard, currency, settings)
docs/css/              Global theme partials (tokens, icons, base styles)
sass/elements/         Shared element styles (buttons, modal, dropdown, alerts)
images/                Static assets
translations/          Locale message catalogs (en, de, pt, fr)
tests/                 Jest setup and shared mocks
webpack.config.js      Webpack 5 configuration (aliases, SCSS, assets, dev server)
babel.config.js        Babel 7 presets/plugins
jest.config.js         Jest configuration
```

### Path aliases

Webpack and Jest both resolve the following aliases, so imports such as
`import Card from 'components/Card'` or `import logo from 'images/logo.png'` work:

`components`, `containers`, `utils`, `images`, `sass`

## Firebase

Firebase is configured in **`firebase.config.json`** (project `tantekos-7036c`), which is imported by
`utils/firebase.js` (the app) and by `scripts/seed-rooms.js` (the seeding script), so the values only
live in one place. The app uses the Firebase **v8 namespaced SDK** that it is written against, so the
web app config generated by the Firebase console for the v9+ modular SDK is passed to
`firebase.initializeApp()` instead of `initializeApp()`. The exported `db` (Firestore) instance is
shared by the booking, room and dashboard modules.

Firestore collections in use:

| Collection   | Written by                                        | Read by                                                      |
| ------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| `AddBooking` | `/add-booking`, `/edit-booking/:id` (`add`/`update`) | dashboard, `/view-booking`, `/reports`, header notifications |
| `Rooms`      | `/add-rooms`, `/edit-rooms/:id` (`add`/`update`)     | `/view-rooms`, `/reports`                                    |
| `Inventory`  | `/add-item`, `/edit-item/:id` (`add`/`update`)       | `/view-inventory`, `/reports`, header notifications          |
| `Settings`   | `/profile` (`set` with merge)                       | sidebar (`property`), header + profile page (`profile`)      |

There is **no mock/demo data layer**: every screen subscribes to Firestore with `onSnapshot`, and
empty collections render explicit empty states (`No bookings yet — …`) instead of placeholder rows.
The template demo pages (inbox, chat, contact list, calendar, chart gallery, material table, text
editor) are no longer routed, so nothing in the navigation shows static sample data.

To point the app at a different project, replace the values of `firebaseConfig` in
`firebase.config.json` (shared by the app and the seed scripts). Remember to:

1. Create a **Firestore database** in that project (Build → Firestore Database).
2. Publish security rules that allow the operations the app performs, e.g. while developing:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /AddBooking/{document} { allow read, write: if true; }  // development only
    match /Rooms/{document}      { allow read, write: if true; }
    match /Inventory/{document}  { allow read, write: if true; }
    match /Settings/{document}   { allow read, write: if true; }
  }
}
```

> These rules are open on purpose while the app has no authentication. Tighten them (or add Firebase
> Auth) before exposing the app publicly.

## Booking module

The booking feature is fully wired to Firestore (`AddBooking` collection):

| Route                | Screen      | What it does                                                                 |
| -------------------- | ----------- | ---------------------------------------------------------------------------- |
| `/add-booking`       | Add Booking | Validates the form, rejects duplicate booking IDs, writes a document         |
| `/view-booking`      | View Booking| Live list (`onSnapshot`), search, status badges, edit link, delete           |
| `/edit-booking/:id`  | Edit Booking| Loads the document by ID, updates it and returns to the list                 |

Document shape written by the app (`utils/bookings.js`):

```js
{
  bkId, fname, lname, email, phone,
  guestno,               // number
  selectedValue,         // gender: female | male | others
  roomType,              // single | double | quad | king | queen
  roomId, roomNumber,    // assigned physical room ('' = unassigned)
  rate,                  // agreed nightly rate in IDR
  paid,                  // amount received so far
  statusValue,           // confirmed | arrived | departed | pending | cancelled
  arrivalDate, arrivalTime,       // 'YYYY-MM-DD' / 'HH:mm'
  departureDate, departureTime,
  checkedInAt, checkedOutAt,      // set by the front-desk actions
  createdAt, updatedAt,  // Firestore server timestamps
}
```

- **Validation** (`validateBooking`): required booking ID, names, email, phone, guests, gender,
  room type, status and dates; email/phone format checks; guests ≥ 1; departure on/after arrival;
  rate/paid cannot be negative and a payment cannot exceed `nights × rate`; a booking cannot be
  `arrived` without an assigned room. Errors are shown inline under each field.
- **Booking IDs are unique** — the add/edit screens query `where('bkId', '==', …)` before writing.
- **Backward compatible** — documents created by the previous version (no dates, room stored in
  `values.room`) still render in the list and open correctly in the edit form.
- Shared form UI: `components/BookingForm`; formatting/search/sort helpers: `utils/bookings.js`
  (covered by `utils/tests/bookings.test.js`).

### Room assignment & availability

- The booking form has an **Assigned Room** picker fed by the `Rooms` collection. Picking a room
  fills the nightly rate from `rentPerNight` and copies the room type, and the picker only offers
  rooms that are **not in maintenance** and **free for the chosen dates**
  (`availableRoomsFor` → `isRoomAvailable` in `utils/bookings.js`).
- Date ranges are half-open: the departure day can be sold to the next guest, and overlapping
  `confirmed` / `arrived` / `pending` bookings block the room. `departed` and `cancelled` bookings
  never block, and the booking currently being edited is excluded.
- The save actions re-check availability against the live `AddBooking` snapshot, so two front-desk
  users cannot double-book the same room.

### Front desk: check-in, check-out, cancel

| Action | Where | Effect |
| ------ | ----- | ------ |
| Check in | Log-in icon on `/view-booking` (or status `arrived` in the form) | booking → `arrived` + `checkedInAt`, room → `occupied` |
| Check out | Log-out icon on `/view-booking` | booking → `departed` + `checkedOutAt`, room → `available` |
| Cancel | status `cancelled` in the edit form | booking → `cancelled`, room → `available` |
| Re-assign | change the room in the edit form | previous room freed, new room set to the booking's status |

Check-in / check-out / cancel are written with a Firestore **batch** so the booking and the room
document always change together; the icons are disabled with an explanatory tooltip when the
booking has no room or is not in the right state (`canCheckIn`, `canCheckOut`, `roomStatusForBooking`).

### Folio, payments & exports

- Each booking has a **folio**: `nights = departure - arrival` (minimum 1), `total = nights × rate`,
  `balance = total - paid`, exposed by `bookingNights`, `bookingTotal`, `bookingBalance` and
  `paymentStatus` (`unbilled` / `unpaid` / `partial` / `paid` / `void`). The booking form shows a
  live summary strip and the list shows the total plus a payment badge and the amount due.
- Payments are recorded by editing the **Paid / Deposit** field — the app never invents payments.
- **Export CSV** on the booking, room and inventory lists downloads exactly what the current search
  and filters show (`utils/csv.js`, separator `;`, UTF-8 BOM so Excel opens Rupiah amounts):
  `bookings-YYYY-MM-DD.csv`, `rooms-YYYY-MM-DD.csv`, `inventory-YYYY-MM-DD.csv`.
- Bookings created before billing existed have no rate: `npm run seed:rates` backfills `rate` from
  the median `rentPerNight` of the matching room type (it never touches `paid`).


## Rooms

Rooms are stored in the Firestore collection `Rooms` and managed from the rooms pages:

| Route                | Screen      | What it does                                                               |
| -------------------- | ----------- | -------------------------------------------------------------------------- |
| `/add-rooms`         | Add Rooms   | Validates the form, rejects duplicate room numbers, writes a document       |
| `/view-rooms`        | View Rooms  | Live list (`onSnapshot`), search, bed-capacity filter, edit link, delete    |
| `/edit-rooms/:id`    | Edit Rooms  | Loads the room by ID, updates it and returns to the list                    |

Document shape written by the app (`utils/rooms.js`):

```js
{
  roomNumber,            // unique reference, e.g. '101'
  roomType,              // single | double | quad | king | queen
  acType,                // ac | nonAc
  bedCapacity,           // number (1-20)
  rentPerNight,          // number, in Indonesian Rupiah (IDR)
  phone,
  status,                // available | occupied | maintenance
  cancellation,          // free | small | nil
  details,               // free text
  amenities: [],         // bed, pillow, chair, table, tv, wifi, locker, swimmingPool
  createdAt, updatedAt,  // Firestore server timestamps
}
```

- **Validation** (`validateRoom`): required room number, type, AC type, status, cancellation policy,
  bed capacity, rent and phone; bed capacity must be 1–20, rent cannot be negative.
- **Currency**: prices are Indonesian Rupiah (`IDR`), formatted locally as `Rp 350.000` (dot
  thousands separators, no decimals) by `utils/currency.js`. To price in another currency change
  `CURRENCY_CODE`, `CURRENCY_SYMBOL` and `CURRENCY_LOCALE` there — every price in the UI goes
  through `formatCurrency`.
- **Room numbers are unique** — the add/edit screens query `where('roomNumber', '==', …)` first.
- `View Rooms` filters client side by free text (number, type, status, phone, details, amenities) and
  by a minimum bed capacity slider.
- Shared form UI: `components/RoomForm`; helpers: `utils/rooms.js`
  (covered by `utils/tests/rooms.test.js`).
- Room photos are **not** persisted yet: the old form posted files to a public `httpbin.org` test
  endpoint and discarded them, so that uploader was removed. Wiring images up requires Firebase
  Storage (bucket + rules) and a `photoUrl` field.

## Inventory

Inventory items are stored in the Firestore collection `Inventory`:

| Route                 | Screen        | What it does                                                             |
| --------------------- | ------------- | ------------------------------------------------------------------------ |
| `/add-item`           | Add Item      | Validates the form, rejects duplicate item IDs, writes a document         |
| `/view-inventory`     | View Inventory| Live list (`onSnapshot`), search, "only low stock" filter, edit, delete   |
| `/edit-item/:id`      | Edit Item     | Loads the item by ID, updates it and returns to the list                  |

Document shape written by the app (`utils/inventory.js`):

```js
{
  itemCode,              // unique reference, e.g. 'ITM-101'
  name,
  category,              // room | kitchen | bathroom | laundry | maintenance | electronics | other
  location,              // free text, e.g. 'Shelf 4'
  quantity,              // number (0 or more)
  createdAt, updatedAt,  // Firestore server timestamps
}
```

- **Validation** (`validateItem`): required item ID (max 20 chars), name, category, location and
  quantity; quantity must be a whole number of 0 or more.
- **Item IDs are unique** — the add/edit screens query `where('itemCode', '==', …)` first.
- **Stock badges** are derived from the quantity: `0` → *Out of stock*, `1–5` →
  *Low stock* (`STOCK_LOW_THRESHOLD`), above → *In stock*. The "Only low stock" switch filters the
  list to items that need restocking.
- Shared form UI: `components/InventoryForm`; helpers: `utils/inventory.js`
  (covered by `utils/tests/inventory.test.js`).

## Sample data

Three idempotent seed scripts put **starter records in Firestore** (real, editable documents — not an
in-app mock layer). They talk to the REST API using `firebase.config.json`, so no SDK or service
account is needed, and existing records are skipped:

```bash
npm run seed:rooms      # 10 rooms: 101-105, 201-203, 301, 401
npm run seed:bookings   # 15 bookings: BK-1001 … BK-1015
npm run seed:inventory  # 14 inventory items: ITM-101 … ELC-502
npm run seed:rates      # backfill nightly rates on bookings without one
```

- **Rooms** cover every room type, AC/Non-AC, bed capacities 1–4, the three statuses
  (available / occupied / maintenance), amenities, and nightly rents from
  **Rp 350.000 to Rp 1.750.000**.
- **Bookings** use dates relative to the day you run the script, so `/dashboard` immediately has
  meaningful numbers: arrivals and departures today, all four statuses, and bookings spread over
  the last ~5 months for the growth charts. Guests are famous computer-science names.
- **Inventory items** cover all categories (room, bathroom, kitchen, laundry, maintenance,
  electronics) with mixed quantities: 9 *In stock*, 3 *Low stock* and 2 *Out of stock*, so the stock
  badges and the "Only low stock" filter are visible straight away.
- Running a script again only prints the records that already exist
  (`Done. Created 0, skipped 15 existing booking(s).`). Edit or delete the data from
  `/view-rooms` and `/view-booking`.

## Dashboard

`/dashboard` (`containers/Dashboard/Analytic`) is driven by **live Firestore data** — it subscribes
to the `AddBooking` collection with `onSnapshot`, so every booking created/edited/deleted updates
the page instantly.

| Widget | Source |
| ------ | ------ |
| KPI cards (Total Booking, Total Guests, CheckIn Today, CheckOut Today) | `calculateBookingMetrics` |
| Booking Growth (one bar per month with the booking count above it) | `bookingGrowthByMonth` + `bookingGrowthMonths` (range follows the oldest booking, 6–12 months) |
| Booking Status (donut + legend) | `bookingStatusDistribution` |
| CheckIn Progress | arrived today ÷ arrivals today |
| CheckOut Progress | departed today ÷ departures today |
| Guests per Month (line with point markers) | `bookingGrowthByMonth` (`guests`) |

- Numbers render as `—` while the first snapshot is loading; a red banner appears if Firestore
  rejects the read (e.g. security rules).
- Derived data lives in `utils/dashboard.js` and is unit tested in `utils/tests/dashboard.test.js`.
- The header notification bell and the "Live" pill are fed by the same `AddBooking`/`Inventory`
  snapshots, so there are no hard-coded alerts.

## Reports

`/reports` (`containers/Pages/Reports`) aggregates the three collections in one screen:

| Block | Source |
| ----- | ------ |
| Total Bookings / Total Guests | `calculateBookingMetrics(AddBooking)` |
| Available Rooms | `Rooms` documents with `status === 'available'` |
| Low Stock Items | `Inventory` documents at or below `STOCK_LOW_THRESHOLD` (5) |
| Booking Growth | `bookingGrowthByMonth` (range follows the oldest booking) |
| Booking Status | `bookingStatusDistribution` |
| Rooms by Status | counts per `available` / `occupied` / `maintenance` |
| Low Stock Items table | item, category, location, quantity and stock badge |
| Monthly Revenue | `bookingRevenueByMonth` (room revenue per arrival month, cancelled excluded) |
| Revenue Summary | `calculateRevenueMetrics` → billed / collected / outstanding |

## Profile & property settings

`/profile` edits the two Firestore documents that configure the shell — there is no hard-coded
persona or property code:

| Document             | Fields                                   | Used by                        |
| -------------------- | ---------------------------------------- | ------------------------------ |
| `Settings/profile`   | `name`, `role`, `email`, `phone`, `address` | header avatar + profile page |
| `Settings/property`  | `name`, `code`                            | sidebar footer, profile page   |

Until they are filled in, the sidebar shows *Not configured* and the header shows *Staff profile*
with a link to `/profile`. Values are validated (`utils/settings.js`) and written with
`set(..., { merge: true })`, so a live snapshot never overwrites a form that is being edited.

## Routing and authentication

`/` redirects to `/dashboard`; the remaining routes are the booking, room and inventory screens,
`/reports` and `/profile`. Unknown URLs (including the old template demo routes) render the 404 page.

The template's login/signup/forgot-password screens are **not routed** because this Firebase project
does not have the Email/Password provider enabled — the app previously used a fake client-side login,
which has been removed rather than left as dead UI. To add real auth later:

1. Enable **Authentication → Sign-in method → Email/Password** in the Firebase console.
2. Add a route guard that listens to `firebase.auth().onAuthStateChanged` and signs in with
   `firebase.auth().signInWithEmailAndPassword(email, password)`.
3. Tighten the Firestore rules to `allow read, write: if request.auth != null;`.

## Deployment

`npm run build` emits a static site into `build/` (JavaScript, CSS, images, fonts and the
`.htaccess` file). Serve `build/` from any static host and make sure unknown routes fall back to
`index.html` (`.htaccess` and `.nginx.conf` contain ready-to-use configurations).

## Main modules

- Dashboard (live KPIs, booking growth, status donut, check-in/out progress)
- Reports (bookings, rooms by status, low-stock table, monthly revenue + summary)
- Booking (room assignment, availability check, folio/payments, check-in & check-out, CSV export)
- Rooms (add / view / edit / delete, CSV export)
- Inventory (add / view / edit / delete, low-stock filter, CSV export)
- Profile & property settings (Firestore `Settings`)
- Navigation bar and footer

## Contributors

- Sheena K Sasi
- Sherin Shaju
- Shijith M S
- Anjana Paul
