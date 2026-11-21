/**
 * Firebase client setup.
 *
 * This app is built on the Firebase v8 namespaced SDK (`import firebase from
 * 'firebase'` + `firebase.firestore()`), while the snippet in the Firebase
 * console targets the v9+ modular SDK (`initializeApp()` / `getFirestore()`).
 * The same web app configuration is used here, it is simply handed to
 * `firebase.initializeApp()`.
 *
 * These identifiers are public client-side values. Access to the data is
 * controlled by Firestore security rules, not by hiding this object.
 *
 * Firebase project: tantekos-7036c
 * Console: https://console.firebase.google.com/project/tantekos-7036c/firestore
 */
import firebase from 'firebase';
import 'firebase/firestore';

// Shared with the Node scripts (see scripts/seed-rooms.js) so the config only
// lives in one place: firebase.config.json.
import config from '../firebase.config.json';

export const firebaseConfig = config;

// `initializeApp` throws if it is called twice for the same named app, which
// happens on webpack hot updates and when the pages are mounted repeatedly
// (tests), so the default app is only created once.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Shared Firestore instance. Collections currently in use:
//   - AddBooking (bookings created from /add-booking, read by /view-booking)
export const db = firebase.firestore();

/** Firestore server timestamp, used for `createdAt` / `updatedAt`. */
export const serverTimestamp = () => firebase.firestore.FieldValue.serverTimestamp();

// Firebase Analytics (the `getAnalytics(app)` line from the console snippet) is
// intentionally not enabled — the dashboard does not use it and it adds network
// calls. To switch it on, uncomment the two lines below:
//
// import 'firebase/analytics';
// export const analytics = firebase.analytics();

export default firebase;
