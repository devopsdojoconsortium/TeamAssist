import {run} from '@cycle/rxjs-run';
import {makeDOMDriver} from '@cycle/dom';
import {makeHashHistoryDriver} from '@cycle/history';
import storageDriver from '@cycle/storage';
// THE MAIN FUNCTION
import TAssist from './index';

const main = TAssist;

// THE ENTRY POINT
// This is where the whole story starts.
// `run` receives a main function and an object
// with the drivers.
run(main, {
  // THE DOM DRIVER
  // `makeDOMDriver(container)` from Cycle DOM returns a
  // driver function to interact with the DOM.
  DOM: makeDOMDriver('#TeamAssist'),
  // THE HISTORY DRIVER
  // A driver to interact with browser history
  history: makeHashHistoryDriver(),
  // THE STORAGE DRIVER
  // The storage driver which can be used to access values for
  // local- and sessionStorage keys as streams.
  storage: storageDriver
});
