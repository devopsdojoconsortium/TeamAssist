/**
Starter test file for view functions.
The vdom secton needs exploring as well.
 */
/* global describe, it */
/* eslint max-nested-callbacks:0, no-unused-expressions:0 */
import chai from 'chai';
const expect = chai.expect;
// chai.use(require('chai-virtual-dom'));
// import {mockDOMResponse} from '@cycle/dom';
// import {Observable, ReplaySubject} from 'rxjs';

import {renderPanel, renderFooter, renderMenu, nl2br} from '../view';
import mdModal from '../view/viewMarkdownModal';
import markdownRender from '../view/viewMarkdownRender';

import {teamDO} from './data/displayObj';
// import {benchMark, range, dateFormat} from '../frpHelpers';

describe('mdModal', () => {
  it('should return an object with list and params', () => {
    const res = mdModal(1);
    // console.log(res)
    expect(res.params.cols.length).to.equal(2);
    expect(res.list.length).to.be.above(11);
  });
});

describe('renderPanel', () => {
  it('should be a function', () => {
    expect(renderPanel).to.be.a('function');
  });

  it('should return a team panel from teamDO mock', () => {
    const res = renderPanel(teamDO, 1, 1);
    // console.log(res)
    expect(res.sel).to.eql("div.panel");
    expect(res.children.length).to.equal(2); // div.panelHeader and div.tableContainer
  });
});

describe('markdownRender', () => {
  it('should be a function', () => {
    expect(markdownRender).to.be.a('function');
  });

  it('should shorten a URL over 40 chars before MD', () => {
    const res = markdownRender("http://localhost:8080/debug.html#/teams/modTeam/pane_progress/id/86dd69");
    expect(res.data.props.innerHTML).to.have.string('>localhost:8080/.../86dd69<'); 
    expect(res.data.props.innerHTML).to.have.string('http://localhost:8080/debug.html#/teams/modTeam/pane_progress/id/86dd69'); 
  });

  it('should ignore pre-marked URL within[]() from shortening', () => {
    const res = markdownRender("[current team] (http://localhost:8080/debug.html#/teams/modTeam/pane_progress/id/86dd69)");
    expect(res.data.props.innerHTML).to.have.string('<a target='); // target tag insert via parse 
    expect(res.data.props.innerHTML).to.not.have.string('localhost:8080/.../86dd69'); 
    expect(res.data.props.innerHTML).to.have.string('http://localhost:8080/debug.html#/teams/modTeam/pane_progress/id/86dd69'); 
  });
});

describe('nl2br', () => {
  it('should be a function', () => {
    expect(nl2br).to.be.a('function');
  });

  it('should return an array with br tags', () => {
    const res = nl2br("\n\n1) one \n 2) two \n\n 4) four");
    // console.log(res)
    expect(res[1].sel).to.eql("br"); 
    expect(res.length).to.equal(7); 
  });
});

describe('renderMenu', () => {
  it('should be a function', () => {
    expect(renderMenu).to.be.a('function');
  });

  it('should return menu HTMLObj with main/sub and 5 main items', () => {
    const res = renderMenu(teamDO);
    // console.log(res)
    expect(res.sel).to.eql("div#menuContainer");
    expect(res.children.length).to.equal(2); // main and sub
    expect(res.children[0].children.length).to.equal(5); // 5 main menu items
  });
});

describe('renderFooter', () => {
  it('should be a function', () => {
    expect(renderFooter).to.be.a('function');
  });

  it('should return h(div.footer)', () => {
    const res = renderFooter({ footer: "test" });
    expect(res.sel).to.eql("div.footer");
  });
  it('should return undef if no vd.footer obj', () => {
    const res = renderFooter({  });
    expect(res.sel).to.not.exist;
  });
});

