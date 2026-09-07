import { Redirect } from 'expo-router';

// Placeholder for the raised centre button in the tab bar. The button opens the
// /find modal directly, so this route is only reached if navigation gets here
// some other way — in which case, send it on to the picker.
export default function FindAction() {
  return <Redirect href="/find" />;
}
