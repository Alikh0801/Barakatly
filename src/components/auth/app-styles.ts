/**
 * The installed app's look for the sign-in screens (Figma "login",
 * "signup"): added after the website's own classes, so they only apply in
 * the app (`app:`). In a browser tab nothing changes.
 */

/** The card is not a white box in the app: the form sits on the page. */
export const APP_AUTH_CARD = "app:bg-transparent app:p-0 app:shadow-none app:ring-0 app:sm:p-0";
export const APP_AUTH_TITLE = "app:font-app-display app:text-[28px] app:font-bold";

export const APP_INPUT = "app:h-12 app:rounded-2xl app:border-app-line";
/** The 6-digit code field. */
export const APP_CODE_INPUT = "app:h-14 app:rounded-2xl app:border-app-line";
export const APP_SUBMIT = "app:h-14 app:rounded-full app:bg-app-green app:text-base app:font-bold";
/** Google: white like the inputs, round like the main button. */
export const APP_SECONDARY = "app:h-14 app:rounded-full app:border-0 app:text-base app:font-bold app:text-app-ink";
