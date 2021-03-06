import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
declare var require: any
const wiki = require('wikijs').default;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  protected shownWords = [
    'だから', 'すると', 'そこで',
    'しかし', 'ところが',
    'また', 'ならびに',
    'さらに', 'しかも',
    'あるいは', 'または',
    'さて', 'ところで', 'では',
    'つまり',
    'れる', 'られる',
    'せる', 'させる',
    'ない', 'ぬ',
    'そうだ', 'ようだ', 'らしい',
    'たとえ',
    'たい', 'たがる',
    'た', 'だ', 'です',
    'ます', 'う', 'よう',
    'で', 'と', 'が', 'を', 'に', 'の', 'へ', 'や', 'から', 'より',
    'か', 'ばかり', 'まで', 'だけ', 'ほど', 'くらい', 'など', 'は', 'も',
    'こそ', 'でも', 'しか', 'さえ', 'ば', 'のに', 'ので', 'から', 'たり', 'つつ',
    'ながら', 'ても', 'けれど',
    'ばかり', 'まで', 'くらい',
    'ある', 'いる', 'なった', 'される', 'する', 'している',
    'あった', 'いた', 'なる', 'された', 'した', 'していた',
    '(', ')', '（', '）', '、', '・', '。', ',', '.', '/', '-', 'ー', '＝', '=',
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
    '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'
  ];

  public data: any = [];
  public isPreparedImages: boolean = false;
  public isPreparedGame: boolean = false;
  public isAnswerShown: boolean = false;
  public hint = '';

  public answer: string = '';

  constructor() {}

  ngOnInit() {
    let _this = this;
    let apiURL = `https://ja.wikipedia.org/w/api.php?format=json&action=query&list=random&rnnamespace=0&rnlimit=10`;

    $.ajax.call(_this, {
      url: apiURL,
      dataType: "jsonp",
      jsonpCallback: "logResults",
      success: function(msg){
        const queries = msg.query.random;

        for (let i = 0; i < queries.length; i++) {
          wiki({ apiUrl: 'http://ja.wikipedia.org/w/api.php' })
            .page(queries[i].title)
            .then((page) => {
              let obj = {
                id: queries[i].id,
                title: queries[i].title,
                summary: null,
                images: []
              }
              page.summary().then(res => obj.summary = res);
              page.mainImage().then((res) => {
                if (res) obj.images.push(res);
              });
              page.images().then((res) => {
                if (res) Array.prototype.push.apply(obj.images, res);
              });

              obj.images = _this.shuffle(obj.images);
              _this.data.push(obj);

              if (i === queries.length - 1) {
                _this.isPreparedImages = true;
              }
            });
        }
      }
    });
  }

  public startGame() {
    this.data = this.data.filter((data) => data.images.length > 0);
    this.data = this.data.sort((a,b) => {
      if (a.images.length > b.images.length) return -1;
      if (a.images.length < b.images.length) return 1;
      return 0;
    });
    this.data = this.shuffle(this.data);

    this.data[0].title = this.data[0].title.replace(/(曖昧さ回避)/g, '');

    this.isPreparedGame = true;
  }

  public generateHintText(str: string) {
    if (!str) return;

    let input = str;
    let res = '';

    for (let i = 0; i < input.length; i++) {
      const currentText = input.slice(i);
      let isMatched = false;

      if (res.length > i) {
        isMatched = true;
      }

      const words = this.shownWords.sort((a,b) => {
        if (a.length > b.length) return -1;
        if (a.length < b.length) return 1;
        return 0;
      });

      for (let j = 0; j < words.length; j++) {
        if (!isMatched && (currentText === ' ' || currentText === '　')) {
          res += currentText;
          isMatched = true;
        }

        if (!isMatched && currentText.indexOf(words[j]) === 0) {
          res += words[j];
          isMatched = true;
        }
      }

      if (!isMatched) {
        res += '◯';
      }
    }

    return res;
  }

  public showAnswer() {
    this.isAnswerShown = true;
  }

  public compareAnswer(str: string) {
    if (!str) return;

    let res = '';
    let tar = Math.max(str.length, this.data[0].title.length);

    for (let i = 0; i < tar; i++) {
      const cur = this.data[0].title[i];
      const _cur = this.katakanaToHiragana(this.zenkakuToHankaku(cur));
      const dif = this.answer[i];
      if (typeof dif === 'undefined') {
        res += `<span class="batsu"></span>`;
      }
      const _dif = this.katakanaToHiragana(this.zenkakuToHankaku(dif));

      if (cur === dif) {
        res += `<span class="maru">${cur}</span>`;
      } else {
        res += `<span class="batsu">${dif}</span>`;
      }
    }

    return res;
  }

  private katakanaToHiragana(str: string) {
    if (typeof str === 'undefined') return;
    return str.replace(/[\u30a1-\u30f6]/g, (match) => {
      let char = match.charCodeAt(0) - 0x60;
      return String.fromCharCode(char);
    });
  }

  private zenkakuToHankaku(str: string) {
    if (typeof str === 'undefined') return;
    return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
  }

  public retry() {
    location.reload();
  }

  private shuffle(array) {
    if (!array) return;

    let n = array.length, t, i;

    while (n) {
      i = Math.floor(Math.random() * n--);
      t = array[n];
      array[n] = array[i];
      array[i] = t;
    }

    return array;
  }
}
