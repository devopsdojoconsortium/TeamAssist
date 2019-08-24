// Turn the data object that contains
// the tRows into a string for localStorage.
// add settings properties and likely kill off list info from retention.
export default function serialize (tRows$) {
  return tRows$.map(displayObj => JSON.stringify(
    {
      list: displayObj.list.map(tRowData =>
        ({
          title: tRowData.title,
          completed: tRowData.completed,
          id: tRowData.id
        })
      )
    }
  ));
}
