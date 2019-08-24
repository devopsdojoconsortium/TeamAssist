import {h} from '@cycle/dom';
import marked from "marked";

export default function markdownRender (string = "") {
  const longUrls = string.match(/(https?:\/\/\S{40,})/g)
  if (longUrls){
    // console.log("HTML FOUND", longUrls, longUrls[0].length)
    longUrls.forEach(url => {
      if (!url.match(/\)/)){
        const uParts = url.split("/")
        const re = new RegExp('\\[[^\\]]+\\]\\(' + uParts.join('\\/') + '\\)')
        if (!string.match(re)){
          string = string.replace(url, 
            "[" + uParts[2] + "/.../" + uParts[uParts.length - 1] + "](" + url + ")"
          )
        }
      }
    })
  }
  const mString = marked(string.trim()).replace(/a href="h/g, 'a target="djvNew" href="h')
  return h('div.markdown', { props: { innerHTML: mString }}, "")
}