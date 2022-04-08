import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import $ from "jquery";

/**
 * @PublicMethod
 * Creates a custom emitter using subjects
 */
const customEmitter = function (){
  console.log("---Creating a new custom emitter---");
  this.emitter = {};
}
/**
 * @listen method
 * Creates a listener
 */
customEmitter.prototype.listen = function (name){ // ,handler
  console.log("-- ***Listen*** to the custom emitter----", name);
  this.emitter[name] || (this.emitter[name] = new Subject());
  return this.emitter[name];
    // return this.emitter[name].subscribe(handler);
}
/**
 * @emit method
 * Creates a emitter
 */
customEmitter.prototype.emit = function (name, data){
    // this.emitter[name] = new Subject();
    // console.log('customEmitter.prototype.emit', name, data, this.emitter);
  this.emitter[name].next(data);
}
/**
 * @dispose method
 * Disposes the emitter..
 */
customEmitter.prototype.dispose = function (){
  const emitters = this.emitter;
  for (const prop in emitters){
    if (emitters.hasOwnProperty(prop)){
      emitters[prop].dispose();
      console.log("---Disposing the emitter---", prop);
    }
  }
  this.emitter = {};
  this.emitter = null;
  delete this.emitter;
}

const self = {};
self.xmlHttpTimedOut = false;
// Use the below in the model if required to skip the intent observable sequence on request in progress..
/*
 intentions.itemObjNav$.skipWhile(function (action){
 return xmlHttpRequestInProgress;
 }).map...
 */
self.xmlHttpRequestInProgress = false;
self.xhrStack = [];

export default {
  customEmitter: customEmitter,
  abortXhr: function () { self.xhrStack[0].abort(); },
  getJSON: function (url, postData, blockKeys, headers) {

    const method = !postData ? "GET" : "POST";
    const data = !postData ? null : (typeof postData === "object" ? JSON.stringify(postData) : postData);
    const cache = true;
    blockKeys = blockKeys ? blockKeys : false;
        // var stackXhr = false;

    function timeoutFired (xhr) {
      console.warn("------Timeout Fired----: Status : ", xhr.target.status, self.xmlHttpTimedOut, blockKeys);
      self.xmlHttpTimedOut = blockKeys;
    }

    return Observable.create(function (observer) {

            // Create a simple XMLHttpRequest..
      let xmlhttp = new XMLHttpRequest();

            // Only one xhr object in the stack..
      if (self.stackXhr)
        self.xhrStack[0] = xmlhttp;

      xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
          let response = xmlhttp.responseText;
          if (xmlhttp.status === 200 && response.length > 1) {
                        // Below to catch JSON parse exceptions on a bad JSON format response..
            if (url.indexOf("specialCaseOUTPUT1") !== -1) {
              response = response.replace("}{", ",");
            }
            else if (response.match(/<(html|body|div)/i)) {
              response = { error: "HTML response"}
            }
            else
              response = JSON.parse(response);
            observer.next(response);
            observer.complete();
          }
          else if (xmlhttp.status === 200) { // empty response
            observer.next({ error: "Empty Response" });
            observer.complete();
          }
          else if (xmlhttp.status >= 400 || xmlhttp.status === 0) {
            // observer.error throws and exception here (404),
            // if we catch the exception here, model would not know on what to process..
            // therefore resolving the error by using onNext and onCompleted, so that model noop's
            // empty object in this case..
            observer.next({ error: (xmlhttp.status || "Stream offline from Network ") });
            observer.complete();
          }
          else { // covers our 302 redirect for now. More on this later.
                        // var errResponse = xmlhttp.responseText;
            console.info("OTHER Status :::", xmlhttp.status, response);
            observer.next(response || {});
            observer.complete();
          }

          response = null;
//                    console.log("END XHR");
        }
      };

      console.log("Start XHR on: " + url);
      xmlhttp.open(method, url);
      if (!cache) {
        xmlhttp.setRequestHeader("Pragma", "no-cache");
        xmlhttp.setRequestHeader("Cache-Control", "no-cache");
      }
      if (headers){
        const hArr = headers.split(":")
        xmlhttp.setRequestHeader(hArr[0], hArr[1]);
      }
      // xmlhttp.setRequestHeader("Authorization", "Basic YWRtaW46Y2hhbmdlaXQ=");

      self.xmlHttpTimedOut = false;

      xmlhttp.timeout = 10000;
      xmlhttp.ontimeout = timeoutFired;
           // xmlhttp.setRequestHeader("Referer", "https://zzzz.com/rest/home");
            // xmlhttp.setRequestHeader("X-Prototype-Version", "1.5.0_rc0");
            // xmlhttp.setRequestHeader("X-Requested-With", "XMLHttpRequest");
            // xmlhttp.withCredentials = true;
      xmlhttp.send(data);

            /*  // modHeader profile tested
            {"title":"Profile 1","hideComment":true,"headers":[{"enabled":true,"name":"X-Prototype-Version","value":"1.5.0_rc0","comment":""},{"enabled":true,"name":"X-Requested-With","value":"XMLHttpRequest","comment":""},{"enabled":true,"name":"Access-Control-Allow-Origin","value":"http://djvserve:335","comment":""},{"enabled":true,"name":"Origin","value":"ebiz.com","comment":""}],"respHeaders":[],"filters":[],"appendMode":""}
            */
            // Using a disposable observable sequence..
      return Observable.create(function () {
        console.info('----disposed----');
        xmlhttp.abort();
        xmlhttp = null;
      });
    })
  }
}; // end export of rxHelpers;

    /**
     * @PublicMethod...
     * Creates an API call observable sequence to subscribe on...
     * Use flatMap to get the response in the model(chain, this.getJSON.flatMap()... so that Cycle Observables don't execute before the API)
     * @Param {string} url
     * @Return {obj} data from the request...
     */

    /**
     * @PublicMethod
     * Creates a request stream
     * Creates a response stream
     * Catch errors if any and returns an the error Observable
     * Catch errors if any and returns the an empty Observable
     * @Param {string} url, {boolean} initialized
     * @Return {obj} data from the request...
     */
self.createReqRespStream = function (url) {

        // Create a request stream
  const requestStream = Observable.just(url);

        // Creates an error observable to be returned on error..
        // var err = Observable.return('Error');

        // Create a response stream
  const responseStream = requestStream
            .flatMap(function (requestUrl) {
              return Observable.fromPromise($.ajax(requestUrl));
            });

  return responseStream; // return the response stream

        //* *** Use below to catch error if any in the response stream
        /* .catch(function (error){
         console.log('error:', error);
         return err;
         // or use Observable.empty() // empty observer on error returns an empty observer..
         });*/

} // end create request response stream...
    /**
     * @PublicMethod
     * Create an observable promise...
     * @Param {string} url, {boolean} initialized
     * @Return {obj} observable promise to subscribe to..
     */
self.simpleObservableReqResp = function (url) {
  return Observable.fromPromise($.ajax(url));

} // end create request response stream...
    /**
     * @PublicMethod
     * Create a simple promise for chaining using then..
     * @Param {string} url, {boolean} initialized
     * @Return {obj} promise
     */
self.simplePromiseReqResp = function (url) {
  const d = $.Deferred();
  $.ajax({
    url: url,
    dataType: 'json'
  }).done(function (data) {
    d.resolve(data);
  }).fail(function (error) {
    let errResponse = "";
    if (error.status === 200) {
      errResponse = error.responseText;
    }
    d.resolve(errResponse);
  });
  return d.promise();

} // end create request response stream...
