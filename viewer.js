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
        totalQuestions: 30,          // 問題数（実際の画像数に合わせて変更）
        imageExtensions: ['jpg', 'png'], // 対応する拡張子のリスト
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

        // 問題用のデータ（拡張子は後で解決）
        imageList.push({
            basePath: CONFIG.imageDir + '/q_' + num,
            type: 'question',
            questionNum: i
        });
        // 回答用のデータ（拡張子は後で解決）
        imageList.push({
            basePath: CONFIG.imageDir + '/a_' + num,
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

        // 拡張子を順番に試す関数
        function tryLoad(extIndex) {
            if (extIndex >= CONFIG.imageExtensions.length) {
                // すべての拡張子を試しても見つからない場合
                img.classList.remove('fade-out', 'fade-out-reverse');
                img.classList.add('fade-in');
                return;
            }

            const path = item.basePath + '.' + CONFIG.imageExtensions[extIndex];
            const tempImg = new Image();

            tempImg.onload = function () {
                img.src = path;
                img.classList.remove('fade-out', 'fade-out-reverse');
                img.classList.add('fade-in');
                // 成功したパスをキャッシュ（オプションで追加可能）
                item.path = path;
            };

            tempImg.onerror = function () {
                // 次の拡張子を試す
                tryLoad(extIndex + 1);
            };

            tempImg.src = path;
        }

        setTimeout(function () {
            if (item.path) {
                // 既にパスが解決済みの場合はそれを使う
                img.src = item.path;
                img.onload = function () {
                    img.classList.remove('fade-out', 'fade-out-reverse');
                    img.classList.add('fade-in');
                };
            } else {
                // 未解決の場合は拡張子を順に試行
                tryLoad(0);
            }
            // インジケーター更新
            updateIndicator(item);
        }, CONFIG.animationDuration);
    }

    function showImageDirect(index) {
        if (index < 0 || index >= totalPages) return;

        currentIndex = index;
        var item = imageList[currentIndex];

        if (item.path) {
            img.src = item.path;
            img.classList.remove('fade-out', 'fade-out-reverse');
            img.classList.add('fade-in');
        } else {
            // 初回表示時も拡張子試行を行う
            function tryLoadDirect(extIndex) {
                if (extIndex >= CONFIG.imageExtensions.length) return;
                const path = item.basePath + '.' + CONFIG.imageExtensions[extIndex];
                const tempImg = new Image();
                tempImg.onload = function () {
                    img.src = path;
                    img.classList.remove('fade-out', 'fade-out-reverse');
                    img.classList.add('fade-in');
                    item.path = path;
                };
                tempImg.onerror = function () {
                    tryLoadDirect(extIndex + 1);
                };
                tempImg.src = path;
            }
            tryLoadDirect(0);
        }

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
        var clientX = e.changedTouches[0].clientX; // 画面相対のX座標

        var diffX = touchStartX - touchEndX;
        var diffY = touchStartY - touchEndY;

        // スワイプ距離が閾値未満ならタップと判定
        if (Math.abs(diffX) < CONFIG.swipeThreshold && Math.abs(diffY) < CONFIG.swipeThreshold) {
            var screenWidth = window.innerWidth;
            if (clientX > screenWidth / 2) {
                // 右半分をタップ → 次へ
                goNext();
            } else {
                // 左半分をタップ → 前へ
                goPrev();
            }
            return;
        }

        // 縦スワイプが大きい場合は無視
        if (Math.abs(diffY) > Math.abs(diffX)) return;

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

    function goSkip(step) {
        var newIndex = currentIndex + step;
        if (newIndex < 0) newIndex = 0;
        if (newIndex >= totalPages) newIndex = totalPages - 1;
        
        if (newIndex !== currentIndex) {
            var direction = step > 0 ? 'next' : 'prev';
            showImage(newIndex, direction);
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
        // 10枚スキップボタンのイベント設定
        var skipPrevBtn = document.getElementById('skip-prev-btn');
        var skipNextBtn = document.getElementById('skip-next-btn');

        if (skipPrevBtn) {
            // スワイプ等の処理に伝播しないように止める
            skipPrevBtn.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: true });
            skipPrevBtn.addEventListener('touchend', function(e) { e.stopPropagation(); }, { passive: true });
            skipPrevBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                goSkip(-10);
            });
        }

        if (skipNextBtn) {
            skipNextBtn.addEventListener('touchstart', function(e) { e.stopPropagation(); }, { passive: true });
            skipNextBtn.addEventListener('touchend', function(e) { e.stopPropagation(); }, { passive: true });
            skipNextBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                goSkip(10);
            });
        }

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
