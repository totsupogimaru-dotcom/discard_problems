/**
 * 何切る問題ビューア
 * 
 * スワイプで問題/答え画像を切り替えるビューア
 * 画像は cards/ フォルダに q_001.png, a_001.png, q_002.png, a_002.png ... の形式で格納
 */

(function () {
    'use strict';

    // ============================
    // 設定
    // ============================
    const CONFIG = {
        imageDir: 'cards',          // 画像フォルダ
        totalQuestions: 5,          // 問題数（実際の画像数に合わせて変更）
        imageExtension: 'svg',     // 画像拡張子（実際のPNG画像に差し替える場合は 'png' に変更）
        swipeThreshold: 50,        // スワイプ判定の最小距離(px)
        animationDuration: 200,    // アニメーション時間(ms)
    };

    // ============================
    // 状態管理
    // ============================
    let currentIndex = 0;        // 現在表示中のインデックス (0-based)
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    // 画像パスリストを生成
    const imageList = [];
    for (let i = 1; i <= CONFIG.totalQuestions; i++) {
        const num = String(i).padStart(3, '0');
        imageList.push({
            path: CONFIG.imageDir + '/q_' + num + '.' + CONFIG.imageExtension,
            type: 'question',
            questionNum: i
        });
        imageList.push({
            path: CONFIG.imageDir + '/a_' + num + '.' + CONFIG.imageExtension,
            type: 'answer',
            questionNum: i
        });
    }

    const totalPages = imageList.length;

    // ============================
    // DOM要素
    // ============================
    const img = document.getElementById('current-image');
    const questionNumberEl = document.getElementById('question-number');
    const pageTypeEl = document.getElementById('page-type');
    const progressEl = document.getElementById('progress');
    const viewer = document.getElementById('viewer');

    // ============================
    // 画像の表示
    // ============================
    function showImage(index, direction) {
        if (index < 0 || index >= totalPages) return;

        currentIndex = index;
        var item = imageList[currentIndex];

        // フェードアウト
        var fadeOutClass = direction === 'next' ? 'fade-out' : 'fade-out-reverse';
        img.classList.remove('fade-in', 'fade-out', 'fade-out-reverse');
        img.classList.add(fadeOutClass);

        setTimeout(function () {
            img.src = item.path;

            img.onload = function () {
                img.classList.remove('fade-out', 'fade-out-reverse');
                img.classList.add('fade-in');
            };

            img.onerror = function () {
                // 画像が見つからない場合のフォールバック
                img.classList.remove('fade-out', 'fade-out-reverse');
                img.classList.add('fade-in');
            };

            // インジケーター更新
            updateIndicator(item);
        }, CONFIG.animationDuration);
    }

    function showImageDirect(index) {
        if (index < 0 || index >= totalPages) return;

        currentIndex = index;
        var item = imageList[currentIndex];

        img.src = item.path;
        img.classList.remove('fade-out', 'fade-out-reverse');
        img.classList.add('fade-in');

        updateIndicator(item);
    }

    function updateIndicator(item) {
        questionNumberEl.textContent = 'Q' + item.questionNum;

        if (item.type === 'question') {
            pageTypeEl.textContent = '問題';
            pageTypeEl.className = 'question';
        } else {
            pageTypeEl.textContent = '答え';
            pageTypeEl.className = 'answer';
        }

        progressEl.textContent = (currentIndex + 1) + ' / ' + totalPages;
    }

    // ============================
    // スワイプ操作
    // ============================
    function onTouchStart(e) {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
        isSwiping = true;
    }

    function onTouchEnd(e) {
        if (!isSwiping) return;
        isSwiping = false;

        var touchEndX = e.changedTouches[0].screenX;
        var touchEndY = e.changedTouches[0].screenY;

        var diffX = touchStartX - touchEndX;
        var diffY = touchStartY - touchEndY;

        // 縦スワイプが大きい場合は無視
        if (Math.abs(diffY) > Math.abs(diffX)) return;

        // スワイプ距離が閾値未満なら無視
        if (Math.abs(diffX) < CONFIG.swipeThreshold) return;

        if (diffX > 0) {
            // 左スワイプ → 次へ
            goNext();
        } else {
            // 右スワイプ → 前へ
            goPrev();
        }
    }

    function goNext() {
        if (currentIndex < totalPages - 1) {
            showImage(currentIndex + 1, 'next');
        }
    }

    function goPrev() {
        if (currentIndex > 0) {
            showImage(currentIndex - 1, 'prev');
        }
    }

    // ============================
    // キーボード操作（PC用）
    // ============================
    function onKeyDown(e) {
        if (e.key === 'ArrowRight' || e.key === ' ') {
            e.preventDefault();
            goNext();
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            goPrev();
        }
    }

    // ============================
    // 初期化
    // ============================
    function init() {
        // タッチイベント
        viewer.addEventListener('touchstart', onTouchStart, { passive: true });
        viewer.addEventListener('touchend', onTouchEnd, { passive: true });

        // キーボードイベント（PC対応）
        document.addEventListener('keydown', onKeyDown);

        // デフォルトのスクロールを無効化（スマホ）
        document.body.addEventListener('touchmove', function (e) {
            e.preventDefault();
        }, { passive: false });

        // 最初の画像を表示
        showImageDirect(0);
    }

    // DOMロード後に初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
