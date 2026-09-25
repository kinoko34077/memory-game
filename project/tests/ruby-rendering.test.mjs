import test from 'node:test';
import assert from 'node:assert/strict';
import { convertRubyText, renderRubyToElement } from '../../ruby.js';

test('plain imported markup is escaped when Ruby rendering is enabled', () => {
  const source = '<img src=x onerror="alert(1)">&text';
  assert.equal(
    convertRubyText(source),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;&amp;text'
  );
});

test('supported ruby notation keeps only controlled ruby markup', () => {
  assert.equal(
    convertRubyText('前｜漢字《かんじ》後'),
    '前<ruby>漢字<rt>かんじ</rt></ruby>後'
  );
});

test('ruby body and reading content are escaped inside controlled tags', () => {
  assert.equal(
    convertRubyText('｜<b>x</b>《<i>y</i>》'),
    '<ruby>&lt;b&gt;x&lt;/b&gt;<rt>&lt;i&gt;y&lt;/i&gt;</rt></ruby>'
  );
});

test('renderRubyToElement keeps Ruby disabled output as plain text', () => {
  const element = { innerHTML: '', textContent: '' };
  renderRubyToElement(element, '前｜漢字《かんじ》<b>後</b>', false);
  assert.equal(element.textContent, '前漢字<b>後</b>');
  assert.equal(element.innerHTML, '');
});
