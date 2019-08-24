import intent from './intent';
import {model} from './model';
import view from './view';
// import {deserialize} from './storage-source';
// import serialize from './storage-sink';

// THE TTrek FUNCTION
// Using destructuring, we pick the sources DOM, History and storage
// from the sources object as argument.
function TTrek (sources) { //
  // THE INTENT (MVI PATTERN)
  // Pass relevant sources to the intent function, which set up
  // streams that model the users intentions.
  const actions = intent(sources.DOM, sources.history);
  // THE MODEL (MVI PATTERN)
  // Actions get passed to the model function which transforms the data
  // coming through the intent streams and prepares the data for the view.
  const state$ = model(actions);
  // COMPLETE THE CYCLE
  // Write the virtual dom stream to the DOM and write the
  // storage stream to localStorage.
  return {
    DOM: view(state$),
    // history: actions.url$,
  };
}

export default TTrek;
